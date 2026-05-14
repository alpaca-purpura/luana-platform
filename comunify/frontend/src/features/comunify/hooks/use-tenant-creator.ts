"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { CreatorProfile } from "../types/comunify.types";

export function useTenantCreator() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: ["comunify", "creator-profile", tenantId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<CreatorProfile>(
        "/api/v1/comunify/brand-studio/profile",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}
