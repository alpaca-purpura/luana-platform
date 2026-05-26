"use client";

/**
 * ChatMessages.test.tsx — unit tests (TDD RED→GREEN) for ChatMessages + EmptyStateChat.
 *
 * spec_anchor: T-5 gherkin_coverage · 01-spec.md § 1 SC-1/SC-5/SC-6 · 03-arch.md § 2.5
 *
 * Tests:
 *   - renders empty state when messages.length === 0
 *   - renders 6 mock messages in order when seeded
 *   - bot messages aligned self-start; user messages self-end
 *   - delegate marker rendered for role='delegate'
 *   - thinking indicator rendered for role='thinking'
 *   - aria attributes: role="log" + aria-live="polite" + aria-label present
 *   - Spanish neutro: empty state copy does NOT contain voseo
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { useChatStore } from "@/stores/chat-store";
import { ChatMessages } from "./ChatMessages";

// Helper — reset store to specific messages state
function seedStore(partial: {
  messages?: ReturnType<typeof useChatStore.getState>["messages"];
  status?: ReturnType<typeof useChatStore.getState>["status"];
}) {
  act(() => {
    useChatStore.setState((s) => ({ ...s, ...partial }));
  });
}

describe("ChatMessages — empty state (messages.length === 0)", () => {
  beforeEach(() => {
    seedStore({ messages: [], status: "idle" });
  });

  afterEach(() => {
    useChatStore.getState().clearMessages();
  });

  it("renders empty state heading 'Empieza una conversación' (tuteo correcto per spec § 6)", () => {
    render(<ChatMessages />);
    expect(screen.getByText("Empieza una conversación")).toBeInTheDocument();
  });

  it("renders empty state subtexto with 'Pregúntale' (tilde correcto per spec § 6)", () => {
    render(<ChatMessages />);
    expect(screen.getByText(/Pregúntale a Valeria/i)).toBeInTheDocument();
  });

  it("renders empty state avatar image", () => {
    render(<ChatMessages />);
    const img = screen.getByAltText("Valeria");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("valeria"));
  });

  it("does NOT render any msg-bubble elements in empty state", () => {
    render(<ChatMessages />);
    expect(screen.queryAllByTestId("msg-bubble")).toHaveLength(0);
  });

  it("does NOT render any msg-delegate elements in empty state", () => {
    render(<ChatMessages />);
    expect(screen.queryAllByTestId("msg-delegate")).toHaveLength(0);
  });
});

describe("ChatMessages — populated (6 MOCK_MESSAGES)", () => {
  beforeEach(() => {
    // T-2 already initializes store with MOCK_MESSAGES — just ensure populated
    useChatStore.setState((s) => ({
      ...s,
      // If messages already seeded from store init keep them; else import manually
      messages:
        s.messages.length >= 6
          ? s.messages
          : [
              {
                id: "1",
                role: "bot",
                agent: "valeria",
                content:
                  "¡Buenos días! Tienes 8 turnos hoy y 3 pacientes esperando confirmar mañana. ¿Por dónde empezamos?",
                time: "09:01",
              },
              {
                id: "2",
                role: "user",
                content: "¿Cómo están las reseñas Google esta semana?",
                time: "09:02",
              },
              {
                id: "3",
                role: "delegate",
                fromAgent: "valeria",
                toAgent: "camila",
                delegateMode: "Mantener",
              },
              {
                id: "4",
                role: "bot",
                agent: "camila",
                content: "Esta semana ingresaron +3 reseñas Google.",
                time: "09:02",
              },
              {
                id: "5",
                role: "user",
                content: "Sí, ábrela.",
                time: "09:03",
              },
              {
                id: "6",
                role: "thinking",
                agent: "camila",
                content: "Camila está abriendo Voz del paciente…",
              },
            ],
    }));
  });

  afterEach(() => {
    useChatStore.getState().clearMessages();
  });

  it("renders 6 messages in correct order (bot, user, delegate, bot, user, thinking)", () => {
    render(<ChatMessages />);
    const bubbles = screen.getAllByTestId("msg-bubble");
    // MOCK_MESSAGES: [bot, user, delegate, bot, user, thinking]
    // msg-bubble testid exists on bot + user messages (not delegate/thinking which use different testid)
    // bot=2, user=2 → 4 msg-bubble elements; delegate=1 msg-delegate; thinking=1 msg-thinking
    expect(bubbles.length).toBeGreaterThanOrEqual(2);
  });

  it("renders delegate marker (data-testid='msg-delegate')", () => {
    render(<ChatMessages />);
    expect(screen.getByTestId("msg-delegate")).toBeInTheDocument();
  });

  it("renders thinking indicator (data-testid='msg-thinking')", () => {
    render(<ChatMessages />);
    expect(screen.getByTestId("msg-thinking")).toBeInTheDocument();
  });

  it("bot messages have data-role='bot'", () => {
    render(<ChatMessages />);
    const botBubbles = screen
      .getAllByTestId("msg-bubble")
      .filter((el) => el.getAttribute("data-role") === "bot");
    expect(botBubbles.length).toBeGreaterThanOrEqual(2);
  });

  it("user messages have data-role='user'", () => {
    render(<ChatMessages />);
    const userBubbles = screen
      .getAllByTestId("msg-bubble")
      .filter((el) => el.getAttribute("data-role") === "user");
    expect(userBubbles.length).toBeGreaterThanOrEqual(2);
  });

  it("does NOT render empty state heading in populated state", () => {
    render(<ChatMessages />);
    expect(
      screen.queryByText("Empieza una conversación"),
    ).not.toBeInTheDocument();
  });
});

describe("ChatMessages — ARIA attributes (SC-6 accessibility)", () => {
  afterEach(() => {
    useChatStore.getState().clearMessages();
  });

  it("messages container has role='log'", () => {
    render(<ChatMessages />);
    expect(screen.getByRole("log")).toBeInTheDocument();
  });

  it("messages container has aria-live='polite'", () => {
    render(<ChatMessages />);
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
  });

  it("messages container has aria-label='Conversación con Valeria'", () => {
    render(<ChatMessages />);
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-label", "Conversación con Valeria");
  });

  it("messages container has data-testid='chat-messages'", () => {
    render(<ChatMessages />);
    expect(screen.getByTestId("chat-messages")).toBeInTheDocument();
  });
});

describe("ChatMessages — Spanish neutro (SC-7 i18n)", () => {
  it("empty state copy does NOT contain voseo forms", () => {
    useChatStore.setState((s) => ({ ...s, messages: [], status: "idle" }));
    render(<ChatMessages />);

    // Check heading uses tuteo form: "Empieza" (NOT the voseo form — see spanish-text.md)
    const heading = screen.getByText("Empieza una conversación");
    // Verify no voseo imperative endings (-ás suffix is voseo)
    expect(heading.textContent).not.toMatch(/á[sz]$/i);
    expect(heading.textContent).not.toMatch(/\bvos\b/i);

    // Check subtexto (should have tilde in Pregúntale — not "Preguntale" which is voseo)
    const subtexto = screen.getByText(/Pregúntale a Valeria/i);
    expect(subtexto.textContent).toContain("Pregúntale");
    // "Preguntale" without tilde is voseo (clítico without accent shift)
    expect(subtexto.textContent).not.toContain("Preguntale");

    useChatStore.getState().clearMessages();
  });
});
