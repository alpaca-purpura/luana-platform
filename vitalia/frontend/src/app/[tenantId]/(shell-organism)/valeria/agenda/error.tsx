"use client";

/**
 * error.tsx — Route error boundary for Valeria Agenda sub-tab.
 * F7 — T-10-review.md auditor finding: missing error.tsx route boundary.
 *
 * Next.js App Router error.tsx:
 *   - MUST be "use client" (Next.js requirement).
 *   - Receives `error` (Error) and `reset` (() => void) props.
 *   - Shown when the segment or its children throw.
 *
 * Named exports only — NO default exports NOT possible here; Next.js requires default.
 * downstream-regression-na: brand-local route boundary; no cross-brand consumers
 * spec_anchor: 03-arch.md § 6.4 + 06-tickets.yaml T-10 (F7 auditor fix iter 1)
 */

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ── Props (Next.js App Router error.tsx contract) ─────────────────────────────

interface AgendaErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Error fallback for the Valeria Agenda route segment.
 * Shows a user-friendly message and a reset button.
 * Logs to console.error for observability.
 */
export default function AgendaError({ error, reset }: AgendaErrorBoundaryProps) {
  useEffect(() => {
    // Log to observability (non-PHI — error.message from route render, not patient data)
    console.error("[AgendaError]", error);
  }, [error]);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 p-8"
      role="alert"
      aria-live="assertive"
    >
      <Alert
        variant="destructive"
        className="max-w-md w-full"
      >
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Error al cargar la agenda</AlertTitle>
        <AlertDescription>
          Ocurrió un problema al cargar el módulo de agenda. Puedes intentar
          recargar la vista o volver más tarde.
          {process.env.NODE_ENV === "development" && error.message && (
            <span className="block mt-2 text-xs font-mono opacity-70">
              {error.message}
            </span>
          )}
        </AlertDescription>
      </Alert>

      <Button
        variant="outline"
        size="sm"
        onClick={reset}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reintentar
      </Button>
    </div>
  );
}
