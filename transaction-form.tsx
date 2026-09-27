"use client";
import { useMemo, useState } from "react";
import { OrganizationCombobox } from "@/components/organizations/organization-combobox";
import { PurposeSelect, usePurposes } from "@/components/transactions/purpose-select";

export interface TransactionFormValue {
  transactionDate: string;
  source: { id: string; name: string } | null;
  purposeId: string;
  amount: string;
  currency: "AZN" | "USD" | "EUR" | "RUB";
  description: string;
}

const EMPTY: TransactionFormValue = {
  transactionDate: new Date().toISOString().slice(0, 10),
  source: null,
  purposeId: "",
  amount: "",
  currency: "AZN",
  description: "",
};

export function TransactionForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  serverError,
}: {
  initial?: Partial<TransactionFormValue>;
  onSubmit: (value: TransactionFormValue) => void;
  onCancel: () => void;
  submitting?: boolean;
  serverError?: string | null;
}) {
  const { purposes } = usePurposes();
  const [value, setValue] = useState<TransactionFormValue>({ ...EMPTY, ...initial });

  const selectedPurpose = purposes.find((p) => p.id === value.purposeId);
  const sourceRequired = selectedPurpose ? !selectedPurpose.allowsEmptySource : true;

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!value.transactionDate) errors.push("Tarix seçilməlidir.");
    if (!value.purposeId) errors.push("Təyinat seçilmədən əməliyyat yadda saxlanıla bilməz.");
    if (sourceRequired && !value.source) errors.push("Bu təyinat üçün mənbə mütləqdir (yalnız Overnight sazişi üçün boş buraxıla bilər).");
    const amountNum = Number(value.amount);
    if (!value.amount || Number.isNaN(amountNum) || amountNum <= 0) errors.push("Məbləğ mənfi və ya sıfır ola bilməz.");
    return errors;
  }, [value, sourceRequired]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Tarix</label>
          <input
            type="date"
            value={value.transactionDate}
            onChange={(e) => setValue((v) => ({ ...v, transactionDate: e.target.value }))}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Məbləğ</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step="0.01"
              value={value.amount}
              onChange={(e) => setValue((v) => ({ ...v, amount: e.target.value }))}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
              placeholder="0.00"
            />
            <select
              value={value.currency}
              onChange={(e) => setValue((v) => ({ ...v, currency: e.target.value as any }))}
              className="rounded-lg border border-surface-border px-2 py-2 text-sm bg-white"
            >
              <option value="AZN">AZN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="RUB">RUB</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-700 mb-1">Təyinat</label>
        <PurposeSelect purposes={purposes} value={value.purposeId} onChange={(id) => setValue((v) => ({ ...v, purposeId: id }))} />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-700 mb-1">
          Mənbə {sourceRequired ? <span className="text-negative">*</span> : <span className="text-brand-400">(bu təyinat üçün könüllüdür)</span>}
        </label>
        <OrganizationCombobox value={value.source} onChange={(org) => setValue((v) => ({ ...v, source: org }))} allowEmpty={!sourceRequired} />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-700 mb-1">Açıqlama (könüllü)</label>
        <textarea
          value={value.description}
          onChange={(e) => setValue((v) => ({ ...v, description: e.target.value }))}
          rows={2}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
        />
      </div>

      {validation.length > 0 && (
        <ul className="text-xs text-negative list-disc pl-4 space-y-0.5">
          {validation.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {serverError && <p className="text-sm text-negative">{serverError}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} type="button" className="rounded-lg px-4 py-2 text-sm text-brand-600 hover:bg-brand-50">
          Ləğv et
        </button>
        <button
          type="button"
          disabled={validation.length > 0 || submitting}
          onClick={() => onSubmit(value)}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Yadda saxlanılır..." : "Yadda saxla"}
        </button>
      </div>
    </div>
  );
}
