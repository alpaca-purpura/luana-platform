/**
 * ShellOrganismLayout.test.tsx — TDD RED-first tests for ShellOrganismLayout
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-3
 *
 * gherkin_coverage:
 * - SC-1 happy: default agentic state renders TopBarGlobal + PanelGroup + both slots
 * - SC-1 happy: main#main-content + tabIndex={-1} (skip-link target)
 * - SC-1 happy: Panel id="valeria-panel" + Panel id="app-panel" rendered
 * - SC-1 happy: PanelResizeHandle visible with aria-label="Redimensionar paneles"
 * - SC-2 negative: mobile branch renders <main md:hidden> (AppPanelSlot only, no PanelGroup)
 * - SC-3 edge: shellMode='web' grid branch (grid-cols-[60px_1px_1fr])
 * - SC-4 a11y: all 3 main branches have id="main-content" + tabIndex={-1}
 * - SC-4 a11y: ShellModeToggle disabled chip rendered in agentic mode
 *
 * 03-arch.md § 2.2, § 2.9
 * - ShellOrganismLayout is 'use client' (useShellStore + react-resizable-panels)
 * - Triple-main pattern: 3 <main> elements, CSS-driven mutually exclusive
 * - Uses useViewportGuard() hook (calls on mount)
 *
 * downstream-regression-na: brand-local shell component; no cross-brand consumers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useShellStore } from "@/stores/shell-store";

// Mock react-resizable-panels v4 to avoid DOM measurement issues in test env
// v4 API: Group (was PanelGroup), Panel, Separator (was PanelResizeHandle), useDefaultLayout
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
      data-default-layout={defaultLayout ? JSON.stringify(defaultLayout) : undefined}
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
  useDefaultLayout: vi.fn().mockReturnValue(undefined),
}));

// Mock useViewportGuard to avoid window.innerWidth setup complexity in layout tests
vi.mock("./useViewportGuard", () => ({
  useViewportGuard: vi.fn(),
}));

// Mock TopBarGlobal to avoid deep tree dependencies (TenantSwitcher, Clerk, etc.)
vi.mock("./TopBarGlobal", () => ({
  TopBarGlobal: () => (
    <header data-testid="topbar-global" role="banner" />
  ),
}));

// Mock ValeriaSidebarSlot
vi.mock("./ValeriaSidebarSlot", () => ({
  ValeriaSidebarSlot: () => (
    <aside
      data-testid="valeria-sidebar-slot"
      role="complementary"
      aria-label="Panel Valeria (placeholder — F1-S5/S6 lo construirá)"
    />
  ),
}));

// Mock AppPanelSlot
vi.mock("./AppPanelSlot", () => ({
  AppPanelSlot: ({ children }: { children?: React.ReactNode }) => (
    <section
      data-testid="app-panel-slot"
      role="region"
      aria-label="Panel aplicación (placeholder — F1-S7/S8/S10 lo construirá)"
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

// We import the component after setting up mocks — it doesn't exist yet (RED phase)
// import { ShellOrganismLayout } from "./ShellOrganismLayout";

describe("ShellOrganismLayout — import contract", () => {
  it("module exports ShellOrganismLayout as named export", async () => {
    const mod = await import("./ShellOrganismLayout");
    expect(typeof mod.ShellOrganismLayout).toBe("function");
  });
});

describe("ShellOrganismLayout — default agentic render (SC-1)", () => {
  beforeEach(() => {
    // Reset to default store state
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
  });

  it("renders TopBarGlobal (banner role)", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div data-testid="page-content">content</div>
      </ShellOrganismLayoutClient>,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByTestId("topbar-global")).toBeInTheDocument();
  });

  it("renders PanelGroup with autoSaveId='vitalia-shell-split-agentic'", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
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
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const valeriaPanel = screen.getByTestId("panel-valeria-panel");
    expect(valeriaPanel).toBeInTheDocument();
    expect(valeriaPanel).toHaveAttribute("data-panel-id", "valeria-panel");
    // v4 Panel does not have `order` prop — identity is via id
  });

  it("renders Panel with id='app-panel'", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const appPanel = screen.getByTestId("panel-app-panel");
    expect(appPanel).toBeInTheDocument();
    expect(appPanel).toHaveAttribute("data-panel-id", "app-panel");
    // v4 Panel does not have `order` prop — identity is via id
  });

  it("renders PanelResizeHandle with aria-label='Redimensionar paneles'", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
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
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const toggle = screen.getByTestId("shell-mode-toggle");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeDisabled();
  });

  it("passes children to AppPanelSlot (triple-main: appears in both desktop+mobile branches)", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div data-testid="child-content">page content</div>
      </ShellOrganismLayoutClient>,
    );
    // Triple-main pattern: children are rendered in both agentic panel + mobile branch
    const childElements = screen.getAllByTestId("child-content");
    expect(childElements.length).toBeGreaterThanOrEqual(1);
    expect(childElements[0]).toBeInTheDocument();
  });
});

describe("ShellOrganismLayout — skip-link target invariant (SC-4)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
  });

  it("all rendered <main> elements have id='main-content' (skip-link target)", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    const { container } = render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const mains = container.querySelectorAll("main");
    // Triple-main pattern: there can be 1+ mains (visible + CSS-hidden)
    expect(mains.length).toBeGreaterThanOrEqual(1);
    mains.forEach((main) => {
      expect(main).toHaveAttribute("id", "main-content");
    });
  });

  it("all rendered <main> elements have tabIndex={-1} for skip-link focus", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    const { container } = render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    const mains = container.querySelectorAll("main");
    mains.forEach((main) => {
      expect(main).toHaveAttribute("tabindex", "-1");
    });
  });
});

describe("ShellOrganismLayout — web mode static grid (SC-3 edge)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "rail", shellMode: "web" });
  });

  it("renders grid static layout (no PanelGroup) when shellMode='web'", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    // In web mode, no PanelGroup/resizable-panels is rendered (grid static layout)
    expect(screen.queryByTestId("panel-group")).not.toBeInTheDocument();
    expect(screen.queryByTestId("panel-resize-handle")).not.toBeInTheDocument();
  });

  it("still renders valeria-sidebar-slot in web mode", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    // Web mode uses grid: ValeriaSidebarSlot + divider + AppPanelSlot
    expect(screen.getAllByTestId("valeria-sidebar-slot").length).toBeGreaterThanOrEqual(1);
  });
});

describe("ShellOrganismLayout — mobile branch (SC-2)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaState: "full", shellMode: "agentic" });
  });

  it("renders a mobile main element (md:hidden branch)", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    const { container } = render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div data-testid="mobile-content">mobile content</div>
      </ShellOrganismLayoutClient>,
    );
    // Triple-main pattern: mobile branch has md:hidden class
    const mains = container.querySelectorAll("main#main-content");
    // At least one main with md:hidden (mobile branch)
    const mobileMains = Array.from(mains).filter((el) =>
      el.className.includes("md:hidden"),
    );
    expect(mobileMains.length).toBeGreaterThanOrEqual(1);
  });

  it("mobile branch contains AppPanelSlot", async () => {
    const { ShellOrganismLayoutClient } = await import("./ShellOrganismLayoutClient");
    render(
      <ShellOrganismLayoutClient tenantId="acme-clinic">
        <div />
      </ShellOrganismLayoutClient>,
    );
    // app-panel-slot exists in mobile branch (children passed)
    const slots = screen.getAllByTestId("app-panel-slot");
    expect(slots.length).toBeGreaterThanOrEqual(1);
  });
});
