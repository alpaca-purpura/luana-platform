/**
 * Chokidar watcher — emite eventos cuando algún archivo del SSoT cambia.
 *
 * El cockpit usa esto para hot-reload de la UI cuando un skill escribe
 * un checkpoint, cap YAML, chris-input.md o release.yaml. Sin esto Chris
 * tendría que refrescar manualmente cada vez que invoca /pm-vitalia.
 *
 * Debounce 200ms para evitar storms (cuando skill escribe múltiples archivos
 * en secuencia, agrupamos en un solo evento "cambió algo").
 */

import { EventEmitter } from 'node:events';
import path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';

export type WatcherAction = 'change' | 'add' | 'unlink';

export interface WatcherEvent {
  path: string;
  action: WatcherAction;
  /** Brand al que corresponde el path (extraído del path absoluto) */
  brand?: string;
  /** Tipo de doc detectado: checkpoint | chris-input | capability | release | learning | other */
  docType?: 'checkpoint' | 'chris-input' | 'capability' | 'release' | 'learning' | 'other';
}

const IGNORED_PATTERNS = [
  /(^|[/\\])\.git([/\\]|$)/,
  /node_modules/,
  /\.next/,
  /__pycache__/,
  /\.venv/,
  /dist/,
  /build/,
  /\.tmp$/,
];

const DEBOUNCE_MS = 200;

export interface WatcherOptions {
  /** Workspace root absoluto · paths a observar derivan de aquí */
  workspaceRoot: string;
  /** Brands a observar (subdirs del workspace) */
  brands: string[];
  /** Debounce timeout · default 200ms */
  debounceMs?: number;
}

/**
 * Setup watcher sobre `{brand}/docs/product/**\/*.md` y `*.yaml` para cada
 * brand listada. Devuelve un EventEmitter que emite `WatcherEvent`.
 *
 * Uso:
 * ```ts
 * const emitter = setupWatcher({ workspaceRoot, brands: ['vitalia', 'nicolify'] });
 * emitter.on('event', (e: WatcherEvent) => { ... });
 * emitter.on('ready', () => console.log('watcher ready'));
 * // cleanup
 * emitter.emit('close');
 * ```
 */
export function setupWatcher(options: WatcherOptions): EventEmitter & { close: () => Promise<void> } {
  const { workspaceRoot, brands, debounceMs = DEBOUNCE_MS } = options;
  const emitter = new EventEmitter() as EventEmitter & { close: () => Promise<void> };

  // Paths a observar
  const watchPaths = brands.flatMap((brand) => [
    path.join(workspaceRoot, brand, 'docs', 'product'),
    path.join(workspaceRoot, brand, 'docs', 'archive'),
    path.join(workspaceRoot, brand, 'docs', 'learnings'),
  ]);

  const watcher: FSWatcher = chokidar.watch(watchPaths, {
    ignored: (p: string) => IGNORED_PATTERNS.some((re) => re.test(p)),
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  // Debounce pendientes por path
  const pendingTimers = new Map<string, NodeJS.Timeout>();

  function schedule(absPath: string, action: WatcherAction): void {
    const existing = pendingTimers.get(absPath);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      pendingTimers.delete(absPath);
      const event: WatcherEvent = {
        path: absPath,
        action,
        brand: inferBrand(absPath, workspaceRoot, brands),
        docType: inferDocType(absPath),
      };
      emitter.emit('event', event);
    }, debounceMs);
    pendingTimers.set(absPath, t);
  }

  watcher.on('change', (p) => schedule(p, 'change'));
  watcher.on('add', (p) => schedule(p, 'add'));
  watcher.on('unlink', (p) => schedule(p, 'unlink'));
  watcher.on('ready', () => emitter.emit('ready'));
  watcher.on('error', (err) => emitter.emit('error', err));

  emitter.close = async () => {
    for (const t of pendingTimers.values()) clearTimeout(t);
    pendingTimers.clear();
    await watcher.close();
  };

  return emitter;
}

function inferBrand(absPath: string, workspaceRoot: string, brands: string[]): string | undefined {
  const rel = path.relative(workspaceRoot, absPath);
  const firstSegment = rel.split(path.sep)[0];
  return brands.includes(firstSegment) ? firstSegment : undefined;
}

function inferDocType(absPath: string): WatcherEvent['docType'] {
  const name = path.basename(absPath);
  if (name === 'checkpoint.md') return 'checkpoint';
  if (name === 'chris-input.md') return 'chris-input';
  if (absPath.includes(`${path.sep}capabilities${path.sep}`) && name.endsWith('.yaml')) {
    return 'capability';
  }
  if (absPath.includes(`${path.sep}releases${path.sep}`) && name.endsWith('.yaml')) {
    return 'release';
  }
  if (absPath.includes(`${path.sep}learnings${path.sep}`) && name.endsWith('.md')) {
    return 'learning';
  }
  return 'other';
}
