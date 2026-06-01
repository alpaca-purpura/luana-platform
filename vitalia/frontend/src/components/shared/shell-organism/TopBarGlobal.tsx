// cap: shell-organism.shell-vitalia
// story-origin: TBD
"use client";

/**
 * TopBarGlobal — shell organism (global top navigation bar)
 * F1-S2 vitalia-fase1-topbar-global — T-4
 * Updated F1-S3 vitalia-fase1-tenant-switcher — T-8
 *   Replaced TenantSwitcherSlot placeholder with live TenantSwitcher.
 * Updated F1-S5 vitalia-fase1-valeria-rail-history — T-6
 *   Added hamburger Menu button visible <md viewport (D7 spec).
 *   Converted to "use client" for click handler + useShellStore.
 * Updated vitalia-shell-state-persistence — T-2
 *   Added variant prop ("interactive" | "skeleton") per ADR-vitalia-006 D4.
 *   variant="skeleton": store-free, renders inert burger placeholder. Used by
 *   ShellOrganismLayoutSkeleton (outside the ssr:false boundary) so that the
 *   persist middleware is NEVER evaluated in SSR/pre-hydration context.
 *   variant="interactive" (default): original behaviour — subscribes useShellStore.
 *
 * Client Component (converted T-6 — hamburger onClick handler requires it).
 * Height: h-12 (48px). Positions fixed at top, z-50.
 * Contains: [hamburger <md] + LogoMark (left) + TenantSwitcher (center) + ThemeToggle (right).
 *
 * ThemeToggle and TenantSwitcher are also Client Components.
 *
 * 03-arch.md § 2.3 + § 2.6 — implementation verbatim.
 * Named export (no default export) per FSD-Lite enforce.
 * HIPAA-lite: no-phi-scope — UI shell organism, zero PHI.
 *
 * downstream-regression-na: brand-local shell organism; no cross-brand consumers
 */

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShellStore } from "@/stores/shell-store";
import { LogoMark } from "./LogoMark";
import { TenantSwitcher } from "./TenantSwitcher";
import { ThemeToggle } from "./ThemeToggle";

/** Variant prop for TopBarGlobal.
 * - "interactive" (default): subscribes useShellStore; hamburger opens Valeria drawer.
 * - "skeleton": store-free; renders inert burger placeholder. Used by the SSR skeleton
 *   (ShellOrganismLayoutSkeleton) so the persist middleware is never touched outside ssr:false.
 *   See ADR-vitalia-006 § D4 and 03-arch.md § 2 Decision D4.
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
 * D5 (mobile slice): hamburger sets mobileDrawerOpen=true, NOT setValeriaState('full').
 * This decouples the mobile drawer from the desktop valeriaState slice (ADR-vitalia-006 D5).
 */
function TopBarGlobalInteractive({ className }: Pick<TopBarGlobalProps, "className">) {
  const mobileDrawerOpen = useShellStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useShellStore((s) => s.setMobileDrawerOpen);

  const handleOpenValeria = () => {
    // D5: mobile drawer has its own independent slice.
    // Burger sets mobileDrawerOpen=true (NOT setValeriaState('full') — that was Bug #2 root cause).
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
      {/* Left: hamburger (mobile <md) + brand logo */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={handleOpenValeria}
          aria-label={mobileDrawerOpen ? "Cerrar panel Valeria" : "Abrir panel Valeria"}
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
 * in SSR/pre-hydration context, writes the default value to localStorage, and clobbers
 * the user's saved preference on every reload (Bug #1 PROD REAL).
 *
 * Visual contract:
 * - Same header height (h-12) and classes (layout shift prevention).
 * - Inert burger button (aria-disabled, no onClick) — visual placeholder only.
 * - LogoMark + TenantSwitcher still rendered for visual continuity.
 * - ThemeToggle still rendered (pure UI, no store).
 *
 * A11y: header is visible → skip-link target (#main-content via the skeleton wrapper) works.
 * The skeleton is transient (< 1s in dev; instant in prod with proper chunking).
 *
 * See 03-arch.md § 2 Decision D4 and ADR-vitalia-006.
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
          aria-label="Abrir panel Valeria"
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
 * TopBarGlobal — global navigation bar for Vitalia shell.
 *
 * variant="interactive" (default): Client Component, subscribes useShellStore.
 *   Use inside ShellOrganismLayoutClient (ssr:false boundary).
 *
 * variant="skeleton": Store-free, renders inert burger placeholder.
 *   Use inside ShellOrganismLayoutSkeleton (OUTSIDE the ssr:false boundary).
 *   This prevents the persist middleware from writing localStorage during SSR/pre-hydration.
 *
 * See 03-arch.md § 2 Decision D4 and ADR-vitalia-006.
 */
export function TopBarGlobal({ className, variant = "interactive" }: TopBarGlobalProps) {
  if (variant === "skeleton") {
    return <TopBarGlobalSkeleton className={className} />;
  }
  return <TopBarGlobalInteractive className={className} />;
}
