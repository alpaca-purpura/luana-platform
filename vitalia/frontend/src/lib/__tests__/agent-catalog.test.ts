/**
 * Agent catalog unit tests — T-1 RED phase (TDD mandatory per tdd-mandatory.md)
 *
 * SC-1 gherkin coverage: AGENT_CATALOG 6 agentes + DEFAULT_CHAT_AGENT + shape invariants + AGENT_SLUGS
 * spec_anchor: 01-spec.md § 5.1 + 03-arch.md § 2.4
 *
 * LIFT CANDIDATE: shell-chat agent catalog cross-brand cuando ≥2 brands lo necesiten.
 * Hoy brand-local Vitalia per anti-duplication.md.
 */

import { describe, it, expect } from "vitest";
import type { AgentSlug, AgentDescriptor } from "../agent-catalog";
import {
  AGENT_CATALOG,
  DEFAULT_CHAT_AGENT,
  AGENT_SLUGS,
} from "../agent-catalog";

const EXPECTED_SLUGS: AgentSlug[] = [
  "lisa",
  "valeria",
  "adrian",
  "lucas",
  "camila",
  "mateo",
];

const AGENT_DESCRIPTOR_KEYS: (keyof AgentDescriptor)[] = [
  "slug",
  "name",
  "role",
  "colorToken",
  "colorSoftToken",
  "hex",
  "thumbnail",
  "transparent",
  "initial",
];

describe("AGENT_CATALOG — 6 agentes canónicos Vitalia", () => {
  it("AGENT_CATALOG contains 6 agentes (lisa, valeria, adrian, lucas, camila, mateo)", () => {
    expect(Object.keys(AGENT_CATALOG)).toHaveLength(6);
    for (const slug of EXPECTED_SLUGS) {
      expect(Object.keys(AGENT_CATALOG)).toContain(slug);
    }
  });

  it("DEFAULT_CHAT_AGENT equals 'valeria'", () => {
    expect(DEFAULT_CHAT_AGENT).toBe("valeria");
  });

  it("each agent shape complete (all 9 keys present on AgentDescriptor)", () => {
    for (const slug of EXPECTED_SLUGS) {
      const descriptor = AGENT_CATALOG[slug];
      for (const key of AGENT_DESCRIPTOR_KEYS) {
        expect(descriptor, `${slug} missing key ${key}`).toHaveProperty(key);
        expect(
          descriptor[key],
          `${slug}.${key} should not be empty`,
        ).toBeTruthy();
      }
    }
  });

  it("AGENT_SLUGS array has 6 entries matching catalog keys", () => {
    expect(AGENT_SLUGS).toHaveLength(6);
    for (const slug of EXPECTED_SLUGS) {
      expect(AGENT_SLUGS).toContain(slug);
    }
    // Verify AGENT_SLUGS is derived from catalog keys
    expect([...AGENT_SLUGS].sort()).toEqual([...EXPECTED_SLUGS].sort());
  });

  it("valeria.hex equals '#7b2d91' (metadata only — not consumed by Tailwind)", () => {
    expect(AGENT_CATALOG.valeria.hex).toBe("#7b2d91");
  });

  it("thumbnail paths match /agents/{slug}/thumbnail.png pattern", () => {
    for (const slug of EXPECTED_SLUGS) {
      const { thumbnail } = AGENT_CATALOG[slug];
      expect(thumbnail).toMatch(/^\/agents\/[a-z]+\/thumbnail\.png$/);
      expect(thumbnail).toBe(`/agents/${slug}/thumbnail.png`);
    }
  });

  it("adrian.transparent ends with .jpeg (source originals — verbatim spec § 5.2)", () => {
    expect(AGENT_CATALOG.adrian.transparent).toMatch(/\.jpeg$/);
  });

  it("all other agents transparent ends with .png", () => {
    for (const slug of EXPECTED_SLUGS) {
      if (slug === "adrian") continue;
      expect(AGENT_CATALOG[slug].transparent).toMatch(/\.png$/);
    }
  });

  it("each agent slug field matches the catalog key", () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(AGENT_CATALOG[slug].slug).toBe(slug);
    }
  });

  it("colorToken format is 'agent-{slug}' (no -- prefix, no hsl())", () => {
    for (const slug of EXPECTED_SLUGS) {
      const { colorToken } = AGENT_CATALOG[slug];
      expect(colorToken).toMatch(/^agent-[a-z]+$/);
      expect(colorToken).toBe(`agent-${slug}`);
    }
  });

  it("colorSoftToken format is 'agent-{slug}-soft'", () => {
    for (const slug of EXPECTED_SLUGS) {
      const { colorSoftToken } = AGENT_CATALOG[slug];
      expect(colorSoftToken).toBe(`agent-${slug}-soft`);
    }
  });

  it("initial is a single uppercase letter", () => {
    for (const slug of EXPECTED_SLUGS) {
      const { initial } = AGENT_CATALOG[slug];
      expect(initial).toHaveLength(1);
      expect(initial).toMatch(/^[A-Z]$/);
    }
  });
});
