"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { CreatorProfile } from "../types/comunify.types";
import type { CreatorProfileInput } from "../schemas/creator-profile-schema";
import { comunifyQueryKeys } from "./query-keys";

export function useCreatorProfileCreate() {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatorProfileInput) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<CreatorProfile>(
        "/api/v1/comunify/onboarding/creator-profile",
        {
          token,
          tenantId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.brandStudio.sections() });
    },
  });
}
