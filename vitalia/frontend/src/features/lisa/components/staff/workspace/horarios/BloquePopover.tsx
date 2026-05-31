// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * BloquePopover.tsx — Popover for creating/editing/deleting availability blocks.
 *
 * Opens when:
 *   - User finishes drag-to-create (draft mode: new block, no id yet)
 *   - User clicks an existing block (edit/delete mode: block.id present)
 *
 * Recurrence options (per 01-spec.md SC-1/SC-1b/SC-1c):
 *   - Semanal (weekly) + end_date / N iteraciones / "Solo esta semana" (one-off)
 *   - Quincenal (biweekly) + end_date / N iteraciones
 *
 * Recurrence is RESOLVED BY BACKEND via dateutil.rrule (D-2).
 * FE just sends the block spec; does NOT expand recurrence client-side.
 *
 * Delete flow (SC-3b):
 *   - If confirmed appointments exist → warning dialog before delete.
 *   - If no appointments → direct delete with confirm.
 *
 * Uses RHF + Zod (availabilityBlockSchema) for form validation.
 * Autosave model: create/edit/delete persist immediately (no save button per ADR-vitalia-004 § 5).
 *
 * T-FE-3 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § AvailabilityCalendar/BloquePopover + 01-spec.md § SC-1/SC-3b
 * downstream-regression-na: brand-local vitalia FE component; no cross-brand consumers
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
  type CreateBlockPayload,
} from "../../../../api/staff";
import { availabilityBlockSchema } from "../../../../types/staff-schema";
import type {
  AvailabilityBlock,
  RecurrentBlock,
} from "../../../../types/staff.types";
import type { AvailabilityBlockFormValues } from "../../../../types/staff-schema";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BloquePopoverAnchor {
  x: number;
  y: number;
}

export interface BloquePopoverProps {
  doctorId: string;
  /** Existing block (edit/delete mode). Null for new block (draft mode). */
  block: AvailabilityBlock | null;
  /** Draft data from drag-to-create (only when block === null). */
  draft?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  anchor: BloquePopoverAnchor;
  isExisting?: boolean;
  /** ISO date string of the Monday of the currently viewed week (for one_off specific_date) */
  calendarWeek?: string;
}

// ── Day labels ────────────────────────────────────────────────────────────────

const DAY_LABELS_FULL = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

function getSpecificDate(mondayIso: string, dayOfWeek: number): string {
  const d = new Date(mondayIso + "T00:00:00");
  d.setDate(d.getDate() + dayOfWeek);
  return d.toISOString().split("T")[0] ?? mondayIso;
}

// ── Default form values ───────────────────────────────────────────────────────

function buildDefaultValues(
  block: AvailabilityBlock | null,
  draft: BloquePopoverProps["draft"],
): AvailabilityBlockFormValues {
  if (block) {
    if (block.kind === "recurrent") {
      return {
        kind: "recurrent",
        dayOfWeek: block.dayOfWeek,
        startTime: block.startTime,
        endTime: block.endTime,
        freq: block.freq,
        endConditionKind: block.endConditionKind,
        endDate: block.endDate ?? null,
        occurrences: block.occurrences ?? null,
      };
    }
    return {
      kind: "one_off",
      specificDate: block.specificDate,
      startTime: block.startTime,
      endTime: block.endTime,
    };
  }

  if (draft) {
    return {
      kind: "recurrent",
      dayOfWeek: draft.dayOfWeek,
      startTime: draft.startTime,
      endTime: draft.endTime,
      freq: "weekly",
      endConditionKind: "end_date",
      endDate: null,
      occurrences: null,
    };
  }

  return {
    kind: "recurrent",
    dayOfWeek: 0,
    startTime: "09:00",
    endTime: "13:00",
    freq: "weekly",
    endConditionKind: "end_date",
    endDate: null,
    occurrences: null,
  };
}

// ── BloquePopover ─────────────────────────────────────────────────────────────

export function BloquePopover({
  doctorId,
  block,
  draft,
  isOpen,
  onClose,
  anchor,
  isExisting = false,
  calendarWeek = new Date().toISOString().split("T")[0] ?? "",
}: BloquePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [preservedCount, setPreservedCount] = useState(0);

  const createBlock = useCreateBlock(doctorId);
  const updateBlock = useUpdateBlock(doctorId);
  const deleteBlock = useDeleteBlock(doctorId);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AvailabilityBlockFormValues>({
    resolver: zodResolver(availabilityBlockSchema),
    defaultValues: buildDefaultValues(block, draft),
  });

  const formKind = watch("kind");
  const endConditionKind =
    formKind === "recurrent" ? watch("endConditionKind") : undefined;

  // Type cast to access discriminated union fields safely in JSX.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorsAny = errors as Record<string, any>;

  // Reset when block/draft changes
  useEffect(() => {
    reset(buildDefaultValues(block, draft));
  }, [block, draft, reset]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [isOpen, onClose]);

  // Position popover near anchor, keep within viewport
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!isOpen) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = 320; // estimated popover width
    const ph = 400; // estimated popover height
    let left = anchor.x + 8;
    let top = anchor.y + 8;
    if (left + pw > vw - 16) left = Math.max(8, anchor.x - pw - 8);
    if (top + ph > vh - 16) top = Math.max(8, anchor.y - ph - 8);
    setPosition({ top, left });
  }, [anchor, isOpen]);

  if (!isOpen) return null;

  // ── Submit handler ─────────────────────────────────────────────────────────

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isExisting && block) {
        // Update existing block
        if (block.kind === "recurrent" && values.kind === "recurrent") {
          await updateBlock.mutateAsync({
            blockId: block.id,
            payload: {
              freq: values.freq,
              end_condition_kind: values.endConditionKind,
              end_date: values.endDate,
              occurrences: values.occurrences,
              start_time: values.startTime,
              end_time: values.endTime,
            },
          });
        }
      } else {
        // Create new block
        let payload: CreateBlockPayload;
        if (values.kind === "one_off") {
          payload = {
            kind: "one_off",
            start_time: values.startTime,
            end_time: values.endTime,
            specific_date: values.specificDate,
          };
        } else if (values.endConditionKind === "one_off" as string) {
          // "Solo esta semana" → create as one_off
          const specificDate = getSpecificDate(calendarWeek, values.dayOfWeek);
          payload = {
            kind: "one_off",
            start_time: values.startTime,
            end_time: values.endTime,
            specific_date: specificDate,
          };
        } else {
          payload = {
            kind: "recurrent",
            day_of_week: values.dayOfWeek,
            start_time: values.startTime,
            end_time: values.endTime,
            freq: values.freq,
            end_condition_kind: values.endConditionKind,
            end_date: values.endDate ?? null,
            occurrences: values.occurrences ?? null,
          };
        }
        await createBlock.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      // Error handled by React Query; form stays open with existing data
      console.error("Error saving block:", err);
    }
  });

  // ── Delete handler ─────────────────────────────────────────────────────────

  const handleDeleteClick = () => {
    setShowDeleteWarning(true);
  };

  const handleDeleteConfirm = async () => {
    if (!block) return;
    try {
      const result = await deleteBlock.mutateAsync(block.id);
      setPreservedCount(result?.preservedAppointments ?? 0);
      setShowDeleteWarning(false);
      onClose();
    } catch (err) {
      console.error("Error deleting block:", err);
      setShowDeleteWarning(false);
    }
  };

  const isPending =
    isSubmitting ||
    createBlock.isPending ||
    updateBlock.isPending ||
    deleteBlock.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  const recurrentBlock = block?.kind === "recurrent" ? (block as RecurrentBlock) : null;
  const dayLabel = recurrentBlock
    ? DAY_LABELS_FULL[recurrentBlock.dayOfWeek] ?? ""
    : draft
      ? DAY_LABELS_FULL[draft.dayOfWeek] ?? ""
      : "";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popover */}
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-label={isExisting ? "Editar bloque de disponibilidad" : "Crear bloque de disponibilidad"}
        data-testid="bloque-popover"
        className={cn(
          "fixed z-50 w-80 rounded-lg border border-border bg-card shadow-lg",
          "p-4 space-y-3",
        )}
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {isExisting ? "Editar bloque" : "Nuevo bloque"}
            {dayLabel ? ` · ${dayLabel}` : ""}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {/* Time range */}
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Label htmlFor="startTime" className="text-xs">
                Inicio
              </Label>
              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="startTime"
                    type="time"
                    className="h-8 text-sm"
                    aria-invalid={!!errors.startTime}
                  />
                )}
              />
            </div>
            <span className="mt-5 text-muted-foreground">–</span>
            <div className="flex-1">
              <Label htmlFor="endTime" className="text-xs">
                Fin
              </Label>
              <Controller
                control={control}
                name="endTime"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="endTime"
                    type="time"
                    className="h-8 text-sm"
                    aria-invalid={!!errors.endTime}
                  />
                )}
              />
            </div>
          </div>

          {/* Recurrence section */}
          {formKind === "recurrent" && (
            <>
              {/* Frequency */}
              <div>
                <Label className="text-xs mb-1 block">Repetición</Label>
                <Controller
                  control={control}
                  name="freq"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quincenal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* End condition */}
              <div>
                <Label className="text-xs mb-1 block">Fin de la repetición</Label>
                <Controller
                  control={control}
                  name="endConditionKind"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="end_date">Fecha de fin</SelectItem>
                        <SelectItem value="occurrences">
                          N° de iteraciones
                        </SelectItem>
                        <SelectItem value="open_ended">
                          Solo esta semana
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Conditional: end date picker */}
              {endConditionKind === "end_date" && (
                <div>
                  <Label htmlFor="endDate" className="text-xs">
                    Fecha de fin
                  </Label>
                  <Controller
                    control={control}
                    name="endDate"
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="endDate"
                        type="date"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        className="h-8 text-sm"
                        aria-invalid={!!errorsAny.endDate}
                      />
                    )}
                  />
                  {errorsAny.endDate && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errorsAny.endDate.message}
                    </p>
                  )}
                </div>
              )}

              {/* Conditional: occurrences */}
              {endConditionKind === "occurrences" && (
                <div>
                  <Label htmlFor="occurrences" className="text-xs">
                    Número de iteraciones
                  </Label>
                  <Controller
                    control={control}
                    name="occurrences"
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="occurrences"
                        type="number"
                        min={1}
                        max={52}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className="h-8 text-sm"
                        aria-invalid={!!errorsAny.occurrences}
                        placeholder="Ej: 6"
                      />
                    )}
                  />
                  {errorsAny.occurrences && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errorsAny.occurrences.message}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* One-off: specific date */}
          {formKind === "one_off" && (
            <div>
              <Label htmlFor="specificDate" className="text-xs">
                Fecha puntual
              </Label>
              <Controller
                control={control}
                name="specificDate"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="specificDate"
                    type="date"
                    className="h-8 text-sm"
                    aria-invalid={!!errorsAny.specificDate}
                  />
                )}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            {isExisting && (
              <Button
                data-testid="btn-delete-block"
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteClick}
                disabled={isPending}
              >
                Eliminar
              </Button>
            )}
            <div className={cn("flex gap-2 ml-auto")}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs bg-[--agent-lisa] hover:bg-[--agent-lisa]/90 text-black"
                disabled={isPending}
              >
                {isPending ? "Guardando..." : isExisting ? "Actualizar" : "Crear bloque"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* SC-3b: Delete warning dialog */}
      <Dialog
        open={showDeleteWarning}
        onOpenChange={(open) => !open && setShowDeleteWarning(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar bloque de disponibilidad</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            {preservedCount > 0 ? (
              <p>
                Este bloque tiene{" "}
                <strong className="text-foreground">
                  {preservedCount} cita{preservedCount !== 1 ? "s" : ""} confirmada
                  {preservedCount !== 1 ? "s" : ""}
                </strong>
                . Si lo eliminas, esas citas seguirán vigentes pero el doctor
                dejará de estar disponible para nuevas reservas en ese horario.
              </p>
            ) : (
              <p>
                ¿Confirmas que deseas eliminar este bloque de disponibilidad?
                Los turnos futuros sin cita se liberarán.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteWarning(false)}
              disabled={deleteBlock.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={deleteBlock.isPending}
            >
              {deleteBlock.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
