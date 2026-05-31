// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-1
/**
 * ThemeToggle unit tests — nicolify-r0-shell T-1
 * TDD: RED written BEFORE ThemeToggle.tsx (GREEN) per tdd-mandatory.md
 *
 * Port from vitalia ThemeToggle.test.tsx, re-themed to nicolify.
 * Gherkin B2 coverage: theme toggle light↔dark applies to full shell.
 *
 * Spanish neutro: tuteo, no voseo in aria-labels.
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { describe, it, expect } from "vitest";

import { ThemeToggle } from "../ThemeToggle";

function renderWithProvider(defaultTheme: "light" | "dark") {
  return render(
    <ThemeProvider
      attribute="data-theme"
      defaultTheme={defaultTheme}
      enableSystem={false}
      storageKey="nicolify-theme"
    >
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle — nicolify (port from vitalia T-1)", () => {
  it("renders a button with data-testid='theme-toggle'", () => {
    renderWithProvider("light");
    const button = screen.getByTestId("theme-toggle");
    expect(button).toBeDefined();
    expect(button.tagName.toLowerCase()).toBe("button");
  });

  it("renders with Moon icon when theme is light (default)", () => {
    renderWithProvider("light");
    const button = screen.getByTestId("theme-toggle");
    expect(button.getAttribute("aria-label")).toMatch(/claro/i);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("renders with Sun icon when theme is dark", async () => {
    renderWithProvider("dark");
    const button = screen.getByTestId("theme-toggle");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(button.getAttribute("aria-label")).toMatch(/oscuro/i);
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("aria-label uses Spanish neutro tuteo (no voseo)", () => {
    renderWithProvider("light");
    const button = screen.getByTestId("theme-toggle");
    const label = button.getAttribute("aria-label") ?? "";
    // Must be 'Cambiar tema (actual: claro)' or '...oscuro)'
    expect(label).toMatch(/^Cambiar tema \(actual: (claro|oscuro)\)$/);
    // No voseo
    expect(label).not.toMatch(/\bvos\b|\btenés\b|\bpodés\b/);
  });

  it("toggles theme on click (light → aria-pressed changes)", async () => {
    renderWithProvider("light");
    const button = screen.getByTestId("theme-toggle");
    expect(button.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("has accessible name via aria-label", () => {
    renderWithProvider("light");
    const button = screen.getByTestId("theme-toggle");
    const label = button.getAttribute("aria-label");
    expect(label).toBeTruthy();
    expect(label).not.toBe("");
  });

  it("has sr-only span for additional screen reader context", () => {
    renderWithProvider("light");
    const srOnly = screen.getByText("Cambiar tema");
    expect(srOnly.className).toContain("sr-only");
  });
});
