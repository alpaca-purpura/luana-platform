// cap: platform.lift-shell-chrome-ui-kit
/**
 * TenantOption — tenant row molecule for dropdown lists (brand-agnostic).
 * Lifted from vitalia/nicolify shell-organism — platform-lift T-C.
 *
 * Server Component (no "use client").
 * Renders: TenantBadge (left) + name + city column (center) + Check (right, when active).
 *
 * Brand coupling removed:
 *   - pickPaletteColor injected as required prop
 *   - activeLabel is configurable (vitalia: "Clínica activa", nicolify: "Agencia activa")
 *   - city rendered with null-check (vitalia pattern — safe for both brands)
 *
 * Named export (NO default) per FSD-Lite enforce.
 */

import { Check } from "lucide-react";
import { cn } from "@luana/format/utils";
import { TenantBadge, type KitTenant, type PaletteColor } from "./TenantBadge";

export interface TenantOptionProps {
  /** The tenant to display */
  tenant: KitTenant;
  /** Whether this is the currently active tenant */
  active: boolean;
  /** Brand-injected palette color picker — passed through to TenantBadge */
  pickPaletteColor: (tenantId: string) => PaletteColor;
  /**
   * Screen-reader label for the active indicator.
   * Defaults to "Espacio activo" (neutral LatAm — brand overrides as needed).
   */
  activeLabel?: string;
}

/**
 * TenantOption — row component for the tenant list inside a dropdown.
 * Server Component.
 */
export function TenantOption({
  tenant,
  active,
  pickPaletteColor,
  activeLabel = "Espacio activo",
}: TenantOptionProps) {
  return (
    <div
      data-testid={`tenant-option-${tenant.id}`}
      data-active={String(active)}
      className={cn(
        "flex w-full items-center gap-3 rounded-sm px-2 py-2",
        active ? "bg-accent/40" : "hover:bg-muted",
      )}
    >
      <TenantBadge tenant={tenant} pickPaletteColor={pickPaletteColor} />

      {/* Name + city column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {tenant.name}
        </span>
        {tenant.city ? (
          <span className="truncate text-xs text-muted-foreground">
            {tenant.city}
          </span>
        ) : null}
      </div>

      {/* Active indicator */}
      {active ? (
        <>
          <Check
            className="size-4 shrink-0 text-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">{activeLabel}</span>
        </>
      ) : null}
    </div>
  );
}
