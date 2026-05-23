/**
 * tenant-switcher-navigation.smoke.spec.ts — SC-03 path preservation navigation
 * F1-S3 vitalia-fase1-tenant-switcher — T-9
 *
 * Tests:
 * - SC-03: Switching tenant preserves path structure (replaces /{tenantId} prefix)
 * - SC-03b: Clicking active tenant is a no-op (no navigation)
 *
 * 03-arch.md § 7 — path preservation redirect verbatim.
 *
 * Project: smoke
 *
 * downstream-regression-na: brand-local E2E spec; no cross-brand consumers
 */

import { test, expect } from "@playwright/test";
import { TenantSwitcherPage } from "../../pages/tenant-switcher.page";
import {
  mockTenantsApi,
  TENANT_FIXTURES,
} from "../../fixtures/tenants.fixture";

const BASE_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:3002";
const ACTIVE_TENANT = TENANT_FIXTURES.sonrisaPlena;
const OTHER_TENANT = TENANT_FIXTURES.dermalia;

test.describe("SC-03 — TenantSwitcher navigation (F1-S3)", () => {
  test.beforeEach(async ({ page }) => {
    await mockTenantsApi(page, ACTIVE_TENANT.id);
  });

  test("SC-03: Selecting a different tenant navigates to /{newTenantId}/dashboard", async ({
    page,
  }) => {
    const startPage = `${BASE_URL}/${ACTIVE_TENANT.id}/dashboard`;
    await page.goto(startPage, { waitUntil: "domcontentloaded" });
    const pom = new TenantSwitcherPage(page);

    await pom.openDropdown();

    // Setup navigation listener before click
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 5000 }),
      pom.selectTenant(OTHER_TENANT.id),
    ]);

    // URL should be updated with new tenant id preserving /dashboard path
    expect(page.url()).toContain(`/${OTHER_TENANT.id}/dashboard`);
    expect(response).toBeTruthy();
  });

  test("SC-03b: Clicking active tenant is a no-op (no navigation)", async ({
    page,
  }) => {
    const startPage = `${BASE_URL}/${ACTIVE_TENANT.id}/dashboard`;
    await page.goto(startPage, { waitUntil: "domcontentloaded" });
    const pom = new TenantSwitcherPage(page);

    const initialUrl = page.url();
    await pom.openDropdown();

    // Click the active tenant — should not navigate
    let navigationFired = false;
    page.on("framenavigated", () => {
      navigationFired = true;
    });

    await pom.selectTenant(ACTIVE_TENANT.id);
    await page.waitForTimeout(500);

    expect(navigationFired).toBe(false);
    expect(page.url()).toBe(initialUrl);
  });

  test("SC-03c: Active tenant option shows check mark (data-active='true')", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/${ACTIVE_TENANT.id}/dashboard`, {
      waitUntil: "domcontentloaded",
    });
    const pom = new TenantSwitcherPage(page);

    await pom.openDropdown();

    const isActive = await pom.isTenantActive(ACTIVE_TENANT.id);
    expect(isActive).toBe(true);

    // Other tenants should not be active
    const isOtherActive = await pom.isTenantActive(OTHER_TENANT.id);
    expect(isOtherActive).toBe(false);
  });
});
