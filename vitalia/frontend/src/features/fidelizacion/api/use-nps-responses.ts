"use client";

/**
 * use-nps-responses — React Query hook for NPS reduced table.
 *
 * Endpoint: GET /api/v1/vitalia/fidelization/nps/responses?period={period}
 *
 * downstream-regression-na: brand-local FE hook; no cross-brand consumers
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { vitaliaFetch } from "@/lib/fetch-client";
import type { NPSSummaryResponse } from "../types/nps";
import type { FidelizacionPeriod } from "../types/url-state";

/**
 * Fetches NPS summary + reduced row list.
 */
export function useNpsResponses(period: FidelizacionPeriod) {
  const { getToken, orgId, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["fidelizacion", "nps", period],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !orgId) throw new Error("Not authenticated");

      return vitaliaFetch<NPSSummaryResponse>(
        `/api/v1/vitalia/fidelization/nps/responses?period=${period}`,
        { token, tenantId: orgId }
      );
    },
    enabled: isLoaded && isSignedIn === true,
    staleTime: 60_000,
  });
}
