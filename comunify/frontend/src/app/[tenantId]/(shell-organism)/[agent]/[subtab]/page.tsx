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

import { notFound } from "next/navigation";

import { SubTabContent } from "@/components/shared/shell-organism/SubTabContent";
import { isValidAgent, isValidSubtab } from "@/lib/routing/shell-routes";

interface PageProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string }>;
}

/**
 * N2 sub-tab route. Validates [agent]+[subtab] against the SSoT whitelist,
 * then renders the N2 content dispatcher (R0 = EmptyState placeholder).
 *
 * NOTE (T-shell-fix 2026-06-16): the previous version did an IN-RENDER
 * `redirect()` to the first N3 leaf when the sub-tab had N3 leaves. That fired
 * the Next 16 soft-nav "Rendered more hooks than during the previous render"
 * crash (learning 2026-06-03-next16-softnav-redirect-rendered-more-hooks) →
 * the page failed to load (500). Removed: the N2 page renders directly; N3
 * leaves are reachable via their own route ([subsubtab]/page.tsx) + SubSubTabsBar.
 * If "auto-land on first N3 leaf" is wanted later, do it at the EDGE (proxy.ts),
 * never via redirect() in-render (same fix vitalia applied platform-wide).
 */
export default async function SubtabPage({ params }: PageProps) {
  const { agent, subtab } = await params;

  // Whitelist validation (A4): any invalid segment → 404 contextual (shell chrome intact).
  if (!isValidAgent(agent) || !isValidSubtab(agent, subtab)) {
    notFound();
  }

  return <SubTabContent agent={agent} subtab={subtab} />;
}
