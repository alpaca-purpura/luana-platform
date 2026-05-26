/**
 * valeria/index.ts — Feature public API (FSD-Lite boundary matrix).
 * F1-S10 vitalia-fase1-empty-states
 *
 * Exposes placeholder components created in T-2 and T-7.
 * T-7 adds 5 agenda molecules + AgendaPlaceholder organismo.
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// ── Placeholder components (T-2 generic EmptyState wrappers) ──────────────────
export { PacientesPlaceholder } from "./components/placeholders/PacientesPlaceholder";

// ── Agenda organismo (T-7) ────────────────────────────────────────────────────
export { AgendaPlaceholder } from "./components/placeholders/AgendaPlaceholder";

// ── Agenda molecules (T-7) ────────────────────────────────────────────────────
export { AgendaToolbar } from "./components/agenda/AgendaToolbar";
export type { AgendaToolbarProps, PeriodMode } from "./components/agenda/AgendaToolbar";
export { AgendaFilters } from "./components/agenda/AgendaFilters";
export type { AgendaFiltersProps } from "./components/agenda/AgendaFilters";
export { AgendaDayHeader } from "./components/agenda/AgendaDayHeader";
export type { AgendaDayHeaderProps } from "./components/agenda/AgendaDayHeader";
export { AgendaSlot } from "./components/agenda/AgendaSlot";
export type { AgendaSlotProps, SlotStatus, SlotOrigin } from "./components/agenda/AgendaSlot";
export { AgendaSummaryFooter } from "./components/agenda/AgendaSummaryFooter";
export type { AgendaSummaryFooterProps } from "./components/agenda/AgendaSummaryFooter";
