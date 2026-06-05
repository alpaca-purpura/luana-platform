// cap: crm.adrian-embudo
// story-origin: vitalia-fase2-adrian-embudo
/**
 * LeadWorkspace — Client root for lead detail pages (V3, opción C).
 * T-FE-3 vitalia-fase2-adrian-embudo
 *
 * Renders EntitySubNavBar (workspace mode) with:
 *   - Back link: [‹ Embudo]
 *   - Entity: masked lead name + stage badge
 *   - Leaf tabs: Resumen · Historial (derived from URL)
 *
 * NO Shadcn Tabs in the body — views are derived from the URL path (spec V3).
 * Children = the active view content (ResumenView or HistorialView).
 *
 * Loading state: skeleton header + content area (spec V3 states).
 * Error/404: "Lead no encontrado" (RN-1, generic message, no info leak).
 *
 * spec_anchor: 03-arch-fe.md § components/embudo/lead + 01-spec.md § V3 D.7/D.8
 * downstream-regression-na: brand-local vitalia FE
 */
"use client";

import { type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EntitySubNavBar,
  type EntitySubNavLeaf,
} from "@/components/shared/shell-organism/EntitySubNavBar";
import { useLeadDetail } from "../../../api/lead";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeadWorkspaceProps {
  tenantId: string;
  leadId: string;
  /** Active leaf tab id: "resumen" | "historial" */
  activeLeaf: "resumen" | "historial";
  children: ReactNode;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WorkspaceSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Cargando datos del lead"
    >
      {/* Nav skeleton */}
      <div className="flex items-center gap-2 h-11 px-4 border-b">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-32" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="p-4 flex flex-col gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-4 text-center">
      <p className="text-lg font-medium">Lead no encontrado</p>
      <p className="text-sm text-muted-foreground">
        Este lead no existe o no tienes acceso a él.
      </p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * LeadWorkspace — wraps lead detail pages with EntitySubNavBar (opción C, spec V3).
 *
 * Fetches lead header data (name, stage) for EntitySubNavBar entity prop.
 * Children render the active view content (Resumen / Historial).
 *
 * Note: EntitySubNavBar is REUSED verbatim from vitalia-fase2-lisa-doctores.
 * The agent-lisa color is used for the active tab highlight (matching doctores).
 */
export function LeadWorkspace({
  tenantId,
  leadId,
  activeLeaf,
  children,
}: LeadWorkspaceProps) {
  const { data, isLoading, isError } = useLeadDetail(leadId);

  // Build leaf tabs (spec V3: Resumen · Historial)
  const leaves: EntitySubNavLeaf[] = [
    {
      id: "resumen",
      label: "Resumen",
      href: `/${tenantId}/adrian/embudo/${leadId}/resumen`,
    },
    {
      id: "historial",
      label: "Historial",
      href: `/${tenantId}/adrian/embudo/${leadId}/historial`,
    },
  ];

  // Build entity for EntitySubNavBar
  // PHI: name is already masked by the BE (format: "María G███")
  const entity = data?.lead
    ? {
        id: data.lead.id,
        name: data.lead.name,
        avatarUrl: null, // leads don't have avatars
      }
    : null;

  return (
    <div className="flex flex-col min-h-0">
      {/* EntitySubNavBar — always rendered (workspace mode, opcion C) */}
      <EntitySubNavBar
        rootHref={`/${tenantId}/adrian/embudo`}
        rootLabel="Embudo"
        entity={isLoading ? null : isError ? null : entity}
        leaves={leaves}
        activeLeaf={isLoading || isError ? null : activeLeaf}
      />
      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <WorkspaceSkeleton />
        ) : isError || data === undefined ? (
          <NotFoundState />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
