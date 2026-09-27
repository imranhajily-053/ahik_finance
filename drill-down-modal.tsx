"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { formatAzn, formatDate } from "@/lib/format";
import { AZ_MONTHS } from "@/lib/services/reports";
import { LoadingState, EmptyState } from "@/components/common/empty-state";

interface DrillDownTx {
  id: string;
  transactionDate: string;
  amount: string;
  description: string | null;
  sourceOrganization: { name: string } | null;
  purpose: { name: string };
  createdBy: { fullName: string };
}

export function DrillDownModal({
  reportSlug,
  organizationId,
  organizationName,
  year,
  month,
  onClose,
}: {
  reportSlug: string;
  organizationId: string | null;
  organizationName: string;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DrillDownTx[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({
      report: reportSlug,
      year: String(year),
      month: String(month),
      ...(organizationId ? { organizationId } : {}),
    });
    fetch(`/api/reports/drill-down?${params}`)
      .then((r) => r.json())
      .then((d) => setRows(d.transactions ?? []))
      .finally(() => setLoading(false));
  }, [reportSlug, organizationId, year, month]);

  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <Modal open onClose={onClose} title={`${organizationName} — ${AZ_MONTHS[month]} ${year}`} wide>
      {loading && <LoadingState />}
      {!loading && rows.length === 0 && <EmptyState />}
      {!loading && rows.length > 0 && (
        <>
          <div className="mb-3 text-sm text-brand-500">
            {rows.length} əməliyyat · Cəmi: <span className="font-semibold text-brand-900">{formatAzn(total)}</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-brand-500">
                  <th className="py-2 pr-3 font-medium">Tarix</th>
                  <th className="py-2 pr-3 font-medium">Mənbə</th>
                  <th className="amount py-2 pr-3 font-medium">Məbləğ</th>
                  <th className="py-2 pr-3 font-medium">Açıqlama</th>
                  <th className="py-2 pr-3 font-medium">İstifadəçi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-surface-border/70">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(r.transactionDate)}</td>
                    <td className="py-2 pr-3">{r.sourceOrganization?.name ?? "—"}</td>
                    <td className="amount py-2 pr-3 font-medium">{formatAzn(Number(r.amount))}</td>
                    <td className="py-2 pr-3 text-brand-500">{r.description || "—"}</td>
                    <td className="py-2 pr-3 text-brand-500">{r.createdBy.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}
