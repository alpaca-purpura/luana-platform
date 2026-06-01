/**
 * empty-states-all-subtabs.spec.ts — Scenario A5
 * nicolify-r0-shell T-6
 *
 * A5 · empty_state · cada sub-tab del nav-tree renderiza su empty-state
 * - given: usuario autenticado
 * - when: navega a cada [agent]/[subtab] del whitelist
 *   (Abel 4 + Brenda 3 + Christian 5 + Sara 1 + Norvil 3 + Config 4 = 20 combos)
 * - then: cada hoja renderiza un EmptyState (icono + heading + sub-copy),
 *   NUNCA pantalla en blanco ni crash
 *
 * gherkin_coverage: A5
 * spec_anchor: 04-validators.yaml § F-A5
 */

import { test, expect } from "../../auth.fixture";

// All valid sub-tab combos (20 total) — from AGENT_SUBTABS SSoT
const ALL_SUBTABS = [
  // abel (4)
  { agent: "abel", subtab: "oferta" },
  { agent: "abel", subtab: "angulos" },
  { agent: "abel", subtab: "escalera-valor" },
  { agent: "abel", subtab: "marca" },
  // brenda (3)
  { agent: "brenda", subtab: "campanas" },
  { agent: "brenda", subtab: "contenido" },
  { agent: "brenda", subtab: "presupuesto" },
  // christian (5)
  { agent: "christian", subtab: "prospectos" },
  { agent: "christian", subtab: "secuencias" },
  { agent: "christian", subtab: "pipeline" },
  { agent: "christian", subtab: "propuestas" },
  { agent: "christian", subtab: "licitaciones" },
  // sara (1)
  { agent: "sara", subtab: "proyectos" },
  // norvil (3)
  { agent: "norvil", subtab: "cuentas" },
  { agent: "norvil", subtab: "salud-cuenta" },
  { agent: "norvil", subtab: "renovaciones" },
  // config (4)
  { agent: "config", subtab: "conexiones" },
  { agent: "config", subtab: "preferencias" },
  { agent: "config", subtab: "tokens" },
  { agent: "config", subtab: "agentes" },
] as const;

test.describe("A5 — empty-states all sub-tabs (20 combos)", () => {
  for (const { agent, subtab } of ALL_SUBTABS) {
    test(`${agent}/${subtab} → renders EmptyState (no blank, no crash)`, async ({
      page,
      tenantId,
    }) => {
      await page.goto(`/${tenantId}/${agent}/${subtab}`, { waitUntil: "load" });

      // Shell renders without crash
      await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

      // SubTabContent renders
      await expect(
        page.locator(`[data-testid="subtab-content-${agent}-${subtab}"]`),
      ).toBeVisible({ timeout: 10_000 });

      // EmptyState visible (not a blank screen)
      await expect(page.locator("[data-testid='empty-state']")).toBeVisible({
        timeout: 10_000,
      });

      // Icon visible
      await expect(page.locator("[data-testid='empty-state-icon']")).toBeVisible({
        timeout: 5_000,
      });

      // Body not empty
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    });
  }
});
