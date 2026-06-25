"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@luana/format/utils";
import { Input } from "./input";

export interface TimeRange {
  /** "HH:mm" 24h, or "" when unset. */
  start: string;
  /** "HH:mm" 24h, or "" when unset. */
  end: string;
}

interface TimeRangePickerProps {
  /** Controlled value. Partial allowed (one bound set, the other empty). */
  value?: Partial<TimeRange>;
  onChange: (value: TimeRange) => void;
  className?: string;
  /** Granularity of the native time input, in minutes (default 5). */
  stepMinutes?: number;
  /** Accessible labels for each bound (no visible label by design — compose under a Field). */
  startLabel?: string;
  endLabel?: string;
  /** Visible separator between the two inputs. */
  separator?: React.ReactNode;
  disabled?: boolean;
  /** Override the default "inicio debe ser anterior a fin" message. */
  errorMessage?: string;
}

/**
 * TimeRangePicker — selección de un rango horario (inicio–fin) en un solo día.
 *
 * Compone dos `Input type="time"` (mismo átomo que `SmartDateTimePicker`) — NO reinventa
 * un dropdown de slots. Valida inicio < fin (comparación lexicográfica de "HH:mm", que es
 * cronológica por el zero-padding) y marca `aria-invalid` + mensaje `role="alert"`.
 *
 * Casos: horario de atención, ventanas de disponibilidad, franjas de campaña. NO para
 * elegir UN instante (→ `SmartDateTimePicker`) ni un rango de FECHAS (→ `Calendar mode="range"`).
 */
export function TimeRangePicker({
  value,
  onChange,
  className,
  stepMinutes = 5,
  startLabel = "Hora de inicio",
  endLabel = "Hora de fin",
  separator = "a",
  disabled,
  errorMessage = "La hora de inicio debe ser anterior a la de fin.",
}: TimeRangePickerProps) {
  const start = value?.start ?? "";
  const end = value?.end ?? "";
  const invalid = start !== "" && end !== "" && start >= end;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          type="time"
          aria-label={startLabel}
          aria-invalid={invalid || undefined}
          value={start}
          step={stepMinutes * 60}
          disabled={disabled}
          onChange={(e) => onChange({ start: e.target.value, end })}
          className="font-mono"
        />
        <span className="shrink-0 text-sm text-muted-foreground">{separator}</span>
        <Input
          type="time"
          aria-label={endLabel}
          aria-invalid={invalid || undefined}
          value={end}
          step={stepMinutes * 60}
          disabled={disabled}
          onChange={(e) => onChange({ start, end: e.target.value })}
          className="font-mono"
        />
      </div>
      {invalid && (
        <p role="alert" className="text-xs text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
