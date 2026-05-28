// cap: shell-organism.shell-vitalia
// atomics: TBD
// story-origin: vitalia-fase1-s7-TBD
"use client";
/**
 * Ribbon.tsx — Shell-organism navigation ribbon (tablist)
 * F1-S7 T-3 vitalia-fase1-ribbon-6-tabs
 *
 * Roving tabindex WAI-ARIA tablist pattern:
 * - Only one tab has tabIndex=0 at a time (the focused one)
 * - Arrow keys move focus without activating navigation
 * - Enter/Space activate (navigate)
 * - Keyboard handler lives on the <nav> element (events bubble from child buttons)
 *
 * URL-derived active state via extractAgentFromPath(usePathname()) — single source of truth.
 * Named export (NO default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import {
  AGENT_CATALOG,
  AGENT_RIBBON_ORDER,
  extractAgentFromPath,
  type RibbonTabSlug,
} from "@/lib/agent-catalog";
import { RibbonTab } from "./RibbonTab";
import { ConfigTab } from "./ConfigTab";

export function Ribbon() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ tenantId: string }>();

  // URL-derived active state — single source of truth
  const activeSlug: RibbonTabSlug | null = extractAgentFromPath(pathname);

  // Initial focus follows the active tab; fallback to index 0
  const initialFocusIdx = (() => {
    if (activeSlug === "config") return AGENT_RIBBON_ORDER.length;
    if (activeSlug !== null) {
      const idx = (AGENT_RIBBON_ORDER as readonly string[]).indexOf(activeSlug);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  })();

  const [focusedIdx, setFocusedIdx] = useState<number>(initialFocusIdx);

  // tabRefs[0..AGENT_RIBBON_ORDER.length-1] = agent tabs
  // tabRefs[AGENT_RIBBON_ORDER.length]       = config tab
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const totalTabs = AGENT_RIBBON_ORDER.length + 1; // 5 agent tabs + 1 config tab

  // Navigate to a slug — guards null tenantId
  const navigateTo = useCallback(
    (slug: RibbonTabSlug) => {
      const tenantId = params?.tenantId;
      if (!tenantId) return;

      if (slug === "config") {
        router.push(`/${tenantId}/config/cuenta`);
        return;
      }

      const descriptor = AGENT_CATALOG[slug];
      router.push(`/${tenantId}/${slug}/${descriptor.defaultSubtab}`);
    },
    [params, router],
  );

  // Move focus to idx (circular modulo-safe wrap)
  const focusTab = useCallback(
    (idx: number) => {
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
          if (focusedIdx < AGENT_RIBBON_ORDER.length) {
            navigateTo(AGENT_RIBBON_ORDER[focusedIdx]);
          } else {
            navigateTo("config");
          }
          return;
        }
        default:
          break;
      }
    },
    [focusedIdx, focusTab, navigateTo, totalTabs],
  );

  return (
    <nav
      role="tablist"
      aria-label="Agentes"
      data-testid="ribbon"
      onKeyDown={handleKeyDown}
      className="flex h-14 items-stretch gap-1 overflow-x-auto border-b border-border bg-card px-3"
    >
      {AGENT_RIBBON_ORDER.map((slug, idx) => (
        <RibbonTab
          key={slug}
          ref={(el) => {
            tabRefs.current[idx] = el;
          }}
          slug={slug}
          active={activeSlug === slug}
          tabIndex={focusedIdx === idx ? 0 : -1}
          onClick={() => navigateTo(slug)}
          onFocus={() => setFocusedIdx(idx)}
        />
      ))}
      <ConfigTab
        ref={(el) => {
          tabRefs.current[AGENT_RIBBON_ORDER.length] = el;
        }}
        active={activeSlug === "config"}
        tabIndex={focusedIdx === AGENT_RIBBON_ORDER.length ? 0 : -1}
        onClick={() => navigateTo("config")}
        onFocus={() => setFocusedIdx(AGENT_RIBBON_ORDER.length)}
      />
    </nav>
  );
}
