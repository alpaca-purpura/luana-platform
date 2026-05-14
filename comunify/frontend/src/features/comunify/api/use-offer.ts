"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { LadderOffer } from "../types/ladder.types";
import { comunifyQueryKeys } from "./query-keys";

export function useOfferList() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.offers.list(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<LadderOffer[]>(
        "/api/v1/comunify/offers",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
  });
}

export function useOfferDetail(offerId: string) {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.offers.detail(offerId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<LadderOffer>(
        `/api/v1/comunify/offers/${offerId}`,
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId && !!offerId,
  });
}

export function useOfferCreate() {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<LadderOffer>) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<LadderOffer>(
        "/api/v1/comunify/offers",
        {
          token,
          tenantId,
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
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.offers.preset(offerType),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<Record<string, unknown>>(
        `/api/v1/comunify/offers/presets/${offerType}`,
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId && !!offerType,
    staleTime: 5 * 60 * 1000,
  });
}
