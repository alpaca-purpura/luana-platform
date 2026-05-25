/**
 * AppPanelSlot.test.tsx — Integration tests for AppPanelSlot with <Ribbon /> real
 * F1-S7 vitalia-fase1-ribbon-6-tabs — T-4 (swap skeleton → <Ribbon /> integration)
 *
 * gherkin_coverage:
 * - "(integration) AppPanelSlot renders <Ribbon /> real (no skeleton ribbon)"
 *   - renders [data-testid=ribbon] from <Ribbon /> child component
 *   - skeleton bg-agent-{slug}-soft circles for 5 agents REMOVED from DOM
 *   - sub-tabs skeleton PRESERVED (still rendered — F1-S8 will replace)
 *   - content area skeleton PRESERVED (still rendered — F1-S10 will replace)
 *   - slot label text updated to 'AppPanelSlot · F1-S8 / S10' (S7 done)
 *   - aria-label updated to 'Panel aplicación' (no longer placeholder text)
 *   - children prop still pass-through preserved
 *
 * Mocks next/navigation hooks since <Ribbon /> is a Client Component that
 * uses usePathname + useRouter + useParams internally.
 *
 * Spec: 03-arch.md § 2.5 · 06-tickets.yaml T-4 gherkin_coverage
 * downstream-regression-na: brand-local shell-organism test; no cross-brand consumers
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppPanelSlot } from "./AppPanelSlot";

// Mock next/navigation — Ribbon uses usePathname, useRouter, useParams
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/test-tenant/valeria/agenda"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useParams: vi.fn(() => ({ tenantId: "test-tenant" })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AppPanelSlot — integration with Ribbon (F1-S7 T-4)", () => {
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

  it("renders [data-testid=ribbon] from <Ribbon /> — real organism (not skeleton)", () => {
    render(<AppPanelSlot />);
    // The real Ribbon renders a <nav data-testid="ribbon"> element
    const ribbon = screen.getByTestId("ribbon");
    expect(ribbon).toBeDefined();
    expect(ribbon.tagName.toLowerCase()).toBe("nav");
    expect(ribbon.getAttribute("role")).toBe("tablist");
    expect(ribbon.getAttribute("aria-label")).toBe("Agentes");
  });

  it("skeleton ribbon circles (bg-agent-{slug}-soft opacity-65) are REMOVED from DOM", () => {
    const { container } = render(<AppPanelSlot />);
    // Old skeleton had 5 circles with rounded-full + bg-agent-*-soft + opacity-65
    // After T-4 swap, those should not exist
    const skeletonCircles = container.querySelectorAll(
      ".rounded-full.opacity-65",
    );
    expect(skeletonCircles.length).toBe(0);
  });

  it("sub-tabs skeleton PRESERVED (F1-S8 placeholder still rendered)", () => {
    const { container } = render(<AppPanelSlot />);
    // Sub-tabs placeholder has gap-3 + border-b + h-10 structure
    // It contains skeleton bar divs with h-2 + rounded + bg-muted + opacity-45
    const subTabSkeleton = container.querySelector(".h-10");
    expect(subTabSkeleton).not.toBeNull();
  });

  it("slot label text is 'AppPanelSlot · F1-S8 / S10' (S7 done — removed from label)", () => {
    const { container } = render(<AppPanelSlot />);
    // Find the slot label span (aria-hidden, tracking-wider)
    const labelSpan = container.querySelector(
      "span.tracking-wider[aria-hidden='true']",
    );
    expect(labelSpan).not.toBeNull();
    expect(labelSpan?.textContent).toBe("AppPanelSlot · F1-S8 / S10");
    // F1-S7 should NOT be in label anymore (already done)
    expect(labelSpan?.textContent).not.toContain("S7");
  });

  it("aria-label is 'Panel aplicación' (not placeholder wording)", () => {
    render(<AppPanelSlot />);
    const section = screen.getByRole("region");
    const ariaLabel = section.getAttribute("aria-label") ?? "";
    expect(ariaLabel).toBe("Panel aplicación");
    // Old placeholder text gone
    expect(ariaLabel).not.toContain("placeholder");
    expect(ariaLabel).not.toContain("F1-S7");
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
    // Should render some skeleton content when no children
    const skeletonBars = container.querySelectorAll(".bg-muted.opacity-45");
    expect(skeletonBars.length).toBeGreaterThan(0);
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
