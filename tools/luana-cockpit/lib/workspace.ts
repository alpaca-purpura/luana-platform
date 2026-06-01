/**
 * Workspace resolver — encuentra el root del monorepo y detecta brands activas.
 *
 * Estrategia:
 * 1. `process.env.WORKSPACE_ROOT` (override explícito)
 * 2. `git rev-parse --show-toplevel` desde cwd
 * 3. Walk hacia arriba buscando `pnpm-workspace.yaml` o `.git/`
 */

import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const KNOWN_BRAND_SLUGS = [
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

let cachedRoot: string | null = null;

/** Devuelve el path absoluto al workspace root (luana-platform/). Throw si no se encuentra. */
export function getWorkspaceRoot(): string {
  if (cachedRoot) return cachedRoot;

  if (process.env.WORKSPACE_ROOT) {
    const root = path.resolve(process.env.WORKSPACE_ROOT);
    if (!existsSync(root)) {
      throw new Error(`WORKSPACE_ROOT no existe en disco: ${root}`);
    }
    cachedRoot = root;
    return root;
  }

  // Intento 1: git rev-parse desde cwd
  try {
    const root = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (root && existsSync(root)) {
      cachedRoot = root;
      return root;
    }
  } catch {
    // git no disponible o no estamos en un repo · seguir
  }

  // Intento 2: walk ancestros buscando pnpm-workspace.yaml
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (
      existsSync(path.join(dir, 'pnpm-workspace.yaml')) ||
      existsSync(path.join(dir, '.git'))
    ) {
      cachedRoot = dir;
      return dir;
    }
    dir = path.dirname(dir);
  }

  throw new Error(
    'No se pudo resolver WORKSPACE_ROOT · setea env var WORKSPACE_ROOT o ejecuta desde dentro de un git repo'
  );
}

/** Reset cache · útil para tests */
export function _resetWorkspaceCache(): void {
  cachedRoot = null;
}

/** Detecta qué brands tienen `{brand}/docs/product/` en disco · útil para sidebar selector */
export function getBrands(): string[] {
  const root = getWorkspaceRoot();
  return KNOWN_BRAND_SLUGS.filter((slug) => {
    const productDir = path.join(root, slug, 'docs', 'product');
    return existsSync(productDir) && statSync(productDir).isDirectory();
  });
}

/** Path al directorio `{brand}/docs/product/`. Valida brand existe. */
export function brandPath(brand: string): string {
  if (!KNOWN_BRAND_SLUGS.includes(brand)) {
    throw new Error(`brand desconocida: ${brand} · válidas: ${KNOWN_BRAND_SLUGS.join(', ')}`);
  }
  const root = getWorkspaceRoot();
  const p = path.join(root, brand, 'docs', 'product');
  if (!existsSync(p)) {
    throw new Error(`Brand ${brand} no bootstrapeada · falta ${p}`);
  }
  return p;
}

/** Path al directorio archive de stories done del año dado */
export function archivePath(brand: string, year: number | string): string {
  const root = getWorkspaceRoot();
  return path.join(root, brand, 'docs', 'archive', String(year), 'stories');
}

/**
 * Path al root del archive del brand (`{brand}/docs/archive`), bajo el cual viven
 * los subdirectorios por año (`2026/stories/...`). Usar para iterar todos los años
 * de stories done — NO derivar via `path.dirname(archivePath(...))` (deja un nivel
 * de más: `archive/{year}` en vez de `archive`).
 */
export function archiveRootPath(brand: string): string {
  const root = getWorkspaceRoot();
  return path.join(root, brand, 'docs', 'archive');
}

/** Path al directorio de capabilities del brand */
export function capabilitiesPath(brand: string): string {
  return path.join(brandPath(brand), 'capabilities');
}

/** Path al directorio de releases del brand */
export function releasesPath(brand: string): string {
  return path.join(brandPath(brand), 'releases');
}

/** Path al directorio de stories activas del brand */
export function storiesPath(brand: string): string {
  return path.join(brandPath(brand), 'stories');
}

/** Path al directorio de learnings del brand */
export function learningsPath(brand: string): string {
  const root = getWorkspaceRoot();
  return path.join(root, brand, 'docs', 'learnings');
}
