/**
 * ValeriaSidebarSlot — placeholder Server Component for Valeria sidebar panel
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-2
 *
 * Placeholder slot for the Valeria conversational sidebar.
 * F1-S5 (valeria-rail-history) and F1-S6 (valeria-chat-skeleton) will replace
 * this import in ShellOrganismLayout with the live Valeria component.
 *
 * Server Component (no "use client") — no hooks, no interactivity.
 * Zero PHI — UI shell chrome only.
 *
 * Spec: 03-arch.md § 2.3
 * - element: <aside role="complementary">
 * - aria-label: "Panel Valeria (placeholder — F1-S5/S6 lo construirá)"
 * - data-testid: "valeria-sidebar-slot"
 * - Tailwind: relative flex h-full min-h-0 overflow-hidden border-r border-border bg-card
 * - Named export (NO default export) per FSD-Lite enforce.
 * - HIPAA-lite: not applicable — chrome UI, no PHI.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

/**
 * ValeriaSidebarSlot — empty placeholder sidebar for Valeria agent panel.
 * Server Component. Will be replaced by live Valeria UI in F1-S5/S6.
 */
export function ValeriaSidebarSlot() {
  return (
    <aside
      role="complementary"
      aria-label="Panel Valeria (placeholder — F1-S5/S6 lo construirá)"
      data-testid="valeria-sidebar-slot"
      className="relative flex h-full min-h-0 overflow-hidden border-r border-border bg-card"
    />
  );
}
