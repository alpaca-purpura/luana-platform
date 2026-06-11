// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-core-hardening
/**
 * topbar-order.spec.ts — SC-3: DOM order ThemeToggle < TenantSwitcher (RN-2 · AC-2)
 *
 * RN-2: switcher al extremo derecho del topbar.
 * Verifica que en el DOM el ThemeToggle aparece ANTES que el TenantSwitcher.
 * Ambos están en el right cluster del topbar.
 *
 * Real-backend (no mocks). Gate anti-burbuja via base.ts.
 *
 * Run:
 *   cd vitalia/frontend && E2E_BASE_URL=http://localhost:3002 \
 *     npx playwright test e2e/regression/shell-core-hardening/topbar-order.spec.ts \
 *     --project=smoke
 *
 * downstream-regression-na: brand-local E2E spec; no cross-brand consumers
 */
import { test, expect } from "../../fixtures/shell-hardening.fixture";
import { ShellLayoutPage } from "../../pages/ShellLayoutPage";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("SC-3 — topbar: ThemeToggle < TenantSwitcher DOM order (RN-2)", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test("ThemeToggle aparece ANTES que TenantSwitcher en el DOM", async ({
    shellPage,
    tenantId,
  }) => {
    const pom = new ShellLayoutPage(shellPage);
    await pom.gotoShell(tenantId, { useProdRoute: true });
    await pom.waitForShellReady();

    // Get positions of ThemeToggle and TenantSwitcher via DOM compareDocumentPosition
    const orderIsCorrect = await shellPage.evaluate(() => {
      const themeToggle = document.querySelector(
        'header button[aria-label*="tema" i], header button[aria-label*="Tema" i]',
      );
      const tenantSwitcher = document.querySelector(
        '[data-testid="tenant-switcher-trigger"]',
      );
      if (!themeToggle || !tenantSwitcher) return null;
      // DOCUMENT_POSITION_FOLLOWING = 4 means tenantSwitcher comes AFTER themeToggle
      return !!(
        themeToggle.compareDocumentPosition(tenantSwitcher) &
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    expect(orderIsCorrect, "ThemeToggle debe preceder a TenantSwitcher en el DOM (RN-2)").toBe(true);
  });

  test("TenantSwitcher es el elemento más a la derecha del topbar", async ({
    shellPage,
    tenantId,
  }) => {
    const pom = new ShellLayoutPage(shellPage);
    await pom.gotoShell(tenantId, { useProdRoute: true });
    await pom.waitForShellReady();

    const themeBox = await pom.themeToggle.boundingBox();
    const switcherBox = await pom.tenantSwitcher.boundingBox();

    expect(themeBox).not.toBeNull();
    expect(switcherBox).not.toBeNull();

    if (themeBox && switcherBox) {
      // Switcher should be to the RIGHT of ThemeToggle (higher x)
      expect(switcherBox.x).toBeGreaterThan(themeBox.x);
    }
  });

  test("topbar: ThemeToggle y TenantSwitcher ambos visibles", async ({
    shellPage,
    tenantId,
  }) => {
    const pom = new ShellLayoutPage(shellPage);
    await pom.gotoShell(tenantId, { useProdRoute: true });
    await pom.waitForShellReady();

    await expect(pom.themeToggle).toBeVisible();
    await expect(pom.tenantSwitcher).toBeVisible();
  });
});
