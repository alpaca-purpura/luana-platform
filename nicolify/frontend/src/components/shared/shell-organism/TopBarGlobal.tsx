// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-2
"use client";

/**
 * TopBarGlobal — shell organism (global top navigation bar) for Nicolify.
 * nicolify-r0-shell T-2 — port from vitalia TopBarGlobal.tsx, re-themed to Nicolify.
 *
 * Nicolify changes vs Vitalia:
 * - "Valeria" → "Luana" in all aria-labels and copy
 * - "clínica" → "agencia" in all user-facing text
 * - LogoMark uses Nicolify SVG assets (/nico-assets/)
 * - TenantSwitcher shows "Cambiar de agencia" placeholder
 *
 * Client Component (converted — hamburger onClick handler requires it).
 * Height: h-12 (48px). Positions fixed at top, z-50.
 * Contains: [hamburger <md] + LogoMark (left) + TenantSwitcher (left group) + ThemeToggle (right).
 *
 * Variant prop (ADR-vitalia-006 D4 · same pattern for Nicolify ADR-nicolify-001 G2):
 * - "interactive" (default): subscribes useShellStore; hamburger opens Luana drawer.
 * - "skeleton": store-free; renders inert burger placeholder. Used by
 *   ShellOrganismLayoutSkeleton (outside the ssr:false boundary) so that the
 *   persist middleware is NEVER evaluated in SSR/pre-hydration context (C3).
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell organism; no cross-brand consumers
 */

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useShellStore } from "@/stores/shell-store";

import { LogoMark } from "./LogoMark";
import { TenantSwitcher } from "./TenantSwitcher";
import { ThemeToggle } from "./ThemeToggle";

/** Variant prop for TopBarGlobal.
 * - "interactive" (default): subscribes useShellStore; hamburger opens Luana drawer.
 * - "skeleton": store-free; renders inert burger placeholder. Used by the SSR skeleton
 *   (ShellOrganismLayoutSkeleton) so the persist middleware is never touched outside ssr:false.
 *   See ADR-nicolify-001 § G2 and ADR-vitalia-006 (pattern origin).
 */
export type TopBarVariant = "interactive" | "skeleton";

export interface TopBarGlobalProps {
  /** Additional CSS classes for the header element */
  className?: string;
  /**
   * Rendering variant.
   * - "interactive" (default): subscribes useShellStore for burger handler.
   * - "skeleton": store-free, renders inert burger placeholder.
   *   Pass this when rendering outside the ssr:false boundary (SSR skeleton path).
   *
   * @default "interactive"
   */
  variant?: TopBarVariant;
}

// ─── Interactive TopBarGlobal (store-subscribed) ─────────────────────────────

/**
 * Interactive variant — subscribes useShellStore for hamburger click handler.
 * Rendered inside ShellOrganismLayoutClient (ssr:false boundary).
 *
 * D5 (mobile slice): hamburger sets mobileDrawerOpen=true (independent of luanaState).
 * This decouples mobile drawer from desktop luanaState slice (ADR-vitalia-006 D5 pattern).
 */
function TopBarGlobalInteractive({ className }: Pick<TopBarGlobalProps, "className">) {
  const mobileDrawerOpen = useShellStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useShellStore((s) => s.setMobileDrawerOpen);

  const handleOpenLuana = () => {
    // Mobile drawer has its own independent slice.
    // Burger sets mobileDrawerOpen=true (NOT setLuanaState('full') — that was Bug #2 origin in vitalia).
    setMobileDrawerOpen(true);
  };

  return (
    <header
      role="banner"
      data-testid="topbar-global"
      className={[
        "h-12",
        "border-b border-border",
        "bg-background",
        "flex items-center justify-between",
        "px-5",
        "relative z-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Left: hamburger (mobile <md) + brand logo + tenant switcher */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={handleOpenLuana}
          aria-label={mobileDrawerOpen ? "Cerrar panel Luana" : "Abrir panel Luana"}
          aria-expanded={mobileDrawerOpen}
          data-testid="topbar-hamburger"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <LogoMark variant="full" size="md" className="hidden md:inline-flex" />
        <LogoMark variant="mark" size="md" className="inline-flex md:hidden" />
        <TenantSwitcher />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

// ─── Skeleton TopBarGlobal (store-FREE) ──────────────────────────────────────

/**
 * Skeleton variant — store-free, renders inert burger placeholder.
 * Rendered by ShellOrganismLayoutSkeleton (OUTSIDE the ssr:false boundary).
 *
 * WHY STORE-FREE: The skeleton renders before the dynamic({ssr:false}) chunk loads.
 * If this component subscribes useShellStore, the Zustand persist middleware evaluates
 * in SSR/pre-hydration context and may write defaults to localStorage, clobbering
 * the user's saved preference on every reload (Bug pattern from Vitalia C3).
 *
 * T-3 will add the ssr:false dynamic boundary so this pattern protects C3.
 *
 * Visual contract:
 * - Same header height (h-12) and layout (layout shift prevention).
 * - Inert burger button (aria-disabled, no onClick) — visual placeholder only.
 * - LogoMark + TenantSwitcher still rendered for visual continuity.
 * - ThemeToggle still rendered (pure UI, no store).
 */
function TopBarGlobalSkeleton({ className }: Pick<TopBarGlobalProps, "className">) {
  return (
    <header
      role="banner"
      data-testid="topbar-global"
      data-shell-variant="skeleton"
      className={[
        "h-12",
        "border-b border-border",
        "bg-background",
        "flex items-center justify-between",
        "px-5",
        "relative z-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Left: inert burger placeholder (no store access) + brand logo */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Inert burger placeholder — no onClick, no store subscription */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir panel Luana"
          aria-disabled="true"
          tabIndex={-1}
          data-testid="topbar-hamburger"
          data-skeleton="true"
          onClick={undefined}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <LogoMark variant="full" size="md" className="hidden md:inline-flex" />
        <LogoMark variant="mark" size="md" className="inline-flex md:hidden" />
        <TenantSwitcher />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

// ─── Public component — dispatches on variant ─────────────────────────────────

/**
 * TopBarGlobal — global navigation bar for Nicolify shell.
 *
 * variant="interactive" (default): Client Component, subscribes useShellStore.
 *   Use inside ShellOrganismLayoutClient (ssr:false boundary).
 *
 * variant="skeleton": Store-free, renders inert burger placeholder.
 *   Use inside ShellOrganismLayoutSkeleton (OUTSIDE the ssr:false boundary).
 *   This prevents the persist middleware from writing localStorage during SSR/pre-hydration.
 *
 * See ADR-nicolify-001 § G2 (SSR-safe store gate).
 */
export function TopBarGlobal({ className, variant = "interactive" }: TopBarGlobalProps) {
  if (variant === "skeleton") {
    return <TopBarGlobalSkeleton className={className} />;
  }
  return <TopBarGlobalInteractive className={className} />;
}
