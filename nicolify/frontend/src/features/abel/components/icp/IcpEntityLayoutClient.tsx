// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1 (updated T-FE-4: real hooks wired; T-FE-4 auto-fix iter 1: onAddAffordance wired)
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
 * Auto-fix iter 1 (SC-add-buyer + RN-5):
 *   - "+ buyer" affordance now routes via onAddAffordance callback, NOT href nav
 *   - Affordance leaf has empty href (never navigated to directly)
 *   - handleAddBuyer: calls useCreateBuyer.mutateAsync → on success navigates to new buyer leaf
 *   - Dead __add_buyer__ href removed from leaf definition
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

import { type ReactNode, useMemo, useCallback } from "react";

import { useRouter } from "next/navigation";

import { useIcp } from "../../hooks/use-icps";
import { useBuyers } from "../../hooks/use-buyers";
import { useCreateBuyer } from "../../hooks/use-buyer-mutations";

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
  const router = useRouter();

  // Real hooks (T-FE-4 wiring — replaces T-FE-1 stubs)
  const { data: icp, isLoading: icpLoading } = useIcp(icpId);
  const { data: buyers = [], isLoading: buyersLoading } = useBuyers(icpId);
  const createBuyer = useCreateBuyer(icpId);

  const isLoading = icpLoading || buyersLoading;

  // Build dynamic leaves: datos + N buyers + "+ buyer" affordance
  // NOTE: the add-affordance leaf href is intentionally empty string — it is NEVER
  // navigated to via router.push. EntitySubNavBar will call onAddAffordance instead
  // (auto-fix iter 1: removes the dead __add_buyer__ route).
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

    // "+ buyer" add affordance — always last.
    // href is empty string: navigation is handled by onAddAffordance callback,
    // not by router.push(href). EntitySubNavBar.onClick routes affordance clicks
    // to onAddAffordance when provided.
    const addBuyerLeaf: EntitySubNavLeaf = {
      id: "__add_buyer__",
      label: "+ buyer",
      href: "",
      isAddAffordance: true,
    };

    return [datosLeaf, ...buyerLeaves, addBuyerLeaf];
  }, [tenantId, icpId, buyers]);

  // Entity descriptor for EntitySubNavBar (null while loading = directory mode)
  const entity: EntitySubNavEntity | null = icp ? { id: icp.id, name: icp.label } : null;

  // Handle "+ buyer" click: create blank buyer → navigate to its new leaf (RN-5).
  // This callback is passed to EntityWorkspaceLayout → EntitySubNavBar → onAddAffordance.
  // EntitySubNavBar calls it instead of router.push(href) for the affordance leaf.
  const handleAddBuyer = useCallback(async () => {
    if (createBuyer.isPending) return;
    const newBuyer = await createBuyer.mutateAsync({
      name: "Nuevo buyer",
      isPrimary: buyers.length === 0, // first buyer is auto-primary
    });
    // Navigate to the newly-created buyer's leaf so it appears active immediately.
    // Guard: newBuyer.id must be present (server always returns created entity with id).
    if (newBuyer?.id) {
      const newLeafPath = `/${tenantId}/abel/icp/${icpId}/${newBuyer.id}`;
      router.push(newLeafPath);
    }
  }, [createBuyer, buyers.length, tenantId, icpId, router]);

  // Stable wrapper for the async handler (avoids floating promise lint warning)
  const onAddAffordance = useCallback(() => {
    void handleAddBuyer();
  }, [handleAddBuyer]);

  return (
    <EntityWorkspaceLayout
      entity={entity}
      leaves={leaves}
      rootHref={rootHref}
      rootLabel={rootLabel}
      isLoading={isLoading}
      onAddAffordance={onAddAffordance}
    >
      {children}
    </EntityWorkspaceLayout>
  );
}
