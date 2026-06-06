/**
 * nav-walk-v3.spec.ts — E2E nav-walk completo del árbol v3
 * nicolify-r0-sitemap-completo T-2
 *
 * Camina CADA hoja del árbol de navegación v3 (N2 + N3) y verifica:
 *   - El contenido del sub-tab (data-testid="subtab-content-{agent}-{subtab}") es visible
 *   - El EmptyState está presente (placeholder — todavía no hay datos reales)
 *   - Para N3: la barra de sub-sub-tabs aparece + el contenido de la hoja N3
 *
 * El gate anti-burbuja (base.ts) se encarga de:
 *   - 0 excepciones JS no atrapadas (burbuja Next)
 *   - 0 errores de hidratación React/SSR
 *   - 0 console.error no-allowlisted
 *   - 0 respuestas /api/ 4xx/5xx
 *   - overlay de error de Next ausente del DOM
 *
 * gherkin_coverage: T-2 nicolify-r0-sitemap-completo (validator nav_walk_complete + visual_empty_state_n3)
 * spec_anchor: 04-validators.yaml T-2
 *
 * Árbol v3 (slugs canónicos — NUNCA modificar sin actualizar AGENT_CATALOG):
 *   abel:      icp | oferta | marca
 *   brenda:    contenido-presencia | pauta | inteligencia-asesoria
 *   christian: contactos | inbox | pipeline | equipo-comercial | agenda | propuestas
 *   sara:      proximamente
 *   norvil:    cartera | renovaciones | fidelizacion
 *   config:    conexiones | preferencias | tokens | autonomia-agentes
 *
 * N3 (8 hojas en 3 combos):
 *   abel/oferta         → catalogo-escalera | dossier-mineria
 *   christian/propuestas → propuestas | licitaciones
 *   norvil/fidelizacion  → momentos | champion-shield | value-proof-qbr | gifting
 */

import { test, expect } from "../../fixtures/base";

// ---------------------------------------------------------------------------
// V3 nav tree — datos SSoT para el walk.
// Modificar SOLO si AGENT_CATALOG cambia (y actualizar TODOS los specs).
// ---------------------------------------------------------------------------

/** N2: cada agente + sus sub-tabs de nivel 2 */
const V3_N2_TREE = [
  // Abel (3 sub-tabs)
  { agent: "abel", subtab: "icp" },
  { agent: "abel", subtab: "oferta" },
  { agent: "abel", subtab: "marca" },
  // Brenda (3 sub-tabs)
  { agent: "brenda", subtab: "contenido-presencia" },
  { agent: "brenda", subtab: "pauta" },
  { agent: "brenda", subtab: "inteligencia-asesoria" },
  // Christian (6 sub-tabs)
  { agent: "christian", subtab: "contactos" },
  { agent: "christian", subtab: "inbox" },
  { agent: "christian", subtab: "pipeline" },
  { agent: "christian", subtab: "equipo-comercial" },
  { agent: "christian", subtab: "agenda" },
  { agent: "christian", subtab: "propuestas" },
  // Sara (1 sub-tab — "próximamente")
  { agent: "sara", subtab: "proximamente" },
  // Norvil (3 sub-tabs)
  { agent: "norvil", subtab: "cartera" },
  { agent: "norvil", subtab: "renovaciones" },
  { agent: "norvil", subtab: "fidelizacion" },
  // Config (4 sub-tabs)
  { agent: "config", subtab: "conexiones" },
  { agent: "config", subtab: "preferencias" },
  { agent: "config", subtab: "tokens" },
  { agent: "config", subtab: "autonomia-agentes" },
] as const;

/** N3: combos que tienen sub-sub-tabs. 8 hojas en 3 combos. */
const V3_N3_COMBOS = [
  {
    agent: "abel",
    subtab: "oferta",
    leaves: ["catalogo-escalera", "dossier-mineria"],
  },
  {
    agent: "christian",
    subtab: "propuestas",
    leaves: ["propuestas", "licitaciones"],
  },
  {
    agent: "norvil",
    subtab: "fidelizacion",
    leaves: ["momentos", "champion-shield", "value-proof-qbr", "gifting"],
  },
] as const;

// ---------------------------------------------------------------------------
// Suite N2 — walk completo de todas las hojas N2
// ---------------------------------------------------------------------------
test.describe("nav-walk v3 — N2 (todos los sub-tabs)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const { agent, subtab } of V3_N2_TREE) {
    test(`${agent}/${subtab} → subtab-content visible + empty-state`, async ({
      page,
      tenantId,
    }) => {
      await page.goto(`/${tenantId}/${agent}/${subtab}`, {
        waitUntil: "load",
      });

      // Shell cargado (SSR-safe store hidratado)
      await expect(
        page.locator("[data-shell-ready='true']"),
        `shell-ready en ${agent}/${subtab}`,
      ).toBeVisible({ timeout: 20_000 });

      // Contenido del sub-tab.
      // :visible — el shell monta desktop (md:block) + mobile (md:hidden) SIEMPRE
      // (responsive vía CSS) → el testid existe 2x en el DOM; solo uno es visible.
      // ^= prefijo — un N2 con hojas N3 (abel/oferta, christian/propuestas,
      // norvil/fidelizacion) redirige al primer leaf → el testid pasa a 3 partes
      // (subtab-content-{agent}-{subtab}-{leaf}); el prefijo matchea ambos casos.
      await expect(
        page.locator(`[data-testid^="subtab-content-${agent}-${subtab}"]:visible`),
        `subtab-content-${agent}-${subtab} debe ser visible`,
      ).toBeVisible({ timeout: 15_000 });

      // EmptyState visible (placeholder — todavía no hay datos reales)
      await expect(
        page.locator("[data-testid='empty-state']:visible"),
        `empty-state en ${agent}/${subtab}`,
      ).toBeVisible({ timeout: 10_000 });

      // Cuerpo no vacío (no pantalla en blanco)
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.trim().length, "body no debe estar vacío").toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Suite N3 — walk de las 3 combos con sub-sub-tabs (8 hojas)
// Cada test tiene "N3" en el título para que el validator pueda grepearlo.
// ---------------------------------------------------------------------------
test.describe("nav-walk v3 — N3 (sub-sub-tabs)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const { agent, subtab, leaves } of V3_N3_COMBOS) {
    // Primero verificamos el N2 padre tiene sub-sub-tabs-bar
    test(`N3 — ${agent}/${subtab}: sub-sub-tabs-bar visible`, async ({
      page,
      tenantId,
    }) => {
      await page.goto(`/${tenantId}/${agent}/${subtab}`, {
        waitUntil: "load",
      });

      await expect(
        page.locator("[data-shell-ready='true']"),
        `shell-ready en ${agent}/${subtab}`,
      ).toBeVisible({ timeout: 20_000 });

      // La barra N3 debe aparecer en los 3 combos N3
      await expect(
        page.locator("[data-testid='sub-sub-tabs-bar']:visible"),
        `sub-sub-tabs-bar debe ser visible en ${agent}/${subtab}`,
      ).toBeVisible({ timeout: 15_000 });
    });

    // Luego cada hoja N3 individualmente
    for (const leaf of leaves) {
      test(`N3 — ${agent}/${subtab}/${leaf}: leaf content visible + empty-state`, async ({
        page,
        tenantId,
      }) => {
        await page.goto(`/${tenantId}/${agent}/${subtab}/${leaf}`, {
          waitUntil: "load",
        });

        await expect(
          page.locator("[data-shell-ready='true']"),
          `shell-ready en ${agent}/${subtab}/${leaf}`,
        ).toBeVisible({ timeout: 20_000 });

        // Barra N3 visible
        await expect(
          page.locator("[data-testid='sub-sub-tabs-bar']:visible"),
          `sub-sub-tabs-bar en ${agent}/${subtab}/${leaf}`,
        ).toBeVisible({ timeout: 15_000 });

        // Contenido de la hoja N3 con testid de 3 partes
        await expect(
          page.locator(
            `[data-testid="subtab-content-${agent}-${subtab}-${leaf}"]:visible`,
          ),
          `subtab-content-${agent}-${subtab}-${leaf} debe ser visible`,
        ).toBeVisible({ timeout: 15_000 });

        // EmptyState visible
        await expect(
          page.locator("[data-testid='empty-state']:visible"),
          `empty-state en ${agent}/${subtab}/${leaf}`,
        ).toBeVisible({ timeout: 10_000 });
      });
    }
  }
});
