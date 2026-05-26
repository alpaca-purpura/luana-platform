/**
 * ribbon-deeplink.spec.ts — SC-2 happy · URL deep link marca active state correcto
 *
 * F1-S7 vitalia-fase1-ribbon-6-tabs — T-5
 *
 * Gherkin: 01-spec.md § Gherkin SC-2
 *
 * Given: usuario navega directamente (deep link) a /{tenantId}/camila/voz
 * When:  la página carga
 * Then:  extractAgentFromPath(pathname) devuelve "camila"
 * And:   Camila tab renderiza con bg-agent-camila-soft + label font-semibold
 * And:   los otros 4 tabs agentes + ConfigTab quedan inactivos
 * And:   aria-selected="true" solo en Camila tab
 *
 * gherkin_coverage:
 *   - SC-2-1: deep link camila/voz → Camila active, others inactive
 *   - SC-2-2: deep link lisa/marca → Lisa active
 *   - SC-2-3: deep link valeria/agenda → Valeria active
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

test.describe("SC-2 — URL deep link active state correcto", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test("SC-2-1: deep link camila/voz → Camila active + others inactive", async ({
    shellPage,
  }) => {
    const pom = new RibbonPage(shellPage);

    // Direct deep link to Camila
    await pom.goto({ tenantId: TENANT_ID, agent: "camila", subtab: "voz" });

    // Camila tab should be active
    await expect(pom.getTab("camila")).toHaveAttribute("data-active", "true");
    await expect(pom.getTab("camila")).toHaveAttribute("aria-selected", "true");

    // All other agent tabs should be inactive
    for (const slug of ALL_AGENT_SLUGS) {
      if (slug !== "camila") {
        await expect(pom.getTab(slug)).toHaveAttribute("data-active", "false");
        await expect(pom.getTab(slug)).toHaveAttribute(
          "aria-selected",
          "false",
        );
      }
    }

    // ConfigTab should be inactive
    await expect(pom.getConfigTab()).toHaveAttribute("data-active", "false");
    await expect(pom.getConfigTab()).toHaveAttribute("aria-selected", "false");
  });

  test("SC-2-2: deep link lisa/marca → Lisa active + others inactive", async ({
    shellPage,
  }) => {
    const pom = new RibbonPage(shellPage);

    await pom.goto({ tenantId: TENANT_ID, agent: "lisa", subtab: "marca" });

    // Lisa tab should be active
    await expect(pom.getTab("lisa")).toHaveAttribute("data-active", "true");
    await expect(pom.getTab("lisa")).toHaveAttribute("aria-selected", "true");

    // Others inactive
    for (const slug of ALL_AGENT_SLUGS) {
      if (slug !== "lisa") {
        await expect(pom.getTab(slug)).toHaveAttribute("data-active", "false");
      }
    }
    await expect(pom.getConfigTab()).toHaveAttribute("data-active", "false");
  });

  test("SC-2-3: deep link valeria/agenda → Valeria active + others inactive", async ({
    shellPage,
  }) => {
    const pom = new RibbonPage(shellPage);

    await pom.goto({ tenantId: TENANT_ID, agent: "valeria", subtab: "agenda" });

    // Valeria tab should be active
    await expect(pom.getTab("valeria")).toHaveAttribute("data-active", "true");
    await expect(pom.getTab("valeria")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // All others inactive
    for (const slug of ALL_AGENT_SLUGS) {
      if (slug !== "valeria") {
        await expect(pom.getTab(slug)).toHaveAttribute("data-active", "false");
      }
    }
    await expect(pom.getConfigTab()).toHaveAttribute("data-active", "false");
  });
});
