// cap: comunify-shell-organism
/**
 * agents.ts — Comunify canonical 6-agent registry.
 *
 * Comunify cast (ADR-comunify-001):
 *   Luana (orchestrator sidebar) + Nina/Tomás/Sofía/Bruno/Lucía (Ribbon).
 *
 * Cast colors (design-inventory.md):
 *   Luana/Nina: #7B2FF7 (comunify-primary, 264 92% 58%)
 *   Tomás:      #2D7FF9 (comunify-blue, 217 95% 58%)
 *   Sofía:      #16C784 (comunify-stable, 152 80% 43%)
 *   Bruno:      #F59E0B (comunify-warning, 38 92% 50%)
 *   Lucía:      #1246D6 (comunify-blue-deep, 220 84% 45%)
 *
 * NOTE: hex fields are metadata-only (for design reference / color pickers).
 * NOT consumed by Tailwind — use agentBgClass() from _agent-tw-classes.ts instead (G3 gate).
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local catalog; no cross-brand consumers
 */

export type AgentSlug = "luana" | "nina" | "tomas" | "sofia" | "bruno" | "lucia";

export interface AgentDescriptor {
  slug: AgentSlug;
  name: string;
  role: string;
  /** CSS custom property name for Tailwind token (e.g. 'agent-luana') */
  colorToken: string;
  colorSoftToken: string;
  thumbnail: string;
  initial: string;
  /** Short label for Ribbon tab. Spanish neutro LatAm. */
  tabLabel: string;
  /** Default subtab slug to navigate to when clicking this ribbon tab. */
  defaultSubtab: string;
}

export const AGENT_CATALOG: Record<AgentSlug, AgentDescriptor> = {
  luana: {
    slug: "luana",
    name: "Luana",
    role: "Orquestadora · coordinadora de agentes",
    colorToken: "agent-luana",
    colorSoftToken: "agent-luana-soft",
    thumbnail: "/agents/luana/avatar.svg",
    initial: "L",
    tabLabel: "Luana",
    defaultSubtab: "",
  },
  nina: {
    slug: "nina",
    name: "Nina",
    role: "Estratega · marca y posicionamiento",
    colorToken: "agent-nina",
    colorSoftToken: "agent-nina-soft",
    thumbnail: "/agents/nina/avatar.svg",
    initial: "N",
    tabLabel: "Estratega",
    defaultSubtab: "marca",
  },
  tomas: {
    slug: "tomas",
    name: "Tomás",
    role: "Atracción · contenido y audiencia",
    colorToken: "agent-tomas",
    colorSoftToken: "agent-tomas-soft",
    thumbnail: "/agents/tomas/avatar.svg",
    initial: "T",
    tabLabel: "Atraer",
    defaultSubtab: "referentes",
  },
  sofia: {
    slug: "sofia",
    name: "Sofía",
    role: "Ventas · conversaciones y pipeline",
    colorToken: "agent-sofia",
    colorSoftToken: "agent-sofia-soft",
    thumbnail: "/agents/sofia/avatar.svg",
    initial: "S",
    tabLabel: "Vender",
    defaultSubtab: "conversaciones",
  },
  bruno: {
    slug: "bruno",
    name: "Bruno",
    role: "Operaciones · comunidad y eventos",
    colorToken: "agent-bruno",
    colorSoftToken: "agent-bruno-soft",
    thumbnail: "/agents/bruno/avatar.svg",
    initial: "B",
    tabLabel: "Operar",
    defaultSubtab: "comunidad",
  },
  lucia: {
    slug: "lucia",
    name: "Lucía",
    role: "Retención · suscripciones y fidelización",
    colorToken: "agent-lucia",
    colorSoftToken: "agent-lucia-soft",
    thumbnail: "/agents/lucia/avatar.svg",
    initial: "L",
    tabLabel: "Retener",
    defaultSubtab: "suscripciones",
  },
};

/** Default chat agent (Luana = orchestrator sidebar) */
export const DEFAULT_CHAT_AGENT: AgentSlug = "luana";

export const AGENT_SLUGS: AgentSlug[] = Object.keys(AGENT_CATALOG) as AgentSlug[];
