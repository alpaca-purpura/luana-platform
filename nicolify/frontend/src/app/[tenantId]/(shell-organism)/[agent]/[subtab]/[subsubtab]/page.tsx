// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-sitemap-completo T-1
// route-fix: nicolify-r1-abel-icp-buyer audit iter 3 — merged R0 + R1 dispatch
/**
 * [subsubtab]/page.tsx — Merged R0 nav-leaf + R1 entity-root Server Component.
 *
 * ROUTE FIX (audit iter 3, 2026-06-04):
 * ────────────────────────────────────────────────────────────────────────────
 * R1 originally placed entity root under `[entityId]/page.tsx` (sibling of
 * `[subsubtab]/page.tsx`). Next.js 16 forbids different slug names at the same
 * depth. Fix: merge both behaviors here under the R0 incumbent `[subsubtab]`.
 *
 * Dispatch rules (applied after the [subsubtab]/layout.tsx guard):
 *
 *   1. Entity-bearing (agent==="abel" && subtab==="icp"):
 *      [subsubtab] = icpId. No leaf selected → redirect to first leaf "datos".
 *      This is R1's old `[entityId]/page.tsx` behavior verbatim.
 *      The layout.tsx above already validated agent/subtab/icpId; redirect is
 *      safe here because any invalid path was already notFound()ed in layout.
 *
 *   2. R0 nav-leaf subtabs (all other agent.subtab combinations):
 *      Validate [agent], [subtab], [subsubtab] against SSoT whitelist and
 *      delegate to SubTabContent dispatcher (empty-state leaf rendering).
 *      This is the ORIGINAL R0 logic preserved VERBATIM.
 *
 * A4 XSS/path-injection defense-in-depth:
 *   - R0 branch: isValidAgent + isValidSubtab + isValidSubSubTab whitelist guards
 *     (ANY input not in catalog → notFound).
 *   - R1 branch: icpId already validated UUID-shaped in layout.tsx; redirect only.
 *
 * No "use client" — Server Component.
 * Next.js 16 App Router: params is Promise → await before use.
 *
 * spec_anchor: 06-tickets.yaml T-1 (R0) + 03-arch-fe.md §0 Routing (R1 corrected)
 * gherkin_coverage: F-NAV-WALK F-EMPTY-STATES F-INVALID-GUARD (R0) + entity-root-redirect (R1)
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { notFound, redirect } from "next/navigation";

import { SubTabContent } from "@/components/shared/shell-organism/SubTabContent";
import { isValidAgent, isValidSubtab, isValidSubSubTab } from "@/lib/routing/shell-routes";

interface PageProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string; subsubtab: string }>;
}

/**
 * SubSubtabPage — unified R0 nav-leaf + R1 entity-root page.
 *
 * Entity-bearing subtabs (abel.icp): redirect to first leaf "datos".
 * R0 nav-leaf subtabs: whitelist validate → SubTabContent dispatcher.
 */
export default async function SubSubtabPage({ params }: PageProps) {
  const { tenantId, agent, subtab, subsubtab } = await params;

  // R1 entity-bearing dispatch: abel.icp → redirect to first leaf.
  // layout.tsx above already validated agent/subtab/icpId; redirect is safe.
  if (agent === "abel" && subtab === "icp") {
    redirect(`/${tenantId}/${agent}/${subtab}/${subsubtab}/datos`);
  }

  // R0 nav-leaf branch (verbatim from original [subsubtab]/page.tsx).
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
