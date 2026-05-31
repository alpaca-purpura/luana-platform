// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * ChatHeader — header del panel de chat Luana.
 *
 * Port re-tematizado from vitalia/ChatHeader.tsx.
 * Re-themed: agent=DEFAULT_CHAT_AGENT ('luana'), statusDot uses success color,
 * mode pill "🤖 Modo agente", Luana avatar #635BFF.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import { cn } from "@/lib/utils";

import { agentBgClass } from "./_agent-tw-classes";

import type { AgentSlug } from "@/lib/agent-catalog";

export interface ChatHeaderProps {
  agent?: AgentSlug;
  status?: "online" | "offline";
  mode?: "agent" | "web";
  className?: string;
}

/**
 *
 */
export function ChatHeader({
  agent = DEFAULT_CHAT_AGENT,
  status = "online",
  mode = "agent",
  className,
}: ChatHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const descriptor = AGENT_CATALOG[agent] ?? AGENT_CATALOG[DEFAULT_CHAT_AGENT];

  const statusText = status === "online" ? `En línea · ${descriptor.role}` : "Desconectada";

  const modeLabel = mode === "agent" ? "🤖 Modo agente" : "🌐 Modo web";

  return (
    <header
      data-testid="chat-header"
      className={cn("flex items-center gap-3 border-b border-border px-4 h-14 shrink-0", className)}
    >
      {/* Avatar with status dot */}
      <div className="relative shrink-0">
        <div
          data-testid="luana-avatar"
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
          data-testid="luana-status-dot"
          className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-card"
          aria-hidden="true"
        />
      </div>

      {/* Name + status text */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground leading-tight truncate">
          {descriptor.name}
        </span>
        <span className="text-xs text-foreground/60 leading-tight truncate">{statusText}</span>
      </div>

      {/* Mode Pill */}
      <Badge variant="outline" data-testid="chat-mode-pill" className="shrink-0 text-[11px]">
        {modeLabel}
      </Badge>
    </header>
  );
}
