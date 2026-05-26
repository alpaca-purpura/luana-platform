/**
 * Agent catalog — Vitalia canonical 6-agent registry.
 *
 * spec_anchor: 01-spec.md § 5.1 + 03-arch.md § 2.4
 * F1-S7 EXTEND: tabLabel + defaultSubtab + AGENT_RIBBON_ORDER + RibbonTabSlug + extractAgentFromPath
 *
 * LIFT CANDIDATE: shell-chat agent catalog cross-brand cuando ≥2 brands lo necesiten.
 * Hoy brand-local Vitalia per anti-duplication.md.
 *
 * NOTE: hex fields are metadata-only (for design reference / color pickers).
 * They are NOT consumed by Tailwind — use colorToken / colorSoftToken CSS vars instead.
 */

export type AgentSlug =
  | "lisa"
  | "valeria"
  | "adrian"
  | "lucas"
  | "camila"
  | "mateo";

export interface AgentDescriptor {
  slug: AgentSlug;
  name: string;
  role: string;
  colorToken: string;
  colorSoftToken: string;
  /** Hex color — metadata only. NOT consumed by Tailwind. Use colorToken instead. */
  hex: string;
  thumbnail: string;
  transparent: string;
  initial: string;
  /** Short label for Ribbon tab (e.g. "Mi Clínica", "Atraer"). Spanish neutro LatAm. F1-S7. */
  tabLabel: string;
  /** Default subtab slug to navigate to when clicking this ribbon tab. F1-S7. */
  defaultSubtab: string;
}

export const AGENT_CATALOG: Record<AgentSlug, AgentDescriptor> = {
  lisa: {
    slug: "lisa",
    name: "Lisa",
    role: "Estratega de marca y oferta",
    colorToken: "agent-lisa",
    colorSoftToken: "agent-lisa-soft",
    hex: "#00D084",
    thumbnail: "/agents/lisa/thumbnail.png",
    transparent: "/agents/lisa/transparent.png",
    initial: "L",
    tabLabel: "Mi Clínica",
    defaultSubtab: "marca",
  },
  valeria: {
    slug: "valeria",
    name: "Valeria",
    role: "Tu secretaria virtual · coordinadora general",
    colorToken: "agent-valeria",
    colorSoftToken: "agent-valeria-soft",
    hex: "#7b2d91",
    thumbnail: "/agents/valeria/thumbnail.png",
    transparent: "/agents/valeria/transparent.png",
    initial: "V",
    tabLabel: "Operar",
    defaultSubtab: "agenda",
  },
  adrian: {
    slug: "adrian",
    name: "Adrián",
    role: "Closer · califica leads y reactiva oportunidades",
    colorToken: "agent-adrian",
    colorSoftToken: "agent-adrian-soft",
    hex: "#01b2f8",
    thumbnail: "/agents/adrian/thumbnail.png",
    transparent: "/agents/adrian/transparent.jpeg",
    initial: "A",
    tabLabel: "Vender",
    defaultSubtab: "inbox",
  },
  lucas: {
    slug: "lucas",
    name: "Lucas",
    role: "Estratega Growth · viraliza y consigue leads",
    colorToken: "agent-lucas",
    colorSoftToken: "agent-lucas-soft",
    hex: "#111111",
    thumbnail: "/agents/lucas/thumbnail.png",
    transparent: "/agents/lucas/transparent.png",
    initial: "L",
    tabLabel: "Atraer",
    defaultSubtab: "lanzar",
  },
  camila: {
    slug: "camila",
    name: "Camila",
    role: "Fidelización · sube CLTV y monitorea satisfacción",
    colorToken: "agent-camila",
    colorSoftToken: "agent-camila-soft",
    hex: "#180d95",
    thumbnail: "/agents/camila/thumbnail.png",
    transparent: "/agents/camila/transparent.png",
    initial: "C",
    tabLabel: "Mantener",
    defaultSubtab: "voz",
  },
  mateo: {
    slug: "mateo",
    name: "Mateo",
    role: "Desarrollador · tecnología y diseño con IA",
    colorToken: "agent-mateo",
    colorSoftToken: "agent-mateo-soft",
    hex: "#fee209",
    thumbnail: "/agents/mateo/thumbnail.png",
    transparent: "/agents/mateo/transparent.png",
    initial: "M",
    tabLabel: "Tecnología",
    defaultSubtab: "ia",
  },
};

export const DEFAULT_CHAT_AGENT: AgentSlug = "valeria";

export const AGENT_SLUGS: AgentSlug[] = Object.keys(
  AGENT_CATALOG,
) as AgentSlug[];

/**
 * Canonical tab order in the Ribbon.
 * Mateo EXCLUDED — transversal agent, out-of-scope F1-S7.
 * spec_anchor: 03-arch.md § 2.1 D1 + 06-tickets.yaml T-1 SC-2
 */
export const AGENT_RIBBON_ORDER = [
  "lisa",
  "lucas",
  "adrian",
  "valeria",
  "camila",
] as const satisfies readonly AgentSlug[];

/**
 * Union type for all valid ribbon tab slugs.
 * Includes AgentSlug (5 agent tabs) + 'config' (ConfigTab special slug).
 * spec_anchor: 03-arch.md § 2.1 + 06-tickets.yaml T-1 SC-3
 */
export type RibbonTabSlug = AgentSlug | "config";

/**
 * Extracts the [agent] segment from a Next.js pathname.
 *
 * Pattern URL: /{tenantId}/{agent}/{subtab}/... → returns {agent} if matches valid slug,
 * null if segment invalid, absent, or XSS payload.
 *
 * XSS guard: implicit via slug enum membership check. Any payload that is not
 * a known AgentSlug or 'config' returns null. No regex needed — enum validation
 * is the defense-in-depth layer (React JSX auto-escapes output).
 *
 * Examples:
 *   /tenant-x/lisa/marca       → "lisa"
 *   /tenant-x/config/cuenta    → "config"
 *   /tenant-x/foobar/baz       → null (slug inválido)
 *   /tenant-x                  → null (no [agent] segment)
 *   /                          → null (vacío)
 *   /<script>alert(1)</script> → null (sanitization implícita por slug enum check)
 *
 * spec_anchor: 03-arch.md § 2.1 D2/D3 + 06-tickets.yaml T-1 SC-2/SC-3/SC-4/SC-6
 */
export function extractAgentFromPath(
  pathname: string | null | undefined,
): RibbonTabSlug | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const candidate = segments[1];
  if (candidate === "config") return "config";
  if ((AGENT_SLUGS as string[]).includes(candidate)) {
    return candidate as AgentSlug;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// F1-S8 — SubTabMeta interface + RIBBON_SUBTABS constant + extractSubtabFromPath
// spec_anchor: 03-arch.md § 2.1 + 01-spec.md § Catalog SSoT § 1
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Sub-tab descriptor — single sub-tab entry inside RIBBON_SUBTABS[slug].
 * 22 sub-tabs total distribuidos: lisa 4 · lucas 5 · adrian 4 · valeria 2 · camila 4 · config 3.
 * spec_anchor: 03-arch.md § 2.1 + 01-spec.md § Catalog SSoT § 1
 */
export interface SubTabMeta {
  /** URL segment identifier — slug kebab-case (e.g., "marca", "doctores", "envuelo"). */
  id: string;
  /** Visible label Spanish neutro LatAm — sin voseo (e.g., "Marca", "En vuelo", "Voz del paciente"). */
  label: string;
  /** Emoji icon (paridad ribbon catalog Q2 cement — emojis no lucide). */
  icon: string;
}

/**
 * Sub-tabs per ribbon tab — 22 sub-tabs distribuidos 4·5·4·2·4·3.
 * Counts: Lisa 4 · Lucas 5 · Adrián 4 · Valeria 2 · Camila 4 · Config 3.
 * Mateo: empty array — transversal agent, not in AGENT_RIBBON_ORDER (F1-S7).
 * Record<RibbonTabSlug, ...> requires mateo key since AgentSlug includes mateo.
 *
 * spec_anchor: 01-spec.md § 1 + 03-arch.md § 2.1 + SHELL-DESIGN-CONTRACT.md § 7.2
 */
export const RIBBON_SUBTABS: Record<RibbonTabSlug, readonly SubTabMeta[]> = {
  lisa: [
    { id: "marca", label: "Marca", icon: "🏥" },
    { id: "doctores", label: "Doctores", icon: "👨‍⚕️" },
    { id: "servicios", label: "Servicios", icon: "🩺" },
    { id: "compliance", label: "Compliance", icon: "🛡️" },
  ],
  lucas: [
    { id: "lanzar", label: "Lanzar", icon: "🚀" },
    { id: "envuelo", label: "En vuelo", icon: "📡" },
    { id: "recursos", label: "Recursos", icon: "📚" },
    { id: "resultados", label: "Resultados", icon: "📈" },
    { id: "mercado", label: "Mercado", icon: "🌍" },
  ],
  adrian: [
    { id: "inbox", label: "Inbox", icon: "💬" },
    { id: "embudo", label: "Embudo", icon: "🎯" },
    { id: "outbound", label: "Outbound", icon: "📣" },
    { id: "propuestas", label: "Propuestas", icon: "💼" },
  ],
  valeria: [
    { id: "agenda", label: "Agenda", icon: "📆" },
    { id: "pacientes", label: "Pacientes", icon: "👥" },
  ],
  camila: [
    { id: "voz", label: "Voz del paciente", icon: "🎤" },
    { id: "reactivar", label: "Reactivar", icon: "🪃" },
    { id: "multiplicar", label: "Multiplicar", icon: "🤝" },
    { id: "reputacion", label: "Reputación", icon: "📊" },
  ],
  /** Mateo: transversal agent — no dedicated sub-tabs (empty array, not shown in SubTabsBar). */
  mateo: [],
  config: [
    { id: "cuenta", label: "Mi cuenta", icon: "🏢" },
    { id: "conexiones", label: "Conexiones", icon: "🔌" },
    { id: "avanzado", label: "Avanzado", icon: "🔬" },
  ],
} as const satisfies Record<RibbonTabSlug, readonly SubTabMeta[]>;

/**
 * F1-S9 routing-shell EXTEND: validators para routing tree dynamic [agent]/[subtab].
 * Consumed by app/[tenantId]/(shell-organism)/[agent]/layout.tsx (T-4).
 *
 * spec_anchor: 03-arch-fe.md § 2.2 MODIFY + 06-tickets.yaml T-2
 */

/**
 * Type guard — returns true if slug is a valid ribbon agent tab slug.
 * Includes: 5 ribbon agents (lisa, valeria, adrian, lucas, camila) + 'config'.
 * Excludes: 'mateo' (transversal agent — not in AGENT_RIBBON_ORDER per F1-S7).
 *
 * XSS safe: enum membership check sanitizes any non-slug payload.
 *
 * Examples:
 *   isValidAgent("lisa")      → true (ribbon agent)
 *   isValidAgent("config")    → true (config tab special slug)
 *   isValidAgent("mateo")     → false (transversal — excluded from ribbon)
 *   isValidAgent("foo")       → false (unknown slug)
 *   isValidAgent("")          → false (empty string)
 *   isValidAgent("<script>")  → false (XSS payload sanitized)
 */
export function isValidAgent(slug: string): slug is RibbonTabSlug {
  if (slug === "config") return true;
  // Explicitly exclude mateo (in AgentSlug but transversal, not in ribbon)
  if (slug === "mateo") return false;
  return slug in AGENT_CATALOG;
}

/**
 * Returns true if subtabSlug is a valid sub-tab for the given agent.
 * Validates against RIBBON_SUBTABS[agent].
 *
 * Examples:
 *   isValidSubtab("lisa", "marca")        → true
 *   isValidSubtab("camila", "reputacion") → true
 *   isValidSubtab("config", "avanzado")   → true
 *   isValidSubtab("mateo", "any")         → false (mateo subtabs empty array)
 *   isValidSubtab("camila", "foo")        → false (invalid subtab)
 *   isValidSubtab("lisa", "")             → false (empty string)
 */
export function isValidSubtab(
  agent: RibbonTabSlug,
  subtabSlug: string,
): boolean {
  if (!subtabSlug) return false;
  const subtabs = RIBBON_SUBTABS[agent];
  if (!subtabs || subtabs.length === 0) return false;
  return subtabs.some((st) => st.id === subtabSlug);
}

/**
 * Extrae el segmento [subtab] del pathname.
 *
 * Pattern URL: /{tenantId}/{agent}/{subtab}/... → retorna {subtab} si segmento presente,
 * null si pathname incompleto o vacío.
 *
 * Defense-in-depth: NO valida que el subtab pertenezca a RIBBON_SUBTABS[agent] —
 * el consumidor (SubTabsBar) hace ese check via .find() y dispone defensive null si
 * el segmento no matchea (SC-5 "invalid subtab → no active"). XSS safe por React
 * JSX auto-escape on render (segmento se compara como string contra ids estáticos).
 *
 * Examples:
 *   /tenant-x/lisa/marca       → "marca"
 *   /tenant-x/camila/reactivar → "reactivar"
 *   /tenant-x/config/cuenta    → "cuenta"
 *   /tenant-x/lisa             → null (insufficient segments)
 *   /tenant-x                  → null
 *   /                          → null
 *
 * spec_anchor: 01-spec.md § 5 + § Gherkin SC-3/SC-5/SC-7 + 03-arch.md § 2.1
 */
export function extractSubtabFromPath(
  pathname: string | null | undefined,
): string | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 3) return null;
  return segments[2] ?? null;
}
