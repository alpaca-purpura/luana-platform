"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { BrandStudioSection } from "../types/comunify.types";
import { comunifyQueryKeys } from "./query-keys";

export function useBrandStudioSections() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.brandStudio.sections(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<BrandStudioSection[]>(
        "/api/v1/comunify/brand-studio/sections",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}

export function useBrandStudioSectionPatch() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionSlug,
      data,
    }: {
      sectionSlug: string;
      data: Record<string, unknown>;
    }) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<BrandStudioSection>(
        `/api/v1/comunify/brand-studio/sections/${sectionSlug}`,
        {
          token,
          tenantId: userId,
          method: "PATCH",
          body: JSON.stringify(data),
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
