// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s6-TBD
"use client";

/**
 * TypingIndicator — rich typing bubble with agent name + action text + 3 animated dots.
 *
 * D5 spec: rich indicator showing "{Agent} está {acción}" instead of generic "typing…".
 * CSS keyframe `.typing-dot` defined in globals.css (added by T-1).
 *
 * spec_anchor: 01-spec.md § 0 D5 + § 3 TypingIndicator · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 *
 * CRITICAL Tailwind dynamic class names: uses explicit AGENT_BG_SOFT map (no template literals).
 * Tailwind JIT cannot detect dynamically constructed class names.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { cn } from "@/lib/utils";
import type { AgentSlug } from "@/lib/agent-catalog";
import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import {
  agentBgSoftClass,
  agentTextClass,
  agentDotBgClass,
} from "./_agent-tw-classes";

export interface TypingIndicatorProps {
  /** Agent that is typing. Default: DEFAULT_CHAT_AGENT. */
  agent?: AgentSlug;
  /** Override the action text (e.g. "está abriendo Voz del paciente").
   *  If omitted: uses "{AgentName} está escribiendo…" */
  text?: string;
  className?: string;
}

/**
 * TypingIndicator — renders a rich typing bubble.
 *
 * Layout:
 *   [agent-soft bg bubble]
 *     <AgentName> <actionText> [...animated dots]
 *
 * Dots animated via CSS @keyframes typing-dot (nth-child delays in globals.css).
 * aria-hidden on dots (decorative animation).
 */
export function TypingIndicator({
  agent = DEFAULT_CHAT_AGENT,
  text,
  className,
}: TypingIndicatorProps) {
  const descriptor = AGENT_CATALOG[agent] ?? AGENT_CATALOG[DEFAULT_CHAT_AGENT];
  const actionText = text ?? `${descriptor.name} está escribiendo…`;

  // Split action text: if it starts with agent name, show name bold + rest normal
  // e.g. "Camila está abriendo Voz del paciente"
  const namePrefix = descriptor.name + " ";
  let namePart = descriptor.name;
  let restPart = actionText;

  if (actionText.startsWith(namePrefix)) {
    restPart = actionText.slice(namePrefix.length);
  } else {
    // text prop is custom — show as-is without name highlighting
    namePart = "";
    restPart = actionText;
  }

  return (
    <div
      className={cn("flex flex-col gap-1 self-start max-w-[80%]", className)}
    >
      <div
        data-testid="msg-thinking"
        data-agent={agent}
        className={cn(
          "rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed flex items-center gap-2",
          agentBgSoftClass(agent),
        )}
      >
        {namePart ? (
          <span className={cn("font-medium", agentTextClass(agent))}>
            {namePart}
          </span>
        ) : null}
        {/* a11y SC-6: text-foreground/80 gives ≥4.5:1 contrast on agent-soft bg in both light+dark.
         * text-muted-foreground (240 4% 46% = ~#737378 on white = 3.4:1) fails wcag2aa. */}
        <span className="text-foreground/80">{restPart}</span>
        <span className="flex items-end gap-0.5 ml-1" aria-hidden="true">
          <span
            className={cn(
              "typing-dot h-1.5 w-1.5 rounded-full",
              agentDotBgClass(agent),
            )}
          />
          <span
            className={cn(
              "typing-dot h-1.5 w-1.5 rounded-full",
              agentDotBgClass(agent),
            )}
          />
          <span
            className={cn(
              "typing-dot h-1.5 w-1.5 rounded-full",
              agentDotBgClass(agent),
            )}
          />
        </span>
      </div>
    </div>
  );
}
