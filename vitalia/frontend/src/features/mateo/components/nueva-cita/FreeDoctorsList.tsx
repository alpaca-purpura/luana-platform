// cap: scheduling.mateo-agenda
/**
 * FreeDoctorsList.tsx — One-click reassignment from available-doctors list.
 * T-FE-3 vitalia-fase2-mateo-nueva-cita
 *
 * AC-5 (SC-reasignar): lists free doctors for the selected slot.
 * AC-5 (SC-reasignar-vacio): empty state when no doctors available.
 * AC-5 (SC-empty-medicos): empty state when slot not yet selected.
 *
 * Props: doctors[] + isPending come from the caller (T-FE-4 wires useNuevaCitaFreeDoctors).
 * Writing selectedDoctorId to store via setSelectedDoctorId.
 *
 * HIPAA: doctor_label = professional display name only (not PHI).
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useNuevaCitaStore } from "../../store/nueva-cita-store";
import type { NuevaCitaDoctorItem } from "../../hooks/use-nueva-cita";

// ── Props ──────────────────────────────────────────────────────────────────

export interface FreeDoctorsListProps {
  tenantId: string;
  // token removed — not used by this component (T-FE-4)
  startIso: string;
  durationMinutes: number;
  doctors: NuevaCitaDoctorItem[];
  isPending: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * FreeDoctorsList — inline list for 1-click doctor reassignment.
 *
 * Intended to show below/beside the Médico selector in NuevaCitaView (T-FE-4).
 * Receives doctors/isPending as props (parent already has the React Query hook).
 * Writes selection to store so NuevaCitaView can read selectedDoctorId.
 */
export function FreeDoctorsList({
  startIso,
  doctors,
  isPending,
}: FreeDoctorsListProps) {
  const selectedDoctorId = useNuevaCitaStore((s) => s.selectedDoctorId);
  const setSelectedDoctorId = useNuevaCitaStore((s) => s.setSelectedDoctorId);

  // Slot not yet selected
  if (!startIso) {
    return (
      <p
        data-testid="free-doctors-no-slot"
        className="text-xs text-muted-foreground"
      >
        Selecciona fecha y hora para ver médicos disponibles.
      </p>
    );
  }

  if (isPending) {
    return (
      <ul
        data-testid="free-doctors-loading"
        aria-busy={true}
        aria-label="Cargando médicos disponibles..."
        className="flex flex-col gap-1"
      >
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
        ))}
      </ul>
    );
  }

  if (doctors.length === 0) {
    return (
      <p
        data-testid="free-doctors-empty"
        className="text-xs text-muted-foreground"
      >
        Sin médicos disponibles para este horario.
      </p>
    );
  }

  return (
    <ul
      role="listbox"
      aria-label="Médicos disponibles para el horario seleccionado"
      className="flex flex-wrap gap-2"
    >
      {doctors.map((doc) => {
        const isSelected = doc.doctorId === selectedDoctorId;
        return (
          <li key={doc.doctorId} role="option" aria-selected={isSelected}>
            <button
              type="button"
              data-testid={`free-doctor-btn-${doc.doctorId}`}
              aria-pressed={isSelected}
              onClick={() => setSelectedDoctorId(doc.doctorId)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                isSelected
                  ? "border-[hsl(var(--agent-mateo))] bg-[hsl(var(--agent-mateo)/10)] font-medium text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-[hsl(var(--agent-mateo))] hover:text-foreground",
              )}
            >
              {doc.doctorLabel}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
