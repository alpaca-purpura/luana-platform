/**
 * POST /api/merge-release
 *  body: { brand, releaseId, confirmFinal: boolean }
 *
 * Dual-confirm:
 *   1. confirmFinal=false → preview { plan: Operation[], executed: false }
 *   2. confirmFinal=true  → v0.6: REGISTRA INTENCIÓN solamente · devuelve
 *                            { plan, executed: false, note: "manual git mv pendiente Phase 6" }
 *
 * v0.6 NO ejecuta git mv automático. La orquestación real (squash-merge, archive
 * stories, regen BACKLOG, update release status=shipped) sigue siendo manual por
 * Chris o vía /pm-{brand} skill.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { z } from 'zod';
import { errorResponse, safeJson } from '../_lib/responses';
import { readRelease, loadStoryStatesForRelease } from '@/lib/release-resolver';
import { storiesPath, archivePath, getBrands } from '@/lib/workspace';
import type { StoryState } from '@/lib/types';

const BodySchema = z.object({
  brand: z.string(),
  releaseId: z.string().min(1),
  confirmFinal: z.boolean().optional().default(false),
});

interface PlanOperation {
  op: 'archive_story' | 'update_release' | 'generate_release_notes';
  description: string;
  source?: string;
  target?: string;
}

const TERMINAL_STATES: ReadonlySet<StoryState> = new Set(['done', 'dropped']);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await safeJson(req);
  if (!body) return errorResponse('body JSON inválido', 400);

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('body inválido', 400, { issues: parsed.error.issues });
  }
  const { brand, releaseId, confirmFinal } = parsed.data;

  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  let release;
  try {
    release = await readRelease(brand, releaseId);
  } catch {
    return errorResponse('release no encontrado', 404, { release_id: releaseId, brand });
  }

  if (release.status === 'shipped') {
    return errorResponse('release ya está shipped', 409, { release_id: releaseId });
  }

  // Verificar todas las stories en done o dropped
  const storyStates = await loadStoryStatesForRelease(release);
  const nonTerminal = release.stories.filter((_, i) => !TERMINAL_STATES.has(storyStates[i]));
  if (nonTerminal.length > 0) {
    return errorResponse(
      'release no está listo para merge · hay stories no terminales',
      409,
      {
        release_id: releaseId,
        non_terminal_stories: nonTerminal,
        states: storyStates,
      }
    );
  }

  // Construir plan
  const year = new Date().getFullYear();
  const archiveBase = archivePath(brand, year);
  const liveBase = storiesPath(brand);
  const releaseNotesPath = path.join(
    path.dirname(release.path ?? ''),
    '..',
    'release-notes',
    `${releaseId}.md`
  );

  const plan: PlanOperation[] = [];
  release.stories.forEach((storyId, i) => {
    if (storyStates[i] === 'done') {
      plan.push({
        op: 'archive_story',
        description: `git mv ${storyId} → archive/${year}/stories/${storyId}`,
        source: path.join(liveBase, storyId),
        target: path.join(archiveBase, storyId),
      });
    }
  });
  plan.push({
    op: 'update_release',
    description: `update ${releaseId}.yaml status=shipped + shipped_date=${new Date()
      .toISOString()
      .substring(0, 10)}`,
    target: release.path ?? '',
  });
  plan.push({
    op: 'generate_release_notes',
    description: `generar release-notes/${releaseId}.md con summary de stories shipped`,
    target: releaseNotesPath,
  });

  if (!confirmFinal) {
    return NextResponse.json({ plan, executed: false, preview: true });
  }

  // confirmFinal=true · v0.6 todavía registra intención solamente
  return NextResponse.json({
    plan,
    executed: false,
    note: 'v0.6 registra intención. Ejecución (git mv + update release.yaml + release-notes) pendiente Phase 6 o manual vía /pm-{brand}.',
  });
}
