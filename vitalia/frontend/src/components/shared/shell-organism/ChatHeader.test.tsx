/**
 * ChatHeader.test.tsx — Unit tests for ChatHeader molecule
 * T-3 of vitalia-fase1-valeria-chat-skeleton (F1-S6)
 * TDD RED-first per tdd-mandatory.md
 *
 * gherkin_coverage:
 * - SC-1 happy · ChatHeader visible con avatar + name + status + Mode Pill
 * - SC-4 adversarial · avatar onError fallback initial letter
 *
 * Spec: 01-spec.md § 0 D1 + § 2 ChatHeader · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 *
 * NOTE: avatar img uses alt="" (decorative — aria-hidden parent) which makes
 * RTL treat it as role="presentation". Use container.querySelector("img")
 * instead of getByRole("img") to access it directly.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useShellStore } from "@/stores/shell-store";
import { useChatStore } from "@/stores/chat-store";
import { MOCK_MESSAGES } from "./_mock-messages";
import { MOCK_CONVERSATIONS } from "./_mock-conversations";
import { ChatHeader } from "./ChatHeader";

describe("ChatHeader — renders avatar + name + status (SC-1 happy)", () => {
  it("renders data-testid='chat-header' element", () => {
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    expect(screen.getByTestId("chat-header")).toBeDefined();
  });

  it("renders avatar img with thumbnail src for valeria", () => {
    const { container } = render(
      <ChatHeader agent="valeria" status="online" mode="agent" />,
    );
    // alt="" makes it role="presentation" — use querySelector directly
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain("/agents/valeria/thumbnail.png");
  });

  it("renders name 'Valeria'", () => {
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    expect(screen.getByText("Valeria")).toBeDefined();
  });

  it("renders status text containing 'En línea' for valeria online", () => {
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    expect(screen.getByText(/En línea · Tu secretaria virtual/)).toBeDefined();
  });

  it("renders status dot with bg-vitalia-success aria-hidden='true'", () => {
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    const statusDot = screen.getByTestId("valeria-status-dot");
    expect(statusDot.getAttribute("aria-hidden")).toBe("true");
    expect(statusDot.className).toContain("bg-vitalia-success");
  });

  it("renders Mode Pill data-testid='chat-mode-pill' with '🤖 Modo agente'", () => {
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    const pill = screen.getByTestId("chat-mode-pill");
    expect(pill).toBeDefined();
    expect(pill.textContent).toContain("Modo agente");
  });

  it("avatar container is aria-hidden='true' (decorative)", () => {
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    const avatarContainer = screen.getByTestId("valeria-avatar");
    expect(avatarContainer.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("ChatHeader — custom agent prop (SC-1 happy, D9)", () => {
  it("renders Camila name when agent='camila'", () => {
    render(<ChatHeader agent="camila" status="online" mode="agent" />);
    expect(screen.getByText("Camila")).toBeDefined();
  });

  it("renders correct status text containing camila role", () => {
    render(<ChatHeader agent="camila" status="online" mode="agent" />);
    // Status format: "En línea · {descriptor.role}"
    expect(screen.getByText(/Fidelización/)).toBeDefined();
  });

  it("renders correct thumbnail src for camila", () => {
    const { container } = render(
      <ChatHeader agent="camila" status="online" mode="agent" />,
    );
    // alt="" makes it role="presentation" — use querySelector directly
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain("/agents/camila/thumbnail.png");
  });
});

describe("ChatHeader — action buttons (T-3 · SC-7/SC-8 · RN-6/RN-13)", () => {
  beforeEach(() => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    useChatStore.setState({
      messages: [...MOCK_MESSAGES],
      conversations: [...MOCK_CONVERSATIONS],
      status: "idle",
    });
  });

  it("renders the three action buttons with neutro LatAm aria-labels", () => {
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    expect(
      screen.getByRole("button", { name: "Nueva conversación" }),
    ).toBeInTheDocument();
    // history closed → label invites to show
    expect(
      screen.getByRole("button", { name: "Mostrar historial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Colapsar a Valeria" }),
    ).toBeInTheDocument();
  });

  it("'+' archives current conv + clears chat (RN-13/SC-8)", async () => {
    const before = useChatStore.getState().conversations.length;
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Nueva conversación" }),
    );
    expect(useChatStore.getState().messages).toHaveLength(0);
    expect(useChatStore.getState().conversations.length).toBe(before + 1);
  });

  it("historial toggles history open → C (SC-7) and flips aria-label", async () => {
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar historial" }),
    );
    expect(useShellStore.getState().historyOpen).toBe(true);
    // label now offers to hide
    expect(
      screen.getByRole("button", { name: "Ocultar historial" }),
    ).toBeInTheDocument();
  });

  it("colapsar → A (closed) AND closes history (RN-6)", async () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: true });
    render(<ChatHeader agent="valeria" status="online" mode="agent" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Colapsar a Valeria" }),
    );
    const s = useShellStore.getState();
    expect(s.valeriaOpen).toBe("closed");
    expect(s.historyOpen).toBe(false);
  });
});

describe("ChatHeader — avatar onError fallback (SC-4 adversarial)", () => {
  it("onError triggered → renders initial letter 'V' in bg-agent-valeria circle", () => {
    const { container } = render(
      <ChatHeader agent="valeria" status="online" mode="agent" />,
    );
    // alt="" img is role="presentation" — use querySelector
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    // Simulate image load failure
    fireEvent.error(img!);
    // After error, should show the initial letter 'V'
    expect(screen.getByText("V")).toBeDefined();
  });

  it("after onError, img is removed and initial letter visible", () => {
    const { container } = render(
      <ChatHeader agent="valeria" status="online" mode="agent" />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    // img should no longer be in the DOM
    expect(container.querySelector("img")).toBeNull();
    // Initial letter should be visible
    const avatarDiv = screen.getByTestId("valeria-avatar");
    expect(avatarDiv.textContent).toContain("V");
  });
});
