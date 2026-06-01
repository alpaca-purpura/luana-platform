// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
"use client";
/**
 * StaffWorkspaceShell.tsx — Staff workspace layout wrapper.
 *
 * Renders:
 *   1. EntitySubNavBar (sticky) — N3-dynamic nav per D-1
 *   2. Children slot — perfil/horarios/servicios page content
 *
 * Builds leaf hrefs relative to doctor workspace.
 * Derives activeLeaf from current URL pathname.
 *
 * Per ADR-vitalia-004 § 3: Client Component (needs usePathname for active leaf).
 *
 * T-FE-2 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § FSD-Lite + § EntitySubNavBar
 * downstream-regression-na: brand-local vitalia feature component
 */

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { EntitySubNavBar } from "@/components/shared/shell-organism/EntitySubNavBar";
import type { EntitySubNavLeaf } from "@/components/shared/shell-organism/EntitySubNavBar";
import { staffKeys } from "../../../api/staff";
import { fetchClient } from "@/lib/api/fetchClient";
import { useClinicId } from "@/hooks/useClinicId";
import { useTenantId } from "@/hooks/useTenantId";
import type { DoctorDetail } from "../../../types/staff.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8002";

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

  // Build leaf hrefs
  const leaves: EntitySubNavLeaf[] = LEAF_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    href: `/${tenantId}/lisa/staff/${doctorId}/${def.id}`,
  }));

  const activeLeaf = extractLeafFromPath(pathname);

  // Hydrate doctor detail (SSR initialData from layout)
  const { data: doctor } = useQuery({
    queryKey: staffKeys.detail(doctorId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !apiTenantId) throw new Error("Sin autenticación");
      return fetchClient<DoctorDetail>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}`,
        { token, tenantId: apiTenantId, clinicId },
      );
    },
    enabled: isLoaded && !!isSignedIn,
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
    <div className="flex flex-col min-h-full">
      <EntitySubNavBar
        rootHref={`/${tenantId}/lisa/staff`}
        rootLabel="Staff"
        entity={entity}
        leaves={leaves}
        activeLeaf={activeLeaf}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
