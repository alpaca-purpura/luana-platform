import type { Metadata } from "next";
import { CohortDetailClient } from "@/features/comunify/components/cohort-detail-client";

export const metadata: Metadata = {
  title: "Detalle de cohorte — Comunify",
};

interface CohortDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CohortDetailPage({ params }: CohortDetailPageProps) {
  const { id } = await params;
  return <CohortDetailClient cohortId={id} />;
}
