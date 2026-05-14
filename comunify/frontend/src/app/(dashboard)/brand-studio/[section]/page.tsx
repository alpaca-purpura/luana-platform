import type { Metadata } from "next";
import { BrandStudioSectionClient } from "@/features/comunify/components/brand-studio-section-client";

export const metadata: Metadata = {
  title: "Sección de marca — Comunify",
};

interface BrandStudioSectionPageProps {
  params: Promise<{ section: string }>;
}

export default async function BrandStudioSectionPage({
  params,
}: BrandStudioSectionPageProps) {
  const { section } = await params;
  return <BrandStudioSectionClient section={section} />;
}
