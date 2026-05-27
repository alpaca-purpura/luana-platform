/**
 * config/index.ts — Feature public API (FSD-Lite boundary matrix).
 * F1-S10 vitalia-fase1-empty-states
 *
 * Exposes placeholder components created in T-2.
 * Special placeholders (T-3: ConexionesPlaceholder) added by that ticket.
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// ── Placeholder components (T-2 generic EmptyState wrappers) ──────────────────
export { CuentaPlaceholder } from "./components/placeholders/CuentaPlaceholder";
export { AvanzadoPlaceholder } from "./components/placeholders/AvanzadoPlaceholder";

// ── Special placeholders (T-3) ─────────────────────────────────────────────────
export { ConexionesPlaceholder } from "./components/placeholders/ConexionesPlaceholder";
