"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { BrandStudioSection } from "../types/comunify.types";
import { comunifyQueryKeys } from "./query-keys";

export function useBrandStudioSections() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.brandStudio.sections(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<BrandStudioSection[]>(
        "/api/v1/comunify/brand-studio/sections",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
  });
}

export function useBrandStudioSectionPatch() {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
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
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<BrandStudioSection>(
        `/api/v1/comunify/brand-studio/sections/${sectionSlug}`,
        {
          token,
          tenantId,
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
