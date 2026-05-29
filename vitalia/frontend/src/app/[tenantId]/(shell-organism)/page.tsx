// cap: __shared__
// story-origin: TBD
/**
 * Shell Organism Root Page — Server Component redirect.
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-4 (MODIFIED by F1-S9)
 *
 * 03-arch-fe.md § 2.2 MODIFY — verbatim spec.
 *
 * Visiting /{tenantId} immediately redirects server-side to
 * /{tenantId}/valeria/agenda (default landing per F1-S9 § 2 — Chris dictum 2026-05-25).
 *
 * Changed from lisa/marca → valeria/agenda per Q1_default_landing decision.
 * Razón: la visión norte es "como una secretaria real, el dueño habla con
 * Valeria"; Valeria/Agenda es la operación día-a-día más frecuente.
 *
 * No "use client" — redirect() is a Server Action (Next.js App Router).
 * Next.js 16: params is Promise, must be awaited before use.
 *
 * SC-1: navega a /{tenantId} → redirect a /{tenantId}/valeria/agenda.
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
  redirect(`/${tenantId}/valeria/agenda`);
}
