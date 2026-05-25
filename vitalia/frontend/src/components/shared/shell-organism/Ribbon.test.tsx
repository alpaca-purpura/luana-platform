/**
 * Ribbon.test.tsx — Unit tests for Ribbon organism
 * T-3 of vitalia-fase1-ribbon-6-tabs (F1-S7)
 * TDD RED-first per tdd-mandatory.md
 *
 * gherkin_coverage:
 * - SC-1 happy · Ribbon renders 5 RibbonTabs + 1 ConfigTab in AGENT_RIBBON_ORDER
 * - SC-1 happy · click RibbonTab → router.push to default subtab
 * - SC-2 happy · URL deep link → active state derived from usePathname
 * - SC-3 happy · click ConfigTab → router.push to /config/cuenta
 * - SC-4 negative · URL invalid agent slug → no active
 * - SC-7 a11y · roving tabindex pattern (Arrow keys + Home + End + Enter + Space)
 * - defensive · useParams.tenantId undefined → navigation cancelled
 * - focus management · onFocus on inactive tab updates focusedIdx (no navigation)
 *
 * spec_anchor: 01-spec.md § Gherkin SC-1..SC-7 + § Wireframe + § Accessibility
 *              03-arch.md § 2.2
 * Named export (NO default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Ribbon } from "./Ribbon";
import { AGENT_RIBBON_ORDER, AGENT_CATALOG } from "@/lib/agent-catalog";

// ──────────────────────────────────────────────────────────────
// Mock next/navigation
// ──────────────────────────────────────────────────────────────
const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/tenant-x/lisa/marca");
const mockParams = vi.fn(() => ({ tenantId: "tenant-x" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname.mockReturnValue("/tenant-x/lisa/marca");
  mockParams.mockReturnValue({ tenantId: "tenant-x" });
  mockPush.mockReset();
});

// ──────────────────────────────────────────────────────────────
// SC-1 happy · Ribbon render structure
// ──────────────────────────────────────────────────────────────
describe("Ribbon — render structure (SC-1 happy)", () => {
  it("renders <nav role='tablist' aria-label='Agentes'>", () => {
    render(<Ribbon />);
    const nav = screen.getByRole("tablist");
    expect(nav.tagName.toLowerCase()).toBe("nav");
    expect(nav.getAttribute("aria-label")).toBe("Agentes");
  });

  it("has data-testid='ribbon'", () => {
    render(<Ribbon />);
    expect(screen.getByTestId("ribbon")).toBeDefined();
  });

  it("container className contains 'flex' 'h-14' 'overflow-x-auto' 'border-b' 'border-border' 'bg-card'", () => {
    render(<Ribbon />);
    const nav = screen.getByTestId("ribbon");
    expect(nav.className).toContain("flex");
    expect(nav.className).toContain("h-14");
    expect(nav.className).toContain("overflow-x-auto");
    expect(nav.className).toContain("border-b");
    expect(nav.className).toContain("border-border");
    expect(nav.className).toContain("bg-card");
  });

  it("renders 5 RibbonTabs in AGENT_RIBBON_ORDER (lisa/lucas/adrian/valeria/camila)", () => {
    render(<Ribbon />);
    AGENT_RIBBON_ORDER.forEach((slug) => {
      expect(screen.getByTestId(`ribbon-tab-${slug}`)).toBeDefined();
    });
  });

  it("renders 1 ConfigTab at the end (data-testid='ribbon-config-tab')", () => {
    render(<Ribbon />);
    expect(screen.getByTestId("ribbon-config-tab")).toBeDefined();
  });

  it("total 6 elements with role='tab'", () => {
    render(<Ribbon />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(6); // 5 agent tabs + 1 ConfigTab
  });

  it("RibbonTabs appear in AGENT_RIBBON_ORDER sequence (DOM order matches canonical order)", () => {
    render(<Ribbon />);
    const allTabs = screen.getAllByRole("tab");
    // First 5 tabs are agent tabs in order
    AGENT_RIBBON_ORDER.forEach((slug, idx) => {
      expect(allTabs[idx].getAttribute("data-testid")).toBe(`ribbon-tab-${slug}`);
    });
    // Last tab is ConfigTab
    expect(allTabs[5].getAttribute("data-testid")).toBe("ribbon-config-tab");
  });
});

// ──────────────────────────────────────────────────────────────
// SC-1 happy · click RibbonTab → router.push
// ──────────────────────────────────────────────────────────────
describe("Ribbon — click navigation (SC-1 happy)", () => {
  it("click ribbon-tab-lucas → router.push called with '/tenant-x/lucas/lanzar'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    fireEvent.click(screen.getByTestId("ribbon-tab-lucas"));
    expect(mockPush).toHaveBeenCalledWith(
      `/${mockParams().tenantId}/lucas/${AGENT_CATALOG.lucas.defaultSubtab}`,
    );
  });

  it("click ribbon-tab-camila → router.push called with '/tenant-x/camila/voz'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    fireEvent.click(screen.getByTestId("ribbon-tab-camila"));
    expect(mockPush).toHaveBeenCalledWith(
      `/${mockParams().tenantId}/camila/${AGENT_CATALOG.camila.defaultSubtab}`,
    );
  });

  it("click ribbon-tab-adrian → router.push called with '/tenant-x/adrian/inbox'", () => {
    render(<Ribbon />);
    fireEvent.click(screen.getByTestId("ribbon-tab-adrian"));
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/adrian/inbox");
  });

  it("click ribbon-tab-valeria → router.push called with '/tenant-x/valeria/agenda'", () => {
    render(<Ribbon />);
    fireEvent.click(screen.getByTestId("ribbon-tab-valeria"));
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/valeria/agenda");
  });

  it("click ribbon-tab-lisa → router.push called with '/tenant-x/lisa/marca'", () => {
    render(<Ribbon />);
    fireEvent.click(screen.getByTestId("ribbon-tab-lisa"));
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/marca");
  });
});

// ──────────────────────────────────────────────────────────────
// SC-2 happy · URL deep link → active state derived from usePathname
// ──────────────────────────────────────────────────────────────
describe("Ribbon — active state from URL (SC-2 happy)", () => {
  it("usePathname '/tenant-x/lisa/marca' → ribbon-tab-lisa data-active='true' aria-selected='true'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const lisaTab = screen.getByTestId("ribbon-tab-lisa");
    expect(lisaTab.getAttribute("data-active")).toBe("true");
    expect(lisaTab.getAttribute("aria-selected")).toBe("true");
  });

  it("usePathname '/tenant-x/lisa/marca' → other 4 tabs data-active='false' aria-selected='false'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const slugsExceptLisa = AGENT_RIBBON_ORDER.filter((s) => s !== "lisa");
    slugsExceptLisa.forEach((slug) => {
      const tab = screen.getByTestId(`ribbon-tab-${slug}`);
      expect(tab.getAttribute("data-active")).toBe("false");
      expect(tab.getAttribute("aria-selected")).toBe("false");
    });
  });

  it("usePathname '/tenant-x/camila/voz' → ribbon-tab-camila active", () => {
    mockPathname.mockReturnValue("/tenant-x/camila/voz");
    render(<Ribbon />);
    const camilaTab = screen.getByTestId("ribbon-tab-camila");
    expect(camilaTab.getAttribute("data-active")).toBe("true");
    expect(camilaTab.getAttribute("aria-selected")).toBe("true");
  });

  it("usePathname '/tenant-x/lucas/lanzar' → ribbon-tab-lucas active", () => {
    mockPathname.mockReturnValue("/tenant-x/lucas/lanzar");
    render(<Ribbon />);
    const lucasTab = screen.getByTestId("ribbon-tab-lucas");
    expect(lucasTab.getAttribute("data-active")).toBe("true");
  });
});

// ──────────────────────────────────────────────────────────────
// SC-3 happy · ConfigTab navigation
// ──────────────────────────────────────────────────────────────
describe("Ribbon — ConfigTab (SC-3 happy)", () => {
  it("click ribbon-config-tab → router.push called with '/tenant-x/config/cuenta'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    fireEvent.click(screen.getByTestId("ribbon-config-tab"));
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/config/cuenta");
  });

  it("usePathname '/tenant-x/config/cuenta' → ribbon-config-tab data-active='true'", () => {
    mockPathname.mockReturnValue("/tenant-x/config/cuenta");
    render(<Ribbon />);
    const configTab = screen.getByTestId("ribbon-config-tab");
    expect(configTab.getAttribute("data-active")).toBe("true");
    expect(configTab.getAttribute("aria-selected")).toBe("true");
  });

  it("usePathname '/tenant-x/config/cuenta' → all agent tabs data-active='false'", () => {
    mockPathname.mockReturnValue("/tenant-x/config/cuenta");
    render(<Ribbon />);
    AGENT_RIBBON_ORDER.forEach((slug) => {
      const tab = screen.getByTestId(`ribbon-tab-${slug}`);
      expect(tab.getAttribute("data-active")).toBe("false");
    });
  });
});

// ──────────────────────────────────────────────────────────────
// SC-4 negative · invalid agent slug → no active
// ──────────────────────────────────────────────────────────────
describe("Ribbon — invalid URL (SC-4 negative)", () => {
  it("usePathname '/tenant-x/foobar/baz' → all 6 tabs data-active='false'", () => {
    mockPathname.mockReturnValue("/tenant-x/foobar/baz");
    render(<Ribbon />);
    // agent tabs
    AGENT_RIBBON_ORDER.forEach((slug) => {
      const tab = screen.getByTestId(`ribbon-tab-${slug}`);
      expect(tab.getAttribute("data-active")).toBe("false");
      expect(tab.getAttribute("aria-selected")).toBe("false");
    });
    // config tab
    const configTab = screen.getByTestId("ribbon-config-tab");
    expect(configTab.getAttribute("data-active")).toBe("false");
  });

  it("no console.error fired for invalid slug (defensive null check via extractAgentFromPath)", () => {
    const consoleErrorSpy = vi.spyOn(console, "error");
    mockPathname.mockReturnValue("/tenant-x/foobar/baz");
    render(<Ribbon />);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

// ──────────────────────────────────────────────────────────────
// SC-7 a11y · roving tabindex pattern
// ──────────────────────────────────────────────────────────────
describe("Ribbon — roving tabindex (SC-7 a11y)", () => {
  it("initial: active tab (lisa from URL) has tabIndex=0, others tabIndex=-1", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const lisaTab = screen.getByTestId("ribbon-tab-lisa");
    expect(lisaTab.getAttribute("tabindex")).toBe("0");
    // Other tabs (indices 1..4 + config) should be -1
    const slugsExceptLisa = AGENT_RIBBON_ORDER.filter((s) => s !== "lisa");
    slugsExceptLisa.forEach((slug) => {
      const tab = screen.getByTestId(`ribbon-tab-${slug}`);
      expect(tab.getAttribute("tabindex")).toBe("-1");
    });
    const configTab = screen.getByTestId("ribbon-config-tab");
    expect(configTab.getAttribute("tabindex")).toBe("-1");
  });

  it("initial when no active (idle URL): first tab (lisa) has tabIndex=0", () => {
    mockPathname.mockReturnValue("/tenant-x/foobar/baz");
    render(<Ribbon />);
    const lisaTab = screen.getByTestId("ribbon-tab-lisa");
    expect(lisaTab.getAttribute("tabindex")).toBe("0");
  });

  it("Arrow Right on ribbon → focus moves to next tab (Lisa→Lucas)", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    // Lisa is at focusedIdx=0 initially (active)
    fireEvent.keyDown(ribbon, { key: "ArrowRight" });
    // After Arrow Right, focusedIdx should be 1 (lucas)
    const lucasTab = screen.getByTestId("ribbon-tab-lucas");
    expect(lucasTab.getAttribute("tabindex")).toBe("0");
    const lisaTab = screen.getByTestId("ribbon-tab-lisa");
    expect(lisaTab.getAttribute("tabindex")).toBe("-1");
  });

  it("Arrow Right from ConfigTab (idx=5) wraps to Lisa (idx=0)", () => {
    mockPathname.mockReturnValue("/tenant-x/config/cuenta");
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    // ConfigTab is at focusedIdx=5
    fireEvent.keyDown(ribbon, { key: "ArrowRight" });
    // Should wrap to Lisa (idx 0)
    const lisaTab = screen.getByTestId("ribbon-tab-lisa");
    expect(lisaTab.getAttribute("tabindex")).toBe("0");
  });

  it("Arrow Left from Lisa (idx=0) wraps to ConfigTab (idx=5)", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    // Lisa at idx=0
    fireEvent.keyDown(ribbon, { key: "ArrowLeft" });
    // Should wrap to ConfigTab (idx 5)
    const configTab = screen.getByTestId("ribbon-config-tab");
    expect(configTab.getAttribute("tabindex")).toBe("0");
  });

  it("Home key → focus jumps to first tab (Lisa, idx 0)", () => {
    mockPathname.mockReturnValue("/tenant-x/camila/voz");
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    // Camila at idx=3, ArrowRight once to idx=4
    fireEvent.keyDown(ribbon, { key: "ArrowRight" });
    // Now press Home
    fireEvent.keyDown(ribbon, { key: "Home" });
    const lisaTab = screen.getByTestId("ribbon-tab-lisa");
    expect(lisaTab.getAttribute("tabindex")).toBe("0");
  });

  it("End key → focus jumps to last tab (ConfigTab, idx 5)", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    // Lisa at idx=0
    fireEvent.keyDown(ribbon, { key: "End" });
    const configTab = screen.getByTestId("ribbon-config-tab");
    expect(configTab.getAttribute("tabindex")).toBe("0");
    const lisaTab = screen.getByTestId("ribbon-tab-lisa");
    expect(lisaTab.getAttribute("tabindex")).toBe("-1");
  });

  it("Enter on focused tab (lisa, idx=0) → router.push called", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    fireEvent.keyDown(ribbon, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/marca");
  });

  it("Space on focused tab (camila, idx=3 after navigation) → router.push called", () => {
    // Start at camila active (focusedIdx=3)
    mockPathname.mockReturnValue("/tenant-x/camila/voz");
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    fireEvent.keyDown(ribbon, { key: " " });
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/camila/voz");
  });

  it("Tab key → no navigateTo, no focus change", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    fireEvent.keyDown(ribbon, { key: "Tab" });
    expect(mockPush).not.toHaveBeenCalled();
    // Lisa should still have tabIndex=0 (no change)
    const lisaTab = screen.getByTestId("ribbon-tab-lisa");
    expect(lisaTab.getAttribute("tabindex")).toBe("0");
  });

  it("Escape key → no navigateTo, no focus change", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    fireEvent.keyDown(ribbon, { key: "Escape" });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────
// defensive · useParams.tenantId undefined → navigation cancelled
// ──────────────────────────────────────────────────────────────
describe("Ribbon — defensive tenantId guard", () => {
  it("mock useParams returns null → click tab → router.push NOT called", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockParams.mockReturnValue(null as any);
    render(<Ribbon />);
    fireEvent.click(screen.getByTestId("ribbon-tab-lucas"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("mock useParams returns {} (no tenantId) → click tab → router.push NOT called", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockParams.mockReturnValue({} as any);
    render(<Ribbon />);
    fireEvent.click(screen.getByTestId("ribbon-tab-lucas"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("mock useParams returns null → Enter key → router.push NOT called", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockParams.mockReturnValue(null as any);
    render(<Ribbon />);
    const ribbon = screen.getByTestId("ribbon");
    fireEvent.keyDown(ribbon, { key: "Enter" });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────
// focus management · onFocus on tab updates focusedIdx (no navigation)
// ──────────────────────────────────────────────────────────────
describe("Ribbon — onFocus updates focusedIdx (no navigation)", () => {
  it("onFocus on lucas tab → lucasTab gets tabIndex=0 via setFocusedIdx · router.push NOT called", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    // Simulate focus event on lucas tab
    const lucasTab = screen.getByTestId("ribbon-tab-lucas");
    fireEvent.focus(lucasTab);
    // focusedIdx should now be 1 (lucas)
    expect(lucasTab.getAttribute("tabindex")).toBe("0");
    // router.push should NOT be called by onFocus alone
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("onFocus on config tab → configTab gets tabIndex=0 · router.push NOT called", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<Ribbon />);
    const configTab = screen.getByTestId("ribbon-config-tab");
    fireEvent.focus(configTab);
    expect(configTab.getAttribute("tabindex")).toBe("0");
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────
// ARIA attributes
// ──────────────────────────────────────────────────────────────
describe("Ribbon — ARIA (SC-7 a11y)", () => {
  it("aria-label='Agentes' on nav tablist", () => {
    render(<Ribbon />);
    const nav = screen.getByRole("tablist");
    expect(nav.getAttribute("aria-label")).toBe("Agentes");
  });

  it("active tab aria-selected='true', inactive aria-selected='false'", () => {
    mockPathname.mockReturnValue("/tenant-x/valeria/agenda");
    render(<Ribbon />);
    const valeriaTab = screen.getByTestId("ribbon-tab-valeria");
    expect(valeriaTab.getAttribute("aria-selected")).toBe("true");

    const lisaTab = screen.getByTestId("ribbon-tab-lisa");
    expect(lisaTab.getAttribute("aria-selected")).toBe("false");
  });
});
