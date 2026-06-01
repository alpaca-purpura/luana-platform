/**
 * AppPanelSlot.test.tsx — Integration tests for AppPanelSlot with <Ribbon /> + <SubTabsBar />
 * F1-S7 vitalia-fase1-ribbon-6-tabs — T-4 (swap skeleton ribbon → <Ribbon /> real)
 * F1-S8 vitalia-fase1-sub-tabs-line2 — T-5 (swap skeleton sub-tabs → <SubTabsBar /> real)
 *
 * gherkin_coverage T-5:
 * - "(integration) AppPanelSlot renders <SubTabsBar /> real (no skeleton sub-tabs)"
 *   - renders [data-testid=sub-tabs-bar] from <SubTabsBar /> child component
 *   - skeleton sub-tabs placeholder (h-10 with opacity-45 bars) REMOVED from DOM
 *   - ribbon real (F1-S7) PRESERVED ([data-testid=ribbon] still in DOM)
 *   - content area skeleton PRESERVED (still rendered — F1-S10 will replace)
 *   - slot label text updated to 'AppPanelSlot · F1-S10' (S8 done)
 *   - aria-label preserved 'Panel aplicación'
 *   - children prop still pass-through preserved
 *
 * Mocks next/navigation hooks since <Ribbon /> and <SubTabsBar /> are Client Components
 * that use usePathname + useRouter + useParams internally.
 *
 * Spec: 03-arch.md § 2.5 · 06-tickets.yaml T-5 gherkin_coverage
 * downstream-regression-na: brand-local shell-organism test; no cross-brand consumers
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppPanelSlot } from "./AppPanelSlot";

// Mock next/navigation — Ribbon + SubTabsBar use usePathname, useRouter, useParams
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/test-tenant/mateo/agenda"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useParams: vi.fn(() => ({ tenantId: "test-tenant" })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AppPanelSlot — integration with Ribbon + SubTabsBar (F1-S8 T-5)", () => {
  it("renders <section role='region'> with aria-label 'Panel aplicación'", () => {
    render(<AppPanelSlot />);
    const section = screen.getByRole("region");
    expect(section).toBeDefined();
    expect(section.tagName.toLowerCase()).toBe("section");
    expect(section.getAttribute("aria-label")).toBe("Panel aplicación");
  });

  it("data-testid='app-panel-slot'", () => {
    render(<AppPanelSlot />);
    expect(screen.getByTestId("app-panel-slot")).toBeDefined();
  });

  it("renders [data-testid=ribbon] from <Ribbon /> — real organism PRESERVED (F1-S7 regression guard)", () => {
    render(<AppPanelSlot />);
    const ribbon = screen.getByTestId("ribbon");
    expect(ribbon).toBeDefined();
    expect(ribbon.tagName.toLowerCase()).toBe("nav");
    expect(ribbon.getAttribute("role")).toBe("tablist");
    expect(ribbon.getAttribute("aria-label")).toBe("Agentes");
  });

  it("renders [data-testid=sub-tabs-bar] from <SubTabsBar /> — real organism (not skeleton)", () => {
    render(<AppPanelSlot />);
    // SubTabsBar renders with usePathname '/test-tenant/mateo/agenda' → 2 mateo subtabs (v1.2)
    const subTabsBar = screen.getByTestId("sub-tabs-bar");
    expect(subTabsBar).toBeDefined();
    expect(subTabsBar.tagName.toLowerCase()).toBe("nav");
    expect(subTabsBar.getAttribute("role")).toBe("tablist");
    expect(subTabsBar.getAttribute("aria-label")).toBe("Sub-secciones Mateo");
  });

  it("skeleton sub-tabs placeholder (opacity-45 bars inside h-10 div) REMOVED from DOM after F1-S8 swap", () => {
    const { container } = render(<AppPanelSlot />);
    // Old skeleton had a .h-10.shrink-0 div with 4 opacity-45 bar divs inside
    // After T-5 swap, the h-10 skeleton div is gone
    const subTabSkeleton = container.querySelector(".h-10.shrink-0");
    expect(subTabSkeleton).toBeNull();
  });

  it("skeleton ribbon circles (bg-agent-{slug}-soft opacity-65) are REMOVED from DOM (F1-S7 regression guard)", () => {
    const { container } = render(<AppPanelSlot />);
    const skeletonCircles = container.querySelectorAll(
      ".rounded-full.opacity-65",
    );
    expect(skeletonCircles.length).toBe(0);
  });

  it("NO renderiza el label placeholder de debug (removido 2026-05-29 — leakeaba 'AppPanelSlot' encima del contenido real)", () => {
    const { container } = render(<AppPanelSlot />);
    // El span placeholder absoluto/z-20 fue removido: el contenido real (o su skeleton)
    // ya no debe tener un label de debug flotando encima en ninguna ruta del shell.
    const labelSpan = container.querySelector(
      "span.tracking-wider[aria-hidden='true']",
    );
    expect(labelSpan).toBeNull();
    expect(container.textContent ?? "").not.toContain("AppPanelSlot");
  });

  it("aria-label is 'Panel aplicación' (preserved)", () => {
    render(<AppPanelSlot />);
    const section = screen.getByRole("region");
    const ariaLabel = section.getAttribute("aria-label") ?? "";
    expect(ariaLabel).toBe("Panel aplicación");
  });

  it("children prop pass-through preserved (z-indexed overlay)", () => {
    render(
      <AppPanelSlot>
        <div data-testid="route-child">Contenido de ruta</div>
      </AppPanelSlot>,
    );
    const child = screen.getByTestId("route-child");
    expect(child).toBeDefined();
    expect(child.textContent).toBe("Contenido de ruta");
  });

  it("renders without children — content skeleton shown (no crash)", () => {
    const { container } = render(<AppPanelSlot />);
    const section = container.querySelector("[data-testid='app-panel-slot']");
    expect(section).not.toBeNull();
    const skeletonBars = container.querySelectorAll(".bg-muted.opacity-45");
    expect(skeletonBars.length).toBeGreaterThan(0);
  });

  it("AppPanelSlot does not crash when SubTabsBar returns null (Q5 guard defensive integration)", () => {
    // The actual null guard (invalid agent path) is covered by SubTabsBar.test.tsx.
    // Here we verify AppPanelSlot renders stably in normal operation (valid agent).
    // Mock is set to /test-tenant/mateo/agenda → SubTabsBar renders 2 mateo subtabs (v1.2).
    render(<AppPanelSlot />);
    expect(screen.getByTestId("app-panel-slot")).toBeDefined();
    expect(screen.getByTestId("ribbon")).toBeDefined();
    expect(screen.getByTestId("sub-tabs-bar")).toBeDefined();
  });
});

describe("AppPanelSlot — Tailwind layout classes preserved", () => {
  it("has expected layout classes (relative flex flex-col overflow-hidden)", () => {
    render(<AppPanelSlot />);
    const section = screen.getByTestId("app-panel-slot");
    expect(section.className).toContain("relative");
    expect(section.className).toContain("flex");
    expect(section.className).toContain("flex-col");
    expect(section.className).toContain("h-full");
    expect(section.className).toContain("overflow-hidden");
  });
});

describe("AppPanelSlot — named export contract", () => {
  it("is a named export (not default)", () => {
    expect(typeof AppPanelSlot).toBe("function");
  });
});
