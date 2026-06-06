/**
 * Regresión GET /api/stories/[id] — abrir una story `done` (archivada) en el
 * drawer del cockpit DEBE resolverla (200), no devolver 404 "story no encontrada".
 *
 * Bug fix 2026-06-02: el detail route derivaba el archive root con
 * `path.dirname(archivePath(brand,'0000'))` → `…/archive/0000` (un nivel de más) →
 * `findStoryPath` nunca escaneaba `archive/{year}/stories/` → toda story done daba
 * 404 → el StoryDrawer mostraba ErrorBanner ("story no encontrada"). El LIST route
 * ya estaba arreglado (ver stories-route.test.ts) pero el DETAIL route NO — por eso
 * el board listaba las done pero al hacer click fallaban. Fix: `archiveRootPath(brand)`.
 *
 * El mismo bug afectaba chris-input/[storyId], transition, from-done y refs/upload
 * (todos corregidos en el mismo commit).
 *
 * Usa un workspace temporal real (sin mocks) para ejercitar la resolución de paths.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { _resetWorkspaceCache } from '../workspace';

let root: string;

function writeStory(rel: string, frontmatter: string): void {
  const dir = path.join(root, rel);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'checkpoint.md'), `${frontmatter}\n# body\n`, 'utf-8');
}

async function getHandler() {
  const mod = await import('../../app/api/stories/[id]/route.js');
  return mod.GET;
}

function makeReq(id: string, brand: string) {
  const req = new Request(`http://localhost:3000/api/stories/${id}?brand=${brand}`);
  return Object.assign(req, { nextUrl: new URL(req.url) });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'luana-story-id-'));
  process.env.WORKSPACE_ROOT = root;
  _resetWorkspaceCache();
  writeStory(
    'vitalia/docs/product/stories/vitalia-live-example',
    '---\nstory_id: vitalia-live-example\nstate: developing\n---'
  );
  writeStory(
    'vitalia/docs/archive/2026/stories/vitalia-done-example',
    '---\nstory_id: vitalia-done-example\nstate: done\nrelease: F1\n---'
  );
});

afterEach(() => {
  delete process.env.WORKSPACE_ROOT;
  _resetWorkspaceCache();
  rmSync(root, { recursive: true, force: true });
});

describe('GET /api/stories/[id] — abrir story archivada', () => {
  it('resuelve una story done archivada (200, no 404) — el bug del drawer', async () => {
    const GET = await getHandler();
    const res = await GET(
      makeReq('vitalia-done-example', 'vitalia') as Parameters<typeof GET>[0],
      ctx('vitalia-done-example')
    );
    expect(res.status, 'story done archivada debe resolverse, no 404').toBe(200);
    const body = (await res.json()) as { story: { story_id: string; state: string } };
    expect(body.story.story_id).toBe('vitalia-done-example');
    expect(body.story.state).toBe('done');
  });

  it('sigue resolviendo una story activa (control)', async () => {
    const GET = await getHandler();
    const res = await GET(
      makeReq('vitalia-live-example', 'vitalia') as Parameters<typeof GET>[0],
      ctx('vitalia-live-example')
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { story: { story_id: string } };
    expect(body.story.story_id).toBe('vitalia-live-example');
  });

  it('404 real para una story inexistente', async () => {
    const GET = await getHandler();
    const res = await GET(
      makeReq('no-existe', 'vitalia') as Parameters<typeof GET>[0],
      ctx('no-existe')
    );
    expect(res.status).toBe(404);
  });
});
