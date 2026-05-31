// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-2
"use client";

/**
 * TenantSwitcher — agency switcher dropdown skeleton.
 * nicolify-r0-shell T-2 — port skeleton from vitalia TenantSwitcher, re-themed to Nicolify.
 *
 * CLIENT COMPONENT: "use client" required (DropdownMenu Radix).
 *
 * T-2 SCOPE: SKELETON ONLY — placeholder "Cambiar de agencia" trigger.
 * - No live tenant data (useTenants hook wired in T-3+ data layer)
 * - No useTenantStore (store created in T-3)
 * - Static UI skeleton with placeholder microcopy
 *
 * T-3+ will wire:
 * - useTenants() React Query hook
 * - useTenantStore() Zustand
 * - Path preservation redirect on tenant switch
 *
 * Accessible:
 * - aria-label="Cambiar de agencia" on trigger (no "clínica" — Nicolify is B2B agencies)
 * - Spanish neutro: tuteo, no voseo
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism component; no cross-brand consumers
 */

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * TenantSwitcher — agency switcher skeleton for T-2.
 * Shows placeholder trigger; full implementation in T-3+.
 */
export function TenantSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-testid="tenant-switcher-trigger"
          aria-label="Cambiar de agencia"
          title="Cambiar de agencia"
          className="flex h-8 items-center gap-1.5 px-2 text-sm font-medium"
        >
          <span className="hidden max-w-[120px] truncate text-muted-foreground sm:inline-block">
            Agencia
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64" data-testid="tenant-switcher-dropdown">
        {/* ── Header ─────────────────────────────────────────────── */}
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          MIS AGENCIAS
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* ── Skeleton placeholder ───────────────────────────────── */}
        <div className="px-3 py-4 text-sm text-muted-foreground">
          {/* T-3+ will populate this with real agency list */}
          <p className="text-center text-xs">Cargando agencias…</p>
        </div>

        {/* ── Footer actions ──────────────────────────────────────── */}
        <DropdownMenuSeparator />
        <div className="flex flex-col gap-0.5 p-1">
          <AddAgencyButton />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * AddAgencyButton — placeholder trigger for the add agency flow.
 * Inline since it's only used in TenantSwitcher footer.
 */
function AddAgencyButton() {
  return (
    <button
      type="button"
      className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-muted focus:outline-none"
      onClick={() => {
        // T-3+ will wire AddAgencyPlaceholderModal here
      }}
    >
      Agregar agencia
    </button>
  );
}
