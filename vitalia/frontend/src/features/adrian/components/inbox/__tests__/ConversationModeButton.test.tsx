// cap: adrian.inbox
// story-origin: vitalia-fase2-adrian-inbox
/**
 * ConversationModeButton.test.tsx — T-5 tests.
 *
 * SC-5: "Modo conversación" collapses Valeria + remembers prior state.
 * RN-12: toggle-off restores priorValeriaState from inbox-store.
 *
 * T-1 (vitalia-shell-core-hardening): the shell machine changed from the 3-state
 * valeriaState (collapsed|rail|full) to the binary valeriaOpen (closed|chat). The
 * component now reads valeriaOpen + openValeria/collapseValeria. These mocks track
 * the new API: "conversation mode" = valeriaOpen === 'closed'. Minimal mock update,
 * NO behavior re-design (that lands in T-2/T-3).
 *
 * downstream-regression-na: brand-local FE test; no cross-brand consumers
 */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";

// Mocks — new machine API (T-1)
const mockOpenValeria = vi.fn();
const mockCollapseValeria = vi.fn();
const mockSetPriorValeriaState = vi.fn();

vi.mock("@/stores/shell-store", () => {
  return {
    useShellStore: vi.fn(
      (
        selector: (s: {
          valeriaOpen: string;
          openValeria: typeof mockOpenValeria;
          collapseValeria: typeof mockCollapseValeria;
        }) => unknown,
      ) =>
        selector({
          valeriaOpen: "chat",
          openValeria: mockOpenValeria,
          collapseValeria: mockCollapseValeria,
        }),
    ),
  };
});

vi.mock("../../../store/inbox-store", () => {
  return {
    useInboxStore: vi.fn(
      (selector: (s: { priorValeriaState: string | null; setPriorValeriaState: typeof mockSetPriorValeriaState }) => unknown) =>
        selector({
          priorValeriaState: null,
          setPriorValeriaState: mockSetPriorValeriaState,
        }),
    ),
  };
});

import { ConversationModeButton } from "../ConversationModeButton";

describe("ConversationModeButton — SC-5 full-canvas (RN-12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_renders: has data-testid=conversation-mode-button", () => {
    render(<ConversationModeButton />);
    expect(screen.getByTestId("conversation-mode-button")).toBeDefined();
  });

  it("test_label: shows Modo conversación text", () => {
    render(<ConversationModeButton />);
    const btn = screen.getByTestId("conversation-mode-button");
    expect(btn.textContent).toContain("Modo conversación");
  });

  it("test_aria_pressed_false: aria-pressed is false when Valeria is open (valeriaOpen='chat')", () => {
    render(<ConversationModeButton />);
    const btn = screen.getByTestId("conversation-mode-button");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("test_aria_pressed_true: aria-pressed is true when Valeria is closed (valeriaOpen='closed')", async () => {
    const { useShellStore } = await import("@/stores/shell-store");
    (useShellStore as unknown as Mock).mockImplementation(
      (
        selector: (s: {
          valeriaOpen: string;
          openValeria: typeof mockOpenValeria;
          collapseValeria: typeof mockCollapseValeria;
        }) => unknown,
      ) =>
        selector({
          valeriaOpen: "closed",
          openValeria: mockOpenValeria,
          collapseValeria: mockCollapseValeria,
        }),
    );
    render(<ConversationModeButton />);
    const btn = screen.getByTestId("conversation-mode-button");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("test_no_voseo: no voseo in button text (Spanish neutro)", () => {
    render(<ConversationModeButton />);
    const text = screen.getByTestId("conversation-mode-button").textContent ?? "";
    expect(text).not.toMatch(/tenés|podés|hacé|mirá|dejá|poné|usá|volvé|abrí/);
  });

  it("test_button_type: button has type=button (no form submit)", () => {
    render(<ConversationModeButton />);
    const btn = screen.getByTestId("conversation-mode-button");
    expect(btn.getAttribute("type")).toBe("button");
  });
});
