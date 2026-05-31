// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-6
/**
 * EmptyState — molécula placeholder genérico.
 * nicolify-r0-shell T-6 — port from vitalia EmptyState.tsx, re-themed.
 *
 * Renders: emoji icon 5xl opacity-50 + h3 title + description max-w-md + optional CTA button.
 * Used by SubTabContent dispatcher for all R0 sub-tab empty-states.
 *
 * Server Component — no state, no effects.
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — semantic tokens only.
 *
 * spec_anchor: 01-spec.md § A5 (empty-states) + § Microcopy (copy nicolify tuteo)
 * gherkin_coverage: A1 A5
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Emoji icon displayed at 5xl size with reduced opacity. */
  icon: string;
  /** Heading text — Spanish neutro LatAm, tuteo (sin voseo). */
  title: string;
  /** Description text — max-w-md centered. */
  description: string;
  /** Optional CTA button label. */
  ctaLabel?: string;
  /** Optional CTA click handler. Required if ctaLabel is provided. */
  onCtaClick?: () => void;
  className?: string;
}

/**
 * EmptyState — centered icon + heading + description + optional CTA.
 * Server Component.
 */
export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}
      role="status"
      aria-live="polite"
      data-testid="empty-state"
    >
      {/* Emoji icon — aria-hidden (decorative, title is accessible name) */}
      <span
        data-testid="empty-state-icon"
        aria-hidden="true"
        className="text-5xl opacity-50 select-none"
      >
        {icon}
      </span>

      {/* Heading h3 */}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {/* Description */}
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>

      {/* Optional CTA */}
      {ctaLabel && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
