// cap: shell-organism.shell-vitalia
// story-origin: TBD
"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { vitaliaFetch } from "@/lib/fetch-client";
import type { OfferPresetResponse } from "../types/vitalia.types";
import { vitaliaQueryKeys } from "./query-keys";

export function useOfferPreset(slug = "medical_services_v1") {
  const { getToken, isLoaded, isSignedIn, sessionClaims } = useAuth();

  return useQuery({
    queryKey: vitaliaQueryKeys.offers.preset(slug),
    queryFn: async (): Promise<OfferPresetResponse> => {
      const token = await getToken();
      const tenantId = (
        sessionClaims?.public_metadata as Record<string, unknown>
      )?.active_tenant_id as string | undefined;
      if (!token) throw new Error("Not authenticated");
      return vitaliaFetch<OfferPresetResponse>(
        `/api/v1/vitalia/offers/presets/${slug}`,
        { token, tenantId: tenantId ?? "" },
      );
    },
    enabled: isLoaded && isSignedIn === true,
    staleTime: 1000 * 60 * 60, // 1h — presets rarely change
  });
}
