/**
 * ValeriaSidebar.test.tsx — Unit tests for ValeriaSidebar organism
 *
 * REWRITTEN for vitalia-shell-core-hardening T-1: the legacy 3-state machine
 * (valeriaState collapsed|rail|full + shellMode) was replaced by the new binary
 * machine (valeriaOpen closed|chat + additive historyOpen). ValeriaSidebar maps
 * the new store onto the existing render shape WITHOUT re-layout (T-1 directive):
 *
 *   valeriaOpen "chat"  + historyOpen true  → render History | Chat (old "full")
 *   valeriaOpen "chat"  + historyOpen false → render Rail    | Chat (old "rail")
 *   valeriaOpen "closed"                      → render Rail    | Chat (T-1 keeps
 *     Valeria visible as a rail; collapsed render is T-2/T-3, out of scope here)
 *
 * Keyboard: c → collapse (closed, history dropped) · r → open chat (no history) ·
 * f → openHistory (additive — opens chat too, RN-7) · Esc → collapse + close mobile.
 *
 * The shellMode auto-coupling and the INVALID-state console.warn guard are GONE
 * (shellMode eliminated from store RN-1/AC-1; valeriaOpen is a strict union).
 *
 * gherkin_coverage (mapped to new machine):
 * - SC-1 happy: keyboard cycle (r/f/c/Esc) + render aside + grid
 * - SC-7 a11y: live region role='status' aria-live='polite' aria-atomic='true'
 * - SC-8 a11y: mobile drawer (mobileDrawerOpen independent slice)
 *
 * Named export (NO default) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useShellStore } from "@/stores/shell-store";
import { ValeriaSidebar } from "./ValeriaSidebar";

// ─── matchMedia helper ────────────────────────────────────────────────────────

/**
 * Sets up a matchMedia mock for a given query result.
 * happy-dom does not implement matchMedia; we must mock it.
 */
function mockMatchMedia(matches: boolean): void {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: (
        _event: string,
        handler: (e: MediaQueryListEvent) => void,
      ) => {
        listeners.push(handler);
      },
      removeEventListener: (
        _event: string,
        handler: (e: MediaQueryListEvent) => void,
      ) => {
        const idx = listeners.indexOf(handler);
        if (idx > -1) listeners.splice(idx, 1);
      },
      dispatchEvent: vi.fn(),
    })),
  });
}

// ─── Desktop / mobile helpers ────────────────────────────────────────────────

function setupDesktop(): void {
  mockMatchMedia(false); // (max-width: 1023px) does NOT match → desktop
}

function setupMobile(): void {
  mockMatchMedia(true); // (max-width: 1023px) matches → mobile
}

// ─── Reset store state before each test ──────────────────────────────────────

beforeEach(() => {
  // Reset to known desktop state for each test (new machine)
  useShellStore.setState({ valeriaOpen: "chat", historyOpen: false, mobileDrawerOpen: false });
  setupDesktop();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── SC-1 happy: keyboard cycle ──────────────────────────────────────────────

describe("ValeriaSidebar — SC-1 keyboard cycle (shortcuts)", () => {
  it("press 'r' opens Valeria in chat without history (rail render)", async () => {
    useShellStore.setState({ valeriaOpen: "closed", historyOpen: false });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "r" });
    await act(async () => {});

    const state = useShellStore.getState();
    expect(state.valeriaOpen).toBe("chat");
    expect(state.historyOpen).toBe(false);
  });

  it("press 'f' opens history additively (chat + history, RN-7)", async () => {
    useShellStore.setState({ valeriaOpen: "closed", historyOpen: false });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "f" });
    await act(async () => {});

    const state = useShellStore.getState();
    expect(state.valeriaOpen).toBe("chat");
    expect(state.historyOpen).toBe(true);
  });

  it("press 'c' collapses Valeria (closed) and drops history (RN-6)", async () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "c" });
    await act(async () => {});

    const state = useShellStore.getState();
    expect(state.valeriaOpen).toBe("closed");
    expect(state.historyOpen).toBe(false);
  });

  it("press Escape (no input focus) collapses Valeria + drops history", async () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "Escape" });
    await act(async () => {});

    const state = useShellStore.getState();
    expect(state.valeriaOpen).toBe("closed");
    expect(state.historyOpen).toBe(false);
  });

  it("RN-5: reopen after collapse never auto-restores history", async () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "c" }); // collapse → history dropped
    await act(async () => {});
    fireEvent.keyDown(window, { key: "r" }); // reopen chat
    await act(async () => {});

    const state = useShellStore.getState();
    expect(state.valeriaOpen).toBe("chat");
    expect(state.historyOpen).toBe(false);
  });

  it("press 'n' calls window.alert mock with 'próximamente'", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "n" });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("próximamente"),
    );
  });

  it("press Cmd+K calls focus on valeria-composer-placeholder", () => {
    const mockEl = { focus: vi.fn() } as unknown as HTMLElement;
    vi.spyOn(document, "getElementById").mockImplementation((id: string) =>
      id === "valeria-composer-placeholder" ? mockEl : null,
    );

    render(<ValeriaSidebar />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(mockEl.focus).toHaveBeenCalledOnce();
  });

  it("press Ctrl+K calls focus on valeria-composer-placeholder (cross-platform)", () => {
    const mockEl = { focus: vi.fn() } as unknown as HTMLElement;
    vi.spyOn(document, "getElementById").mockImplementation((id: string) =>
      id === "valeria-composer-placeholder" ? mockEl : null,
    );

    render(<ValeriaSidebar />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(mockEl.focus).toHaveBeenCalledOnce();
  });
});

// ─── SC-1 happy: render aside ────────────────────────────────────────────────

describe("ValeriaSidebar — SC-1 render aside with role + aria + grid", () => {
  it("renders aside role='complementary' aria-label='Panel Valeria' data-testid='valeria-sidebar'", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    render(<ValeriaSidebar />);

    const aside = screen.getByRole("complementary", { name: "Panel Valeria" });
    expect(aside).toBeInTheDocument();
    expect(aside).toHaveAttribute("data-testid", "valeria-sidebar");
  });

  it("aria-expanded='true' when Valeria open in chat", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    render(<ValeriaSidebar />);

    const aside = screen.getByTestId("valeria-sidebar");
    expect(aside).toHaveAttribute("aria-expanded", "true");
  });

  it("grid columns 60px/1fr when chat without history (rail render)", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    render(<ValeriaSidebar />);

    const aside = screen.getByTestId("valeria-sidebar");
    expect(aside).toHaveStyle({ gridTemplateColumns: "60px 1fr" });
  });

  it("grid columns 280px/1fr when chat + history (full render)", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true });
    render(<ValeriaSidebar />);

    const aside = screen.getByTestId("valeria-sidebar");
    expect(aside).toHaveStyle({ gridTemplateColumns: "280px 1fr" });
  });

  it("renders ValeriaRail when chat without history (ValeriaHistory NOT rendered)", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    render(<ValeriaSidebar />);

    expect(
      screen.getByRole("navigation", { name: "Rail de Valeria" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Historial conversaciones" }),
    ).not.toBeInTheDocument();
  });

  it("renders ValeriaHistory when chat + history (ValeriaRail NOT rendered)", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true });
    render(<ValeriaSidebar />);

    expect(
      screen.getByRole("navigation", { name: "Historial conversaciones" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Rail de Valeria" }),
    ).not.toBeInTheDocument();
  });

  it("ValeriaChat rendered when chat without history (any visible state)", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    render(<ValeriaSidebar />);

    expect(screen.getByTestId("valeria-chat")).toBeInTheDocument();
  });

  it("ValeriaChat rendered when chat + history", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true });
    render(<ValeriaSidebar />);

    expect(screen.getByTestId("valeria-chat")).toBeInTheDocument();
  });

  it("transition class 'motion-reduce:transition-none' applied on aside", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    render(<ValeriaSidebar />);

    const aside = screen.getByTestId("valeria-sidebar");
    expect(aside.className).toContain("motion-reduce:transition-none");
  });
});

// ─── SC-7 live region ────────────────────────────────────────────────────────

describe("ValeriaSidebar — SC-7 live region updates per state", () => {
  it("live region has role='status' aria-live='polite' aria-atomic='true' + sr-only class", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    render(<ValeriaSidebar />);

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion.className).toContain("sr-only");
  });

  it("live region text 'Valeria abierta' cuando chat sin historial", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    render(<ValeriaSidebar />);

    expect(screen.getByRole("status")).toHaveTextContent("Valeria abierta");
  });

  it("live region text 'Valeria con historial' cuando chat + historial", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true });
    render(<ValeriaSidebar />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Valeria con historial",
    );
  });
});

// ─── SC-8 mobile drawer (D5: mobileDrawerOpen independent slice) ──────────────
//
// Mobile drawer open/closed is governed SOLELY by `mobileDrawerOpen` (independent
// slice). valeriaOpen/historyOpen DOES NOT auto-open the drawer (no Bug #2
// coupling). Drawer opens only when mobileDrawerOpen=true; closes via
// setMobileDrawerOpen(false), NOT via the desktop valeriaOpen machine.

describe("ValeriaSidebar — SC-8 mobile drawer (D5: mobileDrawerOpen independent slice)", () => {
  it("[SC-4 D5] mobile + mobileDrawerOpen=true → aside role=dialog aria-modal rendered", () => {
    setupMobile();
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false, mobileDrawerOpen: true });

    render(<ValeriaSidebar />);

    const sidebar = screen.getByTestId("valeria-sidebar");
    expect(sidebar).toHaveAttribute("aria-modal", "true");
    expect(sidebar).toHaveAttribute("role", "dialog");
  });

  it("[SC-4 D5] mobile + mobileDrawerOpen=true → backdrop rendered", () => {
    setupMobile();
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false, mobileDrawerOpen: true });

    render(<ValeriaSidebar />);

    expect(screen.getByTestId("valeria-drawer-backdrop")).toBeInTheDocument();
  });

  it("[SC-4 CRITICAL D5] mobile + historyOpen + mobileDrawerOpen=false → drawer NOT rendered (decoupled)", () => {
    setupMobile();
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true, mobileDrawerOpen: false });

    render(<ValeriaSidebar />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("valeria-drawer-backdrop")).not.toBeInTheDocument();
  });

  it("[SC-4 fresh] mobile + default mobileDrawerOpen=false → drawer NOT rendered (fresh user)", () => {
    setupMobile();
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true, mobileDrawerOpen: false });

    render(<ValeriaSidebar />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("[SC-5 D5] mobile backdrop click → setMobileDrawerOpen(false) called (NOT desktop machine)", async () => {
    setupMobile();
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false, mobileDrawerOpen: true });

    render(<ValeriaSidebar />);

    const backdrop = screen.getByTestId("valeria-drawer-backdrop");
    await userEvent.click(backdrop);

    expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
    // valeriaOpen is NOT changed by mobile close (independent slices)
    expect(useShellStore.getState().valeriaOpen).toBe("chat");
  });

  it("[SC-5 D5] mobile drawer close X button visible when mobileDrawerOpen=true", () => {
    setupMobile();
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false, mobileDrawerOpen: true });

    render(<ValeriaSidebar />);

    const closeBtn = screen.getByTestId("valeria-drawer-close");
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toBeVisible();
  });

  it("[SC-5 D5] mobile X button click → setMobileDrawerOpen(false) (NOT desktop machine)", async () => {
    setupMobile();
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true, mobileDrawerOpen: true });

    render(<ValeriaSidebar />);

    const closeBtn = screen.getByTestId("valeria-drawer-close");
    await userEvent.click(closeBtn);

    expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
    // valeriaOpen is NOT changed
    expect(useShellStore.getState().valeriaOpen).toBe("chat");
  });
});
