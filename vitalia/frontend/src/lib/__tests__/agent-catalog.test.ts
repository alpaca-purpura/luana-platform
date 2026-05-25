/**
 * Agent catalog unit tests — T-1 (TDD mandatory per tdd-mandatory.md)
 *
 * SC-1 gherkin coverage: AGENT_CATALOG 6 agentes + DEFAULT_CHAT_AGENT + shape invariants + AGENT_SLUGS
 * SC-2 gherkin coverage: AGENT_RIBBON_ORDER constant + extractAgentFromPath helper valid slugs
 * SC-3 gherkin coverage: extractAgentFromPath 'config' special slug
 * SC-4 gherkin coverage: extractAgentFromPath invalid input → null
 * SC-6 gherkin coverage: extractAgentFromPath XSS payload sanitization implícita
 * SC-8 gherkin coverage: tabLabel strings Spanish neutro verbatim
 *
 * spec_anchor: 01-spec.md § 5.1 + § Catalog SSoT + § Microcopy + § Gherkin SC-1..SC-4/SC-6/SC-8
 *              03-arch.md § 2.1
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
  AGENT_RIBBON_ORDER,
  extractAgentFromPath,
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
  "tabLabel",
  "defaultSubtab",
];

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 — AGENT_CATALOG shape + F1-S6 regression guard
// ──────────────────────────────────────────────────────────────────────────────

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

  it("each agent shape complete — all 11 keys present on AgentDescriptor (F1-S7 adds tabLabel + defaultSubtab)", () => {
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

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 + SC-8 — tabLabel + defaultSubtab per agente (F1-S7 new fields)
// ──────────────────────────────────────────────────────────────────────────────

describe("AGENT_CATALOG — tabLabel + defaultSubtab (F1-S7 new fields)", () => {
  it("AGENT_CATALOG.lisa.tabLabel === 'Mi Clínica' + defaultSubtab === 'marca'", () => {
    expect(AGENT_CATALOG.lisa.tabLabel).toBe("Mi Clínica");
    expect(AGENT_CATALOG.lisa.defaultSubtab).toBe("marca");
  });

  it("AGENT_CATALOG.lucas.tabLabel === 'Atraer' + defaultSubtab === 'lanzar'", () => {
    expect(AGENT_CATALOG.lucas.tabLabel).toBe("Atraer");
    expect(AGENT_CATALOG.lucas.defaultSubtab).toBe("lanzar");
  });

  it("AGENT_CATALOG.adrian.tabLabel === 'Vender' + defaultSubtab === 'inbox'", () => {
    expect(AGENT_CATALOG.adrian.tabLabel).toBe("Vender");
    expect(AGENT_CATALOG.adrian.defaultSubtab).toBe("inbox");
  });

  it("AGENT_CATALOG.valeria.tabLabel === 'Operar' + defaultSubtab === 'agenda'", () => {
    expect(AGENT_CATALOG.valeria.tabLabel).toBe("Operar");
    expect(AGENT_CATALOG.valeria.defaultSubtab).toBe("agenda");
  });

  it("AGENT_CATALOG.camila.tabLabel === 'Mantener' + defaultSubtab === 'voz'", () => {
    expect(AGENT_CATALOG.camila.tabLabel).toBe("Mantener");
    expect(AGENT_CATALOG.camila.defaultSubtab).toBe("voz");
  });

  it("AGENT_CATALOG.mateo.tabLabel + defaultSubtab present (shape-complete though excluded from ribbon order)", () => {
    expect(AGENT_CATALOG.mateo.tabLabel).toBeTruthy();
    expect(AGENT_CATALOG.mateo.defaultSubtab).toBeTruthy();
  });

  it("existing F1-S6 fields (name, role, colorToken, hex, thumbnail, transparent, initial) preserved verbatim (no regression)", () => {
    // Spot-check verbatim values from F1-S6
    expect(AGENT_CATALOG.lisa.name).toBe("Lisa");
    expect(AGENT_CATALOG.lisa.role).toBe("Estratega de marca y oferta");
    expect(AGENT_CATALOG.lisa.hex).toBe("#00D084");
    expect(AGENT_CATALOG.lisa.thumbnail).toBe("/agents/lisa/thumbnail.png");
    expect(AGENT_CATALOG.lisa.initial).toBe("L");

    expect(AGENT_CATALOG.valeria.name).toBe("Valeria");
    expect(AGENT_CATALOG.valeria.role).toBe(
      "Tu secretaria virtual · coordinadora general",
    );
    expect(AGENT_CATALOG.valeria.hex).toBe("#7b2d91");

    expect(AGENT_CATALOG.adrian.name).toBe("Adrián");
    expect(AGENT_CATALOG.adrian.role).toBe(
      "Closer · califica leads y reactiva oportunidades",
    );
    expect(AGENT_CATALOG.adrian.transparent).toBe(
      "/agents/adrian/transparent.jpeg",
    );

    expect(AGENT_CATALOG.lucas.name).toBe("Lucas");
    expect(AGENT_CATALOG.camila.name).toBe("Camila");
    expect(AGENT_CATALOG.mateo.name).toBe("Mateo");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-2 — AGENT_RIBBON_ORDER constant
// ──────────────────────────────────────────────────────────────────────────────

describe("AGENT_RIBBON_ORDER — canonical ribbon tab order (F1-S7)", () => {
  it("AGENT_RIBBON_ORDER deep-equals ['lisa', 'lucas', 'adrian', 'valeria', 'camila'] in canonical order", () => {
    expect(AGENT_RIBBON_ORDER).toEqual([
      "lisa",
      "lucas",
      "adrian",
      "valeria",
      "camila",
    ]);
  });

  it("AGENT_RIBBON_ORDER.length === 5 (Mateo excluded — transversal agent per spec § 0)", () => {
    expect(AGENT_RIBBON_ORDER).toHaveLength(5);
  });

  it("AGENT_RIBBON_ORDER does not contain 'mateo'", () => {
    expect(AGENT_RIBBON_ORDER).not.toContain("mateo");
  });

  it("AGENT_RIBBON_ORDER is readonly tuple (TypeScript const assertion — runtime shape check)", () => {
    // Runtime check: verify it's array-like and not mutable via normal API
    // (TypeScript const assertion enforces readonly at compile time; here we verify shape at runtime)
    expect(Array.isArray(AGENT_RIBBON_ORDER)).toBe(true);
    // Verify immutability idiom: Object.isFrozen checks don't apply to const arrays,
    // but we verify the values are exactly the canonical 5
    expect(AGENT_RIBBON_ORDER[0]).toBe("lisa");
    expect(AGENT_RIBBON_ORDER[4]).toBe("camila");
  });

  it("all entries in AGENT_RIBBON_ORDER exist in AGENT_CATALOG", () => {
    for (const slug of AGENT_RIBBON_ORDER) {
      expect(AGENT_CATALOG).toHaveProperty(slug);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-2 — extractAgentFromPath · valid agent slugs
// ──────────────────────────────────────────────────────────────────────────────

describe("extractAgentFromPath — valid agent slugs (SC-2)", () => {
  it("extractAgentFromPath('/tenant-x/lisa/marca') returns 'lisa'", () => {
    expect(extractAgentFromPath("/tenant-x/lisa/marca")).toBe("lisa");
  });

  it("extractAgentFromPath('/tenant-x/camila/voz') returns 'camila'", () => {
    expect(extractAgentFromPath("/tenant-x/camila/voz")).toBe("camila");
  });

  it("extractAgentFromPath('/tenant-x/mateo/whatever') returns 'mateo' (catalog includes mateo even though not in ribbon order)", () => {
    expect(extractAgentFromPath("/tenant-x/mateo/whatever")).toBe("mateo");
  });

  it("extracts 'valeria' from path with tenantId prefix", () => {
    expect(extractAgentFromPath("/my-clinic-123/valeria/agenda")).toBe(
      "valeria",
    );
  });

  it("extracts 'lucas' from path", () => {
    expect(extractAgentFromPath("/tenant-x/lucas/lanzar")).toBe("lucas");
  });

  it("extracts 'adrian' from path", () => {
    expect(extractAgentFromPath("/tenant-x/adrian/inbox")).toBe("adrian");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-3 — extractAgentFromPath · 'config' special slug
// ──────────────────────────────────────────────────────────────────────────────

describe("extractAgentFromPath — 'config' special slug (SC-3)", () => {
  it("extractAgentFromPath('/tenant-x/config/cuenta') returns 'config' (RibbonTabSlug union)", () => {
    expect(extractAgentFromPath("/tenant-x/config/cuenta")).toBe("config");
  });

  it("extractAgentFromPath('/tenant-x/config') returns 'config' (minimal config path)", () => {
    // segments[1] = 'config', segments.length >= 2 (tenant + config)
    expect(extractAgentFromPath("/tenant-x/config")).toBe("config");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-4 — extractAgentFromPath · invalid input returns null
// ──────────────────────────────────────────────────────────────────────────────

describe("extractAgentFromPath — invalid input → null (SC-4)", () => {
  it("extractAgentFromPath('/tenant-x/foobar/baz') returns null", () => {
    expect(extractAgentFromPath("/tenant-x/foobar/baz")).toBeNull();
  });

  it("extractAgentFromPath('/tenant-x') returns null (insufficient segments — no [agent] segment)", () => {
    expect(extractAgentFromPath("/tenant-x")).toBeNull();
  });

  it("extractAgentFromPath('/') returns null (empty/root)", () => {
    expect(extractAgentFromPath("/")).toBeNull();
  });

  it("extractAgentFromPath(null) returns null (defensive nullable)", () => {
    expect(extractAgentFromPath(null)).toBeNull();
  });

  it("extractAgentFromPath(undefined) returns null", () => {
    expect(extractAgentFromPath(undefined)).toBeNull();
  });

  it("extractAgentFromPath('') returns null", () => {
    expect(extractAgentFromPath("")).toBeNull();
  });

  it("extractAgentFromPath('/only-one-segment') returns null (< 2 non-empty segments)", () => {
    // After split+filter: ['only-one-segment'] → length 1 < 2 → null
    expect(extractAgentFromPath("/only-one-segment")).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-6 — extractAgentFromPath · XSS payload sanitization implícita
// ──────────────────────────────────────────────────────────────────────────────

describe("extractAgentFromPath — XSS payload sanitization (SC-6)", () => {
  it("extractAgentFromPath('/tenant-x/<script>alert(1)</script>/foo') returns null (slug enum mismatch sanitizes)", () => {
    expect(
      extractAgentFromPath("/tenant-x/<script>alert(1)</script>/foo"),
    ).toBeNull();
  });

  it("extractAgentFromPath('/tenant-x/javascript:alert(1)/foo') returns null", () => {
    expect(
      extractAgentFromPath("/tenant-x/javascript:alert(1)/foo"),
    ).toBeNull();
  });

  it("extractAgentFromPath('/tenant-x/data:text/html,<h1>/foo') returns null", () => {
    expect(
      extractAgentFromPath("/tenant-x/data:text/html,<h1>/foo"),
    ).toBeNull();
  });

  it("extractAgentFromPath('/tenant-x/../etc/passwd') does not return a valid slug", () => {
    // Traversal attempt: segments after filter would be ['tenant-x', '..', 'etc', 'passwd']
    // segments[1] = '..' → does not match any AgentSlug or 'config' → null
    expect(extractAgentFromPath("/tenant-x/../etc/passwd")).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-8 — tabLabel strings Spanish neutro verbatim
// ──────────────────────────────────────────────────────────────────────────────

describe("tabLabel — Spanish neutro LatAm verbatim (SC-8)", () => {
  it("all 5 ribbon tabLabels are short Spanish neutro strings (1-3 words, no accented imperatives)", () => {
    // Verify tabLabels are the expected exact strings (Spanish neutro LatAm per spec § Microcopy)
    // Each is a noun/infinitive verb — no imperative voseo forms
    const expectedLabels: string[] = [
      "Mi Clínica",
      "Atraer",
      "Vender",
      "Operar",
      "Mantener",
    ];
    const ribbonLabels = AGENT_RIBBON_ORDER.map(
      (slug) => AGENT_CATALOG[slug].tabLabel,
    );
    expect(ribbonLabels).toEqual(expectedLabels);
  });

  it("Adrián role label has tilde (Adrián not 'Adrian')", () => {
    expect(AGENT_CATALOG.adrian.name).toBe("Adrián");
    // The name with tilde is the correct Spanish neutro form
    expect(AGENT_CATALOG.adrian.name).toContain("á");
  });

  it("Mi Clínica tabLabel has tilde (Clínica not 'Clinica')", () => {
    expect(AGENT_CATALOG.lisa.tabLabel).toBe("Mi Clínica");
    expect(AGENT_CATALOG.lisa.tabLabel).toContain("í");
  });

  it("lisa tabLabel is exactly 'Mi Clínica' (verbatim per spec § Microcopy SC-1)", () => {
    expect(AGENT_CATALOG.lisa.tabLabel).toBe("Mi Clínica");
  });

  it("lucas tabLabel is exactly 'Atraer'", () => {
    expect(AGENT_CATALOG.lucas.tabLabel).toBe("Atraer");
  });

  it("adrian tabLabel is exactly 'Vender'", () => {
    expect(AGENT_CATALOG.adrian.tabLabel).toBe("Vender");
  });

  it("valeria tabLabel is exactly 'Operar'", () => {
    expect(AGENT_CATALOG.valeria.tabLabel).toBe("Operar");
  });

  it("camila tabLabel is exactly 'Mantener'", () => {
    expect(AGENT_CATALOG.camila.tabLabel).toBe("Mantener");
  });
});
