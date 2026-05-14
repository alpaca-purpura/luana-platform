import type { Metadata } from "next";
import { OnboardingStep2Client } from "@/features/comunify/components/onboarding-step-2-client";

export const metadata: Metadata = {
  title: "Tu nicho y audiencia — Comunify",
};

export default function OnboardingStep2Page() {
  return <OnboardingStep2Client />;
}
