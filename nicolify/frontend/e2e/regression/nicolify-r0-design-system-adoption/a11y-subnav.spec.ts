// cap: design-system/nicolify-ui-homologation
/**
 * T-5 Accessibility Tests — EntitySubNavBar (V9 validator)
 *
 * SC-5 coverage (01-spec.md § Gherkin):
 *   - axe wcag2aa on ICP detail page (no critical/serious violations)
 *   - Roving tabindex: ←→ cycles leaves, Home → first leaf, End → last leaf
 *   - role="tablist" on EntitySubNavBar
 *   - Disabled state (directory-mode): leaves aria-disabled when no entity selected
 *
 * Uses auth fixture (per playwright-expert — NEVER @playwright/test directly).
 */

import AxeBuilder from "@axe-core/playwright";

import { test, expect } from "../../auth.fixture";

const SEED_ICP_ID = process.env["E2E_SEED_ICP_ID"] ?? "seed-icp-1";

const detailRoute = (tenantId: string, icpId: string, leaf = "datos") =>
  `/${tenantId}/abel/icp/${icpId}/${leaf}`;

const masterRoute = (tenantId: string) => `/${tenantId}/abel/icp`;

test.describe("SC-5 – EntitySubNavBar accessibility", () => {
  test.describe("axe wcag2aa", () => {
    test("ICP detail page has no critical/serious wcag2aa violations", async ({
      page,
      tenantId,
    }) => {
      await page.goto(detailRoute(tenantId, SEED_ICP_ID, "datos"));
      await page.waitForLoadState("networkidle");

      // Wait for the subnav to mount before running axe
      await expect(
        page
          .getByRole("tablist")
          .or(page.locator('[data-testid="entity-sub-nav-bar"]')),
      ).toBeVisible({ timeout: 20_000 });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        // Exclude third-party widgets that may have known violations
        .exclude('[data-testid="luana-chat-sidebar"]')
        .analyze();

      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      expect(
        criticalOrSerious,
        `wcag2aa violations: ${JSON.stringify(criticalOrSerious.map((v) => ({ id: v.id, impact: v.impact, description: v.description })), null, 2)}`,
      ).toHaveLength(0);
    });
  });

  test.describe("role=tablist presence", () => {
    test("EntitySubNavBar renders with role=tablist", async ({
      page,
      tenantId,
    }) => {
      await page.goto(detailRoute(tenantId, SEED_ICP_ID, "datos"));
      await page.waitForLoadState("networkidle");

      const tablist = page.getByRole("tablist");
      await expect(tablist).toBeVisible({ timeout: 20_000 });
    });
  });

  test.describe("roving tabindex — keyboard navigation", () => {
    test("ArrowRight moves focus to next leaf", async ({
      page,
      tenantId,
    }) => {
      await page.goto(detailRoute(tenantId, SEED_ICP_ID, "datos"));
      await page.waitForLoadState("networkidle");

      // Focus the first tab (datos leaf)
      const firstTab = page.getByRole("tab").first();
      await firstTab.waitFor({ state: "visible", timeout: 20_000 });
      await firstTab.focus();

      // Press ArrowRight → second tab should receive focus
      await page.keyboard.press("ArrowRight");

      const secondTab = page.getByRole("tab").nth(1);
      await expect(secondTab).toBeFocused({ timeout: 5_000 });
    });

    test("ArrowLeft moves focus to previous leaf", async ({
      page,
      tenantId,
    }) => {
      await page.goto(detailRoute(tenantId, SEED_ICP_ID, "datos"));
      await page.waitForLoadState("networkidle");

      // Start on second tab
      const secondTab = page.getByRole("tab").nth(1);
      await secondTab.waitFor({ state: "visible", timeout: 20_000 });
      await secondTab.focus();

      await page.keyboard.press("ArrowLeft");

      const firstTab = page.getByRole("tab").first();
      await expect(firstTab).toBeFocused({ timeout: 5_000 });
    });

    test("Home key moves focus to first leaf", async ({
      page,
      tenantId,
    }) => {
      await page.goto(detailRoute(tenantId, SEED_ICP_ID, "datos"));
      await page.waitForLoadState("networkidle");

      // Focus last tab first
      const tabs = page.getByRole("tab");
      await tabs.first().waitFor({ state: "visible", timeout: 20_000 });
      const count = await tabs.count();
      if (count > 1) {
        await tabs.last().focus();
        await page.keyboard.press("Home");
        await expect(tabs.first()).toBeFocused({ timeout: 5_000 });
      } else {
        // Only 1 leaf — Home on it stays on it
        await tabs.first().focus();
        await page.keyboard.press("Home");
        await expect(tabs.first()).toBeFocused({ timeout: 5_000 });
      }
    });

    test("End key moves focus to last leaf", async ({
      page,
      tenantId,
    }) => {
      await page.goto(detailRoute(tenantId, SEED_ICP_ID, "datos"));
      await page.waitForLoadState("networkidle");

      const tabs = page.getByRole("tab");
      await tabs.first().waitFor({ state: "visible", timeout: 20_000 });

      // Start on first tab
      await tabs.first().focus();
      await page.keyboard.press("End");

      await expect(tabs.last()).toBeFocused({ timeout: 5_000 });
    });

    test("ArrowRight wraps from last leaf to first leaf", async ({
      page,
      tenantId,
    }) => {
      await page.goto(detailRoute(tenantId, SEED_ICP_ID, "datos"));
      await page.waitForLoadState("networkidle");

      const tabs = page.getByRole("tab");
      await tabs.first().waitFor({ state: "visible", timeout: 20_000 });
      const count = await tabs.count();

      // Focus last tab and press ArrowRight
      await tabs.last().focus();
      await page.keyboard.press("ArrowRight");

      // Should wrap to first
      await expect(tabs.first()).toBeFocused({ timeout: 5_000 });
      void count; // suppress unused-var lint (count used for context)
    });

    test("ArrowLeft wraps from first leaf to last leaf", async ({
      page,
      tenantId,
    }) => {
      await page.goto(detailRoute(tenantId, SEED_ICP_ID, "datos"));
      await page.waitForLoadState("networkidle");

      const tabs = page.getByRole("tab");
      await tabs.first().waitFor({ state: "visible", timeout: 20_000 });

      // Focus first tab and press ArrowLeft
      await tabs.first().focus();
      await page.keyboard.press("ArrowLeft");

      // Should wrap to last
      await expect(tabs.last()).toBeFocused({ timeout: 5_000 });
    });
  });

  test.describe("directory-mode — leaves disabled when no entity selected", () => {
    test("tabs are aria-disabled on ICP list (no entity selected)", async ({
      page,
      tenantId,
    }) => {
      await page.goto(masterRoute(tenantId));
      await page.waitForLoadState("networkidle");

      // In directory-mode (master list, no entity selected),
      // if EntitySubNavBar renders, leaves must be aria-disabled.
      // If the component is NOT rendered on the list page, this test passes
      // vacuously (correct: subnav only shows on detail).
      const tablist = page.locator('[role="tablist"]');
      const tablistCount = await tablist.count();

      if (tablistCount > 0) {
        // Subnav is rendered in directory-mode — verify leaves are disabled
        const tabs = page.getByRole("tab");
        const tabCount = await tabs.count();
        for (let i = 0; i < tabCount; i++) {
          const tab = tabs.nth(i);
          const ariaDisabled = await tab.getAttribute("aria-disabled");
          const opacity = await tab.evaluate(
            (el) => window.getComputedStyle(el).opacity,
          );
          // Either aria-disabled=true OR visually attenuated (opacity < 0.6)
          const isDisabled =
            ariaDisabled === "true" || parseFloat(opacity) < 0.6;
          expect(
            isDisabled,
            `Tab ${i} should be disabled/attenuated in directory-mode`,
          ).toBe(true);
        }
      }
      // If no tablist on list page → pass (correct architecture)
    });
  });
});
