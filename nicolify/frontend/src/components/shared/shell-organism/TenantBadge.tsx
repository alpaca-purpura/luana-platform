// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-2
/**
 * TenantBadge — agency initials badge atom.
 * nicolify-r0-shell T-2 — port from vitalia TenantBadge.tsx, re-themed to Nicolify.
 *
 * Server Component (no "use client").
 * Renders a 2-character initials badge with a deterministic background color
 * derived from the tenant ID via pickPaletteColor (tenant-palette.ts).
 *
 * Initials: first character of each word (max 2), uppercased.
 * Fallback: "?" when tenant name is empty.
 *
 * aria-hidden=true: decorative element — TenantOption provides accessible name via sr-only.
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism atom; no cross-brand consumers
 */

import { pickPaletteColor } from "@/lib/tenant-palette";
import { cn } from "@/lib/utils";

import type { Tenant } from "./types";

export interface TenantBadgeProps {
  /** The tenant to display initials and color for */
  tenant: Tenant;
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * Derives 2-character uppercase initials from a tenant name.
 * Takes the first character of each word (up to 2 words).
 * Falls back to "?" for empty names.
 */
function getInitials(name: string): string {
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
 * TenantBadge — circular/rounded badge showing agency initials.
 * Server Component.
 */
export function TenantBadge({ tenant, className }: TenantBadgeProps) {
  const { bg, text } = pickPaletteColor(tenant.id);
  const initials = getInitials(tenant.name);

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
