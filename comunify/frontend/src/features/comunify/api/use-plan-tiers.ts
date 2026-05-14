"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { PlanTier } from "../types/plan-tier.types";
import { comunifyQueryKeys } from "./query-keys";

export function usePlanTiers() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.onboarding.plans(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<PlanTier[]>(
        "/api/v1/comunify/onboarding/plans",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
  });
}
