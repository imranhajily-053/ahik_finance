export function formatAzn(value: number): string {
  const formatted = new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} AZN`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("az-AZ").format(value);
}

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
