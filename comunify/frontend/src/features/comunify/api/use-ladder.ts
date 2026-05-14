"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { OfferLadder } from "../types/ladder.types";
import { comunifyQueryKeys } from "./query-keys";

export function useLadder() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.ladder.detail(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<OfferLadder>(
        "/api/v1/comunify/ladder",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}

export function useLadderUpdateConnections() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connections: { from_offer_id: string; to_offer_id: string }[]) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<OfferLadder>(
        "/api/v1/comunify/ladder/connections",
        {
          token,
          tenantId: userId,
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
