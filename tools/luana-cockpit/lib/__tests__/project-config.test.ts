/**
 * project-config.ts tests — the cross-runtime fixture guard (W5b).
 *
 * Asserts the cockpit (TS / `yaml` pkg) parses the SAME `project.config.yaml` the python
 * loader (`scripts/harness_config.py`) reads, with the same shape + values. This is the
 * single-store parity guard (RESEARCH-loader-mechanism.md Q3): a yaml edit that breaks one
 * runtime's expected shape fails here. Mirrors the python assertions in
 * `scripts/tests/test_harness_config.py`.
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  _resetProjectConfigCache,
  getActiveBrandSlugs,
  getAgentRoster,
  getProjectConfig,
  getValueStream,
} from '../project-config.js';

afterEach(() => {
  _resetProjectConfigCache();
});

describe('project-config (seam class C)', () => {
  it('parses the same store: product + engine count (parity with python test)', () => {
    const cfg = getProjectConfig();
    expect(cfg.meta.product).toBe('luana-platform');
    // parity assertion with scripts/tests/test_harness_config.py::test_get_scalar
    expect(cfg.engine_prefix.python_package_count).toBe(27);
    expect(cfg.engine_prefix.python_glob).toBe('core/luana-core-*');
  });

  it('active brand slugs include the 4 active brands', () => {
    const slugs = getActiveBrandSlugs();
    for (const s of ['nicolify', 'vitalia', 'comunify', 'lupulo']) {
      expect(slugs).toContain(s);
    }
  });

  it('brands.loop_order starts with vitalia (cross-brand canonical order)', () => {
    expect(getProjectConfig().brands.loop_order[0]).toBe('vitalia');
  });

  it('vitalia agent roster carries hex colors (lisa = emerald)', () => {
    const roster = getAgentRoster('vitalia');
    expect(roster).not.toBeNull();
    const lisa = roster!.find((a) => a.slug === 'lisa');
    expect(lisa?.color).toBe('#10b981');
  });

  it('unfilled rosters resolve to null (comunify/lupulo pending)', () => {
    expect(getAgentRoster('comunify')).toBeNull();
    expect(getAgentRoster('lupulo')).toBeNull();
  });

  it('vitalia value-stream stages parse (atraer first)', () => {
    const vs = getValueStream('vitalia');
    expect(vs).not.toBeNull();
    expect(vs![0].id).toBe('atraer');
    expect(getValueStream('nicolify')).toBeNull(); // __FILL_ME__
  });
});
