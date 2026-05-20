/**
 * fidelizacion-multi-session-happy.spec.ts — SC-01 happy path
 *
 * Validator ID: e2e_regression_sc01
 * Story: vitalia-slice-1-fidelizacion
 *
 * Scenario (Gherkin SC-01):
 *   GIVEN operador ve tab Multisesión (default)
 *   AND M. Rodríguez aparece con urgencia=CRÍTICO (gap_days=31 > 30)
 *   WHEN operador hace clic en [Recordatorio Adrián]
 *   THEN ConfirmTemplateModal aparece con vista previa del mensaje
 *   WHEN operador confirma envío
 *   THEN modal se cierra
 *   AND tarjeta actualiza estado a "Recordatorio enviado"
 *   AND no hay errores de consola
 *
 * Network: all API calls mocked. send-proactive returns status=sent.
 *
 * downstream-regression-na: brand-local E2E regression spec; no cross-brand consumers
 */

import { test, expect } from "../../fixtures/fidelizacion-seed.fixture";
import { FidelizacionPage } from "../../pages/fidelizacion.page";
import { collectConsoleErrors } from "../../auth.fixture";

test.describe("SC-01 — Multi-sesión happy path (M. Rodríguez)", () => {
  test("tarjeta Rodríguez aparece con urgencia CRÍTICO", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.goto();
    await fidelPage.waitForReady();

    const card = fidelPage.card("multi_session", seedIds.eventIdMultiSession);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Urgency badge shows CRÍTICO
    await expect(fidelPage.cardUrgencyBadge("multi_session", seedIds.eventIdMultiSession)).toContainText(
      /crítico/i
    );

    // Progress: 4 de 12 sesiones
    await expect(card).toContainText(/4 de 12 sesiones/i);

    // Gap: >30 days without activity
    await expect(card).toContainText(/sin actividad hace 31 días/i);
  });

  test("botón [Recordatorio Adrián] abre ConfirmTemplateModal", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.goto();
    await fidelPage.waitForReady();

    const card = fidelPage.card("multi_session", seedIds.eventIdMultiSession);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Click send_reminder button
    const sendBtn = fidelPage.cardSendReminderButton(
      "multi_session",
      seedIds.eventIdMultiSession
    );
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // ConfirmTemplateModal appears
    await fidelPage.waitForConfirmTemplateModal();
    await expect(fidelPage.confirmTemplateTitle).toBeVisible();
    await expect(fidelPage.confirmTemplateModal).toContainText(
      /adrián enviará el siguiente mensaje/i
    );
  });

  test("confirmar envío cierra modal y tarjeta actualiza a estado enviado", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.goto();
    await fidelPage.waitForReady();

    // Open modal
    await fidelPage
      .cardSendReminderButton("multi_session", seedIds.eventIdMultiSession)
      .click();
    await fidelPage.waitForConfirmTemplateModal();

    // Confirm send — calls POST /send-proactive (mocked → status=sent)
    await fidelPage.confirmTemplate();

    // Modal closed
    await expect(fidelPage.confirmTemplateModal).not.toBeVisible();

    // Success toast or card status updated
    // The mock returns status=sent — component should update card state
    // to "Recordatorio enviado" or show a success toast
    await expect(page.getByText(/recordatorio enviado/i)).toBeVisible({
      timeout: 8_000,
    });

    // No unexpected console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test("cancelar modal no envía el recordatorio", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.goto();
    await fidelPage.waitForReady();

    await fidelPage
      .cardSendReminderButton("multi_session", seedIds.eventIdMultiSession)
      .click();
    await fidelPage.waitForConfirmTemplateModal();

    // Cancel — modal closes, no state change
    await fidelPage.cancelTemplate();
    await expect(fidelPage.confirmTemplateModal).not.toBeVisible();

    // Card still shows original urgency (not "sent" state)
    await expect(
      fidelPage.cardUrgencyBadge("multi_session", seedIds.eventIdMultiSession)
    ).toContainText(/crítico/i);
  });
});
