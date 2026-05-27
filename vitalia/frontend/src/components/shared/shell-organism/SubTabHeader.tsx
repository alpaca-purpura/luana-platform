/**
 * SubTabHeader — molécula h2 + descripción + CTA right-aligned.
 * F1-S10 vitalia-fase1-empty-states — T-1
 *
 * Renders the top header area of each sub-tab view:
 *   h2 with icon emoji + label (from SubTabMeta) + optional description + optional right-aligned CTA.
 *
 * Server Component — purely presentational, no state.
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 03-arch.md § 3.2 #3
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { cn } from "@/lib/utils";
import type { SubTabMeta, RibbonTabSlug } from "@/lib/agent-catalog";

export interface SubTabHeaderProps {
  /** Agent slug — used for accessible context. */
  agent: RibbonTabSlug;
  /** Current subtab slug. */
  subtab: string;
  /** SubTabMeta from RIBBON_SUBTABS — provides icon + label. */
  meta?: SubTabMeta;
  /** Optional description text below the heading. */
  description?: string;
  /** Optional CTA label rendered right-aligned. */
  ctaLabel?: string;
  /** Optional CTA click handler. */
  onCtaClick?: () => void;
  className?: string;
}

/**
 * SubTabHeader — section heading for sub-tab content area.
 * Server Component.
 */
export function SubTabHeader({
  agent,
  subtab,
  meta,
  description,
  ctaLabel,
  onCtaClick,
  className,
}: SubTabHeaderProps) {
  const label = meta?.label ?? subtab;
  const icon = meta?.icon;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 pb-4 border-b border-border mb-6",
        className,
      )}
      data-testid={`subtab-header-${agent}-${subtab}`}
    >
      {/* Heading + description */}
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          {icon && (
            <span aria-hidden="true" className="text-base select-none">
              {icon}
            </span>
          )}
          <span>{label}</span>
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground max-w-lg">
            {description}
          </p>
        )}
      </div>

      {/* Optional right-aligned CTA */}
      {ctaLabel && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
