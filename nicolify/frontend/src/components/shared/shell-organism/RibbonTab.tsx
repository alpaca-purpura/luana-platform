// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-5
"use client";

/**
 * RibbonTab.tsx — Nicolify shell Ribbon tab molécula.
 *
 * Port re-tematizado de vitalia RibbonTab.tsx (F1-S7).
 * Renders a single agent tab in the Ribbon (abel/brenda/christian/sara/norvil).
 *
 * Active state: bg-agent-{slug}-soft tint + label font-semibold + agentBorderClass indicator.
 * Inactive state: transparent + text-muted-foreground + hover:bg-muted.
 *
 * Avatar fallback: si SVG 404 → <AvatarFallback> con initial sobre bg-agent-{slug}-soft.
 *
 * D17.1 cement: ambos spans con whitespace-nowrap → ribbon h-14 uniforme.
 * D17.2 cement: active:hover repite agentBgSoftClass para preservar tint vs hover:bg-muted.
 * D17.3 cement: shrink-0 sin min-w fijo — tabs orgánicos label-driven.
 *
 * A11y: role="tab" + aria-selected + tabIndex (roving tabindex) + focus-visible ring.
 *
 * spec_anchor: 01-spec.md § Bloque E (E1/E2/E4) · gherkin E1 E2 E4 F1
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import { agentBgSoftClass, agentBorderClass, type RibbonTabSlug } from "./_agent-tw-classes";
import { AGENT_CATALOG } from "@/lib/routing/shell-routes";
import { AgentAvatar } from "@/components/shared/agents/AgentAvatar";
import type { AgentSlug } from "@/lib/agent-catalog";

export interface RibbonTabProps {
  slug: RibbonTabSlug;
  active: boolean;
  tabIndex: 0 | -1;
  onClick: () => void;
  onFocus: () => void;
}

/**
 * RibbonTab — Nicolify shell ribbon tab (molécula).
 *
 * Renders Avatar + tabLabel + agent name.
 * Active: bg-agent-{slug}-soft + bottom border agentBorderClass + font-semibold.
 * Inactive: transparent + hover:bg-muted.
 * Avatar fallback: initial letter on bg-agent-{slug}-soft.
 */
export const RibbonTab = forwardRef<HTMLButtonElement, RibbonTabProps>(function RibbonTab(
  { slug, active, tabIndex, onClick, onFocus },
  ref,
) {
  const descriptor = AGENT_CATALOG[slug];

  // Agent avatar — slug must be cast to AgentSlug (RibbonTabSlug ⊂ AgentSlug for non-config)
  // config special case: no avatar shown (ConfigTab handles its own icon)
  const agentSlug = slug as AgentSlug;
  const thumbnailSrc = `/agents/${slug}/avatar.svg`;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={tabIndex}
      data-testid={`ribbon-tab-${slug}`}
      data-active={active ? "true" : "false"}
      onClick={onClick}
      onFocus={onFocus}
      className={cn(
        // Base layout — shrink-0 sin min-w (tabs orgánicos)
        "flex shrink-0 items-center gap-2 rounded-md px-4 text-sm transition-colors",
        // Active bottom border indicator
        active ? cn("border-b-2", agentBorderClass(slug)) : "border-b-2 border-transparent",
        // Focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        // Active vs inactive
        active
          ? cn(agentBgSoftClass(slug), "font-semibold text-foreground")
          : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <AgentAvatar
        slug={agentSlug}
        name={descriptor.name}
        initial={descriptor.name[0]}
        thumbnail={thumbnailSrc}
        size="sm"
        data-testid={`avatar-fallback-${slug}`}
      />
      {/* whitespace-nowrap en ambos spans garantiza ribbon h-14 uniforme */}
      <span className="flex flex-col items-start leading-tight whitespace-nowrap">
        <span className="whitespace-nowrap">{descriptor.tabLabel}</span>
        <span
          className={cn(
            "whitespace-nowrap text-[10px]",
            active ? "text-foreground/60" : "text-muted-foreground",
          )}
        >
          {descriptor.name}
        </span>
      </span>
    </button>
  );
});
