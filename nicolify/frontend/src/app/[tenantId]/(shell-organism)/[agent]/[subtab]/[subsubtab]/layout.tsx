// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
// route-fix: audit iter 3 — unified [subsubtab] layout (was [entityId]/layout.tsx)
// audit-iter-5: BUG-1 SSR-404 gate — server-side ICP existence check
// audit-iter-8: BUG-2 tenant-id slug→UUID — SSR uses UUID from publicMetadata, not URL slug
/**
 * [subsubtab]/layout.tsx — Server Component layout for the 3rd dynamic segment.
 *
 * ROUTE FIX (audit iter 3, 2026-06-04):
 * ────────────────────────────────────────────────────────────────────────────
 * R1 originally placed entity detail under a SIBLING `[entityId]/` directory,
 * which conflicts with R0's `[subsubtab]/` at the same position.
 * Next.js 16 forbids two different slug names at the same depth:
 *   "You cannot use different slug names for the same dynamic path
 *    ('entityId' !== 'subsubtab')"
 * Fix: consolidate both under the R0 incumbent `[subsubtab]`; absorb R1's
 * entity-detail behavior here via a dispatch on agent/subtab combination.
 *
 * Dispatch rules:
 *   - agent === "abel" && subtab === "icp" (entity-bearing):
 *       (0) BUG-2 TENANT-ID FIX (audit iter 8, 2026-06-04):
 *           The URL `[tenantId]` segment is the tenant SLUG (e.g. "alpaca-purpura"),
 *           NOT the UUID. The BE expects X-Tenant-ID to be the UUID.
 *           We resolve the UUID server-side from Clerk session claims / publicMetadata
 *           BEFORE calling icpApi.get. Using the slug → 422 on BE (proven live).
 *       (1) SERVER-SIDE ICP existence check (BUG-1 SSR-404 gate):
 *           Fetches GET /api/v1/abel/icp/{icpId} from the BE via Clerk JWT + UUID.
 *           404 → notFound() SERVER-SIDE (reliable — always renders not-found.tsx).
 *           Non-404 error → propagate (error boundary catches it).
 *           This is the REAL cross-tenant defense: the server check happens before
 *           any client hydration, preventing console.error leaks + infinite spinners.
 *       (2) Mount IcpEntityLayoutClient for the workspace chrome.
 *           The client React Query fetch for live data is kept as secondary layer
 *           (real-time updates), but is NOT the primary 404 gate.
 *   - All other combinations (R0 nav-leaf subtabs — christian.propuestas,
 *       norvil.fidelizacion, abel.oferta, etc.):
 *       Pass-through `{children}` unchanged. R0 had NO layout at this level;
 *       this branch preserves that invariant exactly.
 *
 * Defense-in-depth (A4 + BUG-1 + BUG-2):
 *   - Validates agent/subtab via shell-routes SSoT whitelist.
 *   - For entity-bearing route: validates subsubtab is UUID-shaped string.
 *   - Resolves tenant UUID from Clerk publicMetadata (NEVER from URL slug).
 *   - SERVER-SIDE ICP existence/tenant check with UUID (primary 404 gate — BUG-1 fix).
 *   - Client-side notFound() in IcpEntityLayoutClient as secondary backstop.
 *
 * Server Component default — no "use client" on this file.
 * Next.js 16 App Router: params is Promise → await before use.
 *
 * spec_anchor: 03-arch-fe.md §0 Routing (corrected for route-fix + BUG-1 SSR gate + BUG-2 tenant UUID)
 * validators_gate: A4 whitelist + SSR-404 (BUG-1) + tenant-UUID (BUG-2) + boot-clean
 * downstream-regression-na: brand-local route; no cross-brand consumers
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";

import { icpApi } from "@/features/abel/api/icp-api";
import { IcpEntityLayoutClient } from "@/features/abel/components/icp/IcpEntityLayoutClient";
import { isValidAgent, isValidSubtab } from "@/lib/routing/shell-routes";

// ── Server-side UUID resolution ────────────────────────────────────────────────

interface TenantPublicMetadata {
  tenant_id?: string;
  tenant_slug?: string;
}

/**
 * Resolves the tenant UUID (not slug) for the current server request.
 *
 * Strategy: (1) JWT session claims (fast path, available if template includes it);
 * (2) Clerk user fetch server-side (reliable — always has publicMetadata).
 * Returns null if the UUID cannot be resolved (unauthenticated / metadata missing).
 *
 * Why not reuse resolvePrimaryTenantId()? That helper returns the slug (tenant_slug
 * field) for URL routing. Here we need tenant_id (UUID) for BE API headers.
 */
async function resolveTenantUuid(
  userId: string | null,
  sessionClaims: Record<string, unknown> | null | undefined,
): Promise<string | null> {
  // Fast path: tenant_id in session JWT claims
  const claimMeta = (sessionClaims?.metadata ?? sessionClaims?.publicMetadata) as
    | TenantPublicMetadata
    | undefined;
  const claimUuid = claimMeta?.tenant_id;
  if (claimUuid && typeof claimUuid === "string") return claimUuid;

  // Reliable path: fetch from Clerk (always has publicMetadata)
  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const meta = user.publicMetadata as TenantPublicMetadata;
      if (meta?.tenant_id && typeof meta.tenant_id === "string") return meta.tenant_id;
    } catch {
      // If Clerk fetch fails, we cannot proceed — return null to trigger notFound()
    }
  }
  return null;
}

interface SubsubtabLayoutProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string; subsubtab: string }>;
  children: ReactNode;
}

/**
 * SubsubtabLayout — unified layout for the 3rd dynamic path segment.
 *
 * Entity-bearing (abel.icp): SSR-404 gate + IcpEntityLayoutClient workspace.
 * R0 nav-leaf subtabs: transparent pass-through (no layout wrapping).
 */
export default async function SubsubtabLayout({ params, children }: SubsubtabLayoutProps) {
  const { tenantId, agent, subtab, subsubtab } = await params;

  // Whitelist guard (A4): only valid agent + subtab combinations reach this layout.
  if (!isValidAgent(agent) || !isValidSubtab(agent, subtab)) {
    notFound();
  }

  // Entity-bearing dispatch: abel.icp uses this level as an entity workspace.
  if (agent === "abel" && subtab === "icp") {
    // subsubtab = icpId (UUID-shaped). Opaque ID safety check.
    const isUuidShaped = /^[0-9a-f-]{8,64}$/i.test(subsubtab);
    if (!isUuidShaped) {
      notFound();
    }

    // BUG-2 + BUG-1 GATE: resolve UUID + server-side ICP existence + tenant check.
    //
    // BUG-2 (audit iter 8, 2026-06-04):
    //   The URL `[tenantId]` segment is the human-readable SLUG (e.g. "alpaca-purpura"),
    //   NOT the UUID. The BE expects X-Tenant-ID to be the UUID tenant_id.
    //   Passing the slug here → 422 on the BE (identical bug to the client hooks).
    //   Fix: resolve the UUID from Clerk session claims / publicMetadata server-side.
    //
    // BUG-1 (audit iter 5):
    //   Server-side notFound() is BEFORE hydration → no console.error leak + no infinite
    //   spinner. Client-side notFound() in IcpEntityLayoutClient is the secondary backstop.
    //
    // Error handling:
    //   - UUID not resolvable → notFound() (auth state inconsistent)
    //   - getToken() returns null → notFound() (Clerk middleware should prevent this)
    //   - 404 ApiError → notFound() (renders [subsubtab]/not-found.tsx — shell intact)
    //   - non-404 error → throw (propagates to error boundary)
    const { getToken, userId, sessionClaims } = await auth();
    const token = await getToken();
    if (!token) {
      // Should not happen (Clerk middleware protects [tenantId]/** routes),
      // but guard defensively to avoid passing null token to the API.
      notFound();
    }

    // BUG-2 FIX: resolve the tenant UUID (not the URL slug) before calling the API.
    const tenantUuid = await resolveTenantUuid(userId, sessionClaims);
    if (!tenantUuid) {
      // Tenant UUID not available — user metadata may be incomplete.
      notFound();
    }

    try {
      // Fetch the ICP server-side to validate existence + tenant scoping.
      // Uses X-Tenant-ID = tenantUuid (UUID, not slug) — BE validates ownership.
      // NOTE: we only confirm existence — the returned Icp data is discarded.
      // IcpEntityLayoutClient re-fetches it client-side for live updates.
      await icpApi.get({ token, tenantId: tenantUuid }, subsubtab);
    } catch (err: unknown) {
      // 404 from the BE: ICP doesn't exist or belongs to another tenant.
      // Server-side notFound() is reliable — no client flash.
      if (
        err !== null &&
        typeof err === "object" &&
        "status" in err &&
        (err as { status: number }).status === 404
      ) {
        notFound();
      }
      // Non-404 (e.g. 500, network error) → re-throw to the error boundary.
      throw err;
    }

    return (
      <IcpEntityLayoutClient
        tenantId={tenantId}
        icpId={subsubtab}
        rootHref={`/${tenantId}/abel/icp`}
        rootLabel="ICPs"
      >
        {children}
      </IcpEntityLayoutClient>
    );
  }

  // R0 nav-leaf subtabs (christian.propuestas, norvil.fidelizacion, abel.oferta, etc.):
  // No layout needed at this level — pass children through unchanged.
  // R0 had no [subsubtab]/layout.tsx; this preserves that behavioral invariant.
  return <>{children}</>;
}
