"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { VoiceSamplesStatus } from "../types/voice-cloning.types";
import { comunifyQueryKeys } from "./query-keys";

export function useVoiceSamplesStatus() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.voiceCloning.samples(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<VoiceSamplesStatus>(
        "/api/v1/comunify/voice-cloning/samples/status",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}
