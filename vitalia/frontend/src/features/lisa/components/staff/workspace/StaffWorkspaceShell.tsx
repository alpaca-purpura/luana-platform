// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
"use client";
/**
 * StaffWorkspaceShell.tsx — Staff workspace layout wrapper.
 *
 * Renders:
 *   1. EntityWorkspaceLayout (@luana/ui-kit) — N3 canon ribbon + content slot
 *   2. Children slot — perfil/horarios/servicios page content
 *
 * Builds leaf hrefs relative to doctor workspace.
 * activeLeaf passed explicitly (vitalia uses static leaf segments, not [leaf] param).
 *
 * Per ADR-vitalia-004 § 3: Client Component (needs usePathname for active leaf).
 * MIGRATED to @luana/ui-kit EntityWorkspaceLayout (vitalia-shell-core-hardening T-5).
 *
 * T-FE-2 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § FSD-Lite + § EntitySubNavBar
 * downstream-regression-na: brand-local vitalia feature component
 */

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { EntityWorkspaceLayout } from "@luana/ui-kit";
import type { EntitySubNavLeaf } from "@luana/ui-kit";
import { staffKeys, useStaffActorHeaders } from "../../../api/staff";
import { fetchClient } from "@/lib/api/fetchClient";
import { useClinicId } from "@/hooks/useClinicId";
import { useTenantId } from "@/hooks/useTenantId";
import type { DoctorDetail } from "../../../types/staff.types";

// Client component: SAME-ORIGIN relative base (tunnel/reverse-proxy routes /api/* → BE).
// Absolute http://localhost:8002 cross-origins the browser → CORS block. See staff.ts note
// + regression 2026-06-06 (staff workspace refetch CORS-broken; masked by SSR initialData).
const API_BASE = "";

interface StaffWorkspaceShellProps {
  tenantId: string;
  doctorId: string;
  initialDoctor?: DoctorDetail;
  children: React.ReactNode;
}

const LEAF_DEFS = [
  { id: "perfil", label: "Perfil" },
  { id: "horarios", label: "Horarios" },
  { id: "servicios", label: "Servicios" },
] as const;

/**
 * Extracts the active leaf from the URL pathname.
 * Pattern: /{tenantId}/lisa/staff/{doctorId}/{leaf}
 * Used as activeLeaf override since vitalia uses static leaf segments (not [leaf] param).
 */
function extractLeafFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  // [0]=tenantId, [1]=lisa, [2]=staff, [3]=doctorId, [4]=leaf
  return segments[4] ?? null;
}

export function StaffWorkspaceShell({
  tenantId,
  doctorId,
  initialDoctor,
  children,
}: StaffWorkspaceShellProps) {
  const pathname = usePathname();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const clinicId = useClinicId();
  // tenantId from useTenantId() for API calls (UUID from publicMetadata.tenant_id).
  // The prop tenantId is used for URL routing only — may differ from the API tenant UUID.
  const apiTenantId = useTenantId();
  // GET /{id} (detail) requires X-User-ID (UUID) — audit-on-PHI-read. Without it → 422
  // ("No se pudo cargar el perfil", bug #5). Same key as useDoctor → keep headers consistent.
  const actorHeaders = useStaffActorHeaders();

  // Build leaf hrefs
  const leaves: EntitySubNavLeaf[] = LEAF_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    href: `/${tenantId}/lisa/staff/${doctorId}/${def.id}`,
  }));

  // Vitalia uses static leaf segments (/perfil, /horarios, /servicios) — not [leaf] dynamic
  // param. Pass explicitly as override so EntityWorkspaceLayout resolves the active tab.
  const activeLeaf = extractLeafFromPath(pathname);

  // Hydrate doctor detail (SSR initialData from layout)
  const { data: doctor, isLoading: isDoctorLoading } = useQuery({
    queryKey: staffKeys.detail(doctorId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !apiTenantId) throw new Error("Sin autenticación");
      return fetchClient<DoctorDetail>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}`,
        { token, tenantId: apiTenantId, clinicId, headers: actorHeaders },
      );
    },
    // Gate until X-User-ID (from /me) is ready — see useDoctor (bug #5 race).
    enabled: isLoaded && !!isSignedIn && !!actorHeaders["X-User-ID"],
    initialData: initialDoctor,
    staleTime: 30_000,
  });

  const entity = doctor
    ? {
        id: doctor.id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        avatarUrl: doctor.avatarUrl ?? null,
      }
    : null;

  return (
    <EntityWorkspaceLayout
      rootHref={`/${tenantId}/lisa/staff`}
      rootLabel="Staff"
      entity={entity}
      leaves={leaves}
      activeLeaf={activeLeaf}
      isLoading={isDoctorLoading && !initialDoctor}
    >
      {children}
    </EntityWorkspaceLayout>
  );
}
