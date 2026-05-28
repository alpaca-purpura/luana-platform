// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s8-TBD
"use client";
/**
 * SubTabsBar.tsx — Shell-organism sub-tabs navigation bar (line 2, F1-S8)
 *
 * Roving tabindex WAI-ARIA tablist pattern (verbatim from Ribbon.tsx F1-S7):
 * - Only one sub-tab has tabIndex=0 at a time (the focused one)
 * - Arrow keys move focus without activating navigation
 * - Enter/Space activate (router.push to /{tenant}/{agent}/{subtab})
 * - Keyboard handler on <nav> element (events bubble from child buttons)
 *
 * URL-derived state:
 * - activeAgent from extractAgentFromPath(pathname) — determines which sub-tabs to render
 * - activeSubtab from extractSubtabFromPath(pathname) — determines active SubTab
 *
 * Q5 cement: if activeAgent is null OR subtabs is empty → return null total.
 * Q4 cement: container className includes min-h-[42px].
 *
 * aria-label: "Sub-secciones {agentName}" — dynamic per active agent (Spanish neutro).
 * Special case: config → "Sub-secciones Configuración" (not "Sub-secciones undefined").
 *
 * Named export (NO default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 *
 * spec_anchor: 01-spec.md § Gherkin SC-1..SC-9 + § Wireframe + § Accessibility
 *              03-arch.md § 2.4 + § 6 · Q4/Q5 cement
 */

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import {
  AGENT_CATALOG,
  RIBBON_SUBTABS,
  extractAgentFromPath,
  extractSubtabFromPath,
  type RibbonTabSlug,
} from "@/lib/agent-catalog";
import { SubTab } from "./SubTab";

/** Spanish neutro aria-label per agent slug (or config). */
function getAriaLabel(slug: RibbonTabSlug): string {
  if (slug === "config") return "Sub-secciones Configuración";
  return `Sub-secciones ${AGENT_CATALOG[slug].name}`;
}

/**
 * SubTabsBar — horizontal sub-tabs navigation bar (line 2 of shell).
 *
 * Renders sub-tabs for the currently active agent, derived from the URL.
 * Returns null when:
 * - No valid agent segment in pathname (extractAgentFromPath returns null)
 * - Active agent is 'mateo' (transversal — empty sub-tabs array)
 *
 * Roving tabindex initialization:
 * - If pathname has a matching subtab, focusedIdx starts at that subtab's index.
 * - Otherwise focusedIdx starts at 0 (first sub-tab).
 */
export function SubTabsBar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ tenantId: string }>();

  // URL-derived state — single source of truth
  const activeAgent: RibbonTabSlug | null = extractAgentFromPath(pathname);
  const activeSubtab: string | null = extractSubtabFromPath(pathname);

  // Subtabs for the active agent (or empty if mateo / invalid)
  const subtabs =
    activeAgent !== null ? (RIBBON_SUBTABS[activeAgent] ?? []) : [];

  // Initial focused index: index of active subtab, or 0
  const initialFocusIdx = (() => {
    if (!activeSubtab || subtabs.length === 0) return 0;
    const idx = subtabs.findIndex((t) => t.id === activeSubtab);
    return idx >= 0 ? idx : 0;
  })();

  const [focusedIdx, setFocusedIdx] = useState<number>(initialFocusIdx);

  // Refs array for roving tabindex imperative focus management
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const totalTabs = subtabs.length;

  // Navigate to a specific subtab
  const navigateTo = useCallback(
    (subtabId: string) => {
      const tenantId = params?.tenantId;
      if (!tenantId || !activeAgent) return;
      router.push(`/${tenantId}/${activeAgent}/${subtabId}`);
    },
    [params, router, activeAgent],
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
          const focused = subtabs[focusedIdx];
          if (focused) {
            navigateTo(focused.id);
          }
          return;
        }
        default:
          break;
      }
    },
    [focusedIdx, focusTab, navigateTo, subtabs, totalTabs],
  );

  // Q5 cement: return null total when no active agent or no subtabs (mateo has [])
  if (activeAgent === null || subtabs.length === 0) {
    return null;
  }

  return (
    <nav
      role="tablist"
      aria-label={getAriaLabel(activeAgent)}
      data-testid="sub-tabs-bar"
      onKeyDown={handleKeyDown}
      className="min-h-[42px] bg-card border-b border-border flex items-center px-4 gap-1 overflow-x-auto"
    >
      {subtabs.map((subtab, idx) => (
        <SubTab
          key={subtab.id}
          ref={(el) => {
            tabRefs.current[idx] = el;
          }}
          subtab={subtab}
          color={activeAgent}
          active={activeSubtab === subtab.id}
          tabIndex={focusedIdx === idx ? 0 : -1}
          onClick={() => navigateTo(subtab.id)}
          onFocus={() => setFocusedIdx(idx)}
        />
      ))}
    </nav>
  );
}
