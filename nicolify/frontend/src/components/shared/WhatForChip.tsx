// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * WhatForChip.tsx — "¿para qué sirve?" contextual chip (RN-4 field consumer catalog).
 *
 * Shows which downstream agent(s) consume a field or group of fields.
 * Helps the owner understand WHY they should fill in this data
 * (Brenda uses signals for targeting, Christian uses mainPain for outreach, etc.).
 *
 * Renders as a small chip with a tooltip listing the consuming agents.
 * Accessible: tooltip triggered by both hover and focus.
 *
 * Consumer catalog (from 03-arch-fe.md RN-4):
 *   - "abel"     — Abel (strategy: builds the ICP/offer angles)
 *   - "brenda"   — Brenda (targeting: uses signals/vertical for campaign filters)
 *   - "christian" — Christian (outreach: uses mainPain/salesAngle for SDR sequences)
 *   - "norvil"   — Norvil (retention: uses buyerJourney for account health)
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §7 WhatForChip + RN-4
 * validators_gate: RN-4 (field-consumer catalog)
 */

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Slugs of agents that can consume a field/group */
export type ConsumerAgent = "abel" | "brenda" | "christian" | "norvil" | "sara";

const AGENT_LABELS: Record<ConsumerAgent, string> = {
  abel: "Abel",
  brenda: "Brenda",
  christian: "Christian",
  norvil: "Norvil",
  sara: "Sara",
};

const AGENT_DESCRIPTIONS: Record<ConsumerAgent, string> = {
  abel: "usa este dato para definir ángulos de oferta",
  brenda: "usa este dato para filtros de segmentación en campañas",
  christian: "usa este dato para personalizar sus secuencias de prospección",
  norvil: "usa este dato para el seguimiento y salud de cuenta",
  sara: "usa este dato para gestionar el delivery del proyecto",
};

export interface WhatForChipProps {
  /** Agent(s) that consume this field/group */
  consumers: ConsumerAgent[];
  /** Optional field or group label for screen readers */
  fieldLabel?: string;
  /** Additional className for the chip */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * WhatForChip — contextual field consumer chip with tooltip.
 *
 * Shows which agents use this data, helping the owner understand the value
 * of filling in each field (RN-4 field consumer catalog).
 *
 * Usage:
 * ```tsx
 * <WhatForChip consumers={["brenda", "christian"]} fieldLabel="Señales de compra" />
 * ```
 */
export function WhatForChip({ consumers, fieldLabel, className }: WhatForChipProps) {
  if (consumers.length === 0) return null;

  const consumerLabels = consumers.map((c) => AGENT_LABELS[c]).join(", ");

  // Tooltip content: one bullet per consumer with description
  const tooltipContent = (
    <ul className="flex flex-col gap-1 text-xs">
      {consumers.map((agent) => (
        <li key={agent} className="flex items-start gap-1.5">
          <span className="font-medium">{AGENT_LABELS[agent]}:</span>
          <span className="text-muted-foreground">{AGENT_DESCRIPTIONS[agent]}.</span>
        </li>
      ))}
    </ul>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`¿Para qué sirve${fieldLabel ? ` ${fieldLabel}` : ""}? Usado por: ${consumerLabels}`}
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full",
            "text-xs text-muted-foreground/70 border border-border/50",
            "hover:bg-muted hover:text-foreground transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "cursor-help",
            className,
          )}
          data-testid="what-for-chip"
          tabIndex={0}
        >
          <span aria-hidden="true" className="text-[10px]">
            🔍
          </span>
          <span className="whitespace-nowrap">{consumerLabels}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-3" data-testid="what-for-chip-tooltip">
        <p className="text-xs font-medium mb-1.5">¿Para qué sirve este dato?</p>
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
