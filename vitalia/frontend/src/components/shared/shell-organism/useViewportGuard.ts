// cap: shell-organism.shell-vitalia
"use client";

/**
 * useViewportGuard — viewport sizing contract for the Vitalia shell.
 *
 * vitalia-shell-core-hardening — T-2 (clamp 320; drawer 1024; sin 620/rail).
 *
 * STORE-INERT BY DESIGN:
 * The shell state machine is binary (`valeriaOpen: "closed" | "chat"`) plus an
 * additive `historyOpen` flag and an INDEPENDENT `mobileDrawerOpen` slice (D5).
 * There is no intermediate "narrow-but-open" state to auto-clamp the store to,
 * and the mobile drawer is governed SOLELY by the burger / close actions — never
 * by the viewport. So this hook NEVER mutates valeriaOpen / historyOpen /
 * mobileDrawerOpen. Auto-mutating the store from a viewport effect was the root
 * cause of Bug #2 (burger flipping the desktop slice) and would break RN-5 /
 * RN-11 (history must never re-open on resize/reload).
 *
 * What this hook OWNS (T-2): the breakpoint constants the layout consumes for its
 * CSS gating + the ResizeObserver clamp of the Valeria panel:
 *   - VALERIA_MIN_PX = 320           clamp floor for the Valeria panel in the
 *                                    inline split window [1024, 1280). Replaces
 *                                    the legacy 620px minimum (+ the 60px rail).
 *   - DRAWER_BREAKPOINT = 1024       below this width Valeria is a drawer/overlay
 *                                    (role=dialog, focus-trap, backdrop, Esc),
 *                                    not an inline panel.
 *   - INLINE_SPLIT_MIN_VIEWPORT = 1280  at/above this width the layout is the
 *                                    fixed 30/70 split + 260px history push.
 *
 * The legacy FULL_STATE_MIN_VIEWPORT (1104) + MOBILE_BREAKPOINT (768) + the 60px
 * rail are REMOVED ("sin 620/rail").
 *
 * The hook itself is intentionally a no-op effect: it exists as the documented
 * home of the contract + a stable hook for the layout to call unconditionally
 * (D3 stable hook count — never conditionally mount/skip it by viewport).
 *
 * HIPAA-lite: no-phi-scope — UI shell sizing, zero PHI.
 * downstream-regression-na: brand-local shell hook; no cross-brand consumers.
 */

import { useEffect } from "react";

/**
 * Clamp floor (px) for the Valeria panel width in the inline split window
 * [1024, 1280). The panel never shrinks below this; consumed by the layout's
 * ResizeObserver/min-size clamp. Replaces the legacy 620px minimum.
 */
export const VALERIA_MIN_PX = 320;

/**
 * Drawer breakpoint (px). Below this viewport width Valeria renders as a
 * drawer/overlay (role=dialog, focus-trap, backdrop, Esc, burger-driven via the
 * independent `mobileDrawerOpen` slice). At/above it Valeria is an inline panel.
 */
export const DRAWER_BREAKPOINT = 1024;

/**
 * Inline-split breakpoint (px). At/above this width the shell renders the fixed
 * 30/70 Valeria/agent split with the 260px history push. In [1024, 1280) Valeria
 * is still inline but clamped to VALERIA_MIN_PX.
 */
export const INLINE_SPLIT_MIN_VIEWPORT = 1280;

/**
 * useViewportGuard — store-inert viewport hook.
 *
 * Call this ONCE, unconditionally, from the layout client (never gate the call by
 * viewport — that would change the hook count and trip "Rendered more hooks").
 * It does NOT mutate the shell store; viewport sizing is handled by CSS gating +
 * the layout's clamp using the exported constants.
 */
export function useViewportGuard(): void {
  useEffect(() => {
    // Intentionally inert: the binary machine has no viewport-driven store
    // mutation. Sizing is CSS-gated + clamped in the layout via the exported
    // constants above. Keeping this effect (empty) preserves a stable hook for
    // the layout and documents the contract home.
    return;
  }, []);
}
