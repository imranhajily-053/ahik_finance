import { formatAzn } from "@/lib/format";
import type { KpiResult } from "@/lib/services/kpi";
import { prisma } from "@/lib/prisma";
import { TransactionStatus } from "@prisma/client";

/**
 * Bənd 40 — bu funksiya YALNIZ artıq hesablanmış KPI/aggregation nəticələrini
 * cümlələrə çevirir. Heç bir ədəd burada "uydurulmur"; girişdəki `kpis` və
 * `topOrganization` arqumentləri birbaşa DB sorğularının nəticəsidir.
 */
export function buildDashboardSummary(params: {
  kpis: KpiResult[];
  topOrganizationName: string | null;
  activeOrganizationCount: number;
}): string[] {
  const total = params.kpis.find((k) => k.key === "total");
  const membership = params.kpis.find((k) => k.key === "membership_fees");

  const lines: string[] = [];

  if (total) {
    lines.push(`Seçilmiş dövrdə ümumi daxilolma ${formatAzn(total.value)} olmuşdur.`);
  }
  if (membership && total && total.value > 0) {
    const pct = ((membership.value / total.value) * 100).toFixed(1);
    lines.push(`Üzvlük haqları ümumi daxilolmaların ${pct}%-ni təşkil etmişdir.`);
  }
  lines.push(
    `Seçilmiş dövrdə ${params.activeOrganizationCount} təşkilatdan daxilolma qeydə alınmışdır.`
  );
  if (params.topOrganizationName) {
    lines.push(`Ən yüksək daxilolma mənbəyi ${params.topOrganizationName} olmuşdur.`);
  }

  return lines;
}

export async function getTopOrganizationName(dateFrom: Date, dateTo: Date): Promise<string | null> {
  const grouped = await prisma.incomeTransaction.groupBy({
    by: ["sourceOrganizationId"],
    where: {
      status: TransactionStatus.ACTIVE,
      deletedAt: null,
      sourceOrganizationId: { not: null },
      transactionDate: { gte: dateFrom, lte: dateTo },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 1,
  });

  if (!grouped.length || !grouped[0].sourceOrganizationId) return null;
  const org = await prisma.organization.findUnique({ where: { id: grouped[0].sourceOrganizationId } });
  return org?.name ?? null;
}
