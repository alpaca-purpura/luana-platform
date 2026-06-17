// cap: comunify-shell-organism
/**
 * agents.test.ts — Unit tests for lib/agents.ts catalog.
 *
 * TDD RED → GREEN (written before implementation per tdd-mandatory.md).
 * Verifies: catalog completeness, required fields, no HEX literals in output,
 * AgentSlug type alignment, AGENT_SLUGS array integrity.
 */

import { describe, it, expect } from "vitest";

import {
  AGENT_CATALOG,
  AGENT_SLUGS,
  DEFAULT_CHAT_AGENT,
  type AgentSlug,
} from "../agents";

const EXPECTED_SLUGS: AgentSlug[] = [
  "luana",
  "nina",
  "tomas",
  "sofia",
  "bruno",
  "lucia",
];

describe("AGENT_CATALOG", () => {
  it("contains all 6 expected slugs", () => {
    const keys = Object.keys(AGENT_CATALOG) as AgentSlug[];
    expect(keys.sort()).toEqual(EXPECTED_SLUGS.sort());
  });

  it.each(EXPECTED_SLUGS)("agent %s has all required fields", (slug) => {
    const agent = AGENT_CATALOG[slug];
    expect(agent).toBeDefined();
    expect(agent.slug).toBe(slug);
    expect(agent.name).toBeTruthy();
    expect(agent.role).toBeTruthy();
    expect(agent.colorToken).toMatch(/^agent-/);
    expect(agent.colorSoftToken).toMatch(/^agent-.*-soft$/);
    expect(agent.thumbnail).toMatch(/^\/agents\//);
    expect(agent.initial).toHaveLength(1);
    expect(agent.tabLabel).toBeTruthy();
  });

  it("has no hex field on any agent (arch-test compliance — G3 gate)", () => {
    for (const slug of EXPECTED_SLUGS) {
      const agent = AGENT_CATALOG[slug];
      // hex field must not exist (removed to pass test-no-stock-palette arch test)
      expect(Object.prototype.hasOwnProperty.call(agent, "hex")).toBe(false);
    }
  });

  it("luana has empty defaultSubtab (sidebar-only, not ribbon)", () => {
    expect(AGENT_CATALOG.luana.defaultSubtab).toBe("");
  });

  it("ribbon agents have non-empty defaultSubtab", () => {
    const ribbonSlugs: AgentSlug[] = ["nina", "tomas", "sofia", "bruno", "lucia"];
    for (const slug of ribbonSlugs) {
      expect(AGENT_CATALOG[slug].defaultSubtab).toBeTruthy();
    }
  });

  it("nina defaultSubtab is 'marca'", () => {
    expect(AGENT_CATALOG.nina.defaultSubtab).toBe("marca");
  });

  it("colorToken matches slug pattern", () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(AGENT_CATALOG[slug].colorToken).toBe(`agent-${slug}`);
      expect(AGENT_CATALOG[slug].colorSoftToken).toBe(`agent-${slug}-soft`);
    }
  });
});

describe("AGENT_SLUGS", () => {
  it("contains all 6 slugs", () => {
    expect(AGENT_SLUGS).toHaveLength(6);
    expect(AGENT_SLUGS.sort()).toEqual(EXPECTED_SLUGS.sort());
  });
});

describe("DEFAULT_CHAT_AGENT", () => {
  it("is 'luana' (sidebar orchestrator)", () => {
    expect(DEFAULT_CHAT_AGENT).toBe("luana");
  });
});
