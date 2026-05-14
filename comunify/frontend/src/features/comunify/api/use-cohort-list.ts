"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { Cohort } from "../types/cohort.types";
import type { CohortCreateInput } from "../schemas/cohort-create-schema";
import { comunifyQueryKeys } from "./query-keys";

export function useCohortList() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.cohorts.list(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<Cohort[]>(
        "/api/v1/comunify/cohorts",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}

export function useCohortDetail(cohortId: string) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.cohorts.detail(cohortId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<Cohort>(
        `/api/v1/comunify/cohorts/${cohortId}`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId && !!cohortId,
  });
}

export function useCohortCreate() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CohortCreateInput) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<Cohort>(
        "/api/v1/comunify/cohorts",
        {
          token,
          tenantId: userId,
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
