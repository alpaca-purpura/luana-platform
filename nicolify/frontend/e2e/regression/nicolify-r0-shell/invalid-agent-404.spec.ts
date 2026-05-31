/**
 * invalid-agent-404.spec.ts — Scenario A2
 * nicolify-r0-shell T-6
 *
 * A2 · negative · slug de agente inválido → 404 contextual
 * - given: usuario autenticado
 * - when: navega a /{tenantId}/zzz/pipeline (agente inexistente)
 * - then: not-found.tsx del segmento [agent] renderiza ("Ese agente no existe")
 *   · shell chrome (TopBar + Ribbon + Luana) sigue visible · Ribbon sin tab activa
 *
 * gherkin_coverage: A2
 * spec_anchor: 04-validators.yaml § F-A2
 */

import { test, expect } from "../../auth.fixture";

test.describe("A2 — slug agente inválido → 404 contextual", () => {
  test("not-found muestra 'Ese agente no existe'", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/zzz/pipeline`, { waitUntil: "load" });

    await expect(page.locator("[data-testid='not-found-agent']")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByText("Ese agente no existe")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shell chrome (TopBar) sigue visible en 404 agent", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/nonexistent-agent/pipeline`, {
      waitUntil: "load",
    });

    // Shell layout should still render (TopBar visible)
    await expect(
      page.locator("header[role='banner'], [data-testid='topbar-global']"),
    ).toBeVisible({ timeout: 15_000 });

    // Not-found content visible
    await expect(page.getByText("Ese agente no existe")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("various invalid agent slugs all trigger 404", async ({
    page,
    tenantId,
  }) => {
    const invalidSlugs = ["zzz", "valeria", "nonexistent", "luana", "foo-bar"];

    for (const slug of invalidSlugs) {
      await page.goto(`/${tenantId}/${slug}/pipeline`, { waitUntil: "load" });
      await expect(page.getByText("Ese agente no existe")).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});
