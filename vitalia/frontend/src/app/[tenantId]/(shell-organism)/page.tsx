/**
 * Shell Organism Root Page — Server Component redirect.
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-4
 *
 * 03-arch.md § 2.1 — verbatim spec.
 *
 * Visiting /{tenantId} immediately redirects server-side to
 * /{tenantId}/lisa/marca (default landing per 01-spec.md § 6).
 *
 * No "use client" — redirect() is a Server Action (Next.js App Router).
 * Next.js 16: params is Promise, must be awaited before use.
 *
 * SC-1: navega a /{tenantId} → redirect a /{tenantId}/lisa/marca.
 *
 * HIPAA-lite: not applicable — routing only, no PHI.
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function ShellRootPage({ params }: PageProps) {
  const { tenantId } = await params;
  redirect(`/${tenantId}/lisa/marca`);
}
