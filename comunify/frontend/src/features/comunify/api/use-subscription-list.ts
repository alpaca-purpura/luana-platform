"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { Subscription, SubscriptionMetrics } from "../types/subscription.types";
import type { SubscriptionCancelInput } from "../schemas/subscription-cancel-schema";
import { comunifyQueryKeys } from "./query-keys";

export function useSubscriptionList(filters: { status?: string } = {}) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.subscriptions.list(filters),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      const qs = params.toString();
      return comunifyFetch<Subscription[]>(
        `/api/v1/comunify/subscriptions${qs ? `?${qs}` : ""}`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}

export function useSubscriptionMetrics() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.subscriptions.metrics(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<SubscriptionMetrics>(
        "/api/v1/comunify/subscriptions/metrics",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}

export function useSubscriptionCancel(subscriptionId: string) {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubscriptionCancelInput) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<{ success: boolean }>(
        `/api/v1/comunify/subscriptions/${subscriptionId}/cancel`,
        {
          token,
          tenantId: userId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comunify", "subscriptions"] });
    },
  });
}

export function useSubscriptionResendPaymentLink() {
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<{ success: boolean }>(
        `/api/v1/comunify/subscriptions/${subscriptionId}/resend-payment-link`,
        { token, tenantId: userId, method: "POST" }
      );
    },
  });
}
