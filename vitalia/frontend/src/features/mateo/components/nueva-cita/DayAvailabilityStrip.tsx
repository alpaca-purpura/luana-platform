// cap: scheduling.mateo-agenda
/**
 * DayAvailabilityStrip.tsx — Visual day-timeline for the nueva-cita picker.
 * T-FE-3 vitalia-fase2-mateo-nueva-cita
 *
 * AC-8 (SC-mini-vista): shows working_hours blocks (muted green band) +
 * busy blocks (destructive overlay) for the selected doctor's day.
 * Highlights the currently-selected slot in mateo accent color.
 *
 * H3: enriched with header (doctor label + date range), hour axis (08–21),
 * legend (Atención/Ocupado/Cita nueva), busy block labels.
 *
 * Time range: clip to 07:00–21:00 (most clinical hours). Blocks outside = hidden.
 *
 * Renders nothing when doctorId is null.
 *
 * HIPAA: only scheduling metadata displayed — no PHI (no patient IDs/names).
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useDayStrip } from "../../hooks/use-availability";
import type { DayStripBlock } from "../../hooks/use-availability";

// ── Constants ──────────────────────────────────────────────────────────────

/** Strip covers 07:00–21:00 local (840 minutes total). */
const STRIP_START_HOUR = 7;
const STRIP_END_HOUR = 21;
const STRIP_MINUTES = (STRIP_END_HOUR - STRIP_START_HOUR) * 60; // 840

/** Hour markers shown on axis (even hours within strip range). */
const AXIS_HOURS = [8, 10, 12, 14, 16, 18, 20];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert ISO to minutes-since-strip-start using local timezone.
 * H1 fix: use Intl.DateTimeFormat to get local hours/minutes, not UTC.
 */
function isoToStripMinutes(iso: string, timezone: string): number {
  try {
    const d = new Date(iso);
    // Extract local H:mm in the given timezone
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(d);
    const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    const totalMinutes = h * 60 + m;
    const stripStart = STRIP_START_HOUR * 60;
    return Math.max(0, Math.min(STRIP_MINUTES, totalMinutes - stripStart));
  } catch {
    return 0;
  }
}

/** Convert minutes to % offset within the strip. */
function minutesToPct(minutes: number): number {
  return (minutes / STRIP_MINUTES) * 100;
}

/** Block to CSS left% + width%. Returns null if fully outside strip. */
function blockToPct(
  block: DayStripBlock,
  timezone: string,
): { left: number; width: number } | null {
  const startMin = isoToStripMinutes(block.start, timezone);
  const endMin = isoToStripMinutes(block.end, timezone);
  if (startMin >= endMin || endMin <= 0 || startMin >= STRIP_MINUTES) return null;
  return {
    left: minutesToPct(startMin),
    width: minutesToPct(endMin - startMin),
  };
}

/** Format ISO to HH:mm in a given timezone. */
function isoToHHMM(iso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("es", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface DayAvailabilityStripProps {
  tenantId: string;
  // token removed — hook calls getToken() fresh per-request (T-FE-4)
  doctorId: string | null;
  dateLocal: string; // YYYY-MM-DD derived from startIso
  selectedStartIso: string | null;
  selectedEndIso: string | null;
  /** H3: tenant timezone for local-time rendering. Defaults to America/Lima. */
  timezone?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * DayAvailabilityStrip — horizontal timeline for a doctor's workday.
 *
 * Wired into NuevaCitaView by T-FE-4 below the Médico selector.
 * Shows busy/available patterns; highlights the proposed slot.
 * H3: includes header (doctor + date), hour axis, legend.
 */
export function DayAvailabilityStrip({
  tenantId,
  doctorId,
  dateLocal,
  selectedStartIso,
  selectedEndIso,
  timezone = "America/Lima",
}: DayAvailabilityStripProps) {
  const { data, isPending, isError } = useDayStrip({
    tenantId,
    doctorId,
    dateLocal,
  });

  if (!doctorId) return null;

  if (isPending) {
    return (
      <div
        data-testid="day-strip-loading"
        className="h-5 w-full animate-pulse rounded bg-muted"
        aria-label="Cargando disponibilidad del día..."
        aria-busy={true}
      />
    );
  }

  if (isError || !data) {
    return (
      <div
        data-testid="day-strip-error"
        className="text-xs text-muted-foreground"
      >
        No se pudo cargar la vista del día.
      </div>
    );
  }

  // Build selected-slot overlay pct
  const selectedPct =
    selectedStartIso && selectedEndIso
      ? (() => {
          const startMin = isoToStripMinutes(selectedStartIso, timezone);
          const endMin = isoToStripMinutes(selectedEndIso, timezone);
          if (startMin >= endMin) return null;
          return {
            left: minutesToPct(startMin),
            width: minutesToPct(endMin - startMin),
          };
        })()
      : null;

  // H3: find busy blocks for label display
  const busyBlocks = data.blocks.filter((b) => b.kind === "busy");

  return (
    <div data-testid="day-strip" className="flex flex-col gap-1">
      {/* H3: Header — date label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          Vista del día · {dateLocal}
        </span>
        <span className="text-xs text-muted-foreground">07:00–21:00</span>
      </div>

      {/* Strip bar with role=img */}
      <div
        role="img"
        aria-label={`Vista de disponibilidad del ${dateLocal}`}
        className="relative h-5 w-full overflow-hidden rounded bg-muted"
      >
        {/* Blocks: working_hours (success muted) + busy (destructive) */}
        {data.blocks.map((block, i) => {
          const pct = blockToPct(block, timezone);
          if (!pct) return null;
          return (
            <div
              key={i}
              data-testid={`day-strip-block-${i}`}
              className={cn(
                "absolute inset-y-0",
                block.kind === "working_hours"
                  ? "bg-success/20"
                  : block.kind === "busy"
                    ? "bg-destructive/40"
                    : "bg-muted-foreground/20",
              )}
              style={{ left: `${pct.left}%`, width: `${pct.width}%` }}
            />
          );
        })}

        {/* Selected slot highlight (mateo accent) */}
        {selectedPct ? (
          <div
            data-testid="day-strip-selected"
            className="absolute inset-y-0 bg-[hsl(var(--agent-mateo))/60] ring-1 ring-[hsl(var(--agent-mateo))]"
            style={{ left: `${selectedPct.left}%`, width: `${selectedPct.width}%` }}
            aria-label="Horario seleccionado"
          />
        ) : null}

        {/* Hour markers */}
        <div className="pointer-events-none absolute inset-0 flex" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="flex-1 border-l border-border/30 first:border-l-0"
            />
          ))}
        </div>
      </div>

      {/* H3: Hour axis */}
      <div className="relative h-3 w-full" aria-hidden="true">
        {AXIS_HOURS.map((h) => {
          const posMin = (h - STRIP_START_HOUR) * 60;
          const pct = minutesToPct(posMin);
          return (
            <span
              key={h}
              className="absolute -translate-x-1/2 text-xs text-muted-foreground"
              style={{ left: `${pct}%` }}
            >
              {h.toString().padStart(2, "0")}
            </span>
          );
        })}
      </div>

      {/* H3: Busy block labels */}
      {busyBlocks.length > 0 ? (
        <div className="mt-0.5 space-y-0.5">
          {busyBlocks.map((b, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              Ocupado: {isoToHHMM(b.start, timezone)}–{isoToHHMM(b.end, timezone)}
            </p>
          ))}
        </div>
      ) : null}

      {/* H3: Legend */}
      <div className="flex items-center gap-3 mt-1" aria-hidden="true">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-4 rounded-sm bg-success/40" />
          Atención
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-4 rounded-sm bg-destructive/40" />
          Ocupado
        </span>
        {selectedPct ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-4 rounded-sm bg-[hsl(var(--agent-mateo))/60]" />
            Cita nueva
          </span>
        ) : null}
      </div>
    </div>
  );
}
