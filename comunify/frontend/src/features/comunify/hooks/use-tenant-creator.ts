"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { CreatorProfile } from "../types/comunify.types";

export function useTenantCreator() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: ["comunify", "creator-profile", userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<CreatorProfile>(
        "/api/v1/comunify/brand-studio/profile",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
