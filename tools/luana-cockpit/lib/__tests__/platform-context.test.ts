/**
 * platform-context tests · la pseudo-marca "platform" (Vía A · HB-27).
 *
 * Platform NO es una marca real: es un contexto solo-trazabilidad que apunta al
 * `docs/` raíz (stories + learnings platform-level, owner /pm-luana). Tiene Board
 * y Learnings, pero NO releases/SYSTEM-MAP/caps → roadmap/map/arquitectura/drift
 * no aplican y el cockpit las corta antes de hacer fetch.
 */

import { describe, expect, it } from 'vitest';
import {
  PLATFORM_SLUG,
  isPlatform,
  viewAppliesTo,
} from '../platform-context.js';

describe('platform-context', () => {
  it('PLATFORM_SLUG es "platform"', () => {
    expect(PLATFORM_SLUG).toBe('platform');
  });

  it('isPlatform distingue platform de marcas reales', () => {
    expect(isPlatform('platform')).toBe(true);
    expect(isPlatform('vitalia')).toBe(false);
    expect(isPlatform('nicolify')).toBe(false);
  });

  it('para una marca real, TODAS las vistas aplican', () => {
    for (const view of ['board', 'learnings', 'roadmap', 'map', 'arquitectura', 'drift'] as const) {
      expect(viewAppliesTo('vitalia', view), `vitalia/${view}`).toBe(true);
    }
  });

  it('para platform, solo board + learnings aplican', () => {
    expect(viewAppliesTo('platform', 'board')).toBe(true);
    expect(viewAppliesTo('platform', 'learnings')).toBe(true);
    expect(viewAppliesTo('platform', 'roadmap')).toBe(false);
    expect(viewAppliesTo('platform', 'map')).toBe(false);
    expect(viewAppliesTo('platform', 'arquitectura')).toBe(false);
    expect(viewAppliesTo('platform', 'drift')).toBe(false);
  });
});
