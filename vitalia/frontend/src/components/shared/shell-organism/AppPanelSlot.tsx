/**
 * AppPanelSlot — placeholder Server Component for application content panel
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-2
 *
 * Placeholder slot for the main application panel (tabs, ribbon, sub-tabs).
 * F1-S7 (ribbon-6-tabs), F1-S8 (sub-tabs-line2), and F1-S10 (empty-states)
 * will fill this slot with live content.
 *
 * Server Component (no "use client") — no hooks, no interactivity.
 * Accepts children so the route group layout can pass page content through.
 * Zero PHI — UI shell chrome only.
 *
 * Spec: 03-arch.md § 2.4
 * - element: <section role="region">
 * - aria-label: "Panel aplicación (placeholder — F1-S7/S8/S10 lo construirá)"
 * - data-testid: "app-panel-slot"
 * - Props: { children?: React.ReactNode }
 * - Tailwind: relative flex h-full min-h-0 flex-col overflow-hidden bg-background
 * - Named export (NO default export) per FSD-Lite enforce.
 * - HIPAA-lite: not applicable — chrome UI, no PHI.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

interface AppPanelSlotProps {
  /** Page content rendered by the route group (F1-S7/S8/S10 will populate) */
  children?: React.ReactNode;
}

/**
 * AppPanelSlot — application content panel placeholder.
 * Server Component. Renders children slot for page-level content.
 * Will be enriched with Ribbon + SubTabs + content in F1-S7..S10.
 */
export function AppPanelSlot({ children }: AppPanelSlotProps) {
  return (
    <section
      role="region"
      aria-label="Panel aplicación (placeholder — F1-S7/S8/S10 lo construirá)"
      data-testid="app-panel-slot"
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background"
    >
      {children}
    </section>
  );
}
