/**
 * useViewportGuard.test.ts — tests for useViewportGuard hook
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-3
 *
 * REWRITTEN for vitalia-shell-core-hardening T-1: the store machine changed
 * (valeriaState collapsed|rail|full + shellMode → valeriaOpen closed|chat +
 * additive historyOpen). The legacy one-way viewport clamp (full → rail when
 * [1024, 1104)) has NO equivalent in the binary machine — there is no
 * intermediate "narrow-but-open" state to clamp to, and forcing chat → closed
 * would HIDE Valeria (a behavior change out of T-1 scope: no re-layout). For T-1
 * the hook is a deliberate INERT no-op: it keeps its public API + exported
 * breakpoint constants without touching the store. These tests assert the
 * inert contract — the store is NEVER mutated regardless of viewport — plus the
 * constants and clean mount/unmount. The viewport-aware sizing rework is T-2/T-3.
 *
 * downstream-regression-na: brand-local hook test; no cross-brand consumers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useShellStore } from "@/stores/shell-store";

describe("useViewportGuard — import contract", () => {
  it("module exports useViewportGuard as named export", async () => {
    const mod = await import("./useViewportGuard");
    expect(typeof mod.useViewportGuard).toBe("function");
  });

  it("re-exports breakpoint constants (consumed elsewhere)", async () => {
    const mod = await import("./useViewportGuard");
    expect(mod.FULL_STATE_MIN_VIEWPORT).toBe(1104);
    expect(mod.MOBILE_BREAKPOINT).toBe(768);
    expect(mod.INLINE_SPLIT_MIN_VIEWPORT).toBe(1024);
  });
});

describe("useViewportGuard — inert no-op contract (T-1 binary machine)", () => {
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

  it("does NOT mutate valeriaOpen at narrow desktop viewport=1050", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1050,
    });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // Binary machine: no clamp — chat stays chat (no re-layout in T-1).
    expect(useShellStore.getState().valeriaOpen).toBe("chat");
  });

  it("does NOT mutate valeriaOpen at wide desktop viewport=1280", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    expect(useShellStore.getState().valeriaOpen).toBe("chat");
  });

  it("does NOT mutate valeriaOpen at tablet viewport=800", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    expect(useShellStore.getState().valeriaOpen).toBe("chat");
  });

  it("does NOT mutate valeriaOpen at mobile viewport=375", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    expect(useShellStore.getState().valeriaOpen).toBe("chat");
  });

  it("[RN-5/RN-11] does NOT touch historyOpen at any viewport", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1050,
    });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // historyOpen is additive UI state — the guard never touches it.
    expect(useShellStore.getState().historyOpen).toBe(true);
  });

  it("[D5] does NOT touch mobileDrawerOpen at any viewport", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // Mobile drawer is governed solely by burger/close actions (D5). Inert here.
    expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
  });
});

describe("useViewportGuard — clean mount / unmount (inert)", () => {
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
