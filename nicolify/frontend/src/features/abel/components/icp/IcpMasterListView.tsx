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

import { useCallback, useState } from "react";

import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

import { DraftFirstStarter } from "@/components/shared/DraftFirstStarter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useIcps } from "../../hooks/use-icps";
import { useCreateIcp } from "../../hooks/use-icp-mutations";
import { useAbelUiStore } from "../../store/abel-ui-store";
import { IcpCard } from "./IcpCard";

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

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="flex-1 overflow-auto p-6"
        aria-busy="true"
        aria-label="Cargando perfiles de cliente ideal"
        data-testid="icp-master-loading"
      >
        <IcpGridSkeleton />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center gap-4"
        data-testid="icp-master-error"
        role="alert"
      >
        <div className="text-4xl" aria-hidden="true">
          ⚠️
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          No se pudieron cargar los perfiles de cliente. Verifica tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={() => void refetch()}
          className={cn(
            "text-sm text-agent-abel hover:underline",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
          )}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ── Empty state (0 ICPs) ────────────────────────────────────────────────────

  if (!icps || icps.length === 0) {
    return (
      <div className="flex-1 overflow-auto" data-testid="icp-master-empty">
        <DraftFirstStarter
          onGenerateDraft={handleGenerateDraft}
          onStartBlank={handleStartBlank}
          agentName="Abel"
        />
      </div>
    );
  }

  // ── List state (≥1 ICP) ────────────────────────────────────────────────────

  return (
    <div
      className="flex-1 overflow-auto p-6"
      data-testid="icp-master-list"
      aria-label={`${icps.length} perfiles de cliente ideal`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Perfiles de cliente ideal</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {icps.length === 1 ? "1 perfil" : `${icps.length} perfiles`}
          </p>
        </div>

        {/* Add new ICP button */}
        <button
          onClick={handleGenerateDraft}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            "px-3 py-1.5 rounded-md",
            "bg-agent-abel text-white hover:bg-agent-abel/90",
            "transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
          data-testid="icp-master-add-btn"
        >
          <span aria-hidden="true">✨</span>
          Nuevo ICP
        </button>
      </div>

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
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

/** IcpGridSkeleton — placeholder while ICPs load (3 cards) */
function IcpGridSkeleton() {
  return (
    <div
      className={cn("grid gap-3", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-border/40">
          <div className="flex items-start justify-between">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-3 w-16 mt-auto" />
        </div>
      ))}
    </div>
  );
}
