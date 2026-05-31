// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * DelegateMarker — italic centered marker showing agent handoff delegation.
 *
 * Port re-tematizado from vitalia/DelegateMarker.tsx.
 * Re-themed: vitalia agents→nicolify agents (AgentSlug import updated).
 *
 * CRITICAL (G3): uses _agent-tw-classes static lookup — NEVER template literals.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import { cn } from "@/lib/utils";

import { agentBgClass, agentTextClass } from "./_agent-tw-classes";

import type { AgentSlug } from "@/lib/agent-catalog";

export interface DelegateMarkerProps {
  fromAgent?: AgentSlug;
  toAgent: AgentSlug;
  mode?: string;
  className?: string;
}

/**
 *
 */
export function DelegateMarker({
  fromAgent: _fromAgent = DEFAULT_CHAT_AGENT,
  toAgent,
  mode = "Mantener",
  className,
}: DelegateMarkerProps) {
  const toDescriptor = AGENT_CATALOG[toAgent] ?? AGENT_CATALOG[DEFAULT_CHAT_AGENT];

  return (
    <div
      data-testid="msg-delegate"
      className={cn(
        "self-center text-xs italic text-foreground/60 flex items-center gap-1.5 py-1",
        className,
      )}
    >
      <span aria-hidden="true">→ delegando a</span>
      <span className="inline-flex items-center gap-1">
        <span
          className={cn(
            "h-4 w-4 rounded-full overflow-hidden flex items-center justify-center shrink-0",
            agentBgClass(toAgent),
          )}
          aria-hidden="true"
        >
          <img
            src={toDescriptor.thumbnail}
            alt=""
            className="h-4 w-4 object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                const span = document.createElement("span");
                span.className = "text-[8px] font-semibold text-white select-none";
                span.textContent = toDescriptor.initial;
                parent.appendChild(span);
              }
            }}
          />
        </span>
        <span className={cn("font-medium not-italic", agentTextClass(toAgent))}>
          {toDescriptor.name}
        </span>
      </span>
      <span className="text-foreground/60">(modo {mode})</span>
    </div>
  );
}
