"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { HandleCheckResult } from "../types/comunify.types";
import { comunifyQueryKeys } from "./query-keys";

export function useHandleCheck(handle: string) {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.onboarding.handleCheck(handle),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<HandleCheckResult>(
        `/api/v1/comunify/onboarding/handle-check?handle=${encodeURIComponent(handle)}`,
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId && handle.length >= 3,
    staleTime: 30_000,
  });
}
