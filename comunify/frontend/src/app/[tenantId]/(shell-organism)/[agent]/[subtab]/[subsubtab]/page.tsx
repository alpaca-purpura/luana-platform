// cap: comunify-shell-organism
/**
 * Sub-sub-tab (N3) Page — Server Component.
 * T-shell-fix (2026-06-16) — completes the route tree: the N2 [subtab]/page.tsx
 * redirects sub-tabs WITH N3 leaves to their first leaf (e.g. nina/marca →
 * nina/marca/identidad), but this leaf route did not exist → 404. This page
 * is the missing N3 leaf renderer.
 *
 * Validates [agent] + [subtab] + [subsubtab] against shell-routes.ts SSoT
 * (whitelist-only — A4 XSS/path-injection defense). Any invalid segment → notFound().
 * On valid route → SubTabContent dispatcher (R0 = EmptyState placeholder).
 *
 * No "use client" — Server Component. Next 16: params is a Promise → await.
 *
 * spec_anchor: navigation-tree.md v2 (AGENT_SUBSUBTABS) + 03-arch-fe.md
 * gherkin_coverage: A1 A3 A4 A5
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { notFound } from "next/navigation";

import { SubTabContent } from "@/components/shared/shell-organism/SubTabContent";
import {
  isValidAgent,
  isValidSubSubTab,
  isValidSubtab,
} from "@/lib/routing/shell-routes";

interface PageProps {
  params: Promise<{
    tenantId: string;
    agent: string;
    subtab: string;
    subsubtab: string;
  }>;
}

/**
 * N3 sub-sub-tab leaf route. Validates [agent]+[subtab]+[subsubtab] against the
 * SSoT whitelist, then renders the content dispatcher (R0 = EmptyState).
 */
export default async function SubSubTabPage({ params }: PageProps) {
  const { agent, subtab, subsubtab } = await params;

  // Whitelist validation (A4): any invalid segment → 404 contextual (shell chrome intact).
  if (
    !isValidAgent(agent) ||
    !isValidSubtab(agent, subtab) ||
    !isValidSubSubTab(agent, subtab, subsubtab)
  ) {
    notFound();
  }

  return <SubTabContent agent={agent} subtab={subtab} subsubtab={subsubtab} />;
}
