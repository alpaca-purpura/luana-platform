// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-4
"use client";
/**
 * IcpWorkspaceView.tsx — Client root for the ICP entity detail workspace.
 *
 * Decides which leaf to render based on the URL "leaf" param:
 *   - leaf="datos"       → IcpDatosForm
 *   - leaf="{buyerId}"   → BuyerLeafForm
 *
 * Mounts ProposalBanner when ICP origin=draft (RN-3 draft-first: Abel propone,
 * dueño ratifica). Ratificar → PATCH status listo. Descartar → DELETE.
 *
 * Also upgrades IcpEntityLayoutClient by providing real hooks (via its own
 * render cycle with useIcp / useBuyers).
 *
 * RN-3: ProposalBanner visible when icp.origin==="draft" && icp.status==="borrador"
 * RN-11: currency handled via data.avgTicketCurrency ?? useTenantLocale (see IcpDatosForm)
 *
 * G2 SSR-safe: "use client" but NOT the ssr:false boundary. The ssr:false boundary
 * is the shell organism layout. This component is rendered inside the app panel.
 * It subscribes to useIcp and useBuyers for entity-specific data.
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §2 Client root + data layer + §7 Estados visuales
 * validators_gate: RN-3 (propone/ratifica) + ProposalBanner shown on draft
 */

import { useCallback, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProposalBanner } from "@/components/shared/ProposalBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useIcp } from "../../hooks/use-icps";
import { useBuyers } from "../../hooks/use-buyers";
import { useMarkReadyIcp, useDeleteIcp } from "../../hooks/use-icp-mutations";

import { IcpDatosForm } from "./IcpDatosForm";
import { BuyerLeafForm } from "./BuyerLeafForm";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IcpWorkspaceViewProps {
  /** ICP id from the URL [entityId] segment */
  icpId: string;
  /** Active leaf from the URL [leaf] segment */
  leaf: string;
  /** className for the outer wrapper */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * IcpWorkspaceView — workspace view root for ICP entity detail.
 *
 * Handles ProposalBanner (origin=draft, RN-3) and leaf routing (datos / buyerId).
 * All form components beneath this receive the icpId and buyerId they need.
 */
export function IcpWorkspaceView({ icpId, leaf, className }: IcpWorkspaceViewProps) {
  const router = useRouter();
  const params = useParams<{ tenantId?: string }>();
  const tenantId = params.tenantId ?? "";

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: icp, isLoading: icpLoading } = useIcp(icpId);
  const { data: buyers = [] } = useBuyers(icpId);

  // ── Proposal banner actions ───────────────────────────────────────────────
  const markReady = useMarkReadyIcp(icpId);
  const deleteIcp = useDeleteIcp(icpId);

  const handleRatificar = useCallback(async () => {
    try {
      await markReady.mutateAsync();
      toast.success("ICP ratificado y marcado como listo.");
    } catch {
      toast.error("No se pudo ratificar. Verifica que el ICP esté completo.");
    }
  }, [markReady]);

  const handleDescartar = useCallback(async () => {
    try {
      await deleteIcp.mutateAsync();
      toast.success("Borrador descartado.");
      router.push(`/${tenantId}/abel/icp`);
    } catch {
      toast.error("No se pudo descartar el borrador.");
    }
  }, [deleteIcp, router, tenantId]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (icpLoading) {
    return (
      <div className={cn("flex flex-col flex-1 overflow-hidden", className)}>
        <WorkspaceSkeleton />
      </div>
    );
  }

  // ── Error / not found state ───────────────────────────────────────────────
  if (!icp) {
    return (
      <div className={cn("flex flex-col flex-1 overflow-auto p-6", className)}>
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          No se encontró el perfil de cliente ideal. Puede que haya sido eliminado.
        </div>
      </div>
    );
  }

  // ── Proposal banner — show when origin=draft and status=borrador (RN-3) ───
  const showProposalBanner = icp.origin === "draft" && icp.status === "borrador";

  // ── Leaf routing ──────────────────────────────────────────────────────────
  let leafContent: ReactNode;
  if (leaf === "datos") {
    leafContent = <IcpDatosForm icpId={icpId} icp={icp} buyers={buyers} />;
  } else {
    // leaf is a buyerId — validate it's in the buyers list
    const matchedBuyer = buyers.find((b) => b.id === leaf);
    if (!matchedBuyer && buyers.length > 0) {
      // Buyer not found in list — could be a stale URL; show error
      leafContent = (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive m-6"
        >
          No se encontró este buyer. Puede que haya sido eliminado.
        </div>
      );
    } else {
      leafContent = <BuyerLeafForm buyerId={leaf} icpId={icpId} />;
    }
  }

  return (
    <div
      className={cn("flex flex-col flex-1 min-h-0 overflow-hidden", className)}
      data-testid="icp-workspace-view"
    >
      {/* Proposal banner — above content (RN-3 draft-first) */}
      {showProposalBanner && (
        <ProposalBanner
          agentName="Abel"
          onRatificar={() => {
            void handleRatificar();
          }}
          onDescartar={() => {
            void handleDescartar();
          }}
          isRatificando={markReady.isPending}
          isDescartando={deleteIcp.isPending}
        />
      )}

      {/* Leaf content */}
      <div className="flex-1 min-h-0 overflow-auto">{leafContent}</div>
    </div>
  );
}

// ── Workspace skeleton ─────────────────────────────────────────────────────────

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6" aria-busy="true" aria-label="Cargando datos del ICP">
      {/* Banner skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* Group skeletons */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border/40 p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ))}
    </div>
  );
}
