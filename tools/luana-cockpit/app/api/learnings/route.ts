/**
 * GET /api/learnings?brand=vitalia  → { learnings: LearningEntry[] }
 *
 * Lee todos los `.md` en `{brand}/docs/learnings/` y parsea su frontmatter
 * (title, date, tags, type, brands_affected, etc.). Devuelve ordenados
 * cronológicamente desc.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { errorResponse } from '../_lib/responses';
import { readMarkdownWithFrontmatter } from '@/lib/fs-reader';
import { learningsPath, getSelectableBrands } from '@/lib/workspace';

interface LearningEntry {
  slug: string;
  path: string;
  title?: string;
  date?: string;
  type?: string;
  brand?: string;
  brands_affected?: string[];
  tags?: string[];
  preview?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const brand = req.nextUrl.searchParams.get('brand');
  if (!brand) return errorResponse('query param "brand" requerido', 400);
  if (!getSelectableBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  const dir = learningsPath(brand);
  let files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    files = entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => path.join(dir, e.name));
  } catch {
    // dir no existe
    return NextResponse.json({ learnings: [] });
  }

  const learnings: LearningEntry[] = [];
  for (const abs of files) {
    try {
      const parsed = await readMarkdownWithFrontmatter(abs);
      const fm = parsed.frontmatter as Record<string, unknown>;
      const slug = path.basename(abs, '.md');
      // Preview: primer párrafo del cuerpo (limpia headings)
      const preview = parsed.content
        .replace(/^#+\s+.*/gm, '')
        .trim()
        .split('\n\n')[0]
        ?.replace(/\n/g, ' ')
        .slice(0, 240);
      learnings.push({
        slug,
        path: abs,
        title: typeof fm.title === 'string' ? fm.title : undefined,
        date: typeof fm.date === 'string' ? fm.date : undefined,
        type: typeof fm.type === 'string' ? fm.type : undefined,
        brand: typeof fm.brand === 'string' ? fm.brand : undefined,
        brands_affected: Array.isArray(fm.brands_affected)
          ? (fm.brands_affected as string[])
          : undefined,
        tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : undefined,
        preview,
      });
    } catch {
      // skip
    }
  }

  learnings.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return NextResponse.json({ learnings });
}
