"use client";
import { useEffect, useState } from "react";
import { KpiGrid } from "@/components/kpi/kpi-card";
import { MonthlyMatrixTable } from "@/components/reports/monthly-matrix-table";
import { LoadingState, ErrorState } from "@/components/common/empty-state";
import type { MonthlyMatrixResult } from "@/lib/services/reports";
import type { KpiResult } from "@/lib/services/kpi";
import { Download } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i); // keçmiş illər qorunur, gələcək illər dəstəklənir (bənd 36)

export function ReportPageClient({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description?: string;
}) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [matrix, setMatrix] = useState<MonthlyMatrixResult | null>(null);
  const [kpis, setKpis] = useState<KpiResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${slug}?year=${year}`);
      if (!res.ok) throw new Error("Hesabat yüklənərkən xəta baş verdi.");
      const data = await res.json();
      setMatrix(data.matrix);
      setKpis(data.kpis ?? []);
    } catch (e: any) {
      setError(e.message ?? "Xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, slug]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-brand-900">{title}</h1>
          {description && <p className="text-sm text-brand-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-surface-border px-3 py-2 text-sm bg-white"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <a
            href={`/api/export/${slug}?format=xlsx&year=${year}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
          >
            <Download size={14} /> Excel
          </a>
          <a
            href={`/api/export/${slug}?format=csv&year=${year}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
          >
            <Download size={14} /> CSV
          </a>
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <KpiGrid kpis={kpis} />
          <div className="card p-4">
            {matrix && <MonthlyMatrixTable matrix={matrix} reportSlug={slug} />}
          </div>
        </>
      )}
    </div>
  );
}
