import type { Metadata } from "next";
import { CommunityFeedClient } from "@/features/comunify/components/community-feed-client";

export const metadata: Metadata = {
  title: "Comunidad — Comunify",
};

export default function CommunityPage() {
  return <CommunityFeedClient />;
}
