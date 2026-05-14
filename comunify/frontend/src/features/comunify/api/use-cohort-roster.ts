"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { CohortMember, EngagementBucket, MemberTier } from "../types/cohort.types";
import { comunifyQueryKeys } from "./query-keys";

interface RosterFilters {
  tier?: MemberTier;
  engagementBucket?: EngagementBucket;
}

export function useCohortRoster(cohortId: string, filters: RosterFilters = {}) {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.cohorts.roster(cohortId, filters),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      const params = new URLSearchParams();
      if (filters.tier) params.set("tier", filters.tier);
      if (filters.engagementBucket) params.set("engagement_bucket", filters.engagementBucket);
      const qs = params.toString();
      return comunifyFetch<CohortMember[]>(
        `/api/v1/comunify/cohorts/${cohortId}/roster${qs ? `?${qs}` : ""}`,
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId && !!cohortId,
  });
}
