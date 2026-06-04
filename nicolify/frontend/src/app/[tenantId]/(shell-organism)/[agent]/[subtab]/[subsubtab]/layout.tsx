// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
// route-fix: audit iter 3 — unified [subsubtab] layout (was [entityId]/layout.tsx)
// audit-iter-5: BUG-1 SSR-404 gate — server-side ICP existence check
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
 *       (1) SERVER-SIDE ICP existence check (BUG-1 SSR-404 gate):
 *           Fetches GET /api/v1/abel/icp/{icpId} from the BE via Clerk JWT.
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
 * Defense-in-depth (A4 + BUG-1):
 *   - Validates agent/subtab via shell-routes SSoT whitelist.
 *   - For entity-bearing route: validates subsubtab is UUID-shaped string.
 *   - SERVER-SIDE ICP existence/tenant check (primary 404 gate — BUG-1 fix).
 *   - Client-side notFound() in IcpEntityLayoutClient as secondary backstop.
 *
 * Server Component default — no "use client" on this file.
 * Next.js 16 App Router: params is Promise → await before use.
 *
 * spec_anchor: 03-arch-fe.md §0 Routing (corrected for route-fix + BUG-1 SSR gate)
 * validators_gate: A4 whitelist + SSR-404 (BUG-1) + tenant isolation + boot-clean
 * downstream-regression-na: brand-local route; no cross-brand consumers
 */

import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";

import { IcpEntityLayoutClient } from "@/features/abel/components/icp/IcpEntityLayoutClient";
import { isValidAgent, isValidSubtab } from "@/lib/routing/shell-routes";
import { icpApi } from "@/features/abel/api/icp-api";

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

    // BUG-1 SSR-404 GATE: server-side ICP existence + tenant check.
    //
    // Why server-side (not just client-side notFound())?
    //   - Client-side notFound() in React Query error handler fires AFTER hydration.
    //     Before notFound() is called, the component may render with error state →
    //     console.error leak + possible flash of loading state / infinite spinner.
    //   - Server-side notFound() is called BEFORE any client HTML is sent.
    //     Next.js catches the thrown NEXT_NOT_FOUND and renders not-found.tsx
    //     immediately, with no client-side error state, no console.error leak.
    //   - Server-side check is the REAL cross-tenant defense: the Clerk JWT + the
    //     X-Tenant-ID header ensure the BE validates ownership before the layout renders.
    //
    // Error handling:
    //   - 404 ApiError → notFound() (renders [subsubtab]/not-found.tsx — shell intact)
    //   - non-404 error → throw (propagates to error boundary)
    //   - getToken() returns null → notFound() (auth state inconsistent — guard defensively)
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
      // Should not happen (Clerk middleware protects [tenantId]/** routes),
      // but guard defensively to avoid passing null token to the API.
      notFound();
    }

    try {
      // Fetch the ICP server-side to validate existence + tenant scoping.
      // The icpApi.get call uses X-Tenant-ID = tenantId (from the route), so the
      // BE will 404 for any ICP that doesn't belong to this tenant.
      // NOTE: we only confirm existence — the returned Icp data is discarded.
      // IcpEntityLayoutClient re-fetches it client-side for live updates.
      await icpApi.get({ token, tenantId }, subsubtab);
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
