/**
 * lisa/index.ts — Feature public API (FSD-Lite boundary matrix).
 * F1-S10 vitalia-fase1-empty-states
 *
 * Exposes placeholder components created in T-2.
 * Special placeholders (T-3: ServiciosPlaceholder) will be re-exported here by T-3.
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// ── Placeholder components (T-2 generic EmptyState wrappers) ──────────────────
export { MarcaPlaceholder } from "./components/placeholders/MarcaPlaceholder";
export { DoctoresPlaceholder } from "./components/placeholders/DoctoresPlaceholder";
export { CompliancePlaceholder } from "./components/placeholders/CompliancePlaceholder";

// ── Special placeholders (T-3) ─────────────────────────────────────────────────
export { ServiciosPlaceholder } from "./components/placeholders/ServiciosPlaceholder";
