"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { CohortBroadcast, BroadcastPayload } from "../types/cohort.types";
import { comunifyQueryKeys } from "./query-keys";

export function useCohortBroadcasts(cohortId: string) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.cohorts.broadcasts(cohortId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<CohortBroadcast[]>(
        `/api/v1/comunify/cohorts/${cohortId}/broadcasts`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId && !!cohortId,
  });
}

export function useCohortBroadcastSend(cohortId: string) {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BroadcastPayload) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<{ broadcast_id: string }>(
        `/api/v1/comunify/cohorts/${cohortId}/broadcasts`,
        {
          token,
          tenantId: userId,
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
