"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { Cohort } from "../types/cohort.types";
import type { CohortCreateInput } from "../schemas/cohort-create-schema";
import { comunifyQueryKeys } from "./query-keys";

export function useCohortList() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.cohorts.list(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<Cohort[]>(
        "/api/v1/comunify/cohorts",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
  });
}

export function useCohortDetail(cohortId: string) {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.cohorts.detail(cohortId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<Cohort>(
        `/api/v1/comunify/cohorts/${cohortId}`,
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId && !!cohortId,
  });
}

export function useCohortCreate() {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CohortCreateInput) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<Cohort>(
        "/api/v1/comunify/cohorts",
        {
          token,
          tenantId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.cohorts.list() });
    },
  });
}
