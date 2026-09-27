"use client";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/common/empty-state";

interface Org {
  id: string;
  name: string;
  type: string;
  active: boolean;
  parent: { name: string } | null;
}
interface Purpose {
  id: string;
  name: string;
  code: string;
  active: boolean;
  allowsEmptySource: boolean;
}

export default function SettingsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/organizations").then((r) => r.json()),
      fetch("/api/purposes").then((r) => r.json()),
    ]).then(([o, p]) => {
      setOrgs(o.organizations ?? []);
      setPurposes(p.purposes ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-brand-900">Ayarlar</h1>
        <p className="text-sm text-brand-500 mt-0.5">
          Master data idarəsi. Bu bölmə yalnız administrator roluna açıqdır (bənd 38). Redaktə formaları gələcək
          fazada əlavə olunacaq — hazırda master data seed script vasitəsilə idarə olunur.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-brand-900 mb-3">Təşkilatlar ({orgs.length})</h2>
          <div className="max-h-96 overflow-y-auto text-sm divide-y divide-surface-border">
            {orgs.map((o) => (
              <div key={o.id} className="py-2 flex justify-between items-center">
                <div>
                  <div className="text-brand-900">{o.name}</div>
                  {o.parent && <div className="text-xs text-brand-400">{o.parent.name} › Alt təşkilat</div>}
                </div>
                <span className={`text-xs rounded-full px-2 py-0.5 ${o.active ? "bg-positive/10 text-positive" : "bg-brand-100 text-brand-500"}`}>
                  {o.active ? "Aktiv" : "Deaktiv"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-brand-900 mb-3">Təyinatlar ({purposes.length})</h2>
          <div className="divide-y divide-surface-border text-sm">
            {purposes.map((p) => (
              <div key={p.id} className="py-2 flex justify-between items-center">
                <div>
                  <div className="text-brand-900">{p.name}</div>
                  <div className="text-xs text-brand-400">{p.code}</div>
                </div>
                {p.allowsEmptySource && (
                  <span className="text-xs rounded-full px-2 py-0.5 bg-brand-100 text-brand-700">Boş mənbəyə icazə verir</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
