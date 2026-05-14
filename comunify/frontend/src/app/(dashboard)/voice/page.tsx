import type { Metadata } from "next";
import { VoiceCloningClient } from "@/features/comunify/components/voice-cloning-client";

export const metadata: Metadata = {
  title: "Voz del creador — Comunify",
};

export default function VoicePage() {
  return <VoiceCloningClient />;
}
