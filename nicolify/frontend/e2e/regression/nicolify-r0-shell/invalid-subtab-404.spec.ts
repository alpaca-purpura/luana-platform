/**
 * invalid-subtab-404.spec.ts — Scenario A3
 * nicolify-r0-shell T-6
 *
 * A3 · negative · sub-tab inválida para agente válido → 404 contextual
 * - given: usuario autenticado
 * - when: navega a /{tenantId}/abel/zzz (sub-tab fuera de AGENT_SUBTABS[abel])
 * - then: not-found.tsx del segmento [subtab] renderiza
 *   · Ribbon marca Abel activo · SubTabsBar de Abel visible
 *
 * gherkin_coverage: A3
 * spec_anchor: 04-validators.yaml § F-A3
 */

import { test, expect } from "../../auth.fixture";

test.describe("A3 — sub-tab inválida → 404 contextual", () => {
  test("not-found muestra 'Esa sección no existe para este agente'", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/abel/zzz`, { waitUntil: "load" });

    await expect(
      page.locator("[data-testid='not-found-subtab']"),
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByText("Esa sección no existe para este agente"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shell chrome (TopBar) sigue visible en 404 subtab", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/nonexistent-subtab`, {
      waitUntil: "load",
    });

    // TopBar still visible
    await expect(
      page.locator("header[role='banner'], [data-testid='topbar-global']"),
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByText("Esa sección no existe para este agente"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("invalid subtab for multiple valid agents all trigger 404", async ({
    page,
    tenantId,
  }) => {
    const combinations = [
      { agent: "abel", subtab: "invalid" },
      { agent: "christian", subtab: "xyz" },
      { agent: "sara", subtab: "not-a-tab" },
    ];

    for (const { agent, subtab } of combinations) {
      await page.goto(`/${tenantId}/${agent}/${subtab}`, { waitUntil: "load" });
      await expect(
        page.getByText("Esa sección no existe para este agente"),
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
