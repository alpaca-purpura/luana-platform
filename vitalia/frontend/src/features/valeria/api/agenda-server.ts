/**
 * agenda-server.ts — SSR initial state fetch for Valeria Agenda Server Component.
 * T-12 vitalia-fase2-valeria-agenda
 *
 * Used exclusively in Server Components (page.tsx).
 * Returns empty fallback data when BE is unreachable (graceful degradation).
 * Clerk server-side token is obtained via auth() from @clerk/nextjs/server.
 *
 * Pattern: Server Component calls getInitialAgendaState() → passes result
 * as placeholderData to ValeriaAgendaView → React Query hydrates client cache.
 *
 * downstream-regression-na: brand-local server-side fetch; no cross-brand consumers
 * spec_anchor: 03-arch.md § 6.3 + 06-tickets.yaml T-12 (A1)
 */

import { auth } from "@clerk/nextjs/server";
import type { AgendaGridResponseDTO } from "../types/agenda-schema";
import type { AgendaView } from "../types/agenda.types";

// SSR runs inside the frontend Docker container: NEXT_PUBLIC_API_URL points to
// `http://127.0.0.1:8002` (which the host browser can reach) but resolves to the
// frontend container itself, not the backend. Prefer INTERNAL_API_URL
// (`http://vitalia_backend_dev:8002` — Docker network) when defined.
// Mirrors the pattern in vitalia/frontend/src/lib/iam/api.ts.
const BASE_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8002";

// ── Empty fallback ─────────────────────────────────────────────────────────────

/**
 * Empty fallback grid — returned when SSR fetch fails or token is unavailable.
 * React Query will immediately refetch on mount (staleTime=25_000, initialData is stale).
 */
function emptyGrid(
  tenantId: string,
  view: AgendaView,
  date: string,
): AgendaGridResponseDTO {
  return {
    view,
    dateFrom: date,
    dateTo: date,
    slots: [],
    serverTime: new Date().toISOString(),
    clinicId: "",
    tenantId,
  };
}

// ── getInitialAgendaState ──────────────────────────────────────────────────────

export interface GetInitialAgendaStateOptions {
  tenantId: string;
  view: string;
  date: string;
  presetFilter: string | null;
}

/**
 * Server-side initial data fetch for agenda grid.
 * Called from page.tsx Server Component to enable SSR without layout shift.
 *
 * Graceful degradation:
 * - Returns emptyGrid if not signed in (middleware handles redirect, this is defensive)
 * - Returns emptyGrid on network error (never throws)
 * - Logs warning on error (structlog pattern — console.warn acceptable in server context)
 */
export async function getInitialAgendaState({
  tenantId,
  view,
  date,
  presetFilter,
}: GetInitialAgendaStateOptions): Promise<AgendaGridResponseDTO> {
  const normalizedView: AgendaView = isAgendaView(view) ? view : "semana";

  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      // Middleware should handle redirect — this is defensive fallback
      return emptyGrid(tenantId, normalizedView, date);
    }

    const params = new URLSearchParams({ view: normalizedView, date });
    if (presetFilter) params.set("preset_filter", presetFilter);

    const response = await fetch(
      `${BASE_URL}/api/v1/scheduling/agenda/grid?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
        },
        // Server-side fetch: no need for AbortController — Next.js handles timeouts
        next: { revalidate: 0 }, // Always fresh on server render
      },
    );

    if (!response.ok) {
      console.warn(
        `[agenda-server] getInitialAgendaState failed: ${response.status} ${response.statusText}`,
        { tenantId, view: normalizedView, date },
      );
      return emptyGrid(tenantId, normalizedView, date);
    }

    return (await response.json()) as AgendaGridResponseDTO;
  } catch (err) {
    // Network error or auth error — graceful degradation
    console.warn("[agenda-server] getInitialAgendaState error:", err, {
      tenantId,
      view: normalizedView,
      date,
    });
    return emptyGrid(tenantId, normalizedView, date);
  }
}

// ── Type guard ─────────────────────────────────────────────────────────────────

function isAgendaView(value: string): value is AgendaView {
  return value === "dia" || value === "semana" || value === "mes";
}
