// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4 (REPLACES T-3 stub)
"use client";

/**
 * LuanaSidebar — shell organism root (Luana panel · orquestadora)
 *
 * Port re-tematizado from vitalia/ValeriaSidebar.tsx.
 * Re-themed: Valeria→Luana, ValeriaState→LuanaState, vitalia agents→nicolify.
 *
 * Architecture decisions:
 * - D1 Layout: `full` = [History 280px | Chat 1fr], `rail` = [Rail 60px | Chat 1fr].
 *   Rail + History are MUTUALLY EXCLUSIVE — never both visible at same time.
 * - D2 Auto-coupling: collapsed ↔ shellMode='web', rail|full ↔ shellMode='agentic'.
 * - D4 Keyboard shortcuts: c/r/f/n + Esc + Cmd/Ctrl+K via useKeyboardShortcuts hook.
 * - D5 Mobile drawer (independent slice per ADR-vitalia-006 G2):
 *   Mobile drawer governed SOLELY by `mobileDrawerOpen` — INDEPENDENT of luanaState.
 *   Desktop 'full' NEVER auto-opens mobile drawer (decoupled slice).
 *   Burger sets mobileDrawerOpen=true (in TopBarGlobal).
 *   Close (backdrop/X) calls setMobileDrawerOpen(false). luanaState NOT touched.
 *
 * T-4 SKELETON: chat is non-functional (mock canned responses).
 * Real SSE/WS wiring deferred to R1.
 *
 * No default export (FSD-Lite arch test enforce).
 * role="complementary" on desktop aside (D1 gate requirement — T-4 spec).
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useShellStore } from "@/stores/shell-store";

import { LuanaChat } from "./LuanaChat";
import { LuanaHistory } from "./LuanaHistory";
import { LuanaRail } from "./LuanaRail";

import type { LuanaState } from "@/stores/shell-store";

// ─── Valid states ─────────────────────────────────────────────────────────────

const VALID_STATES = ["collapsed", "history", "full"] as const;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * LuanaSidebar — organism that composes:
 *   - LuanaRail (history mode — shows rail icon buttons)
 *   - LuanaHistory (full mode — shows conversation list)
 *   - LuanaChat (always visible when not collapsed)
 *
 * Consumes useShellStore READ-ONLY (selectors one-per-primitive).
 * "use client" required: state + effects + event handlers + matchMedia.
 */
export function LuanaSidebar() {
  // ── Stable Zustand selectors (one per primitive) ─────────────────────────
  const luanaState = useShellStore((s) => s.luanaState);
  const setLuanaState = useShellStore((s) => s.setLuanaState);
  const setShellMode = useShellStore((s) => s.setShellMode);
  // D5: mobile drawer independent slice — NOT derived from luanaState
  const mobileDrawerOpen = useShellStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useShellStore((s) => s.setMobileDrawerOpen);

  // ── Adversarial guard: invalid state fallback ────────────────────────────
  const safeState: LuanaState = VALID_STATES.includes(luanaState) ? luanaState : "history";

  if (safeState !== luanaState) {
    console.warn(`[LuanaSidebar] Invalid luanaState ignored: ${luanaState}, fallback to 'history'`);
  }

  // ── D2 Auto-coupling effect ─────────────────────────────────────────────
  // collapsed ↔ shellMode='web'
  // history | full ↔ shellMode='agentic'
  useEffect(() => {
    if (safeState === "collapsed") {
      setShellMode("web");
    } else {
      setShellMode("agentic");
    }
  }, [safeState, setShellMode]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  // R0 skeleton: real new-conversation will open via R1 copilot SSE
  // eslint-disable-next-line no-alert -- R0 skeleton placeholder only
  const handleNewConversation = () => alert("Nueva conversación (próximamente)");

  const handleFocusComposer = () => {
    const composer = document.getElementById("luana-composer-placeholder");
    composer?.focus();
  };

  // ── D4 Keyboard shortcuts ─────────────────────────────────────────────────
  useKeyboardShortcuts({
    c: () => setLuanaState("collapsed"),
    r: () => setLuanaState("history"),
    f: () => setLuanaState("full"),
    n: handleNewConversation,
    Escape: () => {
      setLuanaState("collapsed");
      setMobileDrawerOpen(false);
    },
    "mod+k": handleFocusComposer,
  });

  // ── Mobile detection via matchMedia ─────────────────────────────────────
  // Initialize from matchMedia. getInitialIsMobile() is SSR-safe (returns false on server).
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────
  const isExpanded = safeState !== "collapsed";
  const railWidth = safeState === "full" ? 280 : 60;

  const liveText =
    safeState === "collapsed"
      ? "Luana cerrada"
      : safeState === "history"
        ? "Luana abierta"
        : "Luana con historial";

  // ── Ref for hamburger (focus restoration post-drawer-close) ─────────────
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // ── Mobile drawer close handler ──────────────────────────────────────────
  // D5: close uses independent mobile slice — does NOT touch luanaState.
  const handleMobileClose = () => setMobileDrawerOpen(false);

  // ── Mobile drawer render ─────────────────────────────────────────────────
  // Portal mounts directly on document.body — escapes hidden parent container.
  // D5: drawer visibility governed SOLELY by mobileDrawerOpen (independent slice).
  if (isMobile && mobileDrawerOpen) {
    if (typeof document === "undefined") return null;

    return createPortal(
      <>
        {/* Backdrop */}
        <div
          data-testid="luana-drawer-backdrop"
          aria-hidden="true"
          onClick={handleMobileClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />

        {/* Drawer */}
        <aside
          role="dialog"
          aria-label="Panel Luana"
          aria-modal="true"
          aria-expanded="true"
          data-testid="luana-sidebar"
          className="fixed inset-y-0 left-0 z-50 flex w-full flex-col bg-card shadow-2xl md:hidden"
        >
          {/* Drawer header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-agent-luana"
                aria-hidden="true"
              >
                <span className="select-none text-xs font-semibold text-white">L</span>
              </div>
              <span className="text-sm font-semibold text-foreground">Luana</span>
            </div>

            <button
              ref={hamburgerRef}
              type="button"
              aria-label="Cerrar panel Luana"
              data-testid="luana-drawer-close"
              onClick={handleMobileClose}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <LuanaHistory onCollapseToRail={() => setLuanaState("history")} />
            <LuanaChat />
          </div>
        </aside>
      </>,
      document.body,
    );
  }

  // ── Desktop render ────────────────────────────────────────────────────────
  return (
    <aside
      role="complementary"
      aria-label="Panel Luana"
      aria-expanded={isExpanded}
      data-testid="luana-sidebar"
      data-luana-state={safeState}
      className="hidden h-full overflow-hidden bg-card motion-reduce:transition-none md:grid"
      style={{
        gridTemplateColumns: `${railWidth}px 1fr`,
        gridTemplateRows: "minmax(0, 1fr)",
        transition: "grid-template-columns 220ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      {/* Live region — announces state changes to screen readers */}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveText}
      </span>

      {/* Rail XOR History — mutually exclusive per D1 */}
      {safeState === "collapsed" ? null : safeState === "full" ? (
        <LuanaHistory onCollapseToRail={() => setLuanaState("history")} />
      ) : (
        <LuanaRail
          onToggleHistory={() => setLuanaState("full")}
          onNewConversation={handleNewConversation}
          onSearch={handleFocusComposer}
          onCollapse={() => setLuanaState("collapsed")}
        />
      )}

      {/* Chat — always rendered when not collapsed */}
      {safeState !== "collapsed" && <LuanaChat />}
    </aside>
  );
}
