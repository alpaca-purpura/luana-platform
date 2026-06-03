// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-sitemap-completo T-1
/**
 * SubSubtab Page — Server Component.
 * nicolify-r0-sitemap-completo T-1 — NEW (cloned verbatim from [subtab]/page.tsx pattern).
 *
 * Validates [agent], [subtab], and [subsubtab] params against shell-routes.ts SSoT (whitelist).
 * If any is invalid → notFound() → Next.js renders [subsubtab]/not-found.tsx.
 *
 * On valid route → delegates to SubTabContent dispatcher which maps
 * all {agent}.{subtab}.{subsubtab} combos to EmptyState (R0 skeleton — no real leaf content).
 *
 * A4 XSS/path-injection defense-in-depth: isValidAgent + isValidSubtab + isValidSubSubTab are
 * whitelist-only guards (shell-routes.ts). ANY input not in the catalog → notFound().
 * Prevents XSS payload rendering, path traversals, prototype pollution at N3.
 *
 * No "use client" — Server Component.
 * Next.js 16 App Router: params is Promise → await before use.
 *
 * spec_anchor: 06-tickets.yaml T-1 · 05-guidelines.md P4 · 03-arch-fe.md § Whitelist guard N3
 * gherkin_coverage: F-NAV-WALK F-EMPTY-STATES F-INVALID-GUARD
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { notFound } from "next/navigation";

import { SubTabContent } from "@/components/shared/shell-organism/SubTabContent";
import { isValidAgent, isValidSubtab, isValidSubSubTab } from "@/lib/routing/shell-routes";

interface PageProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string; subsubtab: string }>;
}

/**
 * N3 sub-sub-tab route — validates the three path segments against the SSoT whitelist
 * and delegates to the SubTabContent dispatcher for the leaf empty-state.
 */
export default async function SubSubtabPage({ params }: PageProps) {
  const { agent, subtab, subsubtab } = await params;

  // Whitelist validation (A4): any invalid segment → 404 contextual (shell chrome intact).
  // Covers: XSS payloads (<script>...), path traversals (../../), SQL fragments, etc.
  if (
    !isValidAgent(agent) ||
    !isValidSubtab(agent, subtab) ||
    !isValidSubSubTab(agent, subtab, subsubtab)
  ) {
    notFound();
  }

  return <SubTabContent agent={agent} subtab={subtab} subsubtab={subsubtab} />;
}
