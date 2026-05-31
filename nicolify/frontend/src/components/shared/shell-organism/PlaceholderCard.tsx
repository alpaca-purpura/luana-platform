// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-6
/**
 * PlaceholderCard — card skeleton placeholder for R0 empty sub-tabs.
 * nicolify-r0-shell T-6 — port from vitalia PlaceholderCard.tsx, re-themed.
 *
 * Renders a muted skeleton card with an icon, title, and description.
 * Used inside EmptyState CTAs or as content-area placeholders.
 *
 * Server Component — no state, no effects.
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 01-spec.md § A5 (empty-states all sub-tabs)
 * gherkin_coverage: A5
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { cn } from "@/lib/utils";

export interface PlaceholderCardProps {
  /** Emoji or icon character. */
  icon?: string;
  /** Card title. */
  title: string;
  /** Card description. */
  description?: string;
  className?: string;
}

/**
 * PlaceholderCard — muted skeleton card for R0 placeholder content.
 * Server Component.
 */
export function PlaceholderCard({
  icon = "📄",
  title,
  description,
  className,
}: PlaceholderCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/30 p-6",
        "flex flex-col gap-2",
        className,
      )}
      aria-hidden="true"
      data-testid="placeholder-card"
    >
      {icon && (
        <span className="text-2xl opacity-50" aria-hidden="true">
          {icon}
        </span>
      )}
      <h4 className="text-sm font-medium text-foreground opacity-60">{title}</h4>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
