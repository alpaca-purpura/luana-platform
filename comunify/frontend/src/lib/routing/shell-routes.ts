// cap: comunify-shell-organism
/**
 * shell-routes.ts — Comunify shell routing SSoT.
 *
 * Single source of truth for:
 *   - AGENT_CATALOG (5 creator agents + plataforma — Luana is sidebar, NOT a tab)
 *   - AGENT_RIBBON_ORDER (Ribbon tab order: nina, tomas, sofia, bruno, lucia)
 *   - AGENT_SUBTABS (sub-tab definitions per agent, per navigation-tree.md v2)
 *   - AGENT_SUBSUBTABS (N3 leaves — 4 populated combos)
 *   - DEFAULT_LANDING (nina/marca — ratificado)
 *   - Guards: isValidAgent · isValidSubtab · isValidSubSubTab · getDefaultSubtab
 *   - URL extractors: extractAgentFromPath · extractSubtabFromPath
 *
 * ANTI-PATTERN GUARD (XSS / path-injection A4):
 * Guards use whitelist-only validation. ANY input not in the catalog → false/null.
 * This covers: <script> injections, ../../ path traversals, SQL fragments, prototype pollution.
 *
 * Comunify cast (ADR-comunify-001):
 *   Nina (Estratega) · Tomás (Atraer) · Sofía (Vender) · Bruno (Operar) · Lucía (Retener)
 *   Luana = supervisora sidebar (orchestrator, NOT in ribbon)
 *   Plataforma = config tab (right-aligned, ml-auto)
 *
 * spec_anchor: navigation-tree.md v2 + 03-arch-fe.md + 06-tickets.yaml T-shell
 * downstream-regression-na: brand-local comunify shell; no cross-brand consumers
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Ribbon tab slug — 5 creator agents + plataforma config tab. Luana excluded (orchestrator sidebar). */
export type RibbonTabSlug =
  | "nina"
  | "tomas"
  | "sofia"
  | "bruno"
  | "lucia"
  | "plataforma";

/** Descriptor for a single sub-tab entry. */
export interface SubTabMeta {
  /** URL segment identifier — kebab-case (e.g. "marca", "cohorts"). */
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
// AGENT_CATALOG — 5 creator agents + plataforma
// Luana = orchestrator sidebar, NOT in AGENT_CATALOG (NOT a ribbon tab).
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_CATALOG: Record<RibbonTabSlug, RibbonAgentDescriptor> = {
  nina: {
    slug: "nina",
    name: "Nina",
    tabLabel: "Estratega",
    defaultSubtab: "marca",
  },
  tomas: {
    slug: "tomas",
    name: "Tomás",
    tabLabel: "Atraer",
    defaultSubtab: "referentes",
  },
  sofia: {
    slug: "sofia",
    name: "Sofía",
    tabLabel: "Vender",
    defaultSubtab: "conversaciones",
  },
  bruno: {
    slug: "bruno",
    name: "Bruno",
    tabLabel: "Operar",
    defaultSubtab: "comunidad",
  },
  lucia: {
    slug: "lucia",
    name: "Lucía",
    tabLabel: "Retener",
    defaultSubtab: "suscripciones",
  },
  plataforma: {
    slug: "plataforma",
    name: "Plataforma",
    tabLabel: "Plataforma",
    defaultSubtab: "conexiones",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_RIBBON_ORDER — canonical Ribbon tab order (nina→tomas→sofia→bruno→lucia)
// Plataforma/config tab is always last and handled separately by Ribbon.tsx (ml-auto right-aligned).
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_RIBBON_ORDER = [
  "nina",
  "tomas",
  "sofia",
  "bruno",
  "lucia",
] as const satisfies readonly Exclude<RibbonTabSlug, "plataforma">[];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_LANDING — nina/marca (ratificado, navigation-tree.md v2)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_LANDING: LandingAnchor = {
  agent: "nina",
  subtab: "marca",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_SUBTABS — sub-tab definitions per agent (navigation-tree.md v2)
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_SUBTABS: Record<RibbonTabSlug, readonly SubTabMeta[]> = {
  nina: [
    { id: "marca", label: "Marca", icon: "🏷️" },
    { id: "ofertas", label: "Ofertas", icon: "📦" },
    { id: "cohorts", label: "Cohorts", icon: "🎓" },
  ],
  tomas: [
    { id: "referentes", label: "Referentes", icon: "🎯" },
    { id: "contenido", label: "Contenido", icon: "✍️" },
    { id: "audiencia", label: "Audiencia", icon: "👥" },
    { id: "pauta", label: "Pauta", icon: "📢" },
  ],
  sofia: [
    { id: "conversaciones", label: "Conversaciones", icon: "💬" },
    { id: "pipeline", label: "Pipeline", icon: "📊" },
    { id: "recuperacion", label: "Recuperación", icon: "🔄" },
  ],
  bruno: [
    { id: "comunidad", label: "Comunidad", icon: "🏘️" },
    { id: "eventos", label: "Eventos", icon: "📅" },
    { id: "moderacion", label: "Moderación", icon: "🛡️" },
  ],
  lucia: [
    { id: "suscripciones", label: "Suscripciones", icon: "💳" },
    { id: "clientes", label: "Clientes", icon: "👤" },
    { id: "fidelizacion", label: "Fidelización", icon: "💚" },
  ],
  plataforma: [
    { id: "conexiones", label: "Conexiones", icon: "🔌" },
    { id: "cuenta", label: "Cuenta", icon: "⚙️" },
    { id: "onboarding", label: "Onboarding", icon: "🚀" },
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_SUBSUBTABS — N3-static sub-sub-tabs (navigation-tree.md v2)
// Populated combos: nina.marca / nina.ofertas / bruno.comunidad / plataforma.cuenta
// All other combos return null → SubSubTabsBar renders no N3 bar.
// Key pattern: "{agent}.{subtab}" — avoids collision.
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_SUBSUBTABS: Partial<
  Record<`${string}.${string}`, readonly SubSubTabMeta[]>
> = {
  "nina.marca": [
    { id: "identidad", label: "Identidad", icon: "✨" },
    { id: "voz", label: "Voz", icon: "🎙️" },
    { id: "autoridad", label: "Autoridad", icon: "🏆" },
    { id: "narrativa", label: "Narrativa", icon: "📖" },
  ],
  "nina.ofertas": [
    { id: "catalogo", label: "Catálogo", icon: "📋" },
    { id: "escalera", label: "Escalera", icon: "📈" },
  ],
  "bruno.comunidad": [
    { id: "feed", label: "Feed", icon: "📰" },
    { id: "miembros", label: "Miembros", icon: "👥" },
    { id: "moderacion", label: "Moderación", icon: "🛡️" },
  ],
  "plataforma.cuenta": [
    { id: "preferencias", label: "Preferencias", icon: "⚙️" },
    { id: "plan", label: "Plan", icon: "💎" },
    { id: "tokens", label: "Tokens", icon: "🪙" },
  ],
} as const;

/**
 * Returns sub-sub-tabs for a given agent.subtab combo, or null if none.
 * Used by SubSubTabsBar.
 */
export function getSubSubTabs(
  agent: string,
  subtab: string,
): readonly SubSubTabMeta[] | null {
  const key: `${string}.${string}` = `${agent}.${subtab}`;
  return AGENT_SUBSUBTABS[key] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// WHITELIST GUARDS (A4: XSS / path-injection defense-in-depth)
// All guards use strict membership checks. Unknown input → false/null.
// ─────────────────────────────────────────────────────────────────────────────

/** All valid ribbon tab slugs (whitelist for guard checks). */
const VALID_RIBBON_SLUGS = new Set<string>([
  "nina",
  "tomas",
  "sofia",
  "bruno",
  "lucia",
  "plataforma",
]);

/**
 * Returns true iff `agent` is a valid ribbon tab slug.
 * Rejects: unknown strings, XSS payloads, path traversals, prototype keys, null/undefined.
 *
 * NEVER use template literals for agent-based class names (G3 gate).
 */
export function isValidAgent(agent: unknown): agent is RibbonTabSlug {
  if (typeof agent !== "string" || agent.length === 0) return false;
  return VALID_RIBBON_SLUGS.has(agent);
}

/**
 * Returns true iff `subtab` is a valid sub-tab id for the given `agent`.
 * Both agent and subtab must be whitelisted.
 */
export function isValidSubtab(agent: unknown, subtab: unknown): boolean {
  if (!isValidAgent(agent)) return false;
  if (typeof subtab !== "string" || subtab.length === 0) return false;
  const subtabs = AGENT_SUBTABS[agent];
  return subtabs.some((t) => t.id === subtab);
}

/**
 * Returns true iff `subsubtab` is a valid N3 leaf for the given agent+subtab combo.
 */
export function isValidSubSubTab(
  agent: unknown,
  subtab: unknown,
  subsubtab: unknown,
): boolean {
  if (!isValidSubtab(agent, subtab)) return false;
  if (typeof subsubtab !== "string" || subsubtab.length === 0) return false;
  const leaves = getSubSubTabs(agent as string, subtab as string);
  return leaves?.some((l) => l.id === subsubtab) ?? false;
}

/**
 * Returns the default (first) sub-tab id for a valid agent, or null.
 * Returns null for invalid agent slugs (including 'luana').
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
 */
export function extractAgentFromPath(
  pathname: string | null | undefined,
): RibbonTabSlug | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const [, candidate] = segments;
  return isValidAgent(candidate) ? candidate : null;
}

/**
 * Extracts the [subtab] segment from a Next.js pathname.
 * Pattern: /{tenantId}/{agent}/{subtab}/... → returns {subtab} raw value.
 * Validation (whitelist check) is done by isValidSubtab where needed.
 */
export function extractSubtabFromPath(
  pathname: string | null | undefined,
): string | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  // segments[0]=tenantId, [1]=agent, [2]=subtab
  return segments[2] ?? null;
}
