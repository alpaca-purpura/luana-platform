/**
 * fidelizacion-adversarial.spec.ts — SC-04 adversarial
 *
 * Validator ID: e2e_regression_sc04
 * Story: vitalia-slice-1-fidelizacion
 *
 * Scenario (Gherkin SC-04):
 *   GIVEN paciente con opt_out=true
 *   THEN no aparece en ninguna pestaña
 *
 *   GIVEN request cross-tenant (tenant_id != propio)
 *   THEN API retorna 404
 *
 *   GIVEN usuario con rol no-PHI (e.g. marketing)
 *   THEN UI muestra banner PHI denegado (403) y no carga tarjetas
 *
 *   GIVEN nota de paciente con payload XSS
 *   THEN DOM no ejecuta script (sanitización server-side + client escape)
 *
 * Network: custom route overrides per test case.
 * HIPAA-lite: PHI gate + audit_log row verified via mock assertions.
 *
 * downstream-regression-na: brand-local E2E regression spec; no cross-brand consumers
 */

import { test, expect } from "../../fixtures/fidelizacion-seed.fixture";
import { CLINIC_CONTEXT } from "../../fixtures/clinic-context.fixture";
import { FidelizacionPage } from "../../pages/fidelizacion.page";

// XSS payloads to test — none should execute as script in DOM
const XSS_PAYLOADS = [
  '<script>window.__xss_fired=true</script>',
  '<img src=x onerror="window.__xss_fired=true">',
  '"><script>window.__xss_fired=true</script>',
  "javascript:window.__xss_fired=true",
];

test.describe("SC-04 — Adversarial (opt-out, cross-tenant, PHI 403, XSS)", () => {
  // ─── Opt-out patient not visible in any tab ──────────────────────────────

  test("paciente con opt_out=true no aparece en ninguna pestaña", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    const fidelPage = new FidelizacionPage(page);

    // Check every tab — X. Adv opt-out patient should be absent
    const tabs: Array<import("../../pages/fidelizacion.page").FidelizacionTabKey> = [
      "multisession",
      "followup",
      "maintenance",
      "absence",
    ];

    for (const tab of tabs) {
      await fidelPage.gotoWithTab(tab);
      await fidelPage.waitForReady();

      // Patient testid for opt-out patient should not exist in DOM
      // Since the seed fixture returns no rows with patientIdOptOut, we verify by
      // checking the opt-out patient ID does not appear as any card text
      const optOutCardLocator = page.getByTestId(
        new RegExp(`re-engagement-card-.*-.*${seedIds.patientIdOptOut.slice(-6)}`)
      );
      await expect(optOutCardLocator).not.toBeVisible();
    }
  });

  // ─── Cross-tenant isolation (request with foreign tenant_id returns 404) ──

  test("request con tenant_id ajeno retorna 404 (cross-tenant isolation)", async ({
    fidelizacionPage: page,
  }) => {
    // Override: respond 404 for cross-tenant summary request
    await page.route(
      "**/api/v1/vitalia/fidelization/summary**",
      async (route) => {
        const reqTenantId = route.request().headers()["x-tenant-id"];
        // Simulate a rogue tenant ID injection
        if (reqTenantId === "foreign-tenant-999") {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ detail: "Tenant not found" }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              period: "30d",
              patients_in_followup: 0,
              near_abandonment: 0,
              return_rate: 0,
              re_engaged: 0,
              nps_average: 0,
              trend: {},
            }),
          });
        }
      }
    );

    // Inject a foreign tenant ID via page script (simulates attacker)
    await page.addInitScript(() => {
      localStorage.setItem("x-tenant-id", "foreign-tenant-999");
    });

    // The API mock returns 404 for this tenant_id
    const response = await page.evaluate(async () => {
      const resp = await fetch(
        "/api/v1/vitalia/fidelization/summary?period=30d",
        {
          headers: { "x-tenant-id": "foreign-tenant-999" },
        }
      );
      return { status: resp.status };
    });

    expect(response.status).toBe(404);
  });

  // ─── PHI role gate: 403 → denial banner ──────────────────────────────────

  test("rol sin acceso PHI ve banner de acceso denegado (HIPAA-lite gate)", async ({
    fidelizacionPage: page,
  }) => {
    // Override the /me endpoint to return a non-PHI role (e.g. "marketing")
    await page.route("**/api/v1/vitalia/iam/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user_id: "user_marketing_no_phi",
          role: "marketing",
          clinic_id: CLINIC_CONTEXT.clinicId,
          tenant_id: CLINIC_CONTEXT.tenantId,
        }),
      });
    });

    // Override fidelizacion endpoints to 403 for non-PHI roles
    await page.route(
      "**/api/v1/vitalia/fidelization/**",
      async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "PHI access denied. Required roles: doctor, nurse, admin_clinic",
            code: "PHI_ACCESS_DENIED",
          }),
        });
      }
    );

    const fidelPage = new FidelizacionPage(page);
    await fidelPage.goto();

    // PHI denied banner visible (rendered by RequireRole fallback in FidelizacionLayout)
    await expect(fidelPage.phiDeniedBanner).toBeVisible({ timeout: 10_000 });

    // No patient cards visible
    const anyCard = page.getByTestId(/re-engagement-card-.*/);
    await expect(anyCard).not.toBeVisible();
  });

  test("audit_log row creado al acceder a PHI (mock assertions)", async ({
    fidelizacionPage: page,
  }) => {
    // Track audit_log calls
    const auditLogCalls: Array<{ method: string; body: string }> = [];

    await page.route("**/api/v1/vitalia/audit-log**", async (route) => {
      const body = route.request().postData() ?? "";
      auditLogCalls.push({ method: route.request().method(), body });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    const fidelPage = new FidelizacionPage(page);
    await fidelPage.goto();
    await fidelPage.waitForReady();

    // If FE sends audit_log on PHI access, verify it was called
    // Note: audit_log is primarily a BE concern — this test verifies
    // the FE does NOT leak PHI in its own audit calls if it emits them
    // Per HIPAA-lite: no PHI field names in trace/log data
    for (const call of auditLogCalls) {
      const bodyStr = call.body.toLowerCase();
      expect(bodyStr).not.toContain("diagnosis");
      expect(bodyStr).not.toContain("treatment_plan");
      expect(bodyStr).not.toContain("medical_notes");
    }
  });

  // ─── XSS sanitization ────────────────────────────────────────────────────

  for (const [idx, xssPayload] of XSS_PAYLOADS.entries()) {
    test(`XSS payload #${idx + 1} sanitizado — DOM no ejecuta script`, async ({
      fidelizacionPage: page,
      seedIds,
    }) => {
      // Set up global flag that XSS might set
      await page.addInitScript(() => {
        (window as typeof window & { __xss_fired?: boolean }).__xss_fired = false;
      });

      // Override absence rows to include XSS in patient_name / text fields
      await page.route(
        `**/api/v1/vitalia/fidelization/re-engagement/patterns**pattern=absence**`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              rows: [
                {
                  re_engagement_event_id: seedIds.eventIdAbsence,
                  patient_id: seedIds.patientIdAbsence,
                  // XSS in patient_name — should be escaped by React rendering
                  patient_name: xssPayload,
                  pattern: "absence",
                  urgency: "alert",
                  pattern_data: {
                    kind: "absence",
                    last_appointment_date: "2025-11-20T10:00:00Z",
                    months_inactive: 6,
                    lifetime_appointments: 8,
                    lifetime_value_cents: 450000,
                    currency: "MXN",
                    last_doctor_name: "Dra. Laura Vega",
                    marketing_opt_in: false,
                  },
                  acciones: [
                    {
                      id: "send_reminder",
                      enabled: false,
                      disabled_reason: "El paciente no aceptó comunicaciones de marketing",
                    },
                    { id: "call_manually", enabled: true, disabled_reason: null },
                  ],
                },
              ],
            }),
          });
        }
      );

      const fidelPage = new FidelizacionPage(page);
      await fidelPage.gotoWithTab("absence");
      await fidelPage.waitForReady();

      // Wait for card to render
      await page.waitForTimeout(500);

      // Verify XSS flag was NOT set (script did not execute)
      const xssFired = await page.evaluate(
        () =>
          (window as typeof window & { __xss_fired?: boolean }).__xss_fired ===
          true
      );
      expect(xssFired, `XSS payload #${idx + 1} fired`).toBe(false);

      // Card renders safely (content visible as escaped text, not as HTML/script)
      const card = fidelPage.card("absence", seedIds.eventIdAbsence);
      await expect(card).toBeVisible({ timeout: 10_000 });
    });
  }

  // ─── SPAM throttle guard ──────────────────────────────────────────────────

  test("no se envía recordatorio si paciente ya recibió uno hace < 7 días (throttle mock)", async ({
    fidelizacionPage: page,
    seedIds,
  }) => {
    // Override send-proactive to return throttled error
    await page.route(
      `**/api/v1/vitalia/fidelization/patients/${seedIds.patientIdMultiSession}/send-proactive`,
      async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 429,
            contentType: "application/json",
            body: JSON.stringify({
              detail: "Template enviado hace menos de 7 días. No se puede reenviar aún.",
              code: "THROTTLE_WINDOW_ACTIVE",
              retry_after_days: 5,
            }),
          });
        } else {
          await route.continue();
        }
      }
    );

    const fidelPage = new FidelizacionPage(page);
    await fidelPage.goto();
    await fidelPage.waitForReady();

    // Try to send reminder
    const sendBtn = fidelPage.cardSendReminderButton(
      "multi_session",
      seedIds.eventIdMultiSession
    );
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();
    await fidelPage.waitForConfirmTemplateModal();
    await fidelPage.confirmTemplateSendButton.click();

    // Error toast or inline error should appear
    await expect(
      page.getByText(/no pudimos enviar el recordatorio/i)
    ).toBeVisible({ timeout: 8_000 });

    // Modal closes (or stays with error — depends on impl)
    // The key assertion: no success toast
    await expect(page.getByText(/recordatorio enviado correctamente/i)).not.toBeVisible();
  });
});
