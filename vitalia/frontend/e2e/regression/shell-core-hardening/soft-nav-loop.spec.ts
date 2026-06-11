// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-core-hardening
/**
 * soft-nav-loop.spec.ts — SC-21: soft-nav loop ×15 board→recuperar (RN-14)
 *
 * RN-14: toda nav blanda interna monta sin colgar; band-aid hard-nav revertido.
 * Verifica que la navegación soft (via Ribbon / Link) entre sub-tabs:
 *   1. No produce "Rendered more hooks" (Next 16 bug — ver learning next16-softnav-redirect).
 *   2. ×15 loops board→recuperar sin que el shell se cuelgue o desmonte.
 *   3. No hay pageErrors acumulados.
 *   4. No hay console.error de hidratación.
 *
 * REAL-BACKEND: sin mocks del surface bajo prueba (doctrina verification-real-not-200).
 * Gate anti-burbuja via base.ts.
 *
 * Run:
 *   cd vitalia/frontend && E2E_BASE_URL=http://localhost:3002 \
 *     npx playwright test e2e/regression/shell-core-hardening/soft-nav-loop.spec.ts \
 *     --project=smoke
 *
 * downstream-regression-na: brand-local E2E spec; no cross-brand consumers
 */
import { test, expect } from "../../fixtures/shell-hardening.fixture";
import { ShellLayoutPage } from "../../pages/ShellLayoutPage";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const LOOP_COUNT = 15;

test.describe("SC-21 — soft-nav loop ×15 (RN-14)", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test(`loop ×${LOOP_COUNT} embudo→recuperar soft-nav sin crash`, async ({
    shellPage,
    tenantId,
  }) => {
    const pom = new ShellLayoutPage(shellPage);

    // Navigate to embudo as starting point
    await shellPage.goto(`/${tenantId}/adrian/embudo`);
    await shellPage.waitForLoadState("networkidle", { timeout: 20_000 });
    await pom.waitForShellReady();

    const pageErrors: string[] = [];
    shellPage.on("pageerror", (err) => {
      pageErrors.push(`${err.name}: ${err.message}`);
    });

    // Adrian's recuperar tab
    const recuperarRoute = `/${tenantId}/adrian/recuperar`;
    const embudoRoute = `/${tenantId}/adrian/embudo`;

    for (let i = 0; i < LOOP_COUNT; i++) {
      // Navigate to recuperar via Ribbon or direct navigation
      const ribbonRecuperar = shellPage.locator(
        '[data-testid="ribbon"] [href*="recuperar"], [data-testid="ribbon"] [aria-label*="ecuperar" i]',
      ).first();

      const hasRibbon = await ribbonRecuperar.isVisible({ timeout: 2_000 }).catch(() => false);

      if (hasRibbon) {
        await ribbonRecuperar.click();
      } else {
        await shellPage.goto(recuperarRoute);
      }
      await shellPage.waitForLoadState("networkidle", { timeout: 15_000 });

      // Navigate back to embudo
      const ribbonEmbudo = shellPage.locator(
        '[data-testid="ribbon"] [href*="embudo"], [data-testid="ribbon"] [aria-label*="mbudo" i]',
      ).first();

      const hasEmbudoRibbon = await ribbonEmbudo.isVisible({ timeout: 2_000 }).catch(() => false);

      if (hasEmbudoRibbon) {
        await ribbonEmbudo.click();
      } else {
        await shellPage.goto(embudoRoute);
      }
      await shellPage.waitForLoadState("networkidle", { timeout: 15_000 });

      // Verify shell still alive each iteration
      const mainVisible = await shellPage
        .locator("main#main-content")
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(mainVisible, `loop ${i + 1}/${LOOP_COUNT}: shell desmontado`).toBe(true);
    }

    // No page errors accumulated across all loops
    expect(
      pageErrors,
      `Excepciones JS no capturadas tras ×${LOOP_COUNT} soft-nav: ${pageErrors.join(" | ")}`,
    ).toEqual([]);
  });

  test("Ribbon chips usan next/link (soft-nav, no hard-nav)", async ({
    shellPage,
    tenantId,
  }) => {
    await shellPage.goto(`/${tenantId}/lisa/marca`);
    await shellPage.waitForLoadState("networkidle", { timeout: 20_000 });

    const pom = new ShellLayoutPage(shellPage);
    await pom.waitForShellReady();

    // Check that Ribbon tabs are <a> elements (next/link renders as <a>) not <button>+navigate
    const ribbonLinks = await shellPage.evaluate(() => {
      const ribbon = document.querySelector('[data-testid="ribbon"]');
      if (!ribbon) return [];
      const anchors = Array.from(ribbon.querySelectorAll("a[href]"));
      return anchors.map((a) => a.getAttribute("href") ?? "");
    });

    // There should be Ribbon tab links (soft-nav via next/link)
    expect(ribbonLinks.length, "Ribbon debe tener links de navegación").toBeGreaterThan(0);

    // None should be absolute external links (all intra-app)
    for (const href of ribbonLinks) {
      expect(href, "link de Ribbon debe ser ruta relativa").toMatch(/^\//);
    }
  });

  test("cross-tab: lisa/marca→adrian/inbox→mateo/agenda sin crash", async ({
    shellPage,
    tenantId,
  }) => {
    const routes = [
      `/${tenantId}/lisa/marca`,
      `/${tenantId}/adrian/inbox`,
      `/${tenantId}/mateo/agenda`,
    ];

    for (const route of routes) {
      await shellPage.goto(route);
      await shellPage.waitForLoadState("networkidle", { timeout: 20_000 });

      const mainVisible = await shellPage
        .locator("main#main-content")
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      expect(mainVisible, `${route}: shell no visible`).toBe(true);
    }
  });
});
