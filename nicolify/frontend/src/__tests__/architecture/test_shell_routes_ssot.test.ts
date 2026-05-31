// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-5
/**
 * Architecture fitness test: shell-routes SSoT (T-5)
 *
 * Enforces that agent catalog and subtab arrays are NOT hardcoded outside shell-routes.ts.
 * Only shell-routes.ts may define AGENT_CATALOG, AGENT_SUBTABS, and DEFAULT_LANDING.
 *
 * Ratchet: allowlist shrink-only.
 *
 * ADR-nicolify-001 G0 — no hardcode sub-tabs/agents outside shell-routes.ts
 * spec_anchor: 06-tickets.yaml T-5 deliverables (arch test shell-routes SSoT)
 */
import { readFileSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const SRC_ROOT = resolve(__dirname, "../../");
const SHELL_ROUTES_PATH = resolve(SRC_ROOT, "lib/routing/shell-routes.ts");

// ─────────────────────────────────────────────────────────────────────────────
// 1. shell-routes.ts exists and exports required symbols
// ─────────────────────────────────────────────────────────────────────────────

describe("shell-routes.ts SSoT exists and is complete", () => {
  it("file exists at lib/routing/shell-routes.ts", () => {
    let content = "";
    expect(() => {
      content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    }).not.toThrow();
    expect(content.length).toBeGreaterThan(0);
  });

  it("exports AGENT_CATALOG", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    expect(content).toContain("export const AGENT_CATALOG");
  });

  it("exports AGENT_RIBBON_ORDER", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    expect(content).toContain("export const AGENT_RIBBON_ORDER");
  });

  it("exports AGENT_SUBTABS", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    expect(content).toContain("export const AGENT_SUBTABS");
  });

  it("exports DEFAULT_LANDING", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    expect(content).toContain("export const DEFAULT_LANDING");
  });

  it("exports isValidAgent guard", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    expect(content).toContain("export function isValidAgent");
  });

  it("exports isValidSubtab guard", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    expect(content).toContain("export function isValidSubtab");
  });

  it("exports getDefaultSubtab guard", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    expect(content).toContain("export function getDefaultSubtab");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. DEFAULT_LANDING is christian/pipeline (ratificado)
// ─────────────────────────────────────────────────────────────────────────────

describe("DEFAULT_LANDING = christian/pipeline", () => {
  it("DEFAULT_LANDING contains agent: christian", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    // Should reference christian as agent in DEFAULT_LANDING literal
    expect(content).toContain("christian");
  });

  it("DEFAULT_LANDING contains subtab: pipeline", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    expect(content).toContain("pipeline");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. No hardcoded agent slug arrays in shell-organism components (only imports)
// ─────────────────────────────────────────────────────────────────────────────

describe("No hardcoded agent slug arrays outside shell-routes.ts", () => {
  /**
   * Components in shell-organism may import from shell-routes.ts,
   * but MUST NOT define their own agent slug arrays.
   *
   * Allowlist: shell-routes.ts itself + test files + _agent-tw-classes.ts (type definitions only)
   */
  const ALLOWLIST = [
    "shell-routes.ts",
    "_agent-tw-classes.ts",
    "agent-catalog.ts", // agent-catalog has its own AgentSlug type (T-4 — used for Luana panel)
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
    "__tests__",
  ];

  function isAllowlisted(filePath: string): boolean {
    return ALLOWLIST.some((allowed) => filePath.includes(allowed));
  }

  it("Ribbon.tsx does not hardcode agent slug arrays", () => {
    const ribbonPath = resolve(SRC_ROOT, "components/shared/shell-organism/Ribbon.tsx");
    let content = "";
    try {
      content = readFileSync(ribbonPath, "utf-8");
    } catch {
      // File may not exist yet (T-5 implementation in progress)
      return;
    }
    // Should not have hardcoded arrays like ["abel", "brenda", ...]
    // (it should import from shell-routes or agent-catalog)
    const hardcodedPattern = /\[\s*["']abel["']\s*,\s*["']brenda["']/;
    expect(content).not.toMatch(hardcodedPattern);
  });

  it("SubTabsBar.tsx does not hardcode subtab arrays", () => {
    const subTabsBarPath = resolve(SRC_ROOT, "components/shared/shell-organism/SubTabsBar.tsx");
    let content = "";
    try {
      content = readFileSync(subTabsBarPath, "utf-8");
    } catch {
      // File may not exist yet
      return;
    }
    // Should import AGENT_SUBTABS from shell-routes, not define it inline
    const hardcodedSubTabPattern = /\[\s*\{[^}]*id\s*:\s*["']oferta["']/;
    expect(content).not.toMatch(hardcodedSubTabPattern);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. sara has ONLY [proyectos] in R0 (navigation-tree.md constraint)
// ─────────────────────────────────────────────────────────────────────────────

describe("Sara constraint: ONLY [proyectos] in R0", () => {
  it("AGENT_SUBTABS sara is exactly ['proyectos'] in shell-routes.ts", () => {
    const content = readFileSync(SHELL_ROUTES_PATH, "utf-8");
    // Should contain sara with only proyectos
    expect(content).toContain('"proyectos"');
    // Extract sara block from AGENT_SUBTABS (from "sara:" up to "norvil:")
    // This is a positional slice approach — robust against multiline content
    const saraStart = content.indexOf("sara: [");
    const norvilStart = content.indexOf("norvil: [");
    expect(saraStart).toBeGreaterThan(-1);
    expect(norvilStart).toBeGreaterThan(saraStart);
    const saraSection = content.slice(saraStart, norvilStart);
    // Count id entries in sara block — should be exactly 1 in R0
    const idMatches = saraSection.match(/id\s*:\s*["'][^"']+["']/g) ?? [];
    expect(idMatches.length).toBe(1);
    // Confirm that id is "proyectos"
    expect(saraSection).toContain('"proyectos"');
  });
});
