// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
"use client";
/**
 * IcpEntityLayoutClient.tsx — Client Component for ICP entity detail workspace.
 *
 * Wraps EntityWorkspaceLayout with ICP-specific data fetching.
 * Builds the dynamic leaves list (datos + buyers + "+ buyer") from React Query data.
 *
 * T-FE-1 scope: STRUCTURAL BASE.
 *   - Builds leaves from ICP data (datos leaf + buyer leaves + add affordance)
 *   - Delegates to EntityWorkspaceLayout for the N3 bar + children slot
 *   - useIcp/useBuyers hooks are stubs — wired in T-FE-3 (data hooks story)
 *
 * G2 SSR-safe: store-free — does NOT import useShellStore.
 * The ssr:false boundary lives in ShellOrganismLayout, not here.
 *
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 03-arch-fe.md §2 Client root + data layer + §1 FSD-Lite layout
 * validators_gate: G2 store-free + FSD-Lite boundaries
 * downstream-regression-na: brand-local abel/icp feature; no cross-brand consumers
 */

import { type ReactNode, useMemo } from "react";

import { EntityWorkspaceLayout } from "@/components/shared/shell-organism/EntityWorkspaceLayout";

import type {
  EntitySubNavLeaf,
  EntitySubNavEntity,
} from "@/components/shared/shell-organism/EntitySubNavBar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IcpEntityLayoutClientProps {
  tenantId: string;
  icpId: string;
  rootHref: string;
  rootLabel: string;
  children: ReactNode;
}

// ── Minimal stub types for T-FE-1 structural scaffold ─────────────────────────
// Real types live in features/abel/types/ (wired in T-FE-3)

interface IcpStub {
  id: string;
  label: string;
}

interface BuyerStub {
  id: string;
  name: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * IcpEntityLayoutClient — ICP-specific entity layout client.
 *
 * T-FE-1: structural scaffold with stub data.
 * T-FE-3: replaces stubs with real useIcp/useBuyers React Query hooks.
 *
 * Builds dynamic leaves:
 *   [📋 Datos del ICP] [👤 Buyer 1] [👤 Buyer 2] ... [+ buyer]
 */
export function IcpEntityLayoutClient({
  tenantId,
  icpId,
  rootHref,
  rootLabel,
  children,
}: IcpEntityLayoutClientProps) {
  // T-FE-1 structural scaffold: stub ICP + buyers data.
  // T-FE-3 replaces these stubs with:
  //   const { data: icp, isLoading: icpLoading } = useIcp(icpId);
  //   const { data: buyers = [], isLoading: buyersLoading } = useBuyers(icpId);
  // Using explicit type cast to avoid TS null-narrowing the stub to never
  const icp = null as IcpStub | null; // stub — real data in T-FE-3
  const isLoading = false; // stub — real loading state in T-FE-3

  // Build dynamic leaves: datos + N buyers + "+ buyer" affordance
  // buyers[] stub is inside useMemo to avoid stale closure (react-hooks/exhaustive-deps)
  const leaves: EntitySubNavLeaf[] = useMemo(() => {
    // T-FE-3: replace with real buyers from useBuyers(icpId)
    const stubBuyers: BuyerStub[] = [];
    const basePath = `/${tenantId}/abel/icp/${icpId}`;

    // "Datos del ICP" — the mother entity leaf (always first)
    const datosLeaf: EntitySubNavLeaf = {
      id: "datos",
      label: "Datos del ICP",
      href: `${basePath}/datos`,
    };

    // One leaf per buyer (dynamic — populated from API in T-FE-3)
    const buyerLeaves: EntitySubNavLeaf[] = stubBuyers.map((buyer) => ({
      id: buyer.id,
      label: buyer.name,
      href: `${basePath}/${buyer.id}`,
    }));

    // "+ buyer" add affordance — always last
    const addBuyerLeaf: EntitySubNavLeaf = {
      id: "__add_buyer__",
      label: "+ buyer",
      href: `${basePath}/nuevo-buyer`,
      isAddAffordance: true,
    };

    return [datosLeaf, ...buyerLeaves, addBuyerLeaf];
  }, [tenantId, icpId]);

  // Entity descriptor for EntitySubNavBar
  const entity: EntitySubNavEntity | null = icp ? { id: icp.id, name: icp.label } : null;

  return (
    <EntityWorkspaceLayout
      entity={entity}
      leaves={leaves}
      rootHref={rootHref}
      rootLabel={rootLabel}
      isLoading={isLoading}
    >
      {children}
    </EntityWorkspaceLayout>
  );
}
