import { formatAzn, formatNumber, formatPercent } from "@/lib/format";
import type { KpiResult } from "@/lib/services/kpi";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function KpiCard({ kpi }: { kpi: KpiResult }) {
  const displayValue = kpi.unit === "AZN" ? formatAzn(kpi.value) : formatNumber(kpi.value);
  const hasChange = kpi.changePct !== undefined && kpi.changePct !== null;
  const isPositive = (kpi.changePct ?? 0) >= 0;

  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-brand-500">{kpi.name}</div>
      <div className="mt-1.5 text-xl font-semibold text-brand-900 tabular-nums">{displayValue}</div>

      {hasChange && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
            isPositive ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
          )}
        >
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {formatPercent(kpi.changePct)}
          <span className="text-brand-400 font-normal">əvvəlki dövrə görə</span>
        </div>
      )}

      {!hasChange && kpi.previousValue !== undefined && (
        <div className="mt-2 text-xs text-brand-400">Müqayisə üçün əvvəlki dövr məlumatı yoxdur</div>
      )}

      {kpi.meta?.sharePct !== undefined && (
        <div className="mt-1 text-xs text-brand-400">
          Ümumidən: {(kpi.meta.sharePct as number).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export function KpiGrid({ kpis }: { kpis: KpiResult[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.key} kpi={kpi} />
      ))}
    </div>
  );
}
