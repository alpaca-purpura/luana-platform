/**
 * GET /api/stories?brand=vitalia  → { stories: Story[] }
 *
 * Agrega todos los checkpoints active + archived del brand, parseando
 * frontmatter v2 via lib/fs-reader. Marca `is_archived` para cada story.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { errorResponse } from '../_lib/responses';
import { readMarkdownWithFrontmatter } from '@/lib/fs-reader';
import { storiesPath, archivePath, getBrands } from '@/lib/workspace';
import type { Story } from '@/lib/types';

interface StoryWithArchive extends Story {
  is_archived: boolean;
}

async function safeListDirs(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name));
  } catch {
    return [];
  }
}

async function readCheckpoint(
  storyDir: string,
  brand: string,
  isArchived: boolean
): Promise<StoryWithArchive | null> {
  const ckptPath = path.join(storyDir, 'checkpoint.md');
  try {
    const parsed = await readMarkdownWithFrontmatter(ckptPath);
    const fm = parsed.frontmatter as Partial<Story>;
    const storyId = fm.story_id || path.basename(storyDir);
    return {
      ...(fm as Story),
      story_id: storyId,
      path: storyDir,
      brand,
      release: fm.release ?? null,
      cap_target: fm.cap_target ?? null,
      cap_change_type: fm.cap_change_type ?? null,
      parent_story: fm.parent_story ?? null,
      state: fm.state ?? 'idea',
      body: parsed.content,
      is_archived: isArchived,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const brand = req.nextUrl.searchParams.get('brand');
  if (!brand) {
    return errorResponse('query param "brand" requerido', 400);
  }

  const validBrands = getBrands();
  if (!validBrands.includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400, {
      valid_brands: validBrands,
    });
  }

  try {
    // Stories activas
    const liveDirs = await safeListDirs(storiesPath(brand));
    const liveStories = await Promise.all(
      liveDirs.map((d) => readCheckpoint(d, brand, false))
    );

    // Stories archivadas (escanea todos los años presentes)
    const archiveRoot = path.dirname(archivePath(brand, '0000'));
    let archivedDirs: string[] = [];
    try {
      const years = await readdir(archiveRoot, { withFileTypes: true });
      for (const y of years) {
        if (y.isDirectory()) {
          const storiesYearDir = path.join(archiveRoot, y.name, 'stories');
          const dirs = await safeListDirs(storiesYearDir);
          archivedDirs = archivedDirs.concat(dirs);
        }
      }
    } catch {
      // archive dir no existe · OK
    }

    const archivedStories = await Promise.all(
      archivedDirs.map((d) => readCheckpoint(d, brand, true))
    );

    const stories = [...liveStories, ...archivedStories].filter(
      (s): s is StoryWithArchive => s !== null
    );

    return NextResponse.json({ stories });
  } catch (err) {
    return errorResponse('error agregando stories', 500, {
      detail: (err as Error).message,
    });
  }
}
