// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s4-TBD
"use client";

/**
 * useViewportGuard — auto-force valeriaState 'rail' when viewport [1024, 1104)
 * + state='full' won't fit inline (min 1104px required). Below 1024 (tablet/mobile)
 * Valeria is a drawer/overlay → this guard is a no-op there (Point 3, 2026-06-04).
 *
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-3
 * Updated vitalia-shell-state-persistence T-4 (D5 formal documentation).
 * 03-arch.md § 2.6 + ADR-vitalia-006 § D5
 *
 * Resolution architect § Q9:
 * - FULL_STATE_MIN_VIEWPORT = 1104 (valeria 620 + handle ~4 + app 480)
 * - MOBILE_BREAKPOINT = 768 (< md)
 * - One-way guard: full → rail when [768, 1104). No auto-restore to full.
 * - No-op for valeriaState when w < 768 (mobile) — IMPORTANT: at mobile mount,
 *   this hook does NOT touch valeriaState. The mobile drawer open/closed state
 *   is governed SOLELY by `mobileDrawerOpen` (independent slice in shell-store,
 *   ADR-vitalia-006 § D5). Default mobileDrawerOpen=false means drawer starts
 *   CLOSED on fresh mobile mount. User's last choice is remembered via
 *   persistence (SC-5b). This hook has NO role in mobileDrawerOpen governance.
 * - No-op when w >= 1104 (full fits)
 * - Cleans up: removeEventListener + cancelAnimationFrame on unmount
 *
 * downstream-regression-na: brand-local hook; no cross-brand consumers
 */

import { useEffect } from "react";

/** Minimum viewport width required to display valeriaState='full' comfortably.
 *  Calculation: Valeria sidebar (620px) + resize handle (~4px) + app panel (480px) = 1104px.
 */
export const FULL_STATE_MIN_VIEWPORT = 1104;

/** Mobile breakpoint (Tailwind `md`). */
export const MOBILE_BREAKPOINT = 768;

/**
 * Inline-split breakpoint (Tailwind `lg`). At/above this, Valeria renders as an
 * inline resizable split; below it (tablet + mobile) Valeria is a drawer/overlay
 * and the agent panel takes full width — so this guard is a no-op there.
 * vitalia-bugfix-shell-valeria-responsive Point 3 (Chris 2026-06-04).
 */
export const INLINE_SPLIT_MIN_VIEWPORT = 1024;

/**
 * useViewportGuard — viewport-aware one-way guard for shell layout.
 *
 * Mounts a resize listener (RAF-debounced) that forces valeriaState from
 * 'full' to 'rail' when the viewport falls in [768, 1104). The guard is
 * one-way: it never auto-restores to 'full' when viewport grows back —
 * that is a deliberate user action (rail expand button, F1-S5).
 *
 * Usage: call inside 'use client' components only (needs window access).
 */
export function useViewportGuard(): void {
  // T-1 (vitalia-shell-core-hardening) minimal compile fixup — NO re-layout.
  //
  // The legacy guard forced the 3-state valeriaState 'full' → 'rail' when the
  // viewport was [1024, 1104) (full split didn't fit). The new machine is binary
  // (valeriaOpen: closed | chat) — there is NO intermediate "narrow-but-open"
  // state to clamp to, so the one-way clamp has NO equivalent here. Forcing
  // 'chat' → 'closed' on a narrow desktop would HIDE Valeria (a behavior change
  // out of T-1 scope: no re-layout). The viewport-aware sizing rework belongs to
  // T-2/T-3. For T-1 this guard is a deliberate no-op: it keeps its public API +
  // exported breakpoint constants (still consumed elsewhere) without touching the
  // store. The component-level min-px logic (ShellOrganismLayoutClient) already
  // clamps the split width via ResizeObserver, so layout still respects minimums.
  useEffect(() => {
    // Intentionally inert in the binary machine (closed | chat). See header.
    return;
  }, []);
}
