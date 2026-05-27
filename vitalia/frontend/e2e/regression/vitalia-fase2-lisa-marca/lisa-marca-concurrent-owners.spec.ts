/**
 * lisa-marca-concurrent-owners.spec.ts — SC-6 Concurrent owners
 *
 * Gherkin: "Dado que dos administradores del mismo tenant editan la marca
 *           al mismo tiempo desde contextos de browser separados,
 *           cuando ambos hacen cambios en personalidad,
 *           entonces ambos reciben confirmación de guardado
 *           y la vista previa de voz se actualiza correctamente."
 *
 * Validators: be_integration_marca_router_personality + e2e_concurrent_owners
 *
 * POMs: LisaMarcaPage, VozTonoSectionPage
 *
 * downstream-regression-na: brand-local vitalia e2e spec F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 14
 */

import { expect } from "@playwright/test";
import { test as base } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import path from "path";
import {
  LISA_MARCA_FIXTURE,
  gotoMarca,
  setupLisaMarcaMocks,
} from "./fixtures/lisa-marca.fixture";
import { setupVoicePreviewMock } from "./fixtures/voice-preview-mock";
import { LisaMarcaPage } from "./poms/lisa-marca-page.pom";
import { VozTonoSectionPage } from "./poms/voz-tono-section.pom";

const STORAGE_STATE_PATH = path.join(
  __dirname,
  "../../../playwright/.clerk/user.json",
);

// ---------------------------------------------------------------------------
// Extended fixture for 2 independent browser contexts (2 owners)
// ---------------------------------------------------------------------------

const test = base.extend<{
  ownerAPage: import("@playwright/test").Page;
  ownerBPage: import("@playwright/test").Page;
}>({
  ownerAPage: async ({ browser: br }, use) => {
    const contextA = await br.newContext({
      storageState: STORAGE_STATE_PATH,
    });
    const page = await contextA.newPage();
    await setupClerkTestingToken({ page });
    await setupLisaMarcaMocks(page, LISA_MARCA_FIXTURE.tenantId);
    await use(page);
    await page.close();
    await contextA.close();
  },

  ownerBPage: async ({ browser: br }, use) => {
    const contextB = await br.newContext({
      storageState: STORAGE_STATE_PATH,
    });
    const page = await contextB.newPage();
    await setupClerkTestingToken({ page });
    await setupLisaMarcaMocks(page, LISA_MARCA_FIXTURE.tenantId);
    await use(page);
    await page.close();
    await contextB.close();
  },
});

// ---------------------------------------------------------------------------
// Test suite — SC-6: concurrent owners
// ---------------------------------------------------------------------------

test.describe("SC-6 — Propietarios simultáneos: edición concurrente de personalidad", () => {
  test("dos administradores pueden editar personalidad y ambos reciben confirmación de guardado", async ({
    ownerAPage,
    ownerBPage,
  }) => {
    // Both navigate to voz-y-tono
    await Promise.all([
      gotoMarca(ownerAPage, LISA_MARCA_FIXTURE.tenantId, "voz-y-tono"),
      gotoMarca(ownerBPage, LISA_MARCA_FIXTURE.tenantId, "voz-y-tono"),
    ]);

    const marcaA = new LisaMarcaPage(ownerAPage, LISA_MARCA_FIXTURE.tenantId);
    const marcaB = new LisaMarcaPage(ownerBPage, LISA_MARCA_FIXTURE.tenantId);
    const vozTonoA = new VozTonoSectionPage(ownerAPage);
    const vozTonoB = new VozTonoSectionPage(ownerBPage);

    await Promise.all([marcaA.waitForLoaded(), marcaB.waitForLoaded()]);

    // Owner A selects "sage" archetype; Owner B selects "healer" archetype
    const patchesReceived: Array<{ owner: string; archetype: string }> = [];

    await ownerAPage.route("**/api/v1/lisa/marca/personality", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        patchesReceived.push({
          owner: "A",
          archetype: (body["archetype"] as string | undefined) ?? "",
        });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: LISA_MARCA_FIXTURE.tenantId,
            archetype: body["archetype"],
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    await ownerBPage.route("**/api/v1/lisa/marca/personality", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        patchesReceived.push({
          owner: "B",
          archetype: (body["archetype"] as string | undefined) ?? "",
        });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: LISA_MARCA_FIXTURE.tenantId,
            archetype: body["archetype"],
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Concurrent archetype selection
    await Promise.all([
      vozTonoA.selectArchetype("sage"),
      vozTonoB.selectArchetype("healer"),
    ]);

    // Both should receive autosave success
    await Promise.all([
      marcaA.waitForAutosaveSuccess(),
      marcaB.waitForAutosaveSuccess(),
    ]);

    // Both should have a success badge
    const badgeA = await marcaA.getAutosaveBadgeText();
    const badgeB = await marcaB.getAutosaveBadgeText();
    expect(badgeA).toMatch(/Guardado/i);
    expect(badgeB).toMatch(/Guardado/i);

    // Both patches should have been sent
    expect(patchesReceived.length).toBeGreaterThanOrEqual(2);
    const archetypesSent = patchesReceived.map((p) => p.archetype);
    expect(archetypesSent).toContain("sage");
    expect(archetypesSent).toContain("healer");
  });

  test("la vista previa de voz se actualiza cuando el owner A cambia el arquetipo", async ({
    ownerAPage,
  }) => {
    await gotoMarca(ownerAPage, LISA_MARCA_FIXTURE.tenantId, "voz-y-tono");

    const marcaA = new LisaMarcaPage(ownerAPage, LISA_MARCA_FIXTURE.tenantId);
    const vozTonoA = new VozTonoSectionPage(ownerAPage);

    await marcaA.waitForLoaded();

    // Setup voice preview as cache miss (fresh compile after personality change)
    await setupVoicePreviewMock(ownerAPage, "cacheInvalidation");

    // Override personality PATCH
    await ownerAPage.route(
      "**/api/v1/lisa/marca/personality",
      async (route) => {
        if (route.request().method() === "PATCH") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              tenantId: LISA_MARCA_FIXTURE.tenantId,
              archetype: "sage",
              updatedAt: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    // Select new archetype
    await vozTonoA.selectArchetype("sage");
    await marcaA.waitForAutosaveSuccess();

    // Voice preview should update (cache invalidation)
    await vozTonoA.waitForPreviewLoaded();

    // Verify preview content is visible
    const previewSamples = await vozTonoA.getPreviewSamples();
    expect(previewSamples.openingHook).toBeTruthy();
  });
});
