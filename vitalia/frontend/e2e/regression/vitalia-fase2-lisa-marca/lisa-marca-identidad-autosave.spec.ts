/**
 * lisa-marca-identidad-autosave.spec.ts — SC-1 Happy path: autosave identity
 *
 * Gherkin: "Dado que el propietario edita el nombre de la marca,
 *           cuando el debounce de 600ms expira,
 *           entonces el badge muestra 'Guardado' y el PATCH fue enviado."
 *
 * Validators: be_unit_marca_service + be_integration_marca_router_identity +
 *             fe_unit_identidad + e2e_happy_autosave
 *
 * POMs: LisaMarcaPage, IdentidadSectionPage
 *
 * downstream-regression-na: brand-local vitalia e2e spec F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 9
 */

import { expect } from "@playwright/test";
import {
  test,
  gotoMarca,
  LISA_MARCA_FIXTURE,
} from "./fixtures/lisa-marca.fixture";
import { LisaMarcaPage } from "./poms/lisa-marca-page.pom";
import { IdentidadSectionPage } from "./poms/identidad-section.pom";

// ---------------------------------------------------------------------------
// Test suite — SC-1: happy autosave identity
// ---------------------------------------------------------------------------

test.describe("SC-1 — Autosave identidad: nombre de marca", () => {
  test.beforeEach(async ({ marcaPage }) => {
    // Navigate to identidad sub-sub-tab
    await gotoMarca(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
      "identidad",
    );
  });

  test("edita el nombre de la marca y el autosave persiste en 600ms", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    // Wait for initial load
    await marcaPagePom.waitForLoaded();

    // Capture outgoing PATCH requests
    let patchCalled = false;
    let patchBody: Record<string, unknown> = {};

    await marcaPage.route(
      "**/api/v1/lisa/marca/identity",
      async (route) => {
        if (route.request().method() === "PATCH") {
          patchCalled = true;
          patchBody = JSON.parse(
            route.request().postData() ?? "{}",
          ) as Record<string, unknown>;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              tenantId: LISA_MARCA_FIXTURE.tenantId,
              brandName: patchBody["brandName"] as string,
              updatedAt: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    // Fill new brand name
    const newName = "Salud Vitalia Premium";
    await identidad.fillName(newName);

    // Wait for autosave saving state (debounce initiated)
    await marcaPagePom.waitForAutosaveSaving();

    // Wait for autosave success (PATCH fired + response received)
    await marcaPagePom.waitForAutosaveSuccess();

    // Verify PATCH was called with the new name
    expect(patchCalled).toBe(true);
    expect(patchBody["brandName"]).toBe(newName);

    // Verify badge shows "Guardado"
    const badgeText = await marcaPagePom.getAutosaveBadgeText();
    expect(badgeText).toMatch(/Guardado/i);
  });

  test("edita el tagline y el badge de autosave transiciona a estado guardado", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Spy on PATCH requests
    const patchRequests: string[] = [];
    await marcaPage.route("**/api/v1/lisa/marca/identity", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        patchRequests.push(
          (body["tagline"] as string | undefined) ?? "",
        );
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
    });

    const newTagline = "Tu salud, nuestro compromiso permanente";
    await identidad.fillTagline(newTagline);

    await marcaPagePom.waitForAutosaveSuccess();

    expect(patchRequests.length).toBeGreaterThan(0);
    expect(patchRequests[patchRequests.length - 1]).toBe(newTagline);
  });

  test("el tab activo en SubSubTabsBar es 'identidad' al navegar directamente", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );

    await marcaPagePom.waitForLoaded();

    const activeTab = await marcaPagePom.getActiveSubsubtab();
    expect(activeTab).toBe("identidad");
  });

  test("los datos del seed de identidad se cargan correctamente al montar", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Verify seed data is pre-populated
    const nameValue = await identidad.getNameInputValue();
    expect(nameValue).toBe(LISA_MARCA_FIXTURE.identity.brandName);
  });
});
