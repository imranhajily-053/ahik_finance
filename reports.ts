import { prisma } from "@/lib/prisma";
import { Prisma, TransactionStatus } from "@prisma/client";
import { resolveOrganizationIdsIncludingChildren } from "@/lib/services/organizations";

export const AZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

export interface MatrixRow {
  organizationId: string | null;
  organizationName: string;
  isConsolidatedParent?: boolean;
  monthly: number[]; // 12 dəyər, index 0 = Yanvar
  total: number;
}

export interface MonthlyMatrixResult {
  year: number;
  rows: MatrixRow[];
  monthlyTotals: number[];
  grandTotal: number;
}

function toNumber(d: Prisma.Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

/**
 * Bənd 11/13/14/15 — Purpose kodu üzrə Təşkilat × Ay × Cəmi matrisi.
 * Bənd 12/55 — Prezident Administrasiyası sətri öz + BÜTÜN alt təşkilatlarının
 * cəmi kimi konsolidasiya olunur (bir sətirdə), amma alt təşkilatlar ayrıca
 * `getPresidentAdministrationBreakdown`-da görünməyə davam edir (detail).
 */
export async function getMonthlyMatrixByPurposeCode(
  purposeCode: string,
  year: number
): Promise<MonthlyMatrixResult> {
  const purpose = await prisma.purpose.findUnique({ where: { code: purposeCode } });
  if (!purpose) return { year, rows: [], monthlyTotals: Array(12).fill(0), grandTotal: 0 };

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const transactions = await prisma.incomeTransaction.findMany({
    where: {
      status: TransactionStatus.ACTIVE,
      deletedAt: null,
      purposeId: purpose.id,
      transactionDate: { gte: start, lte: end },
    },
    select: {
      amount: true,
      transactionDate: true,
      sourceOrganizationId: true,
      sourceOrganization: { select: { id: true, name: true, parentId: true, type: true } },
    },
  });

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true, parentId: true } });
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  // Alt təşkilatların cəmini parent-ə (Prezident Administrasiyası) köçürmək üçün
  // effektiv "reporting organization id" tapırıq.
  function effectiveOrgId(orgId: string | null): string | null {
    if (!orgId) return null;
    const org = orgById.get(orgId);
    if (org?.parentId) return org.parentId; // consolidate into parent row
    return orgId;
  }

  const byOrg = new Map<string, number[]>(); // orgId -> 12 aylıq array
  for (const tx of transactions) {
    const effId = effectiveOrgId(tx.sourceOrganizationId);
    if (!effId) continue;
    const monthIdx = tx.transactionDate.getMonth();
    if (!byOrg.has(effId)) byOrg.set(effId, Array(12).fill(0));
    byOrg.get(effId)![monthIdx] += toNumber(tx.amount);
  }

  const rows: MatrixRow[] = [];
  for (const [orgId, monthly] of byOrg.entries()) {
    const org = orgById.get(orgId);
    rows.push({
      organizationId: orgId,
      organizationName: org?.name ?? "Naməlum təşkilat",
      isConsolidatedParent: org ? orgs.some((o) => o.parentId === org.id) : false,
      monthly,
      total: monthly.reduce((a, b) => a + b, 0),
    });
  }

  rows.sort((a, b) => b.total - a.total);

  const monthlyTotals = Array(12).fill(0);
  rows.forEach((r) => r.monthly.forEach((v, i) => (monthlyTotals[i] += v)));
  const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0);

  return { year, rows, monthlyTotals, grandTotal };
}

/**
 * Bənd 16 — Overnight hesabatı: source = NULL, purpose = Overnight sazişi.
 * Ayrıca funksiya çünki bu, "Təşkilat × Ay" strukturuna uymur (mənbə yoxdur) —
 * burada tək sətir "Overnight" kimi, ay üzrə bölünür.
 */
export async function getOvernightMonthlyMatrix(year: number): Promise<MonthlyMatrixResult> {
  const purpose = await prisma.purpose.findUnique({ where: { code: "OVERNIGHT" } });
  if (!purpose) return { year, rows: [], monthlyTotals: Array(12).fill(0), grandTotal: 0 };

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const transactions = await prisma.incomeTransaction.findMany({
    where: {
      status: TransactionStatus.ACTIVE,
      deletedAt: null,
      purposeId: purpose.id,
      sourceOrganizationId: null,
      transactionDate: { gte: start, lte: end },
    },
    select: { amount: true, transactionDate: true },
  });

  const monthly = Array(12).fill(0);
  for (const tx of transactions) {
    monthly[tx.transactionDate.getMonth()] += toNumber(tx.amount);
  }
  const total = monthly.reduce((a, b) => a + b, 0);

  return {
    year,
    rows: [{ organizationId: null, organizationName: "Overnight sazişləri", monthly, total }],
    monthlyTotals: monthly,
    grandTotal: total,
  };
}

/**
 * Bənd 12 — Prezident Administrasiyasının alt təşkilatları üzrə DETAIL cədvəl
 * (konsolidasiya edilmədən, hər alt təşkilat öz sətrində).
 */
export async function getPresidentAdministrationBreakdown(
  purposeCode: string,
  year: number
): Promise<MonthlyMatrixResult> {
  const purpose = await prisma.purpose.findUnique({ where: { code: purposeCode } });
  const parent = await prisma.organization.findFirst({ where: { type: "PRESIDENT_ADMINISTRATION" } });
  if (!purpose || !parent) return { year, rows: [], monthlyTotals: Array(12).fill(0), grandTotal: 0 };

  const subOrgIds = await resolveOrganizationIdsIncludingChildren(parent.id);
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const transactions = await prisma.incomeTransaction.findMany({
    where: {
      status: TransactionStatus.ACTIVE,
      deletedAt: null,
      purposeId: purpose.id,
      sourceOrganizationId: { in: subOrgIds },
      transactionDate: { gte: start, lte: end },
    },
    select: { amount: true, transactionDate: true, sourceOrganizationId: true, sourceOrganization: { select: { name: true } } },
  });

  const byOrg = new Map<string, { name: string; monthly: number[] }>();
  for (const tx of transactions) {
    const id = tx.sourceOrganizationId!;
    if (!byOrg.has(id)) byOrg.set(id, { name: tx.sourceOrganization!.name, monthly: Array(12).fill(0) });
    byOrg.get(id)!.monthly[tx.transactionDate.getMonth()] += toNumber(tx.amount);
  }

  const rows: MatrixRow[] = Array.from(byOrg.entries()).map(([id, v]) => ({
    organizationId: id,
    organizationName: v.name,
    monthly: v.monthly,
    total: v.monthly.reduce((a, b) => a + b, 0),
  }));
  rows.sort((a, b) => b.total - a.total);

  const monthlyTotals = Array(12).fill(0);
  rows.forEach((r) => r.monthly.forEach((v, i) => (monthlyTotals[i] += v)));

  return { year, rows, monthlyTotals, grandTotal: monthlyTotals.reduce((a, b) => a + b, 0) };
}

/** Bənd 22 — Drill-down: bir hüceyrəni (təşkilat + ay + təyinat) yaradan transaction siyahısı. */
export async function getDrillDownTransactions(params: {
  purposeCode?: string;
  organizationId?: string | null;
  year: number;
  month: number; // 0-11
}) {
  const purpose = params.purposeCode
    ? await prisma.purpose.findUnique({ where: { code: params.purposeCode } })
    : null;

  const start = new Date(params.year, params.month, 1);
  const end = new Date(params.year, params.month + 1, 0, 23, 59, 59);

  let organizationIds: string[] | undefined;
  if (params.organizationId) {
    organizationIds = await resolveOrganizationIdsIncludingChildren(params.organizationId);
  }

  return prisma.incomeTransaction.findMany({
    where: {
      status: TransactionStatus.ACTIVE,
      deletedAt: null,
      ...(purpose && { purposeId: purpose.id }),
      ...(organizationIds
        ? { sourceOrganizationId: { in: organizationIds } }
        : params.organizationId === null
        ? { sourceOrganizationId: null }
        : {}),
      transactionDate: { gte: start, lte: end },
    },
    include: { sourceOrganization: true, purpose: true, createdBy: true },
    orderBy: { transactionDate: "desc" },
  });
}
