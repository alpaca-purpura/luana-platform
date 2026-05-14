"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { DistillJobStatus } from "../types/voice-cloning.types";
import { comunifyQueryKeys } from "./query-keys";

export function useVoiceDistillationPoll(jobId: string | null) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.voiceCloning.distillation(jobId ?? ""),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId || !jobId) throw new Error("No autenticado o job inválido");
      return comunifyFetch<DistillJobStatus>(
        `/api/v1/comunify/voice-cloning/distillation/${jobId}`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId && !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5000;
      if (data.status === "completed" || data.status === "failed") return false;
      return 5000;
    },
  });
}
