/**
 * cap-ledger.ts tests · 4 ramas (new/fix/extend/derive).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import matter from 'gray-matter';
import {
  applyCapChange,
  createDerivedCap,
  readCapability,
} from '../cap-ledger.js';
import type { Atomic, ChangeLogEntry } from '../types.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cockpit-cap-ledger-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('applyCapChange', () => {
  it('type=new crea archivo con change_log[0] y atomics iniciales', async () => {
    const capPath = path.join(tmpDir, 'caps', 'scheduling', 'valeria-agenda.yaml');
    const initialAtomics: Atomic[] = [
      {
        label: 'Vista calendario semanal',
        added_in_story: 'vitalia-fase2-valeria-agenda',
        added_date: '2026-05-27',
      },
      {
        label: 'Drag-to-reschedule',
        added_in_story: 'vitalia-fase2-valeria-agenda',
        added_date: '2026-05-27',
      },
    ];
    const entry: ChangeLogEntry = {
      story_id: 'vitalia-fase2-valeria-agenda',
      date: '2026-05-27',
      type: 'new',
      summary: 'Implementación inicial · vista calendario + drag-to-reschedule',
      atomics_added: [], // Será sobreescrito por applyCapChange
      atomics_modified: [],
      merge_sha: '4562140c',
      status: 'done',
    };

    await applyCapChange({
      capPath,
      entry,
      newAtomics: initialAtomics,
      initialCap: {
        capability_id: 'vitalia.scheduling.valeria-agenda',
        module: 'scheduling',
        slug: 'valeria-agenda',
        status: 'live',
        license: 'brand-local',
        architecture_pattern: 'ADR-vitalia-004',
      },
    });

    const cap = await readCapability(capPath);
    expect(cap.capability_id).toBe('vitalia.scheduling.valeria-agenda');
    expect(cap.module).toBe('scheduling');
    expect(cap.slug).toBe('valeria-agenda');
    expect(cap.created_in_story).toBe('vitalia-fase2-valeria-agenda');
    expect(cap.created_date).toBe('2026-05-27');
    expect(cap.last_modified).toBe('2026-05-27');
    expect(cap.atomics).toHaveLength(2);
    expect(cap.atomics[0].label).toBe('Vista calendario semanal');
    expect(cap.change_log).toHaveLength(1);
    expect(cap.change_log[0].type).toBe('new');
    expect(cap.change_log[0].atomics_added).toEqual([
      'Vista calendario semanal',
      'Drag-to-reschedule',
    ]);
    expect(cap.change_log[0].merge_sha).toBe('4562140c');
  });

  it('type=fix appendea change_log SIN tocar atomics', async () => {
    const capPath = path.join(tmpDir, 'caps', 'shell', 'layout-5050.yaml');
    // Seed: crear cap con atomics existentes
    await applyCapChange({
      capPath,
      entry: {
        story_id: 'vitalia-fase1-shell-layout-5050',
        date: '2026-05-20',
        type: 'new',
        summary: 'Layout shell 50/50 inicial',
        atomics_added: [],
        atomics_modified: [],
        status: 'done',
      },
      newAtomics: [
        {
          label: 'split 50/50',
          added_in_story: 'vitalia-fase1-shell-layout-5050',
          added_date: '2026-05-20',
        },
      ],
      initialCap: {
        capability_id: 'vitalia.shell.layout-5050',
        module: 'shell',
        slug: 'layout-5050',
      },
    });

    // Aplicar fix
    await applyCapChange({
      capPath,
      entry: {
        story_id: 'vitalia-fase1-shell-layout-5050-race-fix',
        date: '2026-05-25',
        type: 'fix',
        summary: 'Fix race condition on resize',
        atomics_added: [],
        atomics_modified: [],
        status: 'done',
      },
    });

    const cap = await readCapability(capPath);
    expect(cap.atomics).toHaveLength(1);
    expect(cap.atomics[0].label).toBe('split 50/50');
    expect(cap.change_log).toHaveLength(2);
    expect(cap.change_log[1].type).toBe('fix');
    expect(cap.change_log[1].atomics_added).toEqual([]);
    expect(cap.last_modified).toBe('2026-05-25');
  });

  it('type=extend appendea change_log + atomics nuevos', async () => {
    const capPath = path.join(tmpDir, 'caps', 'lisa', 'marca.yaml');
    // Seed: cap base lisa.marca
    await applyCapChange({
      capPath,
      entry: {
        story_id: 'vitalia-fase2-lisa-marca',
        date: '2026-05-24',
        type: 'new',
        summary: 'Lisa marca · skin tokens + voice',
        atomics_added: [],
        atomics_modified: [],
        status: 'done',
      },
      newAtomics: [
        {
          label: 'Skin tokens',
          added_in_story: 'vitalia-fase2-lisa-marca',
          added_date: '2026-05-24',
        },
      ],
      initialCap: {
        capability_id: 'vitalia.lisa.marca',
        module: 'lisa',
        slug: 'marca',
      },
    });

    // Extend
    const newAtomics: Atomic[] = [
      {
        label: 'Color extractor',
        added_in_story: 'vitalia-fase2-lisa-marca-v2',
        added_date: '2026-05-27',
      },
      {
        label: 'Logo upload',
        added_in_story: 'vitalia-fase2-lisa-marca-v2',
        added_date: '2026-05-27',
      },
    ];
    await applyCapChange({
      capPath,
      entry: {
        story_id: 'vitalia-fase2-lisa-marca-v2',
        date: '2026-05-27',
        type: 'extend',
        summary: 'Color extractor + logo upload',
        atomics_added: [],
        atomics_modified: [],
        status: 'done',
      },
      newAtomics,
    });

    const cap = await readCapability(capPath);
    expect(cap.atomics).toHaveLength(3);
    expect(cap.atomics.map((a) => a.label)).toEqual([
      'Skin tokens',
      'Color extractor',
      'Logo upload',
    ]);
    expect(cap.change_log).toHaveLength(2);
    expect(cap.change_log[1].type).toBe('extend');
    expect(cap.change_log[1].atomics_added).toEqual(['Color extractor', 'Logo upload']);
  });
});

describe('createDerivedCap', () => {
  it('crea cap hijo + actualiza derives_capabilities[] del padre', async () => {
    // 1. Crear cap padre
    const parentPath = path.join(tmpDir, 'caps', 'scheduling', 'valeria-agenda.yaml');
    await applyCapChange({
      capPath: parentPath,
      entry: {
        story_id: 'vitalia-fase2-valeria-agenda',
        date: '2026-05-27',
        type: 'new',
        summary: 'Valeria agenda base',
        atomics_added: [],
        atomics_modified: [],
        status: 'done',
      },
      newAtomics: [
        {
          label: 'Calendar view',
          added_in_story: 'vitalia-fase2-valeria-agenda',
          added_date: '2026-05-27',
        },
      ],
      initialCap: {
        capability_id: 'vitalia.scheduling.valeria-agenda',
        module: 'scheduling',
        slug: 'valeria-agenda',
        license: 'brand-local',
        architecture_pattern: 'ADR-vitalia-004',
      },
    });

    // 2. Derive
    const childPath = path.join(tmpDir, 'caps', 'scheduling', 'valeria-agenda-mobile.yaml');
    await createDerivedCap({
      parentCapPath: parentPath,
      childCapPath: childPath,
      childCap: {
        capability_id: 'vitalia.scheduling.valeria-agenda-mobile',
        module: 'scheduling',
        slug: 'valeria-agenda-mobile',
      },
      spawnedFromStory: 'vitalia-fase3-valeria-agenda-mobile',
      date: '2026-06-15',
      initialAtomics: [
        {
          label: 'Touch-friendly drag',
          added_in_story: 'vitalia-fase3-valeria-agenda-mobile',
          added_date: '2026-06-15',
        },
      ],
    });

    // 3. Verificar hijo
    const child = await readCapability(childPath);
    expect(child.parent_cap).toBe('valeria-agenda');
    expect(child.slug).toBe('valeria-agenda-mobile');
    expect(child.change_log).toHaveLength(1);
    expect(child.change_log[0].type).toBe('derive');
    expect(child.created_in_story).toBe('vitalia-fase3-valeria-agenda-mobile');
    expect(child.architecture_pattern).toBe('ADR-vitalia-004'); // heredado del padre

    // 4. Verificar padre actualizado
    const parent = await readCapability(parentPath);
    expect(parent.derives_capabilities).toContain('valeria-agenda-mobile');
    expect(parent.last_modified).toBe('2026-06-15');
  });
});
