/**
 * workspace · resolución de paths para la pseudo-marca "platform" (Vía A · HB-27).
 *
 * Platform rerutea al `docs/` RAÍZ del workspace (no `{brand}/docs/`). Verifica
 * que los path-builders y el selector de marcas la tratan first-class sin romper
 * la resolución de las marcas reales.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  _resetWorkspaceCache,
  brandDocsRoot,
  storiesPath,
  archiveRootPath,
  learningsPath,
  brandPath,
  getSelectableBrands,
} from '../workspace';

let root: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'luana-platform-'));
  process.env.WORKSPACE_ROOT = root;
  _resetWorkspaceCache();
  // Marca real bootstrapeada + docs platform-level en root
  mkdirSync(path.join(root, 'vitalia', 'docs', 'product', 'stories'), { recursive: true });
  mkdirSync(path.join(root, 'docs', 'product', 'stories'), { recursive: true });
});

afterEach(() => {
  delete process.env.WORKSPACE_ROOT;
  _resetWorkspaceCache();
  rmSync(root, { recursive: true, force: true });
});

describe('workspace · platform pseudo-brand', () => {
  it('brandDocsRoot(platform) apunta al docs/ raíz; marca real a {brand}/docs', () => {
    expect(brandDocsRoot('platform')).toBe(path.join(root, 'docs'));
    expect(brandDocsRoot('vitalia')).toBe(path.join(root, 'vitalia', 'docs'));
  });

  it('storiesPath(platform) resuelve a docs/product/stories raíz', () => {
    expect(storiesPath('platform')).toBe(path.join(root, 'docs', 'product', 'stories'));
    expect(storiesPath('vitalia')).toBe(
      path.join(root, 'vitalia', 'docs', 'product', 'stories')
    );
  });

  it('archiveRootPath + learningsPath de platform van al root', () => {
    expect(archiveRootPath('platform')).toBe(path.join(root, 'docs', 'archive'));
    expect(learningsPath('platform')).toBe(path.join(root, 'docs', 'learnings'));
  });

  it('brandPath(platform) NO tira error (es un slug válido)', () => {
    expect(() => brandPath('platform')).not.toThrow();
    expect(brandPath('platform')).toBe(path.join(root, 'docs', 'product'));
  });

  it('brandPath sigue rechazando slugs desconocidos', () => {
    expect(() => brandPath('marca-fantasma')).toThrow(/desconocida/);
  });

  it('getSelectableBrands incluye platform además de las marcas reales', () => {
    const selectable = getSelectableBrands();
    expect(selectable).toContain('vitalia');
    expect(selectable).toContain('platform');
    // platform va al final (las reales primero)
    expect(selectable[selectable.length - 1]).toBe('platform');
  });
});
