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
import { useShellStore } from "@/stores/shell-store";

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
  const setValeriaState = useShellStore((s) => s.setValeriaState);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId = 0;

    const check = (): void => {
      const w = window.innerWidth;

      // No-op: drawer zone (< lg / 1024) — tablet + mobile. Valeria is NOT inline
      // here (it renders as a drawer/overlay), so valeriaState is irrelevant to the
      // inline split and must NOT be touched (Point 3, 2026-06-04). The mobile/tablet
      // drawer open/closed is governed SOLELY by `mobileDrawerOpen` (independent slice,
      // D5 ADR-vitalia-006); the burger opens it, the close handler closes it.
      if (w < INLINE_SPLIT_MIN_VIEWPORT) return;

      // No-op: wide desktop — full state fits without clamping
      if (w >= FULL_STATE_MIN_VIEWPORT) return;

      // [1024, 1104): inline but 'full' won't fit comfortably → one-way force 'full' → 'rail'
      // Read current state fresh each check to avoid stale closure
      const currentState = useShellStore.getState().valeriaState;
      if (currentState === "full") {
        setValeriaState("rail");
      }
    };

    const onResize = (): void => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(check);
    };

    // Initial check on mount
    check();

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
  }, [setValeriaState]);
}
