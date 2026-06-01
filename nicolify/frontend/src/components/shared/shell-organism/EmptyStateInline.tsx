// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
/**
 * EmptyStateInline — inline empty state atom (search no results)
 *
 * Port verbatim from vitalia/EmptyStateInline.tsx. No brand-specific changes needed.
 * Server Component — purely presentational.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { Search } from "lucide-react";

export interface EmptyStateInlineProps {
  heading: string;
  description: string;
}

/**
 *
 */
export function EmptyStateInline({ heading, description }: EmptyStateInlineProps) {
  return (
    <div
      data-testid="history-empty-state"
      className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"
        aria-hidden="true"
      >
        <Search className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{heading}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
