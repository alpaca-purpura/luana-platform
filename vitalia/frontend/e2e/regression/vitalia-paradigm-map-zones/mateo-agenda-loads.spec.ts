// cap: scheduling.valeria-agenda
/**
 * mateo-agenda-loads.spec.ts — ruta mateo/agenda migrada carga OK (paradigm-map-zones T-6)
 *
 * Validates the agenda migrated from valeria/agenda → mateo/agenda loads correctly
 * after paradigm-map-zones T-5 routing migration.
 *
 * spec_anchor: 04-validators.yaml § fe_shell FE-2
 *              03-arch-fe.md § Tests (E2E Playwright)
 *              06-tickets.yaml T-6 deliverable mateo-agenda-loads.spec.ts
 *              02-impact.md § 9 riesgo 1 (404 silencioso si routing no migrado)
 *
 * Gherkin coverage (SC-4 fe_shell):
 *   GIVEN usuario autenticado
 *   WHEN navega directamente a /{tenantId}/mateo/agenda
 *   THEN la shell se monta (ribbon + sub-tabs-bar visibles)
 *   AND el contenido de la agenda se renderiza (no 404 / not-found)
 *   AND el tab Mateo está activo en el Ribbon
 *   AND la sub-tab "Agenda" está activa en SubTabsBar
 *
 * Route: /{tenantId}/mateo/agenda (migrated from valeria/agenda in T-5)
 *
 * IMPORTANT: valeria/agenda was the shipped route before T-5 migration.
 * After T-5: mateo/agenda is the canonical route. valeria/agenda should
 * NOT exist (or redirect to not-found-agent).
 *
 * E2E specs written correctly with POM + auth.fixture.
 * Stack not running at spec-write time — documented per ticket instructions.
 * CI runs actual suite on Green.
 *
 * downstream-regression-na: brand-local E2E spec; no cross-brand consumers
 */

import { expect } from "@playwright/test";
import { test } from "../../fixtures/shell-theme.fixture";
import { ShellOrganismPage } from "../../pages/ShellOrganismPage";
import { RibbonPage } from "../vitalia-fase1-ribbon-6-tabs/poms/ribbon-page.pom";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const TENANT_ID = process.env["E2E_TENANT_ID"] ?? "vitalia-test-tenant";

test.describe("FE-2 — mateo/agenda carga (agenda migrada de valeria/agenda)", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test("FE-2-a: ruta mateo/agenda monta el shell (ribbon + subtabs visibles)", async ({
    shellPage,
  }) => {
    const shell = new ShellOrganismPage(shellPage, TENANT_ID);

    // Navigate directly to the migrated route
    await shell.goto("mateo", "agenda");

    // Shell must be mounted
    await shell.expectShellMounted();
  });

  test("FE-2-b: mateo/agenda — NO muestra not-found-agent (ruta válida)", async ({
    shellPage,
  }) => {
    const shell = new ShellOrganismPage(shellPage, TENANT_ID);

    await shell.goto("mateo", "agenda");

    // The not-found-agent component must NOT be visible (route is valid)
    await expect(
      shell.notFoundAgent,
      "not-found-agent NO debe mostrarse — mateo/agenda es ruta válida post T-5 migration",
    ).not.toBeVisible();
  });

  test("FE-2-c: mateo/agenda — subtab-content renderiza (agenda visible)", async ({
    shellPage,
  }) => {
    const shell = new ShellOrganismPage(shellPage, TENANT_ID);

    await shell.goto("mateo", "agenda");

    // SubTabContent should render content for mateo.agenda
    await shell.expectSubTabContentVisible("mateo", "agenda");
  });

  test("FE-2-d: mateo/agenda — Mateo tab activo en Ribbon", async ({
    shellPage,
  }) => {
    const pom = new RibbonPage(shellPage);

    await pom.goto({ tenantId: TENANT_ID, agent: "mateo", subtab: "agenda" });

    // Mateo ribbon tab must be active
    await expect(pom.getTab("mateo")).toHaveAttribute("data-active", "true");
    await expect(pom.getTab("mateo")).toHaveAttribute("aria-selected", "true");
  });

  test("FE-2-e: mateo/agenda — ValeriaSidebar sigue visible (sidebar no cambia)", async ({
    shellPage,
  }) => {
    const shell = new ShellOrganismPage(shellPage, TENANT_ID);

    await shell.goto("mateo", "agenda");
    await shell.expectShellMounted();

    // ValeriaSidebar must still be present (Valeria is supervisor sidebar — no change)
    await expect(
      shell.valeriaSidebar,
      "ValeriaSidebar debe seguir visible — Valeria sigue siendo la sidebar supervisora",
    ).toBeVisible();
  });

  test("FE-2-f: deep link mateo/agenda desde URL directa (no desde ribbon)", async ({
    shellPage,
  }) => {
    // Navigate directly (simulating a bookmark or share link to the migrated route)
    await shellPage.goto(`/${TENANT_ID}/mateo/agenda`);
    await shellPage.waitForLoadState("networkidle");

    // Ribbon must load
    await expect(
      shellPage.locator('[data-testid="ribbon"]:visible').first(),
    ).toBeVisible({ timeout: 15_000 });

    // Current URL must remain at mateo/agenda (no redirect to valeria/agenda)
    expect(shellPage.url()).toContain("/mateo/agenda");
    expect(shellPage.url()).not.toContain("/valeria/agenda");
  });

  test("FE-2-g: mateo/agenda — SubTabsBar muestra sub-tab 'Agenda' activa", async ({
    shellPage,
  }) => {
    const shell = new ShellOrganismPage(shellPage, TENANT_ID);

    await shell.goto("mateo", "agenda");
    await shell.expectShellMounted();

    // SubTabsBar should show "agenda" as active sub-tab
    await shell.expectSubTabActive("agenda");
  });
});
