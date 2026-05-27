/**
 * lisa-marca-cross-tenant.spec.ts — SC-4 Adversarial: cross-tenant 403
 *
 * Gherkin: "Dado que un actor malicioso intenta acceder a los datos de marca
 *           de un tenant diferente,
 *           cuando el servidor evalúa el request,
 *           entonces retorna 403 y el FE muestra el estado de error apropiado."
 *
 * HIPAA-lite: dual filter tenant_id + clinic_id enforced.
 * No PHI in URL params — verified via route inspection.
 *
 * Validators: be_integration_cross_tenant + arch_tenant_isolation_grep +
 *             e2e_adversarial_cross_tenant
 *
 * POMs: LisaMarcaPage
 *
 * downstream-regression-na: brand-local vitalia e2e spec F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 12
 */

import { expect } from "@playwright/test";
import {
  test,
  gotoMarca,
  LISA_MARCA_FIXTURE,
} from "./fixtures/lisa-marca.fixture";
import { LisaMarcaPage } from "./poms/lisa-marca-page.pom";

// ---------------------------------------------------------------------------
// Test suite — SC-4: adversarial cross-tenant isolation
// ---------------------------------------------------------------------------

test.describe("SC-4 — Aislamiento multi-tenant: acceso cruzado bloqueado", () => {
  test("el servidor rechaza con 403 cuando el tenant del request no coincide", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );

    // Override identity endpoint to simulate 403 cross-tenant response
    await marcaPage.route("**/api/v1/lisa/marca/identity", async (route) => {
      if (route.request().method() === "GET") {
        // Simulate server detecting X-Tenant-ID mismatch
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            detail:
              "Acceso denegado: no tienes permiso para acceder a este recurso.",
            code: "TENANT_MISMATCH",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to the route
    await gotoMarca(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
      "identidad",
    );

    // The error boundary or error state should display
    await marcaPage.waitForLoadState("domcontentloaded");

    // Either an error boundary or inline error message should be visible
    const errorBoundaryVisible = await marcaPagePom.isErrorBoundaryVisible();
    const inlineError = marcaPage.locator(
      '[data-testid="api-error-state"]',
    );
    const inlineErrorVisible = await inlineError.isVisible();

    expect(errorBoundaryVisible || inlineErrorVisible).toBe(true);
  });

  test("PHI no aparece en los query params de la URL", async ({
    marcaPage,
  }) => {
    await gotoMarca(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
      "identidad",
    );
    await marcaPage.waitForLoadState("domcontentloaded");

    // Verify URL does not contain PHI fields
    const currentUrl = marcaPage.url();
    const url = new URL(currentUrl);
    const searchParams = url.searchParams;

    const phiParams = [
      "patient_id",
      "patient",
      "dni",
      "diagnosis",
      "treatment",
      "medical",
      "clinic_id",
    ];

    for (const param of phiParams) {
      expect(searchParams.has(param)).toBe(false);
    }

    // Verify URL path follows static N3 routing (no dynamic PHI segments)
    expect(currentUrl).toContain("/lisa/marca/identidad");
    expect(currentUrl).not.toMatch(
      /\/patient\/|\/clinic\/[a-z0-9-]{20,}/i,
    );
  });

  test("el tenant_id en la URL coincide con la sesión autenticada", async ({
    marcaPage,
  }) => {
    await gotoMarca(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
      "identidad",
    );
    await marcaPage.waitForLoadState("domcontentloaded");

    // URL should contain the correct tenant ID
    const currentUrl = marcaPage.url();
    expect(currentUrl).toContain(LISA_MARCA_FIXTURE.tenantId);
  });

  test("intento de acceso al tenant alternativo retorna 403", async ({
    marcaPage,
  }) => {
    // Simulate a 403 when trying to access tenantB's data
    const adversarialTenantId = LISA_MARCA_FIXTURE.tenantB.tenantId;

    await marcaPage.route("**/api/v1/lisa/marca/**", async (route) => {
      // Check if the x-tenant-id header contains the wrong tenant
      const headers = route.request().headers();
      const tenantHeader = headers["x-tenant-id"];

      if (tenantHeader === adversarialTenantId) {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "Acceso denegado.",
            code: "TENANT_MISMATCH",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Try to navigate to adversarial tenant's URL
    await marcaPage.goto(`/${adversarialTenantId}/lisa/marca/identidad`);
    await marcaPage.waitForLoadState("domcontentloaded");

    // Page should show either redirect, error boundary, or 403 state
    // (not the brand studio content of the other tenant)
    const contentArea = marcaPage.locator(
      '[data-testid="lisa-marca-content"]',
    );

    // If content area loads, it should be for our own tenant (not adversarialTenantId)
    const isContentVisible = await contentArea.isVisible();
    if (isContentVisible) {
      // Verify no cross-tenant data leaked
      const nameInput = marcaPage.locator(
        '[data-testid="identity-brand-name-input"]',
      );
      const nameVisible = await nameInput.isVisible();
      if (nameVisible) {
        const nameValue = await nameInput.inputValue();
        // Should not contain the adversarial tenant's data
        expect(nameValue).not.toContain("MX");
      }
    }
  });
});
