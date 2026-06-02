/**
 * harness-backlog parser tests · parsea la tabla markdown de
 * docs/process/harness-backlog.md (issue-tracker liviano del harness) a
 * HarnessItem[] estructurado. Cubre: fila normal, estado en negrita,
 * estado con sufijo "(cont. N)", deferred, los 4 emojis de severidad,
 * skip de header/separador/prosa, y un smoke contra el archivo real.
 */

import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  parseHarnessBacklog,
  ESTADO_ORDER,
  countByEstado,
  type HarnessItem,
} from '../harness-backlog.js';

const REAL_FILE = path.resolve(
  __dirname,
  '../../../../docs/process/harness-backlog.md'
);

const FIXTURE = `# Harness Backlog (vivo)

> Issue-tracker liviano. Estados: reported → triaged → ratified → applied → verified.

| id | fecha | sev | item | estado | ref |
|---|---|---|---|---|---|
| HB-1 | 2026-06-01 | 🔴 | contract-guard.js muerto en worktrees | **verified** | 17bf3c62 |
| HB-4 | 2026-06-01 | 🟡 | voseo enforcement acotado a UI/agentic | **verified** | 17bf3c62 |
| HB-9 | 2026-06-01 | 🔵 | D-6 bump caps CLAUDE.md (270/165) | **applied** | 2388a13a |
| HB-17 | 2026-06-01 | 🟣 | **Wave 5b**: (a) context:fork análisis | **applied** (cont. 4) | pendiente commit |
| HB-24 | 2026-06-02 | 🔵 | skill file-size extraction | reported | refactor 4 skills |
| HB-99 | 2026-06-02 | 🟡 | item diferido de ejemplo | **deferred** | sin ref |

## Próxima acción

Esto es prosa · no debe parsearse como fila. HB-fake no cuenta.
`;

describe('parseHarnessBacklog', () => {
  it('parsea solo filas HB-N (skip header, separador y prosa)', () => {
    const items = parseHarnessBacklog(FIXTURE);
    expect(items).toHaveLength(6);
    expect(items.map((i) => i.id)).toEqual([
      'HB-1',
      'HB-4',
      'HB-9',
      'HB-17',
      'HB-24',
      'HB-99',
    ]);
  });

  it('mapea las 6 columnas de una fila normal', () => {
    const hb1 = parseHarnessBacklog(FIXTURE).find((i) => i.id === 'HB-1') as HarnessItem;
    expect(hb1.num).toBe(1);
    expect(hb1.fecha).toBe('2026-06-01');
    expect(hb1.sevEmoji).toBe('🔴');
    expect(hb1.sevLabel).toBe('silent-killer');
    expect(hb1.item).toBe('contract-guard.js muerto en worktrees');
    expect(hb1.estado).toBe('verified');
    expect(hb1.estadoRaw).toBe('**verified**');
    expect(hb1.ref).toBe('17bf3c62');
  });

  it('extrae el estado canónico ignorando negrita y sufijo "(cont. N)"', () => {
    const items = parseHarnessBacklog(FIXTURE);
    expect(items.find((i) => i.id === 'HB-9')?.estado).toBe('applied');
    expect(items.find((i) => i.id === 'HB-17')?.estado).toBe('applied');
    expect(items.find((i) => i.id === 'HB-17')?.estadoRaw).toBe('**applied** (cont. 4)');
    expect(items.find((i) => i.id === 'HB-24')?.estado).toBe('reported');
    expect(items.find((i) => i.id === 'HB-99')?.estado).toBe('deferred');
  });

  it('mapea los 4 emojis de severidad a label', () => {
    const items = parseHarnessBacklog(FIXTURE);
    expect(items.find((i) => i.id === 'HB-1')?.sevLabel).toBe('silent-killer'); // 🔴
    expect(items.find((i) => i.id === 'HB-4')?.sevLabel).toBe('quick-win'); // 🟡
    expect(items.find((i) => i.id === 'HB-9')?.sevLabel).toBe('decision'); // 🔵
    expect(items.find((i) => i.id === 'HB-17')?.sevLabel).toBe('wave'); // 🟣
  });

  it('title limpia los marcadores de negrita del item', () => {
    const hb17 = parseHarnessBacklog(FIXTURE).find((i) => i.id === 'HB-17') as HarnessItem;
    expect(hb17.title).toBe('Wave 5b: (a) context:fork análisis');
    expect(hb17.title).not.toContain('**');
  });

  it('no crashea con string vacío ni sin tabla', () => {
    expect(parseHarnessBacklog('')).toEqual([]);
    expect(parseHarnessBacklog('# solo un título\n\nprosa.')).toEqual([]);
  });

  it('countByEstado agrupa por estado canónico', () => {
    const counts = countByEstado(parseHarnessBacklog(FIXTURE));
    expect(counts.verified).toBe(2);
    expect(counts.applied).toBe(2);
    expect(counts.reported).toBe(1);
    expect(counts.deferred).toBe(1);
  });

  it('ESTADO_ORDER cubre el lifecycle del HLP', () => {
    expect(ESTADO_ORDER).toEqual([
      'reported',
      'triaged',
      'ratified',
      'applied',
      'verified',
      'deferred',
    ]);
  });
});

describe('parseHarnessBacklog · smoke contra el archivo real', () => {
  it('parsea docs/process/harness-backlog.md con ≥20 items y HB-1 verified', async () => {
    const md = await readFile(REAL_FILE, 'utf-8');
    const items = parseHarnessBacklog(md);
    expect(items.length).toBeGreaterThanOrEqual(20);
    // todos tienen id HB-N y un estado canónico conocido
    for (const it of items) {
      expect(it.id).toMatch(/^HB-\d+$/);
      expect([...ESTADO_ORDER, 'otro']).toContain(it.estado);
    }
    const hb1 = items.find((i) => i.id === 'HB-1');
    expect(hb1?.estado).toBe('verified');
  });
});
