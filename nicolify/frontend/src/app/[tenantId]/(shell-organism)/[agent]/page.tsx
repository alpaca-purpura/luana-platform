// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-6
/**
 * Agent Root Page — Server Component redirect.
 * nicolify-r0-shell T-6 — port from vitalia, re-themed to Nicolify agents.
 *
 * Visiting /{tenantId}/{agent} redirects server-side to the agent's defaultSubtab.
 * Defense-in-depth: calls notFound() if agent is invalid (layout should have
 * caught this, but this page can also be hit directly in some Next.js render paths).
 *
 * No "use client" — redirect() / notFound() are Server Actions.
 * Next.js 16: params is Promise → await before use.
 *
 * spec_anchor: 01-spec.md § E1 (click agent → default subtab)
 * gherkin_coverage: E1 A2
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { redirect, notFound } from "next/navigation";

import { isValidAgent, getDefaultSubtab, type RibbonTabSlug } from "@/lib/routing/shell-routes";

interface PageProps {
  params: Promise<{ tenantId: string; agent: string }>;
}

/**
 *
 */
export default async function AgentRootPage({ params }: PageProps) {
  const { tenantId, agent } = await params;

  // Whitelist guard (A4): invalid agent → 404 contextual (shell chrome intact).
  if (!isValidAgent(agent)) notFound();

  const defaultSubtab = getDefaultSubtab(agent);
  if (!defaultSubtab) notFound();

  redirect(`/${tenantId}/${agent}/${defaultSubtab}`);
}
