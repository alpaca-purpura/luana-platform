// cap: scheduling.mateo-agenda
/**
 * DayAvailabilityStrip.tsx — Visual day-timeline for the nueva-cita picker.
 * T-FE-3 vitalia-fase2-mateo-nueva-cita
 *
 * AC-8 (SC-mini-vista): shows working_hours blocks (muted green band) +
 * busy blocks (destructive overlay) for the selected doctor's day.
 * Highlights the currently-selected slot in mateo accent color.
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

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert ISO UTC to minutes-since-strip-start (clamped 0–STRIP_MINUTES). */
function isoToStripMinutes(iso: string): number {
  try {
    const d = new Date(iso);
    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;
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
): { left: number; width: number } | null {
  const startMin = isoToStripMinutes(block.start);
  const endMin = isoToStripMinutes(block.end);
  if (startMin >= endMin || endMin <= 0 || startMin >= STRIP_MINUTES) return null;
  return {
    left: minutesToPct(startMin),
    width: minutesToPct(endMin - startMin),
  };
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface DayAvailabilityStripProps {
  tenantId: string;
  token: string;
  doctorId: string | null;
  dateLocal: string; // YYYY-MM-DD derived from startIso
  selectedStartIso: string | null;
  selectedEndIso: string | null;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * DayAvailabilityStrip — horizontal timeline for a doctor's workday.
 *
 * Wired into NuevaCitaView by T-FE-4 below the Médico selector.
 * Shows busy/available patterns; highlights the proposed slot.
 */
export function DayAvailabilityStrip({
  tenantId,
  token,
  doctorId,
  dateLocal,
  selectedStartIso,
  selectedEndIso,
}: DayAvailabilityStripProps) {
  const { data, isPending, isError } = useDayStrip({
    tenantId,
    token,
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
          const startMin = isoToStripMinutes(selectedStartIso);
          const endMin = isoToStripMinutes(selectedEndIso);
          if (startMin >= endMin) return null;
          return {
            left: minutesToPct(startMin),
            width: minutesToPct(endMin - startMin),
          };
        })()
      : null;

  return (
    <div
      data-testid="day-strip"
      role="img"
      aria-label={`Vista de disponibilidad del ${dateLocal}`}
      className="relative h-5 w-full overflow-hidden rounded bg-muted"
    >
      {/* Blocks: working_hours (success muted) + busy (destructive) */}
      {data.blocks.map((block, i) => {
        const pct = blockToPct(block);
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

      {/* Hour markers (07, 09, 11, 13, 15, 17, 19, 21) */}
      <div className="pointer-events-none absolute inset-0 flex" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="flex-1 border-l border-border/30 first:border-l-0"
          />
        ))}
      </div>
    </div>
  );
}
