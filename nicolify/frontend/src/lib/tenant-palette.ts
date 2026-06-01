// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-2
/**
 * tenant-palette.ts — deterministic color palette for agency badges.
 * nicolify-r0-shell T-2 — port from vitalia tenant-palette.ts, re-themed to nicolify.
 *
 * Maps a tenantId string to one of 6 accessible Tailwind color pairs via
 * a simple charCode sum hash. The mapping is deterministic and stable
 * cross-session (same id → same color every time).
 *
 * Nicolify uses indigo/purple/blue/green/rose/amber palette for agency badges.
 *
 * Contrast compliance (WCAG AA 4.5:1):
 * - amber-500 on white → fails → use text-amber-950
 * - All other entries use text-white (passes ≥4.5:1 on those BGs)
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local lib; no cross-brand consumers
 */

export interface PaletteColor {
  /** Tailwind background class */
  readonly bg: string;
  /** Tailwind text class — WCAG AA compliant with bg */
  readonly text: string;
}

/**
 * 6-entry color palette for agency badges.
 * Nicolify palette: indigo / purple / blue / green / rose / amber.
 * Shrink-only: do NOT reorder entries (would break existing tenant→color mapping).
 */
export const PALETTE = [
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-amber-950" },
] as const satisfies readonly PaletteColor[];

/**
 * Deterministically picks a palette color for a given tenantId.
 *
 * Algorithm: sum of charCodes modulo PALETTE.length.
 * Stable across sessions — same tenantId always maps to same index.
 *
 * @param tenantId - The tenant identifier string
 * @returns A PaletteColor entry from PALETTE
 */
export function pickPaletteColor(tenantId: string): PaletteColor {
  if (!tenantId) return PALETTE[0];
  const hash = tenantId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const index = hash % PALETTE.length;
  return PALETTE[index];
}
