/**
 * no-store-in-ssr-skeleton.test.tsx — Architecture guard: skeleton must NOT subscribe useShellStore.
 * vitalia-shell-state-persistence T-2 · ADR-vitalia-006 · D4 (skeleton store-free)
 *
 * ROOT CAUSE guarded:
 * ShellOrganismLayoutSkeleton (rendered outside dynamic({ssr:false}) boundary) previously
 * rendered <TopBarGlobal/> which subscribes useShellStore. This caused the persist
 * middleware to evaluate in SSR/pre-hydration context, writing the default value to
 * localStorage and clobbering user preferences on every reload (Bug #1 PROD REAL).
 *
 * WHAT THIS TEST ENSURES:
 * 1. TopBarGlobal variant="skeleton" does NOT call/subscribe useShellStore.
 *    Assertion: render with store selector spy → spy NOT called during skeleton render.
 * 2. TopBarGlobal variant="skeleton" renders visible header markup (a11y F1-S2 preserved).
 * 3. TopBarGlobal variant="skeleton" renders an inert burger (no onClick that needs store).
 * 4. TopBarGlobal default (interactive) still accesses the store (regression guard).
 *
 * TDD order per 04-validators.yaml § creation_order (T-2):
 *   1. Write this test (RED — fails because TopBarGlobal variant prop doesn't exist yet).
 *   2. Implement TopBarGlobal variant + skeleton wiring + ShellOrganismLayoutClient rehydrate.
 *   3. Run test again (GREEN).
 *
 * downstream-regression-na: brand-local shell-organism architecture guard; no cross-brand consumers
 * HIPAA-lite: no-phi-scope — UI shell chrome test, no PHI.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { TopBarGlobalProps } from "../TopBarGlobal";

// ─── Mock navigation and child components ─────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("../TenantSwitcher", () => ({
  TenantSwitcher: () => (
    <div data-testid="tenant-switcher-mock">TenantSwitcher</div>
  ),
}));

// ─── Mock useShellStore with a spy tracking calls ──────────────────────────────
// Use vi.hoisted to create the spy before vi.mock hoisting occurs.
// This allows the mock factory to reference the spy safely.
// T-2 (vitalia-shell-core-hardening): setValeriaState/setShellMode removed from the
// store (new machine closed|chat; shellMode eliminated AC-1). The skeleton guard only
// cares that useShellStore is NOT called — the concrete setter set is irrelevant here.
const { useShellStoreSpy, mockSetMobileDrawerOpen } = vi.hoisted(() => {
  const mockSetMobileDrawerOpen = vi.fn();
  const useShellStoreSpy = vi.fn().mockImplementation(
    (selector: (s: unknown) => unknown) => {
      const store = {
        mobileDrawerOpen: false,
        setMobileDrawerOpen: mockSetMobileDrawerOpen,
      };
      return selector ? selector(store) : store;
    }
  );
  return { useShellStoreSpy, mockSetMobileDrawerOpen };
});

vi.mock("@/stores/shell-store", () => ({
  useShellStore: useShellStoreSpy,
  SHELL_STORAGE_KEY: "vitalia-shell-state",
}));

// Import after mocks are set up
import { TopBarGlobal } from "../TopBarGlobal";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("TopBarGlobal variant='skeleton' — store-free (D4 arch guard)", () => {
  beforeEach(() => {
    useShellStoreSpy.mockClear();
    mockSetMobileDrawerOpen.mockClear();
  });

  it("[ARCH GUARD] variant='skeleton' does NOT call useShellStore (no subscription, no selector)", () => {
    // Act: render skeleton variant
    render(<TopBarGlobal variant="skeleton" />);

    // Assert: the store hook was NEVER called during skeleton render.
    // If TopBarGlobal calls useShellStore in skeleton mode → spy would have been called → FAIL
    expect(useShellStoreSpy).not.toHaveBeenCalled();
  });

  it("[ARCH GUARD] variant='skeleton' renders visible header element (a11y F1-S2 preserved)", () => {
    const { container } = render(<TopBarGlobal variant="skeleton" />);

    // The skeleton TopBarGlobal must render a <header> so the TopBar is visible
    // in the SSR skeleton (layout shift prevention + a11y skip-link context)
    const header = container.querySelector("header");
    expect(header).not.toBeNull();

    // Still must have the data-testid so E2E can assert skeleton is visible
    expect(header).toHaveAttribute("data-testid", "topbar-global");

    // Store still not called
    expect(useShellStoreSpy).not.toHaveBeenCalled();
  });

  it("[ARCH GUARD] variant='skeleton' renders inert burger placeholder (md:hidden, no store click handler)", () => {
    const { container } = render(<TopBarGlobal variant="skeleton" />);

    // The burger button must be present as a visual placeholder (layout continuity)
    const burger = container.querySelector('[data-testid="topbar-hamburger"]');
    expect(burger).not.toBeNull();

    // No store calls from skeleton render
    expect(useShellStoreSpy).not.toHaveBeenCalled();
  });

  it("[ARCH GUARD] variant='skeleton' accepts the prop without runtime errors (TypeScript contract)", () => {
    // TopBarGlobal must accept the variant prop without errors
    const props: TopBarGlobalProps = { variant: "skeleton" };
    expect(() => {
      render(<TopBarGlobal {...props} />);
    }).not.toThrow();

    // Store still not called
    expect(useShellStoreSpy).not.toHaveBeenCalled();
  });
});

describe("TopBarGlobal variant='interactive' (default) — store access preserved (regression guard)", () => {
  beforeEach(() => {
    useShellStoreSpy.mockClear();
    mockSetMobileDrawerOpen.mockClear();
  });

  it("[REGRESSION] default variant (no prop) still accesses useShellStore (store subscription preserved)", () => {
    // The interactive (default) TopBarGlobal MUST still subscribe the store.
    // Regression guard: verify we didn't accidentally break the interactive path.
    render(<TopBarGlobal />);

    // Store was accessed — verifies interactive variant still uses the store
    expect(useShellStoreSpy).toHaveBeenCalled();
  });

  it("[REGRESSION] variant='interactive' explicit still accesses useShellStore", () => {
    render(<TopBarGlobal variant="interactive" />);
    expect(useShellStoreSpy).toHaveBeenCalled();
  });
});
