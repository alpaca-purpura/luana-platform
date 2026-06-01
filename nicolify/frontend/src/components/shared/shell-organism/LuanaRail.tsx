// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * LuanaRail — rail sidebar molecule (60px vertical icon rail).
 *
 * Port re-tematizado from vitalia/ValeriaRail.tsx.
 * Re-themed: Valeria→Luana, aria-labels updated.
 *
 * 4 MVP buttons only.
 * Each button: Button variant="ghost" size="icon" + Tooltip + Lucide icon.
 * Tooltips include keyboard hints.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { PanelLeftClose, PanelLeftOpen, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface LuanaRailProps {
  onToggleHistory: () => void;
  onNewConversation: () => void;
  onSearch: () => void;
  onCollapse: () => void;
  className?: string;
}

/**
 *
 */
export function LuanaRail({
  onToggleHistory,
  onNewConversation,
  onSearch,
  onCollapse,
  className,
}: LuanaRailProps) {
  return (
    <nav
      aria-label="Rail de Luana"
      className={cn(
        "flex w-[60px] shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-2",
        className,
      )}
    >
      {/* Toggle history */}
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

      {/* New conversation */}
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

      {/* Search */}
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

      {/* Spacer */}
      <div className="flex-1" aria-hidden="true" />

      {/* Collapse */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar Luana"
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
