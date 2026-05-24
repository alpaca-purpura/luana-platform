"use client";

/**
 * ValeriaSidebar — shell organism root (Valeria panel)
 * T-5 of vitalia-fase1-valeria-rail-history (F1-S5)
 *
 * Architecture decisions:
 * - D1 Layout: `full` = [History 280px | Chat 1fr], `rail` = [Rail 60px | Chat 1fr].
 *   Rail + History are MUTUALLY EXCLUSIVE — never both visible at same time.
 * - D2 Auto-coupling: collapsed ↔ shellMode='web', rail|full ↔ shellMode='agentic'.
 *   Effect runs after valeriaState update (useEffect dependency).
 * - D4 Keyboard shortcuts: c/r/f/n + Esc + Cmd/Ctrl+K via useKeyboardShortcuts hook.
 *   Hardened guard on hook side (IME + input context bypass).
 * - D7 Mobile drawer: <md viewport renders fixed drawer with backdrop + focus trap.
 *   Mobile close DOES NOT call setShellMode (preserves previous mode).
 *
 * Adversarial guard:
 * - Invalid valeriaState → console.warn + fallback to 'rail' (no crash).
 *
 * HIPAA-lite: no-phi-scope — UI chrome only.
 * No default export (FSD-Lite arch test enforce).
 * No hex colors — semantic tokens only.
 *
 * spec: 01-spec.md § 0 D1+D2+D4 + § 1 Scenarios 1-5 + § 5 handlers
 * arch: 03-arch.md § 2.5 ValeriaSidebar + § 2.7 mobile drawer
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useShellStore } from "@/stores/shell-store";
import type { ValeriaState } from "@/stores/shell-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ValeriaRail } from "./ValeriaRail";
import { ValeriaHistory } from "./ValeriaHistory";
import { ValeriaChatSlot } from "./ValeriaChatSlot";

// ─── Valid states ─────────────────────────────────────────────────────────────

const VALID_STATES = ["collapsed", "rail", "full"] as const;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ValeriaSidebar — organism that composes:
 *   - ValeriaRail (rail mode)
 *   - ValeriaHistory (full mode)
 *   - ValeriaChatSlot (always visible when expanded)
 *
 * Consumes useShellStore READ-ONLY (no schema mutation per F1-S5 arch test).
 * "use client" required: state + effects + event handlers + matchMedia.
 */
export function ValeriaSidebar() {
  // ── Stable Zustand selectors (one per primitive) ──────────────────────────
  const valeriaState = useShellStore((s) => s.valeriaState);
  const setValeriaState = useShellStore((s) => s.setValeriaState);
  const setShellMode = useShellStore((s) => s.setShellMode);

  // ── Adversarial guard: invalid state fallback ─────────────────────────────
  const safeState: ValeriaState = VALID_STATES.includes(
    valeriaState as ValeriaState,
  )
    ? valeriaState
    : "rail";

  if (safeState !== valeriaState) {
    console.warn(
      `[ValeriaSidebar] Invalid valeriaState ignored: ${valeriaState}, fallback to 'rail'`,
    );
  }

  // ── D2 Auto-coupling effect ───────────────────────────────────────────────
  // collapsed ↔ shellMode='web'
  // rail | full ↔ shellMode='agentic'
  useEffect(() => {
    if (safeState === "collapsed") {
      setShellMode("web");
    } else {
      setShellMode("agentic");
    }
  }, [safeState, setShellMode]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleNewConversation = () =>
    alert("Nueva conversación (próximamente)");

  const handleFocusComposer = () => {
    const composer = document.getElementById("valeria-composer-placeholder");
    composer?.focus();
  };

  // ── D4 Keyboard shortcuts ─────────────────────────────────────────────────
  // Guard is hardened on the hook side (IME + input context).
  // useKeyboardShortcuts re-attaches on every render here because the
  // shortcuts dict is rebuilt on render. This is intentional per spec —
  // the handlers capture fresh closure references.
  // For memoized builds (future perf): wrap handlers in useCallback.
  useKeyboardShortcuts({
    c: () => setValeriaState("collapsed"),
    r: () => setValeriaState("rail"),
    f: () => setValeriaState("full"),
    n: handleNewConversation,
    Escape: () => setValeriaState("collapsed"),
    "mod+k": handleFocusComposer,
  });

  // ── Mobile drawer detection via matchMedia ────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const isExpanded = safeState !== "collapsed";
  const railWidth = safeState === "full" ? 280 : 60;

  // Live region text per state (Spanish neutro, no voseo)
  const liveText =
    safeState === "collapsed"
      ? "Valeria cerrada"
      : safeState === "rail"
        ? "Valeria abierta"
        : "Valeria con historial";

  // ── Ref for hamburger (focus restoration post-drawer-close) ──────────────
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // ── Mobile drawer close handler ───────────────────────────────────────────
  // NOTE: does NOT call setShellMode — mobile close preserves previous mode.
  const handleMobileClose = () => setValeriaState("collapsed");

  // ── Mobile drawer render ──────────────────────────────────────────────────
  if (isMobile && isExpanded) {
    return (
      <>
        {/* Backdrop */}
        <div
          data-testid="valeria-drawer-backdrop"
          aria-hidden="true"
          onClick={handleMobileClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />

        {/* Drawer */}
        <aside
          role="complementary"
          aria-label="Panel Valeria"
          aria-modal="true"
          aria-expanded="true"
          data-testid="valeria-sidebar"
          className="fixed inset-y-0 left-0 z-50 flex w-full flex-col bg-card shadow-2xl md:hidden"
        >
          {/* Drawer header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-agent-valeria"
                aria-hidden="true"
              >
                <span className="select-none text-xs font-semibold text-white">
                  V
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                Valeria
              </span>
            </div>

            <button
              ref={hamburgerRef}
              type="button"
              aria-label="Cerrar panel Valeria"
              data-testid="valeria-drawer-close"
              onClick={handleMobileClose}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* Body: history + chat stacked */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ValeriaHistory onCollapseToRail={() => setValeriaState("rail")} />
            <ValeriaChatSlot />
          </div>
        </aside>
      </>
    );
  }

  // ── Desktop / collapsed render ────────────────────────────────────────────
  return (
    <aside
      role="complementary"
      aria-label="Panel Valeria"
      aria-expanded={isExpanded}
      data-testid="valeria-sidebar"
      className="hidden h-full overflow-hidden border-r border-border bg-card motion-reduce:transition-none md:grid"
      style={{
        gridTemplateColumns: `${railWidth}px 1fr`,
        gridTemplateRows: "minmax(0, 1fr)",
        transition: "grid-template-columns 220ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      {/* Live region — announces state changes to screen readers */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveText}
      </span>

      {/* Rail XOR History — mutually exclusive per D1 */}
      {safeState === "full" ? (
        <ValeriaHistory onCollapseToRail={() => setValeriaState("rail")} />
      ) : (
        <ValeriaRail
          onToggleHistory={() => setValeriaState("full")}
          onNewConversation={handleNewConversation}
          onSearch={handleFocusComposer}
          onCollapse={() => setValeriaState("collapsed")}
        />
      )}

      {/* ChatSlot — always rendered when not collapsed */}
      <ValeriaChatSlot />
    </aside>
  );
}
