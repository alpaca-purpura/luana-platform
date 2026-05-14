"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { CreatorProfile } from "../types/comunify.types";
import type { CreatorProfileInput } from "../schemas/creator-profile-schema";
import { comunifyQueryKeys } from "./query-keys";

export function useCreatorProfileCreate() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatorProfileInput) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<CreatorProfile>(
        "/api/v1/comunify/onboarding/creator-profile",
        {
          token,
          tenantId: userId,
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
