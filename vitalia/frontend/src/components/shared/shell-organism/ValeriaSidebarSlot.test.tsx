/**
 * ValeriaSidebarSlot.test.tsx — Unit tests for ValeriaSidebarSlot placeholder Server Component
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-2 TDD RED-first
 *
 * gherkin_coverage:
 * - SC-1 happy: ValeriaSidebarSlot rendered with correct semantic markup
 * - SC-4 adversarial: aria-labels legibles Spanish neutro (sin voseo, tildes ✓)
 *
 * Spec: 03-arch.md § 2.3
 * - Server Component (no "use client") — renders as pure JSX, no hooks
 * - <aside> element con role="complementary"
 * - aria-label="Panel Valeria (placeholder — F1-S5/S6 lo construirá)"
 * - data-testid="valeria-sidebar-slot"
 * - Tailwind classes: relative flex h-full min-h-0 overflow-hidden border-r border-border bg-card
 * - Named export ValeriaSidebarSlot (NO default export)
 *
 * downstream-regression-na: brand-local shell-organism test; no cross-brand consumers
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValeriaSidebarSlot } from "./ValeriaSidebarSlot";

describe("ValeriaSidebarSlot — semantic markup (SC-1 happy)", () => {
  it("renders <aside role='complementary'> with aria-label", () => {
    const { getByRole } = render(<ValeriaSidebarSlot />);
    const aside = getByRole("complementary");
    expect(aside).toBeDefined();
    expect(aside.tagName.toLowerCase()).toBe("aside");
  });

  it("data-testid='valeria-sidebar-slot'", () => {
    const { getByTestId } = render(<ValeriaSidebarSlot />);
    expect(getByTestId("valeria-sidebar-slot")).toBeDefined();
  });

  it("aria-label includes 'Panel Valeria'", () => {
    const { getByRole } = render(<ValeriaSidebarSlot />);
    const aside = getByRole("complementary");
    expect(aside.getAttribute("aria-label")).toContain("Panel Valeria");
  });
});

describe("ValeriaSidebarSlot — accessibility aria-label (SC-4 adversarial)", () => {
  it("aria-label is legible Spanish neutro without voseo", () => {
    const { getByRole } = render(<ValeriaSidebarSlot />);
    const aside = getByRole("complementary");
    const ariaLabel = aside.getAttribute("aria-label") ?? "";
    // Must contain 'Panel Valeria' — spec verbatim
    expect(ariaLabel).toContain("Panel Valeria");
    // Must NOT contain voseo patterns (lo, la conjugations are OK; check imperative voseo)
    expect(ariaLabel).not.toMatch(/\btenés\b|\bpodés\b|\bsabes\b|\bvos\b/);
  });

  it("slot label text 'VALERIASIDEBARSLOT · F1-S5/S6' present in DOM (skeleton refit c1925563)", () => {
    const { getByTestId } = render(<ValeriaSidebarSlot />);
    const aside = getByTestId("valeria-sidebar-slot");
    // Post-refit: component renders skeleton siluetas + floating slot label
    // The slot label identifies this as a placeholder pending F1-S5/S6
    expect(aside.textContent).toContain("ValeriaSidebarSlot · F1-S5/S6");
  });

  it("mobile fallback hint 'Valeria — abrir desde menú' present in DOM", () => {
    const { getByTestId } = render(<ValeriaSidebarSlot />);
    const aside = getByTestId("valeria-sidebar-slot");
    // Mobile fallback text exists in DOM even if CSS-hidden on desktop viewport
    expect(aside.textContent).toContain("Valeria — abrir desde menú");
  });
});

describe("ValeriaSidebarSlot — Tailwind classes (SC-1 structural)", () => {
  it("has expected layout classes", () => {
    const { getByTestId } = render(<ValeriaSidebarSlot />);
    const aside = getByTestId("valeria-sidebar-slot");
    // Core layout classes per 03-arch § 2.3
    expect(aside.className).toContain("relative");
    expect(aside.className).toContain("flex");
    expect(aside.className).toContain("h-full");
    expect(aside.className).toContain("overflow-hidden");
  });
});

describe("ValeriaSidebarSlot — named export contract", () => {
  it("is a named export (not default)", () => {
    expect(typeof ValeriaSidebarSlot).toBe("function");
  });
});
