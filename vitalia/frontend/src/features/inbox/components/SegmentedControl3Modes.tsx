// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
"use client";

/**
 * SegmentedControl3Modes.tsx — 3-state segmented control for Adrián handler mode.
 *
 * Maps UI segment values to API mode:
 *   "adrian-decide"  → handler_mode="ai"    + proposal_required=false
 *   "adrian-consulta"→ handler_mode="ai"    + proposal_required=true
 *   "yo-escribo"     → handler_mode="human" + proposal_required=false
 *
 * OCC: Passes conversation.updated_at as If-Match ETag via useModeToggle.
 * On 409 conflict: optimistic rollback + caller shows conflict toast.
 *
 * Accessibility: role="radiogroup" container + role="radio" buttons + aria-checked.
 * INP < 200ms: optimistic update via useModeToggle (no waiting for server).
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { INBOX_COPY } from "../copy";
import { cn } from "@/lib/cn";
import type { SegmentedModeValue } from "../hooks/use-mode-toggle";

interface SegmentedControl3ModesProps {
  /** Current segment value (derived from conversation.handler_mode + proposal_required) */
  value: SegmentedModeValue;
  /** Called when user selects a new segment */
  onChange: (value: SegmentedModeValue) => void;
  /** Whether a mode change mutation is in-flight */
  isPending?: boolean;
  /** Whether the last mutation resulted in a 409 OCC conflict */
  isConflict?: boolean;
  className?: string;
}

/** Ordered segment definitions for rendering */
const SEGMENTS: Array<{ value: SegmentedModeValue; label: string }> = [
  { value: "adrian-decide", label: INBOX_COPY.segmentedMode.adrianDecide },
  { value: "adrian-consulta", label: INBOX_COPY.segmentedMode.adrianConsulta },
  { value: "yo-escribo", label: INBOX_COPY.segmentedMode.yoEscribo },
];

/**
 * SegmentedControl3Modes — inline 3-state toggle for conversation handler mode.
 * Uses role="radiogroup" / role="radio" pattern for accessibility (WCAG 2.1 AA).
 */
export function SegmentedControl3Modes({
  value,
  onChange,
  isPending = false,
  isConflict = false,
  className,
}: SegmentedControl3ModesProps) {
  return (
    <div
      role="radiogroup"
      aria-label={INBOX_COPY.segmentedMode.ariaLabel}
      data-testid="segmented-control-3-modes"
      data-conflict={isConflict ? "true" : undefined}
      className={cn(
        "inline-flex items-center rounded-lg border vt-border overflow-hidden",
        isConflict && "ring-2 ring-red-400",
        className,
      )}
    >
      {SEGMENTS.map((seg) => {
        const isActive = seg.value === value;
        return (
          <button
            key={seg.value}
            role="radio"
            aria-checked={isActive}
            data-testid={`segment-${seg.value}`}
            disabled={isPending}
            onClick={() => {
              if (!isActive) onChange(seg.value);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-[var(--vitalia-cian)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isActive
                ? "vt-bg-primary/12 vt-text-primary font-semibold"
                : "vt-bg-surface vt-text-muted hover:vt-bg-muted",
            )}
          >
            {isActive && (
              <span aria-hidden="true" className="mr-1">
                ◉
              </span>
            )}
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
