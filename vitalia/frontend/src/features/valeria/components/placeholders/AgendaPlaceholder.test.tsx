/**
 * AgendaPlaceholder.test.tsx — Vitest unit tests (TDD RED→GREEN).
 *
 * F1-S10 vitalia-fase1-empty-states — T-7
 * spec_anchor: 06-tickets.yaml T-7 val-fe-vitest-unit-agenda-placeholder
 *
 * Tests:
 *   - renders 6 day headers (Lun 26, Mar 27, Mié 28, Jue 29, Vie 30, Sáb 31)
 *   - today (Lun 26) header has data-testid="agenda-day-header-26"
 *   - renders 10 mock patient slots verbatim from mockup
 *   - renders footer summary "propuso 4 turnos hoy · 3 sin pago"
 *   - renders footer Lucas text "3 leads listos"
 *   - renders heading "Agenda"
 *   - renders time slot labels
 *   - renders lunch stripe row
 *   - toolbar present
 *   - filters row present
 *
 * downstream-regression-na: brand-local placeholder; no cross-brand consumers
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgendaPlaceholder } from "./AgendaPlaceholder";

describe("AgendaPlaceholder", () => {
  it("renders heading 'Agenda'", () => {
    render(<AgendaPlaceholder />);
    expect(
      screen.getByRole("heading", { level: 2, name: /Agenda/ }),
    ).toBeInTheDocument();
  });

  it("renders 6 day header columns", () => {
    render(<AgendaPlaceholder />);
    expect(screen.getByTestId("agenda-day-header-26")).toBeInTheDocument();
    expect(screen.getByTestId("agenda-day-header-27")).toBeInTheDocument();
    expect(screen.getByTestId("agenda-day-header-28")).toBeInTheDocument();
    expect(screen.getByTestId("agenda-day-header-29")).toBeInTheDocument();
    expect(screen.getByTestId("agenda-day-header-30")).toBeInTheDocument();
    expect(screen.getByTestId("agenda-day-header-31")).toBeInTheDocument();
  });

  it("renders day labels Lun/Mar/Mié/Jue/Vie/Sáb", () => {
    render(<AgendaPlaceholder />);
    expect(screen.getByText("Lun")).toBeInTheDocument();
    expect(screen.getByText("Mar")).toBeInTheDocument();
    expect(screen.getByText("Mié")).toBeInTheDocument();
    expect(screen.getByText("Jue")).toBeInTheDocument();
    expect(screen.getByText("Vie")).toBeInTheDocument();
    expect(screen.getByText("Sáb")).toBeInTheDocument();
  });

  it("renders all 10 mock patient names from spec verbatim", () => {
    render(<AgendaPlaceholder />);
    expect(screen.getByText("M. Rodríguez")).toBeInTheDocument();
    expect(screen.getByText("S. López")).toBeInTheDocument();
    expect(screen.getByText("L. Vega")).toBeInTheDocument();
    expect(screen.getByText("J. Pérez")).toBeInTheDocument();
    expect(screen.getByText("A. Ruiz")).toBeInTheDocument();
    expect(screen.getByText("P. Sosa")).toBeInTheDocument();
    expect(screen.getByText("M. Díaz")).toBeInTheDocument();
    expect(screen.getByText("R. Cruz")).toBeInTheDocument();
    expect(screen.getByText("C. Núñez")).toBeInTheDocument();
    expect(screen.getByText("Sofía B.")).toBeInTheDocument();
  });

  it("renders 10 agenda slot blocks", () => {
    render(<AgendaPlaceholder />);
    const slots = screen.getAllByTestId("agenda-slot");
    expect(slots).toHaveLength(10);
  });

  it("renders footer summary text with Adrián proposal count", () => {
    render(<AgendaPlaceholder />);
    const summaryText = screen.getByTestId("agenda-summary-text");
    expect(summaryText.textContent).toContain("propuso 4 turnos hoy");
    expect(summaryText.textContent).toContain("3 sin pago");
  });

  it("renders footer Lucas leads count", () => {
    render(<AgendaPlaceholder />);
    const summaryText = screen.getByTestId("agenda-summary-text");
    expect(summaryText.textContent).toContain("3 leads listos");
  });

  it("renders toolbar with week label", () => {
    render(<AgendaPlaceholder />);
    expect(screen.getByTestId("agenda-toolbar")).toBeInTheDocument();
    expect(screen.getByText("Semana 26-31 May 2026")).toBeInTheDocument();
  });

  it("renders filters row", () => {
    render(<AgendaPlaceholder />);
    expect(screen.getByTestId("agenda-filters")).toBeInTheDocument();
  });

  it("renders time slot labels starting at 08:00", () => {
    render(<AgendaPlaceholder />);
    expect(screen.getByLabelText("Hora 08:00")).toBeInTheDocument();
    expect(screen.getByLabelText("Hora 09:00")).toBeInTheDocument();
    expect(screen.getByLabelText("Hora 14:00")).toBeInTheDocument();
  });

  it("renders agenda summary footer", () => {
    render(<AgendaPlaceholder />);
    expect(screen.getByTestId("agenda-summary-footer")).toBeInTheDocument();
  });

  it("renders the grid element", () => {
    render(<AgendaPlaceholder />);
    expect(screen.getByTestId("agenda-grid")).toBeInTheDocument();
  });

  it("renders C. Núñez slot with noshow status", () => {
    render(<AgendaPlaceholder />);
    // C. Núñez has noshow status
    const noshowPills = screen.getAllByTestId("slot-pill-noshow");
    expect(noshowPills).toHaveLength(1);
  });

  it("does not contain voseo in user-facing text", () => {
    // voseo-allowed: regex tests for absence of voseo in rendered output (technical fixture, not user-facing string)
    const { container } = render(<AgendaPlaceholder />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/tenés|podés|hacés|dejá|mirá|sos\b/i);
  });
});
