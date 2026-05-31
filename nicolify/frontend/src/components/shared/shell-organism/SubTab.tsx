// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-5
"use client";

/**
 * SubTab.tsx — Nicolify shell sub-tab molécula.
 *
 * Port re-tematizado de vitalia SubTab.tsx (F1-S8).
 * Renders a single tab button in the horizontal sub-tabs bar (line 2 of shell navigation).
 * Composed into SubTabsBar organism which provides roving tabindex management.
 *
 * Active state: bg-agent-{slug}-soft + agentTextClassSubTab(color) + font-semibold
 * Inactive state: transparent + text-muted-foreground + hover:bg-muted + font-medium
 *
 * Config exception: active → bg-muted + text-foreground (neutral, not agent color)
 *
 * A11y:
 * - role="tab" + aria-selected + tabIndex (roving tabindex pattern)
 * - Emoji span aria-hidden="true" (decorative — label is the accessible name)
 * - focus-visible ring only (mouse clicks do not show ring)
 * - whitespace-nowrap prevents label wrapping in overflow scroll container
 *
 * spec_anchor: 01-spec.md § Bloque E · gherkin E2 E5 F1
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import type { SubTabMeta } from "@/lib/routing/shell-routes";
import { agentBgSoftClass, agentTextClassSubTab, type RibbonTabSlug } from "./_agent-tw-classes";

/** Props for SubTab molécula. */
export interface SubTabProps {
  /** Sub-tab descriptor (id, label, icon) from AGENT_SUBTABS[agent]. */
  subtab: SubTabMeta;
  /**
   * Agent (or 'config') color context — determines active bg + text classes.
   * Uses RibbonTabSlug to include config tab case.
   */
  color: RibbonTabSlug;
  /** Whether this sub-tab is currently active (URL-derived in SubTabsBar). */
  active: boolean;
  /**
   * Roving tabindex — 0 for focused tab in group, -1 for others.
   * Managed by parent SubTabsBar keyboard handler.
   */
  tabIndex: 0 | -1;
  /** Click handler — parent SubTabsBar calls router.push. */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * Focus handler — parent SubTabsBar uses to sync focusedIdx state
   * when Tab key or programmatic focus lands on this subtab.
   */
  onFocus: React.FocusEventHandler<HTMLButtonElement>;
}

/**
 * SubTab — Nicolify shell sub-tab molécula.
 */
export const SubTab = forwardRef<HTMLButtonElement, SubTabProps>(function SubTab(
  { subtab, color, active, tabIndex, onClick, onFocus },
  ref,
) {
  const isConfig = color === "config";

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={tabIndex}
      data-testid={`sub-tab-${subtab.id}`}
      data-active={active ? "true" : "false"}
      data-color={color}
      onClick={onClick}
      onFocus={onFocus}
      className={cn(
        // Base layout — whitespace-nowrap HARD (label NO wrap)
        "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all whitespace-nowrap",
        // Focus ring — focus-visible only (keyboard nav, no mouse ring)
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        // Active vs inactive states
        // Separated to avoid nested ternary (sonarjs/no-nested-conditional)
        !active && "text-muted-foreground font-medium hover:bg-muted hover:text-foreground",
        active && isConfig && "bg-muted text-foreground font-semibold",
        active &&
          !isConfig &&
          cn(agentBgSoftClass(color), agentTextClassSubTab(color), "font-semibold"),
      )}
    >
      {/* Emoji icon — aria-hidden (decorative, label text is the accessible name) */}
      <span aria-hidden="true">{subtab.icon}</span>
      {/* Visible label */}
      <span>{subtab.label}</span>
    </button>
  );
});
