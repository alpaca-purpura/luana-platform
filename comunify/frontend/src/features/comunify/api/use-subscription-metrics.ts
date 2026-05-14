"use client";

// TODO T-fe-6 polish post-merge: wire real SubscriptionMetrics type from CONTRACT
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface SubscriptionMetrics {
  total_active: number;
  total_churned_this_month: number;
  mrr: number;
  currency: string;
  dunning_count: number;
  new_this_month: number;
}

export function useSubscriptionMetrics() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.subscriptions.metrics(),
    queryFn: async (): Promise<SubscriptionMetrics> => {
      const token = await getToken();
      const res = await fetch("/api/v1/subscriptions/metrics", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al cargar métricas de suscripciones");
      return res.json() as Promise<SubscriptionMetrics>;
    },
    enabled: isLoaded && isSignedIn,
  });
}
