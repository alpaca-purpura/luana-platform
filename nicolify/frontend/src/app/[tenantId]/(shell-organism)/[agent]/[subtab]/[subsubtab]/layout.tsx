// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
// route-fix: audit iter 3 — unified [subsubtab] layout (was [entityId]/layout.tsx)
/**
 * [subsubtab]/layout.tsx — Server Component layout for the 3rd dynamic segment.
 *
 * ROUTE FIX (audit iter 3, 2026-06-04):
 * ────────────────────────────────────────────────────────────────────────────
 * R1 originally placed entity detail under a SIBLING `[entityId]/` directory,
 * which conflicts with R0's `[subsubtab]/` at the same position.
 * Next.js 16 forbids two different slug names at the same depth:
 *   "You cannot use different slug names for the same dynamic path
 *    ('entityId' !== 'subsubtab')"
 * Fix: consolidate both under the R0 incumbent `[subsubtab]`; absorb R1's
 * entity-detail behavior here via a dispatch on agent/subtab combination.
 *
 * Dispatch rules:
 *   - agent === "abel" && subtab === "icp" (entity-bearing):
 *       Validate that [subsubtab] is UUID-shaped (opaque icpId), then mount
 *       EntityWorkspaceLayout with icpId = the `subsubtab` param.
 *       Children = the [leaf] page (IcpDatosForm / BuyerLeafForm).
 *   - All other combinations (R0 nav-leaf subtabs — christian.propuestas,
 *       norvil.fidelizacion, abel.oferta, etc.):
 *       Pass-through `{children}` unchanged. R0 had NO layout at this level;
 *       this branch preserves that invariant exactly.
 *
 * Defense-in-depth (A4):
 *   - Validates agent/subtab via shell-routes SSoT whitelist.
 *   - Validates that non-entity subtabs do NOT reach the entity workspace
 *     (notFound for non-entity agent.subtab combos with UUID-shaped 3rd segment).
 *   - For entity-bearing route: validates subsubtab is UUID-shaped string.
 *   - Cross-tenant isolation: ICP data validation happens in IcpEntityLayoutClient
 *     via React Query (tenant-scoped API). Server layout only guards route shape.
 *
 * Server Component default — no "use client" on this file.
 * Next.js 16 App Router: params is Promise → await before use.
 *
 * spec_anchor: 03-arch-fe.md §0 Routing (corrected for route-fix)
 * validators_gate: A4 whitelist + tenant isolation + boot-clean (no slug conflict)
 * downstream-regression-na: brand-local route; no cross-brand consumers
 */

import { notFound } from "next/navigation";
import { type ReactNode } from "react";

import { IcpEntityLayoutClient } from "@/features/abel/components/icp/IcpEntityLayoutClient";
import { isValidAgent, isValidSubtab } from "@/lib/routing/shell-routes";

interface SubsubtabLayoutProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string; subsubtab: string }>;
  children: ReactNode;
}

/**
 * SubsubtabLayout — unified layout for the 3rd dynamic path segment.
 *
 * Entity-bearing (abel.icp): mounts IcpEntityLayoutClient workspace.
 * R0 nav-leaf subtabs: transparent pass-through (no layout wrapping).
 */
export default async function SubsubtabLayout({ params, children }: SubsubtabLayoutProps) {
  const { tenantId, agent, subtab, subsubtab } = await params;

  // Whitelist guard (A4): only valid agent + subtab combinations reach this layout.
  if (!isValidAgent(agent) || !isValidSubtab(agent, subtab)) {
    notFound();
  }

  // Entity-bearing dispatch: abel.icp uses this level as an entity workspace.
  if (agent === "abel" && subtab === "icp") {
    // subsubtab = icpId (UUID-shaped). Opaque ID safety check.
    // Full data validation + cross-tenant isolation happens in IcpEntityLayoutClient
    // via React Query (client). Server layout guards the route shape only.
    const isUuidShaped = /^[0-9a-f-]{8,64}$/i.test(subsubtab);
    if (!isUuidShaped) {
      notFound();
    }

    return (
      <IcpEntityLayoutClient
        tenantId={tenantId}
        icpId={subsubtab}
        rootHref={`/${tenantId}/abel/icp`}
        rootLabel="ICPs"
      >
        {children}
      </IcpEntityLayoutClient>
    );
  }

  // R0 nav-leaf subtabs (christian.propuestas, norvil.fidelizacion, abel.oferta, etc.):
  // No layout needed at this level — pass children through unchanged.
  // R0 had no [subsubtab]/layout.tsx; this preserves that behavioral invariant.
  return <>{children}</>;
}
