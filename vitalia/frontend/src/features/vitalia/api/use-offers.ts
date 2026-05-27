"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { vitaliaFetch } from "@/lib/fetch-client";
import { vitaliaQueryKeys } from "./query-keys";

export interface OfferSummary {
  id: string;
  service_name: string;
  offer_category: string;
  base_price: number;
  currency: string | null;
  status: string;
  created_at: string;
}

export interface OfferListResponse {
  offers: OfferSummary[];
  total: number;
}

export function useOffers(filters?: { status?: string }) {
  const { getToken, isLoaded, isSignedIn, sessionClaims } = useAuth();

  return useQuery({
    queryKey: vitaliaQueryKeys.offers.list(filters),
    queryFn: async (): Promise<OfferListResponse> => {
      const token = await getToken();
      const tenantId = (
        sessionClaims?.public_metadata as Record<string, unknown>
      )?.active_tenant_id as string | undefined;
      if (!token) throw new Error("Not authenticated");
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      return vitaliaFetch<OfferListResponse>(`/api/v1/vitalia/offers${query}`, {
        token,
        tenantId: tenantId ?? "",
      });
    },
    enabled: isLoaded && isSignedIn === true,
  });
}
