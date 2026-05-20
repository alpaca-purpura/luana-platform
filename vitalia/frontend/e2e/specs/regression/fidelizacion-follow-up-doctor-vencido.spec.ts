/**
 * fidelizacion-follow-up-doctor-vencido.spec.ts — SC-03 edge case
 *
 * Validator ID: e2e_regression_sc03
 * Story: vitalia-slice-1-fidelizacion
 *
 * Scenario (Gherkin SC-03):
 *   GIVEN C. Núñez tiene follow_up_due_at - now() = 2 días → urgency=PRÓXIMO
 *   WHEN operador ve tab Seguimiento médico
 *   THEN tarjeta de C. Núñez aparece con urgency=PRÓXIMO y "Vence en 2 días"
 *   WHEN operador envía template recordatorio_control_doctor
 *   THEN ConfirmTemplateModal abre
 *   AND al confirmar, tarjeta actualiza estado a ESPERANDO / enviado
 *
 *   ADDITIONAL EDGE: when days_until_due becomes negative (VENCIDO):
 *   THEN urgency badge updates to reflect overdue state
 *
 * Network: all API calls mocked.
 *
 * downstream-regression-na: brand-local E2E regression spec; no cross-brand consumers
 */

import { test, expect, SEED_IDS } from "../../fixtures/fidelizacion-seed.fixture";
import { FidelizacionPage } from "../../pages/fidelizacion.page";
import { collectConsoleErrors } from "../../auth.fixture";
import type { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helper: override the follow_up mock to simulate VENCIDO (days_until_due < 0)
// ---------------------------------------------------------------------------

async function setupVencidoMock(page: Page): Promise<void> {
  await page.route(
    `**/api/v1/vitalia/fidelization/re-engagement/patterns**pattern=follow_up**`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rows: [
            {
              re_engagement_event_id: SEED_IDS.eventIdFollowUp,
              patient_id: SEED_IDS.patientIdFollowUp,
              patient_name: "C. Núñez",
              pattern: "follow_up",
              // urgency escalates to "alert" when past due
              urgency: "alert",
              pattern_data: {
                kind: "follow_up",
                doctor_name: "Dr. Carlos Ortiz",
                follow_up_requested_duration: "3 meses",
                follow_up_set_at: "2026-02-15T10:00:00Z",
                follow_up_due_at: "2026-05-15T10:00:00Z",
                days_until_due: -5,
                follow_up_reason: "Control post-tratamiento ortodoncia",
              },
              acciones: [
                { id: "send_reminder", enabled: true, disabled_reason: null },
                { id: "suggest_slots", enabled: true, disabled_reason: null },
                { id: "pause_patient", enabled: true, disabled_reason: null },
                { id: "mark_external", enabled: true, disabled_reason: null },
                { id: "mark_no_continue", enabled: true, disabled_reason: null },
                { id: "call_manually", enabled: true, disabled_reason: null },
                { id: "open_conversation", enabled: true, disabled_reason: null },
              ],
            },
          ],
        }),
      });
    }
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("SC-03 — Seguimiento médico + urgencia PRÓXIMO/VENCIDO (C. Núñez)", () => {
  test("tarjeta C. Núñez aparece con urgencia PRÓXIMO en tab Seguimiento", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.gotoWithTab("followup");
    await fidelPage.waitForReady();

    const card = fidelPage.card("follow_up", seedIds.eventIdFollowUp);
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card).toContainText("C. Núñez");

    // Urgency: PRÓXIMO (2 days until due)
    await expect(
      fidelPage.cardUrgencyBadge("follow_up", seedIds.eventIdFollowUp)
    ).toContainText(/próximo/i);

    // Days until due visible
    await expect(card).toContainText(/vence en 2 días/i);
  });

  test("botón [Recordatorio Adrián] abre ConfirmTemplateModal", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.gotoWithTab("followup");
    await fidelPage.waitForReady();

    const sendBtn = fidelPage.cardSendReminderButton(
      "follow_up",
      seedIds.eventIdFollowUp
    );
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    await fidelPage.waitForConfirmTemplateModal();
    await expect(fidelPage.confirmTemplateModal).toContainText(
      /adrián enviará el siguiente mensaje/i
    );
  });

  test("confirmar envío actualiza estado de tarjeta", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const fidelPage = new FidelizacionPage(page);

    // Override send-proactive for follow_up patient
    await page.route(
      `**/api/v1/vitalia/fidelization/patients/${seedIds.patientIdFollowUp}/send-proactive`,
      async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              re_engagement_event_id: seedIds.eventIdFollowUp,
              status: "sent",
              conv_id: "conv-fidel-nunez-001",
            }),
          });
        } else {
          await route.continue();
        }
      }
    );

    await fidelPage.gotoWithTab("followup");
    await fidelPage.waitForReady();

    await fidelPage
      .cardSendReminderButton("follow_up", seedIds.eventIdFollowUp)
      .click();
    await fidelPage.waitForConfirmTemplateModal();
    await fidelPage.confirmTemplate();

    await expect(fidelPage.confirmTemplateModal).not.toBeVisible();
    await expect(page.getByText(/recordatorio enviado/i)).toBeVisible({
      timeout: 8_000,
    });

    expect(consoleErrors).toHaveLength(0);
  });

  test("urgencia VENCIDO muestra badge de alerta cuando follow_up pasó fecha", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    // Re-setup with vencido mock BEFORE navigation
    await setupVencidoMock(page);

    const fidelPage = new FidelizacionPage(page);
    await fidelPage.gotoWithTab("followup");
    await fidelPage.waitForReady();

    const card = fidelPage.card("follow_up", seedIds.eventIdFollowUp);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Urgency escalated to ALERTA when past due
    await expect(
      fidelPage.cardUrgencyBadge("follow_up", seedIds.eventIdFollowUp)
    ).toContainText(/alerta/i);

    // Days text shows overdue (negative = "Venció hace X días")
    await expect(card).toContainText(/venció hace 5 días/i);
  });

  test("SuggestSlotsModal abre y permite seleccionar turnos", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    await fidelPage.gotoWithTab("followup");
    await fidelPage.waitForReady();

    // Suggest slots button
    const suggestBtn = fidelPage.cardSuggestSlotsButton(
      "follow_up",
      seedIds.eventIdFollowUp
    );
    await expect(suggestBtn).toBeEnabled();
    await suggestBtn.click();

    await fidelPage.waitForSuggestSlotsModal();
    await expect(fidelPage.suggestSlotsModalTitle).toBeVisible();

    // At least 1 slot visible from mock
    await expect(
      fidelPage.suggestSlotsModal.getByText(/dr\. carlos ortiz/i)
    ).toBeVisible({ timeout: 8_000 });

    // Cancel without sending
    await fidelPage.suggestSlotsCancelButton.click();
    await expect(fidelPage.suggestSlotsModal).not.toBeVisible();
  });
});
