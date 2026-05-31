// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-5
"use client";

/**
 * SubSubTab.tsx — Nicolify shell N3-static sub-sub-tab button.
 *
 * Port re-tematizado from vitalia SubSubTabsBar.tsx inline button (vitalia-fase2-lisa-marca T-4).
 * Extracted to standalone component per FSD-Lite one-component-per-file rule.
 *
 * Used by SubSubTabsBar when AGENT_SUBSUBTABS catalog has entries for agent.subtab combo.
 * In R0: AGENT_SUBSUBTABS is empty → SubSubTabsBar returns null → this component never mounts.
 * Will be used in R1+ when N3-static routes are added.
 *
 * ADR-nicolify-001 v1.1: SubSubTabsBar is a HEADER bar (NOT Shadcn <Tabs> body).
 * ANTI-PATTERN: NEVER use Shadcn <Tabs> internas to group sub-secciones.
 *
 * Named export (NO default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import type { SubSubTabMeta } from "@/lib/routing/shell-routes";

export interface SubSubTabProps {
  subsubtab: SubSubTabMeta;
  active: boolean;
  tabIndex: 0 | -1;
  onClick: () => void;
  onFocus: () => void;
}

/**
 * SubSubTab — Nicolify shell N3-static sub-sub-tab button molécula.
 *
 * Active: bg-muted + text-foreground + font-medium.
 * Inactive: text-muted-foreground + hover:text-foreground + hover:bg-muted/50.
 */
export const SubSubTab = forwardRef<HTMLButtonElement, SubSubTabProps>(function SubSubTab(
  { subsubtab, active, tabIndex, onClick, onFocus },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={active}
      aria-current={active ? "page" : undefined}
      tabIndex={tabIndex}
      data-testid={`sub-sub-tab-${subsubtab.id}`}
      onClick={onClick}
      onFocus={onFocus}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        active
          ? "font-medium bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      )}
    >
      <span aria-hidden="true">{subsubtab.icon}</span>
      <span>{subsubtab.label}</span>
    </button>
  );
});
