"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { CohortBroadcast, BroadcastPayload } from "../types/cohort.types";
import { comunifyQueryKeys } from "./query-keys";

export function useCohortBroadcasts(cohortId: string) {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.cohorts.broadcasts(cohortId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<CohortBroadcast[]>(
        `/api/v1/comunify/cohorts/${cohortId}/broadcasts`,
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId && !!cohortId,
  });
}

export function useCohortBroadcastSend(cohortId: string) {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BroadcastPayload) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<{ broadcast_id: string }>(
        `/api/v1/comunify/cohorts/${cohortId}/broadcasts`,
        {
          token,
          tenantId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.cohorts.broadcasts(cohortId),
      });
    },
  });
}
