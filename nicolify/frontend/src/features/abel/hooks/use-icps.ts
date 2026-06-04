// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
"use client";
/**
 * use-icps.ts — React Query hooks for ICP list and detail.
 *
 * Query keys:
 *   useIcps   → ['abel', 'icp', 'list']
 *   useIcp    → ['abel', 'icp', id]
 *
 * Both hooks are tenant-aware:
 *   - token from useAuth().getToken()
 *   - tenantId from useParams() — NEVER useAuth().orgId (no-clerk-organizations rule)
 *
 * Enabled only when Clerk is loaded + user is signed in.
 * Error boundaries handle API errors at the route level.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §1 hooks/use-icps.ts
 * validators_gate: RN-1 (tenant isolation) + RQ keys ['abel','icp','list'] / ['abel','icp',id]
 */

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { icpApi } from "../api/icp-api";
import type { Icp, IcpListItem } from "../types/icp";

// ── Query key factory ────────────────────────────────────────────────────────

export const icpQueryKeys = {
  /** Key for the full ICP list. Invalidated on create/delete/extract-done. */
  list: () => ["abel", "icp", "list"] as const,
  /** Key for a single ICP detail. Invalidated on patch/mark-ready. */
  detail: (id: string) => ["abel", "icp", id] as const,
} as const;

// ── useIcps ─────────────────────────────────────────────────────────────────

/**
 * useIcps — list all ICPs for the current tenant.
 *
 * RQ key: ['abel', 'icp', 'list']
 * Returns lightweight IcpListItem[] (no full payload — SC-large perf).
 *
 * Usage:
 * ```tsx
 * const { data: icps = [], isLoading, error } = useIcps();
 * ```
 */
export function useIcps(): ReturnType<typeof useQuery<IcpListItem[], Error>> {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const params = useParams<{ tenantId?: string }>();
  const tenantId = params.tenantId ?? "";

  return useQuery<IcpListItem[], Error>({
    queryKey: icpQueryKeys.list(),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return icpApi.list({ token, tenantId });
    },
    enabled: isLoaded && isSignedIn === true && tenantId.length > 0,
    staleTime: 30_000,
  });
}

// ── useIcp ───────────────────────────────────────────────────────────────────

/**
 * useIcp — get full ICP detail by id.
 *
 * RQ key: ['abel', 'icp', id]
 * Used by the detail workspace (IcpDatosForm).
 *
 * Usage:
 * ```tsx
 * const { data: icp, isLoading, error } = useIcp(icpId);
 * ```
 */
export function useIcp(icpId: string | null): ReturnType<typeof useQuery<Icp, Error>> {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const params = useParams<{ tenantId?: string }>();
  const tenantId = params.tenantId ?? "";

  return useQuery<Icp, Error>({
    queryKey: icpId ? icpQueryKeys.detail(icpId) : ["abel", "icp", "__none__"],
    queryFn: async () => {
      if (!icpId) throw new Error("Sin ICP id");
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      if (!tenantId) throw new Error("Sin tenant");
      return icpApi.get({ token, tenantId }, icpId);
    },
    enabled: isLoaded && isSignedIn === true && icpId !== null && tenantId.length > 0,
    staleTime: 30_000,
  });
}
