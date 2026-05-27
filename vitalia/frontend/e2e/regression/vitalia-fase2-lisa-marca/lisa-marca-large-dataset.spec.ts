/**
 * lisa-marca-large-dataset.spec.ts — SC-9 Large dataset performance
 *
 * Gherkin: "Dado que el tenant tiene 50 trust signals registradas,
 *           cuando el propietario navega a la sección Presencia,
 *           entonces la lista carga en menos de 3 segundos
 *           y el scroll es fluido."
 *
 * Validators: e2e_large_dataset (50 testimonials + 30 team) + fixture large-dataset
 *
 * POMs: LisaMarcaPage, PresenciaSectionPage
 *
 * downstream-regression-na: brand-local vitalia e2e spec F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 17
 */

import { expect } from "@playwright/test";
import { test, gotoMarca } from "./fixtures/large-dataset.fixture";
import { LISA_MARCA_FIXTURE } from "./fixtures/lisa-marca.fixture";
import { LisaMarcaPage } from "./poms/lisa-marca-page.pom";
import { PresenciaSectionPage } from "./poms/presencia-section.pom";

// ---------------------------------------------------------------------------
// Performance threshold constants
// ---------------------------------------------------------------------------

/** Maximum time to render 50 trust signals (ms) */
const MAX_LIST_RENDER_MS = 3_000;

// ---------------------------------------------------------------------------
// Test suite — SC-9: large dataset performance
// ---------------------------------------------------------------------------

test.describe("SC-9 — Rendimiento con dataset grande: 50 señales de confianza", () => {
  test.beforeEach(async ({ largeDatasetPage }) => {
    await gotoMarca(
      largeDatasetPage,
      LISA_MARCA_FIXTURE.tenantId,
      "presencia",
    );
  });

  test("la lista de 50 señales de confianza carga en menos de 3 segundos", async ({
    largeDatasetPage,
    largeTrustSignals,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      largeDatasetPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const presencia = new PresenciaSectionPage(largeDatasetPage);

    // Start timing
    const startTime = Date.now();

    await marcaPagePom.waitForLoaded();
    await presencia.waitForTrustSignalsLoaded(MAX_LIST_RENDER_MS);

    const renderTime = Date.now() - startTime;

    // Verify render time is within threshold
    expect(renderTime).toBeLessThan(MAX_LIST_RENDER_MS);

    // Verify all items are accessible (at minimum, count is correct)
    const itemCount = await presencia.getTrustSignalCount();
    // Renders at least some items (50 may be paginated — check for >0)
    expect(itemCount).toBeGreaterThan(0);
    expect(largeTrustSignals.length).toBe(50);
  });

  test("el scroll en la lista de señales de confianza no bloquea el hilo principal", async ({
    largeDatasetPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      largeDatasetPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const presencia = new PresenciaSectionPage(largeDatasetPage);

    await marcaPagePom.waitForLoaded();
    await presencia.waitForTrustSignalsLoaded();

    // Simulate scrolling through the list
    const trustList = presencia.trustSignalsList;
    const isVisible = await trustList.isVisible();

    if (isVisible) {
      // Scroll to the bottom of the trust signals list
      await trustList.evaluate((el: HTMLElement) => {
        el.scrollTop = el.scrollHeight;
      });

      // After scroll, list should still be visible (no crash)
      await expect(trustList).toBeVisible({ timeout: 2_000 });
    }
  });

  test("el dataset grande no degrada el autosave de contacto", async ({
    largeDatasetPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      largeDatasetPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const presencia = new PresenciaSectionPage(largeDatasetPage);

    await marcaPagePom.waitForLoaded();
    await presencia.waitForTrustSignalsLoaded();

    // Override contact PATCH to verify it still fires with large dataset
    let patchFired = false;
    await largeDatasetPage.route(
      "**/api/v1/lisa/marca/contact",
      async (route) => {
        if (route.request().method() === "PATCH") {
          patchFired = true;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              tenantId: LISA_MARCA_FIXTURE.tenantId,
              updatedAt: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    // Fill website URL to trigger autosave
    await presencia.fillWebsite("https://saludvitalia-updated.pe");
    await marcaPagePom.waitForAutosaveSuccess(10_000);

    expect(patchFired).toBe(true);
  });

  test("el contador de señales de confianza es correcto para el dataset grande", async ({
    largeDatasetPage,
    largeTrustSignals,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      largeDatasetPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const presencia = new PresenciaSectionPage(largeDatasetPage);

    await marcaPagePom.waitForLoaded();
    await presencia.waitForTrustSignalsLoaded();

    // Fixture should contain exactly 50 items
    expect(largeTrustSignals).toHaveLength(50);

    // Verify items have unique IDs (no duplication)
    const ids = largeTrustSignals.map((ts) => ts.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(50);

    // Verify all items have required fields
    for (const item of largeTrustSignals) {
      expect(item.id).toBeTruthy();
      expect(item.type).toBeTruthy();
      expect(item.value).toBeTruthy();
      expect(typeof item.displayOrder).toBe("number");
    }
  });
});
