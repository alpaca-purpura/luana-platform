// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4 (RED test — written before implementation)
/**
 * LuanaChat + ChatComposer (skeleton) — T-4 tests (RED first)
 *
 * Tests:
 * 1. ChatComposer renders placeholder tuteo "Escríbele a Luana…" (NOT voseo "Escribile")
 * 2. ChatComposer send button is disabled when empty (skeleton — NON-functional)
 * 3. LuanaChat has region role with "Luana" in aria-label
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatComposer } from "../ChatComposer";
import { LuanaChat } from "../LuanaChat";

vi.mock("@/stores/chat-store", () => ({
  useChatStore: (selector: (s: { messages: unknown[]; sendMessage: () => void }) => unknown) =>
    selector({ messages: [], sendMessage: vi.fn() }),
}));

vi.mock("../ChatHeader", () => ({
  ChatHeader: () => <div data-testid="chat-header" />,
}));

vi.mock("../ChatMessages", () => ({
  ChatMessages: () => <div data-testid="chat-messages" />,
}));

describe("ChatComposer — T-4 skeleton", () => {
  it("placeholder microcopy is tuteo 'Escríbele a Luana…' (NOT voseo 'Escribile')", () => {
    render(<ChatComposer />);
    const textarea = screen.getByPlaceholderText(/Escríbele a Luana/i);
    expect(textarea).toBeTruthy();
  });

  it("send button is disabled when composer is empty", () => {
    render(<ChatComposer />);
    const sendBtn = screen.getByTestId("composer-send");
    expect(sendBtn.hasAttribute("disabled")).toBe(true);
  });
});

describe("LuanaChat", () => {
  it("renders section with role=region and aria-label containing 'Luana'", () => {
    const { container } = render(<LuanaChat />);
    const section = container.querySelector("section");
    expect(section?.getAttribute("role")).toBe("region");
    const ariaLabel = section?.getAttribute("aria-label") ?? "";
    expect(ariaLabel.toLowerCase()).toContain("luana");
  });
});
