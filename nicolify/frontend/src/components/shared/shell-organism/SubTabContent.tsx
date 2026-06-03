// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-sitemap-completo T-1 (rewrite v3 from nicolify-r0-shell T-6)
/**
 * SubTabContent — dispatcher organismo para Nicolify sitemap-completo.
 * Updated in T-1 (sitemap-completo): v3 N2 tree + 8 N3 leaves + subsubtab? prop.
 *
 * Maps {agent}.{subtab} and {agent}.{subtab}.{subsubtab} combos to EmptyState.
 * R0-sitemap design: NO feature imports (no `features/{agent}/` dir exists yet).
 * The dispatcher maps all v3 N2 sub-tab combos + 8 N3 leaf combos to EmptyState messages.
 *
 * Key pattern for N3: "{agent}.{subtab}.{subsubtab}" — avoids collision
 * (christian.propuestas.propuestas vs christian.propuestas.licitaciones).
 *
 * When subsubtab present: looks up key `{agent}.{subtab}.{subsubtab}` → N3 empty-state.
 * When absent: current N2 behavior `{agent}.{subtab}` → N2 empty-state.
 *
 * R1+ evolution: When a sub-tab gets real content, replace the EmptyState entry
 * with the feature component import (same pattern as vitalia SubTabContent).
 *
 * Architecture invariants (shell-routes SSoT):
 *   - All EmptyState keys derive from AGENT_SUBTABS / AGENT_SUBSUBTABS
 *   - SubTabContent is the only file mapping agent.subtab(.subsubtab) to content
 *
 * Server Component default — no "use client" (all EmptyState are pure Server).
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 06-tickets.yaml T-1 · 01-sitemap.md v3 · SYSTEM-MAP.yaml v2.0
 * gherkin_coverage: A1 A5 F-EMPTY-STATES F-SARA-PROXIMAMENTE
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { AGENT_SUBTABS } from "@/lib/routing/shell-routes";

import { EmptyState } from "./EmptyState";

import type { RibbonTabSlug } from "@/lib/routing/shell-routes";

// ── Component Props ────────────────────────────────────────────────────────────
export interface SubTabContentProps {
  agent: RibbonTabSlug;
  subtab: string;
  /** Optional N3 leaf segment. When present, dispatches to N3 leaf empty-state. */
  subsubtab?: string;
}

// ── Per-subtab EmptyState content (v3 skeleton copy — Spanish neutro tuteo) ──
interface SubTabEmptyContent {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
}

type ContentMapKey = string;

/**
 * SUBTAB_CONTENT_MAP — EmptyState content per combo key.
 * Spanish neutro LatAm, tuteo (sin voseo).
 *
 * N2 keys: "{agent}.{subtab}" (v3 tree · SYSTEM-MAP v2.0)
 * N3 keys: "{agent}.{subtab}.{subsubtab}" (8 leaves · avoids propuestas collision)
 *
 * Architecture: this map is the ONLY place with agent.subtab(.subsubtab) content keys.
 * shell-routes.ts is the SSoT for AGENT_SUBTABS / AGENT_SUBSUBTABS definitions.
 * DO NOT hardcode agent/subtab combinations elsewhere.
 */
const SUBTAB_CONTENT_MAP: Record<ContentMapKey, SubTabEmptyContent> = {
  // ── Abel N2 (3 sub-tabs) ───────────────────────────────────────────────────
  "abel.icp": {
    icon: "🎯",
    title: "Aún no hay perfil de cliente ideal definido",
    description: "Abel te ayudará a identificar y perfilar al comprador ideal para tu agencia.",
  },
  "abel.oferta": {
    icon: "📦",
    title: "Tu oferta está en construcción",
    description: "Abel está listo para ayudarte a definir y estructurar tu oferta principal.",
  },
  "abel.marca": {
    icon: "🏷️",
    title: "Tu identidad de marca espera ser definida",
    description: "Abel te guiará en construir una marca coherente y memorable para tu agencia.",
  },

  // ── Abel N3 leaves (abel.oferta) ──────────────────────────────────────────
  "abel.oferta.catalogo-escalera": {
    icon: "📦",
    title: "El catálogo y la escalera de valor están en construcción",
    description: "Abel te ayudará a estructurar tu catálogo de servicios y la escalera de valor.",
  },
  "abel.oferta.dossier-mineria": {
    icon: "⛏️",
    title: "Aún no hay dossier de minería configurado",
    description: "Abel extraerá los datos clave de tus clientes para enriquecer tu oferta.",
  },

  // ── Brenda N2 (3 sub-tabs) ─────────────────────────────────────────────────
  "brenda.contenido-presencia": {
    icon: "✍️",
    title: "El banco de contenido está vacío",
    description: "Brenda generará y organizará el contenido para tu presencia y tus campañas.",
  },
  "brenda.pauta": {
    icon: "📢",
    title: "Aún no hay campañas de pauta activas",
    description: "Cuando conectes tus canales de pauta, Brenda monitoreará el rendimiento aquí.",
    ctaLabel: "Conectar canales",
  },
  "brenda.inteligencia-asesoria": {
    icon: "🧠",
    title: "Aún no hay inteligencia de mercado disponible",
    description: "Brenda analizará tu mercado y te dará asesoría basada en datos.",
  },

  // ── Christian N2 (6 sub-tabs) ──────────────────────────────────────────────
  "christian.contactos": {
    icon: "👥",
    title: "Aún no hay contactos en tu base",
    description:
      "Christian gestionará tus contactos e importará prospectos cuando actives la prospección.",
    ctaLabel: "Importar contactos",
  },
  "christian.inbox": {
    icon: "📥",
    title: "El inbox está vacío",
    description: "Christian recibirá y gestionará los mensajes entrantes de tus canales aquí.",
  },
  "christian.pipeline": {
    icon: "📊",
    title: "Aún no hay deals en tu pipeline",
    description: "Cuando Christian capture oportunidades, aparecerán acá.",
    ctaLabel: "Conectar canales",
  },
  "christian.equipo-comercial": {
    icon: "🧑‍💼",
    title: "El equipo comercial aún no está configurado",
    description: "Aquí verás el rendimiento de cada miembro de tu equipo de ventas.",
  },
  "christian.agenda": {
    icon: "📅",
    title: "La agenda está vacía",
    description: "Christian coordinará reuniones y citas con tus prospectos y clientes.",
  },
  "christian.propuestas": {
    icon: "📝",
    title: "No hay propuestas enviadas todavía",
    description:
      "Christian preparará y dará seguimiento a las propuestas para cerrar más negocios.",
  },

  // ── Christian N3 leaves (christian.propuestas) ─────────────────────────────
  "christian.propuestas.propuestas": {
    icon: "📝",
    title: "Aún no hay propuestas comerciales",
    description:
      "Christian preparará propuestas personalizadas para tus prospectos y las dará en seguimiento.",
  },
  "christian.propuestas.licitaciones": {
    icon: "⛏️",
    title: "No hay licitaciones en seguimiento",
    description:
      "Christian rastreará las licitaciones y oportunidades de concurso relevantes para tu agencia.",
  },

  // ── Sara N2 (1 sub-tab — deferred) ────────────────────────────────────────
  "sara.proximamente": {
    icon: "⏳",
    title: "Próximamente",
    description:
      "Esta sección está reservada para Sara, tu jefa de proyectos. La función llega pronto.",
  },

  // ── Norvil N2 (3 sub-tabs) ─────────────────────────────────────────────────
  "norvil.cartera": {
    icon: "🗂️",
    title: "No hay cuentas de clientes registradas",
    description: "Norvil administrará tu cartera de cuentas y monitoreará la relación comercial.",
    ctaLabel: "Agregar cuenta",
  },
  "norvil.renovaciones": {
    icon: "🔄",
    title: "No hay renovaciones próximas",
    description: "Norvil te recordará con tiempo las renovaciones y oportunidades de expansión.",
  },
  "norvil.fidelizacion": {
    icon: "💚",
    title: "Aún no hay acciones de fidelización activas",
    description:
      "Norvil implementará estrategias para retener y expandir tus cuentas más valiosas.",
  },

  // ── Norvil N3 leaves (norvil.fidelizacion) ────────────────────────────────
  "norvil.fidelizacion.momentos": {
    icon: "🎂",
    title: "Aún no hay momentos de fidelización registrados",
    description:
      "Norvil detectará y aprovechará momentos especiales para fortalecer la relación con tus clientes.",
  },
  "norvil.fidelizacion.champion-shield": {
    icon: "🛡️",
    title: "Champion-shield en construcción",
    description:
      "Norvil identificará y protegerá a los defensores de tu marca dentro de cada cuenta.",
  },
  "norvil.fidelizacion.value-proof-qbr": {
    icon: "📈",
    title: "Aún no hay QBRs preparados",
    description:
      "Norvil preparará las revisiones trimestrales de valor para demostrar el ROI a tus clientes.",
  },
  "norvil.fidelizacion.gifting": {
    icon: "🎁",
    title: "Gifting aún no configurado",
    description:
      "Norvil coordinará regalos estratégicos para fortalecer la relación con tus cuentas clave.",
  },

  // ── Config N2 (4 sub-tabs) ─────────────────────────────────────────────────
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
  "config.autonomia-agentes": {
    icon: "🤖",
    title: "Autonomía de agentes",
    description: "Configura los permisos y umbrales de autonomía para cada agente en tu agencia.",
  },
} as const;

/**
 * SubTabContent — dispatches EmptyState for each agent.subtab(.subsubtab) combo.
 * Server Component (no "use client" — EmptyState is pure Server).
 *
 * When subsubtab is present: looks up key "{agent}.{subtab}.{subsubtab}" → N3 leaf empty-state.
 * When absent: current N2 behavior "{agent}.{subtab}" → N2 empty-state.
 * data-testid: "subtab-content-{agent}-{subtab}" (N2) or "subtab-content-{agent}-{subtab}-{subsubtab}" (N3).
 */
export function SubTabContent({ agent, subtab, subsubtab }: SubTabContentProps) {
  const subtabMeta = AGENT_SUBTABS[agent]?.find((s) => s.id === subtab);

  // Resolve key: N3 if subsubtab present, else N2
  const key = subsubtab ? `${agent}.${subtab}.${subsubtab}` : `${agent}.${subtab}`;
  const testId = subsubtab
    ? `subtab-content-${agent}-${subtab}-${subsubtab}`
    : `subtab-content-${agent}-${subtab}`;

  const content = (SUBTAB_CONTENT_MAP as Record<string, SubTabEmptyContent | undefined>)[key] ?? {
    icon: subtabMeta?.icon ?? "📄",
    title: "Todavía no hay nada por aquí",
    description: "Esta sección se activa cuando el agente empiece a trabajar.",
  };

  return (
    <div className="flex-1 overflow-auto p-6" data-testid={testId}>
      <EmptyState
        icon={content.icon}
        title={content.title}
        description={content.description}
        ctaLabel={content.ctaLabel}
      />
    </div>
  );
}
