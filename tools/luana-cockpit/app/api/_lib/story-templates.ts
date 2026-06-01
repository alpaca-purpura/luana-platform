/**
 * Templates para checkpoint.md + chris-input.md cuando se crean stories nuevas
 * desde el cockpit (extend-cap, from-done).
 *
 * Schema v2 cement 2026-05-27.
 */

import path from 'node:path';
import type { CapChangeType } from '@/lib/types';
import { writeMarkdownWithFrontmatter, writeFileAtomic } from '@/lib/fs-writer';
import { storiesPath } from '@/lib/workspace';

export interface NewStoryInput {
  brand: string;
  slug: string; // story_id final = slug
  goal: string;
  release: string;
  capTarget?: string | null;
  capChangeType?: CapChangeType | null;
  parentStory?: string | null;
  spawnedBy?: string;
  /** Agente dueño (heredado del cap/story padre) → board pinta franja + emoji. */
  agentOwner?: string | null;
  /** Módulo del cap (heredado del cap/story padre) → ubicación en el mapa. */
  module?: string | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayIso(): string {
  return new Date().toISOString().substring(0, 10);
}

export interface CreatedStoryPaths {
  storyId: string;
  storyDir: string;
  checkpointPath: string;
  chrisInputPath: string;
}

/**
 * Crea checkpoint.md + chris-input.md en `{brand}/docs/product/stories/{slug}/`.
 * Falla si el directorio ya existe (no sobrescribe).
 */
export async function createNewStoryDocs(
  input: NewStoryInput
): Promise<CreatedStoryPaths> {
  const storyDir = path.join(storiesPath(input.brand), input.slug);
  const checkpointPath = path.join(storyDir, 'checkpoint.md');
  const chrisInputPath = path.join(storyDir, 'chris-input.md');

  // Frontmatter checkpoint
  const checkpointFrontmatter: Record<string, unknown> = {
    story_id: input.slug,
    brand: input.brand,
    state: 'idea',
    release: input.release,
    cap_target: input.capTarget ?? null,
    cap_change_type: input.capChangeType ?? null,
    parent_story: input.parentStory ?? null,
    agent_owner: input.agentOwner ?? null,
    module: input.module ?? null,
    last_modified: nowIso(),
    spawned_at: todayIso(),
    spawned_by: input.spawnedBy ?? 'cockpit',
    ratified_by_chris: false,
    parallel_safe: true,
    next_action: 'Chris ratifica goal + cap_target · luego /po-ux o /po refina spec',
    goal: input.goal,
  };

  const checkpointBody = `# ${input.slug} — checkpoint

## Goal

${input.goal}

## Estado

Story creada desde cockpit · pending Chris ratify para empezar refinement.
`;

  const chrisInputFrontmatter: Record<string, unknown> = {
    story_id: input.slug,
    created_at: nowIso(),
    last_modified: nowIso(),
    notes_count: 0,
    refs_count: 0,
    conversation_count: 0,
  };

  const chrisInputBody = `# chris-input.md · ${input.slug}

> Cocina de la story (Notas + Referencias + Conversación). Separada de spec/design/arch.
> Doc canónico: \`docs/process/chris-input-protocol.md\`.

## 💭 Notas

## 📎 Referencias

(sin referencias todavía)

## 💬 Conversación
`;

  await writeMarkdownWithFrontmatter(
    checkpointPath,
    checkpointFrontmatter,
    checkpointBody
  );
  await writeMarkdownWithFrontmatter(
    chrisInputPath,
    chrisInputFrontmatter,
    chrisInputBody
  );

  return {
    storyId: input.slug,
    storyDir,
    checkpointPath,
    chrisInputPath,
  };
}

/**
 * Appendea una ref de tipo 'story-ref' a la sección Referencias del chris-input.md
 * de la story recién creada · helper para from-done para registrar parent.
 */
export async function appendStoryRefToChrisInput(
  chrisInputPath: string,
  refValue: string,
  comment: string
): Promise<void> {
  // Append directo: ya sabemos cómo se ve el template (sección vacía con "(sin referencias todavía)")
  // Para idempotencia + correctitud, leemos + parseamos + serializamos.
  const { parseChrisInput, serializeChrisInput } = await import(
    '@/lib/chris-input-parser'
  );
  const { readFile } = await import('node:fs/promises');

  const raw = await readFile(chrisInputPath, 'utf-8');
  const data = parseChrisInput(raw);
  data.refs.push({
    type: 'story-ref',
    value: refValue,
    comment,
  });
  data.frontmatter.last_modified = nowIso();
  data.frontmatter.refs_count = data.refs.length;
  const serialized = serializeChrisInput(data);
  await writeFileAtomic(chrisInputPath, serialized);
}
