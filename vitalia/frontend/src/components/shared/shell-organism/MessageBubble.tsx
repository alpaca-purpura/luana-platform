"use client";

/**
 * MessageBubble — chat bubble atom for bot/user messages.
 *
 * spec_anchor: 01-spec.md § 0 D7 + § 2-3 MessageBubble · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 *
 * LIFT CANDIDATE: cross-brand chat atom. Second brand consumer triggers
 * /pm-luana promotion proposal for core/@luana/shell-chat-organism/.
 *
 * XSS guard: content rendered via JSX text children — React auto-escapes.
 * NEVER dangerouslySetInnerHTML.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { cn } from "@/lib/utils";
import type { AgentSlug } from "@/lib/agent-catalog";
import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";

export interface MessageBubbleProps {
  role: "bot" | "user";
  content: string;
  time?: string;
  /** Agent slug for bot messages — determines footer label. Default: DEFAULT_CHAT_AGENT */
  agent?: AgentSlug;
  /** Override footer label (e.g. 'Camila (via Valeria)'). If not provided, uses agent name. */
  footerLabel?: string;
  className?: string;
}

/**
 * MessageBubble — renders a single chat message bubble.
 *
 * Bot: left-aligned, bg-card with border, footer "AgentName · HH:MM"
 * User: right-aligned, bg-agent-valeria text-white, footer "HH:MM"
 *
 * Content is rendered as JSX text children (React auto-escapes — XSS safe).
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
    const descriptor =
      AGENT_CATALOG[agent] ?? AGENT_CATALOG[DEFAULT_CHAT_AGENT];
    const label = footerLabel ?? descriptor.name;

    return (
      <div
        className={cn("flex flex-col gap-1 self-start max-w-[80%]", className)}
      >
        <div
          data-testid="msg-bubble"
          data-role="bot"
          className="bg-card border border-border text-foreground rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
        >
          {content}
        </div>
        {(time ?? label) ? (
          /* a11y SC-6: text-foreground/60 ≥4.5:1 contrast; text-muted-foreground (3.4:1 light) fails wcag2aa */
          <span className="text-[10px] text-foreground/60 px-1">
            {time ? `${label} · ${time}` : label}
          </span>
        ) : null}
      </div>
    );
  }

  // role === 'user'
  return (
    <div
      className={cn(
        "flex flex-col gap-1 self-end max-w-[80%] items-end",
        className,
      )}
    >
      <div
        data-testid="msg-bubble"
        data-role="user"
        className="bg-agent-valeria text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
      >
        {content}
      </div>
      {time ? (
        /* a11y SC-6: text-foreground/60 ≥4.5:1 contrast; text-muted-foreground fails wcag2aa at 10px */
        <span className="text-[10px] text-foreground/60 px-1">{time}</span>
      ) : null}
    </div>
  );
}
