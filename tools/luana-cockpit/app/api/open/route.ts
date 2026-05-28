/**
 * POST /api/open
 *  body: { path: string }   // relativo a WORKSPACE_ROOT o absoluto dentro del root
 *  → { ok: true }
 *
 * Spawnea editor (default xed · override via EDITOR_BIN env var). NUNCA usa exec
 * (anti shell-injection). Path debe caer dentro del workspace root.
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { z } from 'zod';
import { errorResponse, resolveWorkspacePath, safeJson } from '../_lib/responses';

const BodySchema = z.object({
  path: z.string().min(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await safeJson(req);
  if (!body) return errorResponse('body JSON inválido', 400);

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('body inválido', 400, { issues: parsed.error.issues });
  }

  const abs = resolveWorkspacePath(parsed.data.path);
  if (!abs) {
    return errorResponse('path fuera del workspace o inválido', 403, {
      path: parsed.data.path,
    });
  }

  // Verificar que el archivo/dir existe
  try {
    await stat(abs);
  } catch {
    return errorResponse('path no existe', 404, { path: parsed.data.path });
  }

  const editorBin = process.env.EDITOR_BIN || 'xed';

  try {
    // spawn detached para que el editor sobreviva al request
    const child = spawn(editorBin, [abs], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse('error spawneando editor', 500, {
      detail: (err as Error).message,
      editor_bin: editorBin,
    });
  }
}
