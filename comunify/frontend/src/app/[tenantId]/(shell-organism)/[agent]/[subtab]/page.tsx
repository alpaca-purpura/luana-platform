// cap: comunify-shell-organism
/**
 * Subtab Page — Server Component.
 * T-shell — port from nicolify subtab page, re-themed to comunify.
 *
 * Validates both [agent] and [subtab] params against shell-routes.ts SSoT (whitelist).
 * If either is invalid → notFound() → Next.js renders [subtab]/not-found.tsx.
 *
 * On valid route → delegates to SubTabContent dispatcher (R0 = EmptyState for all combos).
 *
 * If sub-tab has N3 leaves → redirects to first leaf (auto-select first sub-sub-tab).
 *
 * A4 XSS/path-injection defense-in-depth: isValidAgent + isValidSubtab are
 * whitelist-only guards (shell-routes.ts). ANY input not in catalog → notFound().
 *
 * No "use client" — Server Component.
 * Next.js 16 App Router: params is Promise → await before use.
 *
 * spec_anchor: navigation-tree.md v2 + 03-arch-fe.md § Integration design
 * gherkin_coverage: A1 A3 A4 A5
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { notFound, redirect } from "next/navigation";

import { SubTabContent } from "@/components/shared/shell-organism/SubTabContent";
import {
  getSubSubTabs,
  isValidAgent,
  isValidSubtab,
} from "@/lib/routing/shell-routes";

interface PageProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string }>;
}

/**
 * N2 sub-tab route. Validates [agent]+[subtab] against the SSoT whitelist.
 * If the sub-tab HAS N3 leaves, redirects to the first leaf.
 * Otherwise renders the N2 empty-state dispatcher.
 */
export default async function SubtabPage({ params }: PageProps) {
  const { tenantId, agent, subtab } = await params;

  // Whitelist validation (A4): any invalid segment → 404 contextual (shell chrome intact).
  if (!isValidAgent(agent) || !isValidSubtab(agent, subtab)) {
    notFound();
  }

  // If this sub-tab has N3 leaves, land on the first one
  const leaves = getSubSubTabs(agent, subtab);
  if (leaves && leaves.length > 0) {
    redirect(`/${tenantId}/${agent}/${subtab}/${leaves[0].id}`);
  }

  return <SubTabContent agent={agent} subtab={subtab} />;
}
