/**
 * AppPanelSlot.test.tsx — Unit tests for AppPanelSlot placeholder Server Component
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-2 TDD RED-first
 *
 * gherkin_coverage:
 * - SC-1 happy: AppPanelSlot rendered with correct semantic markup + children slot
 * - SC-4 adversarial: aria-labels legibles Spanish neutro (sin voseo, tildes ✓)
 *
 * Spec: 03-arch.md § 2.4
 * - Server Component (no "use client") — renders as pure JSX, no hooks
 * - <section> element con role="region"
 * - aria-label="Panel aplicación (placeholder — F1-S7/S8/S10 lo construirá)"
 * - data-testid="app-panel-slot"
 * - Props: { children?: React.ReactNode } — renders children inside section
 * - Tailwind classes: relative flex h-full min-h-0 flex-col overflow-hidden bg-background
 * - Named export AppPanelSlot (NO default export)
 *
 * downstream-regression-na: brand-local shell-organism test; no cross-brand consumers
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppPanelSlot } from "./AppPanelSlot";

describe("AppPanelSlot — semantic markup (SC-1 happy)", () => {
  it("renders <section role='region'> with aria-label", () => {
    const { getByRole } = render(<AppPanelSlot />);
    const section = getByRole("region");
    expect(section).toBeDefined();
    expect(section.tagName.toLowerCase()).toBe("section");
  });

  it("data-testid='app-panel-slot'", () => {
    const { getByTestId } = render(<AppPanelSlot />);
    expect(getByTestId("app-panel-slot")).toBeDefined();
  });

  it("aria-label includes 'Panel aplicación'", () => {
    const { getByRole } = render(<AppPanelSlot />);
    const section = getByRole("region");
    expect(section.getAttribute("aria-label")).toContain("Panel aplicación");
  });

  it("renders children slot (SC-1 children pass-through)", () => {
    const { getByTestId } = render(
      <AppPanelSlot>
        <div data-testid="child">contenido hijo</div>
      </AppPanelSlot>,
    );
    // Child should be present inside the section
    expect(getByTestId("child")).toBeDefined();
    expect(getByTestId("child").textContent).toBe("contenido hijo");
  });
});

describe("AppPanelSlot — accessibility aria-label (SC-4 adversarial)", () => {
  it("aria-label is legible Spanish neutro without voseo", () => {
    const { getByRole } = render(<AppPanelSlot />);
    const section = getByRole("region");
    const ariaLabel = section.getAttribute("aria-label") ?? "";
    // Must contain 'Panel aplicación' — spec verbatim
    expect(ariaLabel).toContain("Panel aplicación");
    // Must NOT contain voseo patterns
    expect(ariaLabel).not.toMatch(/\btenés\b|\bpodés\b|\bvos\b/);
  });

  it("renders without children — empty section is valid placeholder", () => {
    const { getByTestId } = render(<AppPanelSlot />);
    const section = getByTestId("app-panel-slot");
    expect(section).toBeDefined();
  });
});

describe("AppPanelSlot — Tailwind classes (SC-1 structural)", () => {
  it("has expected layout classes", () => {
    const { getByTestId } = render(<AppPanelSlot />);
    const section = getByTestId("app-panel-slot");
    // Core layout classes per 03-arch § 2.4
    expect(section.className).toContain("relative");
    expect(section.className).toContain("flex");
    expect(section.className).toContain("h-full");
    expect(section.className).toContain("overflow-hidden");
    expect(section.className).toContain("flex-col");
  });
});

describe("AppPanelSlot — named export contract", () => {
  it("is a named export (not default)", () => {
    expect(typeof AppPanelSlot).toBe("function");
  });
});
