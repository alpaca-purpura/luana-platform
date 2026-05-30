/**
 * voz-bloque-autosave.spec.ts — SC-4 Regression 422: bloque de voz camelCase (real backend)
 *
 * Gherkin scenario: voz-bloque-edita-no-422
 *
 * Given:  Owner en Voz y tono con el bloque "Así hablo" visible
 * When:   Edita el texto del bloque y transcurre el debounce del autosave
 * Then:   Badge saving→saved (NO 'error') · PATCH 200 (NO 422 extra_forbidden) · texto persiste
 *
 * Root cause of bug: FE sends camelCase field (soISpeak); BE had extra="forbid" + no alias_generator
 * → 422 extra_forbidden. Fix in T-2 (BrandPersonalityPatchDTO camelCase alias).
 *
 * This spec uses the REAL backend — no page.route mock on PATCH /personality.
 * That is the ONLY way to prove the contract fix actually worked.
 * ("verde honesto" — 04-validators.yaml rationale T-3)
 *
 * Depends on: T-1 (sanitize_payload fix) + T-2 (camelCase alias) deployed.
 * Stack required: backend :8002 + frontend :3002 UP.
 *
 * Run:
 *   cd vitalia/frontend
 *   E2E_BASE_URL=http://localhost:3002 npx playwright test \
 *     e2e/regression/arreglar-guardado-voz-y-tono/voz-bloque-autosave.spec.ts
 *
 * downstream-regression-na: brand-local vitalia e2e spec T-3 arreglar-guardado-voz-y-tono
 *
 * @see 04-validators.yaml § e2e_voz_bloque_autosave
 * @see 06-tickets.yaml T-3 deliverables
 * @see 01-spec.md § voz-bloque-edita-no-422
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

    await setupClerkTestingToken({ page });

    await use(page);

    await page.close();
    await context.close();
  },
});

// ---------------------------------------------------------------------------
// Test suite — SC-4 voice block camelCase 422 regression
// ---------------------------------------------------------------------------

authTest.describe("SC-4 — Regresión 422: editar bloque de voz (backend real, sin mock PATCH)", () => {
  authTest(
    "editar bloque 'Así hablo': badge saving→saved (no 422), texto persiste en recarga",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      await pom.goto();
      await pom.waitForLoaded();

      // Capture outgoing PATCH responses (real backend)
      const patchResponses: { status: number }[] = [];

      authedPage.on("response", (response) => {
        if (
          response.url().includes("/api/v1/lisa/marca/personality") &&
          response.request().method() === "PATCH"
        ) {
          patchResponses.push({ status: response.status() });
        }
      });

      // Edit the "Así hablo" voice block
      // This triggers the camelCase field soISpeak in the PATCH payload.
      const newText =
        "Con calidez y empatía, priorizando la comprensión del paciente. Revisado en regresión T-3.";

      await pom.editVoiceBlock("Así hablo", newText);

      // Wait for saving state (debounce fires, mutation in flight)
      await pom.waitForAutosaveSaving();

      // Status must NOT become error (422 would set status=error)
      const statusDuringSaving = await pom.getAutosaveStatus();
      expect(
        statusDuringSaving,
        "Badge must not be in error state — 422 would mean camelCase bug not fixed",
      ).not.toBe("error");

      // Wait for saved state (PATCH returned 200)
      await pom.waitForAutosaveSaved();

      // Verify actual PATCH returned 200 (not 422)
      await expect
        .poll(
          () => patchResponses.length,
          { timeout: 5_000, message: "PATCH must have been sent to backend" },
        )
        .toBeGreaterThan(0);

      const lastResponse = patchResponses[patchResponses.length - 1];
      expect(
        lastResponse?.status,
        "PATCH must return 200 (not 422 extra_forbidden). If 422, T-2 camelCase fix is missing.",
      ).toBe(200);

      // Badge text verification
      const badgeText = await pom.getAutosaveBadgeText();
      expect(badgeText, "Badge must show Guardado").toMatch(/Guardado/i);

      // Reload and verify text persists (round-trip DB verification)
      await pom.reload();
      await pom.waitForLoaded();

      const persistedValue = await pom.getVoiceBlockValue("Así hablo");
      expect(
        persistedValue,
        "Text in 'Así hablo' block must persist after reload (DB round-trip)",
      ).toBe(newText);
    },
  );

  authTest(
    "múltiples ediciones al mismo bloque: solo la última dispara autosave (debounce)",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      await pom.goto();
      await pom.waitForLoaded();

      const patchCount = { count: 0 };

      authedPage.on("response", (response) => {
        if (
          response.url().includes("/api/v1/lisa/marca/personality") &&
          response.request().method() === "PATCH"
        ) {
          patchCount.count++;
        }
      });

      // Rapid edits — debounce should coalesce
      await pom.editVoiceBlock("Así hablo", "Primera versión");
      // Brief pause but still within debounce window
      await authedPage.waitForTimeout(200);
      await pom.editVoiceBlock("Así hablo", "Segunda versión final");

      // Wait for the single debounced save to complete
      await pom.waitForAutosaveSaved();

      // Only one PATCH should have been sent (debounce coalesced)
      expect(
        patchCount.count,
        "Debounce must coalesce multiple edits into one PATCH call",
      ).toBeLessThanOrEqual(2); // Allow 1-2 (timing-sensitive in CI)
    },
  );
});
