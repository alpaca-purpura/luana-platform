/**
 * lisa-marca-autosave-timeout.spec.ts — SC-7 Network failure / autosave timeout
 *
 * Gherkin: "Dado que el propietario edita el nombre de la marca
 *           y la red falla durante el autosave,
 *           cuando el debounce expira y el PATCH es rechazado,
 *           entonces el badge muestra el estado de error
 *           y el usuario puede reintentar."
 *
 * Validators: e2e_network_failure + fe_unit_marca_hooks
 *
 * POMs: LisaMarcaPage
 *
 * downstream-regression-na: brand-local vitalia e2e spec F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 15
 */

import { expect } from "@playwright/test";
import {
  test,
  gotoMarca,
  LISA_MARCA_FIXTURE,
} from "./fixtures/lisa-marca.fixture";
import {
  abortAutosaveRoute,
  restoreNetworkForEndpoint,
} from "./fixtures/network-failure";
import { LisaMarcaPage } from "./poms/lisa-marca-page.pom";
import { IdentidadSectionPage } from "./poms/identidad-section.pom";

// ---------------------------------------------------------------------------
// Test suite — SC-7: network failure / autosave timeout
// ---------------------------------------------------------------------------

test.describe("SC-7 — Falla de red durante el autosave", () => {
  test.beforeEach(async ({ marcaPage }) => {
    await gotoMarca(marcaPage, LISA_MARCA_FIXTURE.tenantId, "identidad");
  });

  test("el badge muestra estado de error cuando la red aborta el PATCH", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Wire network abort for identity PATCH
    await abortAutosaveRoute(marcaPage, "identity", "abort");

    // Edit the field to trigger autosave
    await identidad.fillName("Salud Vitalia — nombre que no se guardará");

    // Wait for autosave to attempt and fail
    await marcaPagePom.waitForAutosaveError();

    // Verify badge shows error state
    const badgeText = await marcaPagePom.getAutosaveBadgeText();
    expect(badgeText).toBeTruthy();
    expect(badgeText).not.toMatch(/Guardado$/i);
  });

  test("el badge muestra error cuando el servidor retorna 503", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Wire 503 response for identity PATCH
    await abortAutosaveRoute(marcaPage, "identity", "serviceUnavailable");

    await identidad.fillName("Nombre que genera 503");
    await marcaPagePom.waitForAutosaveError();

    const badgeText = await marcaPagePom.getAutosaveBadgeText();
    expect(badgeText).not.toMatch(/Guardado$/i);

    const errorAlert = marcaPage.locator(
      '[data-testid="autosave-error-message"]',
    );
    const isErrorVisible = await errorAlert.isVisible();
    if (isErrorVisible) {
      const errorText = await errorAlert.textContent();
      expect(errorText).toBeTruthy();
    }
  });

  test("tras restaurar la red, el reintento de autosave tiene éxito", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Step 1: abort network
    await abortAutosaveRoute(marcaPage, "identity", "abort");

    await identidad.fillName("Primer intento fallido");
    await marcaPagePom.waitForAutosaveError();

    // Step 2: restore network
    await restoreNetworkForEndpoint(marcaPage, "identity");
    await marcaPage.route("**/api/v1/lisa/marca/identity", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: LISA_MARCA_FIXTURE.tenantId,
            brandName: body["brandName"],
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Step 3: edit again to trigger retry autosave
    await identidad.fillName("Segundo intento exitoso");
    await marcaPagePom.waitForAutosaveSuccess();

    const badgeText = await marcaPagePom.getAutosaveBadgeText();
    expect(badgeText).toMatch(/Guardado/i);
  });

  test("el badge de autosave muestra estado guardando durante la espera", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Slow but successful response (simulate high latency)
    await marcaPage.route("**/api/v1/lisa/marca/identity", async (route) => {
      if (route.request().method() === "PATCH") {
        // Slight delay to allow observing the "saving" state
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
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

    await identidad.fillName("Guardando con latencia");

    // Should pass through "saving" state before reaching "saved"
    await marcaPagePom.waitForAutosaveSaving();
    await marcaPagePom.waitForAutosaveSuccess();

    const badgeText = await marcaPagePom.getAutosaveBadgeText();
    expect(badgeText).toMatch(/Guardado/i);
  });
});
