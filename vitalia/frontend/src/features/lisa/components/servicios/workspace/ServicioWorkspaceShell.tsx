// cap: lisa.servicios
// story-origin: vitalia-fase2-lisa-servicios T-7 + T-R3
"use client";
/**
 * ServicioWorkspaceShell.tsx — N3 workspace shell for a single servicio.
 *
 * Wraps EntityWorkspaceLayout (@luana/ui-kit) with the 5 servicio leaves.
 * Root pill "‹ Servicios" navigates back to the catalog; EntityPicker ▾ lets
 * the user switch between servicios without leaving the workspace.
 *
 * Leaf segments (static, NOT [leaf] dynamic):
 *   resumen | para-adrian | doctores | plan-pago | prueba-social
 *
 * NOTE: The "Especialistas" leaf uses the route segment "doctores" (not
 * "especialistas" as written in 03-arch-fe.md §1). The locked test wins —
 * segment ≠ label by design (doctors are the specialists in vitalia).
 * Upstream deficiency logged in T-7-impl-log.md § Upstream deficiency.
 *
 * Catalog detail is NOT PHI (RN-13) → X-Tenant-ID only, no clinic gate.
 * SSR seeds initialData so the workspace renders without a fetch flash.
 */

import { type ReactNode } from "react";
import { EntityWorkspaceLayout, EntityPicker } from "@luana/ui-kit";
import {
  useServicioDetail,
  useServicioPickerSearchFn,
  useActivateServicio,
  type ServicioPickerItem,
} from "../../../api/servicios";
import { ServiceStatusBar } from "../ServiceStatusBar";
import { KnowledgeSourcesPanel } from "../KnowledgeSourcesPanel";
import { useRouter, usePathname } from "next/navigation";

/**
 * Extracts the active leaf from the URL pathname for static-segment routes.
 * Pattern: /{tenantId}/lisa/servicios/{offerId}/{leaf}
 * segments: [0]=tenantId, [1]=lisa, [2]=servicios, [3]=offerId, [4]=leaf
 */
function extractLeafFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  return segments[4] ?? null;
}

// ── Leaf catalog (static, lock-stepped with route folders) ───────────────────
// Segment "doctores" intentionally differs from label "Especialistas".
// See 03-arch-fe.md discrepancy note above.

const SERVICIO_LEAVES = [
  { id: "resumen", label: "Resumen", segment: "resumen" },
  { id: "para-adrian", label: "Para Adrián", segment: "para-adrian" },
  { id: "doctores", label: "Especialistas", segment: "doctores" },
  { id: "plan-pago", label: "Plan de pago", segment: "plan-pago" },
  { id: "prueba-social", label: "Prueba social", segment: "prueba-social" },
] as const;

type LeafId = (typeof SERVICIO_LEAVES)[number]["id"];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ServicioWorkspaceShellProps {
  /** Current tenant (never useAuth().orgId — see tenant-isolation.md) */
  tenantId: string;
  /** Offer-id of the servicio being viewed */
  offerId: string;
  /** SSR seed — hydrates the detail query without a fetch flash on first paint */
  initialServicio?: import("../../../types/servicios.types").ServiceDetail;
  /** Active leaf id (derived from the static route segment, e.g., "resumen") */
  activeLeaf?: LeafId | null;
  /** Leaf page content */
  children: ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServicioWorkspaceShell({
  tenantId,
  offerId,
  initialServicio,
  activeLeaf: activeLeafProp,
  children,
}: ServicioWorkspaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive activeLeaf from URL when not explicitly provided (static-segment routes).
  // Prop takes priority (e.g., test fixtures, layout SSR context).
  const activeLeaf =
    activeLeafProp !== undefined ? activeLeafProp : extractLeafFromPath(pathname);

  // Detail query — SSR-seeded so first paint is immediate.
  const { data: servicio, isLoading } = useServicioDetail({
    offerId,
    initialData: initialServicio,
  });

  // Activate/deactivate mutation (AC-19: switch never blocked by empty fields).
  const { mutate: toggleActive, isPending: isToggling } = useActivateServicio();
  const handleToggleActive = (isActive: boolean) => {
    toggleActive({ offerId, isActive });
  };

  // EntityPicker search fn — stable ref (latest-ref pattern in the hook).
  const pickerSearchFn = useServicioPickerSearchFn();

  // Root-pill destination → catalog grid.
  const rootHref = `/${tenantId}/lisa/servicios`;

  // Build leaf hrefs from static segments (NOT [leaf] dynamic routes).
  const leaves = SERVICIO_LEAVES.map((leaf) => ({
    id: leaf.id,
    label: leaf.label,
    href: `/${tenantId}/lisa/servicios/${offerId}/${leaf.segment}`,
  }));

  // EntityPicker → navigate to the selected servicio workspace (resumen leaf).
  const handlePickerSelect = (item: ServicioPickerItem) => {
    router.push(`/${tenantId}/lisa/servicios/${item.id}/resumen`);
  };

  // Entity descriptor for the SubNavBar identity slot.
  const entity = servicio
    ? { id: servicio.offer_id, name: servicio.public_name }
    : null;

  return (
    <EntityWorkspaceLayout
      entity={entity}
      leaves={leaves}
      rootHref={rootHref}
      rootLabel="Servicios"
      isLoading={isLoading && !initialServicio}
      activeLeaf={activeLeaf}
      entityIdentitySlot={
        <EntityPicker<ServicioPickerItem>
          searchFn={pickerSearchFn}
          value={entity ?? undefined}
          onChange={handlePickerSelect}
          placeholder="Buscar servicio…"
        />
      }
    >
      {servicio && (
        <ServiceStatusBar
          servicio={servicio}
          onToggleActive={handleToggleActive}
          isToggling={isToggling}
        />
      )}
      {children}
      {/* ── KnowledgeSourcesPanel — persistent cross-leaf (C.2.4) ──────────
          Mounted here so it survives leaf navigation (not per-leaf).
          Native <details> collapsible per mockup (no extra Radix dep).
          extract-only in Sub-phase A (RAG blocked behind /pm-luana). */}
      <details className="mx-5 mb-6 rounded-lg border bg-card" open={false}>
        <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50">
          <span>Fuentes de conocimiento</span>
          <span className="ml-auto text-xs text-muted-foreground">Lisa puede leer documentos para completar la ficha</span>
        </summary>
        <div className="border-t px-4 py-3">
          <KnowledgeSourcesPanel offerId={offerId} />
        </div>
      </details>
    </EntityWorkspaceLayout>
  );
}
