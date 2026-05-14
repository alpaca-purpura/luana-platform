/**
 * Format Monthly Recurring Revenue with compact notation.
 * Uses Intl.NumberFormat — locale-aware, no hardcoded currency symbol.
 */
export function formatMrr(amount: number, currency = "USD"): string {
  if (amount >= 1_000_000) {
    return new Intl.NumberFormat("es-419", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  if (amount >= 1_000) {
    return new Intl.NumberFormat("es-419", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat("es-419", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMrrDelta(current: number, previous: number): string {
  if (previous === 0) return "+∞";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
