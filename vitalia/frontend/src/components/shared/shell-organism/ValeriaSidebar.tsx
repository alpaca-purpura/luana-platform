// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s5-TBD
"use client";

/**
 * ValeriaSidebar — shell organism root (Valeria panel)
 * T-5 of vitalia-fase1-valeria-rail-history (F1-S5)
 * Updated vitalia-shell-state-persistence T-4: mobile drawer reads mobileDrawerOpen (D5).
 *
 * Architecture decisions:
 * - D1 Layout: `full` = [History 280px | Chat 1fr], `rail` = [Rail 60px | Chat 1fr].
 *   Rail + History are MUTUALLY EXCLUSIVE — never both visible at same time.
 * - D2 Auto-coupling: collapsed ↔ shellMode='web', rail|full ↔ shellMode='agentic'.
 *   Effect runs after valeriaState update (useEffect dependency).
 * - D4 Keyboard shortcuts: c/r/f/n + Esc + Cmd/Ctrl+K via useKeyboardShortcuts hook.
 *   Hardened guard on hook side (IME + input context bypass).
 * - D5 Mobile drawer (T-4 vitalia-shell-state-persistence ADR-vitalia-006):
 *   Mobile drawer open/closed is governed SOLELY by `mobileDrawerOpen` (independent slice).
 *   Does NOT derive from valeriaState — desktop 'full' NEVER auto-opens mobile drawer
 *   (that was Bug #2 coupling). Burger sets mobileDrawerOpen=true (in TopBarGlobal T-2).
 *   Close (backdrop/X) calls setMobileDrawerOpen(false). valeriaState is NEVER touched
 *   by mobile drawer actions.
 *
 * Adversarial guard:
 * - Invalid valeriaState → console.warn + fallback to 'rail' (no crash).
 *
 * HIPAA-lite: no-phi-scope — UI chrome only.
 * No default export (FSD-Lite arch test enforce).
 * No hex colors — semantic tokens only.
 *
 * spec: 01-spec.md § Decisión usabilidad + SC-4/SC-5/SC-5b + 03-arch.md § 2 D5
 * arch: 03-arch.md § 2 D5 (mobile slice independent)
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useShellStore } from "@/stores/shell-store";
import type { ValeriaState } from "@/stores/shell-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ValeriaRail } from "./ValeriaRail";
import { ValeriaHistory } from "./ValeriaHistory";
import { ValeriaChat } from "./ValeriaChat";

// ─── Valid states ─────────────────────────────────────────────────────────────

const VALID_STATES = ["collapsed", "rail", "full"] as const;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ValeriaSidebar — organism that composes:
 *   - ValeriaRail (rail mode)
 *   - ValeriaHistory (full mode)
 *   - ValeriaChat (always visible when expanded)
 *
 * Consumes useShellStore READ-ONLY (no schema mutation per F1-S5 arch test).
 * "use client" required: state + effects + event handlers + matchMedia.
 */
export function ValeriaSidebar() {
  // ── Stable Zustand selectors (one per primitive) ──────────────────────────
  const valeriaState = useShellStore((s) => s.valeriaState);
  const setValeriaState = useShellStore((s) => s.setValeriaState);
  const setShellMode = useShellStore((s) => s.setShellMode);
  // D5 (T-4): mobile drawer independent slice — NOT derived from valeriaState
  const mobileDrawerOpen = useShellStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useShellStore((s) => s.setMobileDrawerOpen);

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
    // T-5 impl-fix: Escape closes desktop Valeria (collapsed) AND mobile drawer
    // (mobileDrawerOpen=false via independent slice — D5 ADR-vitalia-006).
    // The bug: Escape only called setValeriaState('collapsed') which doesn't close
    // the mobile drawer (mobileDrawerOpen is an independent slice, not derived from valeriaState).
    Escape: () => {
      setValeriaState("collapsed");
      setMobileDrawerOpen(false);
    },
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
  // D5 (T-4): close uses independent mobile slice — does NOT touch valeriaState.
  // valeriaState (desktop) is preserved. This decouples Bug #2 coupling.
  const handleMobileClose = () => setMobileDrawerOpen(false);

  // ── Mobile drawer render ──────────────────────────────────────────────────
  // ★ FIX T-5.bis: ValeriaSidebar is nested inside <main className="hidden md:block">
  // in ShellOrganismLayoutClient.tsx. CSS spec: descendants of display:none do NOT
  // render/paint, even position:fixed children. Portal mounts the drawer directly on
  // document.body — escaping the hidden parent while keeping the React tree intact.
  // ShellOrganismLayoutClient.tsx is NOT modified (regression risk = 0).
  //
  // D5 (T-4): drawer visibility governed SOLELY by mobileDrawerOpen (independent slice).
  // isExpanded (valeriaState) is NOT used for mobile drawer — prevents Bug #2 coupling
  // where desktop valeriaState='full' would auto-open the mobile drawer.
  if (isMobile && mobileDrawerOpen) {
    // SSR guard: document is undefined during server render
    if (typeof document === "undefined") return null;

    return createPortal(
      <>
        {/* Backdrop */}
        <div
          data-testid="valeria-drawer-backdrop"
          aria-hidden="true"
          onClick={handleMobileClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />

        {/* Drawer — role="dialog" + aria-modal valid combo per WCAG/ARIA spec.
            ★ T-8.bis a11y fix: aside con role=complementary NO permite aria-modal.
            Dialog role permite modal pattern + focus trap correctly. */}
        <aside
          role="dialog"
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
            <ValeriaChat />
          </div>
        </aside>
      </>,
      document.body,
    );
  }

  // ── Desktop / collapsed render ────────────────────────────────────────────
  return (
    <aside
      role="complementary"
      aria-label="Panel Valeria"
      aria-expanded={isExpanded}
      data-testid="valeria-sidebar"
      className="hidden h-full overflow-hidden bg-card motion-reduce:transition-none md:grid"
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

      {/* Chat — always rendered when not collapsed */}
      <ValeriaChat />
    </aside>
  );
}
