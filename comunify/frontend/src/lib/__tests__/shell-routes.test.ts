// cap: comunify-shell-organism
/**
 * shell-routes.test.ts — Unit tests for lib/routing/shell-routes.ts.
 *
 * TDD RED → GREEN (tdd-mandatory.md).
 * Verifies: routing constants integrity, guard functions, extractor functions,
 * DEFAULT_LANDING, AGENT_RIBBON_ORDER excludes "plataforma".
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
  extractAgentFromPath,
  extractSubtabFromPath,
} from "../routing/shell-routes";

describe("DEFAULT_LANDING", () => {
  it("lands on nina/marca", () => {
    expect(DEFAULT_LANDING.agent).toBe("nina");
    expect(DEFAULT_LANDING.subtab).toBe("marca");
  });
});

describe("AGENT_RIBBON_ORDER", () => {
  it("has 5 ribbon agents (plataforma excluded)", () => {
    expect(AGENT_RIBBON_ORDER).toHaveLength(5);
    expect(AGENT_RIBBON_ORDER).not.toContain("plataforma");
    expect(AGENT_RIBBON_ORDER).not.toContain("luana");
  });

  it("starts with nina", () => {
    expect(AGENT_RIBBON_ORDER[0]).toBe("nina");
  });
});

describe("AGENT_CATALOG", () => {
  it("has 6 entries: 5 ribbon + plataforma", () => {
    const keys = Object.keys(AGENT_CATALOG);
    expect(keys).toHaveLength(6);
    expect(keys).toContain("plataforma");
  });

  it("nina has correct fields", () => {
    expect(AGENT_CATALOG.nina.slug).toBe("nina");
    expect(AGENT_CATALOG.nina.defaultSubtab).toBe("marca");
  });

  it("plataforma defaultSubtab is conexiones", () => {
    expect(AGENT_CATALOG.plataforma.defaultSubtab).toBe("conexiones");
  });
});

describe("AGENT_SUBTABS", () => {
  it("has subtabs for all 6 keys including plataforma", () => {
    expect(AGENT_SUBTABS).toHaveProperty("nina");
    expect(AGENT_SUBTABS).toHaveProperty("tomas");
    expect(AGENT_SUBTABS).toHaveProperty("sofia");
    expect(AGENT_SUBTABS).toHaveProperty("bruno");
    expect(AGENT_SUBTABS).toHaveProperty("lucia");
    expect(AGENT_SUBTABS).toHaveProperty("plataforma");
  });

  it("nina has 3 subtabs with SubTabMeta shape", () => {
    const ninaSubtabs = AGENT_SUBTABS.nina;
    expect(ninaSubtabs).toHaveLength(3);
    const ids = ninaSubtabs.map((t) => t.id);
    expect(ids).toContain("marca");
    expect(ids).toContain("ofertas");
    expect(ids).toContain("cohorts");
  });

  it("tomas has 4 subtabs", () => {
    expect(AGENT_SUBTABS.tomas).toHaveLength(4);
  });

  it("plataforma subtabs include conexiones and cuenta", () => {
    const ids = AGENT_SUBTABS.plataforma.map((t) => t.id);
    expect(ids).toContain("conexiones");
    expect(ids).toContain("cuenta");
  });

  it("each SubTabMeta has id, label, icon", () => {
    for (const entry of AGENT_SUBTABS.nina) {
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("label");
      expect(entry).toHaveProperty("icon");
      expect(typeof entry.id).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });
});

describe("AGENT_SUBSUBTABS", () => {
  it("nina.marca has identidad, voz, autoridad, narrativa", () => {
    const meta = AGENT_SUBSUBTABS["nina.marca"];
    expect(meta).toBeDefined();
    const ids = meta!.map((m) => m.id);
    expect(ids).toContain("identidad");
    expect(ids).toContain("voz");
    expect(ids).toContain("autoridad");
    expect(ids).toContain("narrativa");
  });

  it("plataforma.cuenta has preferencias, plan, tokens", () => {
    const meta = AGENT_SUBSUBTABS["plataforma.cuenta"];
    expect(meta).toBeDefined();
    const ids = meta!.map((m) => m.id);
    expect(ids).toContain("preferencias");
    expect(ids).toContain("plan");
    expect(ids).toContain("tokens");
  });

  it("unknown combo returns undefined (no sub-subtabs)", () => {
    expect(AGENT_SUBSUBTABS["sofia.conversaciones"]).toBeUndefined();
  });
});

describe("isValidAgent", () => {
  it("returns true for valid agents", () => {
    expect(isValidAgent("nina")).toBe(true);
    expect(isValidAgent("tomas")).toBe(true);
    expect(isValidAgent("plataforma")).toBe(true);
  });

  it("returns false for luana (not a ribbon tab)", () => {
    // luana is sidebar-only, not in RibbonTabSlug
    expect(isValidAgent("luana")).toBe(false);
  });

  it("returns false for invalid agents (XSS / path-injection defense)", () => {
    expect(isValidAgent("hacker")).toBe(false);
    expect(isValidAgent("../etc")).toBe(false);
    expect(isValidAgent("")).toBe(false);
    expect(isValidAgent("<script>")).toBe(false);
    expect(isValidAgent(null)).toBe(false);
    expect(isValidAgent(undefined)).toBe(false);
  });
});

describe("isValidSubtab", () => {
  it("returns true for valid subtab under correct agent", () => {
    expect(isValidSubtab("nina", "marca")).toBe(true);
    expect(isValidSubtab("tomas", "referentes")).toBe(true);
    expect(isValidSubtab("plataforma", "conexiones")).toBe(true);
  });

  it("returns false for subtab belonging to different agent", () => {
    expect(isValidSubtab("nina", "referentes")).toBe(false);
  });

  it("returns false for invalid agent", () => {
    expect(isValidSubtab("unknown", "marca")).toBe(false);
  });

  it("returns false for empty subtab", () => {
    expect(isValidSubtab("nina", "")).toBe(false);
  });
});

describe("isValidSubSubTab", () => {
  it("returns true for valid sub-subtab", () => {
    expect(isValidSubSubTab("nina", "marca", "identidad")).toBe(true);
    expect(isValidSubSubTab("nina", "marca", "voz")).toBe(true);
  });

  it("returns false for non-existent sub-subtab", () => {
    expect(isValidSubSubTab("nina", "marca", "nonexistent")).toBe(false);
  });

  it("returns false when agent+subtab has no sub-subtabs", () => {
    expect(isValidSubSubTab("sofia", "conversaciones", "anything")).toBe(false);
  });
});

describe("getDefaultSubtab", () => {
  it("returns first subtab id for known agents", () => {
    const ninaDefault = getDefaultSubtab("nina");
    expect(ninaDefault).toBe("marca"); // nina.defaultSubtab
  });

  it("returns conexiones for plataforma", () => {
    const platDefault = getDefaultSubtab("plataforma");
    expect(platDefault).toBe("conexiones");
  });

  it("returns null for unknown agent", () => {
    expect(getDefaultSubtab("unknownXYZ")).toBeNull();
  });
});

describe("extractAgentFromPath", () => {
  it("extracts agent slug from /{tenantId}/{agent}/{subtab}", () => {
    expect(extractAgentFromPath("/tenant123/nina/marca")).toBe("nina");
    expect(extractAgentFromPath("/tenant123/plataforma/cuenta")).toBe("plataforma");
  });

  it("extracts agent from /{tenantId}/{agent}", () => {
    expect(extractAgentFromPath("/tenant123/nina")).toBe("nina");
  });

  it("returns null for root tenant path", () => {
    expect(extractAgentFromPath("/tenant123")).toBeNull();
  });

  it("returns null for empty path", () => {
    expect(extractAgentFromPath("/")).toBeNull();
  });
});

describe("extractSubtabFromPath", () => {
  it("extracts subtab from /{tenantId}/{agent}/{subtab}", () => {
    expect(extractSubtabFromPath("/tenant123/nina/marca")).toBe("marca");
    expect(extractSubtabFromPath("/tenant123/plataforma/cuenta")).toBe("cuenta");
  });

  it("returns null when no subtab in path", () => {
    expect(extractSubtabFromPath("/tenant123/nina")).toBeNull();
  });

  it("returns null for root path", () => {
    expect(extractSubtabFromPath("/tenant123")).toBeNull();
  });
});
