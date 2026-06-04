// cap: abel/icp-buyer
/**
 * abel-icp-visual-goldens.spec.ts — Visual regression goldens for abel/icp feature.
 *
 * 4 views × 2 themes = 8 baseline screenshots.
 *   - arranque  (light/dark): DraftFirstStarter — empty state con 2 CTAs
 *   - lista     (light/dark): IcpMasterList con IcpCard grid (SIN completeness ring — RN-8)
 *   - detalle   (light/dark): EntitySubNavBar + IcpDatosForm + WhatForChip
 *   - propuesta (light/dark): ProposalBanner (draft-first, origin=draft + borrador)
 *
 * Scope: /abel/icp** routes ONLY (per playwright_visual_scope).
 * Screenshots are SCOPED to the feature region — NOT full-page shell wrapper
 * (R0 shell already has its own goldens).
 *
 * BASELINE CAPTURE DEFERRED-TO-DEMO:
 *   Baselines will be captured during the Chris demo gate on the live stack.
 *   Run with: npx playwright test abel-icp-visual-goldens --update-snapshots
 *   on the freshly migrated stack (make dev-nicolify + migration 002 applied).
 *
 * After capture, baselines live in:
 *   e2e/specs/regression/abel-icp-visual-goldens.spec.ts-snapshots/
 *
 * gherkin_coverage: SC-happy (visual), SC-empty (visual)
 * spec_anchor: 04-validators.yaml § visual (goldens 4×2)
 * story-origin: nicolify-r1-abel-icp-buyer T-E2E-1
 */

import { test, expect } from "../../fixtures/base";
import { AbelIcpMasterPage } from "../../poms/AbelIcpMasterPage";
import { AbelIcpDetailPage } from "../../poms/AbelIcpDetailPage";

// ---------------------------------------------------------------------------
// Helper: set Tailwind dark mode via data-attribute / class toggle
// ---------------------------------------------------------------------------
async function setTheme(
  page: import("@playwright/test").Page,
  theme: "light" | "dark",
): Promise<void> {
  await page.evaluate((t: "light" | "dark") => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, theme);
  // Brief settle for CSS transitions
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Scoped screenshot region — captures only the feature panel (not shell wrapper)
// ---------------------------------------------------------------------------
async function screenshotFeatureRegion(
  page: import("@playwright/test").Page,
  regionSelector: string,
  snapshotName: string,
): Promise<void> {
  const region = page.locator(regionSelector).first();
  await region.waitFor({ state: "visible", timeout: 15_000 });
  await expect(region).toHaveScreenshot(snapshotName, {
    maxDiffPixelRatio: 0.02, // 2% tolerance for font rendering differences
    animations: "disabled",
  });
}

// ---------------------------------------------------------------------------
// View: arranque (DraftFirstStarter — empty state)
// ---------------------------------------------------------------------------
test.describe("Visual: arranque — DraftFirstStarter (empty state)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const theme of ["light", "dark"] as const) {
    test(`arranque ${theme} — DraftFirstStarter`, async ({ page, tenantId }) => {
      // DEFERRED-TO-DEMO: Requires tenant with 0 ICPs.
      // Baseline will be captured during Chris demo gate.
      if (!process.env["E2E_VISUAL_ENABLED"]) {
        test.skip(true, "DEFERRED-TO-DEMO: visual baselines captured during demo gate. Set E2E_VISUAL_ENABLED=1 with live stack.");
        return;
      }

      const masterPage = new AbelIcpMasterPage(page);
      await masterPage.goto(tenantId);

      await expect(
        page.locator("[data-shell-ready='true']"),
      ).toBeVisible({ timeout: 20_000 });

      // Set theme
      await setTheme(page, theme);

      // Wait for DraftFirstStarter to be visible
      const state = await masterPage.waitForStableState(10_000);
      if (state !== "empty") {
        test.skip(true, "Tenant has ICPs — use a fresh tenant for arranque visual.");
        return;
      }

      // Scope: capture only the DraftFirstStarter region
      await screenshotFeatureRegion(
        page,
        "[data-testid='draft-first-starter']",
        `arranque-${theme}.png`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// View: lista (IcpMasterList con IcpCard grid — SIN completeness ring)
// ---------------------------------------------------------------------------
test.describe("Visual: lista — IcpMasterList con IcpCards", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const theme of ["light", "dark"] as const) {
    test(`lista ${theme} — IcpMasterList`, async ({ page, tenantId }) => {
      // DEFERRED-TO-DEMO: Requires seeded ICPs.
      if (!process.env["E2E_VISUAL_ENABLED"]) {
        test.skip(true, "DEFERRED-TO-DEMO: visual baselines captured during demo gate. Set E2E_VISUAL_ENABLED=1.");
        return;
      }

      const masterPage = new AbelIcpMasterPage(page);
      await masterPage.goto(tenantId);

      await expect(
        page.locator("[data-shell-ready='true']"),
      ).toBeVisible({ timeout: 20_000 });

      // Set theme
      await setTheme(page, theme);

      // Wait for IcpMasterList to be visible
      const state = await masterPage.waitForStableState(10_000);
      if (state !== "loaded") {
        test.skip(true, "No ICPs in DB — use E2E_ICP_ID tenant for lista visual.");
        return;
      }

      // Scope: capture the card grid region
      await screenshotFeatureRegion(
        page,
        "[data-testid='icp-master-list']",
        `lista-${theme}.png`,
      );

      // Verify: no completeness ring/barra (RN-8 eliminated it)
      // The mockup CSS had `.ring` but the spec overrides: NO ring
      const completenessRing = page.locator(
        "[data-testid='completeness-ring'], .completeness-bar, [aria-label*='completitud']",
      );
      await expect(completenessRing).toHaveCount(0);
    });
  }
});

// ---------------------------------------------------------------------------
// View: detalle (EntitySubNavBar + IcpDatosForm + WhatForChip)
// ---------------------------------------------------------------------------
test.describe("Visual: detalle — EntitySubNavBar + IcpDatosForm", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const theme of ["light", "dark"] as const) {
    test(`detalle ${theme} — EntitySubNavBar + IcpDatosForm`, async ({
      page,
      tenantId,
    }) => {
      const icpId = process.env["E2E_ICP_ID"] ?? "DEFERRED";

      if (!process.env["E2E_VISUAL_ENABLED"] || icpId === "DEFERRED") {
        test.skip(true, "DEFERRED-TO-DEMO: set E2E_VISUAL_ENABLED=1 + E2E_ICP_ID=<uuid> with live stack.");
        return;
      }

      const detailPage = new AbelIcpDetailPage(page);
      await detailPage.goto(tenantId, icpId);

      await expect(detailPage.subNavBar).toBeVisible({ timeout: 15_000 });
      await expect(detailPage.datosForm).toBeVisible({ timeout: 15_000 });

      // Set theme
      await setTheme(page, theme);

      // Scope: capture the entity workspace view (EntitySubNavBar + form content)
      await screenshotFeatureRegion(
        page,
        "[data-testid='icp-workspace-view']",
        `detalle-${theme}.png`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// View: propuesta (ProposalBanner — draft-first)
// ---------------------------------------------------------------------------
test.describe("Visual: propuesta — ProposalBanner (draft-first)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const theme of ["light", "dark"] as const) {
    test(`propuesta ${theme} — ProposalBanner`, async ({ page, tenantId }) => {
      const draftIcpId = process.env["E2E_DRAFT_ICP_ID"] ?? "DEFERRED";

      if (!process.env["E2E_VISUAL_ENABLED"] || draftIcpId === "DEFERRED") {
        test.skip(true, "DEFERRED-TO-DEMO: set E2E_VISUAL_ENABLED=1 + E2E_DRAFT_ICP_ID=<uuid> with live stack.");
        return;
      }

      const detailPage = new AbelIcpDetailPage(page);
      await detailPage.goto(tenantId, draftIcpId);

      await expect(detailPage.proposalBanner, "ProposalBanner visible").toBeVisible({
        timeout: 15_000,
      });

      // Set theme
      await setTheme(page, theme);

      // Scope: capture the ProposalBanner region only
      await screenshotFeatureRegion(
        page,
        "[data-testid='proposal-banner']",
        `propuesta-${theme}.png`,
      );
    });
  }
});
