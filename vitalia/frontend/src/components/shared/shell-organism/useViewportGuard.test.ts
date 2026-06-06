/**
 * useViewportGuard.test.ts — TDD RED-first tests for useViewportGuard hook
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-3
 *
 * gherkin_coverage:
 * - SC-2 negative: viewport <1024 (tablet/mobile = drawer) → no-op, Valeria is overlay
 * - SC-3 edge: viewport [1024, 1104) + state='full' → forces 'rail' (one-way guard)
 * - SC-3 edge: no auto-restore when viewport grows back (one-way only)
 * - SC-3 edge: viewport >=1104 → no-op (full fits without clamp)
 *
 * Updated bugfix-shell-valeria-responsive Point 3 (Chris 2026-06-04):
 * - FULL_STATE_MIN_VIEWPORT = 1104 (valeria 620 + handle ~4 + app 480)
 * - INLINE_SPLIT_MIN_VIEWPORT = 1024 (Tailwind `lg`) — below it Valeria is a drawer
 * - One-way: full → rail when [1024, 1104). No auto-restore to full.
 * - No-op when w < 1024 (tablet + mobile = drawer/overlay, full width agent)
 * - No-op when w >= 1104 (full fits)
 * - Cleans up: removeEventListener + cancelAnimationFrame on unmount
 *
 * downstream-regression-na: brand-local hook test; no cross-brand consumers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShellStore } from "@/stores/shell-store";

// We import the hook after setting up mocks — it doesn't exist yet (RED phase)
// import { useViewportGuard } from "./useViewportGuard";

describe("useViewportGuard — import contract", () => {
  it("module exports useViewportGuard as named export", async () => {
    const mod = await import("./useViewportGuard");
    expect(typeof mod.useViewportGuard).toBe("function");
  });
});

describe("useViewportGuard — no-op when viewport >= 1104 (SC-3)", () => {
  beforeEach(() => {
    // Reset store to 'full'
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    // Mock innerWidth: desktop wide (>= 1104)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not change valeriaState='full' when viewport=1280 (>= 1104)", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // State should remain 'full' — wide viewport allows it
    expect(useShellStore.getState().valeriaState).toBe("full");
  });
});

describe("useViewportGuard — forces 'rail' when viewport [1024, 1104) + state='full' (SC-3 / Point 3)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    // 1050 is inline (>= lg 1024) but < FULL_STATE_MIN_VIEWPORT (1104) → 'full' won't fit
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1050,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forces valeriaState from 'full' to 'rail' at viewport=1050", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // Force should happen immediately on mount (initial check)
    expect(useShellStore.getState().valeriaState).toBe("rail");
  });

  it("no-op when state is already 'rail' at viewport=1050", async () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // Already 'rail' — should remain 'rail'
    expect(useShellStore.getState().valeriaState).toBe("rail");
  });
});

describe("useViewportGuard — no auto-restore on viewport grow (SC-3 edge)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1050,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("state stays 'rail' after viewport grows from 1050 to 1280", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // Guard forced 'rail' at w=1050
    expect(useShellStore.getState().valeriaState).toBe("rail");

    // Now simulate viewport resize to wide desktop
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1280,
      });
      window.dispatchEvent(new Event("resize"));
    });

    // One-way: state stays 'rail' (no auto-restore to 'full')
    expect(useShellStore.getState().valeriaState).toBe("rail");
  });
});

describe("useViewportGuard — no-op for valeriaState when mobile viewport < 768 (SC-2 + D5)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic", mobileDrawerOpen: false });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no-op for valeriaState when viewport=375 (mobile < 768)", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // No-op: valeriaState stays unchanged (hook does NOT touch valeriaState on mobile)
    expect(useShellStore.getState().valeriaState).toBe("full");
  });

  it("[D5] hook does NOT touch mobileDrawerOpen on mobile mount (T-4)", async () => {
    // D5 (ADR-vitalia-006): mobileDrawerOpen is governed by burger/close actions only.
    // useViewportGuard has ZERO role in mobileDrawerOpen governance.
    // Default mobileDrawerOpen=false means drawer starts CLOSED on fresh mobile mount.
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // mobileDrawerOpen must remain false (hook did NOT touch it)
    expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
  });

  it("[D5] hook does NOT open mobile drawer when valeriaState='full' on mobile (T-4)", async () => {
    // Critical: valeriaState='full' on desktop MUST NOT translate to mobileDrawerOpen=true
    // (that was Bug #2 coupling). The hook must leave mobileDrawerOpen untouched.
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic", mobileDrawerOpen: false });
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // Mobile drawer stays closed (fresh default) — desktop 'full' did NOT auto-open it
    expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
  });
});

describe("useViewportGuard — no-op in tablet drawer zone [768, 1024) (Point 3)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no-op for valeriaState when viewport=800 (tablet < lg) — Valeria is a drawer there", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // Tablet is drawer zone → the inline guard must NOT touch valeriaState
    expect(useShellStore.getState().valeriaState).toBe("full");
  });
});

describe("useViewportGuard — cleanup on unmount", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes resize event listener on unmount", async () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { useViewportGuard } = await import("./useViewportGuard");

    const { unmount } = renderHook(() => useViewportGuard());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );
  });
});
