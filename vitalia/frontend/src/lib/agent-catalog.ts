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
