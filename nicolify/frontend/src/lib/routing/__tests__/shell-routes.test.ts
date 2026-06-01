// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-5
// voseo-allowed: test file validates labels have no voseo — regex tests contain voseo patterns as detection targets
/**
 * shell-routes.test.ts — Unit tests for shell-routes.ts SSoT
 *
 * TDD: Written RED before implementation (per tdd-mandatory.md).
 * Covers: AGENT_CATALOG · AGENT_SUBTABS · DEFAULT_LANDING · guards · XSS/injection (A4)
 * Scenarios: E1-E5 + A4 (T-5 gherkin coverage per 06-tickets.yaml)
 *
 * spec_anchor: 04-validators.yaml T-5 · 01-spec.md § Routing SSoT
 */
import { describe, it, expect } from "vitest";

import {
  AGENT_CATALOG,
  AGENT_RIBBON_ORDER,
  AGENT_SUBTABS,
  DEFAULT_LANDING,
  isValidAgent,
  isValidSubtab,
  getDefaultSubtab,
  extractAgentFromPath,
  extractSubtabFromPath,
  type RibbonTabSlug,
} from "../shell-routes";

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_CATALOG shape
// ─────────────────────────────────────────────────────────────────────────────

describe("AGENT_CATALOG", () => {
  it("contains exactly the 5 Revenue/Ops agents + config (6 entries)", () => {
    const slugs = Object.keys(AGENT_CATALOG);
    expect(slugs).toHaveLength(6);
    expect(slugs).toContain("abel");
    expect(slugs).toContain("brenda");
    expect(slugs).toContain("christian");
    expect(slugs).toContain("sara");
    expect(slugs).toContain("norvil");
    expect(slugs).toContain("config");
  });

  it("does NOT contain luana (orchestrator sidebar, not a ribbon tab)", () => {
    expect(Object.keys(AGENT_CATALOG)).not.toContain("luana");
  });

  it("each agent has name, defaultSubtab and tabLabel", () => {
    for (const [slug, descriptor] of Object.entries(AGENT_CATALOG)) {
      if (slug === "config") continue; // config is special
      expect(descriptor.name).toBeTruthy();
      expect(descriptor.tabLabel).toBeTruthy();
      expect(descriptor.defaultSubtab).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_RIBBON_ORDER
// ─────────────────────────────────────────────────────────────────────────────

describe("AGENT_RIBBON_ORDER", () => {
  it("contains exactly 5 agent slugs (luana and config excluded)", () => {
    expect(AGENT_RIBBON_ORDER).toHaveLength(5);
  });

  it("order is [abel, brenda, christian, sara, norvil] (ratificado navigation-tree.md)", () => {
    expect(AGENT_RIBBON_ORDER[0]).toBe("abel");
    expect(AGENT_RIBBON_ORDER[1]).toBe("brenda");
    expect(AGENT_RIBBON_ORDER[2]).toBe("christian");
    expect(AGENT_RIBBON_ORDER[3]).toBe("sara");
    expect(AGENT_RIBBON_ORDER[4]).toBe("norvil");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_LANDING
// ─────────────────────────────────────────────────────────────────────────────

describe("DEFAULT_LANDING", () => {
  it("is christian/pipeline (ratificado en CONTEXT-BRIEF + 01-spec.md)", () => {
    expect(DEFAULT_LANDING.agent).toBe("christian");
    expect(DEFAULT_LANDING.subtab).toBe("pipeline");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_SUBTABS — per agent
// ─────────────────────────────────────────────────────────────────────────────

describe("AGENT_SUBTABS", () => {
  it("abel has [oferta, angulos, escalera-valor, marca] (4 subtabs)", () => {
    const ids = AGENT_SUBTABS.abel.map((t) => t.id);
    expect(ids).toEqual(["oferta", "angulos", "escalera-valor", "marca"]);
  });

  it("brenda has [campanas, contenido, presupuesto] (3 subtabs)", () => {
    const ids = AGENT_SUBTABS.brenda.map((t) => t.id);
    expect(ids).toEqual(["campanas", "contenido", "presupuesto"]);
  });

  it("christian has [prospectos, secuencias, pipeline, propuestas, licitaciones] (5 subtabs)", () => {
    const ids = AGENT_SUBTABS.christian.map((t) => t.id);
    expect(ids).toEqual(["prospectos", "secuencias", "pipeline", "propuestas", "licitaciones"]);
  });

  it("sara has ONLY [proyectos] in R0 (navigation-tree.md constraint)", () => {
    const ids = AGENT_SUBTABS.sara.map((t) => t.id);
    expect(ids).toEqual(["proyectos"]);
  });

  it("norvil has [cuentas, salud-cuenta, renovaciones] (3 subtabs)", () => {
    const ids = AGENT_SUBTABS.norvil.map((t) => t.id);
    expect(ids).toEqual(["cuentas", "salud-cuenta", "renovaciones"]);
  });

  it("config has [conexiones, preferencias, tokens, agentes] (4 subtabs)", () => {
    const ids = AGENT_SUBTABS.config.map((t) => t.id);
    expect(ids).toEqual(["conexiones", "preferencias", "tokens", "agentes"]);
  });

  it("each subtab has id, label (Spanish neutro) and icon", () => {
    for (const subtabs of Object.values(AGENT_SUBTABS)) {
      for (const subtab of subtabs) {
        expect(subtab.id).toBeTruthy();
        expect(subtab.label).toBeTruthy();
        expect(subtab.icon).toBeTruthy();
        // Labels should not contain voseo (basic check)
        expect(subtab.label).not.toMatch(/\b(mirá|podés|tenés|querés)\b/i);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidAgent — whitelist guard (A4: XSS/path-injection)
// ─────────────────────────────────────────────────────────────────────────────

describe("isValidAgent (XSS/path-injection whitelist guard)", () => {
  it("returns true for valid ribbon agent slugs", () => {
    const validSlugs: RibbonTabSlug[] = ["abel", "brenda", "christian", "sara", "norvil", "config"];
    for (const slug of validSlugs) {
      expect(isValidAgent(slug)).toBe(true);
    }
  });

  it("returns false for luana (not a ribbon tab, orchestrator only)", () => {
    expect(isValidAgent("luana")).toBe(false);
  });

  it("returns false for unknown slugs (A4: XSS guard)", () => {
    expect(isValidAgent("unknown")).toBe(false);
    expect(isValidAgent("")).toBe(false);
    expect(isValidAgent(null as unknown as string)).toBe(false);
    expect(isValidAgent(undefined as unknown as string)).toBe(false);
  });

  it("returns false for XSS injection attempts (A4 guard)", () => {
    expect(isValidAgent("<script>alert(1)</script>")).toBe(false);
    expect(isValidAgent("../../etc/passwd")).toBe(false);
    expect(isValidAgent("admin; DROP TABLE")).toBe(false);
    expect(isValidAgent("javascript:void(0)")).toBe(false);
    expect(isValidAgent("__proto__")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidSubtab — whitelist guard per agent
// ─────────────────────────────────────────────────────────────────────────────

describe("isValidSubtab", () => {
  it("validates valid subtab for its agent", () => {
    expect(isValidSubtab("abel", "oferta")).toBe(true);
    expect(isValidSubtab("christian", "pipeline")).toBe(true);
    expect(isValidSubtab("sara", "proyectos")).toBe(true);
    expect(isValidSubtab("config", "conexiones")).toBe(true);
  });

  it("returns false for subtab that does not belong to agent", () => {
    expect(isValidSubtab("abel", "pipeline")).toBe(false);
    expect(isValidSubtab("sara", "campanas")).toBe(false);
  });

  it("returns false for invalid agent slug", () => {
    expect(isValidSubtab("unknown", "anything")).toBe(false);
  });

  it("returns false for XSS injection attempts (A4 guard)", () => {
    expect(isValidSubtab("abel", "<script>")).toBe(false);
    expect(isValidSubtab("abel", "../../etc")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDefaultSubtab
// ─────────────────────────────────────────────────────────────────────────────

describe("getDefaultSubtab", () => {
  it("returns the first subtab id for each agent", () => {
    expect(getDefaultSubtab("abel")).toBe("oferta");
    expect(getDefaultSubtab("brenda")).toBe("campanas");
    expect(getDefaultSubtab("christian")).toBe("prospectos");
    expect(getDefaultSubtab("sara")).toBe("proyectos");
    expect(getDefaultSubtab("norvil")).toBe("cuentas");
    expect(getDefaultSubtab("config")).toBe("conexiones");
  });

  it("returns null for invalid agent slug", () => {
    expect(getDefaultSubtab("unknown")).toBeNull();
    expect(getDefaultSubtab("luana")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractAgentFromPath
// ─────────────────────────────────────────────────────────────────────────────

describe("extractAgentFromPath", () => {
  it("extracts valid agent from path", () => {
    expect(extractAgentFromPath("/tenant-x/abel/oferta")).toBe("abel");
    expect(extractAgentFromPath("/tenant-x/christian/pipeline")).toBe("christian");
    expect(extractAgentFromPath("/tenant-x/config/conexiones")).toBe("config");
  });

  it("returns null for paths without valid agent segment", () => {
    expect(extractAgentFromPath("/tenant-x")).toBeNull();
    expect(extractAgentFromPath("/")).toBeNull();
    expect(extractAgentFromPath(null)).toBeNull();
    expect(extractAgentFromPath(undefined)).toBeNull();
  });

  it("returns null for invalid agent (XSS/injection guard)", () => {
    expect(extractAgentFromPath("/tenant-x/<script>alert(1)</script>/oferta")).toBeNull();
    expect(extractAgentFromPath("/tenant-x/../../etc/passwd")).toBeNull();
    expect(extractAgentFromPath("/tenant-x/luana/chat")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractSubtabFromPath
// ─────────────────────────────────────────────────────────────────────────────

describe("extractSubtabFromPath", () => {
  it("extracts subtab segment from path", () => {
    expect(extractSubtabFromPath("/tenant-x/abel/oferta")).toBe("oferta");
    expect(extractSubtabFromPath("/tenant-x/christian/pipeline")).toBe("pipeline");
    expect(extractSubtabFromPath("/tenant-x/sara/proyectos")).toBe("proyectos");
  });

  it("returns null for paths without subtab segment", () => {
    expect(extractSubtabFromPath("/tenant-x/abel")).toBeNull();
    expect(extractSubtabFromPath("/tenant-x")).toBeNull();
    expect(extractSubtabFromPath(null)).toBeNull();
  });
});
