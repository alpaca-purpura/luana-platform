"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { Subscription, SubscriptionMetrics } from "../types/subscription.types";
import type { SubscriptionCancelInput } from "../schemas/subscription-cancel-schema";
import { comunifyQueryKeys } from "./query-keys";

export function useSubscriptionList(filters: { status?: string } = {}) {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.subscriptions.list(filters),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      const qs = params.toString();
      return comunifyFetch<Subscription[]>(
        `/api/v1/comunify/subscriptions${qs ? `?${qs}` : ""}`,
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
  });
}

export function useSubscriptionMetrics() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.subscriptions.metrics(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<SubscriptionMetrics>(
        "/api/v1/comunify/subscriptions/metrics",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
  });
}

export function useSubscriptionCancel(subscriptionId: string) {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubscriptionCancelInput) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<{ success: boolean }>(
        `/api/v1/comunify/subscriptions/${subscriptionId}/cancel`,
        {
          token,
          tenantId,
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
  const { getToken } = useAuth();
  const tenantId = useTenantId();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<{ success: boolean }>(
        `/api/v1/comunify/subscriptions/${subscriptionId}/resend-payment-link`,
        { token, tenantId, method: "POST" }
      );
    },
  });
}
