/**
 * TopBarGlobal — shell organism (global top navigation bar)
 * F1-S2 vitalia-fase1-topbar-global — T-4
 * Updated F1-S3 vitalia-fase1-tenant-switcher — T-8
 *   Replaced TenantSwitcherSlot placeholder with live TenantSwitcher.
 *
 * Server Component (no "use client").
 * Height: h-12 (48px). Positions fixed at top, z-50.
 * Contains: LogoMark (left) + TenantSwitcher (center) + ThemeToggle (right).
 *
 * ThemeToggle and TenantSwitcher are Client Components — Next.js handles the
 * Server→Client boundary automatically when a Server Component renders them.
 *
 * 03-arch.md § 2.3 — implementation verbatim.
 * Named export (no default export) per FSD-Lite enforce.
 * HIPAA-lite: no-phi-scope — UI shell organism, zero PHI.
 *
 * downstream-regression-na: brand-local shell organism; no cross-brand consumers
 */

import { LogoMark } from "./LogoMark";
import { TenantSwitcher } from "./TenantSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export interface TopBarGlobalProps {
  /** Additional CSS classes for the header element */
  className?: string;
}

/**
 * TopBarGlobal — global navigation bar for Vitalia shell.
 * Server Component. Client interactivity delegated to ThemeToggle.
 */
export function TopBarGlobal({ className }: TopBarGlobalProps) {
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
      {/* Left: brand logo */}
      <div className="flex items-center gap-3">
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
