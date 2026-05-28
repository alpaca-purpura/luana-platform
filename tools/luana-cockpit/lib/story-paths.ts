/**
 * Helpers para construir paths relativos al workspace root desde
 * un absoluto, usado por componentes que pasan paths a /api/file.
 *
 * Heurística simple: encuentra el primer segmento que coincide con
 * un brand conocido o "docs" y devuelve desde ahí. No requiere
 * roundtrip al servidor.
 */

const BRAND_SLUGS = [
  'vitalia',
  'nicolify',
  'comunify',
  'lupulo',
  'saasora',
  'inmoflow',
  'retailly',
  'fixia',
  'guestly',
  'fitflow',
];

const ROOTS_FIRST_SEGMENT = new Set([...BRAND_SLUGS, 'docs', 'tools', '.claude']);

/**
 * Convierte un path absoluto del story (ej.
 * /home/.../luana-platform/vitalia/docs/product/stories/X) en path
 * relativo al workspace root: vitalia/docs/product/stories/X.
 *
 * Si no encuentra un segmento conocido, devuelve null (el caller
 * debería usar /api/open con abs path en su lugar).
 */
export function absToRel(absPath: string): string | null {
  if (!absPath) return null;
  const segments = absPath.split('/').filter(Boolean);
  for (let i = 0; i < segments.length; i++) {
    if (ROOTS_FIRST_SEGMENT.has(segments[i])) {
      return segments.slice(i).join('/');
    }
  }
  return null;
}

/**
 * Devuelve la rel path al checkpoint.md de una story.
 */
export function storyArtifactRel(storyAbsPath: string, artifact: string): string | null {
  const rel = absToRel(storyAbsPath);
  if (!rel) return null;
  return `${rel}/${artifact}`;
}
