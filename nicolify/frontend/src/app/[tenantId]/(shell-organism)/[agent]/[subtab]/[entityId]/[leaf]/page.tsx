// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1 (wired T-FE-4)
/**
 * [leaf]/page.tsx — Leaf content for entity detail workspace.
 *
 * Dispatches to leaf-specific components:
 *   - leaf="datos"           → IcpWorkspaceView → IcpDatosForm
 *   - leaf="{buyerId}"       → IcpWorkspaceView → BuyerLeafForm
 *
 * T-FE-4 scope: Real IcpWorkspaceView component wired.
 * IcpWorkspaceView internally decides IcpDatosForm vs BuyerLeafForm
 * based on the leaf param.
 *
 * Defense-in-depth (A4):
 *   - leaf validation: only "datos" or UUID-shaped buyerId accepted by
 *     IcpWorkspaceView (which validates against buyers list from API)
 *   - Cross-tenant isolation: ICP + buyer data fetched via tenant-scoped API
 *
 * Server Component — no "use client".
 * Next.js 16: params is Promise → await before use.
 *
 * spec_anchor: 03-arch-fe.md §0 Routing + §7 Estados visuales
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
    entityId: string;
    leaf: string;
  }>;
}

/**
 * LeafPage — Server Component entry point for entity workspace leaf content.
 *
 * Passes icpId and leaf to IcpWorkspaceView (Client Component).
 * IcpWorkspaceView handles:
 *   - ProposalBanner when ICP is a draft proposal (RN-3)
 *   - IcpDatosForm when leaf="datos"
 *   - BuyerLeafForm when leaf="{buyerId}"
 */
export default async function LeafPage({ params }: LeafPageProps): Promise<ReactNode> {
  const { entityId, leaf } = await params;

  return <IcpWorkspaceView icpId={entityId} leaf={leaf} className="flex-1" />;
}
