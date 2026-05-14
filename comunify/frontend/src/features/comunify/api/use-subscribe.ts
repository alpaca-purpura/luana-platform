"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { Subscription } from "../types/subscription.types";
import { comunifyQueryKeys } from "./query-keys";

interface SubscribePayload {
  plan_id: string;
  billing_interval: "monthly" | "annual";
  creator_handle: string;
  payment_method_id?: string;
}

interface SubscribeResult {
  subscription_id: string;
  checkout_url?: string;
  status: "active" | "pending_payment";
}

export function useSubscribe() {
  return useMutation({
    mutationFn: async (payload: SubscribePayload) => {
      const response = await fetch("/api/v1/comunify/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Error al procesar suscripción");
      }
      return response.json() as Promise<SubscribeResult>;
    },
  });
}

export function useSubscriptionDetail(subscriptionId: string) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.subscriptions.detail(subscriptionId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<Subscription>(
        `/api/v1/comunify/subscriptions/${subscriptionId}`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId && !!subscriptionId,
  });
}
