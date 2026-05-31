// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-6
/**
 * SubTabContent — dispatcher organismo para Nicolify R0.
 * nicolify-r0-shell T-6 — NEW (based on vitalia SubTabContent pattern, adapted to nicolify).
 *
 * Maps {agent}.{subtab} combos to EmptyState (R0 skeleton — all sub-tabs are empty).
 * Special case: christian.pipeline gets branded copy per spec § Microcopy.
 * All other combos use the generic empty-state copy.
 *
 * R0 design: NO feature imports (no `features/{agent}/` dir exists yet).
 * The dispatcher maps all 20 valid sub-tab combos to descriptive EmptyState messages.
 *
 * R1+ evolution: When a sub-tab gets real content, replace the EmptyState entry
 * with the feature component import (same pattern as vitalia SubTabContent).
 *
 * Architecture invariants (shell-routes SSoT):
 *   - All EmptyState keys derive from AGENT_SUBTABS (no hardcoded combos elsewhere)
 *   - SubTabContent is the only file mapping agent.subtab to content
 *
 * Server Component default — no "use client" (all EmptyState are pure Server).
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 01-spec.md § A5 + § Microcopy (copy nicolify tuteo)
 * gherkin_coverage: A1 A5
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { AGENT_SUBTABS } from "@/lib/routing/shell-routes";

import { EmptyState } from "./EmptyState";

import type { RibbonTabSlug } from "@/lib/routing/shell-routes";

// ── Component Props ────────────────────────────────────────────────────────────
export interface SubTabContentProps {
  agent: RibbonTabSlug;
  subtab: string;
}

// ── Per-subtab EmptyState content (R0 skeleton copy — Spanish neutro tuteo) ───
interface SubTabEmptyContent {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
}

type SubTabKey = `${RibbonTabSlug}.${string}`;

/**
 * SUBTAB_CONTENT_MAP — EmptyState content per agent.subtab combo.
 * Spanish neutro LatAm, tuteo (sin voseo). 20 combos (all R0 sub-tabs).
 *
 * Architecture: this map is the ONLY place with agent.subtab content keys.
 * shell-routes.ts is the SSoT for AGENT_SUBTABS definitions.
 * DO NOT hardcode agent/subtab combinations elsewhere.
 */
const SUBTAB_CONTENT_MAP: Record<SubTabKey, SubTabEmptyContent> = {
  // ── Abel (4 sub-tabs) ──────────────────────────────────────────────────────
  "abel.oferta": {
    icon: "📦",
    title: "Tu oferta está en construcción",
    description: "Abel está listo para ayudarte a definir y estructurar tu oferta principal.",
  },
  "abel.angulos": {
    icon: "🎯",
    title: "Aún no hay ángulos definidos",
    description: "Abel te ayudará a identificar los mensajes más efectivos para tu audiencia.",
  },
  "abel.escalera-valor": {
    icon: "📈",
    title: "La escalera de valor está por crearse",
    description: "Abel diseñará la secuencia de ofertas que maximiza el valor para tus clientes.",
  },
  "abel.marca": {
    icon: "🏷️",
    title: "Tu identidad de marca espera ser definida",
    description: "Abel te guiará en construir una marca coherente y memorable para tu agencia.",
  },

  // ── Brenda (3 sub-tabs) ────────────────────────────────────────────────────
  "brenda.campanas": {
    icon: "📢",
    title: "Aún no hay campañas activas",
    description: "Cuando conectes tus canales de pauta, Brenda monitoreará el rendimiento aquí.",
    ctaLabel: "Conectar canales",
  },
  "brenda.contenido": {
    icon: "✍️",
    title: "El banco de contenido está vacío",
    description: "Brenda generará y organizará el contenido para tus campañas de atracción.",
  },
  "brenda.presupuesto": {
    icon: "💰",
    title: "Aún no hay presupuesto de pauta configurado",
    description:
      "Brenda controlará el gasto publicitario y te alertará cuando sea necesario optimizar.",
  },

  // ── Christian (5 sub-tabs) ─────────────────────────────────────────────────
  "christian.prospectos": {
    icon: "🔍",
    title: "Aún no hay prospectos en la lista",
    description:
      "Christian comenzará a identificar y calificar prospectos cuando actives la prospección.",
    ctaLabel: "Configurar prospección",
  },
  "christian.secuencias": {
    icon: "📧",
    title: "No hay secuencias de contacto activas",
    description:
      "Christian ejecutará las secuencias de seguimiento para mantener el contacto con tus prospectos.",
  },
  "christian.pipeline": {
    icon: "📊",
    title: "Aún no hay deals en tu pipeline",
    description: "Cuando Christian capture oportunidades, aparecerán acá.",
    ctaLabel: "Conectar canales",
  },
  "christian.propuestas": {
    icon: "📝",
    title: "No hay propuestas enviadas todavía",
    description:
      "Christian preparará y dará seguimiento a las propuestas para cerrar más negocios.",
  },
  "christian.licitaciones": {
    icon: "⛏️",
    title: "No hay licitaciones en seguimiento",
    description:
      "Christian rastreará las licitaciones y oportunidades de concurso relevantes para tu agencia.",
  },

  // ── Sara (1 sub-tab) ───────────────────────────────────────────────────────
  "sara.proyectos": {
    icon: "📋",
    title: "No hay proyectos activos todavía",
    description: "Sara organizará y hará seguimiento de los proyectos en curso para tus clientes.",
    ctaLabel: "Crear primer proyecto",
  },

  // ── Norvil (3 sub-tabs) ────────────────────────────────────────────────────
  "norvil.cuentas": {
    icon: "🏢",
    title: "No hay cuentas de clientes registradas",
    description:
      "Norvil administrará las cuentas de tus clientes y monitoreará la relación comercial.",
    ctaLabel: "Agregar cuenta",
  },
  "norvil.salud-cuenta": {
    icon: "💚",
    title: "Sin datos de salud de cuentas aún",
    description: "Norvil analizará métricas de retención y te alertará sobre cuentas en riesgo.",
  },
  "norvil.renovaciones": {
    icon: "🔄",
    title: "No hay renovaciones próximas",
    description: "Norvil te recordará con tiempo las renovaciones y oportunidades de expansión.",
  },

  // ── Config (4 sub-tabs) ────────────────────────────────────────────────────
  "config.conexiones": {
    icon: "🔌",
    title: "No hay conexiones configuradas",
    description:
      "Conecta tus herramientas (CRM, canales de pauta, comunicación) para habilitar a los agentes.",
    ctaLabel: "Ver integraciones",
  },
  "config.preferencias": {
    icon: "⚙️",
    title: "Preferencias de la cuenta",
    description: "Configura las preferencias generales de tu agencia en la plataforma.",
  },
  "config.tokens": {
    icon: "🪙",
    title: "Gestión de tokens",
    description:
      "Revisa el consumo y saldo de tokens de tu plan para mantener a los agentes activos.",
  },
  "config.agentes": {
    icon: "🤖",
    title: "Configuración de agentes",
    description: "Personaliza el comportamiento y los permisos de cada agente para tu agencia.",
  },
} as const;

/**
 * SubTabContent — dispatches EmptyState for each agent.subtab combo in R0.
 * Server Component (no "use client" — EmptyState is pure Server).
 */
export function SubTabContent({ agent, subtab }: SubTabContentProps) {
  const subtabMeta = AGENT_SUBTABS[agent]?.find((s) => s.id === subtab);
  const key = `${agent}.${subtab}`;

  const content = (SUBTAB_CONTENT_MAP as Record<string, SubTabEmptyContent | undefined>)[key] ?? {
    icon: subtabMeta?.icon ?? "📄",
    title: "Todavía no hay nada por aquí",
    description: "Esta sección se activa cuando el agente empiece a trabajar.",
  };

  return (
    <div className="flex-1 overflow-auto p-6" data-testid={`subtab-content-${agent}-${subtab}`}>
      <EmptyState
        icon={content.icon}
        title={content.title}
        description={content.description}
        ctaLabel={content.ctaLabel}
      />
    </div>
  );
}
