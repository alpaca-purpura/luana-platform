// cap: shell-organism.shell-vitalia
// story-origin: TBD
"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { vitaliaFetch } from "@/lib/fetch-client";
import { vitaliaQueryKeys } from "./query-keys";
import type { OfferSummary } from "./use-offers";

export function useOffer(id: string) {
  const { getToken, isLoaded, isSignedIn, sessionClaims } = useAuth();

  return useQuery({
    queryKey: vitaliaQueryKeys.offers.detail(id),
    queryFn: async (): Promise<OfferSummary> => {
      const token = await getToken();
      const tenantId = (
        sessionClaims?.public_metadata as Record<string, unknown>
      )?.active_tenant_id as string | undefined;
      if (!token) throw new Error("Not authenticated");
      return vitaliaFetch<OfferSummary>(`/api/v1/vitalia/offers/${id}`, {
        token,
        tenantId: tenantId ?? "",
      });
    },
    enabled: isLoaded && isSignedIn === true && Boolean(id),
  });
}
