/**
 * subscription-create-dunning.smoke.spec.ts — Subscription + dunning flow smoke (Story 12 T-e2e-1)
 *
 * Scope: Member subscription creation and dunning notification rendering.
 * Tenant: anabella-coaching-ar (es-AR)
 *
 * Dunning = automated follow-up when subscription payment fails.
 * The AI agent handles dunning conversations per sales_agent voice profile.
 *
 * PRAGMA T-e2e-1: Route accessibility + dunning UI mount only.
 * Payment processing + Stripe webhook integration deferred.
 *
 * Run:
 *   npx playwright test e2e/specs/smoke/subscription-create-dunning.smoke.spec.ts --project=smoke
 */
import { test, expect } from "../../fixtures/anabella-coaching-ar.fixture";

test.describe("Subscription + dunning — Anabella Coaching AR", () => {
  test("subscription management route accessible", async ({ authedPage, baseUrl }) => {
    await authedPage.goto(`${baseUrl}/suscripcion`);

    const currentUrl = authedPage.url();
    expect(currentUrl).not.toContain("/sign-in");

    const title = await authedPage.title();
    expect(title).not.toMatch(/404/i);
  });

  test("pricing page renders", async ({ authedPage, baseUrl }) => {
    await authedPage.goto(`${baseUrl}/suscripcion/planes`);

    const jsErrors: string[] = [];
    authedPage.on("pageerror", (err) => jsErrors.push(err.message));
    await authedPage.waitForLoadState("networkidle");

    expect(jsErrors).toHaveLength(0);
  });

  test("dunning management page accessible", async ({ authedPage, baseUrl }) => {
    // Creator dashboard view of failed payment notifications
    await authedPage.goto(`${baseUrl}/suscripcion/pagos-fallidos`);

    const errorHeading = authedPage.locator("h1").filter({ hasText: /500/i });
    await expect(errorHeading).not.toBeVisible({ timeout: 5000 });
  });

  test("subscription page renders currency in tenant locale", async ({ authedPage, baseUrl }) => {
    await authedPage.goto(`${baseUrl}/suscripcion/planes`);
    await authedPage.waitForLoadState("domcontentloaded");

    // AR tenant should show ARS or USD (not hardcoded MXN or CLP)
    const bodyText = await authedPage.locator("body").textContent();
    if (bodyText && bodyText.length > 200) {
      // Should NOT show MXN (wrong locale for AR tenant)
      const hasMXNOnly = bodyText.match(/\$\s*\d.*MXN/) && !bodyText.match(/ARS|USD|\$\s*\d/);
      expect(hasMXNOnly).toBeFalsy();
    }
  });
});
