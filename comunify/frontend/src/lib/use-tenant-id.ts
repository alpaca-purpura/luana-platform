"use client";

import { useOrganization, useUser } from "@clerk/nextjs";

/**
 * Returns the active tenant ID for Comunify multi-tenant fetchClient.
 *
 * Priority: Clerk active organization id > user-id fallback for single-tenant creator.
 *
 * Rationale: Clerk `useAuth().userId` is the user identity, not the tenant.
 * In a multi-tenant SaaS, one user can belong to multiple orgs (tenants).
 * Using userId as X-Tenant-ID assumes 1:1 user→tenant which breaks multi-brand
 * creators. Organization.id is the correct tenant anchor.
 *
 * Multi-creator switcher (Q2-B deferred — ticket 12.bis) will add an explicit
 * tenant picker; this hook will be updated to read from that context then.
 *
 * @see .claude/rules/tenant-isolation.md
 */
export function useTenantId(): string | null {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();

  if (!orgLoaded || !userLoaded) return null;

  // Prefer Clerk org id (multi-tenant) over user id (single-tenant fallback)
  return organization?.id ?? user?.id ?? null;
}
