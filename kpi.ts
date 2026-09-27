import { prisma } from "@/lib/prisma";
import { Prisma, TransactionStatus } from "@prisma/client";

/** Bənd 58 — hər KPI bu formada qaytarılır ki, yeni KPI əlavə etmək asan olsun. */
export interface KpiResult {
  key: string;
  name: string;
  value: number;
  unit: "AZN" | "count" | "%";
  period: { from: Date; to: Date };
  previousValue?: number;
  changeAbsolute?: number;
  changePct?: number | null; // null = əvvəlki dövr üçün məlumat yoxdur (bənd 20: saxta nəticə göstərmə)
  meta?: Record<string, unknown>;
}

function toNumber(d: Prisma.Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

async function sumAmount(where: Prisma.IncomeTransactionWhereInput): Promise<number> {
  const result = await prisma.incomeTransaction.aggregate({
    where: { ...where, status: TransactionStatus.ACTIVE, deletedAt: null },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}

async function countDistinctActiveOrganizations(where: Prisma.IncomeTransactionWhereInput): Promise<number> {
  const rows = await prisma.incomeTransaction.findMany({
    where: { ...where, status: TransactionStatus.ACTIVE, deletedAt: null, sourceOrganizationId: { not: null } },
    select: { sourceOrganizationId: true },
    distinct: ["sourceOrganizationId"],
  });
  return rows.length;
}

/**
 * Bənd 20 — Current vs Previous Period. Əvvəlki dövr eyni uzunluqda, dərhal
 * öncəki interval kimi hesablanır. Məlumat yoxdursa (previousValue === 0 VƏ
 * previous period-da HEÇ bir aktiv transaction yoxdursa) `changePct` null
 * qaytarılır — 0% kimi yalançı nəticə göstərilmir.
 */
function computeChange(current: number, previous: number, previousHadAnyData: boolean) {
  const changeAbsolute = current - previous;
  const changePct = previousHadAnyData && previous !== 0 ? (changeAbsolute / previous) * 100 : previousHadAnyData ? null : null;
  return { changeAbsolute, changePct };
}

export interface DashboardFilters {
  dateFrom: Date;
  dateTo: Date;
  organizationId?: string;
  organizationIdsIncludingChildren?: string[];
}

function previousPeriod(from: Date, to: Date): { from: Date; to: Date } {
  const durationMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: prevFrom, to: prevTo };
}

/** Bənd 17 — Dashboard-un 8 əsas KPI kartı. */
export async function getDashboardKpis(filters: DashboardFilters): Promise<KpiResult[]> {
  const { dateFrom, dateTo } = filters;
  const prev = previousPeriod(dateFrom, dateTo);

  const orgWhere = filters.organizationIdsIncludingChildren
    ? { sourceOrganizationId: { in: filters.organizationIdsIncludingChildren } }
    : filters.organizationId
    ? { sourceOrganizationId: filters.organizationId }
    : {};

  const baseWhere = { transactionDate: { gte: dateFrom, lte: dateTo }, ...orgWhere };
  const prevWhere = { transactionDate: { gte: prev.from, lte: prev.to }, ...orgWhere };

  const [
    total,
    prevTotal,
    membershipTotal,
    sanatoriumTotal,
    debtTotal,
    culturalTotal,
    overnightTotal,
    activeOrgs,
  ] = await Promise.all([
    sumAmount(baseWhere),
    sumAmount(prevWhere),
    sumAmount({ ...baseWhere, purpose: { code: "MEMBERSHIP_FEE" } }),
    sumAmount({ ...baseWhere, purpose: { code: "SANATORIUM_AID" } }),
    sumAmount({ ...baseWhere, purpose: { code: "DEBT_REPAYMENT" } }),
    sumAmount({ ...baseWhere, purpose: { code: "CULTURAL_EVENTS" } }),
    sumAmount({ ...baseWhere, purpose: { code: "OVERNIGHT" } }),
    countDistinctActiveOrganizations(baseWhere),
  ]);

  const prevHadData = prevTotal > 0;
  const { changeAbsolute, changePct } = computeChange(total, prevTotal, prevHadData);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const currentMonthTotal = await sumAmount({ transactionDate: { gte: monthStart, lte: monthEnd }, ...orgWhere });

  return [
    { key: "total", name: "Ümumi daxilolmalar", value: total, unit: "AZN", period: { from: dateFrom, to: dateTo }, previousValue: prevTotal, changeAbsolute, changePct },
    { key: "current_month", name: "Cari ay daxilolmaları", value: currentMonthTotal, unit: "AZN", period: { from: monthStart, to: monthEnd } },
    { key: "membership_fees", name: "Üzvlük haqları", value: membershipTotal, unit: "AZN", period: { from: dateFrom, to: dateTo }, meta: { sharePct: total ? (membershipTotal / total) * 100 : 0 } },
    { key: "sanatorium", name: "Sanatoriya üzrə daxilolmalar", value: sanatoriumTotal, unit: "AZN", period: { from: dateFrom, to: dateTo }, meta: { sharePct: total ? (sanatoriumTotal / total) * 100 : 0 } },
    { key: "debt", name: "Borc ödənişləri", value: debtTotal, unit: "AZN", period: { from: dateFrom, to: dateTo }, meta: { sharePct: total ? (debtTotal / total) * 100 : 0 } },
    { key: "cultural", name: "Mədəni-kütləvi daxilolmalar", value: culturalTotal, unit: "AZN", period: { from: dateFrom, to: dateTo }, meta: { sharePct: total ? (culturalTotal / total) * 100 : 0 } },
    { key: "overnight", name: "Overnight daxilolmaları", value: overnightTotal, unit: "AZN", period: { from: dateFrom, to: dateTo }, meta: { sharePct: total ? (overnightTotal / total) * 100 : 0 } },
    { key: "active_orgs", name: "Aktiv ödəyən təşkilatların sayı", value: activeOrgs, unit: "count", period: { from: dateFrom, to: dateTo } },
  ];
}

/** Bənd 19 — hesabat-spesifik KPI dəsti (Total/Current/Previous/Change/YTD/Avg/Max/Min/Share). */
export async function getReportKpis(params: {
  purposeCode?: string;
  sourceOnlyNull?: boolean; // Overnight üçün
  year: number;
}): Promise<KpiResult[]> {
  const purpose = params.purposeCode
    ? await prisma.purpose.findUnique({ where: { code: params.purposeCode } })
    : null;

  const yearStart = new Date(params.year, 0, 1);
  const yearEnd = new Date(params.year, 11, 31, 23, 59, 59);
  const now = new Date();
  const isCurrentYear = now.getFullYear() === params.year;
  const ytdEnd = isCurrentYear ? now : yearEnd;

  const where: Prisma.IncomeTransactionWhereInput = {
    ...(purpose && { purposeId: purpose.id }),
    ...(params.sourceOnlyNull && { sourceOrganizationId: null }),
  };

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [yearTotal, ytdTotal, currentMonth, previousMonth, activeOrgs, monthlyBreakdown] = await Promise.all([
    sumAmount({ ...where, transactionDate: { gte: yearStart, lte: yearEnd } }),
    sumAmount({ ...where, transactionDate: { gte: yearStart, lte: ytdEnd } }),
    sumAmount({ ...where, transactionDate: { gte: monthStart, lte: monthEnd } }),
    sumAmount({ ...where, transactionDate: { gte: prevMonthStart, lte: prevMonthEnd } }),
    params.sourceOnlyNull ? Promise.resolve(0) : countDistinctActiveOrganizations({ ...where, transactionDate: { gte: yearStart, lte: yearEnd } }),
    getMonthlyTotalsForYear(where, params.year),
  ]);

  const nonZeroMonths = monthlyBreakdown.filter((v) => v > 0);
  const avg = nonZeroMonths.length ? yearTotal / nonZeroMonths.length : 0;
  const max = Math.max(0, ...monthlyBreakdown);
  const min = nonZeroMonths.length ? Math.min(...nonZeroMonths) : 0;

  const { changeAbsolute, changePct } = computeChange(currentMonth, previousMonth, previousMonth > 0);

  const results: KpiResult[] = [
    { key: "total", name: "Cəmi (il)", value: yearTotal, unit: "AZN", period: { from: yearStart, to: yearEnd } },
    { key: "ytd", name: "İldən bu günə (YTD)", value: ytdTotal, unit: "AZN", period: { from: yearStart, to: ytdEnd } },
    { key: "current_month", name: "Cari ay", value: currentMonth, unit: "AZN", period: { from: monthStart, to: monthEnd }, previousValue: previousMonth, changeAbsolute, changePct },
    { key: "monthly_avg", name: "Aylıq orta", value: avg, unit: "AZN", period: { from: yearStart, to: yearEnd } },
    { key: "max_month", name: "Maksimum ay", value: max, unit: "AZN", period: { from: yearStart, to: yearEnd } },
    { key: "min_month", name: "Minimum ay (aktiv aylar üzrə)", value: min, unit: "AZN", period: { from: yearStart, to: yearEnd } },
  ];

  if (!params.sourceOnlyNull) {
    results.push({ key: "active_orgs", name: "Aktiv təşkilatların sayı", value: activeOrgs, unit: "count", period: { from: yearStart, to: yearEnd } });
  }

  return results;
}

async function getMonthlyTotalsForYear(where: Prisma.IncomeTransactionWhereInput, year: number): Promise<number[]> {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);
  const rows = await prisma.incomeTransaction.findMany({
    where: { ...where, status: TransactionStatus.ACTIVE, deletedAt: null, transactionDate: { gte: start, lte: end } },
    select: { amount: true, transactionDate: true },
  });
  const monthly = Array(12).fill(0);
  rows.forEach((r) => (monthly[r.transactionDate.getMonth()] += toNumber(r.amount)));
  return monthly;
}
