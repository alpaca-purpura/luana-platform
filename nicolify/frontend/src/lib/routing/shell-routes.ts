// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-5
/**
 * shell-routes.ts — Nicolify shell routing SSoT.
 *
 * Single source of truth for:
 *   - AGENT_CATALOG (5 Revenue/Ops agents + config — Luana is sidebar, NOT a tab)
 *   - AGENT_RIBBON_ORDER (Ribbon tab order: abel, brenda, christian, sara, norvil)
 *   - AGENT_SUBTABS (sub-tab definitions per agent, from navigation-tree.md ratificado)
 *   - DEFAULT_LANDING (christian/pipeline — ratificado 2026-05-30)
 *   - Guards: isValidAgent · isValidSubtab · getDefaultSubtab
 *   - URL extractors: extractAgentFromPath · extractSubtabFromPath
 *
 * ANTI-PATTERN GUARD (XSS / path-injection A4):
 * Guards use whitelist-only validation. ANY input not in the catalog → false/null.
 * This covers: <script> injections, ../../ path traversals, SQL fragments, prototype pollution.
 *
 * N3 sub-sub-tabs (R0-static empty):
 * In R0 no N3 routes exist. AGENT_SUBSUBTABS = {} (empty).
 * Imported by SubSubTabsBar — returns null for all combos → no N3 bar rendered.
 *
 * Architecture fitness: test_shell_routes_ssot.test.ts enforces this file as SSoT.
 * No other file may define AGENT_CATALOG or AGENT_SUBTABS arrays.
 *
 * spec_anchor: 01-spec.md § Routing SSoT + navigation-tree.md + 04-validators.yaml T-5
 * gherkin_coverage: E1 E2 E3 E4 E5 A4
 * downstream-regression-na: brand-local nicolify shell; no cross-brand consumers
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Ribbon tab slug — 5 Revenue/Ops agents + config special tab. Luana excluded (orchestrator). */
export type RibbonTabSlug = "abel" | "brenda" | "christian" | "sara" | "norvil" | "config";

/** Descriptor for a single sub-tab entry. */
export interface SubTabMeta {
  /** URL segment identifier — kebab-case (e.g. "oferta", "pipeline"). */
  id: string;
  /** Visible label — Spanish neutro LatAm, sin voseo. */
  label: string;
  /** Emoji icon (decorative). */
  icon: string;
}

/** Ribbon agent descriptor. */
export interface RibbonAgentDescriptor {
  slug: RibbonTabSlug;
  name: string;
  /** Short label displayed in the ribbon tab. Spanish neutro LatAm. */
  tabLabel: string;
  /** Default sub-tab slug navigated to when clicking the ribbon tab. */
  defaultSubtab: string;
}

/** N3 sub-sub-tab descriptor (empty in R0, populated in future releases). */
export interface SubSubTabMeta {
  /** URL segment identifier — kebab-case static segment. */
  id: string;
  /** Visible label — Spanish neutro LatAm, sin voseo. */
  label: string;
  /** Emoji icon. */
  icon: string;
}

/** Default landing anchor: agent + subtab ratificado. */
export interface LandingAnchor {
  agent: RibbonTabSlug;
  subtab: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_CATALOG — 5 Revenue/Ops agents + config
// Luana = orchestrator sidebar, NOT in AGENT_CATALOG (NOT a ribbon tab).
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_CATALOG: Record<RibbonTabSlug, RibbonAgentDescriptor> = {
  abel: {
    slug: "abel",
    name: "Abel",
    tabLabel: "Estrategia",
    defaultSubtab: "oferta",
  },
  brenda: {
    slug: "brenda",
    name: "Brenda",
    tabLabel: "Growth",
    defaultSubtab: "campanas",
  },
  christian: {
    slug: "christian",
    name: "Christian",
    tabLabel: "Ventas",
    defaultSubtab: "prospectos",
  },
  sara: {
    slug: "sara",
    name: "Sara",
    tabLabel: "Proyectos",
    defaultSubtab: "proyectos",
  },
  norvil: {
    slug: "norvil",
    name: "Norvil",
    tabLabel: "Cuentas",
    defaultSubtab: "cuentas",
  },
  config: {
    slug: "config",
    name: "Configurar",
    tabLabel: "Configurar",
    defaultSubtab: "conexiones",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_RIBBON_ORDER — canonical Ribbon tab order (abel→brenda→christian→sara→norvil)
// ConfigTab is always last and handled separately by Ribbon.tsx (ml-auto right-aligned).
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_RIBBON_ORDER = [
  "abel",
  "brenda",
  "christian",
  "sara",
  "norvil",
] as const satisfies readonly Exclude<RibbonTabSlug, "config">[];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_LANDING — ratificado christian/pipeline (CONTEXT-BRIEF + 01-spec.md)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_LANDING: LandingAnchor = {
  agent: "christian",
  subtab: "pipeline",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_SUBTABS — sub-tab definitions per agent (from navigation-tree.md)
// Sara ONLY has [proyectos] in R0 — navigation-tree.md constraint.
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_SUBTABS: Record<RibbonTabSlug, readonly SubTabMeta[]> = {
  abel: [
    { id: "oferta", label: "Oferta", icon: "📦" },
    { id: "angulos", label: "Ángulos", icon: "🎯" },
    { id: "escalera-valor", label: "Escalera de valor", icon: "📈" },
    { id: "marca", label: "Marca", icon: "🏷️" },
  ],
  brenda: [
    { id: "campanas", label: "Campañas", icon: "📢" },
    { id: "contenido", label: "Contenido", icon: "✍️" },
    { id: "presupuesto", label: "Presupuesto", icon: "💰" },
  ],
  christian: [
    { id: "prospectos", label: "Prospectos", icon: "🔍" },
    { id: "secuencias", label: "Secuencias", icon: "📧" },
    { id: "pipeline", label: "Pipeline", icon: "📊" },
    { id: "propuestas", label: "Propuestas", icon: "📝" },
    { id: "licitaciones", label: "Licitaciones", icon: "⛏️" },
  ],
  sara: [
    // R0: Sara tiene ÚNICAMENTE [proyectos] (navigation-tree.md constraint)
    // Expandir en R1+ con más subtabs según spec
    { id: "proyectos", label: "Proyectos", icon: "📋" },
  ],
  norvil: [
    { id: "cuentas", label: "Cuentas", icon: "🏢" },
    { id: "salud-cuenta", label: "Salud de cuenta", icon: "💚" },
    { id: "renovaciones", label: "Renovaciones", icon: "🔄" },
  ],
  config: [
    { id: "conexiones", label: "Conexiones", icon: "🔌" },
    { id: "preferencias", label: "Preferencias", icon: "⚙️" },
    { id: "tokens", label: "Tokens", icon: "🪙" },
    { id: "agentes", label: "Agentes", icon: "🤖" },
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_SUBSUBTABS — N3-static sub-sub-tabs (empty in R0)
// Consumed by SubSubTabsBar — returns null for all combos in R0 → no N3 bar rendered.
// Populate in future stories when N3-static routing is needed per navigation-tree.md.
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_SUBSUBTABS: Partial<Record<`${string}.${string}`, readonly SubSubTabMeta[]>> = {
  // R0: empty — no N3-static routes yet.
  // Future: "christian.pipeline": [...], "christian.propuestas": [...], etc.
} as const;

/**
 * Returns sub-sub-tabs for a given agent.subtab combo, or null if none (R0 = always null).
 * Used by SubSubTabsBar.
 */
export function getSubSubTabs(agent: string, subtab: string): readonly SubSubTabMeta[] | null {
  const key: `${string}.${string}` = `${agent}.${subtab}`;
  return AGENT_SUBSUBTABS[key] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// WHITELIST GUARDS (A4: XSS / path-injection defense-in-depth)
// All guards use strict membership checks. Unknown input → false/null.
// ─────────────────────────────────────────────────────────────────────────────

/** All valid ribbon tab slugs (whitelist for guard checks). */
const VALID_RIBBON_SLUGS = new Set<string>([
  "abel",
  "brenda",
  "christian",
  "sara",
  "norvil",
  "config",
]);

/**
 * Returns true iff `agent` is a valid ribbon tab slug.
 * Rejects: unknown strings, XSS payloads, path traversals, prototype keys, null/undefined.
 *
 * NEVER use template literals for agent-based class names (G3 gate).
 * spec_anchor: A4 scenario guard
 */
export function isValidAgent(agent: unknown): agent is RibbonTabSlug {
  if (typeof agent !== "string" || agent.length === 0) return false;
  return VALID_RIBBON_SLUGS.has(agent);
}

/**
 * Returns true iff `subtab` is a valid sub-tab id for the given `agent`.
 * Both agent and subtab must be whitelisted.
 *
 * spec_anchor: A4 scenario guard + E3 scenario
 */
export function isValidSubtab(agent: unknown, subtab: unknown): boolean {
  if (!isValidAgent(agent)) return false;
  if (typeof subtab !== "string" || subtab.length === 0) return false;
  const subtabs = AGENT_SUBTABS[agent];
  return subtabs.some((t) => t.id === subtab);
}

/**
 * Returns the default (first) sub-tab id for a valid agent, or null.
 * Returns null for invalid agent slugs (including 'luana').
 *
 * spec_anchor: E1 scenario (click agent → default subtab)
 */
export function getDefaultSubtab(agent: unknown): string | null {
  if (!isValidAgent(agent)) return null;
  return AGENT_SUBTABS[agent][0]?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL EXTRACTORS — used by Ribbon, SubTabsBar, SubSubTabsBar for URL-derived state
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the [agent] segment from a Next.js pathname.
 * Pattern: /{tenantId}/{agent}/{subtab}/... → returns {agent} if valid, else null.
 *
 * XSS guard: whitelist check via isValidAgent.
 *
 * Examples:
 *   /tenant-x/abel/oferta        → "abel"
 *   /tenant-x/config/conexiones  → "config"
 *   /tenant-x/luana/chat         → null (orchestrator, not ribbon tab)
 *   /tenant-x/<script>/anything  → null (XSS guard)
 *   /tenant-x                    → null (no agent segment)
 */
export function extractAgentFromPath(pathname: string | null | undefined): RibbonTabSlug | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const [, candidate] = segments;
  return isValidAgent(candidate) ? candidate : null;
}

/**
 * Extracts the [subtab] segment from a Next.js pathname.
 * Pattern: /{tenantId}/{agent}/{subtab}/... → returns {subtab} raw value (no validation here).
 * Validation (whitelist check) is done by isValidSubtab where needed.
 *
 * Returns null if fewer than 3 segments (no subtab in path).
 */
export function extractSubtabFromPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  // segments[0]=tenantId, [1]=agent, [2]=subtab
  return segments[2] ?? null;
}
