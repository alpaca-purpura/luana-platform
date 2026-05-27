/**
 * ribbon-config-nav.spec.ts — SC-3 happy · click ConfigTab navega a /config/cuenta
 *
 * F1-S7 vitalia-fase1-ribbon-6-tabs — T-5
 *
 * Gherkin: 01-spec.md § Gherkin SC-3
 *
 * Given: usuario en /{tenantId}/valeria/agenda, active tab Valeria visible
 * When:  click ConfigTab "Configurar"
 * Then:  router.push("/{tenantId}/config/cuenta") se invoca
 * And:   ConfigTab renderiza data-active="true" + aria-selected="true"
 * And:   tooltip "Configurar" NO es visible post-click
 * And:   todos los agent tabs quedan data-active="false"
 *
 * gherkin_coverage:
 *   - SC-3-1: click ConfigTab desde active=valeria → URL /config/cuenta + ConfigTab active
 *   - SC-3-2: ConfigTab tooltip NOT visible after click (tooltip hidden on active state)
 *
 * downstream-regression-na: brand-local E2E spec; no cross-brand consumers
 */

import { expect } from "@playwright/test";
import { test } from "../../fixtures/shell-theme.fixture";
import { RibbonPage } from "./poms/ribbon-page.pom";
import type { AgentSlug } from "@/lib/agent-catalog";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const TENANT_ID = process.env["E2E_TENANT_ID"] ?? "vitalia-test-tenant";

const ALL_AGENT_SLUGS: AgentSlug[] = [
  "lisa",
  "lucas",
  "adrian",
  "valeria",
  "camila",
];

test.describe("SC-3 — click ConfigTab navega a /config/cuenta", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test("SC-3-1: click ConfigTab desde active=valeria → URL /config/cuenta + ConfigTab active", async ({
    shellPage,
  }) => {
    const pom = new RibbonPage(shellPage);

    // Start at valeria/agenda
    await pom.goto({ tenantId: TENANT_ID, agent: "valeria", subtab: "agenda" });

    // Verify initial state: Valeria is active
    const initialActive = await pom.getActiveSlug();
    expect(initialActive).toBe("valeria");

    // Click ConfigTab
    await pom.clickConfigTab();

    // URL should change to /{tenantId}/config/cuenta
    await shellPage.waitForURL(`**/${TENANT_ID}/config/cuenta`, {
      timeout: 10_000,
    });

    // ConfigTab should be active
    await expect(pom.getConfigTab()).toHaveAttribute("data-active", "true");
    await expect(pom.getConfigTab()).toHaveAttribute("aria-selected", "true");

    // All agent tabs should be inactive
    for (const slug of ALL_AGENT_SLUGS) {
      await expect(pom.getTab(slug)).toHaveAttribute("data-active", "false");
      await expect(pom.getTab(slug)).toHaveAttribute("aria-selected", "false");
    }
  });

  test("SC-3-2: ConfigTab tooltip NOT visible after click (tooltip hidden on active tab)", async ({
    shellPage,
  }) => {
    const pom = new RibbonPage(shellPage);

    await pom.goto({ tenantId: TENANT_ID, agent: "valeria", subtab: "agenda" });

    // Click ConfigTab
    await pom.clickConfigTab();

    // Wait for navigation to complete
    await shellPage.waitForURL(`**/${TENANT_ID}/config/cuenta`, {
      timeout: 10_000,
    });

    // Tooltip "Configurar" should NOT be visible post-click
    // Move mouse away from ConfigTab to ensure hover tooltip would show if present
    await shellPage.mouse.move(0, 0);
    await shellPage.waitForTimeout(200);

    const tooltip = await pom.getTooltip();
    // Tooltip should be null (not visible) — it was triggered by hover, not by being active
    expect(tooltip).toBeNull();
  });
});
