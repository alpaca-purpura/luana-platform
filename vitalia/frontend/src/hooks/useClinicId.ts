"use client";

/**
 * useClinicId — returns the current clinic ID for HIPAA-lite dual filter.
 *
 * Per vitalia/.claude/rules/hipaa-lite.md:
 *   - Vitalia adds clinic_id as second required filter on all PHI queries
 *   - X-Clinic-ID header must be sent alongside X-Tenant-ID
 *
 * Reads from Clerk user public metadata:
 *   - user.publicMetadata.clinicId
 *
 * Falls back to Clerk organization public metadata:
 *   - org.publicMetadata.defaultClinicId
 */

import { useUser, useOrganization } from "@clerk/nextjs";

/**
 * Returns the current user's clinic ID for HIPAA-lite PHI filtering.
 * Returns null if not yet loaded or user has no clinic assigned.
 */
export function useClinicId(): string | null {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  if (!userLoaded || !orgLoaded) return null;

  if (user) {
    const meta = user.publicMetadata as Record<string, unknown>;
    if (typeof meta.clinicId === "string" && meta.clinicId.length > 0) {
      return meta.clinicId;
    }
  }

  if (organization) {
    const orgMeta = organization.publicMetadata as Record<string, unknown>;
    if (
      typeof orgMeta.defaultClinicId === "string" &&
      orgMeta.defaultClinicId.length > 0
    ) {
      return orgMeta.defaultClinicId;
    }
  }

  return null;
}
