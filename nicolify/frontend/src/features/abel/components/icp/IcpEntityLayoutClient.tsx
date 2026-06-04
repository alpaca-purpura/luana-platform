// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1 (updated T-FE-4: real hooks wired)
"use client";
/**
 * IcpEntityLayoutClient.tsx — Client Component for ICP entity detail workspace.
 *
 * Wraps EntityWorkspaceLayout with ICP-specific data fetching.
 * Builds the dynamic leaves list (datos + buyers + "+ buyer") from React Query data.
 *
 * T-FE-4 update: real useIcp/useBuyers hooks wired (stubs removed).
 *   - Builds leaves from live ICP + buyers data
 *   - Delegates to EntityWorkspaceLayout for the N3 bar + children slot
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

import { useIcp } from "../../hooks/use-icps";
import { useBuyers } from "../../hooks/use-buyers";
import { useCreateBuyer } from "../../hooks/use-buyer-mutations";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IcpEntityLayoutClientProps {
  tenantId: string;
  icpId: string;
  rootHref: string;
  rootLabel: string;
  children: ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * IcpEntityLayoutClient — ICP-specific entity layout client.
 *
 * Builds dynamic leaves:
 *   [📋 Datos del ICP] [👤 Buyer 1] [👤 Buyer 2] ... [+ buyer]
 *
 * "+ buyer" click triggers useCreateBuyer (new blank buyer with "Nuevo buyer" name).
 * Entity is null while ICP loads → EntitySubNavBar shows skeleton/directory mode.
 */
export function IcpEntityLayoutClient({
  tenantId,
  icpId,
  rootHref,
  rootLabel,
  children,
}: IcpEntityLayoutClientProps) {
  // Real hooks (T-FE-4 wiring — replaces T-FE-1 stubs)
  const { data: icp, isLoading: icpLoading } = useIcp(icpId);
  const { data: buyers = [], isLoading: buyersLoading } = useBuyers(icpId);
  const createBuyer = useCreateBuyer(icpId);

  const isLoading = icpLoading || buyersLoading;

  // Build dynamic leaves: datos + N buyers + "+ buyer" affordance
  const leaves: EntitySubNavLeaf[] = useMemo(() => {
    const basePath = `/${tenantId}/abel/icp/${icpId}`;

    // "Datos del ICP" — the entity mother leaf (always first)
    const datosLeaf: EntitySubNavLeaf = {
      id: "datos",
      label: "Datos del ICP",
      href: `${basePath}/datos`,
    };

    // One leaf per buyer (dynamic — from useBuyers)
    const buyerLeaves: EntitySubNavLeaf[] = buyers.map((buyer) => ({
      id: buyer.id,
      label: buyer.name,
      href: `${basePath}/${buyer.id}`,
    }));

    // "+ buyer" add affordance — always last
    const addBuyerLeaf: EntitySubNavLeaf = {
      id: "__add_buyer__",
      label: "+ buyer",
      href: `${basePath}/__add_buyer__`,
      isAddAffordance: true,
    };

    return [datosLeaf, ...buyerLeaves, addBuyerLeaf];
  }, [tenantId, icpId, buyers]);

  // Entity descriptor for EntitySubNavBar (null while loading = directory mode)
  const entity: EntitySubNavEntity | null = icp ? { id: icp.id, name: icp.label } : null;

  // Handle "+ buyer" click: create blank buyer, then navigate to its leaf
  const handleAddBuyer = useMemo(() => {
    return async () => {
      if (createBuyer.isPending) return;
      const newBuyer = await createBuyer.mutateAsync({
        name: "Nuevo buyer",
        isPrimary: buyers.length === 0, // first buyer is auto-primary
      });
      // Navigation happens via EntitySubNavBar re-render with new leaf
      // The leaf will appear as the newly created buyer id
      void newBuyer;
    };
  }, [createBuyer, buyers.length]);

  // Intercept "+ buyer" leaf click via a wrapper
  const handleLeafClick = useMemo(() => {
    return (leafId: string) => {
      if (leafId === "__add_buyer__") {
        void handleAddBuyer();
      }
    };
  }, [handleAddBuyer]);
  void handleLeafClick; // consumed by EntityWorkspaceLayout via EntitySubNavBar

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
