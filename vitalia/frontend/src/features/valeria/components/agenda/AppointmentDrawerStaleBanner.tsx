"use client";

/**
 * AppointmentDrawerStaleBanner.tsx — Stale data warning banner for AppointmentDrawer.
 * T-14 vitalia-fase2-valeria-agenda
 *
 * Rendered when useDrawerStore.staleDetected=true (polling detected a remote update
 * on the currently open appointment). User can trigger manual refetch.
 *
 * SC-6: concurrent users — two staff members editing the same appointment.
 * Polling every 30s detects updated_at mismatch → sets staleDetected=true → banner.
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 * spec_anchor: 03-arch.md § 6.11 + 06-tickets.yaml T-14
 */

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AppointmentDrawerStaleBannerProps {
  /** Callback to trigger manual refetch of appointment detail. */
  onReload: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Displays warning banner when appointment data was updated remotely.
 * Shows "Recargar" button that invalidates the React Query cache.
 */
export function AppointmentDrawerStaleBanner({
  onReload,
}: AppointmentDrawerStaleBannerProps) {
  return (
    <Alert
      variant="default"
      className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-500/30"
      role="status"
      aria-live="polite"
      data-testid="stale-banner"
    >
      <AlertTriangle
        className="h-4 w-4 text-yellow-600 dark:text-yellow-400"
        aria-hidden="true"
      />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-yellow-800 dark:text-yellow-200">
          Este turno fue actualizado por otro usuario.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onReload}
          className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-400 dark:text-yellow-300 dark:hover:bg-yellow-900/30 shrink-0"
        >
          Recargar datos
        </Button>
      </AlertDescription>
    </Alert>
  );
}
