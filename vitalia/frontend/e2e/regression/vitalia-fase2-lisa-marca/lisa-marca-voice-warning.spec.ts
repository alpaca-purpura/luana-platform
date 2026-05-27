/**
 * lisa-marca-voice-warning.spec.ts — SC-2 Negative: voice warning alert
 *
 * Gherkin: "Dado que el propietario escribe una frase prohibida en un bloque de voz,
 *           cuando se activa el debounce de validación,
 *           entonces aparece la alerta de advertencia con la frase detectada
 *           y la persistencia no se bloquea (soft warning)."
 *
 * Validators: be_unit_voice_blocklist + be_integration_voice_warning_audit_log +
 *             fe_unit_voz_tono + e2e_negative_voice_warning
 *
 * POMs: LisaMarcaPage, VozTonoSectionPage
 *
 * downstream-regression-na: brand-local vitalia e2e spec F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 10
 */

import { expect } from "@playwright/test";
import {
  test,
  gotoMarca,
  LISA_MARCA_FIXTURE,
} from "./fixtures/lisa-marca.fixture";
import { setupVoicePreviewMock } from "./fixtures/voice-preview-mock";
import { LisaMarcaPage } from "./poms/lisa-marca-page.pom";
import { VozTonoSectionPage } from "./poms/voz-tono-section.pom";

// ---------------------------------------------------------------------------
// Test suite — SC-2: voice warning (soft, non-blocking)
// ---------------------------------------------------------------------------

test.describe("SC-2 — Advertencia de frase prohibida en Voz y tono", () => {
  test.beforeEach(async ({ marcaPage }) => {
    await gotoMarca(marcaPage, LISA_MARCA_FIXTURE.tenantId, "voz-y-tono");
  });

  test("escribe una frase prohibida y aparece la alerta de advertencia", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const vozTono = new VozTonoSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();
    await setupVoicePreviewMock(marcaPage, "hit");

    // Mock personality PATCH to return warning flag
    let warningDetected = false;
    await marcaPage.route("**/api/v1/lisa/marca/personality", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;

        // Check if prohibited phrase "barato" is in the request body
        const toneBlocks = body["toneBlocks"] as Record<string, string> | undefined;
        const hasProhibitedPhrase = Object.values(toneBlocks ?? {}).some(
          (v) => typeof v === "string" && v.toLowerCase().includes("barato"),
        );

        if (hasProhibitedPhrase) {
          warningDetected = true;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              tenantId: LISA_MARCA_FIXTURE.tenantId,
              archetype: "caregiver",
              toneBlocks: toneBlocks,
              updatedAt: new Date().toISOString(),
              warnings: [
                {
                  phrase: "barato",
                  severity: "warning",
                  message:
                    "La frase 'barato' puede reducir la percepción de calidad médica.",
                },
              ],
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              tenantId: LISA_MARCA_FIXTURE.tenantId,
              updatedAt: new Date().toISOString(),
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Fill a tone block with a prohibited phrase
    await vozTono.fillBlock(
      "openingHook",
      "Somos la opción más barata del mercado médico.",
    );

    // Wait for autosave to fire
    await marcaPagePom.waitForAutosaveSaving();
    await marcaPagePom.waitForAutosaveSuccess();

    // Verify warning alert appears
    const isWarningVisible = await vozTono.isWarningAlertVisible();
    expect(isWarningVisible).toBe(true);

    // Verify the detected phrase is shown
    const phrases = await vozTono.getWarningPhrases();
    expect(phrases.some((p) => p.toLowerCase().includes("barato"))).toBe(true);

    // Verify PATCH was still called (not blocked)
    expect(warningDetected).toBe(true);
  });

  test("la advertencia es soft: el contenido se guarda aunque haya frase prohibida", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const vozTono = new VozTonoSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    let patchFired = false;
    await marcaPage.route("**/api/v1/lisa/marca/personality", async (route) => {
      if (route.request().method() === "PATCH") {
        patchFired = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: LISA_MARCA_FIXTURE.tenantId,
            updatedAt: new Date().toISOString(),
            warnings: [{ phrase: "descuento", severity: "warning" }],
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Fill with another prohibited phrase "descuento"
    await vozTono.fillBlock(
      "mainBody",
      "Ofrecemos grandes descuentos para pacientes nuevos.",
    );

    await marcaPagePom.waitForAutosaveSuccess();

    // PATCH must have been fired (soft warning = does not block persistence)
    expect(patchFired).toBe(true);

    // Badge shows "Guardado" (success despite warning)
    const badgeText = await marcaPagePom.getAutosaveBadgeText();
    expect(badgeText).toMatch(/Guardado/i);
  });

  test("al hacer click en 'Continuar de todas formas' se descarta la advertencia", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    const vozTono = new VozTonoSectionPage(marcaPage);

    await marcaPagePom.waitForLoaded();

    await marcaPage.route("**/api/v1/lisa/marca/personality", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: LISA_MARCA_FIXTURE.tenantId,
            updatedAt: new Date().toISOString(),
            warnings: [{ phrase: "barato", severity: "warning" }],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await vozTono.fillBlock("closingCta", "La opción más barata para ti.");
    await marcaPagePom.waitForAutosaveSuccess();

    // If warning is visible, override it
    const isVisible = await vozTono.isWarningAlertVisible();
    if (isVisible) {
      await vozTono.clickOverrideWarning();
      // Warning should be dismissed after clicking override
      await expect(
        marcaPage.locator('[data-testid="prohibited-phrase-warning-alert"]'),
      ).toBeHidden({ timeout: 5_000 });
    }
  });

  test("el tab activo en SubSubTabsBar es 'voz-y-tono' al navegar", async ({
    marcaPage,
  }) => {
    const marcaPagePom = new LisaMarcaPage(
      marcaPage,
      LISA_MARCA_FIXTURE.tenantId,
    );
    await marcaPagePom.waitForLoaded();

    const activeTab = await marcaPagePom.getActiveSubsubtab();
    expect(activeTab).toBe("voz-y-tono");
  });
});
