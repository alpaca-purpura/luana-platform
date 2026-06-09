/**
 * project-config.ts — the cockpit's reader of the harness DIP seam `project.config.yaml`
 * (W5b · 2026-06-09 · consumer class C). SAME single store the python loader
 * (`scripts/harness_config.py`) reads; this is the SECOND parser (the `yaml` pkg, already
 * a cockpit dep) but ONE store — the cross-runtime fixture test
 * (`__tests__/project-config.test.ts`) guards parity so a yaml edit that breaks one runtime
 * fails CI (RESEARCH-loader-mechanism.md Q3 cross-class note).
 *
 * SERVER-ONLY: uses `getWorkspaceRoot()` (node:fs + git). NEVER import from a `'use client'`
 * module. The client-imported roster/zone const modules (`agent-meta.ts`, `map-zones.ts`)
 * adopt the seam via a server-boundary / codegen follow-up (W5b flag) — not by fs-reading
 * in a client bundle.
 *
 * Doctrina: docs/process/harness-refactor-charter-2026-06-08.md §3 (the seam) · §7 (cockpit
 * renders the CORE read-schema).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { getWorkspaceRoot } from './workspace.js';

export const FILL_SENTINEL = '__FILL_ME__';

export interface BrandPorts {
  backend: number;
  frontend: number;
  cockpit: number;
}

export interface BrandEntry {
  slug: string;
  vertical: string;
  status: 'active' | 'shipped' | 'placeholder' | 'pending-bootstrap' | 'blocked';
  ports?: BrandPorts;
  dev_app_url?: string;
  compliance?: string;
}

export interface AgentMeta {
  slug: string;
  name: string;
  emoji: string;
  color: string;
  role?: string;
  subtitle?: string;
}

export interface ValueStreamStage {
  id: string;
  name: string;
  order: number;
  description: string;
  boxIds: string[];
}

export interface ProjectConfig {
  meta: { product: string; config_version: number; description?: string };
  brands: {
    cockpit_main_port: number;
    loop_order: string[];
    active: BrandEntry[];
    pending_bootstrap: { slug: string; vertical: string }[];
  };
  engine_prefix: {
    python_glob: string;
    python_module_prefix: string;
    ts_scope: string;
    python_package_count: number;
    [k: string]: unknown;
  };
  // per-brand slots may be __FILL_ME__ (string) until a brand's roster/stream exists
  agent_roster: Record<string, AgentMeta[] | string>;
  value_stream: Record<string, ValueStreamStage[] | string[] | string>;
  [slot: string]: unknown;
}

let cache: ProjectConfig | null = null;

/** Read + parse + cache the single seam store. Module-level cache (long-lived dev process). */
export function getProjectConfig(refresh = false): ProjectConfig {
  if (cache && !refresh) return cache;
  const raw = readFileSync(path.join(getWorkspaceRoot(), 'project.config.yaml'), 'utf-8');
  cache = YAML.parse(raw) as ProjectConfig;
  return cache;
}

export function isUnfilled(value: unknown): boolean {
  return value === FILL_SENTINEL;
}

/** A brand's agent roster, or null when the slot is unfilled (`__FILL_ME__`). */
export function getAgentRoster(brand: string): AgentMeta[] | null {
  const r = getProjectConfig().agent_roster[brand];
  return Array.isArray(r) ? (r as AgentMeta[]) : null;
}

/** A brand's value-stream stages, or null when unfilled / only canonical names. */
export function getValueStream(brand: string): ValueStreamStage[] | null {
  const v = getProjectConfig().value_stream[brand];
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
    return v as ValueStreamStage[];
  }
  return null;
}

export function getActiveBrandSlugs(): string[] {
  return getProjectConfig().brands.active.map((b) => b.slug);
}

/** Reset cache · for tests. */
export function _resetProjectConfigCache(): void {
  cache = null;
}
