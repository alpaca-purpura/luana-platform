/**
 * GET    /api/releases?brand=vitalia       → { releases: Release[] }
 * POST   /api/releases body:{release_id, brand, name, ...}  → { release }
 * PUT    /api/releases?id=F2&brand=vitalia body:{name?, description?, ...}  → { release }
 * DELETE /api/releases?id=F2&brand=vitalia → { ok: true, archived_path }
 *
 * Per cockpit-permissions.md:
 *   PUT solo edita: name, description, target_date, order, stories
 *   NO edita: status, shipped_date, release_id, brand, created_at, created_by
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { rename, mkdir } from 'node:fs/promises';
import matter from 'gray-matter';
import { z } from 'zod';
import { errorResponse, safeJson } from '../_lib/responses';
import { listReleases, readRelease, writeRelease } from '@/lib/release-resolver';
import { writeFileAtomic } from '@/lib/fs-writer';
import { releasesPath, getBrands } from '@/lib/workspace';
import type { Release, ReleaseStatus } from '@/lib/types';

const CreateBodySchema = z.object({
  release_id: z.string().regex(/^[A-Za-z0-9_-]+$/, 'solo alfanuméricos, _ y -'),
  brand: z.string(),
  name: z.string().min(1),
  description: z.string(),
  target_date: z.string().nullable().optional(),
  order: z.number().int().optional(),
  stories: z.array(z.string()).optional(),
});

const UpdateBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  target_date: z.string().nullable().optional(),
  order: z.number().int().optional(),
  stories: z.array(z.string()).optional(),
});

const READ_ONLY_FIELDS = [
  'status',
  'shipped_date',
  'release_id',
  'brand',
  'created_at',
  'created_by',
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const brand = req.nextUrl.searchParams.get('brand');
  if (!brand) return errorResponse('query param "brand" requerido', 400);
  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  try {
    const releases = await listReleases(brand);
    return NextResponse.json({ releases });
  } catch (err) {
    return errorResponse('error listando releases', 500, {
      detail: (err as Error).message,
    });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await safeJson(req);
  if (!body) return errorResponse('body JSON inválido', 400);

  const parsed = CreateBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('body inválido', 400, { issues: parsed.error.issues });
  }
  const data = parsed.data;

  if (!getBrands().includes(data.brand)) {
    return errorResponse(`brand desconocida: ${data.brand}`, 400);
  }

  // Verificar que no exista
  try {
    await readRelease(data.brand, data.release_id);
    return errorResponse('release ya existe', 409, {
      release_id: data.release_id,
      brand: data.brand,
    });
  } catch {
    // expected · no existe
  }

  const nowIso = new Date().toISOString();
  const release: Release = {
    release_id: data.release_id,
    brand: data.brand,
    name: data.name,
    description: data.description,
    status: 'planning' as ReleaseStatus,
    target_date: data.target_date ?? null,
    shipped_date: null,
    order: data.order ?? 0,
    created_at: nowIso,
    created_by: 'chris',
    stories: data.stories ?? [],
    maps_legacy_outcome: null,
    maps_legacy_phase: null,
    body: `# ${data.release_id} · ${data.name}\n\n> ${data.description}\n\n## Stories incluidas\n\n## Notas del release\n\n(libre · Chris escribe aquí contexto adicional · decisiones · gotchas)\n`,
    path: path.join(releasesPath(data.brand), `${data.release_id}.yaml`),
  };

  try {
    await writeRelease(release);
    return NextResponse.json({ release });
  } catch (err) {
    return errorResponse('error escribiendo release', 500, {
      detail: (err as Error).message,
    });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const releaseId = req.nextUrl.searchParams.get('id');
  const brand = req.nextUrl.searchParams.get('brand');
  if (!releaseId) return errorResponse('query param "id" requerido', 400);
  if (!brand) return errorResponse('query param "brand" requerido', 400);
  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  const body = await safeJson(req);
  if (!body) return errorResponse('body JSON inválido', 400);

  // Check forbidden fields
  if (typeof body === 'object' && body !== null) {
    const sent = Object.keys(body as Record<string, unknown>);
    const forbidden = sent.filter((k) => READ_ONLY_FIELDS.includes(k));
    if (forbidden.length > 0) {
      return errorResponse('algunos fields no son editables', 403, {
        forbidden_fields: forbidden,
        reason:
          'status y shipped_date se auto-calculan; release_id/brand/created_at/created_by son inmutables.',
      });
    }
  }

  const parsed = UpdateBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('body inválido', 400, { issues: parsed.error.issues });
  }

  let release: Release;
  try {
    release = await readRelease(brand, releaseId);
  } catch {
    return errorResponse('release no encontrado', 404, { release_id: releaseId, brand });
  }

  const updated: Release = {
    ...release,
    ...parsed.data,
  };

  try {
    await writeRelease(updated);
    return NextResponse.json({ release: updated });
  } catch (err) {
    return errorResponse('error escribiendo release', 500, {
      detail: (err as Error).message,
    });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const releaseId = req.nextUrl.searchParams.get('id');
  const brand = req.nextUrl.searchParams.get('brand');
  if (!releaseId) return errorResponse('query param "id" requerido', 400);
  if (!brand) return errorResponse('query param "brand" requerido', 400);
  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  let release: Release;
  try {
    release = await readRelease(brand, releaseId);
  } catch {
    return errorResponse('release no encontrado', 404, { release_id: releaseId, brand });
  }

  if (release.status === 'shipped') {
    return errorResponse('no se puede archivar release shipped', 403, {
      release_id: releaseId,
      reason: 'releases ya entregados son inmutables. Usa /pm-{brand} para correcciones excepcionales.',
    });
  }

  const archiveDir = path.join(releasesPath(brand), '_archived');
  const archivedPath = path.join(archiveDir, `${releaseId}.yaml`);

  try {
    await mkdir(archiveDir, { recursive: true });
    if (release.path) {
      await rename(release.path, archivedPath);
    } else {
      // fallback: serializar y escribir
      const { body, path: _p, ...frontmatter } = release;
      const serialized = matter.stringify(body ?? '', frontmatter as Record<string, unknown>);
      await writeFileAtomic(archivedPath, serialized);
    }
    return NextResponse.json({ ok: true, archived_path: archivedPath });
  } catch (err) {
    return errorResponse('error archivando release', 500, {
      detail: (err as Error).message,
    });
  }
}
