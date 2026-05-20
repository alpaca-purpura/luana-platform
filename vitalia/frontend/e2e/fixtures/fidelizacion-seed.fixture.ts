/**
 * fidelizacion-seed.fixture.ts — Seeded patient data for fidelización E2E tests
 *
 * Provides 4 patient scenarios matching the Gherkin acceptance criteria:
 *   - M. Rodríguez: ortodoncia multi_session gap (SC-01 happy path)
 *   - L. Vega: absence + marketing_opt_in=false (SC-02 negative path)
 *   - C. Núñez: follow_up_due + urgency progression (SC-03 edge)
 *   - X. Adv: opt_out=true — must NOT appear in any tab (SC-04 adversarial)
 *
 * Network: all fidelizacion API calls mocked via page.route().
 * Extends clinic-context.fixture.ts.
 *
 * downstream-regression-na: brand-local E2E fixture; no cross-brand consumers
 */

import {
  test as clinicBase,
  CLINIC_CONTEXT,
  E2E_CLERK_ORG_ID,
  type ClinicContextFixtures,
} from "./clinic-context.fixture";
import type { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Seeded patient IDs (stable UUIDs — used as testid references in POM)
// ---------------------------------------------------------------------------

export const SEED_IDS = {
  /** SC-01 — M. Rodríguez ortodoncia multi_session */
  eventIdMultiSession: "evt-fidel-multisess-001",
  patientIdMultiSession: "pat-rodriguez-ortodoncia-001",

  /** SC-02 — L. Vega absence, marketing_opt_in=false */
  eventIdAbsence: "evt-fidel-absence-002",
  patientIdAbsence: "pat-vega-absence-002",

  /** SC-03 — C. Núñez follow_up due */
  eventIdFollowUp: "evt-fidel-followup-003",
  patientIdFollowUp: "pat-nunez-followup-003",

  /** SC-04 — X. Adv opt_out=true — should NOT appear */
  patientIdOptOut: "pat-adversarial-optout-004",
} as const;

// ---------------------------------------------------------------------------
// Mock payload builders
// ---------------------------------------------------------------------------

/** KPI summary (used in smoke + all regression specs) */
const SUMMARY_MOCK = {
  period: "30d",
  patients_in_followup: 12,
  near_abandonment: 3,
  return_rate: 0.72,
  re_engaged: 5,
  nps_average: 8.4,
  trend: {
    patients_in_followup: 0.15,
    near_abandonment: -0.08,
    re_engaged: 0.3,
  },
};

/** Multi-session tab rows — SC-01 patient (Rodríguez) */
const MULTI_SESSION_ROWS = [
  {
    re_engagement_event_id: SEED_IDS.eventIdMultiSession,
    patient_id: SEED_IDS.patientIdMultiSession,
    patient_name: "M. Rodríguez",
    pattern: "multi_session",
    urgency: "critical",
    pattern_data: {
      kind: "multi_session",
      offer_label: "Plan ortodoncia 12 sesiones",
      sessions_completed: 4,
      sessions_expected: 12,
      gap_days: 31,
      last_session_date: "2026-04-19T10:00:00Z",
      doctor_name: "Dr. Carlos Ortiz",
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
];

/** Absence tab rows — SC-02 patient (Vega), marketing_opt_in=false */
const ABSENCE_ROWS = [
  {
    re_engagement_event_id: SEED_IDS.eventIdAbsence,
    patient_id: SEED_IDS.patientIdAbsence,
    patient_name: "L. Vega",
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
      { id: "suggest_slots", enabled: false, disabled_reason: "El paciente no aceptó comunicaciones de marketing" },
      { id: "pause_patient", enabled: true, disabled_reason: null },
      { id: "mark_external", enabled: true, disabled_reason: null },
      { id: "mark_no_continue", enabled: true, disabled_reason: null },
      { id: "call_manually", enabled: true, disabled_reason: null },
      { id: "open_conversation", enabled: true, disabled_reason: null },
    ],
  },
];

/** Follow-up tab rows — SC-03 patient (Núñez) */
const FOLLOW_UP_ROWS = [
  {
    re_engagement_event_id: SEED_IDS.eventIdFollowUp,
    patient_id: SEED_IDS.patientIdFollowUp,
    patient_name: "C. Núñez",
    pattern: "follow_up",
    urgency: "near",
    pattern_data: {
      kind: "follow_up",
      doctor_name: "Dr. Carlos Ortiz",
      follow_up_requested_duration: "3 meses",
      follow_up_set_at: "2026-02-15T10:00:00Z",
      follow_up_due_at: "2026-05-22T10:00:00Z",
      days_until_due: 2,
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
];

/** Maintenance tab rows — empty for scenarios */
const MAINTENANCE_ROWS: unknown[] = [];

/** NPS tab rows — minimal (reserved for future NPS tab mock) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved constant, intentionally unused
const NPS_ROWS: unknown[] = [];

/** After send_proactive — Rodríguez card updated to "sent" outcome */
const SEND_PROACTIVE_RESPONSE = {
  re_engagement_event_id: SEED_IDS.eventIdMultiSession,
  status: "sent",
  conv_id: "conv-fidel-rodriguez-001",
};

/** PausePatient response (7 days) */
const PAUSE_RESPONSE = {
  resume_at: "2026-06-01T00:00:00Z",
};

/** LogManualCall response */
const MANUAL_CALL_RESPONSE = {
  event_id: "manual-call-evt-vega-001",
  logged_at: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

export async function setupFidelizacionMocks(page: Page): Promise<void> {
  const { clinicId, tenantId } = CLINIC_CONTEXT;
  // E2E_CLERK_ORG_ID is used as X-Tenant-ID when useAuth().orgId is active org.
  const clerkOrgId = E2E_CLERK_ORG_ID;

  // KPI summary (all periods)
  await page.route(
    "**/api/v1/vitalia/fidelization/summary**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SUMMARY_MOCK),
      });
    }
  );

  // Pattern rows: multi_session
  await page.route(
    `**/api/v1/vitalia/fidelization/re-engagement/patterns**pattern=multi_session**`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: MULTI_SESSION_ROWS }),
      });
    }
  );

  // Pattern rows: absence
  await page.route(
    `**/api/v1/vitalia/fidelization/re-engagement/patterns**pattern=absence**`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: ABSENCE_ROWS }),
      });
    }
  );

  // Pattern rows: follow_up
  await page.route(
    `**/api/v1/vitalia/fidelization/re-engagement/patterns**pattern=follow_up**`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: FOLLOW_UP_ROWS }),
      });
    }
  );

  // Pattern rows: maintenance
  await page.route(
    `**/api/v1/vitalia/fidelization/re-engagement/patterns**pattern=maintenance**`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: MAINTENANCE_ROWS }),
      });
    }
  );

  // Fallback: any patterns endpoint not matched above
  await page.route(
    "**/api/v1/vitalia/fidelization/re-engagement/patterns**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rows: [] }),
      });
    }
  );

  // send_proactive — Rodríguez reminder
  await page.route(
    `**/api/v1/vitalia/fidelization/patients/${SEED_IDS.patientIdMultiSession}/send-proactive`,
    async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(SEND_PROACTIVE_RESPONSE),
        });
      } else {
        await route.continue();
      }
    }
  );

  // send_proactive — Vega (opt-out guard: returns 403)
  await page.route(
    `**/api/v1/vitalia/fidelization/patients/${SEED_IDS.patientIdAbsence}/send-proactive`,
    async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "Patient has not consented to marketing communications",
            code: "MARKETING_OPT_IN_REQUIRED",
          }),
        });
      } else {
        await route.continue();
      }
    }
  );

  // pause patient
  await page.route(
    "**/api/v1/vitalia/fidelization/patients/*/pause",
    async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(PAUSE_RESPONSE),
        });
      } else {
        await route.continue();
      }
    }
  );

  // log manual call
  await page.route(
    "**/api/v1/vitalia/fidelization/patients/*/log-manual-call",
    async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MANUAL_CALL_RESPONSE),
        });
      } else {
        await route.continue();
      }
    }
  );

  // activity stream
  await page.route(
    "**/api/v1/vitalia/fidelization/activity**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          events: [
            {
              id: "act-001",
              type: "template_sent",
              patient_id: SEED_IDS.patientIdMultiSession,
              occurred_at: new Date().toISOString(),
            },
          ],
        }),
      });
    }
  );

  // Available slots (for SuggestSlotsModal)
  await page.route(
    "**/api/v1/vitalia/fidelization/available-slots**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          slots: [
            {
              slot_iso: "2026-05-25T10:00:00-06:00",
              doctor_id: "dr-ortiz-mx",
              doctor_name: "Dr. Carlos Ortiz",
              available: true,
            },
            {
              slot_iso: "2026-05-26T11:00:00-06:00",
              doctor_id: "dr-vega-mx",
              doctor_name: "Dra. Laura Vega",
              available: true,
            },
          ],
        }),
      });
    }
  );

  // SC-04: Cross-tenant PHI request → 403 (tested in adversarial spec)
  // The adversarial spec overrides this with a custom route per scenario.
  // Provide a base guard for rogue tenant_id injections.
  await page.route("**/api/v1/vitalia/fidelization/**", async (route) => {
    const reqTenantId = route.request().headers()["x-tenant-id"];
    // Accept: configured tenantId, clinicId, or the Clerk orgId used in E2E sessions
    if (reqTenantId && reqTenantId !== tenantId && reqTenantId !== clinicId && reqTenantId !== clerkOrgId) {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Cross-tenant access denied" }),
      });
    } else {
      await route.continue();
    }
  });
}

// ---------------------------------------------------------------------------
// Fixture type + extension
// ---------------------------------------------------------------------------

export type FidelizacionSeedFixtures = ClinicContextFixtures & {
  /** Pre-authenticated page with all fidelización mocks + clinic context */
  fidelizacionPage: Page;
  /** Seed IDs for referencing patients in specs */
  seedIds: typeof SEED_IDS;
};

export const test = clinicBase.extend<FidelizacionSeedFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture signature requires destructuring
  seedIds: async ({}, use) => {
    await use(SEED_IDS);
  },

  fidelizacionPage: async ({ clinicPage }, use) => {
    await setupFidelizacionMocks(clinicPage);
    await use(clinicPage);
  },
});

export { expect } from "../auth.fixture";
