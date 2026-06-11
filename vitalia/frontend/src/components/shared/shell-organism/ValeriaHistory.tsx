// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s5-TBD
"use client";

/**
 * ValeriaHistory — conversation history molecule
 * T-4 of vitalia-fase1-valeria-rail-history (F1-S5)
 *
 * Displays header with quick actions, search input with case-insensitive
 * filter, and grouped history items (Hoy / Ayer / Esta semana).
 * Shows EmptyStateInline when 0 matches.
 *
 * "use client" required: useState (searchQuery, activeId) + event handlers.
 *
 * spec: 01-spec.md § 3 ValeriaHistory estados + § 5 data flow filter logic + § 6 microcopy
 * arch: 03-arch.md § 2.5 ValeriaHistory
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — semantic tokens only.
 * HIPAA-lite: no-phi-scope — UI chrome only, mock data zero PHI.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { ChevronLeft, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_CONVERSATIONS } from "./_mock-conversations";
import { EmptyStateInline } from "./EmptyStateInline";
import { HistoryGroup } from "./HistoryGroup";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ValeriaHistoryProps {
  /** Quick action: create new conversation */
  onNewConversation?: () => void;
  /** Quick action: collapse history back to rail (setValeriaState('rail')) */
  onCollapseToRail?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * ValeriaHistory — conversation history molecule.
 * Client Component (state + event handlers).
 *
 * Filter logic:
 * - Case-insensitive match on conversation title
 * - Trim whitespace before comparing
 * - 0 matches → EmptyStateInline ('Sin resultados' / 'Intenta con otra palabra')
 * - Groups with 0 items are hidden (HistoryGroup renders null when items=[])
 *
 * Escape key in search input:
 * - If searchQuery non-empty → clear query + stopPropagation (prevents Valeria collapse)
 * - If searchQuery empty → propagate (Valeria may collapse via parent handler)
 */
export function ValeriaHistory({
  onNewConversation,
  onCollapseToRail,
}: ValeriaHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Default active item is id='1' per spec mockup
  const [activeId, setActiveId] = useState<string | null>("1");

  // Filter conversations by search query (case-insensitive, trimmed)
  const filtered = useMemo(
    () =>
      MOCK_CONVERSATIONS.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      ),
    [searchQuery],
  );

  // Group filtered conversations by time period
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
      // T-2 (vitalia-shell-core-hardening · 03-arch-fe § 6): ancho FIJO 260px que
      // EMPUJA en el split inline desktop (≥lg) — `shrink-0` evita que se comprima,
      // así el agente angosta en vez de que el historial pierda ancho. En el drawer
      // mobile (<lg) el historial se apila vertical sobre el chat → `w-full`.
      className="flex flex-col border-r border-border overflow-hidden h-full w-full lg:w-[260px] shrink-0"
    >
      {/* ── Header: título + quick actions ── */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Conversaciones
        </h3>
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

      {/* ── Search input ── */}
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
                // Clear search locally without propagating Escape to parent
                // (prevents Valeria collapse while input has focus + content)
                e.stopPropagation();
                setSearchQuery("");
              }
            }}
            className="w-full h-8 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {/* ── Scrollable list ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyStateInline
            heading="Sin resultados"
            description="Intenta con otra palabra"
          />
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
