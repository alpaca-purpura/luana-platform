"use client";

/**
 * AppointmentDrawerTurnoSection.tsx — "Turno" accordion section for AppointmentDrawer.
 * T-14 vitalia-fase2-valeria-agenda
 *
 * Renders:
 *   - Fecha/hora (formatted from ISO 8601 startTime/endTime)
 *   - Duración calculada en minutos
 *   - Doctor label
 *   - Servicio label
 *   - Estado badge (SCHEDULED | COMPLETED | CANCELLED | NO_SHOW)
 *   - Acciones: Reagendar (disabled, Q7), Cancelar (AlertDialog confirm), Completar, No-show (AlertDialog confirm)
 *
 * Q8 — action gates: Cancelar + No-show use AlertDialog confirm before mutation.
 * Q7 — Reagendar disabled + Tooltip "Próximamente".
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 * spec_anchor: 03-arch.md § 6.6 + 06-tickets.yaml T-14
 */

import { useState } from "react";
import { CalendarDays, Clock, Stethoscope, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Appointment } from "../../types/agenda.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppointmentDrawerTurnoSectionProps {
  /** Full appointment detail from useAppointmentDetail. */
  appointment: Appointment;
  /** Callback when status change mutation succeeds. */
  onStatusChange: (newStatus: "CANCELLED" | "COMPLETED" | "NO_SHOW", reason?: string) => void;
  /** Whether a status change mutation is in flight. */
  isUpdating: boolean;
}

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  SCHEDULED: {
    label: "Agendado",
    variant: "outline",
    className: "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400",
  },
  COMPLETED: {
    label: "Completado",
    variant: "outline",
    className: "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400",
  },
  CANCELLED: {
    label: "Cancelado",
    variant: "outline",
    className: "border-destructive text-destructive bg-destructive/5",
  },
  NO_SHOW: {
    label: "No asistió",
    variant: "outline",
    className: "border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats an ISO 8601 datetime to Spanish date (e.g., "Martes 27 de mayo de 2026").
 * Uses a fixed ES locale — NEVER toLocaleDateString() without locale arg.
 */
function formatDateEs(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-419", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats an ISO 8601 datetime to 24h time string (e.g., "14:30").
 */
function formatTimeEs(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("es-419", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Computes duration in minutes between two ISO 8601 datetimes.
 */
function durationMinutes(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.round((end - start) / 60_000);
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Turno section — date/time/doctor/service/status + action buttons with confirm dialogs.
 */
export function AppointmentDrawerTurnoSection({
  appointment,
  onStatusChange,
  isUpdating,
}: AppointmentDrawerTurnoSectionProps) {
  const [confirmDialog, setConfirmDialog] = useState<
    { action: "CANCELLED" | "NO_SHOW" } | null
  >(null);

  const status = appointment.appointmentStatus.toUpperCase();
  const statusConfig = STATUS_BADGE[status] ?? STATUS_BADGE.SCHEDULED;
  const duration = durationMinutes(appointment.startTime, appointment.endTime);
  const isTerminalStatus = status === "COMPLETED" || status === "CANCELLED" || status === "NO_SHOW";

  function handleConfirm() {
    if (!confirmDialog) return;
    onStatusChange(confirmDialog.action);
    setConfirmDialog(null);
  }

  const CONFIRM_DIALOG_COPY: Record<
    "CANCELLED" | "NO_SHOW",
    { title: string; description: string; confirmLabel: string }
  > = {
    CANCELLED: {
      title: "¿Cancelar este turno?",
      description:
        "Esta acción marcará el turno como cancelado. El historial de pagos no se modifica.",
      confirmLabel: "Cancelar turno",
    },
    NO_SHOW: {
      title: "¿Marcar como no asistió?",
      description:
        "Esta acción registra que el paciente no se presentó. Podrás reagendarlo cuando el módulo esté disponible.",
      confirmLabel: "Confirmar",
    },
  };

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="turno-section"
    >
      {/* Fecha + hora */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays
            className="h-4 w-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <span className="capitalize">{formatDateEs(appointment.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock
            className="h-4 w-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <span>
            {formatTimeEs(appointment.startTime)} – {formatTimeEs(appointment.endTime)}
            <span className="text-muted-foreground ml-2">({duration} min)</span>
          </span>
        </div>
      </div>

      {/* Doctor + servicio */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <User
            className="h-4 w-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <span>{appointment.doctorLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Stethoscope
            className="h-4 w-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <span>{appointment.serviceLabel}</span>
        </div>
      </div>

      {/* Estado badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Estado:</span>
        <Badge
          variant={statusConfig.variant}
          className={cn("text-xs", statusConfig.className)}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Acciones (hidden if terminal status) */}
      {!isTerminalStatus && (
        <div
          className="flex flex-wrap gap-2 pt-1"
          role="group"
          aria-label="Acciones del turno"
        >
          {/* Reagendar — disabled Q7 cement */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  aria-disabled="true"
                  className="cursor-not-allowed opacity-50"
                >
                  Reagendar
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              Reagendar — próximamente disponible
            </TooltipContent>
          </Tooltip>

          {/* Completar */}
          <Button
            variant="outline"
            size="sm"
            disabled={isUpdating}
            onClick={() => onStatusChange("COMPLETED")}
            className="border-green-500 text-green-700 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Completar
          </Button>

          {/* Cancelar — requires Dialog confirm (Q8) */}
          <Button
            variant="outline"
            size="sm"
            disabled={isUpdating}
            onClick={() => setConfirmDialog({ action: "CANCELLED" })}
            className="border-destructive text-destructive hover:bg-destructive/5"
          >
            Cancelar turno
          </Button>

          {/* No-show — requires Dialog confirm (Q8) */}
          <Button
            variant="outline"
            size="sm"
            disabled={isUpdating}
            onClick={() => setConfirmDialog({ action: "NO_SHOW" })}
            className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-400"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            No asistió
          </Button>
        </div>
      )}

      {/* AlertDialog confirm for destructive actions (Q8) */}
      {confirmDialog && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {CONFIRM_DIALOG_COPY[confirmDialog.action].title}
              </DialogTitle>
              <DialogDescription>
                {CONFIRM_DIALOG_COPY[confirmDialog.action].description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
                disabled={isUpdating}
              >
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={isUpdating}
                aria-busy={isUpdating}
              >
                {confirmDialog.action === "CANCELLED"
                  ? CONFIRM_DIALOG_COPY.CANCELLED.confirmLabel
                  : CONFIRM_DIALOG_COPY.NO_SHOW.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
