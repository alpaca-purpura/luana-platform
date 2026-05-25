"use client";

/**
 * DelegateMarker — italic centered marker showing agent handoff delegation.
 *
 * D4 spec: "→ delegando a [pill AgentName] (modo Mantener)"
 * Format: italic centered text-xs with agent thumbnail pill + mode label.
 *
 * spec_anchor: 01-spec.md § 0 D4 + § 3 DelegateMarker · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 *
 * CRITICAL Tailwind dynamic class names: uses explicit switch/map (no template literals).
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { cn } from "@/lib/utils";
import type { AgentSlug } from "@/lib/agent-catalog";
import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import { agentBgClass, agentTextClass } from "./_agent-tw-classes";

export interface DelegateMarkerProps {
  /** Agent that is delegating. */
  fromAgent?: AgentSlug;
  /** Agent receiving the delegation. */
  toAgent: AgentSlug;
  /** Mode label — e.g. 'Mantener', 'Reactivar', 'Multiplicar'. */
  mode?: string;
  className?: string;
}

/**
 * DelegateMarker — centered italic delegation marker.
 *
 * Renders: → delegando a [thumbnail] AgentName (modo {mode})
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
        "self-center text-xs italic text-muted-foreground flex items-center gap-1.5 py-1",
        className,
      )}
    >
      <span aria-hidden="true">→ delegando a</span>
      <span className="inline-flex items-center gap-1">
        {/* Agent thumbnail mini-circle */}
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
              // Fallback: show initial letter
              const target = e.currentTarget as HTMLImageElement;
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
      <span className="text-muted-foreground">(modo {mode})</span>
    </div>
  );
}
