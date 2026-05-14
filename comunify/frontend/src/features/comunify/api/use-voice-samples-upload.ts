"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { comunifyQueryKeys } from "./query-keys";

export function useVoiceSamplesUpload() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      const response = await fetch("/api/v1/comunify/voice/samples/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": userId,
        },
        body: formData,
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Error al subir muestras de voz");
      }
      return response.json() as Promise<{ sample_id: string; duration_seconds: number }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.voiceCloning.samples(),
      });
    },
  });
}
