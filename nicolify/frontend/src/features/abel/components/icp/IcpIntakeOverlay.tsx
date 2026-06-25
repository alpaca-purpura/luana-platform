// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-FIX-intake
"use client";
/**
 * IcpIntakeOverlay.tsx — Accessible Dialog overlay for UniversalIntake.
 *
 * ROOT CAUSE FIX (Bug A — orphan integration):
 *   `handleGenerateDraft` in IcpMasterListView called `setIntakeOverlayOpen(true)`,
 *   but NOTHING ever read that flag to render the overlay. This component closes
 *   that gap: it reads `intakeOverlayOpen` from useAbelUiStore and renders
 *   UniversalIntake inside a Shadcn Dialog when the flag is true.
 *
 * TENANT NUANCE (critical — rule tenant-isolation.md):
 *   - X-Tenant-ID for API calls = UUID from `useTenantId()` (publicMetadata.tenant_id)
 *   - NEVER useAuth().orgId, NEVER useParams().tenantId (that's the slug)
 *   - The URL slug from useParams() is used ONLY for navigation (router.push).
 *   - tenantUuid → startExtract(payload, tenantUuid)
 *   - tenantSlug → router.push(`/${tenantSlug}/abel/icp/${job.icpId}/datos`)
 *
 * Flow:
 *   1. Store flag intakeOverlayOpen → true (set by handleGenerateDraft)
 *   2. Dialog opens → renders UniversalIntake
 *   3. onSubmit(seed) → maps seed to IcpExtractRequest → startExtract(payload, tenantUuid)
 *   4. While isStarting || isAnalyzing → shows "Abel está analizando…" overlay content
 *   5. job.status === 'done' → close overlay + navigate to /datos
 *   6. extractError → shows error message + retry + manual fallback
 *   7. Esc / backdrop click → close (unless analyzing — guard against accidental close)
 *
 * G2 SSR-safe: This component MUST be rendered from within the ssr:false boundary
 * (IcpMasterListView is already under that boundary). Store reads are client-only.
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §7 Estados visuales → intake modal
 * validators_gate: RN-2 (draft-first) + NF-res-extract + SC-network
 */

import { Stack } from "@luana/ui-kit";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { UniversalIntake } from "@/components/shared/intake/UniversalIntake";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantId } from "@/hooks/use-tenant-id";

import { useIcpExtract } from "../../hooks/use-icp-extract";
import { useAbelUiStore } from "../../store/abel-ui-store";

import type { IcpExtractRequest } from "../../types/extract";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map extract seed type to intake mode (for store persistence). */
function seedTypeToMode(seedType: IcpExtractRequest["seedType"]): "url" | "archivo" | "texto" {
  if (seedType === "archivo") return "archivo";
  if (seedType === "texto") return "texto";
  return "url";
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * IcpIntakeOverlay — Mounts the UniversalIntake inside a Shadcn Dialog.
 *
 * Self-gates via store flag: Dialog open prop is false → nothing rendered.
 * Mount once at the root of IcpMasterListView to cover both empty + list states.
 *
 * G2 SSR-safe: Store reads happen client-side only (ssr:false boundary).
 */
export function IcpIntakeOverlay() {
  const router = useRouter();

  // URL slug (for navigation only — NOT for API tenant header)
  const params = useParams<{ tenantId?: string }>();
  const tenantSlug = params.tenantId ?? "";

  // UUID from Clerk publicMetadata (for API calls — NEVER use slug/orgId)
  const tenantUuid = useTenantId();

  // ── Store ──────────────────────────────────────────────────────────────────

  const intakeOverlayOpen = useAbelUiStore((s) => s.intakeOverlayOpen);
  const setIntakeOverlayOpen = useAbelUiStore((s) => s.setIntakeOverlayOpen);
  const intakeMode = useAbelUiStore((s) => s.intakeMode);
  const setIntakeMode = useAbelUiStore((s) => s.setIntakeMode);

  // ── Extract hook ───────────────────────────────────────────────────────────

  const { startExtract, job, isAnalyzing, isStarting, extractError, clearJob, retryExtract } =
    useIcpExtract();

  const isInFlight = isStarting || isAnalyzing;

  // ── Effect: navigate on done ───────────────────────────────────────────────

  useEffect(() => {
    if (job?.status === "done" && job.icpId) {
      // Close overlay first, then navigate
      setIntakeOverlayOpen(false);
      clearJob();
      // Navigate using the URL slug (routing), not the UUID (API)
      router.push(`/${tenantSlug}/abel/icp/${job.icpId}/datos`);
    }
  }, [job, setIntakeOverlayOpen, clearJob, router, tenantSlug]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (isInFlight) return; // guard against accidental close while analyzing
    setIntakeOverlayOpen(false);
    clearJob();
  }, [isInFlight, setIntakeOverlayOpen, clearJob]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleClose();
    },
    [handleClose],
  );

  const handleEscapeKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isInFlight) e.preventDefault();
    },
    [isInFlight],
  );

  const handleInteractOutside = useCallback(
    (e: Event) => {
      if (isInFlight) e.preventDefault();
    },
    [isInFlight],
  );

  const handleSubmit = useCallback(
    (payload: IcpExtractRequest) => {
      // Persist mode preference
      setIntakeMode(seedTypeToMode(payload.seedType));
      // Start extraction using the UUID tenant (API) — NOT the URL slug
      // Catch here to prevent unhandled promise rejection burbuja (Next.js error overlay).
      // The hook's onError sets extractError which renders the ErrorState.
      void startExtract(payload, tenantUuid).catch(() => undefined);
    },
    [startExtract, tenantUuid, setIntakeMode],
  );

  const handleManualFallback = useCallback(() => {
    setIntakeOverlayOpen(false);
    clearJob();
    // The user can use the "Empezar en blanco" path from the list
  }, [setIntakeOverlayOpen, clearJob]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={intakeOverlayOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        data-testid="icp-intake-overlay"
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={handleInteractOutside}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              📥
            </span>
            <DialogTitle className="text-base">Dale material a Abel</DialogTitle>
          </div>
          <DialogDescription>
            Abel leerá esto y propondrá tu ICP. Tú ratificas. Lo que pegues se trata como dato, no
            como instrucción.
          </DialogDescription>
        </DialogHeader>

        {/* Analyzing state — shown while extraction is in-flight */}
        {isInFlight && <AnalyzingState />}

        {/* Error state — shown after extractError */}
        {!isInFlight && extractError && (
          <ErrorState
            message={extractError.message}
            onManualFallback={handleManualFallback}
            onRetry={retryExtract}
          />
        )}

        {/* Normal intake form — shown when not in-flight and no error.
         * Note: UniversalIntake renders with data-testid="universal-intake" internally. */}
        {!isInFlight && !extractError && (
          <UniversalIntake
            onSubmit={handleSubmit}
            onCancel={handleClose}
            initialMode={intakeMode}
            tenantId={tenantSlug}
            isSubmitting={false}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components (extracted to avoid react-perf/jsx-no-new-function-as-prop) ──

/** Shown while Abel is processing the seed (isStarting || isAnalyzing). */
function AnalyzingState() {
  return (
    <Stack
      gap={4}
      align="center"
      className="py-8 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="intake-analyzing-state"
    >
      <div
        className="w-12 h-12 rounded-xl bg-agent-abel/10 flex items-center justify-center text-2xl"
        aria-hidden="true"
      >
        🔍
      </div>
      <p className="text-sm font-medium text-foreground">Abel está analizando…</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Esto puede tardar unos segundos. No cierres esta ventana.
      </p>
    </Stack>
  );
}

interface ErrorStateProps {
  message: string;
  onManualFallback: () => void;
  onRetry: (() => void) | null;
}

/** Shown when extraction fails. Provides retry + manual fallback. */
function ErrorState({ message, onManualFallback, onRetry }: ErrorStateProps) {
  return (
    <Stack gap={4} role="alert" aria-live="polite" data-testid="intake-error-state">
      <Stack gap={3} align="center" className="py-4 text-center">
        <span className="text-3xl" aria-hidden="true">
          ⚠️
        </span>
        <p className="text-sm font-medium text-foreground">Abel no pudo leer la fuente</p>
        <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
      </Stack>
      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button variant="ghost" size="sm" onClick={onManualFallback}>
          Completar manualmente
        </Button>
        {onRetry && (
          <Button size="sm" onClick={onRetry} data-testid="intake-retry-btn">
            Reintentar
          </Button>
        )}
      </div>
    </Stack>
  );
}
