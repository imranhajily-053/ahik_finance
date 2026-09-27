"use client";
import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";

export interface OrgSearchResult {
  id: string;
  name: string;
  shortName: string | null;
  type: string;
  parentName: string | null;
}

export function OrganizationCombobox({
  value,
  onChange,
  placeholder = "Təşkilat axtarın... (məs. İstisu, Gənclik, Marxal)",
  allowEmpty = false,
}: {
  value: { id: string; name: string } | null;
  onChange: (org: { id: string; name: string } | null) => void;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrgSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/organizations/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 200); // sürətli axtarış üçün qısa debounce (bənd 7)
    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-lg border border-surface-border px-3 py-2 text-sm text-left bg-white"
      >
        <span className={value ? "text-brand-900" : "text-brand-400"}>
          {value ? value.name : allowEmpty ? "Mənbə seçilməyib (yalnız Overnight üçün icazəlidir)" : "Mənbə seçin"}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              size={14}
              className="text-brand-400 hover:text-brand-700"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          )}
          <ChevronDown size={14} className="text-brand-400" />
        </div>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-surface-border bg-white shadow-card max-h-80 overflow-y-auto">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border">
            <Search size={14} className="text-brand-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full text-sm outline-none"
            />
          </div>

          {loading && <div className="px-3 py-3 text-xs text-brand-400">Axtarılır...</div>}
          {!loading && results.length === 0 && (
            <div className="px-3 py-3 text-xs text-brand-400">Nəticə tapılmadı</div>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onChange({ id: r.id, name: r.name });
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 flex flex-col"
              >
                <span className="text-brand-900">{r.name}</span>
                {r.parentName && <span className="text-xs text-brand-400">{r.parentName} › Alt təşkilat</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
