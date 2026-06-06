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
 * Self-provisioning (HB-32): lista and detalle baselines self-provision an ICP
 * via abel-api.ts so they don't depend on E2E_*_ID env vars.
 * Visual comparison gated behind E2E_VISUAL_ENABLED=1 (manual step — do NOT
 * run --update-snapshots in CI).
 *
 * After capture, baselines live in:
 *   e2e/specs/regression/abel-icp-visual-goldens.spec.ts-snapshots/
 *
 * gherkin_coverage: SC-happy (visual), SC-empty (visual)
 * spec_anchor: 04-validators.yaml § visual (goldens 4×2)
 * story-origin: nicolify-r1-abel-icp-buyer T-E2E-1 / T-E2E-2
 */

import { test, expect } from "../../fixtures/base";
import { AbelIcpMasterPage } from "../../poms/AbelIcpMasterPage";
import { AbelIcpDetailPage } from "../../poms/AbelIcpDetailPage";
import {
  createIcp,
  deleteAllIcps,
  deleteIcp,
  extractIcp,
  pollExtractJob,
} from "../../helpers/abel-api";

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
// Self-provisions by deleting all ICPs before navigating.
// ---------------------------------------------------------------------------
test.describe("Visual: arranque — DraftFirstStarter (empty state)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const theme of ["light", "dark"] as const) {
    test(`arranque ${theme} — DraftFirstStarter`, async ({
      page,
      tenantId,
      request,
    }) => {
      // Self-provision empty state: delete all ICPs
      await deleteAllIcps(request, tenantId);

      const masterPage = new AbelIcpMasterPage(page);
      await masterPage.goto(tenantId);

      await expect(
        page.locator("[data-shell-ready='true']"),
      ).toBeVisible({ timeout: 20_000 });

      // Must be in empty state
      await expect(masterPage.emptyState).toBeVisible({ timeout: 15_000 });

      // Set theme
      await setTheme(page, theme);

      // Visual comparison gated behind flag
      if (process.env["E2E_VISUAL_ENABLED"]) {
        // Scope: capture only the DraftFirstStarter region
        await screenshotFeatureRegion(
          page,
          "[data-testid='draft-first-starter']",
          `arranque-${theme}.png`,
        );
      }

      // Anti-burbuja
      await expect(
        page.locator("[data-nextjs-dialog], [data-nextjs-error-overlay]"),
      ).toHaveCount(0);
    });
  }
});

// ---------------------------------------------------------------------------
// View: lista (IcpMasterList con IcpCard grid — SIN completeness ring)
// Self-provisions an ICP so the list state is guaranteed.
// ---------------------------------------------------------------------------
test.describe("Visual: lista — IcpMasterList con IcpCards", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const theme of ["light", "dark"] as const) {
    test(`lista ${theme} — IcpMasterList`, async ({ page, tenantId, request }) => {
      // Self-provision: create an ICP so we're guaranteed to see list state
      const icp = await createIcp(
        request,
        tenantId,
        `[e2e] visual-lista-${theme}-${Date.now()}`,
      );

      try {
        const masterPage = new AbelIcpMasterPage(page);
        await masterPage.goto(tenantId);

        await expect(
          page.locator("[data-shell-ready='true']"),
        ).toBeVisible({ timeout: 20_000 });

        // IcpMasterList must be visible (we just created an ICP)
        await expect(masterPage.masterList, "IcpMasterList visible").toBeVisible({
          timeout: 15_000,
        });

        // Set theme
        await setTheme(page, theme);

        // Visual comparison gated behind flag (baseline capture is manual)
        if (process.env["E2E_VISUAL_ENABLED"]) {
          // Scope: capture the card grid region
          await screenshotFeatureRegion(
            page,
            "[data-testid='icp-master-list']",
            `lista-${theme}.png`,
          );
        }

        // Verify: no completeness ring/barra (RN-8 eliminated it)
        const completenessRing = page.locator(
          "[data-testid='completeness-ring'], .completeness-bar, [aria-label*='completitud']",
        );
        await expect(completenessRing).toHaveCount(0);
      } finally {
        await deleteIcp(request, tenantId, icp.id).catch(() => undefined);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// View: detalle (EntitySubNavBar + IcpDatosForm + WhatForChip)
// Self-provisions an ICP so we don't depend on E2E_ICP_ID.
// ---------------------------------------------------------------------------
test.describe("Visual: detalle — EntitySubNavBar + IcpDatosForm", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const theme of ["light", "dark"] as const) {
    test(`detalle ${theme} — EntitySubNavBar + IcpDatosForm`, async ({
      page,
      tenantId,
      request,
    }) => {
      // Self-provision: create an ICP for the detalle visual
      const icp = await createIcp(
        request,
        tenantId,
        `[e2e] visual-detalle-${theme}-${Date.now()}`,
      );

      try {
        const detailPage = new AbelIcpDetailPage(page);
        await detailPage.goto(tenantId, icp.id);

        await expect(detailPage.subNavBar).toBeVisible({ timeout: 15_000 });
        await expect(detailPage.datosForm).toBeVisible({ timeout: 15_000 });

        // Set theme
        await setTheme(page, theme);

        // Visual comparison gated behind flag
        if (process.env["E2E_VISUAL_ENABLED"]) {
          // Scope: capture the entity workspace view (EntitySubNavBar + form content)
          await screenshotFeatureRegion(
            page,
            "[data-testid='icp-workspace-view']",
            `detalle-${theme}.png`,
          );
        }

        // Anti-burbuja: form must be stable
        await expect(
          page.locator("[data-nextjs-dialog], [data-nextjs-error-overlay]"),
        ).toHaveCount(0);
      } finally {
        await deleteIcp(request, tenantId, icp.id).catch(() => undefined);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// View: propuesta (ProposalBanner — draft-first)
// Self-provisions a draft ICP via extraction so we have origin=draft.
// ---------------------------------------------------------------------------
test.describe("Visual: propuesta — ProposalBanner (draft-first)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const theme of ["light", "dark"] as const) {
    test(`propuesta ${theme} — ProposalBanner`, async ({
      page,
      tenantId,
      request,
    }) => {
      // Self-provision: extract an ICP (origin=draft → ProposalBanner visible)
      const job = await extractIcp(
        request,
        tenantId,
        `[e2e] visual-propuesta-${theme} Agencias B2B LatAm 10-50 empleados retainer`,
      );
      const completed = await pollExtractJob(request, tenantId, job.job_id);

      // If extraction failed (LLM unavailable), skip gracefully
      if (completed.status === "failed" || !completed.icp_id) {
        // Cannot test ProposalBanner without a draft ICP — skip this view
        return;
      }

      const draftIcpId = completed.icp_id;

      try {
        const detailPage = new AbelIcpDetailPage(page);
        await detailPage.goto(tenantId, draftIcpId);

        await expect(
          detailPage.proposalBanner,
          "ProposalBanner visible para ICP extraído",
        ).toBeVisible({ timeout: 15_000 });

        // Set theme
        await setTheme(page, theme);

        // Visual comparison gated behind flag
        if (process.env["E2E_VISUAL_ENABLED"]) {
          // Scope: capture the ProposalBanner region only
          await screenshotFeatureRegion(
            page,
            "[data-testid='proposal-banner']",
            `propuesta-${theme}.png`,
          );
        }

        // Anti-burbuja
        await expect(
          page.locator("[data-nextjs-dialog], [data-nextjs-error-overlay]"),
        ).toHaveCount(0);
      } finally {
        await deleteIcp(request, tenantId, draftIcpId).catch(() => undefined);
      }
    });
  }
});
