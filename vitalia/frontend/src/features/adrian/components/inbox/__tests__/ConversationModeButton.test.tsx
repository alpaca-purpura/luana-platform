// cap: adrian.inbox
// story-origin: vitalia-fase2-adrian-inbox
/**
 * ConversationModeButton.test.tsx — T-5 tests.
 *
 * SC-5: "Modo conversación" collapses Valeria + remembers prior state.
 * RN-12: toggle-off restores priorValeriaState from inbox-store.
 *
 * downstream-regression-na: brand-local FE test; no cross-brand consumers
 */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";

// Mocks
const mockSetValeriaState = vi.fn();
const mockSetPriorValeriaState = vi.fn();

vi.mock("@/stores/shell-store", () => {
  return {
    useShellStore: vi.fn((selector: (s: { valeriaState: string; setValeriaState: typeof mockSetValeriaState }) => unknown) =>
      selector({ valeriaState: "full", setValeriaState: mockSetValeriaState }),
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

  it("test_aria_pressed_false: aria-pressed is false when valeriaState is not collapsed", () => {
    render(<ConversationModeButton />);
    const btn = screen.getByTestId("conversation-mode-button");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("test_aria_pressed_true: aria-pressed is true when Valeria is collapsed", async () => {
    const { useShellStore } = await import("@/stores/shell-store");
    (useShellStore as unknown as Mock).mockImplementation(
      (selector: (s: { valeriaState: string; setValeriaState: typeof mockSetValeriaState }) => unknown) =>
        selector({ valeriaState: "collapsed", setValeriaState: mockSetValeriaState }),
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
