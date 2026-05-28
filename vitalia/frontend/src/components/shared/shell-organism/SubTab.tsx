// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s8-TBD
"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { type SubTabMeta, type RibbonTabSlug } from "@/lib/agent-catalog";
import { agentBgSoftClass, agentTextClassSubTab } from "./_agent-tw-classes";

/** Props for SubTab molécula (F1-S8). */
export interface SubTabProps {
  /** Sub-tab descriptor (id, label, icon) from RIBBON_SUBTABS[agent]. */
  subtab: SubTabMeta;
  /**
   * Agent (or 'config') color context — determines active bg + text classes.
   * Uses RibbonTabSlug (AgentSlug | 'config') to include config tab.
   */
  color: RibbonTabSlug;
  /** Whether this sub-tab is currently active (URL-derived in SubTabsBar). */
  active: boolean;
  /**
   * Roving tabindex — 0 for focused tab in group, -1 for others.
   * Managed by parent SubTabsBar keyboard handler.
   * spec_anchor: 03-arch.md § 2.3 D21 + WAI-ARIA Authoring Practices Tabs pattern
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
 * SubTab — Vitalia shell molécula (F1-S8).
 *
 * Renders a single tab button in the horizontal sub-tabs bar (line 2 of shell navigation).
 * Composed into SubTabsBar organism which provides roving tabindex management.
 *
 * Active state: bg-agent-{slug}-soft + agentTextClassSubTab(color) + font-semibold
 * Inactive state: transparent + text-muted-foreground + hover:bg-muted + font-medium
 *
 * Lucas exception (D18): active → text-foreground (NOT text-agent-lucas — contrast issue)
 * Config exception (D19): active → bg-muted + text-foreground (neutral, not agent color)
 *
 * A11y:
 * - role="tab" + aria-selected + tabIndex (roving tabindex pattern verbatim from Ribbon)
 * - Emoji span aria-hidden="true" (decorative — label is the accessible name)
 * - focus-visible ring only (mouse clicks do not show ring)
 * - whitespace-nowrap on button prevents label wrapping in overflow scroll container
 *
 * spec_anchor: 01-spec.md § Componentes (SubTab) + § Estados visuales · 03-arch.md § 2.3
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */
export const SubTab = forwardRef<HTMLButtonElement, SubTabProps>(
  function SubTab({ subtab, color, active, tabIndex, onClick, onFocus }, ref) {
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
          // Base layout — Q4 cement: whitespace-nowrap HARD (label NO wrap)
          "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all whitespace-nowrap",
          // Focus ring — focus-visible only (keyboard nav, no mouse ring)
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          // Active vs inactive states
          active
            ? // Active state — D19: Config gets bg-muted neutral (not agent bg-soft)
              isConfig
              ? "bg-muted text-foreground font-semibold"
              : cn(
                  agentBgSoftClass(color as Exclude<RibbonTabSlug, "config">),
                  agentTextClassSubTab(color),
                  "font-semibold",
                )
            : // Inactive state — color-agnostic (same for all agents)
              "text-muted-foreground font-medium hover:bg-muted hover:text-foreground",
        )}
      >
        {/* Emoji icon — aria-hidden (decorative, label text is the accessible name) */}
        <span aria-hidden="true">{subtab.icon}</span>
        {/* Visible label */}
        <span>{subtab.label}</span>
      </button>
    );
  },
);
