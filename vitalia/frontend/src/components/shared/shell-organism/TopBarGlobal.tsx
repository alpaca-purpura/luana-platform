"use client";

/**
 * TopBarGlobal — shell organism (global top navigation bar)
 * F1-S2 vitalia-fase1-topbar-global — T-4
 * Updated F1-S3 vitalia-fase1-tenant-switcher — T-8
 *   Replaced TenantSwitcherSlot placeholder with live TenantSwitcher.
 * Updated F1-S5 vitalia-fase1-valeria-rail-history — T-6
 *   Added hamburger Menu button visible <md viewport (D7 spec).
 *   Converted to "use client" for click handler + useShellStore.
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

export interface TopBarGlobalProps {
  /** Additional CSS classes for the header element */
  className?: string;
}

/**
 * TopBarGlobal — global navigation bar for Vitalia shell.
 * Client Component (T-6: hamburger handler + useShellStore).
 * Hamburger button visible only on mobile (<md) — md:hidden.
 * Click opens Valeria drawer: setValeriaState('full') + setShellMode('agentic').
 */
export function TopBarGlobal({ className }: TopBarGlobalProps) {
  const setValeriaState = useShellStore((s) => s.setValeriaState);
  const setShellMode = useShellStore((s) => s.setShellMode);

  const handleOpenValeria = () => {
    setValeriaState("full");
    setShellMode("agentic");
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
          aria-label="Abrir panel Valeria"
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
