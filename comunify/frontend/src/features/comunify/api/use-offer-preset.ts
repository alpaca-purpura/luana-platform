"use client";

// TODO T-fe-1 polish post-merge: wire real OfferPreset type from CONTRACT
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface OfferPreset {
  offer_type: string;
  suggested_sections: string[];
  suggested_price_range?: { min: number; max: number };
  delivery_format?: string;
}

export function useOfferPreset(offerType: string | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.offers.preset(offerType ?? ""),
    queryFn: async (): Promise<OfferPreset> => {
      const token = await getToken();
      const res = await fetch(`/api/v1/offers/presets/${offerType}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al cargar preset de oferta");
      return res.json() as Promise<OfferPreset>;
    },
    enabled: isLoaded && isSignedIn && Boolean(offerType),
  });
}
