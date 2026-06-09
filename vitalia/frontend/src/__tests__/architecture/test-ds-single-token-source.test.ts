/**
 * Architecture test — F-2 (R-1SRC): globals.css has ONE source of truth per locked token.
 *
 * Before this story globals.css carried TWO --radius declarations:
 *   - Shadcn  --radius: 0.625rem  (line ~51) — KEEP
 *   - legacy  --radius: 0.5rem    (line ~151) — the CLASH, deleted by R-1SRC
 *
 * R-1SRC resolves to a single --radius and converts the legacy --vitalia-*
 * COLOR vars into ALIASES of the Shadcn tokens (e.g. --vitalia-cian: var(--primary))
 * so the ~85 existing `var(--vitalia-*)` / `.vt-*` consumers keep rendering unchanged
 * (non-breaking; migrating them is Fase 3).
 *
 * Rules asserted:
 *   1. Exactly ONE `--radius:` declaration in :root (light) — the clash is gone.
 *   2. That single --radius is 0.625rem (Shadcn kept, legacy 0.5rem deleted).
 *   3. The legacy brand COLOR vars (--vitalia-cian/purpura/amarillo/azul-marino)
 *      are aliases of Shadcn tokens (point at var(--...)), not raw `H S% L%` channels.
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const GLOBALS = resolve(__dirname, "../../app/globals.css");
const css = readFileSync(GLOBALS, "utf8");

/** Top-level --radius declarations (ignore --radius-lg / --radius-bubble / --radius-pill). */
function radiusBaseDeclarations(src: string): string[] {
  // match `--radius:` but NOT `--radius-...:`
  return src.match(/--radius\s*:(?![\w-])[^;]*/g) ?? [];
}

describe("R-1SRC — single --radius source of truth", () => {
  it("has exactly ONE base --radius declaration (clash resolved)", () => {
    const decls = radiusBaseDeclarations(css);
    expect(decls.length).toBe(1);
  });

  it("keeps the Shadcn 0.625rem value (legacy 0.5rem deleted)", () => {
    const decls = radiusBaseDeclarations(css);
    expect(decls[0]).toMatch(/0\.625rem/);
    expect(css).not.toMatch(/--radius\s*:(?![\w-])\s*0\.5rem/);
  });
});

describe("R-1SRC — legacy --vitalia-* brand colors alias Shadcn tokens", () => {
  // The four official brand-core colors must point at the Shadcn SSoT now.
  const aliasedVars = [
    "--vitalia-cian",
    "--vitalia-purpura",
    "--vitalia-amarillo",
    "--vitalia-azul-marino",
  ];

  for (const v of aliasedVars) {
    it(`${v} is an alias (var(--...)) not a raw HSL channel triple`, () => {
      // capture the FIRST :root declaration of this var
      const re = new RegExp(`${v}\\s*:\\s*([^;]+);`);
      const m = css.match(re);
      expect(m, `${v} declaration must exist`).not.toBeNull();
      const value = m![1].trim();
      expect(value, `${v} must alias a Shadcn token`).toMatch(/var\(--[\w-]+\)/);
      // must NOT be a raw `H S% L%` channel triple anymore
      expect(value).not.toMatch(/^\d+\s+\d+%\s+\d+%$/);
    });
  }
});
