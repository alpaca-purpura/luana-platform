// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
"use client";
/**
 * EntitySubNavBar.tsx — Shell-organism N3-dynamic entity workspace navigation bar (nicolify).
 *
 * Port of vitalia EntitySubNavBar re-themed for Nicolify (agent-abel #A855F7).
 * Supports both fixed leaves and DYNAMIC leaves (datos + N buyers + "+ buyer").
 *
 * Layout: [‹ {rootLabel}] | [{avatar} {entityName}] | [{leaf tabs…}]
 *
 * States:
 *   - entity=null (directory mode): all leaves disabled (aria-disabled, tabIndex=-1, opacity .45)
 *   - entity present (workspace mode): leaves enabled, activeLeaf derived from URL
 *
 * Accessibility (WAI-ARIA tablist pattern — SC-a11y):
 *   - role="tablist" on <nav>
 *   - role="tab" + aria-selected + aria-disabled per leaf
 *   - Roving tabindex: only focused tab has tabIndex=0
 *   - Arrow key navigation (Left/Right/Home/End)
 *   - focus() called on programmatic focus changes
 *
 * G3 JIT-safe: agent-abel color via _agent-tw-classes.ts (agentBgClass / agentTextClass).
 * NEVER template literals in class strings.
 *
 * SC-large: overflow-x-auto on tablist wrapper handles 30+ leaves.
 *
 * Named export (NO default) per FSD-Lite enforce.
 * NOT registered in AGENT_SUBSUBTABS (driven by entity prop, not catalog).
 *
 * spec_anchor: 03-arch-fe.md §8 Accessibility + SHELL-DESIGN-CONTRACT §5.1
 * validators_gate: SC-a11y + 04-validators.yaml § a11y + G3 JIT-safe
 * downstream-regression-na: brand-local nicolify shell-organism; no cross-brand consumers
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

import { agentBgClass, agentTextClass, type AgentSlug } from "./_agent-tw-classes";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EntitySubNavLeaf {
  /** URL segment identifier — kebab-case (e.g., "datos", "buyer-a1b2") */
  id: string;
  /** Visible label — Spanish neutro LatAm */
  label: string;
  /** Full href (pre-built by layout — includes tenantId + entityId) */
  href: string;
  /**
   * When true, renders as a special "+ agregar" affordance (visual distinction).
   * aria-disabled in directory mode same as other leaves.
   */
  isAddAffordance?: boolean;
}

export interface EntitySubNavEntity {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface EntitySubNavBarProps {
  /** Href for the back link (root list) */
  rootHref: string;
  /** Label for the back link (e.g., "ICPs") */
  rootLabel: string;
  /** Entity descriptor — null = directory mode (leaves disabled) */
  entity: EntitySubNavEntity | null;
  /** Ordered list of leaf tabs — may include isAddAffordance entry */
  leaves: EntitySubNavLeaf[];
  /** Active leaf id — null when entity=null */
  activeLeaf: string | null;
  /** Agent slug for agent-abel color theming (G3 JIT-safe) */
  agentSlug: AgentSlug;
  /**
   * Callback fired when the add-affordance leaf (isAddAffordance=true) is clicked.
   * When provided, the affordance leaf calls this INSTEAD of router.push(href).
   * This allows the parent to trigger a mutation (e.g., useCreateBuyer) and then
   * navigate to the resulting entity leaf programmatically.
   *
   * If not provided, add-affordance leaves behave like normal leaves (router.push).
   */
  onAddAffordance?: () => void;
  /** Additional className for the wrapper */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * EntitySubNavBar — sticky N3-dynamic workspace navigation bar (nicolify, dynamic leaves).
 *
 * Renders above workspace content. Provides back navigation to root list,
 * entity identity (avatar + name), and leaf tab navigation (datos + buyers + "+ buyer").
 */
export function EntitySubNavBar({
  rootHref,
  rootLabel,
  entity,
  leaves,
  activeLeaf,
  agentSlug,
  onAddAffordance,
  className,
}: EntitySubNavBarProps) {
  const router = useRouter();
  const isDisabled = entity === null;
  const totalTabs = leaves.length;

  // Initial focus index: index of active leaf, or 0
  const initialFocusIdx = (() => {
    if (!activeLeaf || isDisabled) return 0;
    const idx = leaves.findIndex((l) => l.id === activeLeaf);
    return idx >= 0 ? idx : 0;
  })();

  const [focusedIdx, setFocusedIdx] = useState<number>(initialFocusIdx);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Move focus to idx (circular wrap)
  const focusTab = useCallback(
    (idx: number) => {
      if (totalTabs === 0 || isDisabled) return;
      const safeIdx = ((idx % totalTabs) + totalTabs) % totalTabs;
      setFocusedIdx(safeIdx);
      tabRefs.current[safeIdx]?.focus();
    },
    [totalTabs, isDisabled],
  );

  // Keyboard handler on <nav> — events bubble from child buttons
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (isDisabled) return;
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
        default:
          break;
      }
    },
    [focusedIdx, focusTab, isDisabled, totalTabs],
  );

  // Agent color classes (G3 JIT-safe — static lookup via switch/case in _agent-tw-classes)
  const agentBg = agentBgClass(agentSlug);
  const agentText = agentTextClass(agentSlug);

  return (
    <div
      className={cn(
        "sticky top-0 z-20 w-full bg-background border-b border-border/60",
        "flex items-center gap-0 min-h-[44px] px-4",
        className,
      )}
      data-testid="entity-sub-nav-bar"
    >
      {/* Back link — ‹ ICPs */}
      <Link
        href={rootHref}
        className={cn(
          "inline-flex items-center gap-1 text-sm text-muted-foreground",
          "hover:text-foreground transition-colors whitespace-nowrap",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm",
          "pr-3 border-r border-border/50 mr-3 flex-shrink-0",
        )}
        aria-label={`Volver a ${rootLabel}`}
      >
        <span aria-hidden="true">‹</span>
        <span>{rootLabel}</span>
      </Link>

      {/* Entity identity — avatar + name */}
      <div
        className="flex items-center gap-2 min-w-0 flex-shrink-0 mr-3 max-w-[180px]"
        aria-label={entity ? `Editando: ${entity.name}` : "Selecciona un perfil de cliente ideal"}
      >
        {entity ? (
          <>
            {entity.avatarUrl ? (
              <Image
                src={entity.avatarUrl}
                alt={entity.name}
                width={24}
                height={24}
                className="rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  "text-xs font-medium text-white flex-shrink-0",
                  agentBg,
                )}
                aria-hidden="true"
              >
                {entity.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-medium truncate">{entity.name}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground/60">—</span>
        )}
      </div>

      {/* Leaf tabs — scrollable when many buyers (SC-large) */}
      <div className="flex-1 overflow-x-auto scrollbar-none min-w-0">
        <nav
          role="tablist"
          aria-label="Secciones del perfil de cliente"
          data-testid="entity-sub-nav-tablist"
          onKeyDown={handleKeyDown}
          className="flex items-center gap-0.5 min-w-max"
        >
          {leaves.map((leaf, idx) => {
            const isActive = !isDisabled && leaf.id === activeLeaf;
            const isFocused = focusedIdx === idx;
            const isAdd = leaf.isAddAffordance === true;

            return (
              <button
                key={leaf.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                role="tab"
                aria-selected={isActive}
                aria-disabled={isDisabled ? true : undefined}
                aria-current={isActive ? "page" : undefined}
                tabIndex={isDisabled ? -1 : isFocused ? 0 : -1}
                data-testid={isAdd ? "entity-leaf-add-affordance" : `entity-leaf-${leaf.id}`}
                data-add-affordance={isAdd ? "true" : undefined}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    setFocusedIdx(idx);
                    if (isAdd && onAddAffordance) {
                      onAddAffordance();
                    } else {
                      router.push(leaf.href);
                    }
                  }
                }}
                onFocus={() => {
                  if (!isDisabled) setFocusedIdx(idx);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isDisabled && "opacity-45 cursor-not-allowed",
                  // "+ buyer" affordance: dotted border style
                  isAdd &&
                    !isDisabled &&
                    "border border-dashed border-border text-muted-foreground hover:border-agent-abel hover:text-agent-abel",
                  // Active leaf: agent-abel themed
                  !isDisabled && isActive && !isAdd
                    ? cn("font-medium", agentText, "bg-agent-abel-soft border border-agent-abel/30")
                    : !isDisabled && !isAdd
                      ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      : "",
                )}
              >
                {leaf.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
