// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-sitemap-completo T-1 (rewrite v3 from nicolify-r0-shell T-5)
/**
 * shell-routes.ts — Nicolify shell routing SSoT.
 *
 * Single source of truth for:
 *   - AGENT_CATALOG (5 Revenue/Ops agents + config — Luana is sidebar, NOT a tab)
 *   - AGENT_RIBBON_ORDER (Ribbon tab order: abel, brenda, christian, sara, norvil)
 *   - AGENT_SUBTABS (sub-tab definitions per agent, v3 from SYSTEM-MAP v2.0)
 *   - AGENT_SUBSUBTABS (N3 leaves — 3 populated combos: abel.oferta, christian.propuestas, norvil.fidelizacion)
 *   - DEFAULT_LANDING (christian/pipeline — ratificado 2026-05-30, SIN cambio)
 *   - Guards: isValidAgent · isValidSubtab · isValidSubSubTab · getDefaultSubtab
 *   - URL extractors: extractAgentFromPath · extractSubtabFromPath
 *
 * ANTI-PATTERN GUARD (XSS / path-injection A4):
 * Guards use whitelist-only validation. ANY input not in the catalog → false/null.
 * This covers: <script> injections, ../../ path traversals, SQL fragments, prototype pollution.
 *
 * N3 sub-sub-tabs (populated in sitemap-completo T-1):
 *   - "abel.oferta":          [catalogo-escalera, dossier-mineria]
 *   - "christian.propuestas": [propuestas, licitaciones]
 *   - "norvil.fidelizacion":  [momentos, champion-shield, value-proof-qbr, gifting]
 * All other combos return null → SubSubTabsBar renders no N3 bar.
 *
 * Architecture fitness: test_shell_routes_ssot.test.ts enforces this file as SSoT.
 * No other file may define AGENT_CATALOG or AGENT_SUBTABS arrays.
 *
 * spec_anchor: SYSTEM-MAP.yaml v2.0 + 01-sitemap.md v3 + 06-tickets.yaml T-1
 * gherkin_coverage: E1 E2 E3 E4 E5 A4 F-NAV-WALK F-SARA-PROXIMAMENTE F-INVALID-GUARD
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

/** N3 sub-sub-tab descriptor. */
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
// defaultSubtab per agent = SYSTEM-MAP v2.0 (sitemap-completo T-1).
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_CATALOG: Record<RibbonTabSlug, RibbonAgentDescriptor> = {
  abel: {
    slug: "abel",
    name: "Abel",
    tabLabel: "Estrategia",
    defaultSubtab: "icp",
  },
  brenda: {
    slug: "brenda",
    name: "Brenda",
    tabLabel: "Growth",
    defaultSubtab: "contenido-presencia",
  },
  christian: {
    slug: "christian",
    name: "Christian",
    tabLabel: "Ventas",
    defaultSubtab: "pipeline",
  },
  sara: {
    slug: "sara",
    name: "Sara",
    // Sara deferred (Chris OI-C 2026-06-02 · ADR-nicolify-002 D-D amendment).
    // tabLabel reflects the deferred state for the user.
    tabLabel: "Próximamente",
    defaultSubtab: "proximamente",
  },
  norvil: {
    slug: "norvil",
    name: "Norvil",
    tabLabel: "Cuentas",
    defaultSubtab: "cartera",
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
// AGENT_SUBTABS — sub-tab definitions per agent (v3 · SYSTEM-MAP v2.0)
// Sara has ONLY [proximamente] — deferred (ADR-nicolify-002 D-D amendment).
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_SUBTABS: Record<RibbonTabSlug, readonly SubTabMeta[]> = {
  abel: [
    { id: "icp", label: "ICP & buyer", icon: "🎯" },
    { id: "oferta", label: "Oferta", icon: "📦" },
    { id: "marca", label: "Marca", icon: "🏷️" },
  ],
  brenda: [
    { id: "contenido-presencia", label: "Contenido & Presencia", icon: "✍️" },
    { id: "pauta", label: "Pauta", icon: "📢" },
    { id: "inteligencia-asesoria", label: "Inteligencia & Asesoría", icon: "🧠" },
  ],
  christian: [
    { id: "contactos", label: "Contactos", icon: "👥" },
    { id: "inbox", label: "Inbox", icon: "📥" },
    { id: "pipeline", label: "Pipeline", icon: "📊" },
    { id: "equipo-comercial", label: "Equipo comercial", icon: "🧑‍💼" },
    { id: "agenda", label: "Agenda", icon: "📅" },
    { id: "propuestas", label: "Propuestas", icon: "📝" },
  ],
  sara: [
    // Sara deferred (Chris OI-C 2026-06-02 · ADR-nicolify-002 D-D amendment).
    // Exactly 1 placeholder subtab — SSoT arch test enforces idMatches.length===1.
    { id: "proximamente", label: "Próximamente", icon: "⏳" },
  ],
  norvil: [
    { id: "cartera", label: "Cartera", icon: "🗂️" },
    { id: "renovaciones", label: "Renovaciones", icon: "🔄" },
    { id: "fidelizacion", label: "Fidelización", icon: "💚" },
  ],
  config: [
    { id: "conexiones", label: "Conexiones", icon: "🔌" },
    { id: "preferencias", label: "Preferencias", icon: "⚙️" },
    { id: "tokens", label: "Tokens", icon: "🪙" },
    { id: "autonomia-agentes", label: "Autonomía de agentes", icon: "🤖" },
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_SUBSUBTABS — N3-static sub-sub-tabs (sitemap-completo T-1)
// 3 populated combos: abel.oferta / christian.propuestas / norvil.fidelizacion
// All other combos return null → SubSubTabsBar renders no N3 bar.
// Key pattern: "{agent}.{subtab}" — avoids collision (christian.propuestas.propuestas is valid).
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_SUBSUBTABS: Partial<Record<`${string}.${string}`, readonly SubSubTabMeta[]>> = {
  "abel.oferta": [
    { id: "catalogo-escalera", label: "Catálogo & escalera", icon: "📦" },
    { id: "dossier-mineria", label: "Dossier (minería)", icon: "⛏️" },
  ],
  "christian.propuestas": [
    { id: "propuestas", label: "Propuestas", icon: "📝" },
    { id: "licitaciones", label: "Licitaciones", icon: "⛏️" },
  ],
  "norvil.fidelizacion": [
    { id: "momentos", label: "Momentos", icon: "🎂" },
    { id: "champion-shield", label: "Champion-shield", icon: "🛡️" },
    { id: "value-proof-qbr", label: "Value-proof / QBR", icon: "📈" },
    { id: "gifting", label: "Gifting", icon: "🎁" },
  ],
} as const;

/**
 * Returns sub-sub-tabs for a given agent.subtab combo, or null if none.
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
 * Returns true iff `subsubtab` is a valid N3 leaf for the given agent+subtab combo.
 * All three inputs (agent, subtab, subsubtab) must be whitelisted.
 *
 * Symmetric to isValidSubtab — covers A4 XSS/path-injection at N3.
 * Covers: <script> injections, ../../ path traversals, __proto__, empty strings.
 *
 * spec_anchor: A4 scenario guard N3 · 03-arch-fe.md § Whitelist guard N3
 */
export function isValidSubSubTab(agent: unknown, subtab: unknown, subsubtab: unknown): boolean {
  if (!isValidSubtab(agent, subtab)) return false;
  if (typeof subsubtab !== "string" || subsubtab.length === 0) return false;
  const leaves = getSubSubTabs(agent as string, subtab as string);
  return leaves?.some((l) => l.id === subsubtab) ?? false;
}

/**
 * Returns the default (first) sub-tab id for a valid agent, or null.
 * Returns null for invalid agent slugs (including 'luana').
 *
 * NOTE: getDefaultSubtab returns AGENT_SUBTABS[agent][0].id (first array element).
 * christian's first element is "contactos" (not "pipeline").
 * AGENT_CATALOG.christian.defaultSubtab="pipeline" + DEFAULT_LANDING is the session landing default.
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
 *   /tenant-x/abel/icp           → "abel"
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
