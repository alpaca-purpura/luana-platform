// cap: comunify-shell-organism
"use client";

/**
 * TenantSwitcher — creator account switcher dropdown skeleton.
 * T-shell comunify — port skeleton from nicolify TenantSwitcher, re-themed for Comunify.
 *
 * CLIENT COMPONENT: "use client" required (DropdownMenu Radix).
 *
 * T-shell SCOPE: SKELETON ONLY — placeholder "Cambiar cuenta" trigger.
 * - No live tenant data (T-data-layer future ticket will wire useTenants hook)
 * - Static UI skeleton with placeholder microcopy for creators
 *
 * Accessible:
 * - aria-label="Cambiar cuenta de creador" on trigger
 * - Spanish neutro: tuteo, no voseo
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism component; no cross-brand consumers
 */

import { ChevronDown } from "lucide-react";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@luana/ui-kit";

/**
 * TenantSwitcher — creator account switcher skeleton for T-shell.
 * Shows placeholder trigger; full implementation in future data-layer ticket.
 */
export function TenantSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-testid="tenant-switcher-trigger"
          aria-label="Cambiar cuenta de creador"
          title="Cambiar cuenta de creador"
          className="flex h-8 items-center gap-1.5 px-2 text-sm font-medium"
        >
          <span className="hidden max-w-[120px] truncate text-muted-foreground sm:inline-block">
            Cuenta
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64" data-testid="tenant-switcher-dropdown">
        {/* ── Header ─────────────────────────────────────────────── */}
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          MIS CUENTAS
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* ── Skeleton placeholder ───────────────────────────────── */}
        <div className="px-3 py-4 text-sm text-muted-foreground">
          {/* Future data-layer ticket will populate with real creator accounts */}
          <p className="text-center text-xs">Cargando cuentas…</p>
        </div>

        {/* ── Footer actions ──────────────────────────────────────── */}
        <DropdownMenuSeparator />
        <div className="flex flex-col gap-0.5 p-1">
          <AddCreatorButton />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * AddCreatorButton — placeholder trigger for adding a creator account.
 * Inline since it's only used in TenantSwitcher footer.
 */
function AddCreatorButton() {
  return (
    <button
      type="button"
      className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-muted focus:outline-none"
      onClick={() => {
        // Future data-layer ticket will wire add creator account flow
      }}
    >
      Agregar cuenta
    </button>
  );
}
