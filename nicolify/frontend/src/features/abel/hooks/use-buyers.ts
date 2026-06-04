// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
"use client";
/**
 * use-buyers.ts — React Query hooks for Buyer list and detail.
 *
 * Query keys:
 *   useBuyers → ['abel', 'icp', icpId, 'buyers']
 *   useBuyer  → ['abel', 'buyer', id]
 *
 * Buyers are always scoped to an ICP (FK icp_id — RN-5).
 * Token from useAuth().getToken(). TenantId from useParams() — NEVER orgId.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §1 hooks/use-buyers.ts
 * validators_gate: RN-5 (buyer scoped to ICP) + RQ keys
 */

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { buyerApi } from "../api/buyer-api";
import type { Buyer, BuyerListItem } from "../types/buyer";

// ── Query key factory ────────────────────────────────────────────────────────

export const buyerQueryKeys = {
  /** Key for all buyers under an ICP. Invalidated on create/delete. */
  listByIcp: (icpId: string) => ["abel", "icp", icpId, "buyers"] as const,
  /** Key for a single buyer detail. */
  detail: (id: string) => ["abel", "buyer", id] as const,
} as const;

// ── useBuyers ────────────────────────────────────────────────────────────────

/**
 * useBuyers — list all buyers for a given ICP.
 *
 * RQ key: ['abel', 'icp', icpId, 'buyers']
 * Returns lightweight BuyerListItem[] for the EntitySubNavBar leaf tabs.
 *
 * Usage:
 * ```tsx
 * const { data: buyers = [], isLoading } = useBuyers(icpId);
 * ```
 */
export function useBuyers(
  icpId: string | null,
): ReturnType<typeof useQuery<BuyerListItem[], Error>> {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const params = useParams<{ tenantId?: string }>();
  const tenantId = params.tenantId ?? "";

  return useQuery<BuyerListItem[], Error>({
    queryKey: icpId ? buyerQueryKeys.listByIcp(icpId) : ["abel", "buyer", "__none__"],
    queryFn: async () => {
      if (!icpId) throw new Error("Sin ICP id");
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return buyerApi.listByIcp({ token, tenantId }, icpId);
    },
    enabled: isLoaded && isSignedIn === true && icpId !== null && tenantId.length > 0,
    staleTime: 30_000,
  });
}

// ── useBuyer ─────────────────────────────────────────────────────────────────

/**
 * useBuyer — get full buyer detail by id.
 *
 * RQ key: ['abel', 'buyer', id]
 * Used by BuyerLeafForm.
 *
 * Usage:
 * ```tsx
 * const { data: buyer, isLoading } = useBuyer(buyerId);
 * ```
 */
export function useBuyer(buyerId: string | null): ReturnType<typeof useQuery<Buyer, Error>> {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const params = useParams<{ tenantId?: string }>();
  const tenantId = params.tenantId ?? "";

  return useQuery<Buyer, Error>({
    queryKey: buyerId ? buyerQueryKeys.detail(buyerId) : ["abel", "buyer", "__none__"],
    queryFn: async () => {
      if (!buyerId) throw new Error("Sin buyer id");
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return buyerApi.get({ token, tenantId }, buyerId);
    },
    enabled: isLoaded && isSignedIn === true && buyerId !== null && tenantId.length > 0,
    staleTime: 30_000,
  });
}
