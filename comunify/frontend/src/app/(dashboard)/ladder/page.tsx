import type { Metadata } from "next";
import { LadderVisualizerClient } from "@/features/comunify/components/ladder-visualizer";

export const metadata: Metadata = {
  title: "Escalera de valor — Comunify",
};

export default function LadderPage() {
  return <LadderVisualizerClient />;
}
