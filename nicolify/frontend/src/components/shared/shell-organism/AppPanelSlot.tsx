// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-3 (T-5 wires real Ribbon/SubTabsBar/SubSubTabsBar)
/**
 * AppPanelSlot — Application content panel host for Nicolify shell.
 * nicolify-r0-shell T-3 — port from vitalia AppPanelSlot.tsx, re-themed to Nicolify.
 * T-5 (this update): swapped skeleton placeholders → real Ribbon/SubTabsBar/SubSubTabsBar organisms.
 *
 * Host for the main application panel (ribbon nav + sub-tabs + sub-sub-tabs + page content).
 * Server Component shell — Child Client Components (Ribbon, SubTabsBar, SubSubTabsBar)
 * are imported here as Client Components via Next.js App Router natural boundary.
 *
 * Grid structure: flex-col with Ribbon (h-14) + SubTabsBar (min-h-[42px]) +
 * SubSubTabsBar (min-h-[38px], returns null for all R0 routes) + content children.
 * Named export per FSD-Lite.
 *
 * Spec: 06-tickets.yaml T-5 deliverables (wire Ribbon+SubTabsBar+SubSubTabsBar)
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { Ribbon } from "./Ribbon";
import { SubTabsBar } from "./SubTabsBar";
import { SubSubTabsBar } from "./SubSubTabsBar";

interface AppPanelSlotProps {
  /** Page content rendered by the route group (T-6 will populate via routing). */
  children?: React.ReactNode;
}

/**
 * AppPanelSlot — wires Ribbon + SubTabsBar + SubSubTabsBar + page content.
 * Ribbon is always visible. SubTabsBar returns null when no active agent.
 * SubSubTabsBar returns null for all R0 routes (AGENT_SUBSUBTABS is empty).
 */
export function AppPanelSlot({ children }: AppPanelSlotProps) {
  return (
    <section
      role="region"
      aria-label="Panel aplicación"
      data-testid="app-panel-slot"
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background"
    >
      {/* N1 Ribbon — 5 agent tabs + ConfigTab (ml-auto right) */}
      <Ribbon />

      {/* N2 SubTabsBar — URL-derived sub-tabs for active agent (returns null if no active agent) */}
      <SubTabsBar />

      {/* N3 SubSubTabsBar — returns null for all R0 routes (AGENT_SUBSUBTABS empty) */}
      <SubSubTabsBar />

      {/* Content area — children from route group pass-through (T-6 fills routing) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children !== undefined ? (
          children
        ) : (
          /* Content skeleton — rendered when no children provided (T-6 placeholder) */
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
