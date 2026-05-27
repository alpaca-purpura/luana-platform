/**
 * useViewportGuard.test.ts — TDD RED-first tests for useViewportGuard hook
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-3
 *
 * gherkin_coverage:
 * - SC-2 negative: viewport <768 (mobile) → no-op, ValeriaSidebar hidden via Tailwind
 * - SC-3 edge: viewport [768, 1104) + state='full' → forces 'rail' (one-way guard)
 * - SC-3 edge: no auto-restore when viewport grows back (one-way only)
 * - SC-3 edge: viewport >=1104 → no-op (full fits without clamp)
 *
 * 03-arch.md § 2.6 — useViewportGuard spec verbatim:
 * - FULL_STATE_MIN_VIEWPORT = 1104 (valeria 620 + handle ~4 + app 480)
 * - MOBILE_BREAKPOINT = 768 (< md)
 * - One-way: full → rail when [768, 1104). No auto-restore to full.
 * - No-op when w < 768 (mobile delegate to drawer F1-S5+)
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

describe("useViewportGuard — forces 'rail' when viewport [768, 1104) + state='full' (SC-3)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 900,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forces valeriaState from 'full' to 'rail' at viewport=900", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // Force should happen immediately on mount (initial check)
    expect(useShellStore.getState().valeriaState).toBe("rail");
  });

  it("no-op when state is already 'rail' at viewport=900", async () => {
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
      value: 900,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("state stays 'rail' after viewport grows from 900 to 1280", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // Guard forced 'rail' at w=900
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

describe("useViewportGuard — no-op when mobile viewport < 768 (SC-2)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no-op when viewport=375 (mobile < 768) — delegate to drawer F1-S5+", async () => {
    const { useViewportGuard } = await import("./useViewportGuard");

    renderHook(() => useViewportGuard());

    // No-op: mobile viewport delegates to drawer pattern (F1-S5+)
    // State should remain unchanged 'full'
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
