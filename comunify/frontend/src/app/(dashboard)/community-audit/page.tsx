import type { Metadata } from "next";
import { CommunityAuditClient } from "@/features/comunify/components/community-audit-client";

export const metadata: Metadata = {
  title: "Auditoría de comunidad — Comunify",
};

export default function CommunityAuditPage() {
  return <CommunityAuditClient />;
}
