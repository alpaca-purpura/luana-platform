// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * ChatMessages — messages list panel for Luana chat (Nicolify R0 skeleton).
 *
 * Port re-tematizado from vitalia/ChatMessages.tsx.
 * Re-themed: Valeria→Luana, vitalia-context copy→nicolify-context copy.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { useEffect, useRef } from "react";

import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import { useChatStore } from "@/stores/chat-store";

import { DelegateMarker } from "./DelegateMarker";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

import type { ChatMessage } from "@/stores/chat-store";

// ── EmptyStateChat ──────────────────────────────────────────────────────────────

function EmptyStateChat() {
  const descriptor = AGENT_CATALOG[DEFAULT_CHAT_AGENT];

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-[260px]">
        <div
          className="h-16 w-16 rounded-full overflow-hidden mx-auto mb-3 ring-4 ring-agent-luana-soft"
          aria-hidden="true"
        >
          <img src={descriptor.thumbnail} alt="Luana" className="h-16 w-16 object-cover" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">Empieza una conversación</p>
        <p className="text-xs text-muted-foreground">
          Pregúntale a Luana por el estado del pipeline, campañas activas o cualquier tarea
          operativa de la agencia.
        </p>
      </div>
    </div>
  );
}

// ── renderMessage helper ────────────────────────────────────────────────────────

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
      return <MessageBubble key={msg.id} role="user" content={msg.content ?? ""} time={msg.time} />;

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
        <TypingIndicator key={msg.id} agent={msg.agent ?? DEFAULT_CHAT_AGENT} text={msg.content} />
      );

    default:
      return null;
  }
}

// ── ChatMessages ────────────────────────────────────────────────────────────────

/**
 *
 */
export function ChatMessages() {
  const messages = useChatStore((s) => s.messages);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sentinelRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div
      data-testid="chat-messages"
      role="log"
      aria-live="polite"
      aria-label="Conversación con Luana"
      className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3"
    >
      {messages.length === 0 ? (
        <EmptyStateChat />
      ) : (
        <>
          {messages.map((msg) => renderMessage(msg))}
          <div ref={sentinelRef} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
