// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-sitemap-completo T-1 (coverage_update from nicolify-r0-shell T-5)
// voseo-allowed: test file validates labels have no voseo — regex tests contain voseo patterns as detection targets
/**
 * shell-routes.test.ts — Unit tests for shell-routes.ts SSoT
 *
 * TDD: coverage_update per tdd-mandatory.md — updated to v3 tree (SYSTEM-MAP v2.0).
 * Covers: AGENT_CATALOG · AGENT_SUBTABS · AGENT_SUBSUBTABS · DEFAULT_LANDING · guards · XSS/injection (A4)
 * Scenarios: E1-E5 + A4 + AGENT_SUBSUBTABS (T-1 gherkin coverage per 06-tickets.yaml)
 *
 * spec_anchor: 06-tickets.yaml T-1 · 01-sitemap.md v3 · SYSTEM-MAP.yaml v2.0
 */
import { describe, it, expect } from "vitest";

import {
  AGENT_CATALOG,
  AGENT_RIBBON_ORDER,
  AGENT_SUBTABS,
  AGENT_SUBSUBTABS,
  DEFAULT_LANDING,
  isValidAgent,
  isValidSubtab,
  isValidSubSubTab,
  getDefaultSubtab,
  getSubSubTabs,
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

  it("defaultSubtab per agent matches v3 tree (SYSTEM-MAP v2.0)", () => {
    expect(AGENT_CATALOG.abel.defaultSubtab).toBe("icp");
    expect(AGENT_CATALOG.brenda.defaultSubtab).toBe("contenido-presencia");
    expect(AGENT_CATALOG.christian.defaultSubtab).toBe("pipeline");
    expect(AGENT_CATALOG.sara.defaultSubtab).toBe("proximamente");
    expect(AGENT_CATALOG.norvil.defaultSubtab).toBe("cartera");
    expect(AGENT_CATALOG.config.defaultSubtab).toBe("conexiones");
  });

  it("sara tabLabel is 'Próximamente' (deferred ADR-nicolify-002 D-D v2)", () => {
    expect(AGENT_CATALOG.sara.tabLabel).toBe("Próximamente");
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
  it("is christian/pipeline (ratificado · SIN cambio sitemap-completo T-1)", () => {
    expect(DEFAULT_LANDING.agent).toBe("christian");
    expect(DEFAULT_LANDING.subtab).toBe("pipeline");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT_SUBTABS — per agent (v3 tree · SYSTEM-MAP v2.0)
// ─────────────────────────────────────────────────────────────────────────────

describe("AGENT_SUBTABS (v3 tree — SYSTEM-MAP v2.0)", () => {
  it("abel has [icp, oferta, marca] (3 subtabs)", () => {
    const ids = AGENT_SUBTABS.abel.map((t) => t.id);
    expect(ids).toEqual(["icp", "oferta", "marca"]);
  });

  it("brenda has [contenido-presencia, pauta, inteligencia-asesoria] (3 subtabs)", () => {
    const ids = AGENT_SUBTABS.brenda.map((t) => t.id);
    expect(ids).toEqual(["contenido-presencia", "pauta", "inteligencia-asesoria"]);
  });

  it("christian has [contactos, inbox, pipeline, equipo-comercial, agenda, propuestas] (6 subtabs)", () => {
    const ids = AGENT_SUBTABS.christian.map((t) => t.id);
    expect(ids).toEqual([
      "contactos",
      "inbox",
      "pipeline",
      "equipo-comercial",
      "agenda",
      "propuestas",
    ]);
  });

  it("sara has ONLY [proximamente] — deferred (ADR-nicolify-002 D-D)", () => {
    const ids = AGENT_SUBTABS.sara.map((t) => t.id);
    expect(ids).toEqual(["proximamente"]);
  });

  it("norvil has [cartera, renovaciones, fidelizacion] (3 subtabs)", () => {
    const ids = AGENT_SUBTABS.norvil.map((t) => t.id);
    expect(ids).toEqual(["cartera", "renovaciones", "fidelizacion"]);
  });

  it("config has [conexiones, preferencias, tokens, autonomia-agentes] (4 subtabs)", () => {
    const ids = AGENT_SUBTABS.config.map((t) => t.id);
    expect(ids).toEqual(["conexiones", "preferencias", "tokens", "autonomia-agentes"]);
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
// AGENT_SUBSUBTABS — 3 populated combos (N3 · sitemap-completo T-1)
// ─────────────────────────────────────────────────────────────────────────────

const ABEL_OFERTA_KEY = "abel.oferta";
const CHRISTIAN_PROPUESTAS_KEY = "christian.propuestas";
const NORVIL_FIDELIZACION_KEY = "norvil.fidelizacion";

describe("AGENT_SUBSUBTABS (N3 · 3 populated combos)", () => {
  it("abel.oferta has [catalogo-escalera, dossier-mineria] (2 leaves)", () => {
    const leaves = AGENT_SUBSUBTABS[ABEL_OFERTA_KEY];
    expect(leaves).toBeDefined();
    const ids = leaves?.map((l) => l.id) ?? [];
    expect(ids).toEqual(["catalogo-escalera", "dossier-mineria"]);
  });

  it("christian.propuestas has [propuestas, licitaciones] (2 leaves)", () => {
    const leaves = AGENT_SUBSUBTABS[CHRISTIAN_PROPUESTAS_KEY];
    expect(leaves).toBeDefined();
    const ids = leaves?.map((l) => l.id) ?? [];
    expect(ids).toEqual(["propuestas", "licitaciones"]);
  });

  it("norvil.fidelizacion has [momentos, champion-shield, value-proof-qbr, gifting] (4 leaves)", () => {
    const leaves = AGENT_SUBSUBTABS[NORVIL_FIDELIZACION_KEY];
    expect(leaves).toBeDefined();
    const ids = leaves?.map((l) => l.id) ?? [];
    expect(ids).toEqual(["momentos", "champion-shield", "value-proof-qbr", "gifting"]);
  });

  it("total leaves across 3 combos = 8", () => {
    const total =
      (AGENT_SUBSUBTABS[ABEL_OFERTA_KEY]?.length ?? 0) +
      (AGENT_SUBSUBTABS[CHRISTIAN_PROPUESTAS_KEY]?.length ?? 0) +
      (AGENT_SUBSUBTABS[NORVIL_FIDELIZACION_KEY]?.length ?? 0);
    expect(total).toBe(8);
  });

  it("getSubSubTabs returns leaves for populated combo", () => {
    const leaves = getSubSubTabs("abel", "oferta");
    expect(leaves).not.toBeNull();
    expect(leaves?.length).toBe(2);
  });

  it("getSubSubTabs returns null for combo without leaves", () => {
    expect(getSubSubTabs("abel", "icp")).toBeNull();
    expect(getSubSubTabs("brenda", "pauta")).toBeNull();
    expect(getSubSubTabs("christian", "inbox")).toBeNull();
    expect(getSubSubTabs("sara", "proximamente")).toBeNull();
    expect(getSubSubTabs("norvil", "cartera")).toBeNull();
    expect(getSubSubTabs("config", "conexiones")).toBeNull();
  });

  it("each leaf has id, label (Spanish neutro) and icon", () => {
    const allLeaves = [
      ...(AGENT_SUBSUBTABS["abel.oferta"] ?? []),
      ...(AGENT_SUBSUBTABS["christian.propuestas"] ?? []),
      ...(AGENT_SUBSUBTABS["norvil.fidelizacion"] ?? []),
    ];
    for (const leaf of allLeaves) {
      expect(leaf.id).toBeTruthy();
      expect(leaf.label).toBeTruthy();
      expect(leaf.icon).toBeTruthy();
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
// isValidSubtab — whitelist guard per agent (v3 slugs)
// ─────────────────────────────────────────────────────────────────────────────

describe("isValidSubtab (v3 slugs)", () => {
  it("validates valid subtab for its agent (v3)", () => {
    expect(isValidSubtab("abel", "icp")).toBe(true);
    expect(isValidSubtab("abel", "oferta")).toBe(true);
    expect(isValidSubtab("abel", "marca")).toBe(true);
    expect(isValidSubtab("brenda", "contenido-presencia")).toBe(true);
    expect(isValidSubtab("brenda", "pauta")).toBe(true);
    expect(isValidSubtab("christian", "pipeline")).toBe(true);
    expect(isValidSubtab("christian", "propuestas")).toBe(true);
    expect(isValidSubtab("sara", "proximamente")).toBe(true);
    expect(isValidSubtab("norvil", "cartera")).toBe(true);
    expect(isValidSubtab("norvil", "fidelizacion")).toBe(true);
    expect(isValidSubtab("config", "conexiones")).toBe(true);
    expect(isValidSubtab("config", "autonomia-agentes")).toBe(true);
  });

  it("returns false for legacy subtab slugs (v1/v2 tree, removed in v3)", () => {
    // Old abel subtabs
    expect(isValidSubtab("abel", "angulos")).toBe(false);
    expect(isValidSubtab("abel", "escalera-valor")).toBe(false);
    // Old brenda subtabs
    expect(isValidSubtab("brenda", "campanas")).toBe(false);
    expect(isValidSubtab("brenda", "contenido")).toBe(false);
    expect(isValidSubtab("brenda", "presupuesto")).toBe(false);
    // Old christian subtabs
    expect(isValidSubtab("christian", "prospectos")).toBe(false);
    expect(isValidSubtab("christian", "secuencias")).toBe(false);
    expect(isValidSubtab("christian", "licitaciones")).toBe(false);
    // Old sara subtab
    expect(isValidSubtab("sara", "proyectos")).toBe(false);
    // Old norvil subtabs
    expect(isValidSubtab("norvil", "cuentas")).toBe(false);
    expect(isValidSubtab("norvil", "salud-cuenta")).toBe(false);
    // Old config subtab
    expect(isValidSubtab("config", "agentes")).toBe(false);
  });

  it("returns false for subtab that does not belong to agent", () => {
    expect(isValidSubtab("abel", "pipeline")).toBe(false);
    expect(isValidSubtab("sara", "pauta")).toBe(false);
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
// isValidSubSubTab — whitelist guard N3 (A4: XSS/path-injection)
// ─────────────────────────────────────────────────────────────────────────────

describe("isValidSubSubTab (N3 whitelist guard · A4)", () => {
  it("returns true for valid N3 leaves", () => {
    expect(isValidSubSubTab("abel", "oferta", "catalogo-escalera")).toBe(true);
    expect(isValidSubSubTab("abel", "oferta", "dossier-mineria")).toBe(true);
    expect(isValidSubSubTab("christian", "propuestas", "propuestas")).toBe(true);
    expect(isValidSubSubTab("christian", "propuestas", "licitaciones")).toBe(true);
    expect(isValidSubSubTab("norvil", "fidelizacion", "momentos")).toBe(true);
    expect(isValidSubSubTab("norvil", "fidelizacion", "champion-shield")).toBe(true);
    expect(isValidSubSubTab("norvil", "fidelizacion", "value-proof-qbr")).toBe(true);
    expect(isValidSubSubTab("norvil", "fidelizacion", "gifting")).toBe(true);
  });

  it("returns false for combo with no N3 leaves", () => {
    expect(isValidSubSubTab("abel", "icp", "anything")).toBe(false);
    expect(isValidSubSubTab("brenda", "pauta", "anything")).toBe(false);
    expect(isValidSubSubTab("christian", "pipeline", "anything")).toBe(false);
    expect(isValidSubSubTab("sara", "proximamente", "anything")).toBe(false);
    expect(isValidSubSubTab("norvil", "cartera", "anything")).toBe(false);
    expect(isValidSubSubTab("config", "conexiones", "anything")).toBe(false);
  });

  it("returns false for non-existent leaf in populated combo", () => {
    expect(isValidSubSubTab("abel", "oferta", "non-existent")).toBe(false);
    expect(isValidSubSubTab("christian", "propuestas", "unknown")).toBe(false);
    expect(isValidSubSubTab("norvil", "fidelizacion", "fake-leaf")).toBe(false);
  });

  it("returns false for XSS/path-traversal/prototype injection (A4 guard)", () => {
    expect(isValidSubSubTab("abel", "oferta", "<script>alert(1)</script>")).toBe(false);
    expect(isValidSubSubTab("abel", "oferta", "../../etc/passwd")).toBe(false);
    expect(isValidSubSubTab("abel", "oferta", "__proto__")).toBe(false);
    expect(isValidSubSubTab("abel", "oferta", "")).toBe(false);
  });

  it("returns false when agent or subtab is invalid", () => {
    expect(isValidSubSubTab("luana", "oferta", "catalogo-escalera")).toBe(false);
    expect(isValidSubSubTab("abel", "non-existent-subtab", "catalogo-escalera")).toBe(false);
    expect(isValidSubSubTab(null, "oferta", "catalogo-escalera")).toBe(false);
    expect(isValidSubSubTab("abel", null, "catalogo-escalera")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDefaultSubtab (v3 — first element per agent)
// ─────────────────────────────────────────────────────────────────────────────

describe("getDefaultSubtab (v3 — first array element)", () => {
  it("returns the first subtab id for each agent (v3)", () => {
    // NOTE: getDefaultSubtab returns AGENT_SUBTABS[agent][0].id (first array element).
    // christian's first element is "contactos" (not "pipeline").
    // AGENT_CATALOG.christian.defaultSubtab="pipeline" + DEFAULT_LANDING is the session default.
    expect(getDefaultSubtab("abel")).toBe("icp");
    expect(getDefaultSubtab("brenda")).toBe("contenido-presencia");
    expect(getDefaultSubtab("christian")).toBe("contactos");
    expect(getDefaultSubtab("sara")).toBe("proximamente");
    expect(getDefaultSubtab("norvil")).toBe("cartera");
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
  it("extracts valid agent from path (v3 slugs)", () => {
    expect(extractAgentFromPath("/tenant-x/abel/icp")).toBe("abel");
    expect(extractAgentFromPath("/tenant-x/christian/pipeline")).toBe("christian");
    expect(extractAgentFromPath("/tenant-x/config/conexiones")).toBe("config");
    expect(extractAgentFromPath("/tenant-x/sara/proximamente")).toBe("sara");
    expect(extractAgentFromPath("/tenant-x/norvil/cartera")).toBe("norvil");
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
  it("extracts subtab segment from path (v3 slugs)", () => {
    expect(extractSubtabFromPath("/tenant-x/abel/icp")).toBe("icp");
    expect(extractSubtabFromPath("/tenant-x/christian/pipeline")).toBe("pipeline");
    expect(extractSubtabFromPath("/tenant-x/sara/proximamente")).toBe("proximamente");
    expect(extractSubtabFromPath("/tenant-x/norvil/cartera")).toBe("cartera");
  });

  it("returns null for paths without subtab segment", () => {
    expect(extractSubtabFromPath("/tenant-x/abel")).toBeNull();
    expect(extractSubtabFromPath("/tenant-x")).toBeNull();
    expect(extractSubtabFromPath(null)).toBeNull();
  });
});
