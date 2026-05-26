"use client";

/**
 * ValeriaChat.test.tsx — integration test (TDD RED→GREEN) for ValeriaChat organism.
 *
 * spec_anchor: T-5 gherkin_coverage · 01-spec.md § 1 SC-1/SC-2/SC-5 · 03-arch.md § 2.1
 *
 * Tests:
 *   - renders section role='region' aria-label='Chat con Valeria' data-testid='valeria-chat'
 *   - renders ChatHeader + ChatMessages + ChatComposer in order
 *   - 6 MOCK_MESSAGES visible in populated state
 *   - empty state branch renders when messages=[]
 *   - SC-2 send message integration (fake timers)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { useChatStore } from "@/stores/chat-store";
import { ValeriaChat } from "./ValeriaChat";

// Reset store after each test
afterEach(() => {
  act(() => {
    useChatStore.getState().clearMessages();
  });
  vi.restoreAllMocks();
});

describe("ValeriaChat — organism structure (SC-1)", () => {
  it("renders section with role='region' aria-label='Chat con Valeria'", () => {
    render(<ValeriaChat />);
    const region = screen.getByRole("region", { name: "Chat con Valeria" });
    expect(region).toBeInTheDocument();
  });

  it("has data-testid='valeria-chat'", () => {
    render(<ValeriaChat />);
    expect(screen.getByTestId("valeria-chat")).toBeInTheDocument();
  });

  it("renders ChatHeader (data-testid='chat-header')", () => {
    render(<ValeriaChat />);
    expect(screen.getByTestId("chat-header")).toBeInTheDocument();
  });

  it("renders ChatMessages (data-testid='chat-messages')", () => {
    render(<ValeriaChat />);
    expect(screen.getByTestId("chat-messages")).toBeInTheDocument();
  });

  it("renders ChatComposer (data-testid='chat-composer')", () => {
    render(<ValeriaChat />);
    expect(screen.getByTestId("chat-composer")).toBeInTheDocument();
  });

  it("renders ChatHeader + ChatMessages + ChatComposer in the correct order (DOM order)", () => {
    render(<ValeriaChat />);
    const header = screen.getByTestId("chat-header");
    const messages = screen.getByTestId("chat-messages");
    const composer = screen.getByTestId("chat-composer");

    // Verify DOM order: header before messages before composer
    expect(
      header.compareDocumentPosition(messages) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      messages.compareDocumentPosition(composer) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("ValeriaChat — populated state (SC-1 — 6 mock messages)", () => {
  beforeEach(() => {
    // Seed store with 6 messages
    act(() => {
      useChatStore.setState({
        messages: [
          {
            id: "1",
            role: "bot",
            agent: "valeria",
            content: "¡Buenos días! Tienes 8 turnos hoy.",
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
        status: "idle",
      });
    });
  });

  it("renders msg-bubble elements (bot + user messages)", () => {
    render(<ValeriaChat />);
    const bubbles = screen.getAllByTestId("msg-bubble");
    expect(bubbles.length).toBeGreaterThanOrEqual(4); // 2 bot + 2 user
  });

  it("renders delegate marker with 'Camila' and '(modo Mantener)'", () => {
    render(<ValeriaChat />);
    const delegate = screen.getByTestId("msg-delegate");
    expect(delegate).toBeInTheDocument();
    expect(delegate.textContent).toContain("Camila");
    expect(delegate.textContent).toContain("Mantener");
  });

  it("renders TypingIndicator for thinking message (msg-thinking)", () => {
    render(<ValeriaChat />);
    const thinking = screen.getByTestId("msg-thinking");
    expect(thinking).toBeInTheDocument();
    expect(thinking.textContent).toContain("Camila");
  });

  it("does NOT render empty state heading when messages are present", () => {
    render(<ValeriaChat />);
    expect(
      screen.queryByText("Empieza una conversación"),
    ).not.toBeInTheDocument();
  });
});

describe("ValeriaChat — empty state (SC-5)", () => {
  beforeEach(() => {
    act(() => {
      useChatStore.setState({ messages: [], status: "idle" });
    });
  });

  it("renders empty state heading 'Empieza una conversación'", () => {
    render(<ValeriaChat />);
    expect(screen.getByText("Empieza una conversación")).toBeInTheDocument();
  });

  it("renders empty state subtexto with 'Pregúntale' (tilde correcto)", () => {
    render(<ValeriaChat />);
    expect(screen.getByText(/Pregúntale a Valeria/i)).toBeInTheDocument();
  });

  it("ChatHeader still renders in empty state", () => {
    render(<ValeriaChat />);
    expect(screen.getByTestId("chat-header")).toBeInTheDocument();
  });

  it("ChatComposer still renders in empty state", () => {
    render(<ValeriaChat />);
    expect(screen.getByTestId("chat-composer")).toBeInTheDocument();
  });
});

describe("ValeriaChat — send message integration (SC-2)", () => {
  beforeEach(() => {
    act(() => {
      useChatStore.setState((s) => ({ ...s, messages: [], status: "idle" }));
    });
  });

  it("user sends message via send button → user bubble appears + thinking shown → after 800ms bot reply appears", async () => {
    vi.useFakeTimers();
    render(<ValeriaChat />);

    const textarea = screen.getByTestId("composer-input");
    const sendButton = screen.getByTestId("composer-send");

    // Type into textarea and click send button (avoids keyboard event nativeEvent complexity)
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Hola Valeria" } });
    });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    // User message should appear immediately
    const userBubbles = screen
      .queryAllByTestId("msg-bubble")
      .filter((el) => el.getAttribute("data-role") === "user");
    expect(userBubbles.length).toBeGreaterThanOrEqual(1);

    // Thinking indicator should appear
    expect(screen.getByTestId("msg-thinking")).toBeInTheDocument();

    // Advance 800ms — bot reply should appear, thinking removed
    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    const botBubbles = screen
      .queryAllByTestId("msg-bubble")
      .filter((el) => el.getAttribute("data-role") === "bot");
    expect(botBubbles.length).toBeGreaterThanOrEqual(1);

    expect(screen.queryByTestId("msg-thinking")).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
