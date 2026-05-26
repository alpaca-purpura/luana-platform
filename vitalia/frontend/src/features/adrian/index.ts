/**
 * adrian/index.ts — Feature public API (FSD-Lite boundary matrix).
 * F1-S10 vitalia-fase1-empty-states
 *
 * Exposes placeholder components created in T-2.
 * Special placeholders (T-4: EmbudoPlaceholder, T-6: InboxPlaceholder) added by those tickets.
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// ── Placeholder components (T-2 generic EmptyState wrappers) ──────────────────
export { OutboundPlaceholder } from "./components/placeholders/OutboundPlaceholder";
export { PropuestasPlaceholder } from "./components/placeholders/PropuestasPlaceholder";

// ── Placeholder components (T-4 special: AdrianEmbudo) ───────────────────────
export { EmbudoPlaceholder } from "./components/placeholders/EmbudoPlaceholder";
