const ROLE_LABEL: Record<string, string> = {
  EXECUTIVE: "İcraçı",
  READER: "Rəhbər (Reader)",
  ADMIN: "Administrator",
};

export function Topbar({ fullName, role }: { fullName: string; role: string }) {
  return (
    <header className="flex items-center justify-between border-b border-surface-border bg-surface px-6 py-4">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-brand-900">{fullName}</div>
          <div className="text-xs text-brand-500">{ROLE_LABEL[role] ?? role}</div>
        </div>
        <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
          {fullName?.[0] ?? "?"}
        </div>
      </div>
    </header>
  );
}
