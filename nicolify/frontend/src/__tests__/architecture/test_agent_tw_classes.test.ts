// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-1
/**
 * Architecture fitness test: _agent-tw-classes G3 gate
 *
 * Enforces:
 * 1. _agent-tw-classes.ts exists at expected path (not orphaned)
 * 2. No template literal pattern `${slug}` in class returns (G3 JIT-safe)
 * 3. All nicolify agent slugs are covered (abel/brenda/christian/sara/norvil/config)
 *
 * ADR-nicolify-001 G3 compliance gate.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const AGENT_TW_PATH = resolve(
  __dirname,
  "../../components/shared/shell-organism/_agent-tw-classes.ts",
);

describe("Architecture: _agent-tw-classes G3 JIT-safe enforcement", () => {
  it("file exists at expected path (not orphaned)", () => {
    let content = "";
    expect(() => {
      content = readFileSync(AGENT_TW_PATH, "utf-8");
    }).not.toThrow();
    expect(content.length).toBeGreaterThan(0);
  });

  it("contains no template literal class construction (G3 gate — Tailwind JIT-safe)", () => {
    const content = readFileSync(AGENT_TW_PATH, "utf-8");
    // Strip comments first (line + block) then check for template literal patterns
    const strippedContent = content
      .replace(/\/\/[^\n]*/g, "") // remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, ""); // remove block comments
    // Pattern that would break JIT in actual code: `bg-agent-${...}` or similar
    const templateLiteralPattern = /`(bg|text|border)-agent-\$\{[^}]+\}`/;
    expect(strippedContent).not.toMatch(templateLiteralPattern);
  });

  it("covers all nicolify ribbon agent slugs: abel, brenda, christian, sara, norvil, config", () => {
    const content = readFileSync(AGENT_TW_PATH, "utf-8");
    const requiredSlugs = ["abel", "brenda", "christian", "sara", "norvil", "config"];
    for (const slug of requiredSlugs) {
      expect(content).toContain(`"${slug}"`);
    }
  });

  it("covers luana (orchestrator) slug for sidebar/chat context", () => {
    const content = readFileSync(AGENT_TW_PATH, "utf-8");
    expect(content).toContain('"luana"');
  });

  it("uses switch/case or Record/map literal pattern (static lookups only)", () => {
    const content = readFileSync(AGENT_TW_PATH, "utf-8");
    const hasSwitchOrRecord =
      content.includes("switch (slug)") || content.includes("Record<") || content.includes(": {");
    expect(hasSwitchOrRecord).toBe(true);
  });
});
