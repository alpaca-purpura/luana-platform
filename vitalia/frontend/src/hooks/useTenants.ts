// cap: iam.luana-core-adoption
// atomics: TBD
// story-origin: vitalia-fase1-s3-TBD
"use client";

/**
 * useTenants — React Query hook to fetch available tenants for the authenticated user.
 * F1-S3 vitalia-fase1-tenant-switcher — T-5
 *
 * Fetches GET /api/tenants — returns list of clinics/tenants accessible to the user.
 * This is a non-PHI bootstrap call: it lists business entities (clinics), not patient data.
 *
 * After data arrives, hydrates the Zustand store via setAvailableTenants (useEffect).
 * NOTE: onSuccess is deprecated in React Query v5 — hydration uses useEffect on query.data.
 *
 * Query config:
 * - staleTime: 5 min (clinics list changes infrequently)
 * - gcTime: 10 min
 * - retry: 2
 * - refetchOnWindowFocus: false
 *
 * No Clerk Organizations used — per MEMORY.md::no-clerk-organizations 2026-05-20.
 * Uses useAuth() for token + userId — NO orgId, NO useOrganization.
 *
 * 03-arch.md § 2.8 — implementation verbatim.
 * Named export (no default export) per FSD-Lite enforce.
 * HIPAA-lite: no-phi-scope — tenant list is business entity data, not PHI.
 *
 * downstream-regression-na: brand-local hook; no cross-brand consumers
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { fetchClient } from "@/lib/api/fetchClient";
import { useTenantStore } from "@/stores/tenant-store";
import type { TenantsApiResponse } from "@/components/shared/shell-organism/types";

/** React Query cache key for tenants list */
export const TENANTS_QUERY_KEY = ["tenants"] as const;

/**
 * Fetches the list of tenants accessible to the current user.
 * Hydrates the tenant store with the result via useEffect.
 */
export function useTenants() {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const setAvailableTenants = useTenantStore((s) => s.setAvailableTenants);

  const query = useQuery<TenantsApiResponse>({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("Not authenticated");
      // /api/tenants is a user-level endpoint — userId serves as tenantId
      // to satisfy the X-Tenant-ID header requirement. The backend derives
      // accessible tenants from the JWT claims.
      return fetchClient<TenantsApiResponse>("/api/tenants", {
        token,
        tenantId: userId,
      });
    },
    enabled: isLoaded && isSignedIn === true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Hydrate store when data arrives (React Query v5 — onSuccess deprecated)
  useEffect(() => {
    if (query.data) {
      setAvailableTenants(query.data.tenants);
    }
  }, [query.data, setAvailableTenants]);

  return query;
}
