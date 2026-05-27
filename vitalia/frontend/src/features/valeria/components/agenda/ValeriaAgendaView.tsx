"use client";

/**
 * ValeriaAgendaView.tsx — Client root component for Valeria Agenda sub-tab.
 * T-12 vitalia-fase2-valeria-agenda · F2-S1
 *
 * Root client boundary for the Agenda sub-tab.
 * Responsibilities:
 *   1. Hydrate React Query cache with SSR initialData.
 *   2. Mount useAgendaGrid with polling (refetchInterval: 30_000).
 *   3. Sync useFreshness on each data update.
 *   4. Track AGENDA_VIEWED telemetry on mount (fire-and-forget, PHI-safe).
 *   5. Compose AgendaHeader + placeholder areas for T-13/T-14 components.
 *
 * Downstream: T-13 adds AgendaPresetFilters + AgendaCalendar + CrearCitaButton.
 *             T-14 adds AppointmentDrawer.
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 * spec_anchor: 03-arch.md § 6.4 + 06-tickets.yaml T-12
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { AgendaHeader } from "./AgendaHeader";
import { useAgendaGrid, agendaKeys } from "../../api/agenda";
import { useDrawerStore } from "../../store/agenda-store";
import { useAgendaFilters } from "../../hooks/useAgendaFilters";
import { useFreshness } from "../../hooks/useFreshness";
import { trackEvent, TrackEventType } from "../../lib/telemetry";
import type { AgendaGridResponseDTO } from "../../types/agenda-schema";
import type { AgendaView } from "../../types/agenda.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ValeriaAgendaViewProps {
  /** SSR initial data — hydrates React Query cache on first render. */
  initialData: AgendaGridResponseDTO;
  /** Initial view mode from URL. */
  initialView: AgendaView;
  /** Initial ISO 8601 date string from URL. */
  initialDate: string;
  /** Initial preset filter from URL. Null = no filter. */
  initialPresetFilter: string | null;
  /** Tenant ID from URL params (injected by page.tsx Server Component). */
  tenantId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Root client boundary for Valeria Agenda sub-tab.
 *
 * Hydrates React Query cache with SSR data, then polls every 30 seconds.
 * T-13 + T-14 will add calendar grid + appointment drawer as children.
 */
export function ValeriaAgendaView({
  initialData,
  initialView,
  initialDate,
  initialPresetFilter: _initialPresetFilter,
  tenantId,
}: ValeriaAgendaViewProps) {
  const queryClient = useQueryClient();
  const { view, date, presetFilter } = useAgendaFilters();
  const { drawerOpen } = useDrawerStore();
  const { freshnessLabel, updateFreshness } = useFreshness();

  // Resolve effective view/date (URL overrides initial props after mount)
  const effectiveView = view ?? initialView;
  const effectiveDate = date ?? initialDate;

  // Hydrate React Query cache with SSR data on mount.
  // Deps intentionally empty — run once on mount only (SSR hydration).
  // queryClient is stable (from QueryClientProvider), initialData/View/Date are SSR props.
  useEffect(
    () => {
      queryClient.setQueryData(
        agendaKeys.grid(tenantId, initialView, initialDate, null),
        initialData,
      );
    },
    // Intentionally run once on mount — SSR hydration
    // queryClient ref is stable, initial* props are server-rendered constants
    // biome-ignore lint: intentional empty deps for SSR hydration
    [],
  );

  // Track AGENDA_VIEWED on mount (fire-and-forget, PHI-safe).
  // Intentionally empty deps — run once on mount only.
  useEffect(
    () => {
      void trackEvent(TrackEventType.AGENDA_VIEWED, {
        tenant_id: tenantId,
        view_mode: effectiveView,
      });
    },
    // biome-ignore lint: intentional empty deps for mount-once telemetry
    [],
  );

  // Fetch grid data with 30s polling
  const { data, isLoading, isError, dataUpdatedAt } = useAgendaGrid({
    tenantId,
    view: effectiveView,
    date: effectiveDate,
    presetFilter: presetFilter ?? undefined,
    queryOptions: {
      placeholderData: initialData,
    },
  });

  // Sync freshness indicator with latest serverTime from BE
  useEffect(() => {
    if (data?.serverTime) {
      updateFreshness(data.serverTime);
    }
  }, [data?.serverTime, dataUpdatedAt, updateFreshness]);

  return (
    <main
      className={cn(
        "flex h-full flex-col gap-0 overflow-hidden",
        // Shift layout when drawer is open (T-14 will hook into this)
        drawerOpen && "pr-0",
      )}
      aria-label="Agenda de citas"
    >
      {/* Header: view toggle + date picker + freshness indicator */}
      <AgendaHeader
        tenantId={tenantId}
        freshnessLabel={freshnessLabel}
      />

      {/* Loading overlay — shown only on initial load (not polling refresh) */}
      {isLoading && !data && (
        <div
          className="flex flex-1 items-center justify-center"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">Cargando agenda…</span>
        </div>
      )}

      {/* Error state — shown when fetch fails and no data available */}
      {isError && !data && (
        <div
          className="flex flex-1 items-center justify-center"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-destructive">
            Error al cargar la agenda. Reintentando…
          </p>
        </div>
      )}

      {/* Main content area — grid + filters (T-13) + drawer (T-14) */}
      {(data || !isLoading) && (
        <section
          className="relative flex flex-1 overflow-hidden"
          aria-label="Grilla de citas"
        >
          {/* T-13 will render AgendaPresetFilters + AgendaCalendar here */}
          {/* T-14 will render AppointmentDrawer here */}
          {data && data.slots.length === 0 && !isLoading && (
            <div
              className="flex flex-1 items-center justify-center"
              aria-live="polite"
            >
              <p className="text-sm text-muted-foreground">
                Sin citas para mostrar en este período.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
