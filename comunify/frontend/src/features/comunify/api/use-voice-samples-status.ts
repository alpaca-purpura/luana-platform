"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { VoiceSamplesStatus } from "../types/voice-cloning.types";
import { comunifyQueryKeys } from "./query-keys";

export function useVoiceSamplesStatus() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.voiceCloning.samples(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<VoiceSamplesStatus>(
        "/api/v1/comunify/voice-cloning/samples/status",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
  });
}
