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
import { useChatStore } from "@/stores/chat-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ValeriaCollapsedStrip } from "./ValeriaCollapsedStrip";
import { ValeriaHistory } from "./ValeriaHistory";
import { ValeriaChat } from "./ValeriaChat";

// ─── T-3 binary machine render contract (ValeriaRail retired) ─────────────────
//
// vitalia-shell-core-hardening T-3 retires the 60px ValeriaRail. The binary
// machine valeriaOpen (closed | chat) + additive historyOpen now drives THREE
// real layouts (no more rail bridge):
//
//   valeriaOpen "closed"                      → state A: ValeriaCollapsedStrip
//     (~44px tira-avatar at the left edge). The agent panel on the other side
//     of the shell split gets the room. No chat, no rail. Click strip → B.
//   valeriaOpen "chat"  + historyOpen false → state B: Chat only (chat-only split).
//   valeriaOpen "chat"  + historyOpen true  → state C: History (260px push) | Chat.
//
// The legacy shellMode auto-coupling is gone (RN-1/AC-1). Keyboard shortcuts map
// to the new setters; "n" (new conversation) wires to the real chat-store action
// (RN-13) — no more alert placeholder.

type ValeriaRender = "strip" | "chat" | "history";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ValeriaSidebar — organism that composes:
 *   - ValeriaCollapsedStrip (state A, closed)
 *   - ValeriaHistory (state C, chat + history)
 *   - ValeriaChat (states B + C, visible whenever Valeria is open)
 *
 * Consumes useShellStore READ-ONLY (no schema mutation per F1-S5 arch test).
 * "use client" required: state + effects + event handlers + matchMedia.
 */
export function ValeriaSidebar() {
  // ── Stable Zustand selectors (binary machine) ─────────────────────────────
  const valeriaOpen = useShellStore((s) => s.valeriaOpen);
  const historyOpen = useShellStore((s) => s.historyOpen);
  const openValeria = useShellStore((s) => s.openValeria);
  const collapseValeria = useShellStore((s) => s.collapseValeria);
  const openHistory = useShellStore((s) => s.openHistory);
  const closeHistory = useShellStore((s) => s.closeHistory);
  // T-3: "+" / 'n' archive current conv + clear chat (RN-13, UI-local).
  const newConversation = useChatStore((s) => s.newConversation);
  // D5 (T-4): mobile drawer independent slice — NOT derived from valeriaOpen
  const mobileDrawerOpen = useShellStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useShellStore((s) => s.setMobileDrawerOpen);

  // ── Map machine → render shape (T-3, three real layouts) ──────────────────
  // closed → "strip" (44px) · chat + history → "history" · chat → "chat".
  const renderShape: ValeriaRender =
    valeriaOpen === "closed"
      ? "strip"
      : historyOpen
        ? "history"
        : "chat";

  // ── Handlers ─────────────────────────────────────────────────────────────
  // T-3: real chat-store action (archive + clear, RN-13) replaces the placeholder.
  const handleNewConversation = () => newConversation();

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
    // T-1 mapping: c → collapse (closes history per RN-6); r → open chat (rail
    // render, no history); f → open chat + history (additive, RN-7).
    c: () => collapseValeria(),
    r: () => {
      openValeria();
      closeHistory();
    },
    f: () => openHistory(),
    n: handleNewConversation,
    // Escape closes desktop Valeria AND mobile drawer (mobileDrawerOpen=false via
    // independent slice — D5 ADR-vitalia-006). collapseValeria() also closes
    // history (RN-6) so the next reopen never restores it (RN-5).
    Escape: () => {
      collapseValeria();
      setMobileDrawerOpen(false);
    },
    "mod+k": handleFocusComposer,
  });

  // ── Mobile drawer detection via matchMedia ────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Drawer zone: < lg (1024). On tablet (768–1023) Valeria is a drawer/overlay
    // (not inline split) so the agent panel gets full width
    // (vitalia-bugfix-shell-valeria-responsive Point 3, Chris 2026-06-04).
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  // T-3: three real states. closed → strip (44px, collapsed); open → expanded.
  const isExpanded = renderShape !== "strip";
  // First grid column width: strip 44px (state A) · history 280px (state C) ·
  // chat-only 0 (state B — chat spans the whole panel, no left column).
  const firstColWidth =
    renderShape === "strip" ? 44 : renderShape === "history" ? 280 : 0;

  // Live region text per state (Spanish neutro, no voseo)
  const liveText =
    renderShape === "history"
      ? "Valeria con historial"
      : renderShape === "strip"
        ? "Valeria cerrada"
        : "Valeria abierta";

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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
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
          className="fixed inset-y-0 left-0 z-50 flex w-full flex-col bg-card shadow-2xl lg:hidden"
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
            <ValeriaHistory
              onNewConversation={handleNewConversation}
              onCollapseToRail={() => closeHistory()}
            />
            <ValeriaChat />
          </div>
        </aside>
      </>,
      document.body,
    );
  }

  // ── Desktop render (T-3: strip A · chat B · history|chat C) ───────────────
  // State A (strip): single 44px column, no chat (agent panel gets the room).
  // State B (chat): single 1fr column, chat only.
  // State C (history): 280px history (push) | 1fr chat.
  const gridColumns =
    renderShape === "strip"
      ? `${firstColWidth}px`
      : renderShape === "history"
        ? `${firstColWidth}px 1fr`
        : "1fr";

  return (
    <aside
      role="complementary"
      aria-label="Panel Valeria"
      aria-expanded={isExpanded}
      data-testid="valeria-sidebar"
      className="hidden h-full overflow-hidden bg-card motion-reduce:transition-none lg:grid"
      style={{
        gridTemplateColumns: gridColumns,
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

      {/* State A: tira-avatar strip (closed) — reopens to chat (RN-12) */}
      {renderShape === "strip" && <ValeriaCollapsedStrip />}

      {/* State C: history (260px push) — XOR with strip */}
      {renderShape === "history" && (
        <ValeriaHistory
          onNewConversation={handleNewConversation}
          onCollapseToRail={() => closeHistory()}
        />
      )}

      {/* Chat — rendered in states B + C (whenever Valeria is open) */}
      {isExpanded && <ValeriaChat />}
    </aside>
  );
}
