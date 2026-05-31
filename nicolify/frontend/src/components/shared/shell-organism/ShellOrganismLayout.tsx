// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-3
"use client";

/**
 * ShellOrganismLayout — main shell layout (SSR-safe wrapper) for Nicolify.
 * nicolify-r0-shell T-3 — port from vitalia ShellOrganismLayout.tsx.
 * Renamed: Valeria → Luana throughout.
 *
 * Wrapper that loads ShellOrganismLayoutClient via next/dynamic with
 * ssr:false. Reason: react-resizable-panels v4.11.1 uses
 * `storage: n = localStorage` as default parameter (bare-name ref)
 * that crashes during SSR pass with ReferenceError. No fix possible
 * from caller (default params evaluate BEFORE any guard). Workaround:
 * dynamic import client-only.
 *
 * SSR fallback: skeleton minimal con TopBarGlobal variant="skeleton" +
 * main#main-content (mantiene skip-link target accesible + layout-shift mínimo).
 *
 * Trade-off aceptado: el shell layout interno (PanelGroup) no es SSR-rendered.
 * Mismo pattern que dashboards interactivos pesados.
 *
 * G2 (ADR-nicolify-001): skeleton stores NO subscribe useShellStore.
 * Prevents spurious default write during SSR/pre-hydration (Bug C3).
 *
 * No PHI — chrome UI, no clinical/business sensitive data.
 * downstream-regression-na: brand-local shell component; no cross-brand consumers
 */

import dynamic from "next/dynamic";

import { TopBarGlobal } from "./TopBarGlobal";

export interface ShellOrganismLayoutProps {
  /** Page content rendered by the route group (T-5/T-6 will populate) */
  children: React.ReactNode;
  /** Tenant identifier from URL segment [tenantId] */
  tenantId: string;
}

/**
 * SSR skeleton: TopBarGlobal (store-free variant) + empty main (skip-link target preserved).
 *
 * WHY variant="skeleton":
 * This skeleton renders OUTSIDE the dynamic({ssr:false}) boundary. If we rendered
 * <TopBarGlobal /> (interactive default), it would subscribe useShellStore — causing the
 * Zustand persist middleware to evaluate in SSR/pre-hydration context, write the default
 * value to localStorage, and clobber user preferences on every reload (C3 bug).
 *
 * variant="skeleton" renders an inert, store-free TopBar with the same visual appearance
 * (h-12, burger placeholder) but NO store subscription. The rehydration happens in
 * ShellOrganismLayoutClient (inside the ssr:false boundary) via useStoreHydration().
 *
 * A11y preserved: #main-content skip-link target is still rendered immediately.
 * See ADR-nicolify-001 § G2 (and ADR-vitalia-006 origin).
 */
function ShellOrganismLayoutSkeleton() {
  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-background text-foreground"
      data-shell-ssr-skeleton="true"
    >
      {/* variant="skeleton" = store-free — does NOT subscribe useShellStore (G2) */}
      <TopBarGlobal variant="skeleton" />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-0 overflow-hidden"
        aria-label="Cargando shell"
      />
    </div>
  );
}

/**
 * Client-only dynamic import.
 * `ssr: false` bypasses the SSR pass that crashes for react-resizable-panels v4
 * bare-name localStorage default param. Loads the full layout only on client.
 */
const ShellOrganismLayoutClient = dynamic(
  () =>
    import("./ShellOrganismLayoutClient").then((m) => ({
      default: m.ShellOrganismLayoutClient,
    })),
  {
    ssr: false,
    loading: ShellOrganismLayoutSkeleton,
  },
);

/**
 * ShellOrganismLayout — main shell chrome for Nicolify agéntico experience.
 *
 * Renders full-screen layout client-side post-hydration:
 * - TopBarGlobal (fixed 48px header) — visible immediately via SSR skeleton
 * - Dual-panel resizable area (agentic mode) OR static grid (web mode) desktop
 * - Mobile fallback <main> (drawer pattern T-4)
 *
 * Named export per FSD-Lite (no default export).
 */
export function ShellOrganismLayout(props: ShellOrganismLayoutProps) {
  return <ShellOrganismLayoutClient {...props} />;
}
