// story-origin: comunify-shell-organism
"use client";

/**
 * useTenantId — returns the current tenant ID for all Comunify API requests.
 *
 * Per MEMORY.md::no-clerk-organizations (2026-05-20 + 2026-06-01):
 *   Luana does NOT use Clerk Organizations. tenant_id is OUR data
 *   (luana-core-iam), written by us into Clerk user.publicMetadata for
 *   convenient FE access. It is NOT the Clerk Organization id
 *   (format: org_3DzUI3...) — that is NOT a UUID and causes backend
 *   UUID() parse errors (500 on all data endpoints).
 *
 * Source of truth: user.publicMetadata.tenant_id (UUID string), set by
 *   luana-core-iam when the user is provisioned.
 *
 * NEVER use useOrganization() / useAuth().orgId — Clerk Orgs not used in Luana.
 * Mirrors vitalia/frontend/src/hooks/useTenantId.ts (post no-clerk-org fix).
 *
 * @see .claude/rules/tenant-isolation.md
 */

import { useUser } from "@clerk/nextjs";

export function useTenantId(): string | null {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (user) {
    const meta = user.publicMetadata as Record<string, unknown>;
    if (typeof meta.tenant_id === "string" && meta.tenant_id.length > 0) {
      return meta.tenant_id;
    }
  }

  return null;
}
