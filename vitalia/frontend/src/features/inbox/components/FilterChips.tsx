"use client";
/**
 * FilterChips.tsx — Filter chip bar for the conversation list.
 *
 * Chip groups per 01-spec-extract.md § 4:
 *   Primary (always visible):
 *     [✕ Todas] [WhatsApp] [Instagram] [Email]
 *     [Activa] [Esperando depósito] [NPS pendiente] [Cerradas]
 *     [🔴 Adrián pide ayuda] [📎 Audio/imagen sin abrir]
 *   Collapsible under "Más filtros ▼":
 *     Stage (Etapa), Modo Adrián, Período
 *
 * Single-active per dimension: channel, status, stage, mode, period are mutually-exclusive
 * per group. helpNeeded + unreadMedia are boolean toggles.
 * Clicking ✕ Todas resets all filters.
 *
 * Props are controlled (value/onChange) — URL state managed by ConversationListPanel.
 *
 * "use client" required for useState (expanded toggle).
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { useState } from "react";
import { cn } from "@/lib/cn";
import { INBOX_COPY } from "../copy";
import type {
  InboxChannelFilter,
  InboxStatusFilter,
  InboxStageFilter,
  InboxModeFilter,
  InboxPeriodFilter,
} from "../url-state";

/** Full filter state shape (mirrors InboxUrlState minus `lead` and `search`) */
export interface FilterChipsValue {
  channel: InboxChannelFilter | null;
  status: InboxStatusFilter | null;
  stage: InboxStageFilter | null;
  mode: InboxModeFilter | null;
  period: InboxPeriodFilter | null;
  helpNeeded: boolean | null;
  unreadMedia: boolean | null;
}

interface FilterChipsProps {
  value: FilterChipsValue;
  onChange: (next: FilterChipsValue) => void;
  className?: string;
}

const EMPTY_FILTERS: FilterChipsValue = {
  channel: null,
  status: null,
  stage: null,
  mode: null,
  period: null,
  helpNeeded: null,
  unreadMedia: null,
};

/** Generic chip button */
function Chip({
  label,
  active,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full",
        "px-3 py-1 text-xs font-medium transition-colors",
        "border focus-visible:outline focus-visible:outline-2",
        "focus-visible:outline-offset-2 focus-visible:vt-outline-primary",
        active
          ? "vt-bg-primary vt-text-primary-foreground vt-border-primary"
          : "vt-bg-surface vt-text-muted vt-border",
        "hover:opacity-90",
        className
      )}
    >
      {label}
    </button>
  );
}

/**
 * FilterChips — horizontal chip bar with collapsible advanced filters.
 * Single-active per dimension (channel / status / stage / mode / period).
 * Boolean toggles for helpNeeded + unreadMedia.
 */
export function FilterChips({ value, onChange, className }: FilterChipsProps) {
  const [expanded, setExpanded] = useState(false);

  const hasAnyFilter =
    value.channel !== null ||
    value.status !== null ||
    value.stage !== null ||
    value.mode !== null ||
    value.period !== null ||
    value.helpNeeded !== null ||
    value.unreadMedia !== null;

  function toggle<K extends keyof FilterChipsValue>(
    key: K,
    val: FilterChipsValue[K]
  ) {
    onChange({
      ...value,
      [key]: value[key] === val ? null : val,
    });
  }

  return (
    <div
      className={cn("flex flex-col gap-1.5", className)}
      role="group"
      aria-label="Filtros de conversaciones"
    >
      {/* Primary chips row */}
      <div className="flex flex-wrap gap-1.5 px-3">
        {/* Todas — reset all */}
        <Chip
          label={INBOX_COPY.filters.all}
          active={!hasAnyFilter}
          onClick={() => onChange(EMPTY_FILTERS)}
        />

        {/* Channel chips */}
        <Chip
          label={INBOX_COPY.filters.channels.whatsapp}
          active={value.channel === "whatsapp"}
          onClick={() => toggle("channel", "whatsapp")}
        />
        <Chip
          label={INBOX_COPY.filters.channels.instagram}
          active={value.channel === "instagram"}
          onClick={() => toggle("channel", "instagram")}
        />
        <Chip
          label={INBOX_COPY.filters.channels.email}
          active={value.channel === "email"}
          onClick={() => toggle("channel", "email")}
        />
      </div>

      {/* Status chips row */}
      <div className="flex flex-wrap gap-1.5 px-3">
        <Chip
          label={INBOX_COPY.filters.status.active}
          active={value.status === "active"}
          onClick={() => toggle("status", "active")}
        />
        <Chip
          label={INBOX_COPY.filters.status.waitingDeposit}
          active={value.status === "waiting-deposit"}
          onClick={() => toggle("status", "waiting-deposit")}
        />
        <Chip
          label={INBOX_COPY.filters.status.npsPending}
          active={value.status === "nps-pending"}
          onClick={() => toggle("status", "nps-pending")}
        />
        <Chip
          label={INBOX_COPY.filters.status.closed}
          active={value.status === "closed"}
          onClick={() => toggle("status", "closed")}
        />
      </div>

      {/* Boolean highlight chips row */}
      <div className="flex flex-wrap gap-1.5 px-3">
        <Chip
          label={INBOX_COPY.filters.helpNeeded}
          active={value.helpNeeded === true}
          onClick={() =>
            onChange({
              ...value,
              helpNeeded: value.helpNeeded === true ? null : true,
            })
          }
        />
        <Chip
          label={INBOX_COPY.filters.unreadMedia}
          active={value.unreadMedia === true}
          onClick={() =>
            onChange({
              ...value,
              unreadMedia: value.unreadMedia === true ? null : true,
            })
          }
        />

        {/* More/Less filters toggle */}
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          aria-expanded={expanded}
          aria-controls="advanced-filters"
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-full",
            "px-3 py-1 text-xs font-medium vt-text-muted vt-border vt-bg-surface",
            "hover:opacity-90 transition-colors",
            "focus-visible:outline focus-visible:outline-2",
            "focus-visible:outline-offset-2 focus-visible:vt-outline-primary"
          )}
        >
          {expanded
            ? INBOX_COPY.filters.lessFilters
            : INBOX_COPY.filters.moreFilters}
          <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* Collapsible advanced filters */}
      {expanded && (
        <div
          id="advanced-filters"
          className="flex flex-col gap-1.5 px-3 pb-2"
        >
          {/* Stage filter */}
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-xs font-medium vt-text-muted">
              {INBOX_COPY.filters.stage.label}:
            </span>
            <Chip
              label={INBOX_COPY.filters.stage.interested}
              active={value.stage === "interested"}
              onClick={() => toggle("stage", "interested")}
            />
            <Chip
              label={INBOX_COPY.filters.stage.considering}
              active={value.stage === "considering"}
              onClick={() => toggle("stage", "considering")}
            />
            <Chip
              label={INBOX_COPY.filters.stage.readyToBook}
              active={value.stage === "ready-to-book"}
              onClick={() => toggle("stage", "ready-to-book")}
            />
            <Chip
              label={INBOX_COPY.filters.stage.decidedNo}
              active={value.stage === "decided-no"}
              onClick={() => toggle("stage", "decided-no")}
            />
          </div>

          {/* Mode Adrián filter */}
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-xs font-medium vt-text-muted">
              {INBOX_COPY.filters.mode.label}:
            </span>
            <Chip
              label={INBOX_COPY.filters.mode.adrianDecide}
              active={value.mode === "adrian-decide"}
              onClick={() => toggle("mode", "adrian-decide")}
            />
            <Chip
              label={INBOX_COPY.filters.mode.adrianConsulta}
              active={value.mode === "adrian-consulta"}
              onClick={() => toggle("mode", "adrian-consulta")}
            />
            <Chip
              label={INBOX_COPY.filters.mode.yoEscribo}
              active={value.mode === "yo-escribo"}
              onClick={() => toggle("mode", "yo-escribo")}
            />
          </div>

          {/* Period filter */}
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-xs font-medium vt-text-muted">
              {INBOX_COPY.filters.period.label}:
            </span>
            <Chip
              label={INBOX_COPY.filters.period.today}
              active={value.period === "today"}
              onClick={() => toggle("period", "today")}
            />
            <Chip
              label={INBOX_COPY.filters.period.yesterday}
              active={value.period === "yesterday"}
              onClick={() => toggle("period", "yesterday")}
            />
            <Chip
              label={INBOX_COPY.filters.period.week}
              active={value.period === "week"}
              onClick={() => toggle("period", "week")}
            />
            <Chip
              label={INBOX_COPY.filters.period.month}
              active={value.period === "month"}
              onClick={() => toggle("period", "month")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
