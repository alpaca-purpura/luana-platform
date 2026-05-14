import type { Metadata } from "next";
import { OnboardingStep4Client } from "@/features/comunify/components/onboarding-step-4-client";

export const metadata: Metadata = {
  title: "Tu primera oferta — Comunify",
};

export default function OnboardingStep4Page() {
  return <OnboardingStep4Client />;
}
