/**
 * TenantSwitcherSlot — placeholder atom for TopBarGlobal
 * F1-S2 vitalia-fase1-topbar-global — T-3
 *
 * Returns null until F1-S3 (vitalia-fase1-tenant-switcher) ships the real component.
 * Props declared for forward-compatibility: F1-S3 will replace this file in-place.
 *
 * Server Component (no "use client").
 * Named export (no default export) per FSD-Lite enforce.
 * HIPAA-lite: no-phi-scope — UI shell placeholder, zero PHI.
 *
 * TODO (F1-S3): Replace with real TenantSwitcher implementation.
 *
 * downstream-regression-na: brand-local shell atom; no cross-brand consumers
 */

export interface TenantSwitcherSlotProps {
  /** Current tenant display name — reserved for F1-S3 */
  tenantName?: string;
  /** Additional CSS classes — reserved for F1-S3 */
  className?: string;
}

/**
 * TenantSwitcherSlot — placeholder returns null.
 * F1-S3 will replace this with the real tenant switcher dropdown.
 */
export function TenantSwitcherSlot(_props: TenantSwitcherSlotProps): null {
  return null;
}
