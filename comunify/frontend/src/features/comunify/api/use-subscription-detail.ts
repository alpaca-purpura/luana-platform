"use client";

// TODO T-fe-6 polish post-merge: wire real SubscriptionDetail type from CONTRACT
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface SubscriptionDetail {
  id: string;
  subscriber_name: string;
  subscriber_email: string;
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  dunning_status?: string;
}

export function useSubscriptionDetail(subscriptionId: string | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.subscriptions.detail(subscriptionId ?? ""),
    queryFn: async (): Promise<SubscriptionDetail> => {
      const token = await getToken();
      const res = await fetch(`/api/v1/subscriptions/${subscriptionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al cargar suscripción");
      return res.json() as Promise<SubscriptionDetail>;
    },
    enabled: isLoaded && isSignedIn && Boolean(subscriptionId),
  });
}
