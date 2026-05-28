// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s5-TBD
"use client";

/**
 * ValeriaRail — rail sidebar molecule (60px vertical icon rail)
 * T-3 of vitalia-fase1-valeria-rail-history (F1-S5)
 *
 * 4 MVP buttons only. F2 buttons (anclados/tareas/notas) completely hidden per D5.
 * Each button: Button variant="ghost" size="icon" + Tooltip (Radix via Shadcn) + Lucide icon.
 * Tooltips include keyboard hints per spec § 6 microcopy.
 *
 * "use client" required: event handlers (onClick).
 *
 * spec: 01-spec.md § 0 D5 + § 6 · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — semantic tokens only per arch test test_no_hardcoded_colors.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { PanelLeftClose, PanelLeftOpen, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ValeriaRailProps {
  /** Opens history panel — sets valeriaState('full') in parent */
  onToggleHistory: () => void;
  /** Creates new conversation — alert mock (F2 real) */
  onNewConversation: () => void;
  /** Focuses composer — Cmd+K target */
  onSearch: () => void;
  /** Collapses sidebar + sets shellMode('web') — auto-coupling D2 */
  onCollapse: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ValeriaRail — 60px vertical navigation rail with 4 MVP buttons.
 * Client Component (event handlers).
 * F2 extended buttons (anclados/tareas/notas) are NOT rendered (hidden completely per D5).
 */
export function ValeriaRail({
  onToggleHistory,
  onNewConversation,
  onSearch,
  onCollapse,
  className,
}: ValeriaRailProps) {
  return (
    <nav
      aria-label="Rail de Valeria"
      className={cn(
        "flex w-[60px] shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-2",
        className,
      )}
    >
      {/* Toggle history — PanelLeftOpen */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mostrar historial"
            data-tooltip="Mostrar historial · f"
            onClick={onToggleHistory}
            className="h-9 w-9"
          >
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Mostrar historial · f
        </TooltipContent>
      </Tooltip>

      {/* New conversation — Plus */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Nueva conversación"
            data-tooltip="Nueva conversación · n"
            onClick={onNewConversation}
            className="h-9 w-9"
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Nueva conversación · n
        </TooltipContent>
      </Tooltip>

      {/* Search / focus composer — Search */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Buscar (Cmd+K)"
            data-tooltip="Buscar · ⌘K"
            onClick={onSearch}
            className="h-9 w-9"
          >
            <Search className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Buscar · ⌘K
        </TooltipContent>
      </Tooltip>

      {/* Spacer — pushes collapse button to bottom */}
      <div className="flex-1" aria-hidden="true" />

      {/* Collapse / close — PanelLeftClose */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar Valeria"
            data-tooltip="Cerrar · c"
            onClick={onCollapse}
            className="h-9 w-9"
          >
            <PanelLeftClose className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Cerrar · c
        </TooltipContent>
      </Tooltip>
    </nav>
  );
}
