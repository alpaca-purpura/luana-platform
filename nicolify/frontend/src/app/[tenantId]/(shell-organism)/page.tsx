// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-6
/**
 * Shell root page — Server Component redirect to DEFAULT_LANDING.
 * nicolify-r0-shell T-6 — port from vitalia, re-themed.
 *
 * Visiting /{tenantId} redirects server-side to DEFAULT_LANDING (christian/pipeline).
 * Ratificado Chris 2026-05-30.
 *
 * No "use client" — redirect() is a Server Action.
 * Next.js 16: params is Promise → await before use.
 *
 * spec_anchor: 01-spec.md § A1 + 03-arch.md Integration design (CONN)
 * gherkin_coverage: A1
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { redirect } from "next/navigation";

import { DEFAULT_LANDING } from "@/lib/routing/shell-routes";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

/**
 *
 */
export default async function ShellRootPage({ params }: PageProps) {
  const { tenantId } = await params;
  redirect(`/${tenantId}/${DEFAULT_LANDING.agent}/${DEFAULT_LANDING.subtab}`);
}
