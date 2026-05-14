"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import { comunifyQueryKeys } from "./query-keys";

export function useVoiceRatify() {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<{ success: boolean }>(
        "/api/v1/comunify/voice-cloning/ratify",
        {
          token,
          tenantId,
          method: "POST",
          body: JSON.stringify({ job_id: jobId }),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.brandStudio.sections(),
      });
    },
  });
}
