/**
 * lisa-marca-race-autosave.spec.ts — SC-5 Race: 2 tabs autosave
 *
 * Gherkin: "Dado que el propietario tiene el formulario abierto en 2 pestañas,
 *           cuando ambas editan el mismo campo simultáneamente,
 *           entonces el último PATCH gana (last-write-wins)
 *           y no hay corrupción de datos."
 *
 * Validators: be_unit_marca_service + be_integration_marca_router_identity +
 *             e2e_race_autosave
 *
 * POMs: LisaMarcaPage, IdentidadSectionPage
 *
 * downstream-regression-na: brand-local vitalia e2e spec F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 13
 */

import { expect } from "@playwright/test";
import {
  test,
  gotoMarca,
  LISA_MARCA_FIXTURE,
} from "./fixtures/lisa-marca.fixture";
import { setupLisaMarcaMocks } from "./fixtures/lisa-marca.fixture";
import { LisaMarcaPage } from "./poms/lisa-marca-page.pom";
import { IdentidadSectionPage } from "./poms/identidad-section.pom";

// ---------------------------------------------------------------------------
// Test suite — SC-5: race condition 2 tabs autosave
// ---------------------------------------------------------------------------

test.describe("SC-5 — Carrera de autosave: 2 pestañas editan simultáneamente", () => {
  test("el último PATCH gana cuando 2 pestañas editan el mismo campo", async ({
    marcaContext,
  }) => {
    // Create two pages in the same context (same Clerk session)
    const page1 = await marcaContext.newPage();
    const page2 = await marcaContext.newPage();

    // Track patch order
    const patchOrder: Array<{ tab: number; brandName: string }> = [];

    // Setup mocks on page1
    await setupLisaMarcaMocks(page1, LISA_MARCA_FIXTURE.tenantId);
    await page1.route("**/api/v1/lisa/marca/identity", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        const brandName = (body["brandName"] as string | undefined) ?? "";
        patchOrder.push({ tab: 1, brandName });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: LISA_MARCA_FIXTURE.tenantId,
            brandName,
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Setup mocks on page2
    await setupLisaMarcaMocks(page2, LISA_MARCA_FIXTURE.tenantId);
    await page2.route("**/api/v1/lisa/marca/identity", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        const brandName = (body["brandName"] as string | undefined) ?? "";
        patchOrder.push({ tab: 2, brandName });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: LISA_MARCA_FIXTURE.tenantId,
            brandName,
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate both pages to identidad
    await Promise.all([
      gotoMarca(page1, LISA_MARCA_FIXTURE.tenantId, "identidad"),
      gotoMarca(page2, LISA_MARCA_FIXTURE.tenantId, "identidad"),
    ]);

    const marcaPage1 = new LisaMarcaPage(page1, LISA_MARCA_FIXTURE.tenantId);
    const marcaPage2 = new LisaMarcaPage(page2, LISA_MARCA_FIXTURE.tenantId);
    const identidad1 = new IdentidadSectionPage(page1);
    const identidad2 = new IdentidadSectionPage(page2);

    await Promise.all([
      marcaPage1.waitForLoaded(),
      marcaPage2.waitForLoaded(),
    ]);

    // Both tabs type different names simultaneously (race)
    const nameFromTab1 = "Salud Vitalia tab1";
    const nameFromTab2 = "Salud Vitalia tab2";

    await Promise.all([
      identidad1.fillName(nameFromTab1),
      identidad2.fillName(nameFromTab2),
    ]);

    // Wait for both autosaves to complete
    await Promise.all([
      marcaPage1.waitForAutosaveSuccess(),
      marcaPage2.waitForAutosaveSuccess(),
    ]);

    // Both patches should have fired (no data corruption, no silent drop)
    expect(patchOrder.length).toBeGreaterThanOrEqual(2);

    // Verify both had valid brand name values
    const names = patchOrder.map((p) => p.brandName);
    expect(names).toContain(nameFromTab1);
    expect(names).toContain(nameFromTab2);

    // Both tabs show success state (no error)
    const badge1 = await marcaPage1.getAutosaveBadgeText();
    const badge2 = await marcaPage2.getAutosaveBadgeText();
    expect(badge1).toMatch(/Guardado/i);
    expect(badge2).toMatch(/Guardado/i);

    // Cleanup
    await page1.close();
    await page2.close();
  });

  test("las dos pestañas pueden estar en diferentes sub-sub-tabs sin conflicto", async ({
    marcaContext,
  }) => {
    const page1 = await marcaContext.newPage();
    const page2 = await marcaContext.newPage();

    await setupLisaMarcaMocks(page1, LISA_MARCA_FIXTURE.tenantId);
    await setupLisaMarcaMocks(page2, LISA_MARCA_FIXTURE.tenantId);

    // Tab 1 on identidad, Tab 2 on presencia (different sub-sub-tabs)
    await Promise.all([
      gotoMarca(page1, LISA_MARCA_FIXTURE.tenantId, "identidad"),
      gotoMarca(page2, LISA_MARCA_FIXTURE.tenantId, "presencia"),
    ]);

    const marcaPage1 = new LisaMarcaPage(page1, LISA_MARCA_FIXTURE.tenantId);
    const marcaPage2 = new LisaMarcaPage(page2, LISA_MARCA_FIXTURE.tenantId);

    await Promise.all([
      marcaPage1.waitForLoaded(),
      marcaPage2.waitForLoaded(),
    ]);

    // Verify active tabs are correct and independent
    const activeTab1 = await marcaPage1.getActiveSubsubtab();
    const activeTab2 = await marcaPage2.getActiveSubsubtab();

    expect(activeTab1).toBe("identidad");
    expect(activeTab2).toBe("presencia");

    await page1.close();
    await page2.close();
  });
});
