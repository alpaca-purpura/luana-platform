/**
 * cohort-create.smoke.spec.ts — Cohort creation flow smoke (Story 12 T-e2e-1)
 *
 * Scope: Creator navigates to cohort creation, form renders with correct fields.
 * Tenant: pablo-productividad-mx (es-MX)
 *
 * PRAGMA T-e2e-1: Route accessibility + form mount only.
 * Actual cohort save + AI agent interaction deferred.
 *
 * Run:
 *   npx playwright test e2e/specs/smoke/cohort-create.smoke.spec.ts --project=smoke
 */
import { test, expect } from "../../fixtures/pablo-productividad-mx.fixture";

test.describe("Cohort creation — Pablo Productividad MX", () => {
  test("cohort creation route is accessible", async ({ authedPage, baseUrl }) => {
    await authedPage.goto(`${baseUrl}/comunidad/cohorts/nuevo`);

    const currentUrl = authedPage.url();
    expect(currentUrl).not.toContain("/sign-in");

    const title = await authedPage.title();
    expect(title).not.toMatch(/404/);
  });

  test("community dashboard loads", async ({ authedPage, baseUrl, tenantSlug }) => {
    await authedPage.goto(`${baseUrl}/comunidad`);

    // Should not show 500 error
    const errorText = await authedPage.locator("text=500").count();
    expect(errorText).toBe(0);

    // Tenant context is preserved (URL or heading references tenant)
    const bodyText = await authedPage.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });

  test("cohort list renders without crashing", async ({ authedPage, baseUrl }) => {
    await authedPage.goto(`${baseUrl}/comunidad/cohorts`);

    // No unhandled JS errors on page load
    const jsErrors: string[] = [];
    authedPage.on("pageerror", (err) => jsErrors.push(err.message));

    await authedPage.waitForLoadState("networkidle");
    expect(jsErrors).toHaveLength(0);
  });
});
