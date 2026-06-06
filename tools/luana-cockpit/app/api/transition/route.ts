/**
 * POST /api/transition
 *  body: { brand: string, storyId: string, targetState: StoryState, reason?: string }
 *  → { ok: true, newState }
 *
 * SOLO permite transitions del whitelist CHRIS_ALLOWED_TRANSITIONS:
 *   idea → refining, parked, dropped
 *   refining → idea, parked, dropped
 *   parked → idea
 *
 * Si target ∈ {parked, dropped}, requiere reason ≥10 chars.
 * Escribe checkpoint.md con nuevo state + parked_reason | dropped_reason.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { z } from 'zod';
import { errorResponse, safeJson } from '../_lib/responses';
import { readMarkdownWithFrontmatter } from '@/lib/fs-reader';
import { writeMarkdownWithFrontmatter } from '@/lib/fs-writer';
import { storiesPath, archiveRootPath, getBrands } from '@/lib/workspace';
import { isChrisAllowed, type StoryState } from '@/lib/types';

const STATE_VALUES: readonly StoryState[] = [
  'idea',
  'refining',
  'refined',
  'ready',
  'developing',
  'developed',
  'reviewing',
  'done',
  'parked',
  'dropped',
];

const BodySchema = z.object({
  brand: z.string(),
  storyId: z.string().min(1),
  targetState: z.enum(STATE_VALUES as unknown as [StoryState, ...StoryState[]]),
  reason: z.string().optional(),
});

const STATE_OWNERS: Partial<Record<StoryState, string>> = {
  refined: '/architect (cierra spec) o /pm-{brand} (ratifica)',
  ready: '/architect (ready package completo)',
  developing: '/dev-team (builder spawn)',
  developed: '/dev-team (validators GREEN)',
  reviewing: '/auditor (AUTO-HANDOFF desde developed)',
  done: '/pm-{brand} (Fase F MERGE)',
};

async function findStoryDir(brand: string, storyId: string): Promise<string | null> {
  const liveDir = path.join(storiesPath(brand), storyId);
  try {
    await readMarkdownWithFrontmatter(path.join(liveDir, 'checkpoint.md'));
    return liveDir;
  } catch {
    // continuar
  }

  const archiveRoot = archiveRootPath(brand); // = archive/ (NO path.dirname(archivePath) → archive/{year} bug)
  try {
    const years = await readdir(archiveRoot, { withFileTypes: true });
    for (const y of years) {
      if (!y.isDirectory()) continue;
      const candidate = path.join(archiveRoot, y.name, 'stories', storyId);
      try {
        await readMarkdownWithFrontmatter(path.join(candidate, 'checkpoint.md'));
        return candidate;
      } catch {
        // continuar
      }
    }
  } catch {
    // archive dir no existe
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await safeJson(req);
  if (!body) return errorResponse('body JSON inválido', 400);

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('body inválido', 400, { issues: parsed.error.issues });
  }
  const { brand, storyId, targetState, reason } = parsed.data;

  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  const storyDir = await findStoryDir(brand, storyId);
  if (!storyDir) {
    return errorResponse('story no encontrada', 404, { story_id: storyId, brand });
  }

  const checkpointPath = path.join(storyDir, 'checkpoint.md');
  const current = await readMarkdownWithFrontmatter(checkpointPath);
  const fromState = (current.frontmatter as { state?: StoryState }).state || 'idea';

  // Validar whitelist
  const transition = isChrisAllowed(fromState, targetState);
  if (!transition) {
    const owner = STATE_OWNERS[targetState];
    const ownerNote = owner
      ? `esta transition la ejecuta ${owner}. Invoca la skill desde Claude Code.`
      : 'transition no permitida desde el cockpit.';
    return errorResponse('transition_forbidden', 403, {
      from: fromState,
      to: targetState,
      reason: ownerNote,
    });
  }

  // Validar reason cuando se requiere
  if (transition.requiresReason) {
    if (!reason || reason.trim().length < 10) {
      return errorResponse('reason obligatorio · ≥10 chars', 400, {
        from: fromState,
        to: targetState,
        verb: transition.verb,
      });
    }
  }

  const updatedFm: Record<string, unknown> = {
    ...current.frontmatter,
    state: targetState,
    last_modified: new Date().toISOString(),
  };

  if (targetState === 'parked') {
    updatedFm.parked_reason = reason;
  } else if (targetState === 'dropped') {
    updatedFm.dropped_reason = reason;
  } else if (fromState === 'parked' && targetState === 'idea') {
    // Reactivar · limpiar parked_reason
    updatedFm.parked_reason = null;
  }

  try {
    await writeMarkdownWithFrontmatter(checkpointPath, updatedFm, current.content);
    return NextResponse.json({ ok: true, newState: targetState });
  } catch (err) {
    return errorResponse('error escribiendo checkpoint', 500, {
      detail: (err as Error).message,
    });
  }
}
