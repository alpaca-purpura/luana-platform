/**
 * useViewportGuard.test.ts — tests for useViewportGuard hook
 *
 * REWRITTEN for vitalia-shell-core-hardening T-2 (clamp 320; drawer 1024;
 * sin 620/rail). The binary machine (valeriaOpen closed|chat + additive
 * historyOpen) has NO intermediate "narrow-but-open" state to clamp to, and the
 * mobile drawer is governed SOLELY by the burger/close actions (D5 independent
 * `mobileDrawerOpen` slice). So the hook stays STORE-INERT — it never mutates
 * valeriaOpen/historyOpen/mobileDrawerOpen at any viewport.
 *
 * What T-2 changes vs T-1: the EXPORTED contract. The viewport-aware sizing is
 * expressed as breakpoint constants the layout consumes for clamping:
 *   - VALERIA_MIN_PX = 320       → clamp floor in [1024,1280) (replaces 620 legacy)
 *   - DRAWER_BREAKPOINT = 1024   → below: Valeria is a drawer/overlay
 *   - INLINE_SPLIT_MIN_VIEWPORT = 1280 → at/above: split 30/70 + history 260 fixed
 * Legacy constants FULL_STATE_MIN_VIEWPORT (1104) + MOBILE_BREAKPOINT (768) +
 * the 60px rail are REMOVED (AC: "sin 620/rail").
 *
 * downstream-regression-na: brand-local hook test; no cross-brand consumers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useShellStore } from "@/stores/shell-store";

describe("useViewportGuard — import contract (T-2)", () => {
  it("module exports useViewportGuard as named export", async () => {
    const mod = await import("./useViewportGuard");
    expect(typeof mod.useViewportGuard).toBe("function");
  });

  it("exports the T-2 clamp/drawer constants (320 / 1024 / 1280)", async () => {
    const mod = await import("./useViewportGuard");
    expect(mod.VALERIA_MIN_PX).toBe(320);
    expect(mod.DRAWER_BREAKPOINT).toBe(1024);
    expect(mod.INLINE_SPLIT_MIN_VIEWPORT).toBe(1280);
  });

  it("does NOT re-export the legacy 620/rail constants (sin 620/rail)", async () => {
    const mod = (await import("./useViewportGuard")) as Record<string, unknown>;
    // FULL_STATE_MIN_VIEWPORT (was 1104 for the 620 valeria minimum) is GONE.
    expect(mod.FULL_STATE_MIN_VIEWPORT).toBeUndefined();
    // MOBILE_BREAKPOINT (768) is GONE — the drawer breakpoint is 1024 now.
    expect(mod.MOBILE_BREAKPOINT).toBeUndefined();
  });
});

describe("useViewportGuard — store-inert contract (binary machine, D5)", () => {
  beforeEach(() => {
    useShellStore.setState({
      valeriaOpen: "chat",
      historyOpen: true,
      mobileDrawerOpen: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const viewports = [
    { label: "wide desktop (>=1280, inline split)", value: 1440 },
    { label: "narrow desktop ([1024,1280), clamp 320)", value: 1100 },
    { label: "drawer boundary (<1024)", value: 900 },
    { label: "mobile", value: 375 },
  ];

  for (const vp of viewports) {
    it(`does NOT mutate valeriaOpen at ${vp.label} = ${vp.value}`, async () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: vp.value,
      });
      const { useViewportGuard } = await import("./useViewportGuard");

      renderHook(() => useViewportGuard());

      // No clamp on the store: chat stays chat at every viewport.
      expect(useShellStore.getState().valeriaOpen).toBe("chat");
    });
  }

  it("[RN-5/RN-11] does NOT touch historyOpen at any viewport", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1100,
    });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    expect(useShellStore.getState().historyOpen).toBe(true);
  });

  it("[D5] does NOT touch mobileDrawerOpen at any viewport (drawer = burger only)", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
  });
});

describe("useViewportGuard — clean mount / unmount", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mounts and unmounts without throwing", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    const { unmount } = renderHook(() => useViewportGuard());
    expect(() => unmount()).not.toThrow();
  });

  it("does NOT mutate the store across mount + unmount", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    const { unmount } = renderHook(() => useViewportGuard());
    unmount();

    expect(useShellStore.getState().valeriaOpen).toBe("chat");
    expect(useShellStore.getState().historyOpen).toBe(false);
  });
});
