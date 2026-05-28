/**
 * chris-input-parser tests · round-trip idempotente + parsing del ejemplo
 * real F2-S2 vitalia-fase2-valeria-pacientes.
 */

import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseChrisInput, serializeChrisInput } from '../chris-input-parser.js';
import type { ChrisInput } from '../types.js';

const REAL_FILE = path.resolve(
  __dirname,
  '../../../../vitalia/docs/product/stories/vitalia-fase2-valeria-pacientes/chris-input.md'
);

describe('chris-input-parser', () => {
  it('round-trip idempotente: parse(serialize(data)) === data', async () => {
    // Construir un ChrisInput manualmente con todos los tipos
    const original: ChrisInput = {
      frontmatter: {
        story_id: 'test-story',
        created_at: '2026-05-27T10:00:00-05:00',
        last_modified: '2026-05-27T12:00:00-05:00',
        notes_count: 2,
        refs_count: 3,
        conversation_count: 3,
      },
      notes: [
        { timestamp: '2026-05-27 10:00', text: 'Primera nota · línea 1\nlínea 2 de la nota.' },
        { timestamp: '2026-05-27 11:00', text: 'Segunda nota más corta.' },
      ],
      refs: [
        { type: 'link', value: 'https://example.com', comment: 'comentario opcional' },
        { type: 'img', value: 'refs/foo.png' },
        { type: 'learning-ref', value: '2026-05-18-pattern-x', comment: 'reusar' },
      ],
      conversation: [
        { timestamp: '2026-05-27 10:00', author: 'chris', text: 'mi pregunta' },
        {
          timestamp: '2026-05-27 10:15',
          author: 'claude',
          skill: 'po-ux',
          verdict: 'applied',
          text: 'apliqué cambios al 01-spec.md',
        },
        {
          timestamp: '2026-05-27 11:00',
          author: 'claude',
          skill: 'po-ux',
          verdict: 'doubt',
          text: '¿confirmas X?',
        },
      ],
    };

    const serialized = serializeChrisInput(original);
    const reparsed = parseChrisInput(serialized);

    // Frontmatter (los counts deben matchear los actuales)
    expect(reparsed.frontmatter.story_id).toBe(original.frontmatter.story_id);
    expect(reparsed.frontmatter.notes_count).toBe(original.notes.length);
    expect(reparsed.frontmatter.refs_count).toBe(original.refs.length);
    expect(reparsed.frontmatter.conversation_count).toBe(original.conversation.length);

    // Notes idempotentes
    expect(reparsed.notes).toEqual(original.notes);

    // Refs idempotentes
    expect(reparsed.refs).toEqual(original.refs);

    // Conversation idempotente
    expect(reparsed.conversation).toEqual(original.conversation);

    // Round-trip 2x debe ser stable
    const serialized2 = serializeChrisInput(reparsed);
    expect(serialized2).toBe(serialized);
  });

  it('parsea el ejemplo real F2-S2 vitalia-fase2-valeria-pacientes (2 notas + 5 refs + 5 conv entries)', async () => {
    const raw = await readFile(REAL_FILE, 'utf-8');
    const data = parseChrisInput(raw);

    // Frontmatter
    expect(data.frontmatter.story_id).toBe('vitalia-fase2-valeria-pacientes');
    expect(data.frontmatter.notes_count).toBe(2);
    expect(data.frontmatter.refs_count).toBe(5);
    expect(data.frontmatter.conversation_count).toBe(5);

    // Notes
    expect(data.notes).toHaveLength(2);
    expect(data.notes[0].timestamp).toBe('2026-05-27 14:30');
    expect(data.notes[0].text).toContain('estado de pago se vea PROMINENTE');
    expect(data.notes[1].timestamp).toBe('2026-05-27 16:00');
    expect(data.notes[1].text).toContain('quick-action de cobrar deuda');

    // Refs · 5 con todos los tipos
    expect(data.refs).toHaveLength(5);
    expect(data.refs[0]).toEqual({
      type: 'link',
      value: 'https://intercom.com/help/customer-segments',
      comment: 'me gusta cómo segmentan acá',
    });
    expect(data.refs[1].type).toBe('img');
    expect(data.refs[1].value).toBe('refs/2026-05-27-mockup-directorio.png');
    expect(data.refs[2].type).toBe('story-ref');
    expect(data.refs[2].value).toBe('F2-S1');
    expect(data.refs[3].type).toBe('text');
    expect(data.refs[3].value).toContain('Marta');
    expect(data.refs[4].type).toBe('learning-ref');
    expect(data.refs[4].value).toBe('2026-05-18-phi-repository-base');

    // Conversation · 5 entries
    expect(data.conversation).toHaveLength(5);
    expect(data.conversation[0].author).toBe('chris');
    expect(data.conversation[0].timestamp).toBe('2026-05-27 14:30');
    expect(data.conversation[1].author).toBe('claude');
    expect(data.conversation[1].skill).toBe('po-ux');
    expect(data.conversation[1].verdict).toBe('applied');
    expect(data.conversation[1].text).toContain('SC-08');
    expect(data.conversation[2].verdict).toBe('doubt');
    expect(data.conversation[3].author).toBe('chris');
    expect(data.conversation[4].verdict).toBe('applied');
    expect(data.conversation[4].text).toContain('Spec listo para ratificación');

    // Preserva el comentario HTML <!-- voseo-allowed -->
    expect(data.preamble).toContain('voseo-allowed');

    // Round-trip preserva data
    const serialized = serializeChrisInput(data);
    const reparsed = parseChrisInput(serialized);
    expect(reparsed.notes).toEqual(data.notes);
    expect(reparsed.refs).toEqual(data.refs);
    expect(reparsed.conversation).toEqual(data.conversation);
    // El HTML comment también round-trips
    expect(serialized.startsWith('<!--')).toBe(true);
  });
});
