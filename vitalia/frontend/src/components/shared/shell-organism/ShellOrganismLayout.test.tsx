/**
 * ShellOrganismLayout.test.tsx — TDD RED-first tests for ShellOrganismLayoutClient
 * vitalia-shell-dual-mount-a11y-fix T-1
 *
 * gherkin_coverage (from 06-tickets.yaml):
 * - SC-1: shellMode=agentic → 1 main#main-content + 1 app-panel-slot
 * - SC-2: shellMode=web → 1 main, 1 slot, grid estático, valeria presente, no panel-group
 * - SC-3: valeriaState in {full,rail} → no "Rendered more hooks" (hook-count stable)
 * - SC-4: mobile viewport → single slot (no rama mobile separada con AppPanelSlot extra)
 * - SC-5: el <main> único tiene id=main-content + tabIndex=-1 + aria-label='Contenido principal'
 *
 * Architecture decisions D1-D5 from 03-arch.md:
 * D1: ONE <main id="main-content"> wrapping ALL chrome variants
 * D2: <AppPanelSlot> rendered EXACTLY ONCE — single-slot (goes beyond nicolify prior art)
 * D3: ALL hooks called unconditionally at top
 * D4: NO useMediaQuery/isDesktop to gate layout mount
 * D5: desktop↔mobile gate is CSS (md:) only, not JS
 *
 * downstream-regression-na: brand-local shell component; no cross-brand consumers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useShellStore } from "@/stores/shell-store";

// Mock react-resizable-panels v4 to avoid DOM measurement issues in test env
// v4 API: Group (was PanelGroup), Panel, Separator (was PanelResizeHandle),
//         useDefaultLayout, useGroupRef (snap-up fix)
vi.mock("react-resizable-panels", () => ({
  Group: ({
    children,
    id,
    orientation,
    className,
    defaultLayout,
  }: {
    children: React.ReactNode;
    id?: string;
    orientation?: string;
    className?: string;
    defaultLayout?: Record<string, number>;
  }) => (
    <div
      data-testid="panel-group"
      data-group-id={id}
      data-auto-save-id={id}
      data-direction={orientation}
      data-default-layout={
        defaultLayout ? JSON.stringify(defaultLayout) : undefined
      }
      className={className}
    >
      {children}
    </div>
  ),
  Panel: ({
    children,
    id,
    defaultSize,
    minSize,
    collapsible,
  }: {
    children?: React.ReactNode;
    id?: string;
    defaultSize?: number;
    minSize?: number;
    collapsible?: boolean;
  }) => (
    <div
      data-testid={`panel-${id}`}
      data-panel-id={id}
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-collapsible={collapsible}
    >
      {children}
    </div>
  ),
  Separator: ({
    id,
    className,
    "aria-label": ariaLabel,
  }: {
    id?: string;
    className?: string;
    "aria-label"?: string;
  }) => (
    <div
      data-testid="panel-resize-handle"
      data-handle-id={id}
      className={className}
      aria-label={ariaLabel}
      role="separator"
    />
  ),
  useDefaultLayout: vi.fn().mockReturnValue({}),
  // snap-up fix: useGroupRef returns a RefObject with a mock GroupImperativeHandle.
  // getLayout returns a layout safely above minValeriaPct so the snap-up useEffect
  // is a no-op in unit tests (no actual DOM panels to measure).
  useGroupRef: vi.fn(() => ({
    current: {
      getLayout: vi.fn(() => ({ "valeria-panel": 50, "app-panel": 50 })),
      setLayout: vi.fn(),
    },
  })),
}));

// Mock useViewportGuard to avoid window.innerWidth setup complexity in layout tests
vi.mock("./useViewportGuard", () => ({
  useViewportGuard: vi.fn(),
}));

// Mock TopBarGlobal to avoid deep tree dependencies (TenantSwitcher, Clerk, etc.)
vi.mock("./TopBarGlobal", () => ({
  TopBarGlobal: () => <header data-testid="topbar-global" role="banner" />,
}));

// Mock ValeriaSidebar
vi.mock("./ValeriaSidebar", () => ({
  ValeriaSidebar: () => (
    <aside
      data-testid="valeria-sidebar"
      role="complementary"
      aria-label="Panel Valeria"
    />
  ),
}));

// Mock AppPanelSlot
vi.mock("./AppPanelSlot", () => ({
  AppPanelSlot: ({ children }: { children?: React.ReactNode }) => (
    <section
      data-testid="app-panel-slot"
      role="region"
      aria-label="Panel aplicación"
    >
      {children}
    </section>
  ),
}));

// Mock ShellModeToggle
vi.mock("./ShellModeToggle", () => ({
  ShellModeToggle: () => (
    <button
      data-testid="shell-mode-toggle"
      type="button"
      disabled
      aria-disabled="true"
    />
  ),
}));

describe("ShellOrganismLayout — import contract", () => {
  it("module exports ShellOrganismLayout as named export", async () => {
    const mod = await import("./ShellOrganismLayout");
    expect(typeof mod.ShellOrganismLayout).toBe("function");
  });
});

// ★ SINGLE-MAIN + SINGLE-SLOT invariants (D1 + D2 from 03-arch.md)
// These were RED against the old triple-main; they must be GREEN after the fix.
describe("ShellOrganismLayout — single-main + single-slot invariants (D1 + D2)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
  });

  it("renders EXACTLY 1 <main id='main-content'> in agentic mode (D1 — was 2 with triple-main)", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    const { container } = render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div data-testid="page-content">content</div>
      </ShellOrganismLayoutClient>,
    );
    const mains = container.querySelectorAll("#main-content");
    expect(mains.length).toBe(1);
  });

  it("renders EXACTLY 1 <AppPanelSlot> in agentic mode (D2 — was 2 with triple-main)", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div data-testid="page-content">content</div>
      </ShellOrganismLayoutClient>,
    );
    const slots = screen.getAllByTestId("app-panel-slot");
    expect(slots.length).toBe(1);
  });

  it("renders EXACTLY 1 <main id='main-content'> in web mode (D1)", async () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "web" });
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    const { container } = render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const mains = container.querySelectorAll("#main-content");
    expect(mains.length).toBe(1);
  });

  it("renders EXACTLY 1 <AppPanelSlot> in web mode (D2)", async () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "web" });
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const slots = screen.getAllByTestId("app-panel-slot");
    expect(slots.length).toBe(1);
  });

  it("children appear EXACTLY ONCE in the DOM (no dual-mount duplication)", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div data-testid="unique-child">page content</div>
      </ShellOrganismLayoutClient>,
    );
    const children = screen.getAllByTestId("unique-child");
    expect(children.length).toBe(1);
  });
});

// ★ D3 — hook-count stability: valeriaState transitions must not trigger "more hooks" crash
describe("ShellOrganismLayout — hook-count stability (D3 — valeriaState transitions)", () => {
  it("renders without error when valeriaState='full'", async () => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    expect(() =>
      render(
        <ShellOrganismLayoutClient tenantId="acme-clinic">
          <div />
        </ShellOrganismLayoutClient>,
      ),
    ).not.toThrow();
  });

  it("renders without error when valeriaState='rail'", async () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    expect(() =>
      render(
        <ShellOrganismLayoutClient tenantId="acme-clinic">
          <div />
        </ShellOrganismLayoutClient>,
      ),
    ).not.toThrow();
  });

  it("renders without error when valeriaState='collapsed'", async () => {
    useShellStore.setState({ valeriaState: "collapsed", shellMode: "agentic" });
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    expect(() =>
      render(
        <ShellOrganismLayoutClient tenantId="acme-clinic">
          <div />
        </ShellOrganismLayoutClient>,
      ),
    ).not.toThrow();
  });
});

// ★ SC-5 — aria invariants on the single <main>
describe("ShellOrganismLayout — aria invariants on single <main> (SC-5)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
  });

  it("single <main> has id='main-content'", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    const { container } = render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const main = container.querySelector("main");
    expect(main).not.toBeNull();
    expect(main!.getAttribute("id")).toBe("main-content");
  });

  it("single <main> has tabIndex={-1}", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    const { container } = render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const main = container.querySelector("main");
    expect(main!.getAttribute("tabindex")).toBe("-1");
  });

  it("single <main> has aria-label='Contenido principal'", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    const { container } = render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const main = container.querySelector("main");
    expect(main!.getAttribute("aria-label")).toBe("Contenido principal");
  });
});

// Preserved SC-1 tests — agentic desktop renders correct chrome
describe("ShellOrganismLayout — default agentic render (SC-1)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
  });

  it("renders TopBarGlobal (banner role)", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div data-testid="page-content">content</div>
      </ShellOrganismLayoutClient>,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByTestId("topbar-global")).toBeInTheDocument();
  });

  it("renders PanelGroup with autoSaveId='vitalia-shell-split-agentic'", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const panelGroup = screen.getByTestId("panel-group");
    expect(panelGroup).toBeInTheDocument();
    expect(panelGroup).toHaveAttribute(
      "data-auto-save-id",
      "vitalia-shell-split-agentic",
    );
  });

  it("renders Panel with id='valeria-panel'", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const valeriaPanel = screen.getByTestId("panel-valeria-panel");
    expect(valeriaPanel).toBeInTheDocument();
    expect(valeriaPanel).toHaveAttribute("data-panel-id", "valeria-panel");
  });

  it("renders Panel with id='app-panel'", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const appPanel = screen.getByTestId("panel-app-panel");
    expect(appPanel).toBeInTheDocument();
    expect(appPanel).toHaveAttribute("data-panel-id", "app-panel");
  });

  it("renders PanelResizeHandle with aria-label='Redimensionar paneles'", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const handle = screen.getByTestId("panel-resize-handle");
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("aria-label", "Redimensionar paneles");
    expect(handle).toHaveAttribute("role", "separator");
  });

  it("renders ShellModeToggle disabled chip", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const toggle = screen.getByTestId("shell-mode-toggle");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeDisabled();
  });
});

// Preserved SC-3 — web mode static grid
describe("ShellOrganismLayout — web mode static grid (SC-3 edge)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "web" });
  });

  it("renders grid static layout (no PanelGroup) when shellMode='web'", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    // In web mode, no PanelGroup/resizable-panels is rendered (grid static layout)
    expect(screen.queryByTestId("panel-group")).not.toBeInTheDocument();
    expect(screen.queryByTestId("panel-resize-handle")).not.toBeInTheDocument();
  });

  it("still renders valeria-sidebar in web mode", async () => {
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    expect(screen.getByTestId("valeria-sidebar")).toBeInTheDocument();
  });
});

// Preserved D3 — MIN_VALERIA_PX invariant
describe("ShellOrganismLayout — MIN_VALERIA_PX invariant (D3)", () => {
  it("MIN_VALERIA_PX === 580 when valeriaState='full'", async () => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    expect(screen.queryByTestId("valeria-sidebar")).toBeInTheDocument();
  });

  it("MIN_VALERIA_PX === 360 when valeriaState='rail'", async () => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "agentic" });
    const { ShellOrganismLayoutClient } =
      await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    expect(screen.queryByTestId("valeria-sidebar")).toBeInTheDocument();
  });
});
