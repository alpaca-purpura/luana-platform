/**
 * NPSTagBadge — NPS score category badge.
 *
 * Category colors per design-system.md:
 *   - Detractor (0-6): danger red (vitalia-danger)
 *   - Passive (7-8): warning yellow (vitalia-warning)
 *   - Promoter (9-10): success green (vitalia-success)
 *
 * All colors via vt-* CSS classes from globals.css (no hsl literals in TSX).
 */

import { cn } from "@/lib/cn";

export type NpsCategory = "detractor" | "passive" | "promoter";

export interface NPSTagBadgeProps {
  /** NPS score (0-10), or null if not yet recorded */
  score: number | null | undefined;
  /** Additional CSS classes */
  className?: string;
}

function getNpsCategory(score: number): NpsCategory {
  if (score <= 6) return "detractor";
  if (score <= 8) return "passive";
  return "promoter";
}

const CATEGORY_LABEL: Record<NpsCategory, string> = {
  detractor: "Detractor",
  passive: "Pasivo",
  promoter: "Promotor",
};

/** CSS classes from globals.css — no hsl() literals here */
const CATEGORY_STYLES: Record<NpsCategory, string> = {
  detractor: "vt-bg-danger-12 vt-text-danger vt-border-danger-30",
  passive:   "vt-bg-warning-12 vt-text-warning vt-border-warning-30",
  promoter:  "vt-bg-success-12 vt-text-success vt-border-success-30",
};

/**
 * NPS category badge with score and label.
 */
export function NPSTagBadge({ score, className }: NPSTagBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium",
          "rounded-[var(--radius-pill)] border",
          "vt-bg-muted vt-text-faint vt-border",
          className
        )}
        aria-label="NPS: sin datos"
      >
        Sin NPS
      </span>
    );
  }

  const clampedScore = Math.max(0, Math.min(10, Math.round(score)));
  const category = getNpsCategory(clampedScore);
  const label = CATEGORY_LABEL[category];

  return (
    <span
      data-nps-category={category}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold",
        "rounded-[var(--radius-pill)] border",
        CATEGORY_STYLES[category],
        className
      )}
      aria-label={`NPS ${clampedScore}: ${label}`}
    >
      <span aria-hidden="true">{clampedScore}</span>
      <span>{label}</span>
    </span>
  );
}
