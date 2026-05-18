"use client";

/**
 * useFeatureFlag — read feature flags from tenant/org configuration.
 *
 * Feature flags are stored in Clerk organization public metadata under
 * `org.publicMetadata.featureFlags` (Record<string, boolean>).
 *
 * Usage:
 *   const isCopilotEnabled = useFeatureFlag("copilot");
 *   const isHipaaLite = useFeatureFlag("hipaa_lite");
 */

import { useOrganization } from "@clerk/nextjs";

/**
 * Returns the boolean value of a feature flag for the current tenant.
 * Returns false if the flag is not set or org is not loaded.
 *
 * @param flagName - Feature flag key (e.g. "copilot", "hipaa_lite")
 */
export function useFeatureFlag(flagName: string): boolean {
  const { organization, isLoaded } = useOrganization();

  if (!isLoaded || !organization) return false;

  const meta = organization.publicMetadata as Record<string, unknown>;
  const flags = meta.featureFlags;

  if (typeof flags !== "object" || flags === null) return false;

  const flagMap = flags as Record<string, unknown>;
  return flagMap[flagName] === true;
}
