// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * LuanaHistory — conversation history molecule.
 *
 * Port re-tematizado from vitalia/ValeriaHistory.tsx.
 * Re-themed: Valeria→Luana, aria-labels updated to Nicolify B2B context.
 *
 * Uses _mock-conversations.ts (no API real hasta R1).
 * Filter: case-insensitive search on title. 0 matches → EmptyStateInline.
 * Groups: Hoy / Ayer / Esta semana.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { ChevronLeft, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { MOCK_CONVERSATIONS } from "./_mock-conversations";
import { EmptyStateInline } from "./EmptyStateInline";
import { HistoryGroup } from "./HistoryGroup";

export interface LuanaHistoryProps {
  onNewConversation?: () => void;
  onCollapseToRail?: () => void;
}

/**
 *
 */
export function LuanaHistory({ onNewConversation, onCollapseToRail }: LuanaHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>("1");

  const filtered = useMemo(
    () =>
      MOCK_CONVERSATIONS.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      ),
    [searchQuery],
  );

  const grouped = useMemo(
    () => ({
      today: filtered.filter((c) => c.group === "today"),
      yesterday: filtered.filter((c) => c.group === "yesterday"),
      this_week: filtered.filter((c) => c.group === "this_week"),
    }),
    [filtered],
  );

  return (
    <nav
      aria-label="Historial conversaciones"
      className="flex flex-col border-r border-border overflow-hidden h-full"
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Conversaciones</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Nueva conversación"
            onClick={onNewConversation}
            className="h-7 w-7"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Colapsar a barra"
            onClick={onCollapseToRail}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Search input */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Buscar conversación"
            placeholder="Buscar conversación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && searchQuery) {
                e.stopPropagation();
                setSearchQuery("");
              }
            }}
            className="w-full h-8 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyStateInline heading="Sin resultados" description="Intenta con otra palabra" />
        ) : (
          <>
            <HistoryGroup
              label="Hoy"
              items={grouped.today}
              activeId={activeId}
              onItemClick={setActiveId}
            />
            <HistoryGroup
              label="Ayer"
              items={grouped.yesterday}
              activeId={activeId}
              onItemClick={setActiveId}
            />
            <HistoryGroup
              label="Esta semana"
              items={grouped.this_week}
              activeId={activeId}
              onItemClick={setActiveId}
            />
          </>
        )}
      </div>
    </nav>
  );
}
