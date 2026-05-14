"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { LadderOffer } from "../types/ladder.types";
import { comunifyQueryKeys } from "./query-keys";

export function useOfferList() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.offers.list(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<LadderOffer[]>(
        "/api/v1/comunify/offers",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}

export function useOfferDetail(offerId: string) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.offers.detail(offerId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<LadderOffer>(
        `/api/v1/comunify/offers/${offerId}`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId && !!offerId,
  });
}

export function useOfferCreate() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<LadderOffer>) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<LadderOffer>(
        "/api/v1/comunify/offers",
        {
          token,
          tenantId: userId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.offers.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.ladder.detail(),
      });
    },
  });
}

export function useOfferPreset(offerType: string) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.offers.preset(offerType),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<Record<string, unknown>>(
        `/api/v1/comunify/offers/presets/${offerType}`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId && !!offerType,
    staleTime: 5 * 60 * 1000,
  });
}
