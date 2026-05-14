"use client";

// TODO T-fe-6 polish post-merge: wire real endpoint
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

export function useSubscriptionResendPaymentLink() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (subscriptionId: string): Promise<void> => {
      const token = await getToken();
      const res = await fetch(`/api/v1/subscriptions/${subscriptionId}/resend-payment-link`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al reenviar enlace de pago");
    },
  });
}
