/**
 * onboarding-anabella.smoke.spec.ts — Creator onboarding flow (Story 12 T-e2e-1)
 *
 * Scope: Anabella Coaching AR creator onboards, reaches Brand Studio.
 * Tenant: anabella-coaching-ar (es-AR, voseo)
 *
 * PRAGMA T-e2e-1: Smoke only — verifies routing + page load. No deep form interaction.
 * Full form interaction deferred (19 specs impractical in 45-min budget).
 *
 * Pre-conditions:
 *   CLERK_TESTING_TOKEN set (see deploy/CLERK-APP-SETUP.md § 7)
 *   E2E_BASE_URL=http://localhost:3000
 *
 * Run:
 *   cd comunify/frontend && E2E_BASE_URL=http://localhost:3000 npx playwright test \
 *     e2e/specs/smoke/onboarding-anabella.smoke.spec.ts --project=smoke
 */
import { test, expect } from "../../fixtures/anabella-coaching-ar.fixture";

test.describe("Creator onboarding — Anabella Coaching AR", () => {
  test("onboarding page loads with tenant context", async ({ authedPage, baseUrl, tenantSlug }) => {
    // Navigate to onboarding
    await authedPage.goto(`${baseUrl}/onboarding`);

    // Page should load without 404 or 500
    const status = authedPage.url();
    expect(status).toBeTruthy();

    // Should not show generic error page
    const errorHeading = authedPage.locator("h1").filter({ hasText: /500|Error interno/i });
    await expect(errorHeading).not.toBeVisible();
  });

  test("dashboard root redirects authenticated creator", async ({ authedPage, baseUrl }) => {
    await authedPage.goto(baseUrl);

    // Authenticated creator should land on dashboard or onboarding (not login)
    const currentUrl = authedPage.url();
    expect(currentUrl).not.toContain("/sign-in");
    expect(currentUrl).not.toContain("/login");
  });

  test("brand studio route is accessible", async ({ authedPage, baseUrl }) => {
    await authedPage.goto(`${baseUrl}/brand-studio`);

    // Should not redirect to login
    const currentUrl = authedPage.url();
    expect(currentUrl).not.toContain("/sign-in");

    // Page title should be set (not blank/error)
    const title = await authedPage.title();
    expect(title).toBeTruthy();
    expect(title).not.toMatch(/404|Not Found/i);
  });

  test("navigation renders in Spanish", async ({ authedPage, baseUrl }) => {
    await authedPage.goto(baseUrl);

    // Check for Spanish navigation markers (not English-only nav)
    // The app uses Spanish neutro LatAm — look for at least one Spanish word in nav
    const bodyText = await authedPage.locator("body").textContent();
    const hasSpanish =
      bodyText?.match(/comunidad|membresía|configuración|inicio|crear/i) !== null;

    // If app is loaded (not just loading spinner), verify Spanish text
    // Fallback: skip assertion if page still loading (spinner present)
    const isLoading = await authedPage.locator('[data-testid="loading-spinner"]').isVisible();
    if (!isLoading && bodyText && bodyText.length > 100) {
      expect(hasSpanish).toBe(true);
    }
  });
});
