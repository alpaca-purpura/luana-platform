"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { HandleCheckResult } from "../types/comunify.types";
import { comunifyQueryKeys } from "./query-keys";

export function useHandleCheck(handle: string) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.onboarding.handleCheck(handle),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<HandleCheckResult>(
        `/api/v1/comunify/onboarding/handle-check?handle=${encodeURIComponent(handle)}`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId && handle.length >= 3,
    staleTime: 30_000,
  });
}
