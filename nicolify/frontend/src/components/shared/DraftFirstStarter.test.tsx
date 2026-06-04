// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * DraftFirstStarter.test.tsx — TDD tests for the 2-path empty state component.
 *
 * Covers:
 *   - Renders both CTAs (Path A + Path B)
 *   - Path A "Abel te arma un borrador" calls onGenerateDraft
 *   - Path B "Empezar en blanco" calls onStartBlank
 *   - agentName prop customizes copy
 *   - Main region has accessible label
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §7 arranque + SC-empty
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { DraftFirstStarter } from "./DraftFirstStarter";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DraftFirstStarter — 2-camino starter", () => {
  it("renders both action buttons", () => {
    render(
      <DraftFirstStarter
        onGenerateDraft={vi.fn()}
        onStartBlank={vi.fn()}
      />,
    );

    expect(screen.getByTestId("draft-first-generate-btn")).toBeTruthy();
    expect(screen.getByTestId("draft-first-blank-btn")).toBeTruthy();
  });

  it("calls onGenerateDraft when Path A button clicked", () => {
    const onGenerateDraft = vi.fn();
    render(
      <DraftFirstStarter
        onGenerateDraft={onGenerateDraft}
        onStartBlank={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("draft-first-generate-btn"));
    expect(onGenerateDraft).toHaveBeenCalledOnce();
  });

  it("calls onStartBlank when Path B button clicked", () => {
    const onStartBlank = vi.fn();
    render(
      <DraftFirstStarter
        onGenerateDraft={vi.fn()}
        onStartBlank={onStartBlank}
      />,
    );

    fireEvent.click(screen.getByTestId("draft-first-blank-btn"));
    expect(onStartBlank).toHaveBeenCalledOnce();
  });

  it("uses default agent name 'Abel' in copy", () => {
    render(
      <DraftFirstStarter
        onGenerateDraft={vi.fn()}
        onStartBlank={vi.fn()}
      />,
    );

    const generateBtn = screen.getByTestId("draft-first-generate-btn");
    expect(generateBtn.textContent).toContain("Abel");
  });

  it("respects agentName prop", () => {
    render(
      <DraftFirstStarter
        onGenerateDraft={vi.fn()}
        onStartBlank={vi.fn()}
        agentName="TestAgent"
      />,
    );

    const generateBtn = screen.getByTestId("draft-first-generate-btn");
    expect(generateBtn.textContent).toContain("TestAgent");
  });

  it("has accessible main region label", () => {
    render(
      <DraftFirstStarter
        onGenerateDraft={vi.fn()}
        onStartBlank={vi.fn()}
      />,
    );

    const main = screen.getByRole("main");
    expect(main.getAttribute("aria-label")).toContain("cliente ideal");
  });

  it("renders the paths container with testid", () => {
    render(
      <DraftFirstStarter
        onGenerateDraft={vi.fn()}
        onStartBlank={vi.fn()}
      />,
    );

    expect(screen.getByTestId("draft-first-paths")).toBeTruthy();
  });

  it("does NOT call onStartBlank when generate button is clicked", () => {
    const onStartBlank = vi.fn();
    render(
      <DraftFirstStarter
        onGenerateDraft={vi.fn()}
        onStartBlank={onStartBlank}
      />,
    );

    fireEvent.click(screen.getByTestId("draft-first-generate-btn"));
    expect(onStartBlank).not.toHaveBeenCalled();
  });
});
