/**
 * GET   /api/chris-input/{storyId}?brand=vitalia  → { chrisInput }
 * PATCH /api/chris-input/{storyId}?brand=vitalia
 *        body: { section: 'notes'|'refs'|'conversation', entry: <Entry> }
 *                                                → { chrisInput }
 *
 * Permisos (cockpit-permissions.md):
 *   - notes / refs  → CRUD completo (acá implementamos APPEND solamente · cockpit
 *                     UI puede usar GET+PUT raw vía /api/file para edits inline)
 *   - conversation  → solo APPEND · author DEBE ser 'chris' (Claude appendea via
 *                     skill usando appendConversationEntry en lib, no este endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { z } from 'zod';
import { errorResponse, safeJson } from '../../_lib/responses';
import {
  parseChrisInput,
  serializeChrisInput,
  appendConversationEntry,
} from '@/lib/chris-input-parser';
import { writeFileAtomic } from '@/lib/fs-writer';
import { storiesPath, archivePath, getBrands } from '@/lib/workspace';
import type { ChrisInput, ConvEntry, Note, Ref, RefType } from '@/lib/types';

const NoteEntrySchema = z.object({
  timestamp: z.string().optional(),
  text: z.string().min(1),
});

const RefEntrySchema = z.object({
  type: z.enum(['link', 'img', 'text', 'story-ref', 'learning-ref', 'doc']),
  value: z.string().min(1),
  comment: z.string().optional(),
});

const ConvEntrySchema = z.object({
  timestamp: z.string().optional(),
  author: z.literal('chris'),
  text: z.string().min(1),
});

const PatchBodySchema = z.discriminatedUnion('section', [
  z.object({ section: z.literal('notes'), entry: NoteEntrySchema }),
  z.object({ section: z.literal('refs'), entry: RefEntrySchema }),
  z.object({ section: z.literal('conversation'), entry: ConvEntrySchema }),
]);

function nowTimestamp(): string {
  // "YYYY-MM-DD HH:MM" en tz local
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

async function findChrisInputPath(brand: string, storyId: string): Promise<string | null> {
  const candidates: string[] = [path.join(storiesPath(brand), storyId, 'chris-input.md')];

  const archiveRoot = path.dirname(archivePath(brand, '0000'));
  try {
    const years = await readdir(archiveRoot, { withFileTypes: true });
    for (const y of years) {
      if (y.isDirectory()) {
        candidates.push(path.join(archiveRoot, y.name, 'stories', storyId, 'chris-input.md'));
      }
    }
  } catch {
    // archive dir no existe
  }

  for (const c of candidates) {
    try {
      await readFile(c, 'utf-8');
      return c;
    } catch {
      // continuar
    }
  }
  return null;
}

async function loadChrisInput(absPath: string): Promise<ChrisInput> {
  const raw = await readFile(absPath, 'utf-8');
  return parseChrisInput(raw);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ storyId: string }> }
): Promise<NextResponse> {
  const { storyId } = await context.params;
  const brand = req.nextUrl.searchParams.get('brand');
  if (!brand) return errorResponse('query param "brand" requerido', 400);
  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  const ciPath = await findChrisInputPath(brand, storyId);
  if (!ciPath) {
    return errorResponse('chris-input.md no encontrado', 404, { story_id: storyId, brand });
  }

  try {
    const chrisInput = await loadChrisInput(ciPath);
    return NextResponse.json({ chrisInput });
  } catch (err) {
    return errorResponse('error parseando chris-input.md', 500, {
      detail: (err as Error).message,
    });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ storyId: string }> }
): Promise<NextResponse> {
  const { storyId } = await context.params;
  const brand = req.nextUrl.searchParams.get('brand');
  if (!brand) return errorResponse('query param "brand" requerido', 400);
  if (!getBrands().includes(brand)) {
    return errorResponse(`brand desconocida: ${brand}`, 400);
  }

  const body = await safeJson(req);
  if (!body) return errorResponse('body JSON inválido', 400);

  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('body inválido', 400, { issues: parsed.error.issues });
  }

  const ciPath = await findChrisInputPath(brand, storyId);
  if (!ciPath) {
    return errorResponse('chris-input.md no encontrado', 404, { story_id: storyId, brand });
  }

  try {
    if (parsed.data.section === 'conversation') {
      // Append vía helper dedicado del lib
      const entry: ConvEntry = {
        timestamp: parsed.data.entry.timestamp || nowTimestamp(),
        author: 'chris',
        text: parsed.data.entry.text,
      };
      await appendConversationEntry(ciPath, entry);
      const chrisInput = await loadChrisInput(ciPath);
      return NextResponse.json({ chrisInput });
    }

    // Notes o Refs · parse + append + serialize
    const data = await loadChrisInput(ciPath);
    if (parsed.data.section === 'notes') {
      const note: Note = {
        timestamp: parsed.data.entry.timestamp || nowTimestamp(),
        text: parsed.data.entry.text,
      };
      data.notes.push(note);
    } else {
      // refs
      const ref: Ref = {
        type: parsed.data.entry.type as RefType,
        value: parsed.data.entry.value,
        comment: parsed.data.entry.comment,
      };
      data.refs.push(ref);
    }
    data.frontmatter.last_modified = new Date().toISOString();
    data.frontmatter.notes_count = data.notes.length;
    data.frontmatter.refs_count = data.refs.length;
    data.frontmatter.conversation_count = data.conversation.length;

    const serialized = serializeChrisInput(data);
    await writeFileAtomic(ciPath, serialized);
    return NextResponse.json({ chrisInput: data });
  } catch (err) {
    return errorResponse('error actualizando chris-input.md', 500, {
      detail: (err as Error).message,
    });
  }
}
