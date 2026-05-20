/**
 * useRejectRecommendation — mutation: reject a Lucas recommendation with reason
 * Requires Idempotency-Key header (BE enforced for POST mutations)
 * downstream-regression-na: brand-local FE hook; no cross-brand consumers
 */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useClinicId } from "@/hooks/useClinicId";
import { fetchClient } from "@/lib/api/fetchClient";
import type {
  RejectRecommendationResponse,
  RejectReason,
} from "../types/lucas-recommendation";

export type RejectRecommendationVariables = {
  recId: string;
  reason: RejectReason;
  reasonOtherText?: string;
};

export function useRejectRecommendation() {
  const { getToken, orgId } = useAuth();
  const clinicId = useClinicId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recId,
      reason,
      reasonOtherText,
    }: RejectRecommendationVariables) => {
      const token = await getToken();
      if (!token || !orgId) throw new Error("Not authenticated");
      return fetchClient<RejectRecommendationResponse>(
        `/api/v1/vitalia/marketing/recommendations/${encodeURIComponent(recId)}/reject`,
        {
          method: "POST",
          token,
          tenantId: orgId,
          clinicId,
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            reason,
            reason_other_text: reasonOtherText ?? null,
          }),
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
