/**
 * ThreadHeader — cabecera del thread de conversación.
 * F1-S10 vitalia-fase1-empty-states — T-6
 *
 * 2 estados controlados por handlerState:
 *   A "adrian": avatar + nombre + meta + chip "🤖 Adrián decidiendo" + botón "✋ Tomar el control" + × cerrar sidebar
 *   B "human":  avatar + nombre + meta + SOLO × cerrar sidebar (chip + botón takeover ocultos)
 *
 * Mockup parity: adrian-inbox-placeholder.html thead + takeover header section
 *
 * Client Component — botón "✋ Tomar el control" tiene callback onClick.
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — Tailwind semantic tokens only.
 * Spanish neutro — spec § 10 verbatim (copy ratificado Chris batch 2).
 *
 * F2 anchor: handlerState vendrá de Zustand `handlerOverride[leadId]`
 *   (features/adrian/store/inbox-store.ts). F1 local useState en InboxPlaceholder.
 *
 * spec_anchor: 03-arch.md § 3.3 + CONTEXT-BRIEF § 6 + 06-tickets.yaml T-6
 * downstream-regression-na: brand-local vitalia inbox; no cross-brand consumers
 */

"use client";

import { cn } from "@/lib/utils";
import { CHANNEL_ABBR, type ConversationListItem } from "./types";

export interface ThreadHeaderProps {
  /** Current conversation displayed in thread */
  conversation: ConversationListItem;
  /**
   * A = Adrián maneja (default): muestra chip + botón takeover.
   * B = usuario en control: solo muestra × cerrar sidebar.
   * F1 local useState; F2-S3 Zustand handlerOverride[leadId].
   */
  handlerState: "adrian" | "human";
  /** Callback — usuario toma el control (A→B). Spec § 10: "✋ Tomar el control" */
  onTakeControl: () => void;
  /** Callback — cerrar ContactSidebar */
  onCloseSidebar: () => void;
  className?: string;
}

/**
 * ThreadHeader — cabecera del panel de mensajes con estado takeover.
 * Client Component.
 */
export function ThreadHeader({
  conversation,
  handlerState,
  onTakeControl,
  onCloseSidebar,
  className,
}: ThreadHeaderProps) {
  const { displayName, channel } = conversation;
  const channelAbbr = CHANNEL_ABBR[channel];
  const isAdrian = handlerState === "adrian";

  // Initials helper (≤2 chars)
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <header
      aria-label={`Conversación con ${displayName}`}
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5",
        className,
      )}
    >
      {/* Left: avatar + info */}
      <div className="flex min-w-0 items-center gap-2.5">
        {/* Avatar — initials circle 28px */}
        <div
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-agent-adrian-soft text-[11px] font-semibold text-agent-adrian"
        >
          {initials}
        </div>

        {/* Name + meta */}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span
              className="rounded bg-agent-adrian-soft px-1 py-px text-[9px] font-bold text-agent-adrian"
              aria-label={`Canal: ${channel}`}
            >
              {channelAbbr}
            </span>
            <span aria-hidden="true">·</span>
            {/* PHI masked phone — visual only, hipaa-lite.md § F1 scope */}
            <span>+51 9** ***-4321</span>
          </div>
        </div>
      </div>

      {/* Right: actions (depend on handlerState) */}
      <div className="flex shrink-0 items-center gap-2">
        {/* State A only: chip + takeover button */}
        {isAdrian && (
          <>
            {/* Chip "🤖 Adrián decidiendo" */}
            <span
              aria-label="Adrián está manejando esta conversación"
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                "border-agent-adrian/40 bg-agent-adrian-soft text-agent-adrian",
              )}
            >
              🤖 Adrián decidiendo
            </span>

            {/* Botón "✋ Tomar el control" — spec § 10 verbatim */}
            <button
              type="button"
              onClick={onTakeControl}
              title="Tomar el control de esta conversación · Adrián pausará aquí (no afecta otras convs)"
              aria-label="Tomar el control de esta conversación · Adrián pausará aquí"
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-opacity",
                "bg-agent-adrian text-white hover:opacity-90 cursor-pointer",
              )}
            >
              ✋ Tomar el control
            </button>
          </>
        )}

        {/* Always visible: close sidebar button */}
        <button
          type="button"
          onClick={onCloseSidebar}
          aria-label="Cerrar panel de detalles"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded border border-border text-sm",
            "text-muted-foreground transition-colors hover:bg-muted cursor-pointer",
          )}
        >
          ×
        </button>
      </div>
    </header>
  );
}
