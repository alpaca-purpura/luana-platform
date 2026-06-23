// cap: scheduling.mateo-agenda
/**
 * DoctorPicker.tsx — Controlled doctor selector for nueva-cita.
 * T-FE-2 vitalia-fase2-mateo-nueva-cita
 *
 * AC-1: No UUID text input — only a Select with named options.
 * AC-2: Only shows active doctors for the requested time slot.
 *
 * Controlled component: value/onChange props only.
 * No internal data fetching — parent wires useNuevaCitaFreeDoctors.
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE; no cross-brand consumers
 * spec_anchor: 03-arch-fe.md § F4 + 06-tickets.yaml T-FE-2
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { NuevaCitaDoctorItem } from "../../hooks/use-nueva-cita";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DoctorPickerProps {
  doctors: NuevaCitaDoctorItem[];
  /** Currently selected doctorId */
  value: string | null;
  onChange: (doctorId: string) => void;
  loading?: boolean;
  /** Disable when no time slot selected (parent drives this) */
  disabled?: boolean;
  /** Shown as tooltip/placeholder hint when disabled */
  disabledReason?: string;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DoctorPicker — Select control for doctor assignment.
 * Only named doctor options; no UUID text entry (AC-1).
 */
export function DoctorPicker({
  doctors,
  value,
  onChange,
  loading = false,
  disabled = false,
  disabledReason,
  className,
}: DoctorPickerProps) {
  if (loading) {
    return (
      <Skeleton
        data-testid="doctor-picker-loading"
        className={cn("h-10 w-full rounded-md", className)}
      />
    );
  }

  const isDisabled = disabled || doctors.length === 0;

  const placeholder = disabled
    ? (disabledReason ?? "Selecciona fecha y hora primero")
    : doctors.length === 0
      ? "No hay médicos disponibles"
      : "Selecciona un médico…";

  // Empty state (not disabled, but no doctors for slot)
  const showEmpty = !disabled && !loading && doctors.length === 0;

  return (
    <Select
      value={value ?? undefined}
      onValueChange={onChange}
      disabled={isDisabled}
    >
      <SelectTrigger
        data-testid="doctor-picker-trigger"
        className={cn("w-full", className)}
        title={disabled ? (disabledReason ?? undefined) : undefined}
      >
        {showEmpty ? (
          <span
            data-testid="doctor-picker-empty"
            className="text-muted-foreground"
          >
            {placeholder}
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      {doctors.length > 0 && (
        <SelectContent>
          {doctors.map((doc) => (
            <SelectItem
              key={doc.doctorId}
              value={doc.doctorId}
              data-testid={`doctor-picker-option-${doc.doctorId}`}
            >
              {doc.doctorLabel}
            </SelectItem>
          ))}
        </SelectContent>
      )}
    </Select>
  );
}
