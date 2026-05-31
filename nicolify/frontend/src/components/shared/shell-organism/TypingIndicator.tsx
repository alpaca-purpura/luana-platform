// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * TypingIndicator — rich typing bubble with agent name + action text + 3 animated dots.
 *
 * Port re-tematizado from vitalia/TypingIndicator.tsx.
 * Re-themed: Valeria→Luana, vitalia agents→nicolify agents.
 *
 * CRITICAL (G3): uses _agent-tw-classes static lookup — NEVER template literals.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import { cn } from "@/lib/utils";

import { agentBgSoftClass, agentTextClass, agentDotBgClass } from "./_agent-tw-classes";

import type { AgentSlug } from "@/lib/agent-catalog";

export interface TypingIndicatorProps {
  agent?: AgentSlug;
  text?: string;
  className?: string;
}

/**
 *
 */
export function TypingIndicator({
  agent = DEFAULT_CHAT_AGENT,
  text,
  className,
}: TypingIndicatorProps) {
  const descriptor = AGENT_CATALOG[agent] ?? AGENT_CATALOG[DEFAULT_CHAT_AGENT];
  const actionText = text ?? `${descriptor.name} está escribiendo…`;

  const namePrefix = `${descriptor.name} `;
  const hasNamePrefix = actionText.startsWith(namePrefix);
  const namePart = hasNamePrefix ? descriptor.name : "";
  const restPart = hasNamePrefix ? actionText.slice(namePrefix.length) : actionText;

  return (
    <div className={cn("flex flex-col gap-1 self-start max-w-[80%]", className)}>
      <div
        data-testid="msg-thinking"
        data-agent={agent}
        className={cn(
          "rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed flex items-center gap-2",
          agentBgSoftClass(agent),
        )}
      >
        {namePart ? (
          <span className={cn("font-medium", agentTextClass(agent))}>{namePart}</span>
        ) : null}
        <span className="text-foreground/80">{restPart}</span>
        <span className="flex items-end gap-0.5 ml-1" aria-hidden="true">
          <span className={cn("typing-dot h-1.5 w-1.5 rounded-full", agentDotBgClass(agent))} />
          <span className={cn("typing-dot h-1.5 w-1.5 rounded-full", agentDotBgClass(agent))} />
          <span className={cn("typing-dot h-1.5 w-1.5 rounded-full", agentDotBgClass(agent))} />
        </span>
      </div>
    </div>
  );
}
