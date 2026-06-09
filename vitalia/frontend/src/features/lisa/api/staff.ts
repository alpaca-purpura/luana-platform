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
import { useTenantId } from "@/hooks/useTenantId";
import { fetchClient } from "@/lib/api/fetchClient";
import { useClinicId } from "@/hooks/useClinicId";
import { ME_QUERY_KEY } from "@/hooks/useCurrentUser";
import { useTenantStore } from "@/stores/tenant-store";
import type {
  DoctorListItem,
  DoctorDetail,
  PaginatedDoctors,
  StaffFilters,
} from "../types/staff.types";
import type { DoctorCreateFormValues } from "../types/staff-schema";

// Client-side calls go SAME-ORIGIN relative (`/api/v1/vitalia/...`). The dev-app
// Cloudflare tunnel (deploy/cloudflared/dev-config.yml) routes `^/api/.*` to the
// backend; in prod the same-origin reverse-proxy does. Using the absolute
// `http://localhost:8002` here cross-origins the browser → CORS block on every
// client fetch (regression 2026-06-06: staff directory error-banner despite BE 200;
// only SSR initialData masked it). Server-side fetches live in staff-server.ts and
// keep the absolute NEXT_PUBLIC_API_URL (server-to-server, no CORS). Convention
// matches features/adrian + features/fidelizacion (relative client base).
const API_BASE = "";

/**
 * useStaffActorHeaders — headers for the BE RBAC + audit guard on staff mutations:
 *   - X-User-Role → require_brand_owner_access (staff mutations allow {owner, admin_clinic})
 *   - X-User-ID   → audit actor; the doctors endpoints type it as UUID (users.id)
 *
 * ★ Bug #4 (Chris decision 2026-06-06, option B — targeted, no shared-hook change):
 *
 * 1) ROLE = PER-TENANT role from the tenant store (active clinic's role), NOT the GLOBAL
 *    role from `GET /me`. A user can be `doctor` globally (users.role) yet `owner` of a
 *    specific clinic (user_tenants.role); tenant-scoped RBAC needs the per-tenant role.
 *    The global role sent "doctor" → 403. `/me/tenants` (→ useTenants → tenant-store)
 *    carries the per-tenant role.
 *
 * 2) X-User-ID = the DB user UUID (users.id), NOT the Clerk id. The doctors endpoints
 *    declare `user_id: UUID = Header("X-User-ID")` and use it as the audit actor, so a
 *    Clerk id (`user_…`) 422s ("Input should be a valid UUID"). `GET /me` returns the DB
 *    id (meData.id); useCurrentUser exposes the Clerk id instead, so we read the DB id
 *    from the /me query cache here (same ME_QUERY_KEY → react-query dedupes, no extra call).
 *
 * Both are resolved HERE, scoped to staff mutations, WITHOUT touching the shared
 * useCurrentUser / hasPhiAccess gating. The systemic useCurrentUser per-tenant fix is
 * tracked in a separate carril.
 */
export function useStaffActorHeaders(): Record<string, string> {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const tenantId = useTenantId();
  const tenantRole = useTenantStore(
    (s) =>
      s.availableTenants.find((t) => t.id === tenantId)?.role ??
      s.activeTenant?.role ??
      null,
  );
  // Reuse the /me query cache (same key as useCurrentUser) to read the DB user UUID.
  const meQuery = useQuery<{ id: string }>({
    queryKey: [...ME_QUERY_KEY, tenantId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");
      return fetchClient<{ id: string }>("/api/v1/iam/users/me", {
        token,
        tenantId,
      });
    },
    enabled: isLoaded && isSignedIn === true && Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });
  return {
    "X-User-ID": meQuery.data?.id ?? "",
    "X-User-Role": tenantRole ?? "owner",
  };
}

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
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();

  // SSR initialData seeds ONLY the default (unfiltered, page-1) view. Passing it for
  // every key meant a search/filter key was seeded with the full list AND marked fresh
  // (staleTime 30s) → React Query never fetched the filtered result → the search box
  // did nothing (bug 2026-06-07). Scope initialData to the default filter set so any
  // q/specialty/active/page change is a fresh key that actually hits the BE.
  const isDefaultFilters =
    !filters.q &&
    !filters.specialty &&
    !filters.active &&
    (filters.page ?? 1) === 1;

  return useQuery({
    queryKey: staffKeys.list(filters),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");

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
          tenantId,
          clinicId,
        },
      );
    },
    enabled: isLoaded && !!isSignedIn,
    initialData: isDefaultFilters ? initialData : undefined,
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
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();
  const mutationHeaders = useStaffActorHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateDoctorPayload) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");

      return fetchClient<DoctorDetail>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors`,
        {
          method: "POST",
          token,
          tenantId,
          clinicId,
          headers: mutationHeaders,
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

// ── useDoctor ──────────────────────────────────────────────────────────────────

/**
 * useDoctor — fetches single doctor detail for workspace pages.
 * Hydrated from SSR initialData (layout passes getDoctorInitialState result).
 */
export function useDoctor(
  doctorId: string,
  initialData?: DoctorDetail,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();
  // GET /{id} (detail) REQUIRES X-User-ID (UUID) — audit-on-PHI-read. Without it the
  // BE 422s ("No se pudo cargar el perfil", regression 2026-06-06 bug #5). The list GET
  // does not require it (masked). Reuse the actor headers (X-User-ID DB-UUID + role).
  const actorHeaders = useStaffActorHeaders();

  return useQuery({
    queryKey: staffKeys.detail(doctorId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");
      return fetchClient<DoctorDetail>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}`,
        { token, tenantId, clinicId, headers: actorHeaders },
      );
    },
    // Gate until X-User-ID (from /me) is ready — firing the detail GET before it
    // resolves sends X-User-ID:"" → 422 race ("No se pudo cargar el perfil", bug #5).
    enabled: isLoaded && !!isSignedIn && !!actorHeaders["X-User-ID"],
    initialData,
    staleTime: 30_000,
  });
}

// ── usePatchDoctor ─────────────────────────────────────────────────────────────

export interface PatchDoctorPayload {
  specialty?: string | null;
  phone?: string | null;
  yearsExperience?: number | null;
  languages?: string[];
  visibleEnLanding?: boolean;
  bioInputsNotes?: string | null;
  bioLinks?: string[];
  bioPublic?: {
    resumen?: string | null;
    formacion?: string | null;
    enfoque?: string | null;
  } | null;
  avatarKey?: string | null;
}

/**
 * usePatchDoctor — mutation: PATCH /api/v1/vitalia/clinics/doctors/{id}
 * Used for autosave on-change.
 */
export function usePatchDoctor(doctorId: string) {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();
  const mutationHeaders = useStaffActorHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PatchDoctorPayload) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");
      return fetchClient<DoctorDetail>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}`,
        {
          method: "PATCH",
          token,
          tenantId,
          clinicId,
          headers: mutationHeaders,
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: (updated) => {
      // Update the cache optimistically with the returned data
      queryClient.setQueryData(staffKeys.detail(doctorId), updated);
    },
  });
}

// ── useGenerateBio ─────────────────────────────────────────────────────────────

export interface GenerateBioResponse {
  resumen: string;
  formacion: string;
  enfoque: string;
}

/**
 * useGenerateBio — mutation: POST /api/v1/vitalia/clinics/doctors/{id}/generate-bio
 * Sends bio inputs to BE; returns generated 3-section bio.
 * No-invent guardrail handled by BE service (D-4).
 */
export function useGenerateBio(doctorId: string) {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();
  const mutationHeaders = useStaffActorHeaders();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");
      return fetchClient<GenerateBioResponse>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}/generate-bio`,
        {
          method: "POST",
          token,
          tenantId,
          clinicId,
          headers: mutationHeaders,
          body: JSON.stringify({}),
        },
      );
    },
  });
}

// ── useAvatarUpload ────────────────────────────────────────────────────────────

/**
 * useAvatarUpload — mutation: POST /api/v1/vitalia/clinics/assets/upload (proxy)
 * Per D-3: proxy upload (presigned not implemented in engine).
 * After upload: PATCH doctor {avatarKey}.
 */
export function useAvatarUpload(doctorId: string) {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();
  const mutationHeaders = useStaffActorHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");

      // Step 1: Upload file to assets proxy
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "avatar");

      const uploadUrl = `${API_BASE}/api/v1/vitalia/clinics/assets/upload`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);

      let uploadResponse: Response;
      try {
        uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
            ...(clinicId ? { "X-Clinic-ID": clinicId } : {}),
            ...mutationHeaders,
          },
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!uploadResponse.ok) {
        throw new Error(`Error al subir imagen: ${uploadResponse.status}`);
      }

      const { key, url } = (await uploadResponse.json()) as {
        key: string;
        url: string;
      };

      // Step 2: PATCH doctor with new avatar_key
      await fetchClient<DoctorDetail>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}`,
        {
          method: "PATCH",
          token,
          tenantId,
          clinicId,
          headers: mutationHeaders,
          body: JSON.stringify({ avatar_key: key }),
        },
      );

      return { key, url };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffKeys.detail(doctorId),
      });
    },
  });
}

// ── useAvailabilityBlocks ──────────────────────────────────────────────────────

/**
 * useAvailabilityBlocks — fetches availability blocks for a doctor.
 * Key: ['lisa','staff',id,'blocks']
 * Includes all block kinds (recurrent + one_off).
 * T-FE-3 vitalia-fase2-lisa-doctores
 */
export function useAvailabilityBlocks(doctorId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();

  return useQuery({
    queryKey: staffKeys.blocks(doctorId),
    queryFn: async (): Promise<import("../types/staff.types").AvailabilityBlock[]> => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");
      // BE returns the envelope { blocks: [...] } (AvailabilityBlocksResponse), NOT a
      // bare array — returning it raw made AvailabilityCalendar do `(blocks).filter` on
      // an object → "filter is not a function" crash on the horarios tab (bug #6,
      // 2026-06-06). Unwrap `.blocks`.
      const res = await fetchClient<{
        blocks: import("../types/staff.types").AvailabilityBlock[];
      }>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}/availability-blocks`,
        { token, tenantId, clinicId },
      );
      return res.blocks ?? [];
    },
    enabled: isLoaded && !!isSignedIn && !!doctorId,
    staleTime: 30_000,
  });
}

// ── useCreateBlock ─────────────────────────────────────────────────────────────

export interface CreateBlockPayload {
  kind: "recurrent" | "one_off";
  day_of_week?: number | null;
  start_time: string;
  end_time: string;
  freq?: "weekly" | "biweekly" | null;
  end_condition_kind?: "end_date" | "occurrences" | "open_ended" | null;
  end_date?: string | null;
  occurrences?: number | null;
  specific_date?: string | null;
}

/**
 * useCreateBlock — mutation: POST /api/v1/vitalia/clinics/doctors/{id}/availability-blocks
 * On success: invalidates blocks query so calendar refreshes.
 * Recurrence is resolved by backend via dateutil.rrule (D-2).
 * T-FE-3 vitalia-fase2-lisa-doctores
 */
export function useCreateBlock(doctorId: string) {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();
  const mutationHeaders = useStaffActorHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBlockPayload) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");
      return fetchClient<import("../types/staff.types").AvailabilityBlock>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}/availability-blocks`,
        {
          method: "POST",
          token,
          tenantId,
          clinicId,
          headers: mutationHeaders,
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffKeys.blocks(doctorId),
      });
    },
  });
}

// ── useUpdateBlock ─────────────────────────────────────────────────────────────

export interface UpdateBlockPayload {
  freq?: "weekly" | "biweekly";
  end_condition_kind?: "end_date" | "occurrences" | "open_ended";
  end_date?: string | null;
  occurrences?: number | null;
  start_time?: string;
  end_time?: string;
}

/**
 * useUpdateBlock — mutation: PATCH /api/v1/vitalia/clinics/doctors/{doctorId}/availability-blocks/{blockId}
 * T-FE-3 vitalia-fase2-lisa-doctores
 */
export function useUpdateBlock(doctorId: string) {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();
  const mutationHeaders = useStaffActorHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blockId,
      payload,
    }: {
      blockId: string;
      payload: UpdateBlockPayload;
    }) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");
      return fetchClient<import("../types/staff.types").AvailabilityBlock>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}/availability-blocks/${blockId}`,
        {
          method: "PATCH",
          token,
          tenantId,
          clinicId,
          headers: mutationHeaders,
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffKeys.blocks(doctorId),
      });
    },
  });
}

// ── useDeleteBlock ─────────────────────────────────────────────────────────────

export interface DeleteBlockResponse {
  /** Number of confirmed appointments preserved (SC-3b) */
  preservedAppointments: number;
}

/**
 * useDeleteBlock — mutation: DELETE /api/v1/vitalia/clinics/doctors/{doctorId}/availability-blocks/{blockId}
 * Returns count of preserved confirmed appointments (SC-3b warning).
 * Future availability slots freed; past slots + confirmed appts preserved.
 * T-FE-3 vitalia-fase2-lisa-doctores
 */
export function useDeleteBlock(doctorId: string) {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();
  const mutationHeaders = useStaffActorHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockId: string) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Sin autenticación");
      return fetchClient<DeleteBlockResponse>(
        `${API_BASE}/api/v1/vitalia/clinics/doctors/${doctorId}/availability-blocks/${blockId}`,
        {
          method: "DELETE",
          token,
          tenantId,
          clinicId,
          headers: mutationHeaders,
        },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffKeys.blocks(doctorId),
      });
    },
  });
}

// ── Type re-exports for consumers ──────────────────────────────────────────────

export type { DoctorListItem, DoctorDetail, PaginatedDoctors };
