// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-AUTOSAVE
/**
 * AutosaveBadge.tsx — Shared autosave status badge.
 *
 * Displays the autosave lifecycle: idle → saving → saved | error.
 * Placed in components/shared/ because it is reused across multiple forms
 * (IcpDatosForm, BuyerLeafForm, and any future nicolify form).
 *
 * Accessibility: role="status" with aria-live="polite" for screen readers.
 * Spanish neutro LatAm — no voseo.
 *
 * ported from: vitalia/frontend/src/components/marca/shared/AutosaveBadge.tsx
 * lift candidate: @luana/ui-kit N=2 (vitalia + nicolify) — /pm-luana follow-up
 *
 * T-FE-AUTOSAVE nicolify-r1-abel-icp-buyer
 * spec_anchor: 06-tickets.yaml T-FE-AUTOSAVE deliverables
 * downstream-regression-na: brand-local nicolify FE component; no cross-brand consumers
 */

"use client";

import { cn } from "@/lib/utils";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutosaveBadgeProps {
  status: AutosaveStatus;
  /** Timestamp of last successful save (shown as "Guardado hace Xs"). */
  savedAt?: Date | null;
  className?: string;
}

function relativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "ahora mismo";
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "hace 1 min";
  return `hace ${minutes} min`;
}

const STATUS_STYLES: Record<AutosaveStatus, string> = {
  idle: "text-muted-foreground",
  saving: "text-muted-foreground",
  saved: "text-emerald-600 dark:text-emerald-400",
  error: "text-destructive",
};

const STATUS_DOTS: Record<AutosaveStatus, string> = {
  idle: "bg-muted-foreground/30",
  saving: "bg-primary/50 animate-pulse",
  saved: "bg-emerald-500",
  error: "bg-destructive",
};

/**
 * AutosaveBadge — displays autosave state as a small inline status indicator.
 * Role="status" with aria-live="polite" so screen readers announce changes.
 */
export function AutosaveBadge({ status, savedAt, className }: AutosaveBadgeProps) {
  const label = (() => {
    switch (status) {
      case "saving":
        return "Guardando...";
      case "saved":
        return savedAt ? `Guardado ${relativeTime(savedAt)}` : "Guardado";
      case "error":
        return "Error al guardar";
      case "idle":
      default:
        return null;
    }
  })();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? "Estado de guardado"}
      data-testid="autosave-badge"
      data-state={status}
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium transition-all duration-300",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOTS[status])}
        aria-hidden="true"
      />
      {label && <span>{label}</span>}
    </div>
  );
}

AutosaveBadge.displayName = "AutosaveBadge";
