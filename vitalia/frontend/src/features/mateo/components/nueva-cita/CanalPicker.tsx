// cap: scheduling.mateo-agenda
/**
 * CanalPicker.tsx — Controlled canal/origin selector (walk_in | telefono).
 * T-FE-2 vitalia-fase2-mateo-nueva-cita
 *
 * Uses TogglePill from @luana/ui-kit (canon §shell-togglepill--default).
 * Controlled component: value/onChange props only.
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE; no cross-brand consumers
 * spec_anchor: 03-arch-fe.md § F4 + 06-tickets.yaml T-FE-2
 */

"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CanalValue = "walk_in" | "telefono";

export interface CanalPickerProps {
  value: CanalValue;
  onChange: (canal: CanalValue) => void;
  disabled?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * CanalPicker — Controlled pill toggle for walk_in / telefono origin.
 *
 * Uses Shadcn Tabs (controlled mode via value/onValueChange) styled as pill.
 * TogglePill from @luana/ui-kit is uncontrolled (defaultValue only) so we use
 * Tabs directly for RHF controlled binding.
 *
 * ponytail: Tabs directly instead of TogglePill because TogglePill lacks
 * controlled value/onChange props. Add controlled mode to TogglePill if
 * reused in ≥2 more places (promotion candidate).
 */
export function CanalPicker({
  value,
  onChange,
  disabled = false,
  className,
}: CanalPickerProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        if (v === "walk_in" || v === "telefono") {
          onChange(v);
        }
      }}
      data-testid="canal-picker"
      className={cn("w-full", className)}
    >
      <TabsList className="h-9 rounded-full border border-border bg-muted p-1">
        <TabsTrigger
          value="walk_in"
          disabled={disabled}
          data-testid="canal-picker-walk-in"
          className="rounded-full px-4 text-sm"
        >
          Presencial
        </TabsTrigger>
        <TabsTrigger
          value="telefono"
          disabled={disabled}
          data-testid="canal-picker-telefono"
          className="rounded-full px-4 text-sm"
        >
          Teléfono
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
