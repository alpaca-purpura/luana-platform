// cap: shell-organism.shell-nicolify
"use client";
/**
 * useTenantId — returns the UUID tenant_id from Clerk publicMetadata.
 *
 * WHY THIS EXISTS (DoD #37 systemic bug — 2026-06-04):
 *   The URL `[tenantId]` segment is a human-readable SLUG (e.g. "alpaca-purpura"),
 *   not a UUID. The BE expects `X-Tenant-ID` to be the UUID tenant_id.
 *   Using `useParams().tenantId` (slug) as the API tenant header → 422 on every
 *   authenticated request. This hook resolves the UUID from Clerk publicMetadata.
 *
 * Source: `user.publicMetadata.tenant_id` (UUID set by provisioning).
 *   - `useUser()` from @clerk/nextjs always has publicMetadata client-side once loaded.
 *   - NEVER use `useParams().tenantId` (that's the slug — human-readable URL segment).
 *   - NEVER use Clerk Organizations (Luana does NOT use them — ADR, no-clerk-organizations rule).
 *
 * Loading behaviour:
 *   - Returns "" while Clerk is loading (isLoaded=false) — React Query enabled guards
 *     on `tenantId.length > 0` ensure queries stay disabled until the UUID resolves.
 *
 * Named export (NO default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local hook; no cross-brand consumers.
 */

import { useUser } from "@clerk/nextjs";

/**
 * useTenantId — returns the UUID tenant_id from Clerk publicMetadata.
 *
 * Returns "" while Clerk is loading. Callers gate React Query `enabled` on
 * `tenantId.length > 0` to prevent premature fetches.
 *
 * Usage:
 * ```tsx
 * const tenantId = useTenantId();
 * // tenantId is "" until Clerk loads, then the UUID from publicMetadata
 * ```
 */
export function useTenantId(): string {
  const { isLoaded, user } = useUser();
  if (!isLoaded || !user) return "";
  const meta = user.publicMetadata as Record<string, unknown>;
  const id = meta?.tenant_id;
  if (typeof id === "string" && id.length > 0) return id;
  return "";
}
