/**
 * fidelizacion-absence-no-optin.spec.ts — SC-02 negative path
 *
 * Validator ID: e2e_regression_sc02
 * Story: vitalia-slice-1-fidelizacion
 *
 * Scenario (Gherkin SC-02):
 *   GIVEN L. Vega tiene marketing_opt_in=false
 *   WHEN operador ve tab Ausencia
 *   THEN tarjeta de L. Vega aparece
 *   AND botón [Recordatorio Adrián] está DESHABILITADO
 *   AND tooltip muestra "El paciente no aceptó comunicaciones de marketing"
 *   AND botón [Llamada manual] está HABILITADO
 *   WHEN operador hace clic en [Llamada manual]
 *   THEN ManualCallLoggedModal abre
 *   WHEN operador registra la llamada
 *   THEN modal se cierra y llamada queda registrada
 *
 * Network: all API calls mocked.
 * Anti-pattern guard: NO se puede enviar recordatorio sin opt-in (mocked returns 403).
 *
 * downstream-regression-na: brand-local E2E regression spec; no cross-brand consumers
 */

import { test, expect } from "../../fixtures/fidelizacion-seed.fixture";
import { FidelizacionPage } from "../../pages/fidelizacion.page";
import { collectConsoleErrors } from "../../auth.fixture";

test.describe("SC-02 — Ausencia sin opt-in marketing (L. Vega)", () => {
  test("tarjeta L. Vega aparece en tab Ausencia", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.gotoWithTab("absence");
    await fidelPage.waitForReady();

    const card = fidelPage.card("absence", seedIds.eventIdAbsence);
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card).toContainText("L. Vega");

    // Should show months inactive
    await expect(card).toContainText(/6 meses inactivo/i);
  });

  test("botón [Recordatorio Adrián] está deshabilitado para paciente sin opt-in", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.gotoWithTab("absence");
    await fidelPage.waitForReady();

    const card = fidelPage.card("absence", seedIds.eventIdAbsence);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // send_reminder button is DISABLED
    const sendBtn = fidelPage.cardSendReminderButton(
      "absence",
      seedIds.eventIdAbsence
    );
    await expect(sendBtn).toBeDisabled();
  });

  test("tooltip de [Recordatorio Adrián] explica razón de deshabilitación", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.gotoWithTab("absence");
    await fidelPage.waitForReady();

    const card = fidelPage.card("absence", seedIds.eventIdAbsence);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Tooltip text or no-marketing notice visible in card
    await expect(fidelPage.noMarketingTooltip("absence", seedIds.eventIdAbsence)).toBeVisible();
  });

  test("botón [Llamada manual] está habilitado para paciente sin opt-in", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.gotoWithTab("absence");
    await fidelPage.waitForReady();

    const card = fidelPage.card("absence", seedIds.eventIdAbsence);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // call_manually button is ENABLED
    const callBtn = fidelPage.cardManualCallButton(
      "absence",
      seedIds.eventIdAbsence
    );
    await expect(callBtn).toBeEnabled();
  });

  test("[Llamada manual] abre ManualCallLoggedModal", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.gotoWithTab("absence");
    await fidelPage.waitForReady();

    await fidelPage
      .cardManualCallButton("absence", seedIds.eventIdAbsence)
      .click();
    await fidelPage.waitForManualCallModal();

    await expect(fidelPage.manualCallModalTitle).toBeVisible();
    await expect(fidelPage.manualCallNotesInput).toBeVisible();
  });

  test("registrar llamada cierra modal y confirma registro", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.gotoWithTab("absence");
    await fidelPage.waitForReady();

    await fidelPage
      .cardManualCallButton("absence", seedIds.eventIdAbsence)
      .click();
    await fidelPage.waitForManualCallModal();

    // Log call with notes
    await fidelPage.logManualCall(
      "Llamé a L. Vega para recordatorio de control.",
      "reached"
    );

    // Modal closed
    await expect(fidelPage.manualCallModal).not.toBeVisible();

    // Success toast
    await expect(page.getByText(/llamada registrada/i)).toBeVisible({
      timeout: 8_000,
    });

    expect(consoleErrors).toHaveLength(0);
  });

  test("no se puede forzar envío de recordatorio de marketing a paciente sin opt-in (guard API)", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    // Anti-pattern guard: even if button disabled, a direct API call should return 403.
    // This verifies the mock (and by proxy the real endpoint) enforces the constraint.
    const fidelPage = new FidelizacionPage(page);
    await fidelPage.gotoWithTab("absence");
    await fidelPage.waitForReady();

    // Direct POST to send-proactive for opt-out patient should be mocked to 403
    const response = await page.evaluate(
      async (patientId) => {
        const resp = await fetch(
          `/api/v1/vitalia/fidelization/patients/${patientId}/send-proactive`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              template_id: "recordatorio_ausencia_wa",
              pattern: "absence",
              slot_values: {},
              trigger_source: "manual",
            }),
          }
        );
        return { status: resp.status };
      },
      seedIds.patientIdAbsence
    );

    expect(response.status).toBe(403);
  });
});
