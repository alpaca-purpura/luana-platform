// cap: shell-organism.shell-vitalia
// atomics: TBD
// story-origin: vitalia-fase1-s7-TBD
"use client";

import { forwardRef } from "react";
import { Settings } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ConfigTabProps {
  active: boolean;
  tabIndex: 0 | -1;
  onClick: () => void;
  onFocus: () => void;
}

/**
 * ConfigTab — Vitalia shell molécula (F1-S7).
 *
 * IconButton 40x40 right-aligned (`ml-auto`) con icon ⚙ Settings (Lucide).
 * Active state: bg-muted + ring-1 ring-border + data-active="true".
 * Inactive: bg-muted + text-muted-foreground.
 * Hover inactive: bg-muted/80 + text-foreground + Tooltip "Configurar" visible.
 * Focus visible: ring-2 ring-ring ring-offset-1.
 *
 * Q13 cement: role="tab" + aria-selected como peer del tablist en Ribbon.
 *   ConfigTab es el 6º tab del WAI-ARIA tablist junto a los 5 RibbonTabs de agente.
 *   Keyboard End key aterriza aquí; ArrowLeft desde Lisa wrappea a ConfigTab.
 *
 * D20: size-10 (40x40) — NO Shadcn Button size="icon" (size-9=36px conflict).
 * D21: ml-auto right-align en flex container del Ribbon.
 * D22: aria-label="Configurar" mandatory (sin texto visible → screen reader).
 *
 * spec_anchor: 01-spec.md § Estados visuales ConfigTab · 03-arch.md § 2.4 D18-D22
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */
export const ConfigTab = forwardRef<HTMLButtonElement, ConfigTabProps>(
  function ConfigTab({ active, tabIndex, onClick, onFocus }, ref) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="tab"
            aria-label="Configurar"
            aria-selected={active}
            tabIndex={tabIndex}
            data-testid="ribbon-config-tab"
            data-active={active ? "true" : "false"}
            onClick={onClick}
            onFocus={onFocus}
            className={cn(
              "ml-auto inline-flex size-10 shrink-0 items-center justify-center self-center rounded-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              active
                ? "bg-muted text-foreground ring-1 ring-border"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <Settings className="size-5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          Configurar
        </TooltipContent>
      </Tooltip>
    );
  },
);
