// cap: scheduling.mateo-agenda
/**
 * AvailabilityChip.tsx — 4-state availability badge for nueva-cita form.
 * T-FE-3 vitalia-fase2-mateo-nueva-cita
 *
 * Displays:
 *   available    → Badge success "Médico disponible"
 *   busy         → Badge warning "No disponible — se solapa con HH:MM"
 *   out_of_hours → Badge warning "Fuera del horario"
 *   no_schedule  → Badge warning "Sin horario registrado"
 *   loading      → skeleton span
 *   error        → inline error + retry button (SC-disponibilidad-falla)
 *
 * HIPAA: chip shows scheduling metadata only — no PHI (conflict_label is time-only).
 * A11y: aria-live="polite" on chip container, aria-busy on loading.
 *
 * Syncs status to store (setAvailabilityStatus) so T-FE-4 can block submit.
 * Clears on unmount.
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

"use client";

import * as React from "react";
import { Badge } from "@luana/ui-kit";
import { useAvailabilityCheck } from "../../hooks/use-availability";
import { useNuevaCitaStore } from "../../store/nueva-cita-store";

// ── Props ──────────────────────────────────────────────────────────────────

export interface AvailabilityChipProps {
  tenantId: string;
  token: string;
  doctorId: string | null;
  startIso: string;
  durationMinutes: number;
}

// ── Labels ─────────────────────────────────────────────────────────────────

function statusLabel(status: string, conflictLabel: string | null): string {
  if (status === "available") return "Médico disponible";
  if (status === "busy")
    return conflictLabel
      ? `No disponible — ${conflictLabel}`
      : "No disponible";
  if (status === "out_of_hours") return "Fuera del horario";
  // no_schedule
  return "Sin horario registrado";
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * AvailabilityChip — standalone badge that reflects current slot availability.
 *
 * Wired into NuevaCitaView by T-FE-4 next to the Médico field.
 * Exposes isAvailable via store (setAvailabilityStatus) for submit-block.
 */
export function AvailabilityChip({
  tenantId,
  token,
  doctorId,
  startIso,
  durationMinutes,
}: AvailabilityChipProps) {
  const setAvailabilityStatus = useNuevaCitaStore(
    (s) => s.setAvailabilityStatus,
  );

  const { data, isPending, isError, refetch } = useAvailabilityCheck({
    tenantId,
    token,
    doctorId,
    startIso,
    durationMinutes,
  });

  // Sync availability status to store for T-FE-4 submit-block
  React.useEffect(() => {
    setAvailabilityStatus(data?.status ?? null);
    return () => {
      // Clear on unmount so submit-block resets
      setAvailabilityStatus(null);
    };
  }, [data?.status, setAvailabilityStatus]);

  // Nothing when doctorId not selected
  if (!doctorId) return null;

  // Loading skeleton
  if (isPending) {
    return (
      <span
        role="status"
        aria-label="Verificando disponibilidad..."
        aria-busy={true}
        className="inline-block h-5 w-32 animate-pulse rounded-full bg-muted"
      />
    );
  }

  // SC-disponibilidad-falla: endpoint down → error + retry
  if (isError || !data) {
    return (
      <span
        data-testid="availability-chip-error"
        className="inline-flex items-center gap-1.5 text-xs text-destructive"
      >
        No se pudo verificar disponibilidad.
        <button
          type="button"
          className="underline hover:no-underline"
          onClick={() => void refetch()}
          aria-label="Reintentar verificar disponibilidad"
        >
          Reintentar
        </button>
      </span>
    );
  }

  const isAvailable = data.status === "available";
  const label = statusLabel(data.status, data.conflictLabel);

  return (
    <span
      data-testid="availability-chip"
      aria-live="polite"
      aria-atomic="true"
      className="inline-flex"
    >
      <Badge variant={isAvailable ? "success" : "warning"}>
        {label}
      </Badge>
    </span>
  );
}
