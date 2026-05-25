/**
 * AppPanelSlot — Application content panel host.
 * F1-S4 vitalia-fase1-shell-layout-5050 (original shell grid)
 * F1-S7 vitalia-fase1-ribbon-6-tabs (T-4: swap skeleton ribbon → <Ribbon /> real)
 * F1-S8 vitalia-fase1-sub-tabs-line2 (T-5: swap skeleton sub-tabs → <SubTabsBar /> real)
 *
 * Host for the main application panel (ribbon nav + sub-tabs + page content).
 * F1-S7 replaced the skeleton ribbon silhouette with <Ribbon /> real organism.
 * F1-S8 replaced the sub-tabs skeleton with <SubTabsBar /> real organism.
 * F1-S10 (empty-states) will replace the content area skeleton.
 *
 * Server Component — no "use client" needed. <Ribbon /> and <SubTabsBar /> are Client
 * Components (Next.js App Router natural server/client boundary). Server Component hosts
 * Client Component slots per tessl__nextjs-app-router-modularization pattern.
 *
 * Grid structure: flex-col with Ribbon (h-14) + SubTabsBar (min-h-[42px]) +
 * content children (F1-S10 fills). Named export per FSD-Lite enforce.
 *
 * Spec: 03-arch.md § 2.5 (AppPanelSlot MODIFY) · F1-S4 03-arch.md § 2.4 (origin).
 * - element: <section role="region">
 * - aria-label: "Panel aplicación"
 * - data-testid: "app-panel-slot"
 * - Props: { children?: React.ReactNode }
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { Ribbon } from "./Ribbon";
import { SubTabsBar } from "./SubTabsBar";

interface AppPanelSlotProps {
  /** Page content rendered by the route group (F1-S10 will populate). */
  children?: React.ReactNode;
}

export function AppPanelSlot({ children }: AppPanelSlotProps) {
  return (
    <section
      role="region"
      aria-label="Panel aplicación"
      data-testid="app-panel-slot"
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background"
    >
      {/* Ribbon nav — F1-S7 real organism (replaces skeleton silhouette) */}
      <Ribbon />

      {/* Sub-tabs line 2 — F1-S8 real organism (replaces skeleton placeholder) */}
      <SubTabsBar />

      {/* Content area — children from route group pass-through (F1-S10 will fill skeleton) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children !== undefined ? (
          children
        ) : (
          /* Content skeleton — rendered when no children provided (F1-S10 placeholder) */
          <div aria-hidden="true" className="flex flex-col gap-4 p-6">
            <div className="h-3.5 w-[42%] rounded bg-muted opacity-45" />
            <div className="h-2 w-[78%] rounded bg-muted opacity-45" />
            <div className="h-2 w-[60%] rounded bg-muted opacity-45" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="h-[120px] rounded-md bg-muted opacity-55" />
              <div className="h-[120px] rounded-md bg-muted opacity-55" />
              <div className="h-[120px] rounded-md bg-muted opacity-55" />
              <div className="h-[120px] rounded-md bg-muted opacity-55" />
            </div>
          </div>
        )}
      </div>

      {/* Slot label — identifies remaining F1 placeholders */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 whitespace-nowrap rounded-md border border-dashed border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pointer-events-none"
        aria-hidden="true"
      >
        AppPanelSlot · F1-S10
      </span>
    </section>
  );
}
