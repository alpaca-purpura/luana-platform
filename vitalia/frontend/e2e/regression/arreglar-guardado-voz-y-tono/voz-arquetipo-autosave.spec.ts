/**
 * voz-arquetipo-autosave.spec.ts — SC-1 Happy path: arquetipo autosave (real backend)
 *
 * Gherkin scenario: voz-arquetipo-autosave-persiste
 *
 * Given:  Owner autenticado en Lisa › Marca › Voz y tono (arquetipo inicial: Caregiver)
 * When:   Cambia arquetipo a 'Sage'; transcurre el debounce 600ms del autosave
 * Then:   Badge saving→saved (NUNCA 'error') · PATCH responde 200 · recarga persiste Sage
 *
 * IMPORTANT: This spec uses the REAL backend (NO page.route mock on PATCH /personality).
 * The bug shipped because the prior test mocked the API → false green.
 * Verification doctrine: "verified = exercise the real action + observe effect + read logs"
 * (test-design-doctrine.md § Verificación REAL ≠ "HTTP 200")
 *
 * Depends on: T-1 (sanitize_payload fix) + T-2 (camelCase alias) being deployed.
 * Stack required: backend :8002 + frontend :3002 UP.
 *
 * Run:
 *   cd vitalia/frontend
 *   E2E_BASE_URL=http://localhost:3002 npx playwright test \
 *     e2e/regression/arreglar-guardado-voz-y-tono/voz-arquetipo-autosave.spec.ts
 *
 * downstream-regression-na: brand-local vitalia e2e spec T-3 arreglar-guardado-voz-y-tono
 *
 * @see 04-validators.yaml § e2e_voz_arquetipo_autosave
 * @see 06-tickets.yaml T-3 deliverables
 * @see 01-spec.md § voz-arquetipo-autosave-persiste
 */

import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import path from "path";
import { VozTonoSectionPom } from "./poms/voz-tono-section.pom";

// ---------------------------------------------------------------------------
// Auth + tenant constants
// ---------------------------------------------------------------------------

const STORAGE_STATE_PATH = path.join(
  __dirname,
  "../../../playwright/.clerk/user.json",
);

const TENANT_ID =
  process.env["VITALIA_PE_TENANT_ID"] ?? "clinica-salud-vitalia-pe-test";

// ---------------------------------------------------------------------------
// Fixture — authenticated page with real backend
// ---------------------------------------------------------------------------

const authTest = test.extend<{ authedPage: import("@playwright/test").Page }>({
  authedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE_PATH,
    });
    const page = await context.newPage();

    // Clerk testing token injection (playwright-expert SSoT).
    await setupClerkTestingToken({ page });

    await use(page);

    await page.close();
    await context.close();
  },
});

// ---------------------------------------------------------------------------
// Test suite — SC-1 arquetipo autosave with real backend
// ---------------------------------------------------------------------------

authTest.describe("SC-1 — Arquetipo autosave (backend real, sin mock PATCH)", () => {
  authTest(
    "cambio de arquetipo Caregiver → Sage: badge saving→saved, PATCH 200, persiste en recarga",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      // Navigate to voz-y-tono
      await pom.goto();
      await pom.waitForLoaded();

      // Capture outgoing PATCH requests — we do NOT mock them (real backend)
      const patchRequests: { status: number; body: Record<string, unknown> }[] =
        [];

      authedPage.on("response", (response) => {
        if (
          response.url().includes("/api/v1/lisa/marca/personality") &&
          response.request().method() === "PATCH"
        ) {
          void response.json().then((body: unknown) => {
            patchRequests.push({
              status: response.status(),
              body: body as Record<string, unknown>,
            });
          });
        }
      });

      // Verify initial archetype is loaded (Caregiver from seed)
      const initialArchetype = await pom.getSelectedArchetype();
      // Initial state can be caregiver or null during loading — just proceed
      expect(
        initialArchetype === "caregiver" || initialArchetype === null,
        `Expected initial archetype to be caregiver or null, got: ${String(initialArchetype)}`,
      ).toBe(true);

      // Select Sage archetype → triggers autosave debounce
      await pom.selectArchetype("sage");

      // Badge must transition through saving → saved (NEVER error)
      // saving state (debounce fired, mutation in flight)
      await pom.waitForAutosaveSaving();

      // Status must NOT become error
      const statusDuringSaving = await pom.getAutosaveStatus();
      expect(
        statusDuringSaving,
        "Badge must not be in error state during saving",
      ).not.toBe("error");

      // Wait for saved state (PATCH responded 200)
      await pom.waitForAutosaveSaved();

      const finalStatus = await pom.getAutosaveStatus();
      expect(finalStatus, "Badge must reach saved state").toBe("saved");

      // Verify PATCH was actually called on real backend and returned 200
      await expect
        .poll(
          () => patchRequests.length,
          { timeout: 5_000, message: "PATCH to personality must have been sent" },
        )
        .toBeGreaterThan(0);

      const lastPatch = patchRequests[patchRequests.length - 1];
      expect(lastPatch?.status, "PATCH must return 200 (not 500 from bug)").toBe(
        200,
      );
      expect(
        lastPatch?.body?.["archetype"] ?? lastPatch?.body?.["archetype"],
        "PATCH body must include sage archetype",
      ).toBe("sage");

      // Verify badge text shows "Guardado"
      const badgeText = await pom.getAutosaveBadgeText();
      expect(badgeText, "Badge text must show Guardado").toMatch(/Guardado/i);

      // Reload and verify archetype persists (round-trip DB verification)
      await pom.reload();
      await pom.waitForLoaded();

      const persistedArchetype = await pom.getSelectedArchetype();
      expect(
        persistedArchetype,
        "After reload, archetype must be sage (persisted in DB)",
      ).toBe("sage");
    },
  );

  authTest(
    "badge no llega a estado 'error' durante cambio de arquetipo válido",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      await pom.goto();
      await pom.waitForLoaded();

      // Track badge states during the save cycle
      const observedStates: string[] = [];
      authedPage.on("response", (_response) => {
        // read badge state asynchronously after each network response
        void pom.getAutosaveStatus().then((s) => observedStates.push(s));
      });

      await pom.selectArchetype("healer");
      await pom.waitForAutosaveSaved();

      // At no point must we see "error"
      expect(
        observedStates.includes("error"),
        `Badge reached error state during valid archetype change. States observed: [${observedStates.join(", ")}]`,
      ).toBe(false);
    },
  );
});
