// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s4-TBD
/**
 * ShellOrganismLayout — main shell layout (SSR-safe wrapper).
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-3 + T-7 SSR fix
 *
 * 03-arch.md § 2.2, § 2.9
 *
 * Wrapper que carga ShellOrganismLayoutClient via next/dynamic con
 * ssr:false. Razón: react-resizable-panels v4.11.1 dist/react-resizable-panels.js:1812
 * usa `storage: n = localStorage` como default parameter (bare-name ref)
 * que crashea durante SSR pass de Next.js con ReferenceError. No fix
 * posible desde caller (default params evalúan ANTES de cualquier guard
 * typeof). Workaround idiomatic Next.js: dynamic import client-only.
 *
 * SSR fallback: skeleton minimal con TopBarGlobal + main#main-content
 * (mantiene skip-link target accesible inmediato + layout-shift mínimo).
 *
 * Trade-off aceptado: el shell layout interno (PanelGroup) no es
 * SSR-rendered. Mismo pattern que dashboards interactivos pesados.
 *
 * HIPAA-lite: not applicable — chrome UI, no PHI.
 * downstream-regression-na: brand-local shell component; no cross-brand consumers
 */

"use client";

import dynamic from "next/dynamic";
import { TopBarGlobal } from "./TopBarGlobal";

export interface ShellOrganismLayoutProps {
  /** Page content rendered by the route group (F1-S7/S8/S10 will populate) */
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
 * value to localStorage, and clobber user preferences on every reload (Bug #1 PROD REAL).
 *
 * variant="skeleton" renders an inert, store-free TopBar with the same visual appearance
 * (h-12, burger placeholder) but NO store subscription. The rehydration happens in
 * ShellOrganismLayoutClient (inside the ssr:false boundary) via useStoreHydration().
 *
 * A11y preserved: #main-content skip-link target is still rendered immediately.
 * See 03-arch.md § 2 Decision D4 and ADR-vitalia-006.
 */
function ShellOrganismLayoutSkeleton() {
  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-background text-foreground"
      data-shell-ssr-skeleton="true"
    >
      {/* variant="skeleton" = store-free — does NOT subscribe useShellStore (D4) */}
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
 * `ssr: false` bypassea el SSR pass que crashea por react-resizable-panels v4
 * bare-name localStorage default param. Carga el layout completo solo en cliente.
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
 * ShellOrganismLayout — main shell chrome for vitalia agéntico experience.
 *
 * Renders full-screen layout client-side post-hydration:
 * - TopBarGlobal (fixed 48px header) — visible inmediato via SSR skeleton
 * - Dual-panel resizable area (agentic mode) OR static grid (web mode) desktop
 * - Mobile fallback <main> (drawer pattern deferred to F1-S5+)
 *
 * Named export per FSD-Lite (no default export).
 */
export function ShellOrganismLayout(props: ShellOrganismLayoutProps) {
  return <ShellOrganismLayoutClient {...props} />;
}
