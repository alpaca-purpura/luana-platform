/**
 * voz-autosave-error.spec.ts — SC-5 Network failure: badge error state (mock route)
 *
 * Gherkin scenario: autosave-error-muestra-badge
 *
 * Given:  Owner en Voz y tono; endpoint PATCH /personality responde 5xx/timeout (mock)
 * When:   Cambia arquetipo y dispara autosave
 * Then:   Badge muestra estado 'error' · UI no crashea · usuario puede reintentar
 *
 * NOTE: This is the ONLY spec in T-3 that uses page.route mock.
 * Reason: we deliberately want to test the error handling path without relying on
 * a real backend error condition. The other specs (arquetipo, bloque) use real backend.
 *
 * Run:
 *   cd vitalia/frontend
 *   E2E_BASE_URL=http://localhost:3002 npx playwright test \
 *     e2e/regression/arreglar-guardado-voz-y-tono/voz-autosave-error.spec.ts
 *
 * downstream-regression-na: brand-local vitalia e2e spec T-3 arreglar-guardado-voz-y-tono
 *
 * @see 04-validators.yaml § e2e_voz_autosave_error
 * @see 06-tickets.yaml T-3 deliverables
 * @see 01-spec.md § autosave-error-muestra-badge
 */

import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import path from "path";
import type { Route } from "@playwright/test";
import { VozTonoSectionPom } from "./poms/voz-tono-section.pom";
import { LISA_MARCA_FIXTURE } from "../vitalia-fase2-lisa-marca/fixtures/lisa-marca.fixture";

// ---------------------------------------------------------------------------
// Auth + tenant constants
// ---------------------------------------------------------------------------

const STORAGE_STATE_PATH = path.join(
  __dirname,
  "../../../playwright/.clerk/user.json",
);

// Use E2E_TENANT_ID (the UUID owned by the authed Clerk user) so the route
// does not cross-tenant-block. The error spec uses page.route mocks so the
// real BE personality row is not needed — only the route must be reachable.
const TENANT_ID =
  process.env["E2E_TENANT_ID"] ??
  process.env["VITALIA_PE_TENANT_ID"] ??
  LISA_MARCA_FIXTURE.tenantId;

// ---------------------------------------------------------------------------
// Fixture — authenticated page with mock mocks for GET, but 503 for PATCH personality
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
// Helper: setup mocks with PATCH personality returning 503
// ---------------------------------------------------------------------------

async function setupErrorMocks(
  page: import("@playwright/test").Page,
  _tenantId: string,
): Promise<void> {
  // Verificación REAL (test-design-doctrine.md): el GET /personality va al backend
  // REAL (los arquetipos renderizan con datos reales). SOLO el PATCH se mockea a 503
  // para ejercer deliberadamente el camino de error del autosave.
  await page.route(
    "**/api/v1/lisa/marca/personality",
    async (route: Route) => {
      if (route.request().method() === "PATCH") {
        // Simulate backend error (Service Unavailable)
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Service Unavailable" }),
        });
      } else {
        // GET (y demás) → backend real → ArchetypeSelector renderiza las cards
        await route.continue();
      }
    },
  );
}

/**
 * Wait for voz-y-tono page to render the interactive content.
 * More lenient than pom.waitForLoaded() — waits for archetype selector
 * which is the key interactive element for autosave tests.
 */
async function waitForVozTonoInteractive(
  page: import("@playwright/test").Page,
  timeoutMs = 20_000,
): Promise<void> {
  // Wait for the section root (voz-tono-section-root) which is the canonical
  // "VozTonoView mounted" signal. Scope to first to avoid strict-mode violation.
  await page
    .locator('[data-testid="voz-tono-section-root"]')
    .first()
    .waitFor({ state: "visible", timeout: timeoutMs });
}

// ---------------------------------------------------------------------------
// Test suite — SC-5 network failure / error state
// ---------------------------------------------------------------------------

authTest.describe("SC-5 — Network failure: badge muestra error (mock route 503)", () => {
  authTest(
    "PATCH personality 503 → badge 'error', UI no crashea",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      // Setup mocks: GET personality from fixture, PATCH returns 503
      await setupErrorMocks(authedPage, TENANT_ID);

      await pom.goto();
      await waitForVozTonoInteractive(authedPage);

      // Select archetype to trigger autosave
      await pom.selectArchetype("sage");

      // Wait for saving state (debounce fires, mutation starts)
      await pom.waitForAutosaveSaving();

      // Wait for error state (PATCH returned 503 → onError handler → badge=error)
      await pom.waitForAutosaveError();

      const finalStatus = await pom.getAutosaveStatus();
      expect(finalStatus, "Badge must show error state after 503").toBe("error");

      // Verify UI has not crashed — archetype selector must still be visible.
      // Scope to section root (first instance) to avoid strict-mode violation.
      await expect(
        authedPage.locator('[data-testid="voz-tono-section-root"]').first()
          .locator('[data-testid="archetype-selector"]'),
        "UI must not crash after autosave error — archetype selector must remain",
      ).toBeVisible();

      // Error boundary must NOT be visible (graceful error, not crash)
      const errorBoundaryVisible = await authedPage
        .locator('[data-testid="error-boundary-fallback"]')
        .isVisible();
      expect(
        errorBoundaryVisible,
        "Error boundary must NOT appear for autosave error (only badge)",
      ).toBe(false);

      // Badge text must show error copy (Spanish neutro)
      const badgeText = await pom.getAutosaveBadgeText();
      expect(
        badgeText,
        "Badge must show error copy in Spanish neutro",
      ).toMatch(/no se pudo guardar|error|reintenta/i);
    },
  );

  authTest(
    "tras error, el próximo cambio re-dispara el autosave (reintento posible)",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      // Phase 1: PATCH returns 503 (error)
      await setupErrorMocks(authedPage, TENANT_ID);
      await pom.goto();
      await waitForVozTonoInteractive(authedPage);

      await pom.selectArchetype("sage");
      await pom.waitForAutosaveError();

      const statusAfterError = await pom.getAutosaveStatus();
      expect(statusAfterError, "Badge must be in error state").toBe("error");

      // Phase 2: Remove the error mock (allow the next PATCH to succeed via standard route)
      // We can simulate retry by re-routing PATCH to succeed
      await authedPage.route(
        "**/api/v1/lisa/marca/personality",
        async (route: Route) => {
          if (route.request().method() === "PATCH") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                tenantId: TENANT_ID,
                archetype: "healer",
                updatedAt: new Date().toISOString(),
              }),
            });
          } else {
            await route.continue();
          }
        },
      );

      // Make a new change — this re-triggers autosave (retry)
      await pom.selectArchetype("healer");

      // The new attempt must be able to reach saved state
      await pom.waitForAutosaveSaved();

      const statusAfterRetry = await pom.getAutosaveStatus();
      expect(
        statusAfterRetry,
        "After retry with working backend, badge must reach saved state",
      ).toBe("saved");
    },
  );

  authTest(
    "UI permanece interactiva durante y después de error de autosave",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      await setupErrorMocks(authedPage, TENANT_ID);
      await pom.goto();
      await waitForVozTonoInteractive(authedPage);

      await pom.selectArchetype("sage");
      await pom.waitForAutosaveError();

      // Verify the archetype selector is still interactive (not frozen/disabled).
      // Scope to first section root to avoid strict-mode violation.
      const sectionFirst = authedPage.locator('[data-testid="voz-tono-section-root"]').first();
      const archetypeCard = sectionFirst.locator('[data-testid="archetype-card-healer"]');
      await expect(
        archetypeCard,
        "Archetype card must remain clickable after autosave error",
      ).toBeVisible();
      await expect(archetypeCard).toBeEnabled();

      // Page must not have frozen or shown a full-page error
      await expect(
        sectionFirst,
        "Section root must remain visible after error",
      ).toBeVisible();
    },
  );
});
