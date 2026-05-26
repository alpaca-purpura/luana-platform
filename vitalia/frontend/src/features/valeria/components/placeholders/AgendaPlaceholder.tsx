"use client";
/**
 * AgendaPlaceholder — organismo orquestador Valeria/Agenda (enriquecido).
 * F1-S10 vitalia-fase1-empty-states — T-7
 *
 * Mockup parity: valeria-agenda-placeholder.html (ratificado Chris batch 2 · 2026-05-26)
 *
 * Client Component — gestiona estado local de period toggle.
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — Tailwind semantic tokens only.
 * Spanish neutro LatAm — sin voseo.
 * PHI masking: todos los nombres son ficticios (arch test test_no_phi_real_data.test.ts).
 *
 * Grid structure: 6 days (Lun 26 – Sáb 31 May 2026) × 9 time slots (08:00–16:00).
 * Lunch row 13:00: stripe diagonal pattern + aria-label="Horario de almuerzo".
 * 10 AgendaSlot mock distribuidos con variedad de status + origins.
 *
 * F2 anchor: AgendaPlaceholder reemplazado por ValeriaAgendaView con:
 *   - useAgendaWeek(week_start) React Query + tenant_id + clinic_id (hipaa-lite)
 *   - ContactSidebar al click slot + payment subform (capa 1 cobranza)
 *   - Filtros funcionales Zustand useAgendaFilters
 *   - Period nav real (week +1/-1, Hoy reset)
 *   - PHI masking RBAC @require_phi_access
 *
 * spec_anchor: 03-arch.md § 3.3 + 06-tickets.yaml T-7
 * downstream-regression-na: brand-local feature/valeria; no cross-brand consumers
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AgendaToolbar, type PeriodMode } from "../agenda/AgendaToolbar";
import { AgendaFilters } from "../agenda/AgendaFilters";
import { AgendaDayHeader } from "../agenda/AgendaDayHeader";
import { AgendaSlot, type SlotStatus, type SlotOrigin } from "../agenda/AgendaSlot";
import { AgendaSummaryFooter } from "../agenda/AgendaSummaryFooter";

// ── Mock data (ficticios LatAm — NO PHI real) ──────────────────────────────

interface SlotData {
  patient: string;
  service: string;
  doctor: string;
  status: SlotStatus;
  origin?: SlotOrigin;
  note?: string;
}

/** Day columns: Lun-Sáb, 26–31 May 2026. Index 0 = Lun 26 = today (hardcoded mock). */
const DAYS = [
  { label: "Lun", num: 26, isToday: true },
  { label: "Mar", num: 27, isToday: false },
  { label: "Mié", num: 28, isToday: false },
  { label: "Jue", num: 29, isToday: false },
  { label: "Vie", num: 30, isToday: false },
  { label: "Sáb", num: 31, isToday: false },
] as const;

/** Time slots rows (8 rows, 08:00-16:00 inclusive). */
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
] as const;

/**
 * Grid: TIME_SLOTS × DAYS (row × col).
 * null = empty cell.
 * Lunch row (index 5 = 13:00) handled separately with stripe pattern.
 *
 * 10 slots mock verbatim from mockup valeria-agenda-placeholder.html:
 *   09:00 Lun26: M. Rodríguez · Limpieza · Dr. Mendoza · paid · web
 *   09:00 Mié28: S. López · Blanqueamiento · Dra. Soto · deposit · (none)
 *   10:00 Lun26: L. Vega · Consulta · Dra. Soto · deposit · phone
 *   10:00 Mar27: J. Pérez · Consulta · Dr. Mendoza · deposit · (none)
 *   10:00 Jue29: A. Ruiz · Consulta · Dr. Mendoza · unpaid · walk-in
 *   11:00 Lun26: P. Sosa · Endodoncia · Dr. Mendoza · paid · (none)
 *   11:00 Vie30: M. Díaz · Blanqueamiento · Dra. Soto · deposit · proactive
 *   12:00 Mié28: R. Cruz · Consulta · Dr. Mendoza · deposit · (none)
 *   14:00 Mar27: C. Núñez · Consulta · Dr. Mendoza · noshow · (with note)
 *   14:00 Vie30: Sofía B. · Limpieza · Dra. Soto · paid · walk-in (✋ icon)
 */
type GridRow = (SlotData | null)[];

const MOCK_GRID: GridRow[] = [
  // 08:00 — all empty
  [null, null, null, null, null, null],
  // 09:00
  [
    { patient: "M. Rodríguez", service: "Limpieza dental", doctor: "Dr. C. Mendoza", status: "paid", origin: "web" },
    null,
    { patient: "S. López", service: "Blanqueamiento", doctor: "Dra. M. Soto", status: "deposit" },
    null,
    null,
    null,
  ],
  // 10:00
  [
    { patient: "L. Vega", service: "Consulta", doctor: "Dra. M. Soto", status: "deposit", origin: "phone" },
    { patient: "J. Pérez", service: "Consulta", doctor: "Dr. C. Mendoza", status: "deposit" },
    null,
    { patient: "A. Ruiz", service: "Consulta", doctor: "Dr. C. Mendoza", status: "unpaid", origin: "walk-in" },
    null,
    null,
  ],
  // 11:00
  [
    { patient: "P. Sosa", service: "Endodoncia", doctor: "Dr. C. Mendoza", status: "paid" },
    null,
    null,
    null,
    { patient: "M. Díaz", service: "Blanqueamiento", doctor: "Dra. M. Soto", status: "deposit", origin: "proactive" },
    null,
  ],
  // 12:00
  [
    null,
    null,
    { patient: "R. Cruz", service: "Consulta", doctor: "Dr. C. Mendoza", status: "deposit" },
    null,
    null,
    null,
  ],
  // 13:00 — lunch stripe (all null, handled specially in grid render)
  [null, null, null, null, null, null],
  // 14:00
  [
    null,
    { patient: "C. Núñez", service: "Consulta", doctor: "Dr. C. Mendoza", status: "noshow", note: "histórico 2 faltas" },
    null,
    null,
    { patient: "Sofía B.", service: "Limpieza dental", doctor: "Dra. M. Soto", status: "paid", origin: "walk-in" },
    null,
  ],
  // 15:00 — all empty
  [null, null, null, null, null, null],
];

const LUNCH_ROW_INDEX = 5; // 13:00

/**
 * ValeriaAgendaPlaceholder — orquestador agenda con toolbar + filters + 6d × 8h grid + footer.
 * Client Component.
 */
export function AgendaPlaceholder() {
  // F1 visual-only period state (F2 wires real date arithmetic)
  const [periodMode, setPeriodMode] = useState<PeriodMode>("week");

  return (
    <div
      className="flex flex-col bg-background rounded-lg border border-border overflow-hidden"
      data-testid="valeria-agenda-placeholder"
    >
      {/* Header section */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-foreground">Agenda</h2>
          <p className="text-xs text-muted-foreground">
            Tus turnos del día + cobranza · 6 días
          </p>
        </div>
      </div>

      {/* Toolbar: period navigation + CTA */}
      <AgendaToolbar
        weekLabel="Semana 26-31 May 2026"
        periodMode={periodMode}
        onPeriodChange={setPeriodMode}
      />

      {/* Filters row (disabled F1) */}
      <AgendaFilters />

      {/* Calendar grid: 7-column (time label + 6 days) */}
      <div className="overflow-x-auto bg-muted/10">
        <div
          className="grid min-w-[900px]"
          style={{ gridTemplateColumns: "70px repeat(6, 1fr)" }}
          role="grid"
          aria-label="Grilla de agenda semanal"
          data-testid="agenda-grid"
        >
          {/* ─ Day headers row ─ */}
          {/* Empty top-left corner cell */}
          <div
            className="border-r border-b border-border bg-muted/20"
            aria-hidden="true"
          />
          {DAYS.map((day) => (
            <AgendaDayHeader
              key={day.num}
              dayLabel={day.label}
              dayNum={day.num}
              isToday={day.isToday}
            />
          ))}

          {/* ─ Time slot rows ─ */}
          {TIME_SLOTS.map((time, rowIdx) => {
            const isLunchRow = rowIdx === LUNCH_ROW_INDEX;
            const rowSlots = MOCK_GRID[rowIdx] ?? [null, null, null, null, null, null];

            return (
              <div key={`row-${time}`} role="row" className="contents">
                {/* Time label cell */}
                <div
                  className="text-right pr-2 py-1 text-[11px] text-muted-foreground border-t border-border self-stretch flex items-start justify-end pt-1.5"
                  aria-label={`Hora ${time}`}
                >
                  {time}
                </div>

                {/* 6 day cells */}
                {rowSlots.map((slot, colIdx) => {
                  const day = DAYS[colIdx];
                  const cellKey = `${time}-${day?.num ?? colIdx}`;

                  if (isLunchRow) {
                    return (
                      <div
                        key={cellKey}
                        className="agenda-lunch-stripe border-t border-r border-border min-h-[56px]"
                        aria-label="Horario de almuerzo"
                        title="Almuerzo"
                      />
                    );
                  }

                  return (
                    <div
                      key={cellKey}
                      className={cn(
                        "border-t border-r border-border min-h-[56px] p-0.5",
                        "bg-background hover:bg-muted/30 transition-colors cursor-pointer",
                        "relative group",
                      )}
                      role="gridcell"
                      aria-label={
                        slot
                          ? `${time} — ${slot.patient}`
                          : `${time} — vacío`
                      }
                    >
                      {slot ? (
                        <AgendaSlot
                          patient={slot.patient}
                          service={slot.service}
                          doctor={slot.doctor}
                          status={slot.status}
                          origin={slot.origin}
                          note={slot.note}
                          className="h-full"
                        />
                      ) : (
                        /* Empty cell hover hint */
                        <span className="hidden group-hover:block text-[10px] text-muted-foreground p-1 select-none">
                          + Crear cita
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary footer */}
      <AgendaSummaryFooter
        proposalsToday={4}
        unpaidCount={3}
        leadsReadyCount={3}
      />
    </div>
  );
}
