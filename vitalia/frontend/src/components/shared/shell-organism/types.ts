/**
 * types.ts — TypeScript types for F1-S3 tenant-switcher shell-organism components.
 * F1-S3 vitalia-fase1-tenant-switcher
 *
 * These types are co-located in shell-organism since they are shared between
 * TenantBadge, TenantOption, TenantSwitcher, AddClinicPlaceholderModal.
 *
 * Mirrors 03-arch.md § 2.2 TypeScript interfaces (camelCase, ISO 8601 datetimes as string).
 * All fields readonly per immutable domain pattern.
 *
 * Named exports (no default export) per FSD-Lite enforce.
 * HIPAA-lite: no-phi-scope — tenant/clinic names are business entities, NOT PHI.
 *
 * downstream-regression-na: brand-local shell-organism types; no cross-brand consumers
 */

/** A clinic/tenant entity accessible to the authenticated user */
export interface Tenant {
  readonly id: string;
  readonly name: string;
  readonly city: string;
}

/** API response shape for GET /api/tenants */
export interface TenantsApiResponse {
  readonly tenants: ReadonlyArray<Tenant>;
}

/** Zustand store state */
export interface TenantStoreState {
  readonly activeTenant: Tenant | null;
  readonly availableTenants: ReadonlyArray<Tenant>;
}

/** Zustand store actions */
export interface TenantStoreActions {
  setActiveTenant: (tenant: Tenant) => void;
  setAvailableTenants: (tenants: ReadonlyArray<Tenant>) => void;
  /** Returns the new active tenant or null if id not found */
  switchTenant: (id: string) => Tenant | null;
  clearStore: () => void;
}

/** Full store shape */
export type TenantStore = TenantStoreState & TenantStoreActions;
