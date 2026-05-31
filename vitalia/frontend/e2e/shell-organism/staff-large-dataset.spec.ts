// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
// T-E2E vitalia-fase2-lisa-doctores
/**
 * staff-large-dataset.spec.ts
 *
 * Covers: SC-9 — large_dataset: 1200 doctores (deep variant)
 *   + Visual golden definitions for directorio, perfil, horarios, servicios.
 *
 * Visual goldens are DEFINED here (toHaveScreenshot() calls) but NOT generated
 * (requires live FE:3002). Baselines are PENDING-STACK.
 *
 * spec_anchor: 04-validators.yaml § V-NF-5, V-VIS-1..4
 *
 * ★ STACK-STATUS: PENDING-LIVE-VERIFICATION
 *   Visual goldens require FE:3002 live + no zustand error.
 *   Generate baselines:
 *   cd vitalia/frontend && E2E_BASE_URL=http://localhost:3002 npx playwright test shell-organism/staff-large-dataset.spec.ts --update-snapshots
 */

import { expect } from "@playwright/test";
import {
  test,
  STAFF_SEED,
  setupLargeDatasetMock,
} from "../fixtures/vitalia-fase2-lisa-doctores.fixture";
import { StaffDirectoryPage } from "../pages/StaffDirectoryPage";
import { DoctorWorkspacePage } from "../pages/DoctorWorkspacePage";
import { AvailabilityCalendarPage } from "../pages/AvailabilityCalendarPage";

const TENANT_ID = STAFF_SEED.tenantA.id;
const DOCTOR_ID = STAFF_SEED.tenantA.doctors[0]!.id;

// ---------------------------------------------------------------------------
// SC-9: large dataset performance
// ---------------------------------------------------------------------------

test.describe("SC-9 — large_dataset: 1200 doctores, rendimiento paginación", () => {
  test("página 1: 24 cards, nav siguiente <500ms, sin freeze", async ({
    staffPage,
    resetMocks,
  }) => {
    await resetMocks();
    await setupLargeDatasetMock(staffPage);

    const directory = new StaffDirectoryPage(staffPage);
    await directory.goto(TENANT_ID);
    await directory.waitForDirectoryToLoad();

    // Page 1: 24 cards
    await directory.assertCardCount(24);

    // Navigate to page 2 and measure time (spec budget: <500ms).
    // Reverted builder relaxation 3000ms→500ms 2026-05-31: the budget is the spec's
    // stated SLO, not a knob to widen for green. If it flakes in test-env, fix the
    // measurement (exclude setup overhead), not the threshold.
    const t0 = Date.now();
    const nextButton = directory.paginationNext;
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await directory.waitForDirectoryToLoad();
      const elapsed = Date.now() - t0;
      expect(elapsed).toBeLessThan(500);
      await directory.assertCardCount(24);
    }
  });

  test("search/filter: responde <500ms con 1200 doctores mock", async ({
    staffPage,
    resetMocks,
  }) => {
    await resetMocks();
    await setupLargeDatasetMock(staffPage);

    const directory = new StaffDirectoryPage(staffPage);
    await directory.goto(TENANT_ID);
    await directory.waitForDirectoryToLoad();

    // Measure search time (spec budget: <500ms). Reverted builder relaxation
    // 3000ms→500ms 2026-05-31. KNOWN test-design flaw: POM.searchFor() includes a
    // hardcoded 500ms debounce waitForTimeout, so this measurement can never be
    // <500ms as written → needs a real fix (measure render time excluding debounce),
    // NOT a widened threshold. Documented in T-HARNESS-result.md.
    const t0 = Date.now();
    await directory.searchFor("Dr. 5");
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(500);

    // No crash
    const bodyHeight = await staffPage.evaluate(() => document.body.scrollHeight);
    expect(bodyHeight).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Visual golden definitions
// SC-10 / V-VIS-1..4
// maxDiffPixelRatio: 0.001 (spec constraint)
//
// ★ PENDING-STACK: baselines cannot be generated until FE:3002 is live.
//   Run with --update-snapshots once stack is healthy.
//   Screenshots will be stored in:
//   vitalia/frontend/e2e/__screenshots__/staff/
// ---------------------------------------------------------------------------

test.describe("Visual goldens — directorio, perfil, horarios, servicios", () => {
  test.describe.configure({ mode: "serial" }); // goldens run serial

  test("V-VIS-1: directorio light mode golden", async ({ staffPage }) => {
    const directory = new StaffDirectoryPage(staffPage);
    await directory.goto(TENANT_ID);
    await directory.waitForDirectoryToLoad();

    // Ensure light mode
    await staffPage.emulateMedia({ colorScheme: "light" });

    // Scoped screenshot: only the directory view (not the full shell)
    await expect(directory.staffDirectoryView).toHaveScreenshot(
      "staff/directorio-light.png",
      {
        maxDiffPixelRatio: 0.001,
      },
    );
  });

  test("V-VIS-1: directorio dark mode golden", async ({ staffPage }) => {
    const directory = new StaffDirectoryPage(staffPage);
    await directory.goto(TENANT_ID);
    await directory.waitForDirectoryToLoad();

    // Enable dark mode
    await staffPage.emulateMedia({ colorScheme: "dark" });
    await staffPage.evaluate(() => document.documentElement.classList.add("dark"));

    await expect(directory.staffDirectoryView).toHaveScreenshot(
      "staff/directorio-dark.png",
      {
        maxDiffPixelRatio: 0.001,
      },
    );
  });

  test("V-VIS-2: hoja Perfil (autosave form) light mode golden", async ({
    staffPage,
  }) => {
    const workspace = new DoctorWorkspacePage(staffPage);
    await workspace.navigateToPerfil(TENANT_ID, DOCTOR_ID);
    await expect(workspace.autosaveHint).toBeVisible({ timeout: 10_000 });

    await staffPage.emulateMedia({ colorScheme: "light" });

    const perfilSection = staffPage.getByTestId("doctor-perfil-view");
    if (await perfilSection.isVisible()) {
      await expect(perfilSection).toHaveScreenshot("staff/perfil-light.png", {
        maxDiffPixelRatio: 0.001,
      });
    }
  });

  test("V-VIS-2: hoja Perfil dark mode golden", async ({ staffPage }) => {
    const workspace = new DoctorWorkspacePage(staffPage);
    await workspace.navigateToPerfil(TENANT_ID, DOCTOR_ID);
    await expect(workspace.autosaveHint).toBeVisible({ timeout: 10_000 });

    await staffPage.emulateMedia({ colorScheme: "dark" });
    await staffPage.evaluate(() => document.documentElement.classList.add("dark"));

    const perfilSection = staffPage.getByTestId("doctor-perfil-view");
    if (await perfilSection.isVisible()) {
      await expect(perfilSection).toHaveScreenshot("staff/perfil-dark.png", {
        maxDiffPixelRatio: 0.001,
      });
    }
  });

  test("V-VIS-3: hoja Horarios (calendario semana) light mode golden", async ({
    staffPage,
  }) => {
    const calendar = new AvailabilityCalendarPage(staffPage);
    await calendar.goto(TENANT_ID, DOCTOR_ID);
    await calendar.calendar.waitFor({ state: "visible", timeout: 10_000 });

    await staffPage.emulateMedia({ colorScheme: "light" });

    await expect(calendar.calendar).toHaveScreenshot("staff/horarios-light.png", {
      maxDiffPixelRatio: 0.001,
    });
  });

  test("V-VIS-3: hoja Horarios dark mode golden", async ({ staffPage }) => {
    const calendar = new AvailabilityCalendarPage(staffPage);
    await calendar.goto(TENANT_ID, DOCTOR_ID);
    await calendar.calendar.waitFor({ state: "visible", timeout: 10_000 });

    await staffPage.emulateMedia({ colorScheme: "dark" });
    await staffPage.evaluate(() => document.documentElement.classList.add("dark"));

    await expect(calendar.calendar).toHaveScreenshot("staff/horarios-dark.png", {
      maxDiffPixelRatio: 0.001,
    });
  });

  test("V-VIS-4: hoja Servicios pendiente placeholder golden (light)", async ({
    staffPage,
  }) => {
    const workspace = new DoctorWorkspacePage(staffPage);
    await workspace.navigateToServicios(TENANT_ID, DOCTOR_ID);

    // Servicios placeholder visible
    await expect(workspace.serviciosPlaceholder).toBeVisible({ timeout: 10_000 });

    await staffPage.emulateMedia({ colorScheme: "light" });

    await expect(workspace.serviciosPlaceholder).toHaveScreenshot(
      "staff/servicios-pendiente-light.png",
      {
        maxDiffPixelRatio: 0.001,
      },
    );
  });
});
