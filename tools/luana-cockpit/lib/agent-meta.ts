/**
 * Metadata visual por agente para pintar las cards del board de un vistazo:
 * franja de color + emoji + nombre. Brand-aware (superset cross-brand):
 *   - Vitalia: Lisa/Valeria/Adrián/Lucas/Camila
 *   - Nicolify: Luana/Abel/Brenda/Christian/Norvil
 *   - Comunes: Config/Infra
 *
 * Cada worktree filtra por su brand (DEFAULT_BRAND) → nunca se muestran agentes
 * de dos brands juntos, así que el superset no genera colisión visual.
 * Emojis espejados de components/map/MapView.tsx (FALLBACK_AGENTS).
 */

import type { Story } from './types';

export type AgentId =
  // Vitalia
  | 'lisa'
  | 'valeria'
  | 'mateo'
  | 'adrian'
  | 'lucas'
  | 'camila'
  // Nicolify
  | 'luana'
  | 'abel'
  | 'brenda'
  | 'christian'
  | 'norvil'
  // Comunes cross-brand
  | 'config'
  | 'infra';

export interface AgentMeta {
  emoji: string;
  name: string;
  /** Color hex (contraste OK sobre dark theme) — franja + acentos. */
  color: string;
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  // --- Vitalia ---
  lisa: { emoji: '🏥', name: 'Lisa', color: '#10b981' }, // emerald
  valeria: { emoji: '🗓', name: 'Valeria', color: '#a855f7' }, // purple — supervisora (sidebar)
  mateo: { emoji: '📅', name: 'Mateo', color: '#FEE209' }, // amarillo marca (--agent-mateo) — Operar/Mi Día
  adrian: { emoji: '💼', name: 'Adrián', color: '#3b82f6' }, // blue
  lucas: { emoji: '📣', name: 'Lucas', color: '#f59e0b' }, // amber
  camila: { emoji: '🌟', name: 'Camila', color: '#ec4899' }, // pink
  // --- Nicolify (Agent-as-a-Service · Revenue/Ops · paleta nicolify.com) ---
  luana: { emoji: '🧭', name: 'Luana', color: '#635BFF' }, // indigo · orquestadora
  abel: { emoji: '🧠', name: 'Abel', color: '#A855F7' }, // púrpura · estratega/oferta
  brenda: { emoji: '💰', name: 'Brenda', color: '#22C55E' }, // verde · growth/presupuesto
  christian: { emoji: '🏹', name: 'Christian', color: '#3B82F6' }, // azul · SDR/outbound
  norvil: { emoji: '🌱', name: 'Norvil', color: '#EC4899' }, // rosa · account manager/retención
  // --- Comunes cross-brand ---
  config: { emoji: '⚙', name: 'Config', color: '#64748b' }, // slate
  infra: { emoji: '🔧', name: 'Infra', color: '#06b6d4' }, // cyan
};

const AGENT_IDS = Object.keys(AGENTS) as AgentId[];

function asAgent(v: unknown): AgentId | null {
  return typeof v === 'string' && (AGENT_IDS as string[]).includes(v)
    ? (v as AgentId)
    : null;
}

/**
 * Infiere el agente dueño de una story, en orden de confianza:
 * 1. `agent_owner` frontmatter · 2. `owner` · 3. prefijo de `cap_target` (`{agent}.{area}`)
 * 4. fallback: regex sobre `story_id` (`vitalia-faseN-{agent}-...`).
 */
export function agentOf(
  story: Partial<Story> & { agent_owner?: string | null }
): AgentId | null {
  const direct =
    asAgent(story.agent_owner) ??
    asAgent(story.owner) ??
    asAgent(story.cap_target?.includes('.') ? story.cap_target.split('.')[0] : null);
  if (direct) return direct;

  const m = story.story_id?.match(
    /-(lisa|valeria|mateo|adrian|lucas|camila|luana|abel|brenda|christian|norvil|config|infra)-/
  );
  return m ? (m[1] as AgentId) : null;
}

/** Hue determinístico para teñir el badge de release (F0..F8 → tonos distintos estables). */
export function releaseHue(release: string | null | undefined): number | null {
  if (!release) return null;
  const m = release.match(/(\d+)/);
  const n = m ? Number.parseInt(m[1], 10) : 0;
  return (n * 47 + 200) % 360;
}

/** Color de la prioridad (data real: critical/high/medium/low). */
export function priorityColor(priority: string | null | undefined): string | null {
  if (!priority) return null;
  const p = priority.toLowerCase();
  if (p.includes('critical') || p === 'p0') return '#ef4444'; // red
  if (p.includes('high') || p === 'p1') return '#f59e0b'; // amber
  if (p.includes('medium') || p === 'p2') return '#3b82f6'; // blue
  if (p.includes('low') || p === 'p3') return '#64748b'; // slate
  return '#64748b';
}

/** Ícono + label por naturaleza de la story (data real: ui-story, service-story, design-story…). */
export interface TypeMeta {
  icon: string;
  label: string;
}

const TYPE_META: Record<string, TypeMeta> = {
  agentic: { icon: '🤖', label: 'Agentic' },
  service: { icon: '🔌', label: 'Service' },
  design: { icon: '🎨', label: 'Design' },
  tech: { icon: '🛠', label: 'Tech' },
  func: { icon: '📦', label: 'Func' },
  ui: { icon: '🖥', label: 'UI' },
};

/** Normaliza `type` (ej. "ui-story-followup" → ui) y devuelve su metadata visual. */
export function typeMetaOf(type: string | null | undefined): TypeMeta | null {
  if (!type) return null;
  const t = type.toLowerCase();
  // Orden importa: agentic/service/design antes que el fallback ui.
  for (const key of ['agentic', 'service', 'design', 'tech', 'func', 'ui']) {
    if (t.includes(key)) return TYPE_META[key];
  }
  return null;
}
