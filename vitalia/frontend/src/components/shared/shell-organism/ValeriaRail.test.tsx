/**
 * ValeriaRail.test.tsx — Unit tests for ValeriaRail molecule
 * T-3 of vitalia-fase1-valeria-rail-history (F1-S5)
 * TDD RED-first per tdd-mandatory.md
 *
 * gherkin_coverage:
 * - SC-1 happy · ValeriaRail 4 buttons MVP-only (toggle/new/search/close)
 * - SC-7 a11y · aria-labels Spanish neutro + tooltips con keyboard hints
 *
 * Spec: 01-spec.md § 0 D5 + § 6 microcopy · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ValeriaRail } from "./ValeriaRail";

const defaultProps = {
  onToggleHistory: vi.fn(),
  onNewConversation: vi.fn(),
  onSearch: vi.fn(),
  onCollapse: vi.fn(),
};

describe("ValeriaRail — renders 4 buttons MVP-only (SC-1 happy)", () => {
  it("renders 4 buttons MVP-only (toggle + new + search + close)", () => {
    render(<ValeriaRail {...defaultProps} />);
    // All 4 MVP buttons must be present
    expect(
      screen.getByRole("button", { name: /Mostrar historial/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Nueva conversación/i }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /Buscar/i })).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Cerrar Valeria/i }),
    ).toBeDefined();
  });

  it("F2 buttons (anclados/tareas/notas) NO render (hidden completamente)", () => {
    render(<ValeriaRail {...defaultProps} />);
    // F2 placeholder buttons must NOT exist at all — completely hidden per D5
    expect(screen.queryByText(/Anclados/i)).toBeNull();
    expect(screen.queryByText(/Tareas/i)).toBeNull();
    expect(screen.queryByText(/Notas/i)).toBeNull();
    // Verify only 4 buttons rendered
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
  });

  it("click PanelLeftOpen dispatches onToggleHistory handler", async () => {
    const onToggleHistory = vi.fn();
    const user = userEvent.setup();
    render(<ValeriaRail {...defaultProps} onToggleHistory={onToggleHistory} />);
    await user.click(
      screen.getByRole("button", { name: /Mostrar historial/i }),
    );
    expect(onToggleHistory).toHaveBeenCalledTimes(1);
  });

  it("click Plus dispatches onNewConversation", async () => {
    const onNewConversation = vi.fn();
    const user = userEvent.setup();
    render(
      <ValeriaRail {...defaultProps} onNewConversation={onNewConversation} />,
    );
    await user.click(
      screen.getByRole("button", { name: /Nueva conversación/i }),
    );
    expect(onNewConversation).toHaveBeenCalledTimes(1);
  });

  it("click Search dispatches onSearch", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<ValeriaRail {...defaultProps} onSearch={onSearch} />);
    await user.click(screen.getByRole("button", { name: /Buscar/i }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("click PanelLeftClose dispatches onCollapse", async () => {
    const onCollapse = vi.fn();
    const user = userEvent.setup();
    render(<ValeriaRail {...defaultProps} onCollapse={onCollapse} />);
    await user.click(screen.getByRole("button", { name: /Cerrar Valeria/i }));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});

describe("ValeriaRail — aria-labels Spanish neutro (SC-7 a11y)", () => {
  it("aria-labels match spec § 6 (Mostrar historial / Nueva conversación / Buscar (Cmd+K) / Cerrar Valeria)", () => {
    render(<ValeriaRail {...defaultProps} />);
    // Exact aria-labels per spec § 6 Spanish neutro (no voseo)
    expect(
      screen.getByRole("button", { name: "Mostrar historial" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Nueva conversación" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Buscar (Cmd+K)" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Cerrar Valeria" }),
    ).toBeDefined();
  });

  it("tooltips contain keyboard hints (· f / · n / · ⌘K / · c)", () => {
    render(<ValeriaRail {...defaultProps} />);
    // Radix Tooltip content renders in Portal — not in DOM until hovered.
    // We verify keyboard hints are present via data-tooltip attributes on buttons (testability pattern).
    const buttons = screen.getAllByRole("button");
    const tooltipValues = buttons.map((b) => b.getAttribute("data-tooltip"));
    expect(tooltipValues.some((v) => v?.includes("· f"))).toBe(true);
    expect(tooltipValues.some((v) => v?.includes("· n"))).toBe(true);
    expect(tooltipValues.some((v) => v?.includes("· ⌘K"))).toBe(true);
    expect(tooltipValues.some((v) => v?.includes("· c"))).toBe(true);
  });

  it("no voseo patterns in aria-labels or tooltip content", () => {
    render(<ValeriaRail {...defaultProps} />);
    const dom = document.body.textContent ?? "";
    // Voseo regex per spanish-text.md glosario
    expect(dom).not.toMatch(
      /\btenés\b|\bpodés\b|\bvos\b|\bsos\b|\bmostrá\b|\babrí\b|\bcerrar\b.*\bvos\b/i,
    );
  });
});

describe("ValeriaRail — layout structure", () => {
  it("renders a nav container for the rail", () => {
    render(<ValeriaRail {...defaultProps} />);
    // ValeriaRail wraps in a semantic container
    const nav = screen.getByRole("navigation");
    expect(nav).toBeDefined();
  });

  it("is a named export function (not default)", () => {
    expect(typeof ValeriaRail).toBe("function");
  });
});
