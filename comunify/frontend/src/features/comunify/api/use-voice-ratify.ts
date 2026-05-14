"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { comunifyQueryKeys } from "./query-keys";

export function useVoiceRatify() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<{ success: boolean }>(
        "/api/v1/comunify/voice-cloning/ratify",
        {
          token,
          tenantId: userId,
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
