// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * MessageBubble — chat bubble atom for bot/user messages.
 *
 * Port re-tematizado from vitalia/MessageBubble.tsx.
 * Re-themed: bg-agent-luana (Luana indigo #635BFF, was valeria purple).
 *
 * XSS guard: content rendered via JSX text children — React auto-escapes.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import { cn } from "@/lib/utils";

import type { AgentSlug } from "@/lib/agent-catalog";

export interface MessageBubbleProps {
  role: "bot" | "user";
  content: string;
  time?: string;
  agent?: AgentSlug;
  footerLabel?: string;
  className?: string;
}

/**
 *
 */
export function MessageBubble({
  role,
  content,
  time,
  agent = DEFAULT_CHAT_AGENT,
  footerLabel,
  className,
}: MessageBubbleProps) {
  if (role === "bot") {
    const descriptor = AGENT_CATALOG[agent] ?? AGENT_CATALOG[DEFAULT_CHAT_AGENT];
    const label = footerLabel ?? descriptor.name;

    return (
      <div className={cn("flex flex-col gap-1 self-start max-w-[80%]", className)}>
        <div
          data-testid="msg-bubble"
          data-role="bot"
          className="bg-card border border-border text-foreground rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
        >
          {content}
        </div>
        {(time ?? label) ? (
          <span className="text-[10px] text-foreground/60 px-1">
            {time ? `${label} · ${time}` : label}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1 self-end max-w-[80%] items-end", className)}>
      <div
        data-testid="msg-bubble"
        data-role="user"
        className="bg-agent-luana text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
      >
        {content}
      </div>
      {time ? <span className="text-[10px] text-foreground/60 px-1">{time}</span> : null}
    </div>
  );
}
