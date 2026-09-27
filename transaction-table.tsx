"use client";
import { formatAzn, formatDate } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

export interface TransactionRow {
  id: string;
  transactionDate: string;
  amount: string | number;
  currency: string;
  description: string | null;
  createdAt: string;
  sourceOrganizationId?: string | null;
  sourceOrganization: { name: string } | null;
  purposeId: string;
  purpose: { name: string };
  createdBy: { fullName: string };
}

export function TransactionTable({
  rows,
  canEdit,
  onEdit,
  onDelete,
}: {
  rows: TransactionRow[];
  canEdit: boolean;
  onEdit: (row: TransactionRow) => void;
  onDelete: (row: TransactionRow) => void;
}) {
  if (rows.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="table-financial w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left text-brand-500">
            <th className="sticky-col bg-surface py-2.5 pr-3 font-medium">Tarix</th>
            <th className="py-2.5 pr-3 font-medium">Mənbə</th>
            <th className="py-2.5 pr-3 font-medium">Təyinat</th>
            <th className="amount py-2.5 pr-3 font-medium">Məbləğ</th>
            <th className="py-2.5 pr-3 font-medium">Açıqlama</th>
            <th className="py-2.5 pr-3 font-medium">Yaradılma tarixi</th>
            <th className="py-2.5 pr-3 font-medium">İstifadəçi</th>
            {canEdit && <th className="py-2.5 pr-3 font-medium">Əməliyyatlar</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-surface-border/70 hover:bg-brand-50/50">
              <td className="sticky-col bg-surface py-2.5 pr-3 whitespace-nowrap">{formatDate(row.transactionDate)}</td>
              <td className="py-2.5 pr-3">{row.sourceOrganization?.name ?? <span className="text-brand-400 italic">— (Overnight)</span>}</td>
              <td className="py-2.5 pr-3">{row.purpose.name}</td>
              <td className="amount py-2.5 pr-3 font-medium">{formatAzn(Number(row.amount))}</td>
              <td className="py-2.5 pr-3 text-brand-500 max-w-xs truncate">{row.description || "—"}</td>
              <td className="py-2.5 pr-3 whitespace-nowrap text-brand-400">{formatDate(row.createdAt)}</td>
              <td className="py-2.5 pr-3 text-brand-500">{row.createdBy.fullName}</td>
              {canEdit && (
                <td className="py-2.5 pr-3">
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(row)} className="text-brand-500 hover:text-brand-700" aria-label="Redaktə et">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => onDelete(row)} className="text-negative/70 hover:text-negative" aria-label="Sil">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
