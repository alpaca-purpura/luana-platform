// cap: platform.lift-shell-chrome-ui-kit
/**
 * TenantBadge — tenant initials badge atom (brand-agnostic).
 * Lifted from vitalia/nicolify shell-organism — platform-lift T-C.
 *
 * Server Component (no "use client").
 * Renders a 2-character initials badge with a deterministic background color
 * derived via the injected pickPaletteColor function (brand-local palette).
 *
 * Brand coupling removed:
 *   - pickPaletteColor injected as required prop (brand owns the palette)
 *   - KitTenant type is generic (city optional — vitalia/nicolify compatible)
 *
 * Initials: first character of each word (max 2), uppercased.
 * Fallback: "?" when tenant name is empty.
 *
 * aria-hidden=true: decorative element — TenantOption provides accessible name via sr-only.
 *
 * Named export (NO default) per FSD-Lite enforce.
 */

import { cn } from "@luana/format/utils";

export interface KitTenant {
  id: string;
  name: string;
  city?: string;
}

export interface PaletteColor {
  bg: string;
  text: string;
}

export interface TenantBadgeProps {
  /** The tenant to display initials and color for */
  tenant: KitTenant;
  /** Brand-injected palette color picker — called with tenant.id */
  pickPaletteColor: (tenantId: string) => PaletteColor;
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * Derives 2-character uppercase initials from a tenant name.
 * Takes the first character of each word (up to 2 words).
 * Falls back to "?" for empty names.
 */
export function getTenantInitials(name: string): string {
  if (!name.trim()) return "?";
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * TenantBadge — rounded badge showing tenant initials.
 * Server Component.
 */
export function TenantBadge({ tenant, pickPaletteColor, className }: TenantBadgeProps) {
  const { bg, text } = pickPaletteColor(tenant.id);
  const initials = getTenantInitials(tenant.name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded text-xs font-bold",
        bg,
        text,
        className,
      )}
    >
      {initials}
    </span>
  );
}
