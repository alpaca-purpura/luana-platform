// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4 (RED test — written before implementation)
/**
 * LuanaSidebar — T-4 component tests (GREEN after implementation)
 *
 * Nicolify LuanaState: 'collapsed' | 'history' | 'full'
 * (NOT 'rail' — Vitalia uses 'rail' for ValeriaSidebar, Nicolify uses 'history')
 *
 * Tests:
 * 1. Renders with role=complementary (D1 gate requirement)
 * 2. History state: LuanaRail visible (history=compact icon rail)
 * 3. Full state: LuanaHistory visible
 * 4. Mobile drawer: closed by default (D2 scenario)
 * 5. aria-label contains 'Luana'
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LuanaSidebar } from "../LuanaSidebar";
import type { LuanaState } from "@/stores/shell-store";

// ── Mock useShellStore (T-3 — Zustand SSR-safe) ──────────────────────────────

const mockStore: {
  luanaState: LuanaState;
  setLuanaState: ReturnType<typeof vi.fn>;
  setShellMode: ReturnType<typeof vi.fn>;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: ReturnType<typeof vi.fn>;
} = {
  luanaState: "history",
  setLuanaState: vi.fn(),
  setShellMode: vi.fn(),
  mobileDrawerOpen: false,
  setMobileDrawerOpen: vi.fn(),
};

vi.mock("@/stores/shell-store", () => ({
  useShellStore: (selector: (s: typeof mockStore) => unknown) => selector(mockStore),
}));

// ── Mock sub-components to avoid deep render ─────────────────────────────────
vi.mock("../LuanaRail", () => ({
  LuanaRail: () => <div data-testid="luana-rail">Rail</div>,
}));

vi.mock("../LuanaHistory", () => ({
  LuanaHistory: () => <div data-testid="luana-history">History</div>,
}));

vi.mock("../LuanaChat", () => ({
  LuanaChat: () => <div data-testid="luana-chat">Chat</div>,
}));

// ── Mock createPortal ─────────────────────────────────────────────────────────
vi.mock("react-dom", async () => {
  const real = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...real,
    createPortal: (node: unknown) => node,
  };
});

// ── Hook mocks ─────────────────────────────────────────────────────────────────
vi.mock("@/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

describe("LuanaSidebar", () => {
  beforeEach(() => {
    mockStore.luanaState = "history";
    mockStore.mobileDrawerOpen = false;
    vi.clearAllMocks();
  });

  it("renders aside with role=complementary (D1 gate)", () => {
    const { container } = render(<LuanaSidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toBeTruthy();
    expect(aside?.getAttribute("role")).toBe("complementary");
  });

  it("renders LuanaRail in history state (compact icon rail)", () => {
    mockStore.luanaState = "history";
    render(<LuanaSidebar />);
    expect(screen.getByTestId("luana-rail")).toBeTruthy();
  });

  it("renders LuanaHistory in full state", () => {
    mockStore.luanaState = "full";
    render(<LuanaSidebar />);
    expect(screen.getByTestId("luana-history")).toBeTruthy();
  });

  it("renders LuanaChat when not collapsed (history state)", () => {
    mockStore.luanaState = "history";
    render(<LuanaSidebar />);
    expect(screen.getByTestId("luana-chat")).toBeTruthy();
  });

  it("does NOT render content when collapsed", () => {
    mockStore.luanaState = "collapsed";
    render(<LuanaSidebar />);
    expect(screen.queryByTestId("luana-rail")).toBeNull();
    expect(screen.queryByTestId("luana-chat")).toBeNull();
  });

  it("mobile drawer is closed by default (D2 scenario)", () => {
    mockStore.mobileDrawerOpen = false;
    render(<LuanaSidebar />);
    expect(screen.queryByTestId("luana-drawer-backdrop")).toBeNull();
  });

  it("has aria-label with 'Luana' branding", () => {
    mockStore.luanaState = "history";
    const { container } = render(<LuanaSidebar />);
    const aside = container.querySelector("aside");
    const ariaLabel = aside?.getAttribute("aria-label") ?? "";
    expect(ariaLabel.toLowerCase()).toContain("luana");
  });
});
