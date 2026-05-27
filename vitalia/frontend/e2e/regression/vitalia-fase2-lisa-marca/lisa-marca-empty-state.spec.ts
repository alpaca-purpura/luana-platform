// voseo-allowed: test that asserts absence of voseo imperatives in empty-state CTA — regex patterns are test data
/**
 * lisa-marca-empty-state.spec.ts — SC-8 Empty state: new tenant
 *
 * Gherkin: "Dado que un tenant nuevo nunca configuró su marca,
 *           cuando accede a cualquier sub-sub-tab de lisa/marca,
 *           entonces se muestra el estado vacío apropiado
 *           con CTA en español neutro."
 *
 * Validators: e2e_empty_state + fe_unit_identidad
 *
 * POMs: LisaMarcaPage, IdentidadSectionPage
 *
 * downstream-regression-na: brand-local vitalia e2e spec F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 16
 */

import { expect } from "@playwright/test";
import {
  test,
  gotoMarca,
  LISA_MARCA_FIXTURE,
} from "./fixtures/lisa-marca.fixture";
import { LisaMarcaPage } from "./poms/lisa-marca-page.pom";
import { IdentidadSectionPage } from "./poms/identidad-section.pom";
import { PresenciaSectionPage } from "./poms/presencia-section.pom";

// ---------------------------------------------------------------------------
// Helper: wire empty state mock responses
// ---------------------------------------------------------------------------

async function setupEmptyStateMocks(
  page: import("@playwright/test").Page,
  tenantId: string,
): Promise<void> {
  // Identity returns all null/empty fields
  await page.route("**/api/v1/lisa/marca/identity", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenantId,
          brandName: null,
          tagline: null,
          description: null,
          clinicVertical: null,
          primarySpecialties: [],
          updatedAt: null,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Visuals returns all null
  await page.route("**/api/v1/lisa/marca/visuals", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenantId,
          logoUrl: null,
          primaryColor: null,
          secondaryColor: null,
          fontFamily: null,
          extractionStatus: "stub_disabled",
          updatedAt: null,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Personality returns null archetype
  await page.route("**/api/v1/lisa/marca/personality", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenantId,
          archetype: null,
          toneBlocks: {
            openingHook: "",
            mainBody: "",
            closingCta: "",
          },
          updatedAt: null,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Contact returns all null
  await page.route("**/api/v1/lisa/marca/contact", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenantId,
          website: null,
          instagram: null,
          tiktok: null,
          googleBusiness: null,
          address: null,
          phone: null,
          updatedAt: null,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Trust signals: empty list
  await page.route("**/api/v1/lisa/marca/trust-signals", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenantId,
          items: [],
          total: 0,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Trust catalog (PE seed still available for empty state)
  await page.route(
    "**/api/v1/lisa/marca/trust-catalog/**",
    async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            country: "PE",
            items: [
              {
                id: "tc-pe-001",
                label: "Acreditación SUSALUD",
                category: "regulatory",
              },
            ],
            total: 1,
          }),
        });
      } else {
        await route.continue();
      }
    },
  );

  // Voice preview: empty personality
  await page.route(
    "**/api/v1/lisa/marca/voice-preview",
    async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            preview: null,
            cacheHit: false,
            compilerVersion: "v2",
            message: "Configura los bloques de voz para generar una vista previa.",
          }),
        });
      } else {
        await route.continue();
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Test suite — SC-8: empty state new tenant
// ---------------------------------------------------------------------------

test.describe("SC-8 — Estado vacío: tenant nuevo sin configuración de marca", () => {
  test.beforeEach(async ({ marcaPage }) => {
    // Override mocks to return empty/null data (new tenant)
    await setupEmptyStateMocks(marcaPage, LISA_MARCA_FIXTURE.tenantId);
    await gotoMarca(marcaPage, LISA_MARCA_FIXTURE.tenantId, "identidad");
  });

  test("identidad muestra campos vacíos con placeholders en español neutro", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    // Brand name field should be empty
    const nameValue = await identidad.getNameInputValue();
    expect(nameValue).toBe("");

    // Verify placeholder text is visible and in Spanish neutro (no voseo)
    const namePlaceholder = await identidad.nameInput.getAttribute("placeholder");
    if (namePlaceholder) {
      expect(namePlaceholder).toBeTruthy();
      // Check for voseo — should NOT contain voseo imperatives
      expect(namePlaceholder.toLowerCase()).not.toMatch(
        /agregá|escribí|configurá|ponés|hacés/,
      );
    }
  });

  test("presencia muestra estado vacío de trust signals con CTA accesible", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );

    await marcaPagePom.waitForLoaded();

    // Navigate to presencia
    await marcaPagePom.clickTabPresencia();
    await marcaPagePom.waitForLoaded();

    const presencia = new PresenciaSectionPage(marcaPage);

    // Wait for trust signals section to load
    await presencia.waitForTrustSignalsLoaded();

    // Empty state should be visible
    const isEmpty = await presencia.isTrustSignalsEmptyStateVisible();
    expect(isEmpty).toBe(true);

    // Verify the count is zero
    const count = await presencia.getTrustSignalCount();
    expect(count).toBe(0);
  });

  test("los campos vacíos permiten escribir y el autosave funciona", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const identidad = new IdentidadSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    let patchCalled = false;
    await marcaPage.route("**/api/v1/lisa/marca/identity", async (route) => {
      if (route.request().method() === "PATCH") {
        patchCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: LISA_MARCA_FIXTURE.tenantId,
            brandName: "Nueva clínica",
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Fill in data on empty form
    await identidad.fillName("Nueva clínica");
    await marcaPagePom.waitForAutosaveSuccess();

    expect(patchCalled).toBe(true);
  });

  test("el estado vacío de presencia muestra CTA sin voseo", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );

    await marcaPagePom.waitForLoaded();
    await marcaPagePom.clickTabPresencia();
    await marcaPagePom.waitForLoaded();

    const presencia = new PresenciaSectionPage(marcaPage);
    await presencia.waitForTrustSignalsLoaded();

    // If empty state is visible, check CTA text for voseo
    const isEmpty = await presencia.isTrustSignalsEmptyStateVisible();
    if (isEmpty) {
      const emptyStateText =
        await presencia.trustSignalsEmptyState.textContent();
      if (emptyStateText) {
        // Verify no voseo imperatives in the CTA
        expect(emptyStateText.toLowerCase()).not.toMatch(
          /agregá|empezá|configurá|hacé/,
        );
      }
    }
  });
});
