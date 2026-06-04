// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
"use client";
/**
 * EntityWorkspaceLayout.tsx — N3-dynamic workspace layout for entity detail pages.
 *
 * Mounts EntitySubNavBar (N3 bar) + {children} slot (the active leaf content).
 * Hydrates entity data (ICP) server-side via props (SSR initial state).
 *
 * G2 SSR-safe: this component is "use client" (needs useParams for activeLeaf
 * URL-derivation) but is store-FREE — skeleton does not subscribe to any store.
 * Store subscription lives in ShellOrganismLayoutClient (the ssr:false boundary).
 *
 * Pattern:
 *   [entityId]/layout.tsx (Server Component) → EntityWorkspaceLayout (Client)
 *   EntityWorkspaceLayout mounts EntitySubNavBar + children (the leaf page).
 *
 * activeLeaf is URL-derived from [leaf] segment — NEVER stored in Zustand.
 * router.push between leaves = soft nav (no full reload, preserves RQ cache).
 *
 * Named export (NO default) per FSD-Lite enforce.
 * Store-free skeleton (G2 gate) — no store imports.
 *
 * spec_anchor: 03-arch-fe.md §0 Routing + §4 SSR-safe store (G2)
 * validators_gate: G2 SSR-safe + no-store-in-ssr-skeleton arch test
 * downstream-regression-na: brand-local; no cross-brand consumers
 */

import { useParams } from "next/navigation";
import { type ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { EntitySubNavBar, type EntitySubNavLeaf, type EntitySubNavEntity } from "./EntitySubNavBar";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EntityWorkspaceLayoutProps {
  /** Entity descriptor — null during SSR skeleton / loading state */
  entity: EntitySubNavEntity | null;
  /** Ordered leaves for the N3 nav bar (datos + buyers + "+ buyer") */
  leaves: EntitySubNavLeaf[];
  /** Href for the back link (root list, e.g., /{tenantId}/abel/icp) */
  rootHref: string;
  /** Label for the back link (e.g., "ICPs") */
  rootLabel: string;
  /** Whether entity data is still loading (shows skeleton) */
  isLoading?: boolean;
  /**
   * Callback fired when the add-affordance leaf is clicked in EntitySubNavBar.
   * Forwarded verbatim to EntitySubNavBar.onAddAffordance.
   * Allows IcpEntityLayoutClient to trigger useCreateBuyer without routing
   * to a literal "__add_buyer__" path.
   */
  onAddAffordance?: () => void;
  /** Leaf content — the active leaf page component */
  children: ReactNode;
  /** Additional className for the outer wrapper */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * EntityWorkspaceLayout — wrapper for entity detail pages.
 *
 * Derives activeLeaf from URL path params (URL-driven state, not store).
 * Renders EntitySubNavBar (N3 bar) above children (leaf content).
 *
 * Loading state: Skeleton bar replaces EntitySubNavBar while entity hydrates.
 * Error state: handled by the leaf page (children).
 */
export function EntityWorkspaceLayout({
  entity,
  leaves,
  rootHref,
  rootLabel,
  isLoading = false,
  onAddAffordance,
  children,
  className,
}: EntityWorkspaceLayoutProps) {
  // URL-derived activeLeaf — reads [leaf] param from Next.js App Router
  // useParams() is safe inside "use client" components
  const params = useParams<{ leaf?: string }>();
  const activeLeaf = params.leaf ?? null;

  return (
    <div
      className={cn("flex flex-col flex-1 min-h-0 overflow-hidden", className)}
      data-testid="entity-workspace-layout"
    >
      {/* N3 EntitySubNavBar — skeleton-safe loading state */}
      {isLoading ? (
        <div
          className="sticky top-0 z-20 w-full bg-background border-b border-border/60 flex items-center gap-3 min-h-[44px] px-4"
          aria-busy="true"
          data-testid="entity-sub-nav-skeleton"
        >
          {/* Back link skeleton */}
          <Skeleton className="h-4 w-14 rounded-sm flex-shrink-0" />
          <div className="w-px h-4 bg-border/50 flex-shrink-0" />
          {/* Entity identity skeleton */}
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 w-32 rounded-sm" />
          {/* Leaf tabs skeleton */}
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      ) : (
        <EntitySubNavBar
          rootHref={rootHref}
          rootLabel={rootLabel}
          entity={entity}
          leaves={leaves}
          activeLeaf={activeLeaf}
          agentSlug="abel"
          onAddAffordance={onAddAffordance}
        />
      )}

      {/* Leaf content slot */}
      <div className="flex-1 min-h-0 overflow-auto" data-testid="entity-workspace-content">
        {children}
      </div>
    </div>
  );
}
