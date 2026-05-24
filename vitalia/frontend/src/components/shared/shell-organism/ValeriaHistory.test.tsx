/**
 * ValeriaHistory.test.tsx — Unit tests for ValeriaHistory molecule
 * T-4 of vitalia-fase1-valeria-rail-history (F1-S5)
 * TDD RED-first per tdd-mandatory.md
 *
 * gherkin_coverage:
 * - SC-1 happy · history visible con 8 mock items grouped 3+2+3
 * - SC-6 empty_state · búsqueda sin resultados
 * - SC-9 i18n · header + group labels + search placeholder verbatim
 * - (integration) HistoryItem click activa con bg-agent-valeria-soft
 *
 * Spec: 01-spec.md § 3 ValeriaHistory estados + § 5 data flow filter logic + § 6 microcopy
 * Arch: 03-arch.md § 2.5 ValeriaHistory
 * Named export (NO default) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ValeriaHistory } from "./ValeriaHistory";

// ─── Helper props ───────────────────────────────────────────────────────────

const defaultProps = {
  onNewConversation: vi.fn(),
  onCollapseToRail: vi.fn(),
};

// ─── SC-1 happy · header + 8 mock items grouped 3+2+3 ───────────────────────

describe("ValeriaHistory — renders header + grouped items (SC-1 happy)", () => {
  it("renders header 'Conversaciones' + quick actions (Plus + PanelLeftClose)", () => {
    render(<ValeriaHistory {...defaultProps} />);
    expect(screen.getByText("Conversaciones")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Nueva conversación/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Colapsar a barra/i }),
    ).toBeDefined();
  });

  it("renders 8 mock items grouped Hoy(3)+Ayer(2)+Esta semana(3)", () => {
    render(<ValeriaHistory {...defaultProps} />);
    const items = screen.getAllByTestId("history-item");
    expect(items).toHaveLength(8);
  });

  it("group labels en Spanish neutro (Hoy / Ayer / Esta semana)", () => {
    render(<ValeriaHistory {...defaultProps} />);
    expect(screen.getByText("Hoy")).toBeDefined();
    expect(screen.getByText("Ayer")).toBeDefined();
    expect(screen.getByText("Esta semana")).toBeDefined();
  });
});

// ─── SC-6 empty_state · búsqueda sin resultados ──────────────────────────────

describe("ValeriaHistory — search filter logic (SC-6 empty state)", () => {
  it("input search updates searchQuery on change", async () => {
    const user = userEvent.setup();
    render(<ValeriaHistory {...defaultProps} />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "reseñas");
    expect((input as HTMLInputElement).value).toBe("reseñas");
  });

  it("filter case-insensitive (match 'reseñas' returns Hoy item 1)", async () => {
    const user = userEvent.setup();
    render(<ValeriaHistory {...defaultProps} />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "reseñas");
    // Only 1 item matches "reseñas" (item 1 - "Resumen reseñas Google semana")
    const items = screen.getAllByTestId("history-item");
    expect(items).toHaveLength(1);
    expect(screen.getByText("Resumen reseñas Google semana")).toBeDefined();
  });

  it("filter trim whitespace ('  reseñas  ' equals 'reseñas')", async () => {
    const user = userEvent.setup();
    render(<ValeriaHistory {...defaultProps} />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "  reseñas  ");
    const items = screen.getAllByTestId("history-item");
    expect(items).toHaveLength(1);
  });

  it("empty state shows EmptyStateInline when 0 matches", async () => {
    const user = userEvent.setup();
    render(<ValeriaHistory {...defaultProps} />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "xyzabc");
    expect(screen.getByTestId("history-empty-state")).toBeDefined();
    expect(screen.queryAllByTestId("history-item")).toHaveLength(0);
  });

  it("groups con 0 items NO renderizan label (Hoy/Ayer/Esta semana hidden cuando filter scopes a 0)", async () => {
    const user = userEvent.setup();
    render(<ValeriaHistory {...defaultProps} />);
    const input = screen.getByRole("searchbox");
    // "reseñas" only matches item 1 (group: today) — ayer + this_week should hide
    await user.type(input, "reseñas");
    expect(screen.getByText("Hoy")).toBeDefined();
    expect(screen.queryByText("Ayer")).toBeNull();
    expect(screen.queryByText("Esta semana")).toBeNull();
  });

  it("EmptyStateInline copy: 'Sin resultados' + 'Intenta con otra palabra' (Spanish neutro)", async () => {
    const user = userEvent.setup();
    render(<ValeriaHistory {...defaultProps} />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "xyzabc");
    expect(screen.getByText("Sin resultados")).toBeDefined();
    expect(screen.getByText("Intenta con otra palabra")).toBeDefined();
  });

  it("Press Escape en search con query → setSearchQuery('') NO colapsa Valeria (stopPropagation)", async () => {
    const onCollapseToRail = vi.fn();
    const user = userEvent.setup();
    render(
      <ValeriaHistory
        onNewConversation={vi.fn()}
        onCollapseToRail={onCollapseToRail}
      />,
    );
    const input = screen.getByRole("searchbox");
    await user.type(input, "algo");
    expect((input as HTMLInputElement).value).toBe("algo");
    // Press Escape with query → clears query, does NOT propagate to parent
    await user.keyboard("{Escape}");
    expect((input as HTMLInputElement).value).toBe("");
    // onCollapseToRail should NOT have been called
    expect(onCollapseToRail).not.toHaveBeenCalled();
    // Items restored after clear
    const items = screen.getAllByTestId("history-item");
    expect(items).toHaveLength(8);
  });
});

// ─── SC-9 i18n · aria-labels + placeholder verbatim ─────────────────────────

describe("ValeriaHistory — i18n Spanish neutro (SC-9)", () => {
  it("search input placeholder 'Buscar conversación...'", () => {
    render(<ValeriaHistory {...defaultProps} />);
    const input = screen.getByPlaceholderText("Buscar conversación...");
    expect(input).toBeDefined();
  });

  it("search input aria-label 'Buscar conversación'", () => {
    render(<ValeriaHistory {...defaultProps} />);
    const input = screen.getByRole("searchbox", {
      name: "Buscar conversación",
    });
    expect(input).toBeDefined();
  });

  it("nav aria-label 'Historial conversaciones'", () => {
    render(<ValeriaHistory {...defaultProps} />);
    const nav = screen.getByRole("navigation", {
      name: "Historial conversaciones",
    });
    expect(nav).toBeDefined();
  });
});

// ─── Integration · HistoryItem click → active state ─────────────────────────

describe("ValeriaHistory — HistoryItem active state (integration)", () => {
  it("click HistoryItem updates active state local", async () => {
    const user = userEvent.setup();
    render(<ValeriaHistory {...defaultProps} />);
    const items = screen.getAllByTestId("history-item");
    // Click the second item
    await user.click(items[1]);
    // It should become active (aria-current="true")
    expect(items[1].getAttribute("aria-current")).toBe("true");
  });

  it("active item has aria-current='true' + className includes 'bg-agent-valeria-soft'", () => {
    render(<ValeriaHistory {...defaultProps} />);
    const items = screen.getAllByTestId("history-item");
    // Initially item[0] is active (id='1' default)
    expect(items[0].getAttribute("aria-current")).toBe("true");
    expect(items[0].className).toContain("bg-agent-valeria-soft");
  });

  it("only one active item at a time", async () => {
    const user = userEvent.setup();
    render(<ValeriaHistory {...defaultProps} />);
    const items = screen.getAllByTestId("history-item");
    // Click item[2]
    await user.click(items[2]);
    // Only item[2] should have aria-current="true"
    const activeItems = items.filter(
      (item) => item.getAttribute("aria-current") === "true",
    );
    expect(activeItems).toHaveLength(1);
    expect(activeItems[0]).toBe(items[2]);
  });

  it("onNewConversation callback dispatched al click Plus", async () => {
    const onNewConversation = vi.fn();
    const user = userEvent.setup();
    render(
      <ValeriaHistory
        onNewConversation={onNewConversation}
        onCollapseToRail={vi.fn()}
      />,
    );
    const plusBtn = screen.getByRole("button", { name: /Nueva conversación/i });
    await user.click(plusBtn);
    expect(onNewConversation).toHaveBeenCalledTimes(1);
  });

  it("onCollapseToRail callback dispatched al click ChevronLeft", async () => {
    const onCollapseToRail = vi.fn();
    const user = userEvent.setup();
    render(
      <ValeriaHistory
        onNewConversation={vi.fn()}
        onCollapseToRail={onCollapseToRail}
      />,
    );
    const collapseBtn = screen.getByRole("button", {
      name: /Colapsar a barra/i,
    });
    await user.click(collapseBtn);
    expect(onCollapseToRail).toHaveBeenCalledTimes(1);
  });
});
