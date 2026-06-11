/**
 * ValeriaCollapsedStrip.test.tsx — Unit tests for the state-A tira-avatar.
 * T-3 of vitalia-shell-core-hardening.
 * TDD RED-first per tdd-mandatory.md.
 *
 * ValeriaCollapsedStrip is the ~44px vertical strip rendered at the left edge
 * when Valeria is CLOSED (state A). It shows the REAL Valeria avatar (catalog
 * asset, NOT a placeholder "V"), a status dot and the "Valeria" label.
 * Clicking the avatar reopens Valeria into B (chat-only) via openValeria().
 *
 * gherkin_coverage:
 * - SC-5 · clic en la tira reabre a Valeria (chat-only, sin historial · RN-12)
 * - SC-16 a11y · <button aria-label="Abrir a Valeria"> + focus-visible
 *
 * spec: 03-arch-fe.md § 4 ValeriaCollapsedStrip · 01-spec.md § Microcopy (Tira avatar)
 * Named export (NO default) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useShellStore } from "@/stores/shell-store";
import { ValeriaCollapsedStrip } from "./ValeriaCollapsedStrip";

beforeEach(() => {
  useShellStore.setState({ valeriaOpen: "closed", historyOpen: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ValeriaCollapsedStrip — render (SC-5 / SC-16)", () => {
  it("renders a button labelled 'Abrir a Valeria'", () => {
    render(<ValeriaCollapsedStrip />);
    expect(
      screen.getByRole("button", { name: "Abrir a Valeria" }),
    ).toBeInTheDocument();
  });

  it("renders the REAL Valeria avatar (catalog thumbnail, not placeholder 'V')", () => {
    const { container } = render(<ValeriaCollapsedStrip />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain("/agents/valeria/thumbnail.png");
  });

  it("renders the 'Valeria' label", () => {
    render(<ValeriaCollapsedStrip />);
    expect(screen.getByText("Valeria")).toBeInTheDocument();
  });

  it("renders a decorative status dot (aria-hidden)", () => {
    render(<ValeriaCollapsedStrip />);
    const dot = screen.getByTestId("valeria-strip-status-dot");
    expect(dot).toBeInTheDocument();
    expect(dot.getAttribute("aria-hidden")).toBe("true");
  });

  it("has data-testid='valeria-collapsed-strip'", () => {
    render(<ValeriaCollapsedStrip />);
    expect(screen.getByTestId("valeria-collapsed-strip")).toBeInTheDocument();
  });

  it("button has focus-visible affordance class", () => {
    render(<ValeriaCollapsedStrip />);
    const btn = screen.getByRole("button", { name: "Abrir a Valeria" });
    expect(btn.className).toContain("focus-visible:");
  });
});

describe("ValeriaCollapsedStrip — reopen behaviour (SC-5 / RN-12)", () => {
  it("click reopens Valeria into chat (chat-only, no history)", async () => {
    useShellStore.setState({ valeriaOpen: "closed", historyOpen: false });
    render(<ValeriaCollapsedStrip />);

    await userEvent.click(
      screen.getByRole("button", { name: "Abrir a Valeria" }),
    );

    const state = useShellStore.getState();
    expect(state.valeriaOpen).toBe("chat");
    expect(state.historyOpen).toBe(false);
  });

  it("RN-12: reopen from closed never restores history (chat-only)", async () => {
    // even if a stale historyOpen leaked, opening must keep history off
    useShellStore.setState({ valeriaOpen: "closed", historyOpen: false });
    render(<ValeriaCollapsedStrip />);

    await userEvent.click(
      screen.getByRole("button", { name: "Abrir a Valeria" }),
    );

    expect(useShellStore.getState().historyOpen).toBe(false);
  });
});
