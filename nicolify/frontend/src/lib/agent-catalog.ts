// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-sitemap-completo T-1 (updated defaultSubtab + Sara from nicolify-r0-shell T-4)
/**
 * agent-catalog.ts — Nicolify canonical 6-agent registry.
 *
 * Re-themed from Vitalia agent-catalog (Valeria→Luana, 5 health agents→5 Revenue/Ops agents).
 * Nicolify agents: Luana (orchestrator sidebar) + Abel/Brenda/Christian/Sara/Norvil (Ribbon).
 *
 * NOTE: hex fields are metadata-only (for design reference / color pickers).
 * NOT consumed by Tailwind — use agentBgClass() from _agent-tw-classes.ts instead (G3 gate).
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local catalog; no cross-brand consumers
 */

export type AgentSlug = "luana" | "abel" | "brenda" | "christian" | "sara" | "norvil";

export interface AgentDescriptor {
  slug: AgentSlug;
  name: string;
  role: string;
  /** CSS custom property name for Tailwind token (e.g. 'agent-luana') */
  colorToken: string;
  colorSoftToken: string;
  /** Hex color — metadata only. NOT consumed by Tailwind. */
  hex: string;
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
    role: "Orquestadora · coordinadora del equipo de agentes",
    colorToken: "agent-luana",
    colorSoftToken: "agent-luana-soft",
    hex: "#635BFF",
    thumbnail: "/agents/luana/avatar.svg",
    initial: "L",
    tabLabel: "Luana",
    defaultSubtab: "",
  },
  abel: {
    slug: "abel",
    name: "Abel",
    role: "Estratega · branding y oferta",
    colorToken: "agent-abel",
    colorSoftToken: "agent-abel-soft",
    hex: "#A855F7",
    thumbnail: "/agents/abel/avatar.svg",
    initial: "A",
    tabLabel: "Estrategia",
    defaultSubtab: "icp",
  },
  brenda: {
    slug: "brenda",
    name: "Brenda",
    role: "Guardiana del presupuesto · growth",
    colorToken: "agent-brenda",
    colorSoftToken: "agent-brenda-soft",
    hex: "#22C55E",
    thumbnail: "/agents/brenda/avatar.svg",
    initial: "B",
    tabLabel: "Growth",
    defaultSubtab: "contenido-presencia",
  },
  christian: {
    slug: "christian",
    name: "Christian",
    role: "Cazador · SDR y outbound",
    colorToken: "agent-christian",
    colorSoftToken: "agent-christian-soft",
    hex: "#3B82F6",
    thumbnail: "/agents/christian/avatar.svg",
    initial: "C",
    tabLabel: "Ventas",
    defaultSubtab: "pipeline",
  },
  sara: {
    slug: "sara",
    name: "Sara",
    // Sara deferred (Chris OI-C 2026-06-02 · ADR-nicolify-002 D-D amendment).
    role: "Jefa de proyectos · operación y delivery",
    colorToken: "agent-sara",
    colorSoftToken: "agent-sara-soft",
    hex: "#F59E0B",
    thumbnail: "/agents/sara/avatar.svg",
    initial: "S",
    tabLabel: "Próximamente",
    defaultSubtab: "proximamente",
  },
  norvil: {
    slug: "norvil",
    name: "Norvil",
    role: "Account manager · retención y expansión",
    colorToken: "agent-norvil",
    colorSoftToken: "agent-norvil-soft",
    hex: "#EC4899",
    thumbnail: "/agents/norvil/avatar.svg",
    initial: "N",
    tabLabel: "Cuentas",
    defaultSubtab: "cartera",
  },
};

/** Default chat agent (Luana = orchestrator sidebar) */
export const DEFAULT_CHAT_AGENT: AgentSlug = "luana";

export const AGENT_SLUGS: AgentSlug[] = Object.keys(AGENT_CATALOG) as AgentSlug[];
