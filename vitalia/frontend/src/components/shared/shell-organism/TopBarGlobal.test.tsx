/**
 * TopBarGlobal.test.tsx — Unit tests for TopBarGlobal organism
 * F1-S2 vitalia-fase1-topbar-global — T-4 TDD RED-first
 *
 * Tests:
 * - Renders <header role="banner"> (AC-11)
 * - Has data-testid="topbar-global" (AC-11)
 * - Height h-12 class present (AC-10 — 48px)
 * - Contains ThemeToggle (data-testid="theme-toggle") — F1-S1 integration
 * - Contains logo-mark link (AC-12)
 * - Named export contract
 *
 * downstream-regression-na: brand-local shell-organism test; no cross-brand consumers
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TopBarGlobal } from "./TopBarGlobal";

// Stub next/navigation used by next-themes internally (Vitest jsdom)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

describe("TopBarGlobal — structure (AC-10, AC-11, AC-12)", () => {
  it("renders <header> with role='banner' (AC-11)", () => {
    const { getByRole } = render(<TopBarGlobal />);
    expect(getByRole("banner")).toBeDefined();
  });

  it("has data-testid='topbar-global' (AC-11)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    expect(getByTestId("topbar-global")).toBeDefined();
  });

  it("header has h-12 class (48px height, AC-10)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    const header = getByTestId("topbar-global");
    expect(header.className).toContain("h-12");
  });

  it("contains theme toggle button (F1-S1 ThemeToggle)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    expect(getByTestId("theme-toggle")).toBeDefined();
  });

  it("contains logo mark links to / (AC-12) — 2 instances for CSS responsive", () => {
    const { getAllByTestId } = render(<TopBarGlobal />);
    // TopBarGlobal renders 2 LogoMark instances: full (hidden md:inline-flex) + mark (inline-flex md:hidden)
    const marks = getAllByTestId("logo-mark");
    expect(marks.length).toBe(2);
    marks.forEach((mark) => expect(mark).toHaveAttribute("href", "/"));
  });
});

describe("TopBarGlobal — named export contract", () => {
  it("is a named export (not default)", () => {
    expect(typeof TopBarGlobal).toBe("function");
  });
});
