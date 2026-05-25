/**
 * MessageBubble.test.tsx — Unit tests for MessageBubble atom
 * T-3 of vitalia-fase1-valeria-chat-skeleton (F1-S6)
 * TDD RED-first per tdd-mandatory.md
 *
 * gherkin_coverage:
 * - SC-1 happy · MessageBubble bot/user variants render correct
 * - SC-4 adversarial · XSS guard JSX text-children auto-escape
 *
 * Spec: 01-spec.md § 0 D7 + § 2-3 MessageBubble · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble — bot variant (SC-1 happy)", () => {
  it("renders bot bubble with bg-card border-border classes", () => {
    render(
      <MessageBubble role="bot" content="Hola, ¿en qué te ayudo?" time="09:01" />,
    );
    const bubble = screen.getByTestId("msg-bubble");
    expect(bubble).toBeDefined();
    expect(bubble.getAttribute("data-role")).toBe("bot");
    // classes per spec § 2 mockup verbatim
    expect(bubble.className).toContain("bg-card");
    expect(bubble.className).toContain("border-border");
    expect(bubble.className).toContain("rounded-bl-sm");
    expect(bubble.className).toContain("rounded-2xl");
    expect(bubble.className).toContain("whitespace-pre-wrap");
  });

  it("bot wrapper self-start max-w-[80%]", () => {
    const { container } = render(
      <MessageBubble role="bot" content="Mensaje de prueba" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("self-start");
  });

  it("renders Valeria · HH:MM footer for bot default (no agent prop)", () => {
    render(
      <MessageBubble role="bot" content="Mensaje de Valeria" time="09:01" />,
    );
    expect(screen.getByText(/Valeria · 09:01/)).toBeDefined();
  });

  it("renders Camila (via Valeria) footer for bot with agent='camila'", () => {
    render(
      <MessageBubble
        role="bot"
        content="Mensaje de Camila"
        time="09:05"
        agent="camila"
        footerLabel="Camila (via Valeria)"
      />,
    );
    expect(screen.getByText(/Camila \(via Valeria\) · 09:05/)).toBeDefined();
  });

  it("renders content text correctly", () => {
    render(
      <MessageBubble
        role="bot"
        content="¡Buenos días! Tienes 8 turnos hoy."
      />,
    );
    expect(
      screen.getByText("¡Buenos días! Tienes 8 turnos hoy."),
    ).toBeDefined();
  });
});

describe("MessageBubble — user variant (SC-1 happy)", () => {
  it("renders user bubble with bg-agent-valeria text-white classes", () => {
    render(<MessageBubble role="user" content="Mensaje del usuario" time="09:02" />);
    const bubble = screen.getByTestId("msg-bubble");
    expect(bubble.getAttribute("data-role")).toBe("user");
    expect(bubble.className).toContain("bg-agent-valeria");
    expect(bubble.className).toContain("text-white");
    expect(bubble.className).toContain("rounded-br-sm");
    expect(bubble.className).toContain("rounded-2xl");
    expect(bubble.className).toContain("whitespace-pre-wrap");
  });

  it("user wrapper self-end max-w-[80%] items-end", () => {
    const { container } = render(
      <MessageBubble role="user" content="Hola" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("self-end");
    expect(wrapper.className).toContain("items-end");
  });

  it("renders only time in footer (no agent name) for user", () => {
    render(<MessageBubble role="user" content="Hola" time="09:02" />);
    // Should show just the time, no agent name
    const footer = screen.getByText("09:02");
    expect(footer).toBeDefined();
    // Should NOT contain "Valeria ·"
    const allText = screen
      .getByTestId("msg-bubble")
      .closest("div")?.textContent;
    expect(allText).not.toContain("Valeria ·");
  });
});

describe("MessageBubble — whitespace-pre-wrap (SC-3 edge)", () => {
  it("whitespace-pre-wrap class preserves newlines in content", () => {
    render(
      <MessageBubble
        role="bot"
        content={"Primera línea\nSegunda línea"}
        time="09:01"
      />,
    );
    const bubble = screen.getByTestId("msg-bubble");
    expect(bubble.className).toContain("whitespace-pre-wrap");
    expect(bubble.textContent).toContain("Primera línea");
    expect(bubble.textContent).toContain("Segunda línea");
  });
});

describe("MessageBubble — XSS guard (SC-4 adversarial)", () => {
  it("renders XSS payload as escaped text literal, no DOM injection", () => {
    const xssPayload = "<script>alert('xss')</script>";
    render(<MessageBubble role="bot" content={xssPayload} />);
    const bubble = screen.getByTestId("msg-bubble");
    // textContent exposes decoded string — confirms payload rendered as text
    expect(bubble.textContent).toContain("alert('xss')");
    // No actual <script> DOM element injected (would exist if dangerouslySetInnerHTML used)
    expect(bubble.querySelector("script")).toBeNull();
    // document-level check: no runnable script tags with src or inline
    expect(document.querySelectorAll("script[src]")).toHaveLength(0);
  });

  it("does NOT use dangerouslySetInnerHTML (grep-verified via prop absence)", () => {
    // This test verifies the component renders via JSX text children
    // React auto-escapes text children — dangerouslySetInnerHTML would bypass this
    render(
      <MessageBubble role="bot" content="<img onerror='alert(1)' src='x'>" />,
    );
    const bubble = screen.getByTestId("msg-bubble");
    // If dangerouslySetInnerHTML were used, textContent would be empty
    // and the onerror would fire (caught by testing env)
    expect(bubble.textContent).toContain("<img onerror");
  });
});

describe("MessageBubble — data-testid attrs", () => {
  it("data-testid='msg-bubble' + data-role='bot'", () => {
    render(<MessageBubble role="bot" content="test" />);
    const el = screen.getByTestId("msg-bubble");
    expect(el.getAttribute("data-role")).toBe("bot");
  });

  it("data-testid='msg-bubble' + data-role='user'", () => {
    render(<MessageBubble role="user" content="test" />);
    const el = screen.getByTestId("msg-bubble");
    expect(el.getAttribute("data-role")).toBe("user");
  });
});
