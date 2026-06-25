"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@luana/format/utils";

const HOUR_MAX = 23;
const MINUTE_MAX = 59;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function clamp(n: number, max: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(max, n));
}

/** Parse "HH:mm" into numeric segments (null when unset/partial). Exported for tests. */
export function parseTime(value?: string): { h: number | null; m: number | null } {
  if (!value) return { h: null, m: null };
  const [hs, ms] = value.split(":");
  const h = hs == null || hs === "" ? null : clamp(parseInt(hs, 10), HOUR_MAX);
  const m = ms == null || ms === "" ? null : clamp(parseInt(ms, 10), MINUTE_MAX);
  return { h, m };
}

/** Build a "HH:mm" string from segments, or "" when either is unset. Exported for tests. */
export function formatTime(h: number | null, m: number | null): string {
  if (h == null || m == null) return "";
  return `${pad2(h)}:${pad2(m)}`;
}

/** Segment display string ("09", "9", "") → clamped number or null. */
function segNum(str: string, max: number): number | null {
  return str === "" ? null : clamp(parseInt(str, 10), max);
}

interface TimePickerProps {
  /** Controlled value, "HH:mm" 24h (or "" when unset). */
  value?: string;
  /** Emits "HH:mm" when both segments are set, "" otherwise. */
  onChange: (value: string) => void;
  /** Minute increment for ArrowUp/Down (default 5). Hours always step by 1. */
  stepMinutes?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}

/**
 * TimePicker — selección segmentada de UNA hora (HH:mm 24h), tokenizada.
 *
 * Reemplaza el chrome del `<input type=time>` nativo por dos segmentos estilizados:
 * se escribe con auto-avance, se ajusta con ↑↓ por segmento y se navega con ←→.
 * NO usa el widget del browser → look consistente cross-navegador, tokens del kit.
 *
 * Los segmentos guardan su string de display (dígitos crudos mientras se escribe;
 * se padean a 2 al perder foco) — así un segmento a medio escribir no se bloquea ni
 * se pierde, aunque `onChange` emita "" hasta que AMBOS estén completos.
 *
 * Átomo base de `TimeRangePicker` (que compone dos). Para fecha+hora → `SmartDateTimePicker`.
 */
export function TimePicker({
  value,
  onChange,
  stepMinutes = 5,
  disabled,
  className,
  id,
  "aria-label": ariaLabel = "Hora",
  "aria-invalid": ariaInvalid,
}: TimePickerProps) {
  const init = parseTime(value);
  const [hStr, setHStr] = React.useState(init.h == null ? "" : pad2(init.h));
  const [mStr, setMStr] = React.useState(init.m == null ? "" : pad2(init.m));
  const hourRef = React.useRef<HTMLInputElement>(null);
  const minuteRef = React.useRef<HTMLInputElement>(null);

  // Adopt a COMPLETE external value (e.g. a preset click) or an explicit external clear.
  // Never wipe a half-typed buffer from our own partial "" emits.
  React.useEffect(() => {
    const p = parseTime(value);
    const cur = formatTime(segNum(hStr, HOUR_MAX), segNum(mStr, MINUTE_MAX));
    if (p.h != null && p.m != null) {
      if (value !== cur) {
        setHStr(pad2(p.h));
        setMStr(pad2(p.m));
      }
    } else if ((value == null || value === "") && hStr !== "" && mStr !== "") {
      setHStr("");
      setMStr("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (nextH: string, nextM: string) =>
    onChange(formatTime(segNum(nextH, HOUR_MAX), segNum(nextM, MINUTE_MAX)));

  const handleSegment =
    (seg: "h" | "m") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const max = seg === "h" ? HOUR_MAX : MINUTE_MAX;
      let raw = e.target.value.replace(/\D/g, "").slice(-2);
      if (raw.length === 2 && parseInt(raw, 10) > max) raw = String(max);
      if (seg === "h") {
        setHStr(raw);
        emit(raw, mStr);
        if (raw.length === 2 || (raw.length === 1 && parseInt(raw, 10) > 2)) {
          minuteRef.current?.focus();
          minuteRef.current?.select();
        }
      } else {
        setMStr(raw);
        emit(hStr, raw);
      }
    };

  const handleBlur = (seg: "h" | "m") => (e: React.FocusEvent<HTMLInputElement>) => {
    // Read the DOM value, NOT the closure str: auto-advance fires blur synchronously
    // with a stale closure (e.g. "0" before the "9" of "09"), which would pad to "00".
    const max = seg === "h" ? HOUR_MAX : MINUTE_MAX;
    const digits = e.target.value.replace(/\D/g, "").slice(-2);
    const padded = digits === "" ? "" : pad2(clamp(parseInt(digits, 10), max));
    seg === "h" ? setHStr(padded) : setMStr(padded);
  };

  const handleKey =
    (seg: "h" | "m") => (e: React.KeyboardEvent<HTMLInputElement>) => {
      const max = seg === "h" ? HOUR_MAX : MINUTE_MAX;
      const step = seg === "h" ? 1 : stepMinutes;
      const str = seg === "h" ? hStr : mStr;
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const base = segNum(str, max) ?? 0;
        const delta = e.key === "ArrowUp" ? step : -step;
        const next = (((base + delta) % (max + 1)) + (max + 1)) % (max + 1); // wrap
        const padded = pad2(next);
        if (seg === "h") {
          setHStr(padded);
          emit(padded, mStr);
        } else {
          setMStr(padded);
          emit(hStr, padded);
        }
      } else if (e.key === "ArrowRight" && seg === "h") {
        minuteRef.current?.focus();
        minuteRef.current?.select();
      } else if (e.key === "ArrowLeft" && seg === "m") {
        hourRef.current?.focus();
        hourRef.current?.select();
      } else if (e.key === "Backspace" && seg === "m" && mStr === "") {
        hourRef.current?.focus();
      }
    };

  const segCls =
    "w-7 bg-transparent text-center font-mono text-base tabular-nums outline-none placeholder:text-muted-foreground md:text-sm";

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center gap-0.5 rounded-control border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        ariaInvalid && "border-destructive focus-within:ring-destructive",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      aria-invalid={ariaInvalid || undefined}
    >
      <Clock className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        ref={hourRef}
        id={id}
        inputMode="numeric"
        maxLength={2}
        disabled={disabled}
        aria-label={`${ariaLabel} — hora`}
        placeholder="--"
        value={hStr}
        onChange={handleSegment("h")}
        onKeyDown={handleKey("h")}
        onBlur={handleBlur("h")}
        onFocus={(e) => e.target.select()}
        className={segCls}
      />
      <span className="text-muted-foreground" aria-hidden>
        :
      </span>
      <input
        ref={minuteRef}
        inputMode="numeric"
        maxLength={2}
        disabled={disabled}
        aria-label={`${ariaLabel} — minutos`}
        placeholder="--"
        value={mStr}
        onChange={handleSegment("m")}
        onKeyDown={handleKey("m")}
        onBlur={handleBlur("m")}
        onFocus={(e) => e.target.select()}
        className={segCls}
      />
    </div>
  );
}
