import type { Metadata } from "next";
import { OfferWizardClient } from "@/features/comunify/components/offer-wizard-client";

export const metadata: Metadata = {
  title: "Nueva oferta — Comunify",
};

export default function NewOfferPage() {
  return <OfferWizardClient />;
}
