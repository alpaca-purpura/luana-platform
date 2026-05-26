/**
 * ConversationItem — molécula conversación inbox.
 * F1-S10 vitalia-fase1-empty-states — T-5
 *
 * Layout: avatar initials (32px) + flex-1 (nombre + lastActivityRelative) + badges row.
 * Visual flags:
 *   - selected → border-l-2 agent-adrian + bg-agent-adrian/5
 *   - handlerMode='human' && !selected → border-l-2 green-500 + YouChip
 *
 * Badges row: channel-abbr + stage-badge + (CampaignTag si campaign) + (YouChip si human-handled)
 *
 * Mockup parity: adrian-inbox-placeholder.html .conv-item styles
 *
 * Client Component — onClick callback + conditional classes.
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — Tailwind semantic tokens only.
 *
 * spec_anchor: 03-arch.md § 3.3 + CONTEXT-BRIEF § 5
 * downstream-regression-na: brand-local vitalia inbox; no cross-brand consumers
 */

"use client";

import { cn } from "@/lib/utils";
import { CampaignTag } from "./CampaignTag";
import { type ConversationListItem, STAGE_LABEL, CHANNEL_ABBR } from "./types";

// ── Channel color mapping ─────────────────────────────────────────────────────
/** Maps InboxChannel → Tailwind bg + text class pair for abbreviation badge */
const CHANNEL_CLASSES: Record<ConversationListItem["channel"], string> = {
  whatsapp: "bg-agent-adrian-soft text-agent-adrian",
  instagram: "bg-agent-camila-soft text-agent-camila",
  telegram: "bg-agent-adrian-soft text-agent-adrian",
} as const;

// ── Temp dot colors ──────────────────────────────────────────────────────────
const TEMP_DOT_CLASSES: Record<ConversationListItem["temp"], string> = {
  hot: "bg-red-500",
  warm: "bg-amber-500",
  cold: "bg-blue-500",
} as const;

// ── Helper: initials from display name ───────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

export interface ConversationItemProps {
  conversation: ConversationListItem;
  isSelected: boolean;
  onSelect: (leadId: string) => void;
}

/**
 * ConversationItem — single item in the ConversationList.
 * Handles selected + human-handled visual states.
 */
export function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  const {
    leadId,
    displayName,
    lastMessagePreview,
    lastActivityRelative,
    channel,
    temp,
    stage,
    handlerMode,
    campaign,
  } = conversation;

  const isHumanHandled = handlerMode === "human";
  const initials = getInitials(displayName);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Conversación con ${displayName} — ${STAGE_LABEL[stage]}`}
      onClick={() => onSelect(leadId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(leadId);
        }
      }}
      className={cn(
        // Base
        "relative cursor-pointer border-b border-border px-3 py-3 transition-colors",
        "hover:bg-muted/40",
        // Left border variants (selected takes priority over human)
        isSelected
          ? "border-l-2 border-l-agent-adrian bg-agent-adrian/5 pl-[10px]"
          : isHumanHandled
            ? "border-l-2 border-l-green-500 pl-[10px]"
            : "border-l-2 border-l-transparent",
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar — initials circle */}
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agent-adrian-soft text-[13px] font-semibold text-agent-adrian"
        >
          {initials}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name row + relative time */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
              {/* Temp dot */}
              <span
                aria-label={`Temperatura: ${temp}`}
                className={cn(
                  "inline-block h-2 w-2 shrink-0 rounded-full",
                  TEMP_DOT_CLASSES[temp],
                )}
              />
              <span className="truncate">{displayName}</span>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {lastActivityRelative}
            </span>
          </div>

          {/* Preview */}
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {lastMessagePreview}
          </p>

          {/* Badges row */}
          <div
            className="mt-1.5 flex flex-wrap items-center gap-1"
            aria-label="Metadatos de conversación"
          >
            {/* Channel abbreviation */}
            <span
              aria-label={`Canal: ${channel}`}
              className={cn(
                "rounded px-1 py-px text-[9px] font-bold",
                CHANNEL_CLASSES[channel],
              )}
            >
              {CHANNEL_ABBR[channel]}
            </span>

            {/* Stage badge */}
            <span className="rounded bg-muted px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              {STAGE_LABEL[stage]}
            </span>

            {/* Campaign tag (optional) */}
            {campaign && (
              <CampaignTag
                campaignId={campaign.id}
                campaignName={campaign.name}
                variant="list"
              />
            )}

            {/* YouChip — only when human-handled */}
            {isHumanHandled && <YouChip />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── YouChip sub-component ─────────────────────────────────────────────────────

/**
 * YouChip — inline indicator shown when handler_mode='human'.
 * "✋ Tú" — font-size 9px, green bg/border.
 * Tooltip: "Tomaste el control · Adrián pausado en esta conversación"
 */
function YouChip() {
  return (
    <span
      title="Tomaste el control · Adrián pausado en esta conversación"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-px",
        "border-green-500/50 bg-green-100/30 text-[9px] font-bold text-green-700",
        "dark:text-green-300",
      )}
    >
      ✋ Tú
    </span>
  );
}
