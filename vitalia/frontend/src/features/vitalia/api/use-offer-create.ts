"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vitaliaFetch } from "@/lib/fetch-client";
import type { OfferSummary } from "./use-offers";
import { vitaliaQueryKeys } from "./query-keys";

export interface OfferCreatePayload {
  service_name: string;
  offer_category: string;
  target_description: string;
  base_price: number;
  currency: string;
  requires_prepay: boolean;
  deposit_percent?: number;
  requires_informed_consent: boolean;
  consent_template_slug?: string;
  duration_min: number;
  doctor_id: string;
}

export function useOfferCreate() {
  const { getToken, sessionClaims } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OfferCreatePayload): Promise<OfferSummary> => {
      const token = await getToken();
      const tenantId = (sessionClaims?.public_metadata as Record<string, unknown>)
        ?.active_tenant_id as string | undefined;
      if (!token) throw new Error("Not authenticated");
      return vitaliaFetch<OfferSummary>(
        "/api/v1/vitalia/offers",
        {
          token,
          tenantId: tenantId ?? "",
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vitaliaQueryKeys.offers.list() });
    },
  });
}
