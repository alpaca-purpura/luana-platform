/**
 * Helpers puros para renderizar el Mapa Implementado por ZONA (3 zonas del
 * paradigma) con 2 lentes (trabajadores / proceso). Leen `zones` de
 * SYSTEM-MAP v2.0 — cero taxonomía hardcodeada. Extraídos de MapView.tsx para
 * ser unit-testeables (vitest node, sin React).
 *
 * Doctrina: docs/architecture/luana-platform/PARADIGM.md (3 planos · 3 zonas)
 *           + .claude/rules/paradigm-arquitectura.md (árbol de decisión de caja).
 * Origen:   story vitalia-paradigm-map-zones (tool-scope F3 · dispatch-plan §TOOL-SCOPE).
 */

import type {
  AgentDefinition,
  Capability,
  FunctionalArea,
  SystemMap,
  SystemMapBoxObject,
  SystemMapZone,
  ZoneId,
} from './types';

// ────────────────────────────────────────────────────────────────────────────
// Shapes del árbol
// ────────────────────────────────────────────────────────────────────────────

/** Una caja normalizada (sea un agente especialista o una superficie transversal). */
export interface MapBox {
  id: string;
  zoneId: ZoneId;
  emoji: string;
  name: string;
  subtitle?: string;
  description?: string;
  functional_areas: FunctionalArea[];
}

export interface AreaNode {
  area: FunctionalArea;
  /** `${box.id}.${area.id}` — clave de matcheo con `functional_area` de las caps. */
  fullId: string;
  caps: Capability[];
}

export interface BoxNode {
  box: MapBox;
  areas: AreaNode[];
  totalCaps: number;
}

export interface ZoneNode {
  zone: SystemMapZone;
  boxes: BoxNode[];
  totalCaps: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Metadata visual de cajas transversales (los agentes traen su emoji de agents[])
// ────────────────────────────────────────────────────────────────────────────

const BOX_EMOJI: Record<string, string> = {
  // plataforma
  acceso: '🔐',
  onboarding: '🚀',
  configuracion: '⚙️',
  // infraestructura
  'seguridad-cumplimiento': '🛡️',
  observabilidad: '📊',
  'plataforma-tecnica': '🧱',
  'motor-agentico': '🧠',
};

function isBoxObject(b: string | SystemMapBoxObject): b is SystemMapBoxObject {
  return typeof b === 'object' && b !== null;
}

// ────────────────────────────────────────────────────────────────────────────
// Normalización + agrupación
// ────────────────────────────────────────────────────────────────────────────

/**
 * Resuelve las cajas de una zona a `MapBox[]`:
 *  - ref string → busca el agente en `agents[]` (zona agentes)
 *  - ref objeto → passthrough con su emoji de caja (zonas plataforma/infra)
 * Una ref string a un agente inexistente se omite (no rompe el render).
 */
export function normalizeZoneBoxes(
  zone: SystemMapZone,
  agents: AgentDefinition[]
): MapBox[] {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const out: MapBox[] = [];
  for (const ref of zone.boxes ?? []) {
    if (isBoxObject(ref)) {
      out.push({
        id: ref.id,
        zoneId: zone.id,
        emoji: BOX_EMOJI[ref.id] ?? '📦',
        name: ref.name,
        description: ref.description,
        functional_areas: ref.functional_areas ?? [],
      });
    } else {
      const agent = byId.get(ref as AgentDefinition['id']);
      if (!agent) continue;
      out.push({
        id: agent.id,
        zoneId: zone.id,
        emoji: agent.emoji,
        name: agent.name,
        subtitle: agent.subtitle,
        description: agent.description,
        functional_areas: agent.functional_areas ?? [],
      });
    }
  }
  return out;
}

/** Índice `boxId → zoneId` (deriva la zona de una caja · NUNCA se escribe a mano). */
export function boxZoneIndex(zones: SystemMapZone[] | undefined): Map<string, ZoneId> {
  const idx = new Map<string, ZoneId>();
  for (const zone of zones ?? []) {
    for (const ref of zone.boxes ?? []) {
      const id = isBoxObject(ref) ? ref.id : ref;
      idx.set(id, zone.id);
    }
  }
  return idx;
}

/** Agrupa caps (no superseded) por `functional_area` (= `${box}.${area}`). */
export function capsByFunctionalArea(caps: Capability[]): Map<string, Capability[]> {
  const m = new Map<string, Capability[]>();
  for (const c of caps) {
    if (c.superseded_by) continue;
    const fa = c.functional_area;
    if (!fa) continue;
    if (!m.has(fa)) m.set(fa, []);
    m.get(fa)!.push(c);
  }
  return m;
}

/** Árbol zona → caja → área con caps adjuntas. Vacío si el SYSTEM-MAP no trae `zones`. */
export function buildZoneTree(
  systemMap: Pick<SystemMap, 'zones' | 'agents'>,
  capsByArea: Map<string, Capability[]>
): ZoneNode[] {
  const zones = systemMap.zones ?? [];
  const agents = systemMap.agents ?? [];
  return zones.map((zone) => {
    const boxes: BoxNode[] = normalizeZoneBoxes(zone, agents).map((box) => {
      const areas: AreaNode[] = box.functional_areas.map((area) => {
        const fullId = `${box.id}.${area.id}`;
        return { area, fullId, caps: capsByArea.get(fullId) ?? [] };
      });
      const totalCaps = areas.reduce((n, a) => n + a.caps.length, 0);
      return { box, areas, totalCaps };
    });
    const totalCaps = boxes.reduce((n, b) => n + b.totalCaps, 0);
    return { zone, boxes, totalCaps };
  });
}

/**
 * Caps que NO caen en ninguna caja/área conocida del árbol (huérfanas · anti-isla).
 * Una cap sin `functional_area` o con `functional_area` que ninguna caja cubre.
 */
export function findOrphanCaps(caps: Capability[], zoneTree: ZoneNode[]): Capability[] {
  const covered = new Set<string>();
  for (const z of zoneTree) {
    for (const b of z.boxes) {
      for (const a of b.areas) covered.add(a.fullId);
    }
  }
  return caps.filter(
    (c) => !c.superseded_by && (!c.functional_area || !covered.has(c.functional_area))
  );
}

/** La supervisora (valeria) — sidebar, no caja de valor. Null si no está declarada. */
export function findSupervisor(agents: AgentDefinition[] | undefined): AgentDefinition | null {
  return (agents ?? []).find((a) => a.role === 'supervisor' || a.status === 'supervisor') ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Lente "proceso" (value-stream del GTM clínico)
// ────────────────────────────────────────────────────────────────────────────
//
// Presentación: ordena las cajas de la zona Agentes por etapa del funnel. Los
// DATOS (cajas/áreas/caps/flujos) salen de SYSTEM-MAP — acá solo se AGRUPA por
// etapa. Cualquier caja Agentes sin etapa cae en "Otros" (anti-isla en la lente).

export interface ValueStreamStage {
  id: string;
  name: string;
  description: string;
  boxIds: string[];
}

export const VALUE_STREAM_STAGES: ValueStreamStage[] = [
  {
    id: 'atraer',
    name: 'Atraer',
    description: 'Presencia pública + marketing que trae pacientes.',
    boxIds: ['lisa', 'lucas'],
  },
  {
    id: 'vender',
    name: 'Vender',
    description: 'Captar, calificar y cerrar al paciente.',
    boxIds: ['adrian'],
  },
  {
    id: 'operar',
    name: 'Operar',
    description: 'Agenda, reservas prepagadas y día clínico.',
    boxIds: ['mateo'],
  },
  {
    id: 'fidelizar',
    name: 'Fidelizar',
    description: 'Post-tratamiento, NPS, reputación y cohortes.',
    boxIds: ['camila'],
  },
];

export interface ProcessStageNode {
  stage: ValueStreamStage;
  boxes: BoxNode[];
  totalCaps: number;
}

/**
 * Lente "proceso": mapea las cajas de la zona Agentes a las etapas del
 * value-stream. Garantiza cobertura total (toda caja Agentes aparece en alguna
 * etapa; las no mapeadas caen en "Otros").
 */
export function buildProcessLens(zoneTree: ZoneNode[]): ProcessStageNode[] {
  const agentesZone = zoneTree.find((z) => z.zone.id === 'agentes');
  const boxNodes = agentesZone?.boxes ?? [];
  const byId = new Map(boxNodes.map((b) => [b.box.id, b]));
  const assigned = new Set<string>();

  const stages: ProcessStageNode[] = VALUE_STREAM_STAGES.map((stage) => {
    const boxes = stage.boxIds
      .map((id) => byId.get(id))
      .filter((b): b is BoxNode => Boolean(b));
    boxes.forEach((b) => assigned.add(b.box.id));
    return { stage, boxes, totalCaps: boxes.reduce((n, b) => n + b.totalCaps, 0) };
  });

  const leftovers = boxNodes.filter((b) => !assigned.has(b.box.id));
  if (leftovers.length > 0) {
    stages.push({
      stage: {
        id: 'otros',
        name: 'Otros',
        description: 'Cajas de la zona Agentes sin etapa de value-stream asignada.',
        boxIds: leftovers.map((b) => b.box.id),
      },
      boxes: leftovers,
      totalCaps: leftovers.reduce((n, b) => n + b.totalCaps, 0),
    });
  }

  return stages;
}
