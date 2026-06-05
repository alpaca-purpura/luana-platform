// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
// T-FE-NAVBAR: root-as-leaf refactor (Chris round 4) — ICPs becomes a peer leaf
"use client";
/**
 * EntitySubNavBar.tsx — Shell-organism N3-dynamic entity workspace navigation bar (nicolify).
 *
 * Port of vitalia EntitySubNavBar re-themed for Nicolify (agent-abel #A855F7).
 * Supports both fixed leaves and DYNAMIC leaves (datos + N buyers + "+ buyer").
 *
 * Layout (T-FE-NAVBAR refactor):
 *   MASTER (no ICP):  [ ICPs ] <-- root leaf active | "Selecciona un ICP" placeholder
 *   DETAIL (ICP X):   [ ICPs ] (inactive peer leaf) | 🎯 Agencias… | [ 📋 Datos ] | [buyers] | [+ buyer]
 *
 * The "‹ back-link" is removed. The root (e.g. "ICPs") is now the FIRST entry in the
 * tablist as a special peer leaf — same LeafTabButton pill shape as buyer leaves.
 *
 * States:
 *   - entity=null (master/no-selection mode):
 *       Root leaf is ACTIVE (aria-selected=true). Only the root leaf renders.
 *       Placeholder text "Selecciona un ICP" shown in identity slot.
 *       No buyer leaves, no Datos leaf, no "+ buyer" affordance.
 *   - entity present (workspace mode):
 *       Root leaf is INACTIVE (same pill shape, clickable → rootHref navigation).
 *       Entity identity (icon + name) shown.
 *       Full leaves rendered (datos + buyers + add affordance).
 *
 * Accessibility (WAI-ARIA tablist pattern — SC-a11y):
 *   - role="tablist" on <nav>
 *   - role="tab" + aria-selected + aria-disabled per leaf
 *   - Root leaf is included in the tablist; roving tabindex covers it too
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
  /**
   * B1 fix: optional emoji/text prefix rendered before the label.
   * Used for the "datos" leaf (📋) to distinguish the entity-mother leaf from buyer leaves.
   * MUST be a static string — not a dynamic icon component (G3 JIT-safe).
   */
  prefixEmoji?: string;
  /**
   * B1 fix: when true, renders a colored avatar circle (leaf-av) before the label.
   * Used for buyer leaves to give them visual identity.
   * The color is the Tailwind class for the buyer's avatar background (from _agent-tw-classes).
   * MUST be a full static class string (G3 JIT-safe — no template literals).
   */
  avatarBgClass?: string;
  /**
   * B1 fix: when true, renders a ★ star after the label (marks the primary buyer).
   * Only meaningful when avatarBgClass is also set.
   */
  isPrimary?: boolean;
  /**
   * T-FE-NAVBAR: when true, this leaf is the root "ICPs" leaf (first in tablist).
   * Used internally to distinguish root leaf from regular leaves; callers set this
   * via the rootHref/rootLabel props (not by adding a leaf directly to `leaves`).
   */
  isRootLeaf?: boolean;
}

export interface EntitySubNavEntity {
  id: string;
  name: string;
  avatarUrl?: string | null;
  /**
   * B1 fix: optional icon/emoji rendered in the entity identity section before the name.
   * Matches mockup entitynav-entity-icon (bg-agent-abel-soft circle with emoji inside).
   * Static string (G3 JIT-safe).
   */
  icon?: string;
}

export interface EntitySubNavBarProps {
  /** Href for the root leaf (list navigation) */
  rootHref: string;
  /** Label for the root leaf (e.g., "ICPs") */
  rootLabel: string;
  /**
   * Stable id for the root leaf testid — used by e2e (entity-leaf-root).
   * Defaults to "root".
   */
  rootLeafId?: string;
  /** Entity descriptor — null = master/no-selection mode (root leaf active) */
  entity: EntitySubNavEntity | null;
  /**
   * Ordered list of leaf tabs for the DETAIL state (datos + buyers + add affordance).
   * NOT rendered in master mode (entity=null) — only the root leaf is shown.
   */
  leaves: EntitySubNavLeaf[];
  /** Active leaf id — null in master mode (root leaf is active instead) */
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

// ── LeafTabButton (sub-component — extracted to reduce EntitySubNavBar cognitive complexity) ──

interface LeafTabButtonProps {
  leaf: EntitySubNavLeaf;
  idx: number;
  isActive: boolean;
  isFocused: boolean;
  isDisabled: boolean;
  agentText: string;
  tabRef: (el: HTMLButtonElement | null) => void;
  onLeafClick: (idx: number, isAdd: boolean, href: string) => void;
  onLeafFocus: (idx: number) => void;
}

function leafStateClass(
  isDisabled: boolean,
  isAdd: boolean,
  isActive: boolean,
  agentText: string,
): string {
  if (isDisabled) return "opacity-45 cursor-not-allowed";
  if (isAdd)
    return "border border-dashed border-border text-muted-foreground hover:border-agent-abel hover:text-agent-abel";
  if (isActive) return cn("font-medium bg-agent-abel-soft border border-agent-abel/30", agentText);
  return "text-muted-foreground hover:text-foreground hover:bg-muted/50";
}

const LEAF_BASE =
  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

function LeafTabButton({
  leaf,
  idx,
  isActive,
  isFocused,
  isDisabled,
  agentText,
  tabRef,
  onLeafClick,
  onLeafFocus,
}: LeafTabButtonProps) {
  const isAdd = leaf.isAddAffordance === true;
  const isRoot = leaf.isRootLeaf === true;
  // Testid: root leaf → "entity-leaf-root" (stable, e2e-safe)
  //         add affordance → "entity-leaf-add-affordance"
  //         regular leaf → "entity-leaf-{id}"
  const testId = isRoot
    ? "entity-leaf-root"
    : isAdd
      ? "entity-leaf-add-affordance"
      : `entity-leaf-${leaf.id}`;
  const tabIdx = isDisabled ? -1 : isFocused ? 0 : -1;
  const showPrefix = Boolean(leaf.prefixEmoji) && !isAdd && !isRoot;
  const showAvatar = Boolean(leaf.avatarBgClass) && !isAdd && !isRoot;
  const showStar = Boolean(leaf.isPrimary) && !isAdd && !isRoot;

  return (
    <button
      ref={tabRef}
      role="tab"
      aria-selected={isActive}
      aria-disabled={isDisabled || undefined}
      aria-current={isActive ? "page" : undefined}
      tabIndex={tabIdx}
      data-testid={testId}
      data-add-affordance={isAdd ? "true" : undefined}
      data-root-leaf={isRoot ? "true" : undefined}
      disabled={isDisabled}
      onClick={() => onLeafClick(idx, isAdd, leaf.href)}
      onFocus={() => onLeafFocus(idx)}
      className={cn(LEAF_BASE, leafStateClass(isDisabled, isAdd, isActive, agentText))}
    >
      {showPrefix && <span aria-hidden="true">{leaf.prefixEmoji}</span>}
      {showAvatar && (
        <span
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0",
            leaf.avatarBgClass,
          )}
          aria-hidden="true"
        >
          {leaf.label.charAt(0).toUpperCase()}
        </span>
      )}
      {leaf.label}
      {showStar && (
        <span className="text-[10px] text-agent-abel ml-0.5" aria-label="buyer primario">
          ★
        </span>
      )}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * EntitySubNavBar — sticky N3-dynamic workspace navigation bar (nicolify, dynamic leaves).
 *
 * T-FE-NAVBAR: The root ("ICPs") is now a peer leaf in the tablist (first entry).
 * No ‹ back-link. In master mode (entity=null), only the root leaf renders (active).
 * In workspace mode (entity present), the root leaf is inactive and the full leaf
 * set (datos + buyers + add) renders alongside it.
 *
 * Renders above workspace content. Entity identity (icon + name or placeholder) shown
 * between the root leaf and the leaf tabs.
 */
export function EntitySubNavBar({
  rootHref,
  rootLabel,
  rootLeafId = "root",
  entity,
  leaves,
  activeLeaf,
  agentSlug,
  onAddAffordance,
  className,
}: EntitySubNavBarProps) {
  const router = useRouter();
  const isMasterMode = entity === null;

  // Build the full tablist: [rootLeaf, ...contentLeaves]
  // In master mode, contentLeaves is empty (only root leaf shown, active).
  // In workspace mode, contentLeaves = leaves (datos + buyers + add affordance).
  const rootLeaf: EntitySubNavLeaf = {
    id: rootLeafId,
    label: rootLabel,
    href: rootHref,
    isRootLeaf: true,
  };
  const allTabs: EntitySubNavLeaf[] = isMasterMode ? [rootLeaf] : [rootLeaf, ...leaves];
  const totalTabs = allTabs.length;

  // In master mode: root leaf is active (index 0).
  // In workspace mode: active is the leaf matching activeLeaf (skip root at 0).
  const activeTabIdx = (() => {
    if (isMasterMode) return 0; // root leaf always active in master mode
    if (!activeLeaf) return 0; // root leaf active if no specific leaf
    // Find in allTabs (offset by 1 for root)
    const idx = allTabs.findIndex((l) => l.id === activeLeaf);
    return idx >= 0 ? idx : 0;
  })();

  const [focusedIdx, setFocusedIdx] = useState<number>(activeTabIdx);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Move focus to idx (circular wrap)
  const focusTab = useCallback(
    (idx: number) => {
      if (totalTabs === 0) return;
      const safeIdx = ((idx % totalTabs) + totalTabs) % totalTabs;
      setFocusedIdx(safeIdx);
      tabRefs.current[safeIdx]?.focus();
    },
    [totalTabs],
  );

  // Keyboard handler on <nav> — events bubble from child buttons
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
        default:
          break;
      }
    },
    [focusedIdx, focusTab, totalTabs],
  );

  // Agent color classes (G3 JIT-safe — static lookup via switch/case in _agent-tw-classes)
  const agentBg = agentBgClass(agentSlug);
  const agentText = agentTextClass(agentSlug);

  // Stable leaf click handler — extracted to reduce cognitive complexity of render function
  const handleLeafClick = useCallback(
    (idx: number, isAdd: boolean, href: string) => {
      setFocusedIdx(idx);
      if (isAdd && onAddAffordance) {
        onAddAffordance();
      } else if (href) {
        router.push(href);
      }
    },
    [onAddAffordance, router],
  );

  // Stable leaf focus handler
  const handleLeafFocus = useCallback((idx: number) => {
    setFocusedIdx(idx);
  }, []);

  return (
    <div
      className={cn(
        "sticky top-0 z-20 w-full bg-background border-b border-border/60",
        "flex items-center gap-0 min-h-[44px] px-4",
        className,
      )}
      data-testid="entity-sub-nav-bar"
    >
      {/* Tablist — root leaf + (in workspace mode) entity identity + content leaves */}
      <div className="flex-1 overflow-x-auto scrollbar-none min-w-0">
        <nav
          role="tablist"
          aria-label="Secciones del perfil de cliente"
          data-testid="entity-sub-nav-tablist"
          onKeyDown={handleKeyDown}
          className="flex items-center gap-0.5 min-w-max"
        >
          {/* Root leaf (first tab — "ICPs") — always rendered */}
          <LeafTabButton
            key={rootLeaf.id}
            leaf={rootLeaf}
            idx={0}
            isActive={activeTabIdx === 0}
            isFocused={focusedIdx === 0}
            isDisabled={false}
            agentText={agentText}
            tabRef={(el) => {
              tabRefs.current[0] = el;
            }}
            onLeafClick={handleLeafClick}
            onLeafFocus={handleLeafFocus}
          />

          {/* Entity identity — shown only in workspace mode (entity present) */}
          {!isMasterMode && entity && (
            <div
              className="flex items-center gap-2 min-w-0 flex-shrink-0 mx-3 max-w-[200px]"
              aria-label={`Editando: ${entity.name}`}
            >
              {entity.avatarUrl ? (
                <Image
                  src={entity.avatarUrl}
                  alt={entity.name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : entity.icon ? (
                /* B1 fix: entity icon circle (mockup entitynav-entity-icon) — bg-agent-abel-soft */
                <span
                  className={cn(
                    "w-[30px] h-[30px] rounded-lg flex items-center justify-center",
                    "bg-agent-abel-soft text-agent-abel text-sm flex-shrink-0",
                  )}
                  aria-hidden="true"
                >
                  {entity.icon}
                </span>
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
              <span className="text-sm font-bold truncate">{entity.name}</span>
            </div>
          )}

          {/* Placeholder — shown only in master mode (no entity selected) */}
          {isMasterMode && (
            <span
              className="text-sm text-muted-foreground/60 ml-3 whitespace-nowrap"
              aria-label="Selecciona un ICP para ver sus opciones"
            >
              Selecciona un ICP
            </span>
          )}

          {/* Content leaves (datos + buyers + add affordance) — workspace mode only */}
          {!isMasterMode &&
            leaves.map((leaf, idx) => {
              const tabIdx = idx + 1; // offset by 1 for root leaf at index 0
              const isActive = leaf.id === activeLeaf;
              const isFocused = focusedIdx === tabIdx;

              return (
                <LeafTabButton
                  key={leaf.id}
                  leaf={leaf}
                  idx={tabIdx}
                  isActive={isActive}
                  isFocused={isFocused}
                  isDisabled={false}
                  agentText={agentText}
                  tabRef={(el) => {
                    tabRefs.current[tabIdx] = el;
                  }}
                  onLeafClick={handleLeafClick}
                  onLeafFocus={handleLeafFocus}
                />
              );
            })}
        </nav>
      </div>
    </div>
  );
}
