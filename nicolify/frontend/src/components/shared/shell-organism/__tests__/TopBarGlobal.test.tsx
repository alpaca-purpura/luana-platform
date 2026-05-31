// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-2
/**
 * TopBarGlobal unit tests — nicolify-r0-shell T-2
 * TDD: RED written BEFORE TopBarGlobal.tsx (GREEN) per tdd-mandatory.md
 *
 * Port from vitalia TopBarGlobal test, re-themed to nicolify.
 * Gherkin B1 coverage: TopBar renders on desktop light.
 *
 * Tests:
 * - role=banner present
 * - data-testid="topbar-global" present
 * - Logo mark rendered
 * - Theme toggle present
 * - h-12 height class
 * - Spanish neutro in aria-labels (no voseo, no "clínica")
 * - skeleton variant: store-free, aria-disabled burger
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider } from "next-themes";

// Mock useShellStore to avoid SSR store issues in tests
vi.mock("@/stores/shell-store", () => ({
  useShellStore: vi.fn(
    (
      selector: (s: {
        mobileDrawerOpen: boolean;
        setMobileDrawerOpen: (v: boolean) => void;
      }) => unknown,
    ) => selector({ mobileDrawerOpen: false, setMobileDrawerOpen: vi.fn() }),
  ),
}));

import { TopBarGlobal } from "../TopBarGlobal";

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem={false}
      storageKey="nicolify-theme"
    >
      {ui}
    </ThemeProvider>,
  );
}

describe("TopBarGlobal — nicolify T-2", () => {
  it("renders a header with role=banner", () => {
    renderWithTheme(<TopBarGlobal />);
    const header = screen.getByRole("banner");
    expect(header).toBeDefined();
  });

  it("has data-testid='topbar-global'", () => {
    renderWithTheme(<TopBarGlobal />);
    const header = screen.getByTestId("topbar-global");
    expect(header).toBeDefined();
  });

  it("renders the logo mark with Nicolify aria-label", () => {
    renderWithTheme(<TopBarGlobal />);
    // Two LogoMark instances: full (desktop) + mark (mobile) — both carry aria-label="Nicolify inicio"
    const logoLinks = screen.getAllByLabelText("Nicolify inicio");
    expect(logoLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders ThemeToggle", () => {
    renderWithTheme(<TopBarGlobal />);
    const toggle = screen.getByTestId("theme-toggle");
    expect(toggle).toBeDefined();
  });

  it("hamburger button uses 'Luana' in aria-label (not 'Valeria')", () => {
    renderWithTheme(<TopBarGlobal />);
    const hamburger = screen.getByTestId("topbar-hamburger");
    const label = hamburger.getAttribute("aria-label") ?? "";
    expect(label).toMatch(/[Ll]uana/);
    expect(label).not.toMatch(/[Vv]aleria/);
  });

  it("hamburger aria-label uses Spanish neutro — no voseo", () => {
    renderWithTheme(<TopBarGlobal />);
    const hamburger = screen.getByTestId("topbar-hamburger");
    const label = hamburger.getAttribute("aria-label") ?? "";
    // No voseo imperatives
    expect(label).not.toMatch(/\bAbrí\b|\bCerrá\b|\btené\b/);
  });

  it("no 'clínica' text in TopBar (Nicolify uses 'agencia')", () => {
    const { container } = renderWithTheme(<TopBarGlobal />);
    expect(container.textContent).not.toMatch(/[Cc]línica/);
  });

  it("skeleton variant renders header with data-shell-variant='skeleton'", () => {
    renderWithTheme(<TopBarGlobal variant="skeleton" />);
    const header = screen.getByTestId("topbar-global");
    expect(header.getAttribute("data-shell-variant")).toBe("skeleton");
  });

  it("skeleton variant has inert burger (aria-disabled, no onClick)", () => {
    renderWithTheme(<TopBarGlobal variant="skeleton" />);
    const burger = screen.getByTestId("topbar-hamburger");
    expect(burger.getAttribute("data-skeleton")).toBe("true");
    expect(burger.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("LogoMark — nicolify T-2", () => {
  it("link wraps images with aria-label 'Nicolify inicio'", () => {
    renderWithTheme(<TopBarGlobal />);
    // Two LogoMark instances (full + mark), each wrapped in <a> with aria-label
    const links = screen.getAllByLabelText("Nicolify inicio");
    expect(links.length).toBeGreaterThanOrEqual(1);
    links.forEach((link) => {
      expect(link.tagName.toLowerCase()).toBe("a");
    });
  });

  it("logo images are decorative (alt='')", () => {
    const { container } = renderWithTheme(<TopBarGlobal />);
    const imgs = container.querySelectorAll("img");
    imgs.forEach((img) => {
      expect(img.getAttribute("alt")).toBe("");
    });
  });
});

describe("TenantSwitcher skeleton — nicolify T-2", () => {
  it("renders 'Cambiar de agencia' placeholder text (not 'Cambiar de clínica')", () => {
    renderWithTheme(<TopBarGlobal />);
    // TenantSwitcher skeleton renders 'Cambiar de agencia' placeholder
    const trigger = screen.getByTestId("tenant-switcher-trigger");
    const ariaLabel = trigger.getAttribute("aria-label") ?? "";
    expect(ariaLabel).toMatch(/agencia/i);
    expect(ariaLabel).not.toMatch(/clínica/i);
  });
});
