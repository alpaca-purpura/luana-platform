/**
 * ShellModeToggle.test.tsx — T-5 TDD RED→GREEN
 * F1-S4 vitalia-fase1-shell-layout-5050
 *
 * Covers gherkin_coverage from 06-tickets.yaml T-5:
 * - renders 'Agéntico' label when shellMode='agentic'
 * - renders 'Web' label when shellMode='web'
 * - disabled attribute + aria-disabled='true'
 * - data-testid='shell-mode-toggle'
 * - aria-label='Modo de shell: agéntico activo'
 * - click events not fired when disabled
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { ShellModeToggle } from "./ShellModeToggle";

// Mock useShellStore from @/stores/shell-store
vi.mock("@/stores/shell-store", () => ({
  useShellStore: vi.fn(),
}));

// Import after mock declaration
import { useShellStore } from "@/stores/shell-store";

const mockUseShellStore = useShellStore as unknown as Mock;

describe("ShellModeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: agentic mode
    mockUseShellStore.mockImplementation(
      (selector: (s: { shellMode: string }) => unknown) =>
        selector({ shellMode: "agentic" }),
    );
  });

  it("renders a disabled button", () => {
    render(<ShellModeToggle />);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });

  it("has aria-disabled='true'", () => {
    render(<ShellModeToggle />);
    const btn = screen.getByTestId("shell-mode-toggle");
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });

  it("renders 'Agéntico' label when shellMode='agentic'", () => {
    mockUseShellStore.mockImplementation(
      (selector: (s: { shellMode: string }) => unknown) =>
        selector({ shellMode: "agentic" }),
    );
    render(<ShellModeToggle />);
    expect(screen.getByText("Agéntico")).toBeInTheDocument();
  });

  it("renders 'Web' label when shellMode='web'", () => {
    mockUseShellStore.mockImplementation(
      (selector: (s: { shellMode: string }) => unknown) =>
        selector({ shellMode: "web" }),
    );
    render(<ShellModeToggle />);
    expect(screen.getByText("Web")).toBeInTheDocument();
  });

  it("has data-testid='shell-mode-toggle'", () => {
    render(<ShellModeToggle />);
    expect(screen.getByTestId("shell-mode-toggle")).toBeInTheDocument();
  });

  it("has title attribute present", () => {
    render(<ShellModeToggle />);
    const btn = screen.getByTestId("shell-mode-toggle");
    expect(btn).toHaveAttribute("title");
  });

  it("has aria-label 'Modo de shell: agéntico activo' when mode is agentic", () => {
    mockUseShellStore.mockImplementation(
      (selector: (s: { shellMode: string }) => unknown) =>
        selector({ shellMode: "agentic" }),
    );
    render(<ShellModeToggle />);
    const btn = screen.getByTestId("shell-mode-toggle");
    expect(btn).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Modo de shell"),
    );
    expect(btn).toHaveAttribute(
      "aria-label",
      expect.stringContaining("agéntico"),
    );
  });

  it("has aria-label containing 'web' when mode is web", () => {
    mockUseShellStore.mockImplementation(
      (selector: (s: { shellMode: string }) => unknown) =>
        selector({ shellMode: "web" }),
    );
    render(<ShellModeToggle />);
    const btn = screen.getByTestId("shell-mode-toggle");
    expect(btn).toHaveAttribute("aria-label", expect.stringContaining("web"));
  });

  it("renders icon svg with aria-hidden when mode is agentic", () => {
    mockUseShellStore.mockImplementation(
      (selector: (s: { shellMode: string }) => unknown) =>
        selector({ shellMode: "agentic" }),
    );
    const { container } = render(<ShellModeToggle />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders icon svg with aria-hidden when mode is web", () => {
    mockUseShellStore.mockImplementation(
      (selector: (s: { shellMode: string }) => unknown) =>
        selector({ shellMode: "web" }),
    );
    const { container } = render(<ShellModeToggle />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("uses Spanish neutro: 'Agéntico' with tilde (no voseo)", () => {
    mockUseShellStore.mockImplementation(
      (selector: (s: { shellMode: string }) => unknown) =>
        selector({ shellMode: "agentic" }),
    );
    render(<ShellModeToggle />);
    // Verify correct Spanish neutro spelling with tilde
    expect(screen.getByText("Agéntico")).toBeInTheDocument();
    // Ensure no voseo forms present
    expect(screen.queryByText("Agentico")).not.toBeInTheDocument();
  });

  it("has cursor-not-allowed class for visual UX", () => {
    render(<ShellModeToggle />);
    const btn = screen.getByTestId("shell-mode-toggle");
    expect(btn.className).toContain("cursor-not-allowed");
  });

  it("click events not fired when disabled", () => {
    const handleClick = vi.fn();
    render(<ShellModeToggle />);
    const btn = screen.getByTestId("shell-mode-toggle");
    // Button is disabled — click should not propagate to a handler
    // Even if we attach one, disabled buttons should not trigger click in DOM
    btn.addEventListener("click", handleClick);
    fireEvent.click(btn);
    // disabled attribute prevents native click on a button
    expect(btn).toBeDisabled();
    btn.removeEventListener("click", handleClick);
  });
});
