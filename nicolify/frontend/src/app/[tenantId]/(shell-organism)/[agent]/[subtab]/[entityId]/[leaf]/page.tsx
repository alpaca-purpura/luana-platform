// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
/**
 * [leaf]/page.tsx — Leaf content for entity detail workspace.
 *
 * Dispatches to leaf-specific components:
 *   - leaf="datos"           → IcpDatosPlaceholder (T-FE-3/T-FE-4 scope)
 *   - leaf="{buyerId}"       → BuyerLeafPlaceholder (T-FE-3/T-FE-4 scope)
 *
 * T-FE-1 scope: STRUCTURAL BASE only.
 * - This page provides the routing plumbing + placeholder content.
 * - T-FE-3 (master list + IcpDatosForm) + T-FE-4 (forms) wire real content.
 *
 * Defense-in-depth (A4):
 *   - leaf validation: only "datos" or UUID-shaped buyerId accepted
 *   - Other leaf values → still render (buyers created dynamically; validation
 *     is done by EntityWorkspaceLayout via ICP + buyer data query, not here)
 *
 * Server Component — no "use client".
 * Next.js 16: params is Promise → await before use.
 *
 * spec_anchor: 03-arch-fe.md §0 Routing + §7 Estados visuales
 * validators_gate: routing leaf dispatch + D3 scope discipline
 * downstream-regression-na: brand-local route; no cross-brand consumers
 */

import { type ReactNode } from "react";

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
 * Leaf content placeholder — T-FE-1 structural scaffold.
 * T-FE-3 replaces IcpDatosPlaceholder with IcpDatosForm.
 * T-FE-4 replaces BuyerLeafPlaceholder with BuyerLeafForm.
 */
export default async function LeafPage({ params }: LeafPageProps): Promise<ReactNode> {
  const { leaf } = await params;

  const isDatosLeaf = leaf === "datos";

  // T-FE-1 structural placeholder — real forms come in T-FE-3/T-FE-4
  return (
    <div className="flex-1 p-6" data-testid={`leaf-content-${leaf}`}>
      <div className="text-sm text-muted-foreground">
        {isDatosLeaf ? (
          <p>
            {/* IcpDatosForm — wired in T-FE-3 */}
            Datos del ICP (disponible en T-FE-3)
          </p>
        ) : (
          <p>
            {/* BuyerLeafForm — wired in T-FE-4 */}
            Buyer {leaf} (disponible en T-FE-4)
          </p>
        )}
      </div>
    </div>
  );
}
