"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import { comunifyQueryKeys } from "./query-keys";

export function useCohortEnroll(cohortId: string) {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberIds: string[]) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<{ enrolled: number; skipped: number }>(
        `/api/v1/comunify/cohorts/${cohortId}/enroll`,
        {
          token,
          tenantId,
          method: "POST",
          body: JSON.stringify({ member_ids: memberIds }),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.cohorts.roster(cohortId, {}),
      });
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.cohorts.detail(cohortId),
      });
    },
  });
}
