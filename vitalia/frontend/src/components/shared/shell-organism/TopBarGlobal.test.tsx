/**
 * TopBarGlobal.test.tsx — Unit tests for TopBarGlobal organism
 * F1-S2 vitalia-fase1-topbar-global — T-4 TDD RED-first
 * Updated F1-S3 — T-8: mock TenantSwitcher (Client Component with Clerk hooks)
 * Updated F1-S5 — T-6: hamburger button mobile drawer trigger (ADD-ONLY)
 *
 * Tests:
 * - Renders <header role="banner"> (AC-11)
 * - Has data-testid="topbar-global" (AC-11)
 * - Height h-12 class present (AC-10 — 48px)
 * - Contains ThemeToggle (data-testid="theme-toggle") — F1-S1 integration
 * - Contains logo-mark link (AC-12)
 * - Named export contract
 * - [T-6] hamburger button rendered with md:hidden class
 * - [T-6] hamburger aria-label 'Abrir panel Valeria' + data-testid
 * - [T-6] hamburger icon Menu aria-hidden='true'
 * - [T-6] hamburger click dispatches setValeriaState('full') + setShellMode('agentic')
 * - [T-6] Regression: LogoMark rendered (F1-S2)
 * - [T-6] Regression: TenantSwitcher rendered (F1-S3)
 * - [T-6] Regression: ThemeToggle rendered (F1-S1)
 * - [T-6] Regression: header data-testid='topbar-global' h-12 z-50 preserved
 *
 * downstream-regression-na: brand-local shell-organism test; no cross-brand consumers
 */

import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TopBarGlobal } from "./TopBarGlobal";

// Stub next/navigation used by next-themes + TenantSwitcher (usePathname) internally
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

// Mock TenantSwitcher — Client Component with Clerk+ReactQuery hooks.
// TopBarGlobal tests focus on shell structure (header/logo/theme), not TenantSwitcher internals.
// TenantSwitcher is independently tested in TenantSwitcher.test.tsx.
vi.mock("./TenantSwitcher", () => ({
  TenantSwitcher: () => (
    <div data-testid="tenant-switcher-mock">TenantSwitcher</div>
  ),
}));

// Mock useShellStore — TopBarGlobal T-6 reads setters only (no state read).
// Pattern: mock the module and capture setter calls via vi.fn().
const mockSetValeriaState = vi.fn();
const mockSetShellMode = vi.fn();

vi.mock("@/stores/shell-store", () => ({
  useShellStore: (selector: (s: unknown) => unknown) => {
    const store = {
      setValeriaState: mockSetValeriaState,
      setShellMode: mockSetShellMode,
    };
    return selector(store);
  },
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

// ─── T-6: hamburger button mobile drawer trigger (F1-S5, D7 spec) ────────────

describe("TopBarGlobal — hamburger button mobile (T-6, D7)", () => {
  beforeEach(() => {
    mockSetValeriaState.mockClear();
    mockSetShellMode.mockClear();
  });

  it("[T-6] hamburger button rendered with md:hidden class", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    const burger = getByTestId("topbar-hamburger");
    expect(burger.className).toContain("md:hidden");
  });

  it("[T-6] hamburger aria-label is 'Abrir panel Valeria' (Spanish neutro, D7)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    const burger = getByTestId("topbar-hamburger");
    expect(burger).toHaveAttribute("aria-label", "Abrir panel Valeria");
  });

  it("[T-6] hamburger has data-testid='topbar-hamburger'", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    expect(getByTestId("topbar-hamburger")).toBeDefined();
  });

  it("[T-6] hamburger icon Menu has aria-hidden='true' (decorative)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    // The Lucide Menu icon renders an svg inside the button
    const burger = getByTestId("topbar-hamburger");
    const svg = burger.querySelector("svg");
    expect(svg).toBeDefined();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("[T-6] click hamburger dispatches setValeriaState('full') + setShellMode('agentic')", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    const burger = getByTestId("topbar-hamburger");
    fireEvent.click(burger);
    expect(mockSetValeriaState).toHaveBeenCalledOnce();
    expect(mockSetValeriaState).toHaveBeenCalledWith("full");
    expect(mockSetShellMode).toHaveBeenCalledOnce();
    expect(mockSetShellMode).toHaveBeenCalledWith("agentic");
  });
});

// ─── T-6: Regression tests (F1-S1/S2/S3 preserved intact) ───────────────────

describe("TopBarGlobal — regression (F1-S1/S2/S3, T-6)", () => {
  it("[regression] LogoMark still rendered (F1-S2 preserved)", () => {
    const { getAllByTestId } = render(<TopBarGlobal />);
    const marks = getAllByTestId("logo-mark");
    expect(marks.length).toBe(2);
  });

  it("[regression] TenantSwitcher still rendered (F1-S3 preserved)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    expect(getByTestId("tenant-switcher-mock")).toBeDefined();
  });

  it("[regression] ThemeToggle still rendered (F1-S1 preserved)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    expect(getByTestId("theme-toggle")).toBeDefined();
  });

  it("[regression] header data-testid='topbar-global' with h-12 and z-50 (structure preserved)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    const header = getByTestId("topbar-global");
    expect(header.className).toContain("h-12");
    expect(header.className).toContain("z-50");
  });
});
