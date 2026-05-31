// cap: platform.autosave-primitive-platform
// story-origin: build-autosave-primitive-luana T-3
"use client";

/**
 * AutosaveBanner — thin wrapper over <AutosaveBadge> from @luana/ui-kit.
 *
 * Preserves the original nicolify AutosaveBanner public API (status, error,
 * onRetry, className) so all consumers (FieldDetail, tests) remain unchanged.
 *
 * The "saving" / "saved" / "error" visual states now render via AutosaveBadge
 * (shared primitive — ADR-012). The "error" state with an onRetry action
 * shows the Reintentar button next to the badge (nicolify-specific extension).
 *
 * "dirty" (from @luana/hooks) is treated as "idle" — not shown in the banner.
 * (The debounce window is invisible to the user, same as the prior bespoke impl.)
 */

import { useEffect, useState } from "react";

import { AutosaveBadge } from "@luana/ui-kit";
import { Button } from "@luana/ui-kit";
import { cn } from "@luana/format";

/**
 * Nicolify banner-level autosave status.
 * Does NOT include "dirty" — the debounce window is not surfaced in the banner.
 * @luana/hooks status "dirty" is mapped to "idle" by FormRuntimeProvider before
 * being placed into FormRuntimeContext.
 */
export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutosaveBannerProps {
  status: AutosaveStatus;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

const FADE_AFTER_MS = 2000;

/**
 * "Saved" sub-component: renders via AutosaveBadge and fades after 2s.
 * This preserves the prior fade-out UX behavior (D12 spec).
 */
function SavedBanner({ className }: { className?: string }) {
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFaded(true), FADE_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (faded) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs",
        className,
      )}
    >
      <AutosaveBadge status="saved" />
    </div>
  );
}

/**
 * Inline banner shown at the top of the detail pane. Thin wrapper over
 * <AutosaveBadge> from @luana/ui-kit (ADR-012, build-autosave-primitive-luana).
 *
 * Behavior preserved from prior implementation (D12 spec):
 *  - idle: renders null (invisible)
 *  - saving: spinner + "Guardando…" label
 *  - saved: "Guardado" label, fades after 2s
 *  - error: error text + optional "Reintentar" button
 */
export function AutosaveBanner({ status, error, onRetry, className }: AutosaveBannerProps) {
  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground",
          className,
        )}
      >
        <AutosaveBadge status="saving" />
      </div>
    );
  }

  if (status === "saved") {
    return <SavedBanner className={className} />;
  }

  // status === "error"
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <AutosaveBadge
          status="error"
          labels={{ error: error?.message ?? "Error al guardar" }}
        />
      </div>
      {onRetry && (
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
