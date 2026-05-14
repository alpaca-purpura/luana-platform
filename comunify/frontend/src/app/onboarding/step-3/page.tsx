import type { Metadata } from "next";
import { OnboardingStep3Client } from "@/features/comunify/components/onboarding-step-3-client";

export const metadata: Metadata = {
  title: "Elige tu plan — Comunify",
};

export default function OnboardingStep3Page() {
  return <OnboardingStep3Client />;
}
