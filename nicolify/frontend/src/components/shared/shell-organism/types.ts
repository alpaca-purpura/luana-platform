// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-2
/**
 * types.ts — TypeScript types for shell-organism tenant-switcher components.
 * nicolify-r0-shell T-2 — port from vitalia shell-organism/types.ts, re-themed to nicolify.
 *
 * "agencia" replaces "clínica" for Nicolify's B2B agency context.
 *
 * Mirrors 03-arch.md TypeScript interfaces (camelCase, ISO 8601 datetimes as string).
 * All fields readonly per immutable domain pattern.
 *
 * Named exports (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism types; no cross-brand consumers
 */

/** A tenant/agency accessible to the authenticated user */
export interface Tenant {
  readonly id: string;
  readonly name: string;
  readonly city: string;
}

/** API response shape for GET /api/tenants */
export interface TenantsApiResponse {
  readonly tenants: readonly Tenant[];
}

/** Zustand store state */
export interface TenantStoreState {
  readonly activeTenant: Tenant | null;
  readonly availableTenants: readonly Tenant[];
}

/** Zustand store actions */
export interface TenantStoreActions {
  setActiveTenant: (tenant: Tenant) => void;
  setAvailableTenants: (tenants: readonly Tenant[]) => void;
  switchTenant: (tenantId: string) => Tenant | undefined;
}
