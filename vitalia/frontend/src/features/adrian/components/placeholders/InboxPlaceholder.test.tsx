/**
 * InboxPlaceholder.test.tsx — Vitest unit tests (TDD RED→GREEN).
 *
 * F1-S10 vitalia-fase1-empty-states — T-6
 * spec_anchor: 06-tickets.yaml T-6 val-fe-vitest-unit-inbox-placeholder
 *
 * Tests (7 specs per ticket scope):
 *   1. Render 5 ConversationItem visible (María G., Carlos P., Lucía R., Diego F., Sofía M.)
 *   2. Carlos Pérez handlerMode=human → YouChip "✋ Tú" visible
 *   3. Default selected=María → thread muestra 4 mock messages
 *   4. Default handlerState=adrian → chip "🤖 Adrián decidiendo" + botón "✋ Tomar el control" visible · MessageInput disabled
 *   5. Click "✋ Tomar el control" → handlerState=human → TakeoverBanner visible · botón "🤖 Devolver a Adrián" visible · MessageInput enabled · footer hint cambia
 *   6. Click "🤖 Devolver a Adrián" → back to handlerState=adrian (chip + takeover button restored)
 *   7. Click × header → sidebarOpen=false → ContactSidebar ocultado
 *
 * downstream-regression-na: brand-local placeholder; no cross-brand consumers
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InboxPlaceholder } from "./InboxPlaceholder";

describe("InboxPlaceholder", () => {
  // ── Test 1: 5 ConversationItem renders ──────────────────────────────────────
  it("renders 5 ConversationItem rows with correct display names", () => {
    render(<InboxPlaceholder />);

    // Verify each conversation item by display name (aria-label contains the name)
    expect(
      screen.getByRole("button", { name: /María González/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Carlos Pérez/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Lucía Ramos/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Diego Flores/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sofía M\./i }),
    ).toBeInTheDocument();
  });

  // ── Test 2: Carlos Pérez YouChip "✋ Tú" visible ────────────────────────────
  it("shows YouChip for Carlos Pérez (handlerMode=human)", () => {
    render(<InboxPlaceholder />);

    // YouChip renders inside Carlos's ConversationItem
    // There should be at least one "✋ Tú" chip visible
    const youChips = screen.getAllByText(/✋ Tú/);
    expect(youChips.length).toBeGreaterThanOrEqual(1);

    // The chip should be near Carlos's row
    const carlosRow = screen.getByRole("button", { name: /Carlos Pérez/i });
    const chipInsideRow = within(carlosRow).getByText(/✋ Tú/);
    expect(chipInsideRow).toBeInTheDocument();
  });

  // ── Test 3: Default selected=María → 4 mock messages rendered ───────────────
  it("shows 4 thread messages for default selected conversation (María González)", () => {
    render(<InboxPlaceholder />);

    // First mock message
    expect(
      screen.getByText(/vi su anuncio sobre limpieza dental/),
    ).toBeInTheDocument();
    // Second mock message (Adrián reply)
    expect(
      screen.getByText(/La limpieza dental es S\/ 120/),
    ).toBeInTheDocument();
    // Third mock message
    expect(
      screen.getByText(/mañana al mediodía si tienen/),
    ).toBeInTheDocument();
    // Fourth mock message
    expect(screen.getByText(/Dra\. Soto/)).toBeInTheDocument();
  });

  // ── Test 4: Default handlerState=adrian UX ─────────────────────────────────
  it("shows chip and takeover button in default state A (adrian handles)", () => {
    render(<InboxPlaceholder />);

    // Chip "🤖 Adrián decidiendo"
    expect(screen.getByText(/🤖 Adrián decidiendo/)).toBeInTheDocument();

    // Botón "✋ Tomar el control"
    expect(
      screen.getByRole("button", { name: /Tomar el control/i }),
    ).toBeInTheDocument();

    // MessageInput disabled — textarea aria-disabled=true
    const textarea = screen.getByRole("textbox", { name: /Escribir mensaje/i });
    expect(textarea).toBeDisabled();
  });

  // ── Test 5: Click "✋ Tomar el control" → state B ───────────────────────────
  it("transitions to state B after clicking takeover button", async () => {
    const user = userEvent.setup();
    render(<InboxPlaceholder />);

    // Click the takeover button
    const takeoverBtn = screen.getByRole("button", {
      name: /Tomar el control/i,
    });
    await user.click(takeoverBtn);

    // TakeoverBanner visible
    expect(
      screen.getByRole("status", {
        name: /Tienes el control/i,
      }),
    ).toBeInTheDocument();

    // "🤖 Devolver a Adrián" button visible
    expect(
      screen.getByRole("button", { name: /Devolver.*Adrián/i }),
    ).toBeInTheDocument();

    // MessageInput enabled
    const textarea = screen.getByRole("textbox", { name: /Escribir mensaje/i });
    expect(textarea).not.toBeDisabled();

    // Footer hint changed to amber (human mode)
    expect(screen.getByText(/Estás respondiendo como tú/)).toBeInTheDocument();

    // Chip "🤖 Adrián decidiendo" should be hidden
    expect(screen.queryByText(/🤖 Adrián decidiendo/)).not.toBeInTheDocument();
  });

  // ── Test 6: Click "🤖 Devolver a Adrián" → back to state A ─────────────────
  it("returns to state A after clicking return control button", async () => {
    const user = userEvent.setup();
    render(<InboxPlaceholder />);

    // First take control
    await user.click(screen.getByRole("button", { name: /Tomar el control/i }));

    // Then return control
    const returnBtn = screen.getByRole("button", { name: /Devolver.*Adrián/i });
    await user.click(returnBtn);

    // State A restored: chip visible, takeover button visible
    expect(screen.getByText(/🤖 Adrián decidiendo/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tomar el control/i }),
    ).toBeInTheDocument();

    // TakeoverBanner hidden
    expect(
      screen.queryByRole("status", { name: /Tienes el control/i }),
    ).not.toBeInTheDocument();

    // MessageInput disabled again
    const textarea = screen.getByRole("textbox", { name: /Escribir mensaje/i });
    expect(textarea).toBeDisabled();
  });

  // ── Test 7: Click × header → sidebar closes ────────────────────────────────
  it("closes ContactSidebar when × button is clicked", async () => {
    const user = userEvent.setup();
    render(<InboxPlaceholder />);

    // Sidebar initially open — ContactSidebar visible
    expect(
      screen.getByRole("complementary", { name: /Detalles del paciente/i }),
    ).toBeInTheDocument();

    // Click × close button in ThreadHeader
    const closeBtn = screen.getByRole("button", {
      name: /Cerrar panel de detalles/i,
    });
    await user.click(closeBtn);

    // ContactSidebar should be removed from DOM
    expect(
      screen.queryByRole("complementary", {
        name: /Detalles del paciente/i,
      }),
    ).not.toBeInTheDocument();
  });

  // ── Test 8: No voseo in user-facing text ────────────────────────────────────
  it("does not contain voseo in user-facing text", () => {
    // voseo-allowed: regex tests for absence of voseo in rendered output (technical fixture)
    const { container } = render(<InboxPlaceholder />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/tenés|podés|hacés|dejá|mirá|sos\b/i);
  });
});
