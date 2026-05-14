import type { Metadata } from "next";
import { OnboardingStep1Client } from "@/features/comunify/components/onboarding-step-1-client";

export const metadata: Metadata = {
  title: "Tu perfil de creador — Comunify",
};

export default function OnboardingStep1Page() {
  return <OnboardingStep1Client />;
}
