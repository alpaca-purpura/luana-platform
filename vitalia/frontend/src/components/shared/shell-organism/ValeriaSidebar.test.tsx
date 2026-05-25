/**
 * ValeriaSidebar.test.tsx — Unit tests for ValeriaSidebar organism
 * T-5 of vitalia-fase1-valeria-rail-history (F1-S5)
 * TDD RED-first per tdd-mandatory.md
 *
 * gherkin_coverage:
 * - SC-1 happy: keyboard cycle (r/f/c/Esc) con auto-coupling + render aside + grid
 * - SC-4 adversarial: setState({valeriaState:'INVALID'}) → console.warn + fallback rail no crash
 * - SC-7 a11y: live region role='status' aria-live='polite' aria-atomic='true' sr-only
 * - SC-8 a11y: mobile drawer (smoke — full Playwright en T-8)
 *
 * Test setup:
 * - useShellStore manipulated via useShellStore.setState({...}) directly (real store)
 * - matchMedia mock for mobile drawer detection
 * - window.alert mock for SC-1 'n' key
 * - document.getElementById mock for Cmd+K focus
 *
 * Spec: 01-spec.md § 0 D1+D2+D4 + § 1 Scenarios 1-5 + § 5 handlers
 * Arch: 03-arch.md § 2.5 ValeriaSidebar + § 2.7 mobile drawer
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

// ─── Desktop helper (default: non-mobile) ────────────────────────────────────

function setupDesktop(): void {
  mockMatchMedia(false); // max-width:767px does NOT match → desktop
}

function setupMobile(): void {
  mockMatchMedia(true); // max-width:767px matches → mobile
}

// ─── Reset store state before each test ──────────────────────────────────────

beforeEach(() => {
  // Reset to known desktop state for each test
  useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
  setupDesktop();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── SC-1 happy: keyboard cycle (8 tests) ────────────────────────────────────

describe("ValeriaSidebar — SC-1 keyboard cycle (shortcuts)", () => {
  it("press 'r' sets valeriaState rail + shellMode agentic (auto-coupled)", async () => {
    useShellStore.setState({ valeriaState: "collapsed", shellMode: "web" });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "r" });

    // Allow useEffect auto-coupling to run
    await act(async () => {});

    const state = useShellStore.getState();
    expect(state.valeriaState).toBe("rail");
    expect(state.shellMode).toBe("agentic");
  });

  it("press 'f' sets valeriaState full + shellMode agentic (auto-coupled)", async () => {
    useShellStore.setState({ valeriaState: "collapsed", shellMode: "web" });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "f" });

    await act(async () => {});

    const state = useShellStore.getState();
    expect(state.valeriaState).toBe("full");
    expect(state.shellMode).toBe("agentic");
  });

  it("press 'c' sets valeriaState collapsed + shellMode web (auto-coupled)", async () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "c" });

    await act(async () => {});

    const state = useShellStore.getState();
    expect(state.valeriaState).toBe("collapsed");
    expect(state.shellMode).toBe("web");
  });

  it("press Escape (no input focus) sets valeriaState collapsed + shellMode web", async () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "Escape" });

    await act(async () => {});

    const state = useShellStore.getState();
    expect(state.valeriaState).toBe("collapsed");
    expect(state.shellMode).toBe("web");
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

  it("idempotency: press 'c' twice → no-op second time (state remains collapsed)", async () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    fireEvent.keyDown(window, { key: "c" });
    await act(async () => {});

    // First press: rail → collapsed
    expect(useShellStore.getState().valeriaState).toBe("collapsed");

    const setValeriaStateSpy = vi.spyOn(
      useShellStore.getState(),
      "setValeriaState",
    );

    fireEvent.keyDown(window, { key: "c" });
    await act(async () => {});

    // State should still be collapsed (idempotent)
    expect(useShellStore.getState().valeriaState).toBe("collapsed");
    // spy not called (shortcut still fires but store stays same value)
    setValeriaStateSpy.mockRestore();
  });
});

// ─── SC-1 happy: render aside (7 tests) ──────────────────────────────────────

describe("ValeriaSidebar — SC-1 render aside with role + aria + grid", () => {
  it("renders aside role='complementary' aria-label='Panel Valeria' data-testid='valeria-sidebar'", () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    const aside = screen.getByRole("complementary", { name: "Panel Valeria" });
    expect(aside).toBeInTheDocument();
    expect(aside).toHaveAttribute("data-testid", "valeria-sidebar");
  });

  it("aria-expanded='true' when valeriaState='rail'", () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    const aside = screen.getByTestId("valeria-sidebar");
    expect(aside).toHaveAttribute("aria-expanded", "true");
  });

  it("aria-expanded='false' when valeriaState='collapsed'", () => {
    useShellStore.setState({ valeriaState: "collapsed", shellMode: "web" });
    render(<ValeriaSidebar />);

    const aside = screen.getByTestId("valeria-sidebar");
    expect(aside).toHaveAttribute("aria-expanded", "false");
  });

  it("grid columns 60px/1fr when state='rail'", () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    const aside = screen.getByTestId("valeria-sidebar");
    // Style should contain grid-template-columns with 60px
    expect(aside).toHaveStyle({ gridTemplateColumns: "60px 1fr" });
  });

  it("grid columns 280px/1fr when state='full'", () => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    const aside = screen.getByTestId("valeria-sidebar");
    expect(aside).toHaveStyle({ gridTemplateColumns: "280px 1fr" });
  });

  it("renders ValeriaRail when state='rail' (ValeriaHistory NOT rendered)", () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    // ValeriaRail renders nav aria-label="Rail de Valeria"
    expect(
      screen.getByRole("navigation", { name: "Rail de Valeria" }),
    ).toBeInTheDocument();
    // ValeriaHistory NOT rendered (nav aria-label="Historial conversaciones")
    expect(
      screen.queryByRole("navigation", { name: "Historial conversaciones" }),
    ).not.toBeInTheDocument();
  });

  it("renders ValeriaHistory when state='full' (ValeriaRail NOT rendered)", () => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    // ValeriaHistory renders nav aria-label="Historial conversaciones"
    expect(
      screen.getByRole("navigation", { name: "Historial conversaciones" }),
    ).toBeInTheDocument();
    // ValeriaRail NOT rendered
    expect(
      screen.queryByRole("navigation", { name: "Rail de Valeria" }),
    ).not.toBeInTheDocument();
  });

  it("ValeriaChat rendered when state='rail' (any visible state)", () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    // T-6: ValeriaChatSlot replaced by ValeriaChat (data-testid="valeria-chat")
    expect(screen.getByTestId("valeria-chat")).toBeInTheDocument();
  });

  it("ValeriaChat rendered when state='full'", () => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    // T-6: ValeriaChatSlot replaced by ValeriaChat (data-testid="valeria-chat")
    expect(screen.getByTestId("valeria-chat")).toBeInTheDocument();
  });

  it("transition class 'motion-reduce:transition-none' applied on aside", () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    const aside = screen.getByTestId("valeria-sidebar");
    expect(aside.className).toContain("motion-reduce:transition-none");
  });
});

// ─── SC-4 adversarial guard (1 test) ─────────────────────────────────────────

describe("ValeriaSidebar — SC-4 adversarial guard invalid valeriaState", () => {
  it("useShellStore.setState({valeriaState:'INVALID'}) → console.warn + fallback render (no crash)", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Force invalid state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useShellStore.setState({ valeriaState: "INVALID" as any });

    // Render should NOT throw
    expect(() => render(<ValeriaSidebar />)).not.toThrow();

    // console.warn MUST be called with the invalid state
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("INVALID"));

    // Fallback: ValeriaRail should render (rail is the fallback state)
    expect(
      screen.getByRole("navigation", { name: "Rail de Valeria" }),
    ).toBeInTheDocument();
  });
});

// ─── SC-7 live region (4 tests) ──────────────────────────────────────────────

describe("ValeriaSidebar — SC-7 live region updates per state", () => {
  it("live region has role='status' aria-live='polite' aria-atomic='true' + sr-only class", () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion.className).toContain("sr-only");
  });

  it("live region text 'Valeria cerrada' cuando state='collapsed'", () => {
    useShellStore.setState({ valeriaState: "collapsed", shellMode: "web" });
    render(<ValeriaSidebar />);

    // collapsed renders mobile or desktop depending on matchMedia
    // Desktop: aside has sr-only span with 'Valeria cerrada'
    // The live region text is always rendered (even in collapsed desktop)
    expect(screen.getByRole("status")).toHaveTextContent("Valeria cerrada");
  });

  it("live region text 'Valeria abierta' cuando state='rail'", () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    expect(screen.getByRole("status")).toHaveTextContent("Valeria abierta");
  });

  it("live region text 'Valeria con historial' cuando state='full'", () => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    render(<ValeriaSidebar />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Valeria con historial",
    );
  });
});

// ─── SC-8 mobile drawer smoke (4 tests) ──────────────────────────────────────

describe("ValeriaSidebar — SC-8 mobile drawer smoke (full E2E en T-8)", () => {
  it("mobile viewport + isExpanded=true → aside has aria-modal='true'", () => {
    setupMobile();
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });

    render(<ValeriaSidebar />);

    const sidebar = screen.getByTestId("valeria-sidebar");
    expect(sidebar).toHaveAttribute("aria-modal", "true");
  });

  it("mobile viewport + isExpanded=true → backdrop rendered data-testid='valeria-drawer-backdrop'", () => {
    setupMobile();
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });

    render(<ValeriaSidebar />);

    expect(screen.getByTestId("valeria-drawer-backdrop")).toBeInTheDocument();
  });

  it("mobile backdrop click → setValeriaState('collapsed') called", async () => {
    setupMobile();
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });

    render(<ValeriaSidebar />);

    const backdrop = screen.getByTestId("valeria-drawer-backdrop");
    await userEvent.click(backdrop);

    // After click: valeriaState should be 'collapsed'
    expect(useShellStore.getState().valeriaState).toBe("collapsed");
  });

  it("mobile drawer close X button data-testid='valeria-drawer-close' visible cuando isExpanded", () => {
    setupMobile();
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });

    render(<ValeriaSidebar />);

    const closeBtn = screen.getByTestId("valeria-drawer-close");
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toBeVisible();
  });
});
