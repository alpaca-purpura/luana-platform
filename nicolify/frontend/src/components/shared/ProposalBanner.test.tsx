// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * ProposalBanner.test.tsx — TDD tests for the ProposalBanner component (RN-3).
 *
 * Covers:
 *   - Banner renders with agent attribution
 *   - "Ratificar" button fires onRatificar
 *   - "Descartar" button fires onDescartar
 *   - isRatificando disables/disables buttons + shows "Guardando…"
 *   - isDescartando disables buttons
 *   - role=status and aria-label for accessibility
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §7 borrador-propuesto + RN-3 (propone/ratifica)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ProposalBanner } from "./ProposalBanner";

const noop = () => undefined;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ProposalBanner — draft ratification gate", () => {
  it("renders with default agentName 'Abel'", () => {
    render(<ProposalBanner onRatificar={noop} onDescartar={noop} />);

    const banner = screen.getByTestId("proposal-banner");
    expect(banner.textContent).toContain("Abel");
  });

  it("renders with custom agentName", () => {
    render(<ProposalBanner onRatificar={noop} onDescartar={noop} agentName="Brenda" />);

    const banner = screen.getByTestId("proposal-banner");
    expect(banner.textContent).toContain("Brenda");
  });

  it("has role=status for screen readers", () => {
    render(<ProposalBanner onRatificar={noop} onDescartar={noop} />);

    const banner = screen.getByRole("status");
    expect(banner).toBeTruthy();
  });

  it("has aria-label mentioning proposal context", () => {
    render(<ProposalBanner onRatificar={noop} onDescartar={noop} />);

    const banner = screen.getByTestId("proposal-banner");
    expect(banner.getAttribute("aria-label")).toContain("propone");
  });

  it("calls onRatificar when Ratificar button clicked", () => {
    const onRatificar = vi.fn();
    render(<ProposalBanner onRatificar={onRatificar} onDescartar={noop} />);

    fireEvent.click(screen.getByTestId("proposal-banner-ratificar"));
    expect(onRatificar).toHaveBeenCalledOnce();
  });

  it("calls onDescartar when Descartar button clicked", () => {
    const onDescartar = vi.fn();
    render(<ProposalBanner onRatificar={noop} onDescartar={onDescartar} />);

    fireEvent.click(screen.getByTestId("proposal-banner-descartar"));
    expect(onDescartar).toHaveBeenCalledOnce();
  });

  it("shows 'Guardando…' and disables buttons when isRatificando=true", () => {
    render(<ProposalBanner onRatificar={noop} onDescartar={noop} isRatificando={true} />);

    const ratificarBtn = screen.getByTestId("proposal-banner-ratificar");
    const descartarBtn = screen.getByTestId("proposal-banner-descartar");

    expect(ratificarBtn.textContent).toContain("Guardando");
    expect(ratificarBtn).toBeDisabled();
    expect(descartarBtn).toBeDisabled();
  });

  it("disables both buttons when isDescartando=true", () => {
    render(<ProposalBanner onRatificar={noop} onDescartar={noop} isDescartando={true} />);

    expect(screen.getByTestId("proposal-banner-ratificar")).toBeDisabled();
    expect(screen.getByTestId("proposal-banner-descartar")).toBeDisabled();
  });

  it("does NOT call onDescartar when Ratificar is clicked", () => {
    const onDescartar = vi.fn();
    render(<ProposalBanner onRatificar={noop} onDescartar={onDescartar} />);

    fireEvent.click(screen.getByTestId("proposal-banner-ratificar"));
    expect(onDescartar).not.toHaveBeenCalled();
  });

  it("does NOT call onRatificar when Descartar is clicked", () => {
    const onRatificar = vi.fn();
    render(<ProposalBanner onRatificar={onRatificar} onDescartar={noop} />);

    fireEvent.click(screen.getByTestId("proposal-banner-descartar"));
    expect(onRatificar).not.toHaveBeenCalled();
  });
});
