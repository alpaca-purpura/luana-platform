// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s4-TBD
/**
 * AppPanelSlot — Application content panel host.
 * F1-S4 vitalia-fase1-shell-layout-5050 (original shell grid)
 * F1-S7 vitalia-fase1-ribbon-6-tabs (T-4: swap skeleton ribbon → <Ribbon /> real)
 * F1-S8 vitalia-fase1-sub-tabs-line2 (T-5: swap skeleton sub-tabs → <SubTabsBar /> real)
 * F2-S7 vitalia-fase2-lisa-marca T-4: mount <SubSubTabsBar /> between SubTabsBar + content
 *
 * Host for the main application panel (ribbon nav + sub-tabs + sub-sub-tabs + page content).
 * F1-S7 replaced the skeleton ribbon silhouette with <Ribbon /> real organism.
 * F1-S8 replaced the sub-tabs skeleton with <SubTabsBar /> real organism.
 * F2-S7 T-4 adds <SubSubTabsBar /> (N3-static, ADR-vitalia-004 v1.1) — returns null
 *   automatically for all agent.subtab combos without N3 entries.
 *
 * Server Component — no "use client" needed. <Ribbon />, <SubTabsBar />, <SubSubTabsBar />
 * are Client Components (Next.js App Router natural server/client boundary).
 * Server Component hosts Client Component slots per tessl__nextjs-app-router-modularization.
 *
 * Grid structure: flex-col with Ribbon (h-14) + SubTabsBar (min-h-[42px]) +
 * SubSubTabsBar (min-h-[38px], conditional) + content children. Named export per FSD-Lite.
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
import { SubSubTabsBar } from "./SubSubTabsBar";

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

      {/* Sub-sub-tabs line 3 — F2-S7 N3-static bar (ADR-vitalia-004 v1.1).
          Returns null automatically for agent.subtab combos without N3 entries.
          Only visible when current route has an AGENT_SUBSUBTABS entry (e.g. lisa/marca). */}
      <SubSubTabsBar />

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
    </section>
  );
}
