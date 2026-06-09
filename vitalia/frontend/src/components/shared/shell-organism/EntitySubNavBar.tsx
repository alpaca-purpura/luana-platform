// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
"use client";
/**
 * EntitySubNavBar.tsx — Shell-organism N3-dynamic entity workspace navigation bar.
 *
 * NEW sibling of SubSubTabsBar (NOT a modification — see ADR-vitalia-004 § D-1).
 * Renders the N3-dynamic workspace nav for entity-level pages (doctor workspace, etc.).
 *
 * Layout: [‹ {rootLabel}] | [{avatar} {entityName}] | [{leaf tabs}]
 *
 * States:
 *   - entity=null (directory mode): leaves disabled (aria-disabled, tabIndex=-1, opacity .45)
 *   - entity present (workspace mode): leaves enabled, active derived from activeLeaf prop
 *
 * Accessibility (WAI-ARIA tablist pattern — SC-10):
 *   - role="tablist" on <nav>
 *   - role="tab" + aria-selected + aria-disabled per leaf
 *   - Roving tabindex: only focused tab has tabIndex=0
 *   - Arrow key navigation (Left/Right/Home/End)
 *   - focus() called on programmatic focus changes
 *
 * Named export (NO default) per FSD-Lite enforce.
 * NOT registered in AGENT_SUBSUBTABS (driven by entity prop, not catalog).
 *
 * T-FE-2 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch.md § D-1 + 03-arch-fe.md § EntitySubNavBar + ADR-vitalia-004 § 3.1
 * downstream-regression-na: brand-local vitalia shell-organism; no cross-brand consumers
 */

import {
  useState,
  useRef,
  useCallback,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EntitySubNavLeaf {
  /** URL segment identifier — kebab-case (e.g., "perfil", "horarios", "servicios") */
  id: string;
  /** Visible label — Spanish neutro LatAm */
  label: string;
  /** Full href (pre-built by layout — includes tenantId + doctorId) */
  href: string;
}

export interface EntitySubNavEntity {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface EntitySubNavBarProps {
  /** Href for the back link (root directory) */
  rootHref: string;
  /** Label for the back link */
  rootLabel: string;
  /** Entity descriptor — null = directory mode (leaves disabled) */
  entity: EntitySubNavEntity | null;
  /** Ordered list of leaf tabs */
  leaves: EntitySubNavLeaf[];
  /** Active leaf id — null when entity=null */
  activeLeaf: string | null;
  /** Additional className for the wrapper */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * EntitySubNavBar — sticky N3-dynamic workspace navigation bar.
 *
 * Renders above workspace content. Provides back navigation to root directory,
 * entity identity (avatar + name), and leaf tab navigation.
 */
export function EntitySubNavBar({
  rootHref,
  rootLabel,
  entity,
  leaves,
  activeLeaf,
  className,
}: EntitySubNavBarProps) {
  // F4 fix: client-side router so leaf nav doesn't force a full page reload.
  // SubSubTabsBar (sibling component) uses router.push — mirroring that pattern.
  // Using router.push preserves the React Query cache and avoids SC-1c full-reload.
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

  return (
    <div
      className={cn(
        "sticky top-0 z-20 w-full bg-background border-b border-border/60",
        "flex items-center gap-0 min-h-[44px] px-4",
        className,
      )}
      data-testid="entity-sub-nav-bar"
    >
      {/* Back link */}
      <Link
        href={rootHref}
        className={cn(
          "inline-flex items-center gap-1 text-sm text-muted-foreground",
          "hover:text-foreground transition-colors whitespace-nowrap",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm",
          "pr-3 border-r border-border/50 mr-3",
        )}
        aria-label={`Volver a ${rootLabel}`}
      >
        <span aria-hidden="true">‹</span>
        <span>{rootLabel}</span>
      </Link>

      {/* Entity identity */}
      {/* No `flex-1` here: it would grow and push the leaf tabs to the far right.
          Tabs must sit left-aligned right after the entity (Chris 2026-06-06). The name
          span carries its own max-width + truncate so long names don't shove the tabs. */}
      <div
        className="flex items-center gap-2 min-w-0 mr-3"
        aria-label={entity ? `Editando: ${entity.name}` : "Selecciona un integrante del directorio"}
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
                className="w-6 h-6 rounded-full bg-[var(--agent-lisa)] flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                aria-hidden="true"
              >
                {entity.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-medium truncate max-w-[14rem]">{entity.name}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground/60">—</span>
        )}
      </div>

      {/* Leaf tabs (tablist) */}
      <nav
        role="tablist"
        aria-label="Secciones del integrante"
        data-testid="entity-sub-nav-tablist"
        onKeyDown={handleKeyDown}
        className="flex items-center gap-0.5"
      >
        {leaves.map((leaf, idx) => {
          const isActive = !isDisabled && leaf.id === activeLeaf;
          const isFocused = focusedIdx === idx;

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
              data-testid={`entity-leaf-${leaf.id}`}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  setFocusedIdx(idx);
                  // F4 fix: use Next.js router.push instead of window.location.href
                  // to preserve client-side navigation, RQ cache, and SC-1c deep-link.
                  // Mirrors SubSubTabsBar pattern per ADR-vitalia-004.
                  router.push(leaf.href);
                }
              }}
              onFocus={() => {
                if (!isDisabled) setFocusedIdx(idx);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isDisabled && "opacity-45 cursor-not-allowed",
                !isDisabled && isActive
                  ? "font-medium bg-[color-mix(in_srgb,var(--agent-lisa)_15%,transparent)] text-foreground border border-[color-mix(in_srgb,var(--agent-lisa)_30%,transparent)]"
                  : !isDisabled
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
  );
}
