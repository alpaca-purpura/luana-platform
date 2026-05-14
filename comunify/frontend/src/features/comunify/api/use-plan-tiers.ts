"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { PlanTier } from "../types/plan-tier.types";
import { comunifyQueryKeys } from "./query-keys";

export function usePlanTiers() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.onboarding.plans(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<PlanTier[]>(
        "/api/v1/comunify/onboarding/plans",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}
