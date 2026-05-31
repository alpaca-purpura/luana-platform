// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell bugfix (live-verification)
/**
 * ShellOrganismLayoutClient — duplicate-main bugfix test (RED→GREEN)
 *
 * Bug: mobile <main id="main-content"> always rendered (no shellMode guard),
 * causing 2× main elements in the DOM simultaneously when desktop branch
 * (agentic or web) is also rendered. This produces:
 *   - strict-mode violation in Playwright (2 elements resolved for testid)
 *   - duplicate id="main-content" = invalid HTML → breaks skip-link F1 a11y
 *
 * Fix: lift a SINGLE <main id="main-content"> wrapper, switch only the INNER
 * chrome based on shellMode + viewport, rendering {children} (AppPanelSlot)
 * exactly once.
 *
 * Tests in this file:
 *   1. [RED→GREEN] Exactly ONE <main> in DOM for agentic mode
 *   2. [RED→GREEN] Exactly ONE <main> in DOM for web mode
 *   3. [RED→GREEN] id="main-content" unique (no duplicates)
 *   4. [always GREEN] children rendered exactly once
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LuanaState, ShellMode } from "@/stores/shell-store";

// ── Store mock ────────────────────────────────────────────────────────────────
const mockStore: {
  shellMode: ShellMode;
  luanaState: LuanaState;
} = {
  shellMode: "agentic",
  luanaState: "history",
};

vi.mock("@/stores/shell-store", () => ({
  useShellStore: (selector: (s: typeof mockStore) => unknown) => selector(mockStore),
}));

// ── Luana hooks mocks ─────────────────────────────────────────────────────────
vi.mock("@luana/hooks/use-store-hydration", () => ({
  useStoreHydration: vi.fn(),
}));

// ── react-resizable-panels mock ───────────────────────────────────────────────
vi.mock("react-resizable-panels", () => ({
  Group: ({ children }: { children: React.ReactNode }) => <div data-mock="group">{children}</div>,
  Panel: ({ children }: { children: React.ReactNode }) => <div data-mock="panel">{children}</div>,
  Separator: () => <div data-mock="separator" />,
  useDefaultLayout: () => ({
    defaultLayout: undefined,
    onLayoutChanged: vi.fn(),
  }),
  useGroupRef: () => ({ current: null }),
}));

// ── Sub-component mocks ───────────────────────────────────────────────────────
vi.mock("../AppPanelSlot", () => ({
  AppPanelSlot: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-panel-slot">{children}</div>
  ),
}));

vi.mock("../LuanaSidebar", () => ({
  LuanaSidebar: () => <div data-testid="luana-sidebar" />,
}));

vi.mock("../ShellModeToggle", () => ({
  ShellModeToggle: () => <div data-testid="shell-mode-toggle" />,
}));

vi.mock("../TopBarGlobal", () => ({
  TopBarGlobal: () => <div data-testid="topbar-global" />,
}));

vi.mock("../useViewportGuard", () => ({
  useViewportGuard: vi.fn(),
}));

// ── ShellOrganismLayoutClient must use window.localStorage ───────────────────
// happy-dom provides window.localStorage by default.

import { ShellOrganismLayoutClient } from "../ShellOrganismLayoutClient";

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderShell(mode: ShellMode = "agentic") {
  mockStore.shellMode = mode;
  return render(
    <ShellOrganismLayoutClient tenantId="test-tenant">
      <span data-testid="child-content">Hello</span>
    </ShellOrganismLayoutClient>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ShellOrganismLayoutClient — duplicate-main bugfix", () => {
  beforeEach(() => {
    mockStore.shellMode = "agentic";
    mockStore.luanaState = "history";
    vi.clearAllMocks();
  });

  it("[RED→GREEN] agentic mode: exactly ONE <main> in the DOM", () => {
    const { container } = renderShell("agentic");
    const mains = container.querySelectorAll("main");
    expect(mains.length).toBe(1);
  });

  it("[RED→GREEN] web mode: exactly ONE <main> in the DOM", () => {
    const { container } = renderShell("web");
    const mains = container.querySelectorAll("main");
    expect(mains.length).toBe(1);
  });

  it("[RED→GREEN] id='main-content' is unique (no duplicates)", () => {
    const { container } = renderShell("agentic");
    const mainContentElements = container.querySelectorAll("#main-content");
    expect(mainContentElements.length).toBe(1);
  });

  it("[RED→GREEN] id='main-content' unique in web mode too", () => {
    const { container } = renderShell("web");
    const mainContentElements = container.querySelectorAll("#main-content");
    expect(mainContentElements.length).toBe(1);
  });

  it("child content rendered exactly once (AppPanelSlot not duplicated)", () => {
    const { container } = renderShell("agentic");
    const slots = container.querySelectorAll("[data-testid='app-panel-slot']");
    expect(slots.length).toBe(1);
  });

  it("child content rendered exactly once in web mode", () => {
    const { container } = renderShell("web");
    const slots = container.querySelectorAll("[data-testid='app-panel-slot']");
    expect(slots.length).toBe(1);
  });

  it("<main> has aria-label='Contenido principal'", () => {
    const { container } = renderShell("agentic");
    const main = container.querySelector("main");
    expect(main?.getAttribute("aria-label")).toBe("Contenido principal");
  });
});
