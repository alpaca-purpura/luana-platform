// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
"use client";
/**
 * IcpMasterListView.tsx — Master list view for ICP & buyer (Abel).
 *
 * This is the "abel.icp" sub-tab content. Registered via SubTabContent dispatcher.
 *
 * States:
 *   - loading  → skeleton grid (3 cards)
 *   - empty    → DraftFirstStarter (2-path: Abel lo arma / Lo armo yo)
 *   - list (≥1 ICP) → grid of IcpCard components
 *   - error    → inline error banner with retry
 *
 * "generar" path → opens UniversalIntake overlay (Abel te arma un borrador)
 * "Lo armo yo" path → navigates to create-icp form (manual start)
 *
 * SC-large: 200 ICPs → CSS grid + windowing-ready layout.
 * For very large lists (>200 items) the grid scrolls natively within the shell
 * overflow-auto container. Full virtualization (react-virtual) is T-FE-4+ scope.
 *
 * G2 SSR-safe: useStoreHydration called here (ssr:false boundary in ShellOrganismLayout).
 * Store not subscribed before hydration.
 *
 * G3 JIT-safe: uses _agent-tw-classes.ts — no template literals in class strings.
 *
 * CONN Registration: SubTabContent.tsx maps "abel.icp" → <IcpMasterListView />.
 *   This is the NOTARIZED registration point for this capability.
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §2 Client root + data layer + §7 Estados visuales
 * validators_gate: RN-2 (draft-first) + SC-empty + SC-large
 */

import { PageContainer, PageHeader, ListPageSkeleton, ErrorState } from "@luana/ui-kit";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { DraftFirstStarter } from "@/components/shared/DraftFirstStarter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCreateIcp } from "../../hooks/use-icp-mutations";
import { useIcps } from "../../hooks/use-icps";
import { useAbelUiStore } from "../../store/abel-ui-store";

import { IcpCard } from "./IcpCard";
import { IcpIntakeOverlay } from "./IcpIntakeOverlay";

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * IcpMasterListView — Abel ICP & buyer master list.
 *
 * Hydrates React Query on mount. State machine:
 *   loading → skeleton | empty → DraftFirstStarter | list → IcpCard grid | error → banner
 */
export function IcpMasterListView() {
  const router = useRouter();
  const params = useParams<{ tenantId?: string }>();
  const tenantId = params.tenantId ?? "";

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: icps, isLoading, error, refetch } = useIcps();

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createIcp = useCreateIcp();

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [isStartingBlank, setIsStartingBlank] = useState(false);

  // ── Store (G2 SSR-safe — called after ssr:false boundary) ─────────────────
  const setIntakeOverlayOpen = useAbelUiStore((s) => s.setIntakeOverlayOpen);

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Path A: "Abel lo arma" → open UniversalIntake overlay */
  const handleGenerateDraft = useCallback(() => {
    setIntakeOverlayOpen(true);
  }, [setIntakeOverlayOpen]);

  /**
   * Path B: "Lo armo yo" → create a blank ICP then navigate to its detail.
   *
   * Draft-first: creates with label "Nuevo ICP" (minimum required field),
   * then navigates to the datos leaf so the user fills the rest inline.
   * NEVER push a literal `/nuevo` route (not UUID-shaped → SSR-404).
   */
  const handleStartBlank = useCallback(async () => {
    if (isStartingBlank) return; // debounce — prevent double-submit
    setIsStartingBlank(true);
    try {
      const created = await createIcp.mutateAsync({ label: "Nuevo ICP" });
      router.push(`/${tenantId}/abel/icp/${created.id}/datos`);
    } catch {
      toast.error("No se pudo crear. Intenta de nuevo.");
    } finally {
      setIsStartingBlank(false);
    }
  }, [createIcp, isStartingBlank, router, tenantId]);

  // ── Overlay — mounted once, self-gates on store flag ─────────────────────
  // IcpIntakeOverlay reads intakeOverlayOpen from store and renders the
  // UniversalIntake Dialog only when the flag is true. It covers BOTH empty
  // and list states by being rendered at the component root (before branches).
  //
  // NOTE: We use a wrapper div pattern instead of React.Fragment so we can
  // return conditional JSX from early-return branches while still having the
  // overlay available in all states.

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <IcpIntakeOverlay />
        <PageContainer
          className="flex-1 overflow-auto"
          aria-busy="true"
          aria-label="Cargando perfiles de cliente ideal"
          data-testid="icp-master-loading"
        >
          <ListPageSkeleton rows={6} />
        </PageContainer>
      </>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <>
        <IcpIntakeOverlay />
        <PageContainer className="flex-1 overflow-auto" data-testid="icp-master-error" role="alert">
          <ErrorState
            message="No se pudieron cargar los perfiles de cliente. Revisa tu conexión."
            onRetry={() => void refetch()}
          />
        </PageContainer>
      </>
    );
  }

  // ── Empty state (0 ICPs) ────────────────────────────────────────────────────

  if (!icps || icps.length === 0) {
    return (
      <>
        <IcpIntakeOverlay />
        <PageContainer className="flex-1 overflow-auto" data-testid="icp-master-empty">
          <DraftFirstStarter
            onGenerateDraft={handleGenerateDraft}
            onStartBlank={handleStartBlank}
            agentName="Abel"
          />
        </PageContainer>
      </>
    );
  }

  // ── List state (≥1 ICP) ────────────────────────────────────────────────────

  return (
    <>
      <IcpIntakeOverlay />
      <PageContainer
        className="flex-1 overflow-auto"
        data-testid="icp-master-list"
        aria-label={`${icps.length} perfiles de cliente ideal`}
      >
        {/* Header */}
        <PageHeader
          title="Perfiles de cliente ideal"
          subtitle={icps.length === 1 ? "1 perfil" : `${icps.length} perfiles`}
          actions={
            <Button
              onClick={handleGenerateDraft}
              className="bg-agent-abel text-white hover:bg-agent-abel/90"
              data-testid="icp-master-add-btn"
              size="sm"
            >
              <span aria-hidden="true">✨</span>
              Nuevo ICP
            </Button>
          }
          className="mb-6"
        />

        {/* ICP grid — CSS grid, SC-large: 200 ICPs scroll natively */}
        <ul
          className={cn("grid gap-3", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}
          aria-label="Lista de perfiles de cliente ideal"
          data-testid="icp-card-grid"
        >
          {icps.map((icp) => (
            <li key={icp.id}>
              <IcpCard icp={icp} />
            </li>
          ))}
        </ul>
      </PageContainer>
    </>
  );
}
