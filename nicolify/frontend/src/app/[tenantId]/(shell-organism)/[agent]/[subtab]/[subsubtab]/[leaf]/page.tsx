// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1 (wired T-FE-4)
// route-fix: audit iter 3 — moved from [entityId]/[leaf]/page.tsx; param key entityId→subsubtab
/**
 * [subsubtab]/[leaf]/page.tsx — Leaf content for entity detail workspace.
 *
 * ROUTE FIX (audit iter 3, 2026-06-04):
 * ────────────────────────────────────────────────────────────────────────────
 * Moved from `[entityId]/[leaf]/page.tsx` to `[subsubtab]/[leaf]/page.tsx`.
 * The only change is the param key: `entityId` → `subsubtab` (the Next.js
 * segment name). The icpId VALUE is identical — the URL path is unchanged
 * (e.g. /{tenantId}/abel/icp/{icpId}/datos still works as before).
 * Public URLs are NOT affected by this fix.
 *
 * Dispatches to leaf-specific components:
 *   - leaf="datos"           → IcpWorkspaceView → IcpDatosForm
 *   - leaf="{buyerId}"       → IcpWorkspaceView → BuyerLeafForm
 *
 * This page is only reachable when agent==="abel" && subtab==="icp"
 * (enforced by the [subsubtab]/layout.tsx guard above). Non-entity subtabs
 * do not have a [leaf] segment in their routing tree.
 *
 * IcpWorkspaceView internally decides IcpDatosForm vs BuyerLeafForm
 * based on the leaf param.
 *
 * Defense-in-depth (A4):
 *   - leaf validation: only "datos" or UUID-shaped buyerId accepted by
 *     IcpWorkspaceView (which validates against buyers list from API).
 *   - Cross-tenant isolation: ICP + buyer data fetched via tenant-scoped API.
 *
 * Server Component — no "use client".
 * Next.js 16: params is Promise → await before use.
 *
 * spec_anchor: 03-arch-fe.md §0 Routing + §7 Estados visuales (corrected for route-fix)
 * validators_gate: routing leaf dispatch + D3 scope discipline + RN-3 ProposalBanner
 * downstream-regression-na: brand-local route; no cross-brand consumers
 */

import { type ReactNode } from "react";

import { IcpWorkspaceView } from "@/features/abel/components/icp/IcpWorkspaceView";

interface LeafPageProps {
  params: Promise<{
    tenantId: string;
    agent: string;
    subtab: string;
    subsubtab: string;
    leaf: string;
  }>;
}

/**
 * LeafPage — Server Component entry point for entity workspace leaf content.
 *
 * Reads `subsubtab` as icpId (the Next.js segment name unified from R0/R1).
 * Passes icpId and leaf to IcpWorkspaceView (Client Component).
 * IcpWorkspaceView handles:
 *   - ProposalBanner when ICP is a draft proposal (RN-3)
 *   - IcpDatosForm when leaf="datos"
 *   - BuyerLeafForm when leaf="{buyerId}"
 */
export default async function LeafPage({ params }: LeafPageProps): Promise<ReactNode> {
  // subsubtab = icpId (the unified slug name from [subsubtab] segment).
  // The value is identical to R1's old `entityId` — only the param key changed.
  const { subsubtab, leaf } = await params;

  return <IcpWorkspaceView icpId={subsubtab} leaf={leaf} className="flex-1" />;
}
