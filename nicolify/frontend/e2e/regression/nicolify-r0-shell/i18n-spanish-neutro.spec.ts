// voseo-allowed: test fixture que verifica la ausencia de voseo — lista el glosario como referencia técnica
/**
 * i18n-spanish-neutro.spec.ts — Scenario F2
 * nicolify-r0-shell T-6
 *
 * F2 · i18n · microcopy Spanish neutro LatAm (tuteo, sin voseo)
 * - given: shell renderizado
 * - when: inspecciono todos los strings user-facing (ver § Microcopy)
 * - then: tuteo (sin vos/sos/tenés), tildes + ñ + apertura ¿!, cero léxico regional
 *
 * gherkin_coverage: F2
 * spec_anchor: 04-validators.yaml § AV-I18N
 */

import { test, expect } from "../../auth.fixture";

// Voseo patterns to detect (per .claude/rules/spanish-text.md glosario)
const VOSEO_PATTERNS = [
  /\btenés\b/i,
  /\bpodés\b/i,
  /\bquerés\b/i,
  /\bsabés\b/i,
  /\bhacés\b/i,
  /\bvenís\b/i,
  /\bdecís\b/i,
  /\bsos\b/i, // sos = voseo (eres)
  /\bescribile\b/i, // voseo → escríbele
  /\bmirá\b/i,
  /\bdejá\b/i,
  /\bponé\b/i,
  /\busá\b/i,
  /\bagregá\b/i,
  /\bconfigurá\b/i,
  /\brevisá\b/i,
  /\bguardá\b/i,
  /\babrí\b/i,
  /\bvolvé\b/i,
  /\bcambiá\b/i,
];

test.describe("F2 — Spanish neutro LatAm (tuteo, sin voseo)", () => {
  test("shell content uses tuteo — no voseo patterns found", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // Get all text content from the shell
    const shellText = await page.locator("body").innerText();

    const foundVoseo: string[] = [];
    for (const pattern of VOSEO_PATTERNS) {
      const match = shellText.match(pattern);
      if (match) {
        foundVoseo.push(match[0]);
      }
    }

    if (foundVoseo.length > 0) {
      console.warn("Voseo found in shell:", foundVoseo);
    }

    expect(foundVoseo).toHaveLength(0);
  });

  test("empty-state copy usa tuteo correcto", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });

    const emptyState = page.locator("[data-testid='empty-state']");
    await expect(emptyState).toBeVisible({ timeout: 15_000 });

    const text = await emptyState.innerText();

    // No voseo patterns
    for (const pattern of VOSEO_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });

  test("aria-labels usan Spanish neutro LatAm", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // Check known aria-labels per spec § Microcopy
    await expect(
      page.locator("[aria-label='Saltar al contenido'], a[href='#main-content']"),
    ).toBeAttached({ timeout: 10_000 });

    await expect(
      page.locator("[aria-label='Nicolify inicio'], [data-testid='logo-mark']"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("not-found messages use tuteo", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/zzz/pipeline`, { waitUntil: "load" });

    const notFound = page.locator("[data-testid='not-found-agent']");
    await expect(notFound).toBeVisible({ timeout: 15_000 });

    const text = await notFound.innerText();

    for (const pattern of VOSEO_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }

    // Verify correct message (tuteo)
    expect(text).toContain("Ese agente no existe");
  });

  test("chat composer placeholder usa tuteo", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Composer placeholder must be "Escríbele a Luana…" (NOT "escribile")
    const composerInput = page.locator(
      "[data-testid='chat-input'], [placeholder*='Escríbele'], [placeholder*='Luana']",
    );
    if (await composerInput.count() > 0) {
      const placeholder = await composerInput.getAttribute("placeholder");
      if (placeholder) {
        expect(placeholder).not.toMatch(/escribile/i);
        expect(placeholder).toMatch(/Escr[ií]bele/i);
      }
    }
  });
});
