import type { Metadata } from "next";
import { CreateCohortClient } from "@/features/comunify/components/cohort-detail-client";

export const metadata: Metadata = {
  title: "Nueva cohorte — Comunify",
};

export default function NewCohortPage() {
  return <CreateCohortClient mode="create" />;
}
