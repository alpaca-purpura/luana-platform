/**
 * useApproveRecommendation — mutation: approve a Lucas recommendation
 * Requires Idempotency-Key header (BE enforced for POST mutations)
 * downstream-regression-na: brand-local FE hook; no cross-brand consumers
 */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useClinicId } from "@/hooks/useClinicId";
import { fetchClient } from "@/lib/api/fetchClient";
import type { ApproveRecommendationResponse } from "../types/lucas-recommendation";

export type ApproveRecommendationVariables = {
  recId: string;
};

export function useApproveRecommendation() {
  const { getToken, orgId } = useAuth();
  const clinicId = useClinicId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recId }: ApproveRecommendationVariables) => {
      const token = await getToken();
      if (!token || !orgId) throw new Error("Not authenticated");
      return fetchClient<ApproveRecommendationResponse>(
        `/api/v1/vitalia/marketing/recommendations/${encodeURIComponent(recId)}/approve`,
        {
          method: "POST",
          token,
          tenantId: orgId,
          clinicId,
          headers: {
            "Idempotency-Key": crypto.randomUUID(),
          },
        },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["marketing", "recommendations"],
      });
    },
  });
}
