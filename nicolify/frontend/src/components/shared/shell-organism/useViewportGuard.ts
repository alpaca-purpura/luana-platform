// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-3
"use client";

/**
 * useViewportGuard — auto-force luanaState 'rail' when viewport [768, 1104)
 * + state='full' won't fit (min 1104px required).
 *
 * nicolify-r0-shell T-3 — port from vitalia useViewportGuard.ts
 * Renamed: Valeria → Luana, valeria actions → luana actions
 *
 * ADR-nicolify-001 G2 (SSR-safe) + 01-spec.md § B3 responsive
 *
 * Resolution per spec B3:
 * - FULL_STATE_MIN_VIEWPORT = 1104 (luana 620 + handle ~4 + app 480)
 * - MOBILE_BREAKPOINT = 768 (< md)
 * - One-way guard: full → rail when [768, 1104). No auto-restore to full.
 * - No-op for luanaState when w < 768 (mobile) — mobileDrawerOpen governed
 *   by independent slice (setMobileDrawerOpen).
 * - No-op when w >= 1104 (full fits)
 * - Cleans up: removeEventListener + cancelAnimationFrame on unmount
 *
 * downstream-regression-na: brand-local hook; no cross-brand consumers
 */

import { useEffect } from "react";

import { useShellStore } from "@/stores/shell-store";

/** Minimum viewport width required to display luanaState='full' comfortably.
 *  Calculation: Luana sidebar (620px) + resize handle (~4px) + app panel (480px) = 1104px.
 */
export const FULL_STATE_MIN_VIEWPORT = 1104;

/** Mobile breakpoint (Tailwind `md`). Below this, drawer pattern delegates to T-4+. */
export const MOBILE_BREAKPOINT = 768;

/**
 * useViewportGuard — viewport-aware one-way guard for shell layout.
 *
 * Mounts a resize listener (RAF-debounced) that forces luanaState from
 * 'full' to 'rail' when the viewport falls in [768, 1104). The guard is
 * one-way: it never auto-restores to 'full' when viewport grows back —
 * that is a deliberate user action (rail expand button, T-4).
 *
 * Usage: call inside 'use client' components only (needs window access).
 */
export function useViewportGuard(): void {
  const setLuanaState = useShellStore((s) => s.setLuanaState);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId = 0;

    const check = (): void => {
      const w = window.innerWidth;

      // No-op: mobile viewport (< 768) — luanaState is NOT touched here.
      // ADR-vitalia-006 D5 (pattern origin): mobile drawer open/closed is governed
      // SOLELY by `mobileDrawerOpen` (independent slice, default false = closed on fresh mount).
      // This hook has zero role in mobileDrawerOpen.
      if (w < MOBILE_BREAKPOINT) return;

      // No-op: wide desktop — full state fits without clamping
      if (w >= FULL_STATE_MIN_VIEWPORT) return;

      // [768, 1104): one-way force 'full' → 'history' (intermediate state)
      // Nicolify uses collapsed/history/full (no 'rail' state unlike Vitalia)
      // Read current state fresh each check to avoid stale closure
      const currentState = useShellStore.getState().luanaState;
      if (currentState === "full") {
        setLuanaState("history");
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
  }, [setLuanaState]);
}
