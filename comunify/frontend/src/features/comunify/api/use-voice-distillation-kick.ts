"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import { comunifyQueryKeys } from "./query-keys";

interface KickDistillationResult {
  job_id: string;
  status: "queued";
  estimated_seconds: number;
}

export function useVoiceDistillationKick() {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<KickDistillationResult>(
        "/api/v1/comunify/voice/distillation/kick",
        { token, tenantId, method: "POST" }
      );
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.voiceCloning.distillation(data.job_id),
      });
    },
  });
}
