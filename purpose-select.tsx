"use client";
import { useEffect, useState } from "react";

export interface PurposeOption {
  id: string;
  name: string;
  code: string;
  allowsEmptySource: boolean;
}

export function usePurposes() {
  const [purposes, setPurposes] = useState<PurposeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purposes")
      .then((r) => r.json())
      .then((d) => setPurposes(d.purposes ?? []))
      .finally(() => setLoading(false));
  }, []);

  return { purposes, loading };
}

export function PurposeSelect({
  purposes,
  value,
  onChange,
}: {
  purposes: PurposeOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm bg-white"
    >
      <option value="">Təyinat seçin</option>
      {purposes.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
