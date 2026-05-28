// cap: shell-organism.shell-vitalia
// atomics: TBD
// story-origin: vitalia-fase1-s6-TBD
"use client";

/**
 * ChatHeader — molécula header del panel de chat Valeria.
 *
 * Evoluciona ValeriaChatSlot placeholder F1-S5: preserva avatar+name+status dot,
 * agrega Mode Pill "🤖 Modo agente" right-aligned + status text largo (D1 spec).
 *
 * spec_anchor: 01-spec.md § 0 D1+D9 + § 2 ChatHeader · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 *
 * LIFT CANDIDATE: cross-brand chat header atom. Second brand consumer triggers
 * /pm-luana promotion proposal for core/@luana/shell-chat-organism/.
 *
 * Renders img with onError fallback (requires 'use client' — useState).
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AgentSlug } from "@/lib/agent-catalog";
import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import { Badge } from "@/components/ui/badge";
import { agentBgClass } from "./_agent-tw-classes";

export interface ChatHeaderProps {
  /** Agent slug. Default: DEFAULT_CHAT_AGENT ('valeria'). */
  agent?: AgentSlug;
  status?: "online" | "offline";
  mode?: "agent" | "web";
  className?: string;
}

/**
 * ChatHeader — renders agent avatar, name, status text, and Mode Pill.
 *
 * Avatar has onError fallback showing initial letter in agent color circle.
 * Status dot is decorative (aria-hidden).
 * Mode Pill uses Shadcn Badge variant="outline".
 */
export function ChatHeader({
  agent = DEFAULT_CHAT_AGENT,
  status = "online",
  mode = "agent",
  className,
}: ChatHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const descriptor = AGENT_CATALOG[agent] ?? AGENT_CATALOG[DEFAULT_CHAT_AGENT];

  const statusText =
    status === "online" ? `En línea · ${descriptor.role}` : "Desconectada";

  const modeLabel = mode === "agent" ? "🤖 Modo agente" : "🌐 Modo web";

  return (
    <header
      data-testid="chat-header"
      className={cn(
        "flex items-center gap-3 border-b border-border px-4 h-14 shrink-0",
        className,
      )}
    >
      {/* Avatar 9×9 con status dot */}
      <div className="relative shrink-0">
        <div
          data-testid="valeria-avatar"
          className={cn(
            "h-9 w-9 rounded-full overflow-hidden flex items-center justify-center",
            agentBgClass(agent),
          )}
          aria-hidden="true"
        >
          {imgError ? (
            <span className="text-sm font-semibold text-white select-none">
              {descriptor.initial}
            </span>
          ) : (
            <img
              src={descriptor.thumbnail}
              alt=""
              className="h-9 w-9 object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <span
          data-testid="valeria-status-dot"
          className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-vitalia-success ring-2 ring-card"
          aria-hidden="true"
        />
      </div>

      {/* Name + status text */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground leading-tight truncate">
          {descriptor.name}
        </span>
        {/* a11y SC-6: text-foreground/60 ≥4.5:1 contrast; text-muted-foreground (3.4:1 light) fails wcag2aa at 12px */}
        <span className="text-xs text-foreground/60 leading-tight truncate">
          {statusText}
        </span>
      </div>

      {/* Mode Pill — Shadcn Badge variant outline */}
      <Badge
        variant="outline"
        data-testid="chat-mode-pill"
        className="shrink-0 text-[11px]"
      >
        {modeLabel}
      </Badge>
    </header>
  );
}
