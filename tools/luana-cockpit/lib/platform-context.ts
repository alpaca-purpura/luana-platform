/**
 * Pseudo-marca "platform" (Vía A · HB-27) — CLIENT-SAFE (sin imports de node).
 * ────────────────────────────────────────────────────────────────────────────
 * Platform NO es una marca real: es un contexto solo-trazabilidad que el cockpit
 * muestra junto a las marcas, apuntando al `docs/` RAÍZ del workspace (stories +
 * learnings platform-level, owner /pm-luana; ej. `empleados-ia-auto-extension`).
 *
 * Read-only: las stories platform SIGUEN el SDD de producto (10 estados) y se
 * transicionan vía /pm-luana — el cockpit solo las HACE VISIBLES, no las edita.
 *
 * Este módulo vive separado de `workspace.ts` (que usa node:fs/child_process,
 * server-only) para que los componentes cliente puedan importar el slug + las
 * capacidades de vista sin arrastrar APIs de Node al bundle.
 */

export const PLATFORM_SLUG = 'platform';
export const PLATFORM_LABEL = 'Platform · core';

/** Vistas brand-scoped del cockpit (harness es transversal, no entra acá). */
export type CockpitView = 'board' | 'learnings' | 'roadmap' | 'map' | 'arquitectura' | 'drift';

/**
 * Qué vistas aplican a platform. Tiene Board (docs/product/stories) + Learnings
 * (docs/learnings) en el root; NO tiene releases, SYSTEM-MAP ni capabilities →
 * roadmap/map/arquitectura/drift NO aplican (el cockpit las corta antes de fetch).
 */
const PLATFORM_VIEWS: Record<CockpitView, boolean> = {
  board: true,
  learnings: true,
  roadmap: false,
  map: false,
  arquitectura: false,
  drift: false,
};

export function isPlatform(brand: string): boolean {
  return brand === PLATFORM_SLUG;
}

/**
 * ¿La vista aplica para esta marca? Marcas reales → todo aplica.
 * Platform → según PLATFORM_VIEWS (solo board + learnings).
 */
export function viewAppliesTo(brand: string, view: CockpitView): boolean {
  if (brand !== PLATFORM_SLUG) return true;
  return PLATFORM_VIEWS[view];
}
