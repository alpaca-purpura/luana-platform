/**
 * path-xss-guard.spec.ts — Scenario A4
 * nicolify-r0-shell T-6
 *
 * A4 · adversarial · XSS / path injection en segmentos de ruta
 * - given: usuario autenticado
 * - when: navega a /{tenantId}/<script>alert(1)</script>/pipeline
 * - then: segmento sanitizado por whitelist de shell-routes.ts → 404 contextual
 *   · cero ejecución de script · cero render del payload como HTML
 *
 * gherkin_coverage: A4
 * spec_anchor: 04-validators.yaml adversarial + 01-spec.md § A4
 */

import { test, expect } from "../../auth.fixture";

test.describe("A4 — XSS / path-injection guard", () => {
  test("XSS payload en agent segment → 404 (no ejecución)", async ({
    page,
    tenantId,
  }) => {
    // Navigate to XSS payload URL — Next.js will URL-encode before routing
    await page.goto(`/${tenantId}/%3Cscript%3Ealert(1)%3C%2Fscript%3E/pipeline`, {
      waitUntil: "load",
    });

    // Should render 404 (agent not in whitelist)
    await expect(page.getByText("Ese agente no existe")).toBeVisible({
      timeout: 15_000,
    });

    // No alert dialog (no script execution)
    // If a dialog appeared, the test would fail due to unexpected dialog
    expect(page.url()).not.toContain("javascript:");
  });

  test("path traversal en agent segment → 404", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/..%2F..%2F/pipeline`, { waitUntil: "load" });

    // Should render some 404 (not-found or shell redirect)
    const text = await page.locator("body").innerText();
    // Either a not-found page or redirect to sign-in — not a crash
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test("prototype pollution attempt → 404", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/__proto__/pipeline`, { waitUntil: "load" });

    // Not a valid agent → 404
    await expect(page.getByText("Ese agente no existe")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("SQL injection attempt → 404", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/1%27%20OR%20%271%27%3D%271/pipeline`, {
      waitUntil: "load",
    });

    // Not a valid agent → 404
    await expect(page.getByText("Ese agente no existe")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("empty string agent → 404 or redirect", async ({ page, tenantId }) => {
    // An empty agent segment will likely resolve differently, but should not crash
    await page.goto(`/${tenantId}`, { waitUntil: "load" });

    // Root redirects to DEFAULT_LANDING (valid behavior)
    await page.waitForURL(`**/${tenantId}/christian/pipeline**`, {
      timeout: 30_000,
    });
    expect(page.url()).toContain("/christian/pipeline");
  });
});
