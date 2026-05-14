import type { Metadata } from "next";
import { CommunityModerationClient } from "@/features/comunify/components/community-moderation-client";

export const metadata: Metadata = {
  title: "Moderación — Comunify",
};

export default function CommunityModerationPage() {
  return <CommunityModerationClient />;
}
