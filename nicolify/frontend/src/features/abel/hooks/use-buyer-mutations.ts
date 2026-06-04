// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
"use client";
/**
 * use-buyer-mutations.ts — React Query mutation hooks for Buyer CRUD.
 *
 * Mutations:
 *   useCreateBuyer    → POST /api/v1/abel/icp/{icpId}/buyers  (invalidates buyer list)
 *   usePatchBuyer     → PATCH /api/v1/abel/buyers/{id}        (invalidates buyer list + detail)
 *   useSetPrimaryBuyer→ POST /api/v1/abel/buyers/{id}/set-primary (invalidates buyer list)
 *   useDeleteBuyer    → DELETE /api/v1/abel/buyers/{id}        (invalidates buyer list)
 *
 * Cache invalidation strategy:
 *   - create → invalidate listByIcp (new buyer leaf appears in EntitySubNavBar)
 *   - patch  → invalidate listByIcp (name shown in tab) + detail
 *   - set-primary → invalidate listByIcp (is_primary badge changes)
 *   - delete → invalidate listByIcp (leaf removed from EntitySubNavBar)
 *
 * Token from useAuth().getToken(). TenantId from useParams() — NEVER orgId.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §3 Forms (buyer) + §2 data layer
 * validators_gate: RN-5 (buyer → ICP) + RN-6 (set-primary ≤1)
 */

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import type { Buyer } from "../types/buyer";
import { buyerApi, type BuyerCreatePayload, type BuyerPatchPayload } from "../api/buyer-api";
import { buyerQueryKeys } from "./use-buyers";

// ── Auth + tenant helper ─────────────────────────────────────────────────────

function useAuthContext() {
  const { getToken } = useAuth();
  const params = useParams<{ tenantId?: string }>();
  const tenantId = params.tenantId ?? "";
  return { getToken, tenantId };
}

// ── useCreateBuyer ───────────────────────────────────────────────────────────

/**
 * useCreateBuyer — create a new buyer under an ICP.
 *
 * On success: invalidates ['abel','icp',icpId,'buyers'].
 * The new buyer leaf appears in the EntitySubNavBar (IcpEntityLayoutClient re-fetches).
 */
export function useCreateBuyer(icpId: string) {
  const { getToken, tenantId } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation<Buyer, Error, BuyerCreatePayload>({
    mutationFn: async (payload) => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return buyerApi.create({ token, tenantId }, icpId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyerQueryKeys.listByIcp(icpId) });
    },
  });
}

// ── usePatchBuyer ────────────────────────────────────────────────────────────

/**
 * usePatchBuyer — partial update a buyer field.
 *
 * Used by BuyerLeafForm autosave (debounce 600ms — same cadence as IcpDatosForm).
 * On success: invalidates listByIcp (name may appear in tab) + detail.
 */
export function usePatchBuyer(buyerId: string, icpId: string) {
  const { getToken, tenantId } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation<Buyer, Error, BuyerPatchPayload>({
    mutationFn: async (payload) => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return buyerApi.patch({ token, tenantId }, buyerId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyerQueryKeys.listByIcp(icpId) });
      void queryClient.invalidateQueries({ queryKey: buyerQueryKeys.detail(buyerId) });
    },
  });
}

// ── useSetPrimaryBuyer ───────────────────────────────────────────────────────

/**
 * useSetPrimaryBuyer — set a buyer as the ICP's primary buyer (RN-6 ≤1 primary).
 *
 * Server-side: unsets is_primary on other buyers in the same ICP atomically.
 * On success: invalidates listByIcp (is_primary badge changes across leaves).
 */
export function useSetPrimaryBuyer(buyerId: string, icpId: string) {
  const { getToken, tenantId } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation<Buyer, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return buyerApi.setPrimary({ token, tenantId }, buyerId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyerQueryKeys.listByIcp(icpId) });
      void queryClient.invalidateQueries({ queryKey: buyerQueryKeys.detail(buyerId) });
    },
  });
}

// ── useDeleteBuyer ───────────────────────────────────────────────────────────

/**
 * useDeleteBuyer — soft-delete a buyer.
 *
 * On success: invalidates listByIcp (leaf disappears from EntitySubNavBar).
 */
export function useDeleteBuyer(buyerId: string, icpId: string) {
  const { getToken, tenantId } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return buyerApi.delete({ token, tenantId }, buyerId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyerQueryKeys.listByIcp(icpId) });
    },
  });
}
