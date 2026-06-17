// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1 (updated T-FE-4: real hooks wired; T-FE-4 auto-fix iter 1: onAddAffordance wired; audit iter 4: F-1 404 notFound)
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
 * Audit iter 4 (F-1 — DoD #37 live-verify gate):
 *   - useIcp 404 → notFound() (cross-tenant or invalid UUID → shell shows contextual 404, never hangs)
 *   - Fixes SC-adversarial-tenant + RN-1: cross-tenant UUID must 404 at UI level, never
 *     leave the user stuck on <main aria-label="Cargando shell"> forever.
 *   - ApiError.status === 404 → notFound() (renders [subsubtab]/not-found.tsx via Next.js)
 *   - Any other API error is re-thrown → propagates to the route-level error boundary.
 *
 * G2 SSR-safe: store-free — does NOT import useShellStore.
 * The ssr:false boundary lives in ShellOrganismLayout, not here.
 *
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 03-arch-fe.md §0 §2 Client root + data layer + §1 FSD-Lite layout
 * validators_gate: G2 store-free + FSD-Lite boundaries + SC-adversarial-tenant (RN-1)
 * downstream-regression-na: brand-local abel/icp feature; no cross-brand consumers
 */

import { type ReactNode, useMemo, useCallback } from "react";

import { useRouter, notFound } from "next/navigation";

import { ApiError } from "@/lib/api/fetch-client";

import { useIcp } from "../../hooks/use-icps";
import { useBuyers } from "../../hooks/use-buyers";
import { useCreateBuyer } from "../../hooks/use-buyer-mutations";

import { EntityWorkspaceLayout } from "@luana/ui-kit";
import type { EntitySubNavLeaf, EntitySubNavEntity } from "@luana/ui-kit";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IcpEntityLayoutClientProps {
  tenantId: string;
  icpId: string;
  rootHref: string;
  rootLabel: string;
  children: ReactNode;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * B1 fix: deterministic buyer avatar colors (G3 JIT-safe — static class strings, no templates).
 * Buyers rotate through a palette of agent-color backgrounds for leaf-av circles.
 * These are the same agent-color tokens defined in globals.css/@theme.
 * Module-level constant to avoid re-creation on every render (react-perf).
 */
const BUYER_AVATAR_BG_CLASSES = [
  "bg-agent-christian",
  "bg-agent-brenda",
  "bg-agent-sara",
  "bg-agent-norvil",
  "bg-agent-luana",
  "bg-agent-abel",
  "bg-agent-config",
] as const;

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
  const { data: icp, isLoading: icpLoading, error: icpError } = useIcp(icpId);
  const { data: buyers = [], isLoading: buyersLoading } = useBuyers(icpId);
  const createBuyer = useCreateBuyer(icpId);

  // F-1 fix (audit iter 4): ICP not found (404) or cross-tenant access → render notFound().
  // notFound() from next/navigation can be called in Client Components — Next.js App Router
  // catches the thrown NEXT_NOT_FOUND error and renders the nearest not-found.tsx boundary
  // ([subsubtab]/not-found.tsx), preserving the shell chrome (TopBar + Ribbon).
  //
  // This prevents the infinite loading state (the bug): when the BE returns 404 for an
  // invalid/cross-tenant UUID, useIcp transitions from isLoading→error, not isLoading→data.
  // Without this guard the component stayed in loading state forever (isLoading never false
  // via data, data never resolves, entity stays null, shell shows <main aria-label="Cargando shell">).
  //
  // Any non-404 error is re-thrown to the nearest Error Boundary.
  if (icpError !== null && icpError !== undefined) {
    if (icpError instanceof ApiError && icpError.status === 404) {
      notFound();
    }
    // Non-404 error: re-throw to the route-level error boundary.
    throw icpError;
  }

  const isLoading = icpLoading || buyersLoading;

  // Build dynamic leaves: datos + N buyers + "+ buyer" affordance
  // NOTE: the add-affordance leaf href is intentionally empty string — it is NEVER
  // navigated to via router.push. EntitySubNavBar will call onAddAffordance instead
  // (auto-fix iter 1: removes the dead __add_buyer__ route).
  const leaves: EntitySubNavLeaf[] = useMemo(() => {
    const basePath = `/${tenantId}/abel/icp/${icpId}`;

    // "Datos del ICP" — the entity mother leaf (always first)
    // B1 fix: prefixEmoji 📋 distinguishes the entity-mother leaf from buyer leaves
    const datosLeaf: EntitySubNavLeaf = {
      id: "datos",
      label: "Datos del ICP",
      href: `${basePath}/datos`,
      prefixEmoji: "📋",
    };

    // One leaf per buyer (dynamic — from useBuyers)
    // B1 fix: colored leaf-av avatar + ★ star for primary buyer
    const buyerLeaves: EntitySubNavLeaf[] = buyers.map((buyer, idx) => ({
      id: buyer.id,
      label: buyer.name,
      href: `${basePath}/${buyer.id}`,
      avatarBgClass: BUYER_AVATAR_BG_CLASSES[idx % BUYER_AVATAR_BG_CLASSES.length],
      isPrimary: buyer.isPrimary,
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
  // B1 fix: entity icon 🎯 renders entitynav-entity-icon circle per mockup
  const entity: EntitySubNavEntity | null = icp
    ? { id: icp.id, name: icp.label, icon: "🎯" }
    : null;

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
