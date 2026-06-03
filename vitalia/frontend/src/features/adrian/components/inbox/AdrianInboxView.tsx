// cap: adrian.inbox
// story-origin: vitalia-fase2-adrian-inbox
/**
 * AdrianInboxView — client root skeleton for Adrián Inbox.
 * T-3 vitalia-fase2-adrian-inbox (SKELETON — T-5 will flesh out 3-pane layout)
 *
 * This file establishes the component contract so that:
 *   - The page.tsx RSC can import and render it (tsc must be GREEN after T-3).
 *   - The barrel (index.ts) can export it.
 *   - T-4 and T-5 fill in the real 3-pane ResizablePanelGroup implementation.
 *
 * Props contract mirrors mateo/components/agenda/ValeriaAgendaView.tsx pattern.
 * No-op placeholder body until T-5.
 *
 * "use client" — this is the React tree entry point for the inbox sub-tab.
 *
 * HIPAA-lite: no PHI rendered in this skeleton; no PHI in URL params.
 * FSD-Lite: no cross-feature imports; uses only @/lib and shared components.
 *
 * spec_anchor: 03-arch-fe.md § 3 + 06-tickets.yaml T-3 (★ IMPORTANT note)
 * downstream-regression-na: brand-local component; no cross-brand consumers
 */

"use client";

import type { InitialInboxState } from "@/features/adrian/api/inbox-server";

// ── Props ────────────────────────────────────────────────────────────────────────

export interface AdrianInboxViewProps {
  /** SSR-hydrated initial data (conversation list + optional detail). */
  initialData: InitialInboxState;
  /** UUID of the conversation to deep-link (from ?conv= searchParam). */
  initialConvId: string | null;
  /** Inbox filter from URL searchParam (whitelisted). */
  initialFilter: string | null;
  /** Tenant ID (from URL params — drives RQ key scope). */
  tenantId: string;
}

// ── AdrianInboxView ───────────────────────────────────────────────────────────────

/**
 * AdrianInboxView — SKELETON.
 *
 * T-3: establishes the component shell so tsc + barrel + route compile.
 * T-4: consolidates migrated components (ConvList, Thread, Sidebar).
 * T-5: implements 3-pane ResizablePanelGroup + ModeToggle + ConversationModeButton
 *      + ToolCallCard + NudgeButton + useValeriaReaccion.
 *
 * Renders a placeholder section so the route is visually non-blank.
 * EmptyState shell component is reused from shared/shell-organism.
 */
export function AdrianInboxView({
  initialData,
  initialConvId: _initialConvId,
  initialFilter: _initialFilter,
  tenantId: _tenantId,
}: AdrianInboxViewProps) {
  // Suppress unused-variable warnings — T-5 will wire these fully.
  void initialData;

  return (
    <section
      aria-label="Inbox de Adrián"
      className="flex h-full w-full flex-col"
      data-testid="adrian-inbox-view"
    >
      {/* T-5 will replace this placeholder with the real 3-pane layout */}
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Inbox de Adrián — cargando…
        </p>
      </div>
    </section>
  );
}
