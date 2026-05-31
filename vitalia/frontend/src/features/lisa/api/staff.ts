// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * staff.ts — React Query hooks for Lisa Staff sub-tab.
 *
 * Hooks:
 *   - useStaffList(filters) — paginated doctor list (masked PHI)
 *   - useCreateDoctor() — mutation: POST /doctors
 *
 * React Query key convention:
 *   ['lisa','staff','list',filters] — list
 *   ['lisa','staff',id]             — detail (T-FE-2)
 *   ['lisa','staff',id,'blocks']    — availability blocks (T-FE-3)
 *
 * Auth pattern: useAuth() → getToken() + orgId → fetchClient(token, tenantId, clinicId).
 * HIPAA-lite: clinicId injected via useClinicId() (X-Clinic-ID header).
 *
 * T-FE-1 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § Data layer + § React Query keys
 * downstream-regression-na: brand-local vitalia FE API; no cross-brand consumers
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { fetchClient } from "@/lib/api/fetchClient";
import { useClinicId } from "@/hooks/useClinicId";
import type {
  DoctorListItem,
  DoctorDetail,
  PaginatedDoctors,
  StaffFilters,
} from "../types/staff.types";
import type { DoctorCreateFormValues } from "../types/staff-schema";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8002";

// ── Query key factory ──────────────────────────────────────────────────────────

export const staffKeys = {
  all: ["lisa", "staff"] as const,
  lists: () => [...staffKeys.all, "list"] as const,
  list: (filters: StaffFilters) => [...staffKeys.lists(), filters] as const,
  details: () => [...staffKeys.all, "detail"] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
  blocks: (id: string) => [...staffKeys.detail(id), "blocks"] as const,
};

// ── useStaffList ───────────────────────────────────────────────────────────────

export interface UseStaffListOptions {
  filters: StaffFilters;
  initialData?: PaginatedDoctors;
}

/**
 * useStaffList — fetches paginated staff directory.
 * Hydrated from SSR initialData (no refetch on mount when SSR data is fresh).
 */
export function useStaffList({ filters, initialData }: UseStaffListOptions) {
  const { getToken, isLoaded, isSignedIn, orgId } = useAuth();
  const clinicId = useClinicId();

  return useQuery({
    queryKey: staffKeys.list(filters),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !orgId) throw new Error("Sin autenticación");

      const params = new URLSearchParams();
      params.set("page", String(filters.page ?? 1));
      params.set("page_size", "24");
      if (filters.q) params.set("q", filters.q);
      if (filters.specialty) params.set("specialty", filters.specialty);
      if (filters.active === "true" || filters.active === "false") {
        params.set("active", filters.active);
      }

      return fetchClient<PaginatedDoctors>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors?${params.toString()}`,
        {
          token,
          tenantId: orgId,
          clinicId,
        },
      );
    },
    enabled: isLoaded && !!isSignedIn,
    initialData,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      // SC-7: network failure — retry up to 2 times, surface error after
      const isNetworkError = error instanceof TypeError;
      return isNetworkError && failureCount < 2;
    },
  });
}

// ── useCreateDoctor ────────────────────────────────────────────────────────────

export interface CreateDoctorPayload {
  first_name: string;
  last_name: string;
  dni: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  credential: string;
  credential_country: string;
  active: boolean;
}

/**
 * Maps RHF camelCase form values → snake_case API payload.
 */
export function mapDoctorCreateToPayload(
  values: DoctorCreateFormValues,
): CreateDoctorPayload {
  return {
    first_name: values.firstName,
    last_name: values.lastName,
    dni: values.dni,
    email: values.email,
    phone: values.phone || null,
    specialty: values.specialty || null,
    credential: values.credential,
    credential_country: values.credentialCountry,
    active: values.active,
  };
}

/**
 * useCreateDoctor — mutation: POST /api/v1/vitalia/clinics/doctors
 * On success: invalidates list queries so directory refreshes.
 * On 422: caller surfaces inline credential error.
 * On 409: caller surfaces "Ya existe un doctor con ese documento" toast.
 */
export function useCreateDoctor() {
  const { getToken, orgId } = useAuth();
  const clinicId = useClinicId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateDoctorPayload) => {
      const token = await getToken();
      if (!token || !orgId) throw new Error("Sin autenticación");

      return fetchClient<DoctorDetail>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors`,
        {
          method: "POST",
          token,
          tenantId: orgId,
          clinicId,
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: () => {
      // Invalidate all list queries so directory refreshes
      void queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
}

// ── Type re-exports for consumers ──────────────────────────────────────────────

export type { DoctorListItem, DoctorDetail, PaginatedDoctors };
