/**
 * map-zones.ts — render por zona (SYSTEM-MAP v2.0) + lente proceso.
 * Cement 2026-05-30 · story vitalia-paradigm-map-zones (tool-scope F3).
 * Estrategia: vitest puro (sin React), fixtures mínimas espejo del schema v2.0.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeZoneBoxes,
  boxZoneIndex,
  capsByFunctionalArea,
  buildZoneTree,
  findOrphanCaps,
  findSupervisor,
  buildProcessLens,
  VALUE_STREAM_STAGES,
} from '../map-zones';
import type {
  AgentDefinition,
  Capability,
  SystemMap,
  SystemMapZone,
} from '../types';

// ── Fixtures mínimas (espejo SYSTEM-MAP v2.0) ───────────────────────────────

function area(id: string, status: 'live' | 'planned' = 'live') {
  return { id, name: id, status } as const;
}

const AGENTS: AgentDefinition[] = [
  { id: 'lisa', emoji: '🏥', name: 'Lisa', subtitle: 'Mi Clínica', functional_areas: [area('marca'), area('servicios')] },
  { id: 'mateo', emoji: '📅', name: 'Mateo', subtitle: 'Operar', functional_areas: [area('agenda'), area('bookings')] },
  { id: 'adrian', emoji: '💼', name: 'Adrián', subtitle: 'Vender', functional_areas: [area('embudo')] },
  { id: 'lucas', emoji: '📣', name: 'Lucas', subtitle: 'Marketing', functional_areas: [area('atribucion')] },
  { id: 'camila', emoji: '🌟', name: 'Camila', subtitle: 'Reputación', functional_areas: [area('reputacion')] },
  // supervisora (sin caja de valor)
  { id: 'valeria', emoji: '🗓', name: 'Valeria', subtitle: 'Supervisora', role: 'supervisor', status: 'supervisor', functional_areas: [] },
];

const ZONES: SystemMapZone[] = [
  {
    id: 'agentes',
    name: 'Agentes',
    tier: 'core',
    user_visible: true,
    boxes: ['lisa', 'mateo', 'adrian', 'lucas', 'camila'],
  },
  {
    id: 'plataforma',
    name: 'Plataforma',
    tier: 'supporting',
    user_visible: true,
    boxes: [
      { id: 'acceso', name: 'Acceso', functional_areas: [area('auth'), area('iam')] },
      { id: 'configuracion', name: 'Configuración', functional_areas: [area('admin')] },
    ],
  },
  {
    id: 'infraestructura',
    name: 'Infraestructura',
    tier: 'enabling',
    user_visible: false,
    boxes: [
      { id: 'observabilidad', name: 'Observabilidad', functional_areas: [area('observability')] },
    ],
  },
];

const SYSTEM_MAP: Pick<SystemMap, 'zones' | 'agents'> = { zones: ZONES, agents: AGENTS };

function cap(slug: string, functional_area: string | null, extra: Partial<Capability> = {}): Capability {
  return {
    capability_id: `vitalia-${slug}`,
    module: 'x',
    slug,
    status: 'live',
    license: 'brand-local',
    created_in_story: 's',
    created_date: '2026-05-30',
    last_modified: '2026-05-30',
    parent_cap: null,
    derives_capabilities: [],
    change_log: [],
    functional_area,
    ...extra,
  } as Capability;
}

const CAPS: Capability[] = [
  cap('marca-1', 'lisa.marca'),
  cap('agenda-1', 'mateo.agenda'),
  cap('agenda-2', 'mateo.agenda'),
  cap('auth-1', 'acceso.auth'),
  cap('obs-1', 'observabilidad.observability'),
  cap('dead', 'mateo.agenda', { superseded_by: 'agenda-1' }), // superseded → ignorada
  cap('orphan-1', 'mateo.unknown-area'), // área inexistente → huérfana
  cap('no-fa', null), // sin functional_area → huérfana
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('normalizeZoneBoxes', () => {
  it('resuelve refs string (agentes) a la definición del agente', () => {
    const boxes = normalizeZoneBoxes(ZONES[0], AGENTS);
    expect(boxes.map((b) => b.id)).toEqual(['lisa', 'mateo', 'adrian', 'lucas', 'camila']);
    const mateo = boxes.find((b) => b.id === 'mateo')!;
    expect(mateo.emoji).toBe('📅');
    expect(mateo.functional_areas.map((a) => a.id)).toEqual(['agenda', 'bookings']);
    expect(mateo.zoneId).toBe('agentes');
  });

  it('passthrough de cajas objeto (plataforma/infra) con emoji de caja', () => {
    const boxes = normalizeZoneBoxes(ZONES[1], AGENTS);
    expect(boxes.map((b) => b.id)).toEqual(['acceso', 'configuracion']);
    expect(boxes[0].emoji).toBe('🔐');
    expect(boxes[0].functional_areas.map((a) => a.id)).toEqual(['auth', 'iam']);
  });

  it('omite refs string a agentes inexistentes sin romper', () => {
    const z: SystemMapZone = { ...ZONES[0], boxes: ['lisa', 'fantasma'] };
    const boxes = normalizeZoneBoxes(z, AGENTS);
    expect(boxes.map((b) => b.id)).toEqual(['lisa']);
  });

  it('valeria (supervisora) NO aparece como caja de la zona agentes', () => {
    const boxes = normalizeZoneBoxes(ZONES[0], AGENTS);
    expect(boxes.map((b) => b.id)).not.toContain('valeria');
  });
});

describe('boxZoneIndex', () => {
  it('deriva la zona de cada caja', () => {
    const idx = boxZoneIndex(ZONES);
    expect(idx.get('lisa')).toBe('agentes');
    expect(idx.get('acceso')).toBe('plataforma');
    expect(idx.get('observabilidad')).toBe('infraestructura');
    expect(idx.get('inexistente')).toBeUndefined();
  });
  it('tolera zones undefined', () => {
    expect(boxZoneIndex(undefined).size).toBe(0);
  });
});

describe('capsByFunctionalArea', () => {
  it('agrupa por functional_area e ignora superseded y sin-fa', () => {
    const m = capsByFunctionalArea(CAPS);
    expect(m.get('mateo.agenda')!.map((c) => c.slug)).toEqual(['agenda-1', 'agenda-2']);
    expect(m.get('lisa.marca')!).toHaveLength(1);
    expect(m.has('mateo.unknown-area')).toBe(true); // se agrupa aunque la caja no la tenga
  });
});

describe('buildZoneTree', () => {
  const tree = buildZoneTree(SYSTEM_MAP, capsByFunctionalArea(CAPS));

  it('produce una rama por zona en orden', () => {
    expect(tree.map((z) => z.zone.id)).toEqual(['agentes', 'plataforma', 'infraestructura']);
  });

  it('adjunta caps por fullId `${box}.${area}`', () => {
    const agentes = tree.find((z) => z.zone.id === 'agentes')!;
    const mateo = agentes.boxes.find((b) => b.box.id === 'mateo')!;
    const agenda = mateo.areas.find((a) => a.area.id === 'agenda')!;
    expect(agenda.fullId).toBe('mateo.agenda');
    expect(agenda.caps.map((c) => c.slug)).toEqual(['agenda-1', 'agenda-2']);
    expect(mateo.totalCaps).toBe(2);
  });

  it('cuenta caps por zona', () => {
    const plataforma = tree.find((z) => z.zone.id === 'plataforma')!;
    expect(plataforma.totalCaps).toBe(1); // acceso.auth
  });

  it('zones ausentes → árbol vacío', () => {
    expect(buildZoneTree({ zones: undefined, agents: AGENTS }, new Map())).toEqual([]);
  });
});

describe('findOrphanCaps', () => {
  it('detecta caps sin caja/área conocida + sin functional_area', () => {
    const tree = buildZoneTree(SYSTEM_MAP, capsByFunctionalArea(CAPS));
    const orphans = findOrphanCaps(CAPS, tree).map((c) => c.slug).sort();
    expect(orphans).toEqual(['no-fa', 'orphan-1']);
  });
});

describe('findSupervisor', () => {
  it('encuentra a valeria por role/status supervisor', () => {
    expect(findSupervisor(AGENTS)?.id).toBe('valeria');
  });
  it('null si no hay supervisora', () => {
    expect(findSupervisor(AGENTS.filter((a) => a.id !== 'valeria'))).toBeNull();
  });
});

describe('buildProcessLens', () => {
  const tree = buildZoneTree(SYSTEM_MAP, capsByFunctionalArea(CAPS));
  const stages = buildProcessLens(tree);

  it('mapea las cajas agentes a las etapas del value-stream', () => {
    const atraer = stages.find((s) => s.stage.id === 'atraer')!;
    expect(atraer.boxes.map((b) => b.box.id).sort()).toEqual(['lisa', 'lucas']);
    const operar = stages.find((s) => s.stage.id === 'operar')!;
    expect(operar.boxes.map((b) => b.box.id)).toEqual(['mateo']);
    expect(operar.totalCaps).toBe(2);
  });

  it('cobertura total: toda caja agentes aparece en alguna etapa (anti-isla)', () => {
    const tree = buildZoneTree(SYSTEM_MAP, capsByFunctionalArea(CAPS));
    const agentes = tree.find((z) => z.zone.id === 'agentes')!;
    const allBoxIds = agentes.boxes.map((b) => b.box.id).sort();
    const covered = buildProcessLens(tree)
      .flatMap((s) => s.boxes.map((b) => b.box.id))
      .sort();
    expect(covered).toEqual(allBoxIds);
  });

  it('cajas agentes sin etapa caen en "Otros"', () => {
    const extra: AgentDefinition = { id: 'lisa', emoji: '🏥', name: 'Lisa', subtitle: '', functional_areas: [] };
    const z: SystemMapZone = { ...ZONES[0], boxes: ['lisa', 'nuevo-agente'] };
    const agentsPlus = [...AGENTS, { ...extra, id: 'nuevo-agente' as never }];
    const tree2 = buildZoneTree({ zones: [z], agents: agentsPlus }, new Map());
    const stages2 = buildProcessLens(tree2);
    const otros = stages2.find((s) => s.stage.id === 'otros');
    expect(otros?.boxes.map((b) => b.box.id)).toEqual(['nuevo-agente']);
  });

  it('VALUE_STREAM_STAGES cubre los 5 especialistas', () => {
    const ids = VALUE_STREAM_STAGES.flatMap((s) => s.boxIds).sort();
    expect(ids).toEqual(['adrian', 'camila', 'lisa', 'lucas', 'mateo']);
  });
});
