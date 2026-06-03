/**
 * empty-states-all-subtabs.spec.ts — Scenario A5
 * nicolify-r0-shell T-6 · updated T-2 (sitemap-completo v3)
 *
 * A5 · empty_state · cada sub-tab del nav-tree renderiza su empty-state
 * - given: usuario autenticado
 * - when: navega a cada [agent]/[subtab] del whitelist (v3)
 *   N2: Abel 3 + Brenda 3 + Christian 6 + Sara 1 + Norvil 3 + Config 4 = 20 combos
 *   N3 hojas: abel/oferta (2) + christian/propuestas (2) + norvil/fidelizacion (4) = 8 combos
 *   Total: 20 N2 + 8 N3 = 28 combos
 * - then: cada hoja renderiza un EmptyState (icono + heading + sub-copy),
 *   NUNCA pantalla en blanco ni crash
 *
 * Nota: para el gate anti-burbuja, usar nav-walk-v3.spec.ts (importa de fixtures/base.ts).
 * Este spec mantiene el import de auth.fixture (data-only change per architect T-2).
 *
 * gherkin_coverage: A5
 * spec_anchor: 04-validators.yaml § F-A5
 *
 * v3 slugs (T-2 sitemap-completo):
 *   abel:      icp | oferta | marca
 *   brenda:    contenido-presencia | pauta | inteligencia-asesoria
 *   christian: contactos | inbox | pipeline | equipo-comercial | agenda | propuestas
 *   sara:      proximamente
 *   norvil:    cartera | renovaciones | fidelizacion
 *   config:    conexiones | preferencias | tokens | autonomia-agentes
 *   N3 — abel/oferta: catalogo-escalera | dossier-mineria
 *   N3 — christian/propuestas: propuestas | licitaciones
 *   N3 — norvil/fidelizacion: momentos | champion-shield | value-proof-qbr | gifting
 */

import { test, expect } from "../../auth.fixture";

// ---------------------------------------------------------------------------
// N2 sub-tab combos — v3 tree (20 total)
// Actualizado desde v2 (angulos/escalera-valor/prospectos/secuencias/cuentas/
// salud-cuenta/proyectos/campanas/presupuesto/agentes eliminados en T-1).
// ---------------------------------------------------------------------------
const ALL_SUBTABS = [
  // abel (3) — v3: icp + oferta + marca
  { agent: "abel", subtab: "icp" },
  { agent: "abel", subtab: "oferta" },
  { agent: "abel", subtab: "marca" },
  // brenda (3) — v3: contenido-presencia + pauta + inteligencia-asesoria
  { agent: "brenda", subtab: "contenido-presencia" },
  { agent: "brenda", subtab: "pauta" },
  { agent: "brenda", subtab: "inteligencia-asesoria" },
  // christian (6) — v3: contactos + inbox + pipeline + equipo-comercial + agenda + propuestas
  { agent: "christian", subtab: "contactos" },
  { agent: "christian", subtab: "inbox" },
  { agent: "christian", subtab: "pipeline" },
  { agent: "christian", subtab: "equipo-comercial" },
  { agent: "christian", subtab: "agenda" },
  { agent: "christian", subtab: "propuestas" },
  // sara (1) — v3: proximamente
  { agent: "sara", subtab: "proximamente" },
  // norvil (3) — v3: cartera + renovaciones + fidelizacion
  { agent: "norvil", subtab: "cartera" },
  { agent: "norvil", subtab: "renovaciones" },
  { agent: "norvil", subtab: "fidelizacion" },
  // config (4) — v3: conexiones + preferencias + tokens + autonomia-agentes
  { agent: "config", subtab: "conexiones" },
  { agent: "config", subtab: "preferencias" },
  { agent: "config", subtab: "tokens" },
  { agent: "config", subtab: "autonomia-agentes" },
] as const;

// ---------------------------------------------------------------------------
// N3 leaf combos — 8 hojas en 3 combos (T-2 addition)
// Testid de 3 partes: subtab-content-{agent}-{subtab}-{leaf}
// URL de 4 segmentos: /{tenantId}/{agent}/{subtab}/{leaf}
// ---------------------------------------------------------------------------
const N3_LEAVES = [
  // abel/oferta → 2 hojas
  { agent: "abel", subtab: "oferta", leaf: "catalogo-escalera" },
  { agent: "abel", subtab: "oferta", leaf: "dossier-mineria" },
  // christian/propuestas → 2 hojas
  { agent: "christian", subtab: "propuestas", leaf: "propuestas" },
  { agent: "christian", subtab: "propuestas", leaf: "licitaciones" },
  // norvil/fidelizacion → 4 hojas
  { agent: "norvil", subtab: "fidelizacion", leaf: "momentos" },
  { agent: "norvil", subtab: "fidelizacion", leaf: "champion-shield" },
  { agent: "norvil", subtab: "fidelizacion", leaf: "value-proof-qbr" },
  { agent: "norvil", subtab: "fidelizacion", leaf: "gifting" },
] as const;

// ---------------------------------------------------------------------------
// Suite N2 (20 combos)
// ---------------------------------------------------------------------------
test.describe("A5 — empty-states all sub-tabs v3 (20 N2 combos)", () => {
  for (const { agent, subtab } of ALL_SUBTABS) {
    test(`${agent}/${subtab} → renders EmptyState (no blank, no crash)`, async ({
      page,
      tenantId,
    }) => {
      await page.goto(`/${tenantId}/${agent}/${subtab}`, { waitUntil: "load" });

      // Shell renders without crash
      await expect(page.locator("main:visible")).toBeVisible({ timeout: 15_000 });

      // SubTabContent renders. ^= prefijo: un N2 con hojas N3 redirige al primer
      // leaf → testid pasa a 3 partes; el prefijo matchea N2 puro y leaf-parent.
      await expect(
        page.locator(`[data-testid^="subtab-content-${agent}-${subtab}"]:visible`),
      ).toBeVisible({ timeout: 10_000 });

      // EmptyState visible (not a blank screen)
      await expect(page.locator("[data-testid='empty-state']:visible")).toBeVisible({
        timeout: 10_000,
      });

      // Icon visible
      await expect(page.locator("[data-testid='empty-state-icon']:visible")).toBeVisible({
        timeout: 5_000,
      });

      // Body not empty
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Suite N3 (8 hojas — T-2 addition)
// ---------------------------------------------------------------------------
test.describe("A5 — empty-states N3 leaves (8 combos)", () => {
  for (const { agent, subtab, leaf } of N3_LEAVES) {
    test(`${agent}/${subtab}/${leaf} → renders EmptyState (no blank, no crash)`, async ({
      page,
      tenantId,
    }) => {
      await page.goto(`/${tenantId}/${agent}/${subtab}/${leaf}`, {
        waitUntil: "load",
      });

      // Shell renders without crash
      await expect(page.locator("main:visible")).toBeVisible({ timeout: 15_000 });

      // SubTabContent N3 renders (testid canónico de 3 partes)
      await expect(
        page.locator(
          `[data-testid="subtab-content-${agent}-${subtab}-${leaf}"]:visible`,
        ),
      ).toBeVisible({ timeout: 10_000 });

      // EmptyState visible
      await expect(page.locator("[data-testid='empty-state']:visible")).toBeVisible({
        timeout: 10_000,
      });

      // Body not empty
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    });
  }
});
