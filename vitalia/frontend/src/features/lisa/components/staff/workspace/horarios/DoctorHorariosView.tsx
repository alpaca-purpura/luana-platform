// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * DoctorHorariosView.tsx — "use client" root for doctor horarios workspace tab.
 *
 * Per ADR-vitalia-004 § 3: Client Component root (interactivity: calendar drag, week nav, toggles).
 * Receives doctorId from SSR page. Hydrates blocks via React Query.
 * Zustand manages UI state (calendarWeek, dragDraft).
 *
 * Contains:
 *   - Section heading + info
 *   - AvailabilityCalendar (week grid + drag-to-create + week nav + 24h toggle)
 *
 * T-FE-3 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § FSD-Lite layout + 01-spec.md § Hoja Horarios
 * downstream-regression-na: brand-local vitalia FE component; no cross-brand consumers
 */

"use client";

import React from "react";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

export interface DoctorHorariosViewProps {
  doctorId: string;
}

export function DoctorHorariosView({ doctorId }: DoctorHorariosViewProps) {
  return (
    <div
      data-testid="horarios-view"
      className="flex flex-col h-full min-h-0"
      aria-label="Gestión de disponibilidad del doctor"
    >
      {/* Section heading */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h2 className="text-base font-semibold text-foreground">
          Disponibilidad
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Define los horarios en que este doctor puede atender pacientes.
          Los cambios se guardan automáticamente.
        </p>
      </div>

      {/* Calendar */}
      <div className="flex-1 min-h-0 border border-border/40 rounded-lg mx-5 mb-5 overflow-hidden">
        <AvailabilityCalendar doctorId={doctorId} />
      </div>
    </div>
  );
}
