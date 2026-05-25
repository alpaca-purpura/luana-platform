/**
 * Agent catalog — Vitalia canonical 6-agent registry.
 *
 * spec_anchor: 01-spec.md § 5.1 + 03-arch.md § 2.4
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
  },
};

export const DEFAULT_CHAT_AGENT: AgentSlug = "valeria";

export const AGENT_SLUGS: AgentSlug[] = Object.keys(
  AGENT_CATALOG,
) as AgentSlug[];
