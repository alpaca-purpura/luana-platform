/**
 * cap-ledger.ts tests · 4 ramas (new/fix/extend/derive).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  applyCapChange,
  createDerivedCap,
  readCapability,
} from '../cap-ledger.js';
import type { ChangeLogEntry } from '../types.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cockpit-cap-ledger-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('applyCapChange', () => {
  it('type=new crea archivo con change_log[0] y scenarios_added', async () => {
    const capPath = path.join(tmpDir, 'caps', 'scheduling', 'valeria-agenda.yaml');
    const entry: ChangeLogEntry = {
      story_id: 'vitalia-fase2-valeria-agenda',
      date: '2026-05-27',
      type: 'new',
      summary: 'Implementación inicial · vista calendario + drag-to-reschedule',
      scenarios_added: ['Vista calendario semanal', 'Drag-to-reschedule'],
      merge_sha: '4562140c',
      status: 'done',
    };

    await applyCapChange({
      capPath,
      entry,
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
    expect(cap.change_log).toHaveLength(1);
    expect(cap.change_log[0].type).toBe('new');
    expect(cap.change_log[0].scenarios_added).toEqual([
      'Vista calendario semanal',
      'Drag-to-reschedule',
    ]);
    expect(cap.change_log[0].merge_sha).toBe('4562140c');
  });

  it('type=fix appendea change_log con scenarios_added vacío', async () => {
    const capPath = path.join(tmpDir, 'caps', 'shell', 'layout-5050.yaml');
    // Seed: crear cap base
    await applyCapChange({
      capPath,
      entry: {
        story_id: 'vitalia-fase1-shell-layout-5050',
        date: '2026-05-20',
        type: 'new',
        summary: 'Layout shell 50/50 inicial',
        scenarios_added: ['split 50/50'],
        status: 'done',
      },
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
        scenarios_added: [],
        status: 'done',
      },
    });

    const cap = await readCapability(capPath);
    expect(cap.change_log).toHaveLength(2);
    expect(cap.change_log[1].type).toBe('fix');
    expect(cap.change_log[1].scenarios_added).toEqual([]);
    expect(cap.last_modified).toBe('2026-05-25');
  });

  it('type=extend appendea change_log con scenarios_added listados', async () => {
    const capPath = path.join(tmpDir, 'caps', 'lisa', 'marca.yaml');
    // Seed: cap base lisa.marca
    await applyCapChange({
      capPath,
      entry: {
        story_id: 'vitalia-fase2-lisa-marca',
        date: '2026-05-24',
        type: 'new',
        summary: 'Lisa marca · skin tokens + voice',
        scenarios_added: ['Skin tokens'],
        status: 'done',
      },
      initialCap: {
        capability_id: 'vitalia.lisa.marca',
        module: 'lisa',
        slug: 'marca',
      },
    });

    // Extend
    await applyCapChange({
      capPath,
      entry: {
        story_id: 'vitalia-fase2-lisa-marca-v2',
        date: '2026-05-27',
        type: 'extend',
        summary: 'Color extractor + logo upload',
        scenarios_added: ['Color extractor', 'Logo upload'],
        status: 'done',
      },
    });

    const cap = await readCapability(capPath);
    expect(cap.change_log).toHaveLength(2);
    expect(cap.change_log[1].type).toBe('extend');
    expect(cap.change_log[1].scenarios_added).toEqual(['Color extractor', 'Logo upload']);
    expect(cap.last_modified).toBe('2026-05-27');
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
        scenarios_added: ['Calendar view'],
        status: 'done',
      },
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
    });

    // 3. Verificar hijo
    const child = await readCapability(childPath);
    expect(child.parent_cap).toBe('valeria-agenda');
    expect(child.slug).toBe('valeria-agenda-mobile');
    expect(child.change_log).toHaveLength(1);
    expect(child.change_log[0].type).toBe('derive');
    expect(child.change_log[0].scenarios_added).toEqual([]);
    expect(child.created_in_story).toBe('vitalia-fase3-valeria-agenda-mobile');
    expect(child.architecture_pattern).toBe('ADR-vitalia-004'); // heredado del padre

    // 4. Verificar padre actualizado
    const parent = await readCapability(parentPath);
    expect(parent.derives_capabilities).toContain('valeria-agenda-mobile');
    expect(parent.last_modified).toBe('2026-06-15');
  });
});
