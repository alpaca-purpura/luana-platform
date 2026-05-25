"use client";

/**
 * ChatMessages — messages list panel for Valeria chat (T-5, F1-S6).
 *
 * Renders role="log" aria-live="polite" container with:
 * - EmptyStateChat when messages.length === 0
 * - Populated list: MessageBubble (bot/user) | DelegateMarker | TypingIndicator
 *
 * Auto-scroll: useEffect [messages.length] scrolls sentinel into view (smooth).
 *
 * Wrapper/footer decision (T-5 result): MessageBubble already owns its wrapper
 * (flex flex-col gap-1 self-start/end max-w-[80%]) and footer (timestamp),
 * so renderMessage() passes raw props — no outer wrapper added here.
 * This is Opción A: MessageBubble is self-contained.
 *
 * spec_anchor: 01-spec.md § 1 SC-1/SC-5/SC-6 + § 3 ChatMessages + § 6 microcopy
 *              03-arch.md § 2.5 ChatMessages + § 2.1 component tree
 * Named export (NO default) per FSD-Lite enforce.
 *
 * 'use client' REQUIRED: useChatStore (React state), useEffect (auto-scroll), useRef.
 *
 * LIFT CANDIDATE: cross-brand chat messages panel. Second brand consumer triggers
 * /pm-luana promotion proposal for core/@luana/shell-chat-organism/.
 *
 * HIPAA-lite: not_applicable — shell chrome UI, no PHI, mock data only.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import type { ChatMessage } from "@/stores/chat-store";
import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { DelegateMarker } from "./DelegateMarker";

// ─── EmptyStateChat ────────────────────────────────────────────────────────────

/**
 * EmptyStateChat — empty state illustration with Valeria avatar + heading + subtexto.
 *
 * Spanish neutro corrected per spec § 6:
 *   "Empieza" (tuteo — voseo form avoided per spanish-text.md)
 *   "Pregúntale" (WITH tilde + clítico — voseo form without tilde avoided)
 *
 * Mockup reference: valeria-chat-sample.html Variante B.
 * Server-safe (no hooks) — declared inside 'use client' file because parent is client.
 */
function EmptyStateChat() {
  const descriptor = AGENT_CATALOG[DEFAULT_CHAT_AGENT];

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-[260px]">
        <div
          className="h-16 w-16 rounded-full overflow-hidden mx-auto mb-3 ring-4 ring-agent-valeria-soft"
          aria-hidden="true"
        >
          <img
            src={descriptor.thumbnail}
            alt="Valeria"
            className="h-16 w-16 object-cover"
          />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          Empieza una conversación
        </p>
        <p className="text-xs text-muted-foreground">
          Pregúntale a Valeria por la agenda de hoy, pacientes que faltan
          confirmar o cualquier tarea operativa de la clínica.
        </p>
      </div>
    </div>
  );
}

// ─── renderMessage helper ──────────────────────────────────────────────────────

/**
 * renderMessage — switch on message role → appropriate component.
 *
 * Wrapper + footer are handled INSIDE MessageBubble (Opción A decision).
 * TypingIndicator and DelegateMarker are self-contained too.
 */
function renderMessage(msg: ChatMessage) {
  switch (msg.role) {
    case "bot":
      return (
        <MessageBubble
          key={msg.id}
          role="bot"
          content={msg.content ?? ""}
          agent={msg.agent ?? DEFAULT_CHAT_AGENT}
          time={msg.time}
        />
      );

    case "user":
      return (
        <MessageBubble
          key={msg.id}
          role="user"
          content={msg.content ?? ""}
          time={msg.time}
        />
      );

    case "delegate":
      return (
        <DelegateMarker
          key={msg.id}
          fromAgent={msg.fromAgent ?? DEFAULT_CHAT_AGENT}
          toAgent={msg.toAgent ?? DEFAULT_CHAT_AGENT}
          mode={msg.delegateMode ?? "Mantener"}
        />
      );

    case "thinking":
      return (
        <TypingIndicator
          key={msg.id}
          agent={msg.agent ?? DEFAULT_CHAT_AGENT}
          text={msg.content}
        />
      );

    default:
      return null;
  }
}

// ─── ChatMessages ──────────────────────────────────────────────────────────────

/**
 * ChatMessages — messages container with aria-live announcements and auto-scroll.
 *
 * role="log" is the correct ARIA role for chat message history.
 * aria-live="polite" announces new messages to screen readers.
 */
export function ChatMessages() {
  const messages = useChatStore((s) => s.messages);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    sentinelRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div
      data-testid="chat-messages"
      role="log"
      aria-live="polite"
      aria-label="Conversación con Valeria"
      className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3"
    >
      {messages.length === 0 ? (
        <EmptyStateChat />
      ) : (
        <>
          {messages.map((msg) => renderMessage(msg))}
          {/* Auto-scroll sentinel */}
          <div ref={sentinelRef} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
