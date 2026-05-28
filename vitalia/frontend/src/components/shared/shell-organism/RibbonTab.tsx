// cap: shell-organism.shell-vitalia
// atomics: TBD
// story-origin: vitalia-fase1-s7-TBD
"use client";

import { forwardRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AGENT_CATALOG, type AgentSlug } from "@/lib/agent-catalog";
import { agentBgSoftClass } from "./_agent-tw-classes";
import { cn } from "@/lib/utils";

export interface RibbonTabProps {
  slug: AgentSlug;
  active: boolean;
  tabIndex: 0 | -1;
  onClick: () => void;
  onFocus: () => void;
}

/**
 * RibbonTab — Vitalia shell molécula (F1-S7).
 *
 * Botón tab agente con Avatar + tabLabel + role label.
 * Active state: bg-agent-{slug}-soft tint + label font-semibold.
 * Inactive state: transparent + text-muted-foreground + hover:bg-muted.
 *
 * Avatar fallback: si PNG 404 → <AvatarFallback> con initial letter sobre bg-agent-{slug}-soft.
 *
 * D17.1 (Q15 cement): ambos spans tienen whitespace-nowrap para garantizar ribbon h-14 uniforme.
 * D17.2 (Q16 cement): active:hover repite agentBgSoftClass(slug) para preservar tint vs hover:bg-muted.
 * D17.3 (Q14 cement): shrink-0 sin min-w fijo — tabs orgánicos label-driven.
 * D18 (A11y cement): sub-label span usa text-foreground/60 en active para WCAG AA contrast sobre bg-agent-*-soft.
 *
 * spec_anchor: 01-spec.md § Estados visuales · 03-arch.md § 2.3 D12-D17.3
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */
export const RibbonTab = forwardRef<HTMLButtonElement, RibbonTabProps>(
  function RibbonTab({ slug, active, tabIndex, onClick, onFocus }, ref) {
    const descriptor = AGENT_CATALOG[slug];

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
          // base layout — Q14: shrink-0 sin min-w (tabs orgánicos)
          "flex shrink-0 items-center gap-2 rounded-md px-4 text-sm transition-colors",
          // focus ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          // active vs inactive
          // Q16 cement: active:hover repite agentBgSoftClass para preservar tint
          active
            ? cn(
                agentBgSoftClass(slug),
                "font-semibold text-foreground",
                `hover:${agentBgSoftClass(slug)}`,
              )
            : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Avatar className="size-7 shrink-0" aria-hidden="true">
          <AvatarImage src={descriptor.thumbnail} alt="" />
          <AvatarFallback
            className={cn(agentBgSoftClass(slug), "text-foreground")}
            data-testid={`avatar-fallback-${slug}`}
          >
            {descriptor.initial}
          </AvatarFallback>
        </Avatar>
        {/* Q15 cement: whitespace-nowrap en ambos spans garantiza ribbon h-14 uniforme */}
        {/* A11y cement: sub-label usa text-foreground/60 cuando active para WCAG AA contrast sobre bg-agent-*-soft */}
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
  },
);
