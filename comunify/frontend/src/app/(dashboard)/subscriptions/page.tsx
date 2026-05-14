import type { Metadata } from "next";
import { SubscriptionsAdminClient } from "@/features/comunify/components/subscriptions-admin-client";

export const metadata: Metadata = {
  title: "Suscripciones — Comunify",
};

export default function SubscriptionsPage() {
  return <SubscriptionsAdminClient />;
}
