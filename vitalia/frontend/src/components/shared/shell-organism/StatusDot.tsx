/**
 * StatusDot — color indicator dot molécula.
 * F1-S10 vitalia-fase1-empty-states — T-1
 *
 * Atomic color dot used in PlaceholderCard + AgendaSlot status.
 * Color variants: green (activo/confirmado), yellow (pendiente/parcial), gray (inactivo).
 *
 * Server Component — purely presentational, no state.
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 03-arch.md § 3.2 #4
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { cn } from "@/lib/utils";

export type StatusDotVariant = "green" | "yellow" | "gray";

export interface StatusDotProps {
  /** Color variant */
  variant: StatusDotVariant;
  /** Optional accessible label (aria-label) */
  label?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<StatusDotVariant, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  gray: "bg-gray-400",
};

/**
 * StatusDot — small circular color indicator.
 * Server Component.
 */
export function StatusDot({ variant, label, className }: StatusDotProps) {
  return (
    <span
      role="img"
      aria-label={label ?? variant}
      data-testid={`status-dot-${variant}`}
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        VARIANT_CLASSES[variant],
        className,
      )}
    />
  );
}
