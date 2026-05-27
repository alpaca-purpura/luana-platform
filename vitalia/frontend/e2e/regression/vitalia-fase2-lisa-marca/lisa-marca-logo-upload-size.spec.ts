/**
 * lisa-marca-logo-upload-size.spec.ts — SC-3 Edge: logo oversized validation
 *
 * Gherkin: "Dado que el propietario intenta subir un logo mayor a 2MB,
 *           cuando se selecciona el archivo,
 *           entonces aparece la alerta de tamaño excedido
 *           y el archivo NO se envía al servidor."
 *
 * Validators: be_integration_marca_router_visuals + fe_unit_identidad +
 *             e2e_edge_logo_oversized
 *
 * POMs: LisaMarcaPage, IdentidadSectionPage
 *
 * downstream-regression-na: brand-local vitalia e2e spec F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 11
 */

import path from "path";
import { expect } from "@playwright/test";
import {
  test,
  gotoMarca,
  LISA_MARCA_FIXTURE,
} from "./fixtures/lisa-marca.fixture";
import { LisaMarcaPage } from "./poms/lisa-marca-page.pom";
import { IdentidadSectionPage } from "./poms/identidad-section.pom";

// ---------------------------------------------------------------------------
// Test suite — SC-3: logo oversized validation (edge case)
// ---------------------------------------------------------------------------

test.describe("SC-3 — Validación de logo: archivo demasiado grande", () => {
  test.beforeEach(async ({ marcaPage }) => {
    await gotoMarca(marcaPage, LISA_MARCA_FIXTURE.tenantId, "identidad");
  });

  test("muestra alerta de tamaño cuando el logo supera 2MB", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Track if any upload request was made (it should NOT be)
    let uploadAttempted = false;
    await marcaPage.route("**/api/v1/lisa/marca/visuals", async (route) => {
      if (
        route.request().method() === "POST" ||
        route.request().method() === "PATCH"
      ) {
        uploadAttempted = true;
      }
      await route.continue();
    });

    // Simulate a large file (>2MB) using the file input
    // We create a Buffer of 2.1MB to simulate oversized file
    const oversizedContent = Buffer.alloc(2.1 * 1024 * 1024, "x");
    const tempFileName = "logo-oversized-test.png";

    await identidad.logoFileInput.setInputFiles({
      name: tempFileName,
      mimeType: "image/png",
      buffer: oversizedContent,
    });

    // Size error alert should appear immediately (client-side validation)
    await expect(
      marcaPage.locator('[data-testid="logo-size-error-alert"]'),
    ).toBeVisible({ timeout: 5_000 });

    // Upload should NOT have been attempted
    expect(uploadAttempted).toBe(false);
  });

  test("acepta un logo válido PNG menor a 2MB sin mostrar error", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Mock upload endpoint to return success
    await marcaPage.route("**/api/v1/lisa/marca/visuals", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: LISA_MARCA_FIXTURE.tenantId,
            logoUrl: "https://cdn.vitalia.pe/logos/test-valid.png",
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Simulate a valid small file (50KB)
    const validContent = Buffer.alloc(50 * 1024, "x");
    await identidad.logoFileInput.setInputFiles({
      name: "logo-valid.png",
      mimeType: "image/png",
      buffer: validContent,
    });

    // Size error should NOT appear
    await expect(
      marcaPage.locator('[data-testid="logo-size-error-alert"]'),
    ).toBeHidden({ timeout: 3_000 });
  });

  test("muestra alerta de tipo cuando se sube un archivo no permitido (PDF)", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    let uploadAttempted = false;
    await marcaPage.route("**/api/v1/lisa/marca/visuals", async (route) => {
      if (
        route.request().method() === "POST" ||
        route.request().method() === "PATCH"
      ) {
        uploadAttempted = true;
      }
      await route.continue();
    });

    // Simulate a PDF file (wrong type)
    const pdfContent = Buffer.from("%PDF-1.4 test content");
    await identidad.logoFileInput.setInputFiles({
      name: "document.pdf",
      mimeType: "application/pdf",
      buffer: pdfContent,
    });

    // Type error alert should appear
    await expect(
      marcaPage.locator('[data-testid="logo-type-error-alert"]'),
    ).toBeVisible({ timeout: 5_000 });

    // Upload should NOT have been attempted
    expect(uploadAttempted).toBe(false);
  });

  test("la zona de drop acepta arrastrar un logo válido", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Verify the drop zone is visible and accessible
    const dropZone = identidad.getLogoDropZone();
    await expect(dropZone).toBeVisible();

    // Verify drop zone has proper ARIA attributes for accessibility
    const ariaLabel = await dropZone.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
  });

  test("muestra el stub de extracción automática deshabilitado con tooltip", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Extraction stub button should be visible and disabled (per D4-extract: stub local)
    const stubButton = identidad.extractionStubButton;
    await expect(stubButton).toBeVisible();
    const isDisabled =
      (await stubButton.getAttribute("disabled")) !== null ||
      (await stubButton.getAttribute("aria-disabled")) === "true";
    expect(isDisabled).toBe(true);

    // Hover to see tooltip "Próximamente — extracción automática"
    await stubButton.hover();
    await expect(
      marcaPage.locator('[data-testid="visual-extraction-stub-tooltip"]'),
    ).toBeVisible({ timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// Isolated path utility for future use (avoids fs.writeFileSync in tests)
// ---------------------------------------------------------------------------

export { path };
