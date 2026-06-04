// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
"use client";
/**
 * use-icp-mutations.ts — React Query mutation hooks for ICP CRUD.
 *
 * Mutations:
 *   useCreateIcp    → POST /api/v1/abel/icp          (invalidates list)
 *   usePatchIcp     → PATCH /api/v1/abel/icp/{id}    (invalidates list + detail)
 *   useMarkReadyIcp → POST /api/v1/abel/icp/{id}/mark-ready (invalidates detail)
 *   useDeleteIcp    → DELETE /api/v1/abel/icp/{id}   (invalidates list)
 *
 * Cache invalidation strategy:
 *   - create → invalidate list (new ICP appears)
 *   - patch  → invalidate list + detail (name/status may appear in list)
 *   - mark-ready → invalidate list (status borrador→listo) + detail
 *   - delete → invalidate list (ICP disappears)
 *
 * Token from useAuth().getToken(). TenantId from useParams() — NEVER orgId.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §3 Forms → autosave 600ms + mark-ready
 * validators_gate: RN-7 (label unique 409) + RN-8 (mark-ready 422 missing[])
 */

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTenantId } from "@/hooks/use-tenant-id";
import { icpApi } from "../api/icp-api";
import { icpQueryKeys } from "./use-icps";
import type { IcpCreatePayload, IcpPatchPayload, Icp } from "../types/icp";

// ── Auth + tenant helper ─────────────────────────────────────────────────────

function useAuthContext() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  // UUID from publicMetadata — NOT the URL slug (slug → 422 on BE)
  const tenantId = useTenantId();
  return { getToken, isLoaded, isSignedIn, tenantId };
}

// ── useCreateIcp ─────────────────────────────────────────────────────────────

/**
 * useCreateIcp — create a new ICP (blank form path — "Lo armo yo").
 *
 * On success: invalidates ['abel','icp','list'].
 */
export function useCreateIcp() {
  const { getToken, tenantId } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation<Icp, Error, IcpCreatePayload>({
    mutationFn: async (payload) => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return icpApi.create({ token, tenantId }, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: icpQueryKeys.list() });
    },
  });
}

// ── usePatchIcp ──────────────────────────────────────────────────────────────

/**
 * usePatchIcp — partial update an ICP field.
 *
 * Used by IcpDatosForm autosave (debounce 600ms).
 * On success: invalidates list (label may show in card) + detail.
 */
export function usePatchIcp(icpId: string) {
  const { getToken, tenantId } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation<Icp, Error, IcpPatchPayload>({
    mutationFn: async (payload) => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return icpApi.patch({ token, tenantId }, icpId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: icpQueryKeys.list() });
      void queryClient.invalidateQueries({ queryKey: icpQueryKeys.detail(icpId) });
    },
  });
}

// ── useMarkReadyIcp ──────────────────────────────────────────────────────────

/**
 * useMarkReadyIcp — mark an ICP as "listo" (validates minimum — RN-8).
 *
 * On 422: API throws with body {missing: string[]}.
 *   Caller shows inline message: "Para marcarlo listo falta: ángulo de venta y al menos un buyer con rol."
 * On success: invalidates list + detail.
 */
export function useMarkReadyIcp(icpId: string) {
  const { getToken, tenantId } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation<Icp, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return icpApi.markReady({ token, tenantId }, icpId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: icpQueryKeys.list() });
      void queryClient.invalidateQueries({ queryKey: icpQueryKeys.detail(icpId) });
    },
  });
}

// ── useDeleteIcp ─────────────────────────────────────────────────────────────

/**
 * useDeleteIcp — soft-delete an ICP.
 *
 * On success: invalidates list (ICP disappears from grid).
 */
export function useDeleteIcp(icpId: string) {
  const { getToken, tenantId } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return icpApi.delete({ token, tenantId }, icpId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: icpQueryKeys.list() });
    },
  });
}
