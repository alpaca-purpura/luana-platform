"use client";

// TODO T-fe-1 polish post-merge: wire real CreateOfferPayload from CONTRACT
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface CreateOfferPayload {
  title: string;
  offer_type: string;
  description?: string;
  price?: number;
  currency?: string;
}

interface CreatedOffer {
  id: string;
  title: string;
  offer_type: string;
}

export function useOfferCreate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOfferPayload): Promise<CreatedOffer> => {
      const token = await getToken();
      const res = await fetch("/api/v1/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al crear la oferta");
      return res.json() as Promise<CreatedOffer>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.offers.list() });
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.ladder.detail() });
    },
  });
}
