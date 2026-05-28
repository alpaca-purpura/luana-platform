// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s5-TBD
/**
 * EmptyStateInline — inline empty state atom (search no results)
 * T-3 of vitalia-fase1-valeria-rail-history (F1-S5)
 *
 * Server Component — purely presentational.
 * Renders: icon circle (bg-muted + Search Lucide muted) + heading h3 + description p.
 *
 * spec: 01-spec.md § 5 + SC-6 · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — semantic tokens only.
 * LIFT CANDIDATE: generic presentational, cross-brand when 2nd consumer.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { Search } from "lucide-react";

export interface EmptyStateInlineProps {
  /** Heading text, e.g. 'Sin resultados' */
  heading: string;
  /** Description text, e.g. 'Intenta con otra palabra' */
  description: string;
}

/**
 * EmptyStateInline — search empty state with icon, heading and description.
 * Server Component.
 */
export function EmptyStateInline({
  heading,
  description,
}: EmptyStateInlineProps) {
  return (
    <div
      data-testid="history-empty-state"
      className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Icon circle */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"
        aria-hidden="true"
      >
        <Search className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Heading */}
      <h3 className="text-sm font-medium text-foreground">{heading}</h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
