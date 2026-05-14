"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { OfferLadder } from "../types/ladder.types";
import { comunifyQueryKeys } from "./query-keys";

export function useLadder() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.ladder.detail(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<OfferLadder>(
        "/api/v1/comunify/ladder",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
  });
}

export function useLadderUpdateConnections() {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connections: { from_offer_id: string; to_offer_id: string }[]) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<OfferLadder>(
        "/api/v1/comunify/ladder/connections",
        {
          token,
          tenantId,
          method: "PUT",
          body: JSON.stringify({ connections }),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.ladder.detail(),
      });
    },
  });
}
