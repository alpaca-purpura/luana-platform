// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-core-hardening
"use client";

/**
 * ValeriaCollapsedStrip — state-A tira-avatar (~44px vertical strip).
 * vitalia-shell-core-hardening — T-3
 *
 * Rendered at the left edge when Valeria is CLOSED (state A, valeriaOpen='closed').
 * Replaces the retired ValeriaRail (60px icon rail). Behaviour-fidelity, not pixel:
 *   - REAL Valeria avatar (catalog asset /agents/valeria/thumbnail.png, NOT a "V"
 *     placeholder) with onError → initial fallback (same pattern as ChatHeader).
 *   - decorative status dot (aria-hidden).
 *   - "Valeria" label (vertical, hover-discoverable affordance).
 *   - whole strip is one <button aria-label="Abrir a Valeria"> → openValeria()
 *     reopens to B (chat-only, no history · RN-12 / SC-5). focus-visible ring.
 *
 * "use client" required: onClick + img onError useState.
 *
 * spec: 03-arch-fe.md § 4 · 01-spec.md § Microcopy (Tira avatar — "Abrir a Valeria")
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — semantic tokens only.
 * HIPAA-lite: no-phi-scope — shell chrome, no PHI.
 *
 * LIFT CANDIDATE: net-new collapsed-agent strip; second-brand consumer triggers
 * /pm-luana promotion proposal for core/@luana/shell-chat-organism/.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { useState } from "react";
import { AGENT_CATALOG } from "@/lib/agent-catalog";
import { useShellStore } from "@/stores/shell-store";
import { cn } from "@/lib/utils";
import { agentBgClass } from "./_agent-tw-classes";

export interface ValeriaCollapsedStripProps {
  className?: string;
}

const VALERIA = AGENT_CATALOG.valeria;

/**
 * ValeriaCollapsedStrip — 44px vertical tira-avatar for state A.
 * Click reopens Valeria into chat (chat-only, history stays closed · RN-12).
 */
export function ValeriaCollapsedStrip({
  className,
}: ValeriaCollapsedStripProps) {
  const [imgError, setImgError] = useState(false);
  const openValeria = useShellStore((s) => s.openValeria);

  return (
    <button
      type="button"
      aria-label="Abrir a Valeria"
      data-testid="valeria-collapsed-strip"
      onClick={openValeria}
      className={cn(
        "group flex w-11 shrink-0 flex-col items-center gap-3 border-r border-border bg-card py-3",
        "transition-colors hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        className,
      )}
    >
      {/* Avatar 7×7 con status dot — REAL catalog asset, onError → initial */}
      <span className="relative shrink-0">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center overflow-hidden rounded-full",
            agentBgClass("valeria"),
          )}
          aria-hidden="true"
        >
          {imgError ? (
            <span className="text-xs font-semibold text-white select-none">
              {VALERIA.initial}
            </span>
          ) : (
            <img
              src={VALERIA.thumbnail}
              alt=""
              className="h-7 w-7 object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </span>
        <span
          data-testid="valeria-strip-status-dot"
          className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-vitalia-success ring-2 ring-card"
          aria-hidden="true"
        />
      </span>

      {/* Vertical "Valeria" label — hover-discoverable */}
      <span
        className="text-xs font-medium tracking-wide text-foreground/70 [writing-mode:vertical-rl] rotate-180 group-hover:text-foreground"
        aria-hidden="true"
      >
        {VALERIA.name}
      </span>
    </button>
  );
}
