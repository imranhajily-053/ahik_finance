"use client";
import { useState } from "react";
import { formatAzn } from "@/lib/format";
import { AZ_MONTHS } from "@/lib/services/reports";
import { EmptyState } from "@/components/common/empty-state";
import { DrillDownModal } from "@/components/reports/drill-down-modal";
import type { MonthlyMatrixResult } from "@/lib/services/reports";

export function MonthlyMatrixTable({
  matrix,
  reportSlug,
  onRowClick,
}: {
  matrix: MonthlyMatrixResult;
  reportSlug: string;
  /** Prezident Administrasiyası sətri üçün: konsolidasiya edilmiş sətrə klik detail/breakdown açır (bənd 12). */
  onRowClick?: (row: MonthlyMatrixResult["rows"][number]) => void;
}) {
  const [drillDown, setDrillDown] = useState<{ organizationId: string | null; organizationName: string; month: number } | null>(null);

  if (matrix.rows.length === 0) return <EmptyState />;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table-financial w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-brand-500">
              <th className="sticky-col bg-surface py-2.5 pr-3 font-medium min-w-[220px]">Təşkilat</th>
              {AZ_MONTHS.map((m) => (
                <th key={m} className="amount py-2.5 px-2 font-medium whitespace-nowrap">
                  {m.slice(0, 3)}
                </th>
              ))}
              <th className="amount py-2.5 pl-3 font-medium">CƏMİ</th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <tr
                key={row.organizationId ?? "overnight"}
                className="border-b border-surface-border/70 hover:bg-brand-50/50"
              >
                <td
                  className={`sticky-col bg-surface py-2 pr-3 ${row.isConsolidatedParent ? "font-semibold text-brand-900 cursor-pointer" : ""}`}
                  onClick={() => row.isConsolidatedParent && onRowClick?.(row)}
                >
                  {row.organizationName}
                  {row.isConsolidatedParent && <span className="ml-1 text-xs text-brand-400">(konsolidə, klik → detal)</span>}
                </td>
                {row.monthly.map((v, i) => (
                  <td
                    key={i}
                    className={`amount py-2 px-2 ${v > 0 ? "cursor-pointer hover:underline" : "text-brand-300"}`}
                    onClick={() =>
                      v > 0 &&
                      setDrillDown({ organizationId: row.organizationId, organizationName: row.organizationName, month: i })
                    }
                  >
                    {v > 0 ? formatAzn(v) : "—"}
                  </td>
                ))}
                <td className="amount py-2 pl-3 font-semibold">{formatAzn(row.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-brand-200 font-semibold text-brand-900">
              <td className="sticky-col bg-surface py-2.5 pr-3">CƏMİ</td>
              {matrix.monthlyTotals.map((v, i) => (
                <td key={i} className="amount py-2.5 px-2">
                  {v > 0 ? formatAzn(v) : "—"}
                </td>
              ))}
              <td className="amount py-2.5 pl-3">{formatAzn(matrix.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {drillDown && (
        <DrillDownModal
          reportSlug={reportSlug}
          organizationId={drillDown.organizationId}
          organizationName={drillDown.organizationName}
          year={matrix.year}
          month={drillDown.month}
          onClose={() => setDrillDown(null)}
        />
      )}
    </>
  );
}
