/**
 * arreglar-guardado-voz-y-tono.spec.ts — A11y WCAG 2.1 AA + aria-live autosave badge
 *
 * Gherkin scenario: autosave-badge-aria-live
 *
 * Given:  Owner en Voz y tono usando lector de pantalla
 * When:   El autosave transita dirty→saving→saved (o error)
 * Then:   Estado del badge se anuncia vía aria-live (no solo color) · contraste AA del badge
 *
 * Validator: a11y_autosave_badge (04-validators.yaml)
 * Ruleset:   wcag2aa (axe-core)
 *
 * Run:
 *   cd vitalia/frontend
 *   E2E_BASE_URL=http://localhost:3002 npx playwright test \
 *     e2e/a11y/arreglar-guardado-voz-y-tono.spec.ts
 *
 * Project: a11y (playwright.config.ts — matches .*\/a11y\/.*\.spec\.ts)
 *
 * downstream-regression-na: brand-local vitalia E2E a11y spec T-3 arreglar-guardado-voz-y-tono
 *
 * @see 04-validators.yaml § a11y_autosave_badge
 * @see 06-tickets.yaml T-3 deliverables
 * @see 01-spec.md § autosave-badge-aria-live
 */

import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import path from "path";
import type { Route } from "@playwright/test";
import {
  setupLisaMarcaMocks,
  LISA_MARCA_FIXTURE,
  buildMockPersonalityResponse,
} from "../regression/vitalia-fase2-lisa-marca/fixtures/lisa-marca.fixture";
import { VozTonoSectionPom } from "../regression/arreglar-guardado-voz-y-tono/poms/voz-tono-section.pom";

// ---------------------------------------------------------------------------
// Auth + tenant constants
// ---------------------------------------------------------------------------

const STORAGE_STATE_PATH = path.join(
  __dirname,
  "../../playwright/.clerk/user.json",
);

const TENANT_ID = LISA_MARCA_FIXTURE.tenantId;

/** WCAG 2.1 AA tags per spec */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;

// ---------------------------------------------------------------------------
// Fixture — authenticated page with mocked backend
// ---------------------------------------------------------------------------

const authTest = test.extend<{ authedPage: import("@playwright/test").Page }>({
  authedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE_PATH,
    });
    const page = await context.newPage();

    await setupClerkTestingToken({ page });

    // Standard mocks (GET personality, identity, etc.)
    await setupLisaMarcaMocks(page, TENANT_ID);

    await use(page);

    await page.close();
    await context.close();
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run axe-core WCAG 2.1 AA scan on the voz-y-tono content area.
 * Returns critical + serious violations only.
 */
async function scanVozTonoContent(
  page: import("@playwright/test").Page,
): Promise<import("axe-core").Result[]> {
  const results = await new AxeBuilder({ page })
    .withTags([...WCAG_TAGS])
    .include('[data-testid="lisa-marca-content"]')
    .exclude("#__nextjs-toast-errors") // Next.js dev overlay
    .exclude('[data-testid="lisa-marca-loading-skeleton"]')
    .analyze();

  return results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
}

/**
 * Format violation list for assertion error message.
 */
function formatViolations(
  violations: import("axe-core").Result[],
  label: string,
): string {
  if (violations.length === 0) return "";
  return (
    `A11y violations (${label}):\n` +
    violations
      .map(
        (v) =>
          `  [${v.impact ?? "unknown"}] ${v.id}: ${v.description}\n` +
          `    Nodes: ${v.nodes.map((n) => n.target.join(" > ")).join(", ")}`,
      )
      .join("\n")
  );
}

// ---------------------------------------------------------------------------
// 1. Idle state — voz-y-tono loaded with seed data
// ---------------------------------------------------------------------------

authTest.describe("A11y — voz-y-tono idle state passes WCAG 2.1 AA", () => {
  authTest(
    "idle state (datos cargados) pasa WCAG 2.1 AA",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      await pom.goto();
      await pom.waitForLoaded();

      const violations = await scanVozTonoContent(authedPage);

      expect(
        violations,
        formatViolations(violations, "voz-y-tono idle"),
      ).toHaveLength(0);
    },
  );
});

// ---------------------------------------------------------------------------
// 2. AutosaveBadge aria-live announcement
// ---------------------------------------------------------------------------

authTest.describe("A11y — AutosaveBadge: aria-live anuncia estado (WCAG 4.1.3)", () => {
  authTest(
    "AutosaveBadge tiene role='status' o aria-live (anuncia cambios a lectores de pantalla)",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      // Mock PATCH to respond quickly so we can observe badge transitions
      await authedPage.route(
        "**/api/v1/lisa/marca/personality",
        async (route: Route) => {
          if (route.request().method() === "PATCH") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                ...buildMockPersonalityResponse(TENANT_ID),
                archetype: "sage",
                updatedAt: new Date().toISOString(),
              }),
            });
          } else {
            await route.continue();
          }
        },
      );

      await pom.goto();
      await pom.waitForLoaded();

      // Trigger autosave to make badge appear
      await pom.selectArchetype("sage");
      await pom.waitForAutosaveSaving();

      // Verify AutosaveBadge has an aria-live attribute or role=status
      // This ensures screen readers announce the saving/saved/error transitions
      const badge = authedPage.locator('[data-testid="autosave-badge"]');
      await expect(badge, "AutosaveBadge must be visible during saving").toBeVisible();

      const ariaLive = await badge.getAttribute("aria-live");
      const role = await badge.getAttribute("role");

      const hasAriaAnnouncement =
        ariaLive === "polite" ||
        ariaLive === "assertive" ||
        role === "status" ||
        role === "alert";

      expect(
        hasAriaAnnouncement,
        `AutosaveBadge must have aria-live="polite"|"assertive" or role="status"|"alert" ` +
          `to announce saving state changes to screen readers. ` +
          `Found: aria-live="${String(ariaLive)}", role="${String(role)}"`,
      ).toBe(true);
    },
  );

  authTest(
    "AutosaveBadge saved state pasa WCAG 2.1 AA (contraste + aria)",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      // Mock successful PATCH
      await authedPage.route(
        "**/api/v1/lisa/marca/personality",
        async (route: Route) => {
          if (route.request().method() === "PATCH") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                ...buildMockPersonalityResponse(TENANT_ID),
                archetype: "healer",
                updatedAt: new Date().toISOString(),
              }),
            });
          } else {
            await route.continue();
          }
        },
      );

      await pom.goto();
      await pom.waitForLoaded();

      await pom.selectArchetype("healer");
      await pom.waitForAutosaveSaved();

      // Axe scan specifically on the autosave badge in saved state
      const badgeResults = await new AxeBuilder({ page: authedPage })
        .withTags([...WCAG_TAGS])
        .include('[data-testid="autosave-badge"]')
        .analyze();

      const badgeViolations = badgeResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      expect(
        badgeViolations,
        formatViolations(badgeViolations, "autosave-badge saved state"),
      ).toHaveLength(0);
    },
  );

  authTest(
    "AutosaveBadge error state pasa WCAG 2.1 AA (contraste + aria)",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      // Mock PATCH to return 503 — triggers error state badge
      await authedPage.route(
        "**/api/v1/lisa/marca/personality",
        async (route: Route) => {
          if (route.request().method() === "PATCH") {
            await route.fulfill({
              status: 503,
              contentType: "application/json",
              body: JSON.stringify({ detail: "Service Unavailable" }),
            });
          } else {
            await route.continue();
          }
        },
      );

      await pom.goto();
      await pom.waitForLoaded();

      await pom.selectArchetype("sage");
      await pom.waitForAutosaveError();

      // Axe scan on badge in error state
      const badgeResults = await new AxeBuilder({ page: authedPage })
        .withTags([...WCAG_TAGS])
        .include('[data-testid="autosave-badge"]')
        .analyze();

      const badgeViolations = badgeResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      expect(
        badgeViolations,
        formatViolations(badgeViolations, "autosave-badge error state"),
      ).toHaveLength(0);
    },
  );
});

// ---------------------------------------------------------------------------
// 3. Full voz-y-tono page axe scan — saving + saved states
// ---------------------------------------------------------------------------

authTest.describe("A11y — página voz-y-tono con autosave activo pasa WCAG 2.1 AA", () => {
  authTest(
    "estado saving: página completa pasa WCAG 2.1 AA",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      // Slow mock to capture saving state
      await authedPage.route(
        "**/api/v1/lisa/marca/personality",
        async (route: Route) => {
          if (route.request().method() === "PATCH") {
            // Delay to keep badge in "saving" long enough for axe scan
            await new Promise<void>((resolve) => setTimeout(resolve, 800));
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                ...buildMockPersonalityResponse(TENANT_ID),
                archetype: "sage",
                updatedAt: new Date().toISOString(),
              }),
            });
          } else {
            await route.continue();
          }
        },
      );

      await pom.goto();
      await pom.waitForLoaded();

      // Trigger saving state
      await pom.selectArchetype("sage");
      await pom.waitForAutosaveSaving();

      // Scan while in saving state
      const violations = await scanVozTonoContent(authedPage);

      expect(
        violations,
        formatViolations(violations, "voz-y-tono saving state"),
      ).toHaveLength(0);

      // Let it finish
      await pom.waitForAutosaveSaved();
    },
  );

  authTest(
    "estado saved: página completa pasa WCAG 2.1 AA",
    async ({ authedPage }) => {
      const pom = new VozTonoSectionPom(authedPage, TENANT_ID);

      // Quick mock
      await authedPage.route(
        "**/api/v1/lisa/marca/personality",
        async (route: Route) => {
          if (route.request().method() === "PATCH") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                ...buildMockPersonalityResponse(TENANT_ID),
                archetype: "caregiver",
                updatedAt: new Date().toISOString(),
              }),
            });
          } else {
            await route.continue();
          }
        },
      );

      await pom.goto();
      await pom.waitForLoaded();

      await pom.selectArchetype("caregiver");
      await pom.waitForAutosaveSaved();

      const violations = await scanVozTonoContent(authedPage);

      expect(
        violations,
        formatViolations(violations, "voz-y-tono saved state"),
      ).toHaveLength(0);
    },
  );
});
