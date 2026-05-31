// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-5
"use client";
/**
 * SubSubTabsBar.tsx — Nicolify shell N3-static sub-sub-tabs navigation bar.
 *
 * Port re-tematizado de vitalia SubSubTabsBar.tsx (vitalia-fase2-lisa-marca T-4).
 *
 * Renders the third navigation level when the current agent.subtab combo has
 * entries in AGENT_SUBSUBTABS catalog (shell-routes.ts).
 *
 * ADR reference: ADR-nicolify-001 § N3-static SubSubTabsBar pattern.
 * ANTI-PATTERN GUARD: This component renders a HEADER bar (NOT Shadcn <Tabs> body).
 * Never use Shadcn <Tabs> internas to group sub-secciones — Nivel 4 anti-pattern.
 *
 * In R0: AGENT_SUBSUBTABS is empty → SubSubTabsBar returns null for ALL routes.
 * Will render in R1+ when N3-static routing entries are added.
 *
 * URL pattern: /{tenantId}/{agent}/{subtab}/{subsubtab}
 * Active subsubtab derived from URL segment [3] — no client state needed beyond focus.
 *
 * Returns null when:
 * - No valid agent/subtab from URL
 * - AGENT_SUBSUBTABS has no entry for the current agent.subtab combo
 *
 * Named export (NO default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 *
 * spec_anchor: ADR-nicolify-001 § N3-static · gherkin (placeholder, empty in R0)
 */

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";

import {
  AGENT_SUBSUBTABS,
  extractAgentFromPath,
  extractSubtabFromPath,
  type SubSubTabMeta,
} from "@/lib/routing/shell-routes";

import { SubSubTab } from "./SubSubTab";

/**
 * Extracts the sub-sub-tab segment [3] from the pathname.
 * Pattern: /{tenantId}/{agent}/{subtab}/{subsubtab}/... → returns {subsubtab}
 * Returns null if insufficient segments.
 */
function extractSubSubTabFromPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  // segments[0]=tenantId, [1]=agent, [2]=subtab, [3]=subsubtab
  return segments[3] ?? null;
}

/**
 * SubSubTabsBar — horizontal N3-static navigation strip (line 3 of shell).
 *
 * Appears between SubTabsBar and page content when the current agent.subtab has
 * sub-sub-tab entries in AGENT_SUBSUBTABS catalog.
 * Returns null for all other agent.subtab combos (including all R0 routes).
 */
export function SubSubTabsBar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ tenantId: string }>();

  // URL-derived state — single source of truth
  const activeAgent = extractAgentFromPath(pathname);
  const activeSubtab = extractSubtabFromPath(pathname);
  const activeSubSubTab = extractSubSubTabFromPath(pathname);

  // Sub-sub-tabs for current agent.subtab combo (null if not N3-static)
  const subsubtabsKey: `${string}.${string}` | null =
    activeAgent && activeSubtab ? `${activeAgent}.${activeSubtab}` : null;
  const subsubtabs: readonly SubSubTabMeta[] | null = subsubtabsKey
    ? (AGENT_SUBSUBTABS[subsubtabsKey] ?? null)
    : null;

  // Initial focused index: index of active sub-sub-tab, or 0
  const initialFocusIdx = (() => {
    if (!activeSubSubTab || !subsubtabs || subsubtabs.length === 0) return 0;
    const idx = subsubtabs.findIndex((t) => t.id === activeSubSubTab);
    return idx >= 0 ? idx : 0;
  })();

  const [focusedIdx, setFocusedIdx] = useState<number>(initialFocusIdx);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const totalTabs = subsubtabs?.length ?? 0;

  // Navigate to a specific sub-sub-tab
  const navigateTo = useCallback(
    (subsubtabId: string) => {
      const tenantId = params?.tenantId;
      if (!tenantId || !activeAgent || !activeSubtab) return;
      router.push(`/${tenantId}/${activeAgent}/${activeSubtab}/${subsubtabId}`);
    },
    [params, router, activeAgent, activeSubtab],
  );

  // Move focus to idx (circular modulo-safe wrap)
  const focusTab = useCallback(
    (idx: number) => {
      if (totalTabs === 0) return;
      const safeIdx = ((idx % totalTabs) + totalTabs) % totalTabs;
      setFocusedIdx(safeIdx);
      tabRefs.current[safeIdx]?.focus();
    },
    [totalTabs],
  );

  // Keyboard handler on <nav> — events bubble up from child buttons
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          focusTab(focusedIdx + 1);
          return;
        case "ArrowLeft":
          e.preventDefault();
          focusTab(focusedIdx - 1);
          return;
        case "Home":
          e.preventDefault();
          focusTab(0);
          return;
        case "End":
          e.preventDefault();
          focusTab(totalTabs - 1);
          return;
        case "Enter":
        case " ": {
          e.preventDefault();
          if (subsubtabs) {
            const focused = subsubtabs[focusedIdx];
            if (focused) {
              navigateTo(focused.id);
            }
          }
          return;
        }
        default:
          break;
      }
    },
    [focusedIdx, focusTab, navigateTo, subsubtabs, totalTabs],
  );

  // Return null when no sub-sub-tabs for this agent.subtab combo (ALL R0 routes)
  if (!subsubtabs || subsubtabs.length === 0) {
    return null;
  }

  return (
    <nav
      role="tablist"
      aria-label="Sub-secciones de la pestaña actual"
      data-testid="sub-sub-tabs-bar"
      onKeyDown={handleKeyDown}
      className="min-h-[38px] bg-background border-b border-border/50 flex items-center px-6 gap-0.5 overflow-x-auto"
    >
      {subsubtabs.map((subsubtab, idx) => (
        <SubSubTab
          key={subsubtab.id}
          ref={(el) => {
            tabRefs.current[idx] = el;
          }}
          subsubtab={subsubtab}
          active={activeSubSubTab === subsubtab.id}
          tabIndex={focusedIdx === idx ? 0 : -1}
          onClick={() => navigateTo(subsubtab.id)}
          onFocus={() => setFocusedIdx(idx)}
        />
      ))}
    </nav>
  );
}
