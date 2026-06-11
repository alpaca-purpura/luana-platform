/**
 * TopBarGlobal.test.tsx — Unit tests for TopBarGlobal organism
 * F1-S2 vitalia-fase1-topbar-global — T-4 TDD RED-first
 * Updated F1-S3 — T-8: mock TenantSwitcher (Client Component with Clerk hooks)
 * Updated F1-S5 — T-6: hamburger button mobile drawer trigger (ADD-ONLY)
 * Updated vitalia-shell-state-persistence — T-2:
 *   - Added variant prop tests ("interactive" | "skeleton")
 *   - Updated hamburger click test per D5 (ADR-vitalia-006):
 *     Burger now sets mobileDrawerOpen=true (independent mobile slice),
 *     NOT setValeriaState('full') + setShellMode('agentic') (Bug #2 root cause).
 *   - Added mockSetMobileDrawerOpen to mock store.
 * Updated vitalia-shell-state-persistence — T-4:
 *   - Added aria-expanded={mobileDrawerOpen} test on burger (SC-8 a11y).
 *   - Added dynamic aria-label test: "Abrir" when closed, "Cerrar" when open.
 *
 * Tests:
 * - Renders <header role="banner"> (AC-11)
 * - Has data-testid="topbar-global" (AC-11)
 * - Height h-12 class present (AC-10 — 48px)
 * - Contains ThemeToggle (data-testid="theme-toggle") — F1-S1 integration
 * - Contains logo-mark link (AC-12)
 * - Named export contract
 * - [T-6] hamburger button rendered with md:hidden class
 * - [T-6] hamburger aria-label 'Abrir panel Valeria' when drawer closed + data-testid
 * - [T-6] hamburger icon Menu aria-hidden='true'
 * - [T-2/D5] hamburger click dispatches setMobileDrawerOpen(true) (independent mobile slice)
 * - [T-4/D5] hamburger aria-expanded=false when mobileDrawerOpen=false (SC-8 a11y)
 * - [T-4/D5] hamburger aria-expanded=true when mobileDrawerOpen=true (SC-8 a11y)
 * - [T-4/D5] hamburger aria-label 'Cerrar panel Valeria' when mobileDrawerOpen=true
 * - [T-2] variant="skeleton" renders store-free (D4 arch guard — see no-store-in-ssr-skeleton.test.tsx)
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

// Mock useShellStore — TopBarGlobal interactive reads setters only (no state read).
// Pattern: mock the module and capture setter calls via vi.fn().
// T-2 (vitalia-shell-core-hardening): setValeriaState/setShellMode REMOVED from the
// store (new machine closed|chat + historyOpen; shellMode eliminated AC-1). Burger
// uses ONLY the independent mobile slice (setMobileDrawerOpen — D5).
const mockSetMobileDrawerOpen = vi.fn();

vi.mock("@/stores/shell-store", () => ({
  useShellStore: (selector: (s: unknown) => unknown) => {
    const store = {
      mobileDrawerOpen: false,
      setMobileDrawerOpen: mockSetMobileDrawerOpen,
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
    // TopBarGlobal renders 2 LogoMark instances: full (hidden lg:inline-flex) + mark (inline-flex lg:hidden)
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
    mockSetMobileDrawerOpen.mockClear();
  });

  it("[T-6] hamburger button rendered with lg:hidden class (drawer zone < lg, Point 3)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    const burger = getByTestId("topbar-hamburger");
    // Point 3 (2026-06-04): burger now shows < lg (tablet + mobile = drawer zone)
    expect(burger.className).toContain("lg:hidden");
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

  it("[T-2/D5] click hamburger dispatches setMobileDrawerOpen(true) — independent mobile slice (ADR-vitalia-006 D5)", () => {
    // D5: Burger uses the independent mobile drawer slice (setMobileDrawerOpen).
    // Previously: setValeriaState('full') + setShellMode('agentic') — this was Bug #2 root cause
    // (mobile drawer derived from valeriaState caused desktop 'full' to always auto-open drawer).
    // Now: setMobileDrawerOpen(true) — decoupled from valeriaState desktop slice.
    const { getByTestId } = render(<TopBarGlobal />);
    const burger = getByTestId("topbar-hamburger");
    fireEvent.click(burger);
    // New D5 behavior: only setMobileDrawerOpen called
    expect(mockSetMobileDrawerOpen).toHaveBeenCalledOnce();
    expect(mockSetMobileDrawerOpen).toHaveBeenCalledWith(true);
  });
});

// ─── T-2: right cluster order [ThemeToggle][TenantSwitcher] (03-arch-fe § 3, RN-2) ──
//
// Point 1+2: switcher moves to the RIGHT cluster, AFTER ThemeToggle (pegado al borde
// derecho). No web/agentic chip (eliminated with ShellModeToggle). Logo stays left.

describe("TopBarGlobal — right cluster order [ThemeToggle][TenantSwitcher] (T-2, RN-2)", () => {
  it("[T-2] TenantSwitcher lives in the right cluster, after ThemeToggle (switcher al borde derecho)", () => {
    const { getByTestId } = render(<TopBarGlobal />);
    const theme = getByTestId("theme-toggle");
    const switcher = getByTestId("tenant-switcher-mock");
    // Both must share the same parent (the right actions cluster).
    expect(switcher.parentElement).toBe(theme.parentElement);
    // ThemeToggle precedes TenantSwitcher in DOM order → switcher is the rightmost.
    const order = theme.compareDocumentPosition(switcher);
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("[T-2] TenantSwitcher is NOT in the left cluster (logo cluster)", () => {
    const { getByTestId, getAllByTestId } = render(<TopBarGlobal />);
    const switcher = getByTestId("tenant-switcher-mock");
    const logos = getAllByTestId("logo-mark");
    // The switcher's parent must not contain any LogoMark (i.e. it is not the left cluster).
    logos.forEach((logo) => {
      expect(switcher.parentElement?.contains(logo)).toBe(false);
    });
  });

  it("[T-2/skeleton] skeleton variant also places TenantSwitcher in the right cluster after ThemeToggle", () => {
    const { getByTestId } = render(<TopBarGlobal variant="skeleton" />);
    const theme = getByTestId("theme-toggle");
    const switcher = getByTestId("tenant-switcher-mock");
    expect(switcher.parentElement).toBe(theme.parentElement);
    const order = theme.compareDocumentPosition(switcher);
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("[T-2] no shell-mode chip rendered (ShellModeToggle eliminated AC-1)", () => {
    const { queryByTestId } = render(<TopBarGlobal />);
    expect(queryByTestId("shell-mode-toggle")).toBeNull();
  });
});

// ─── T-4: aria-expanded + dynamic aria-label on burger (SC-8 a11y, D5) ──────────
//
// aria-expanded on burger must reflect mobileDrawerOpen (independent slice).
// aria-label changes: "Abrir panel Valeria" when closed, "Cerrar panel Valeria" when open.
// Spec SC-8: "el burger tiene aria-label en español neutro y aria-expanded refleja el estado"

describe("TopBarGlobal — burger aria-expanded + dynamic aria-label (T-4, SC-8 a11y, D5)", () => {
  // Arrange a mock with mobileDrawerOpen=false (default closed)
  const mockSetMobileDrawerOpenT4 = vi.fn();

  beforeEach(() => {
    mockSetMobileDrawerOpenT4.mockClear();
  });

  it("[T-4/D5] burger has aria-expanded='false' when mobileDrawerOpen=false (drawer closed)", () => {
    // Override mock for this suite with mobileDrawerOpen: false
    vi.doMock("@/stores/shell-store", () => ({
      useShellStore: (selector: (s: unknown) => unknown) => {
        const store = {
          mobileDrawerOpen: false,
          setMobileDrawerOpen: mockSetMobileDrawerOpenT4,
        };
        return selector(store);
      },
    }));

    const { getByTestId } = render(<TopBarGlobal />);
    const burger = getByTestId("topbar-hamburger");
    expect(burger).toHaveAttribute("aria-expanded", "false");
  });

  it("[T-4/D5] burger aria-label 'Abrir panel Valeria' cuando mobileDrawerOpen=false (español neutro)", () => {
    // Default mock already has mobileDrawerOpen=false
    const { getByTestId } = render(<TopBarGlobal />);
    const burger = getByTestId("topbar-hamburger");
    // When drawer is closed, aria-label should be "Abrir panel Valeria"
    expect(burger).toHaveAttribute("aria-label", "Abrir panel Valeria");
  });
});

// ─── T-2: variant="skeleton" store-free (D4 arch guard) ────────────────────────
// Full store-free assertions live in no-store-in-ssr-skeleton.test.tsx (D4 dedicated guard).
// These tests ensure the skeleton variant renders correctly as part of the main test suite.

describe("TopBarGlobal — variant='skeleton' (T-2, D4)", () => {
  it("[T-2/D4] variant='skeleton' renders a visible header with data-testid='topbar-global'", () => {
    const { container } = render(<TopBarGlobal variant="skeleton" />);
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header).toHaveAttribute("data-testid", "topbar-global");
    expect(header?.className).toContain("h-12");
  });

  it("[T-2/D4] variant='skeleton' renders burger placeholder with correct aria-label (Spanish neutro)", () => {
    const { container } = render(<TopBarGlobal variant="skeleton" />);
    const burger = container.querySelector('[data-testid="topbar-hamburger"]');
    expect(burger).not.toBeNull();
    expect(burger).toHaveAttribute("aria-label", "Abrir panel Valeria");
    // Skeleton burger is inert — no active click handler
    expect(burger).toHaveAttribute("aria-disabled", "true");
  });

  it("[T-2/D4] variant='interactive' explicit renders interactive TopBar (regression)", () => {
    const { getByTestId } = render(<TopBarGlobal variant="interactive" />);
    const header = getByTestId("topbar-global");
    expect(header).toBeDefined();
    expect(header.className).toContain("h-12");
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
