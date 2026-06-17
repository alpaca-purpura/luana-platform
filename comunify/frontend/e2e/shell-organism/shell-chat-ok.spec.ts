// cap: comunify-shell-organism
/**
 * shell-chat-ok.spec.ts — SC-chat-ok (DoD #37 write real) + login→tenant + nav.
 *
 * spec_anchor: 04-validators.yaml § scenario_coverage SC-chat-ok (dod_write: true, RN-7)
 * gherkin: Given usuario autenticado en el shell comunify · When envía un mensaje a Luana
 *          (sidebar supervisora) · Then el engine responde por SSE y la burbuja del bot
 *          acumula contenido real (NO mock — hits /api/v1/comunify/copilot/chat).
 *
 * NO mockea el backend del surface bajo prueba (sería falso verde — caso lisa-marca).
 * Pre-auth vía storageState (clerk.setup.ts). Gate anti-burbuja vía fixtures/base.ts.
 *
 * Requiere stack live (make dev-comunify + gateway LiteLLM + tenant comunify-demo
 * bound al usuario E2E). Sin E2E_BASE_URL → skip (no corre en unit CI).
 *
 * downstream-regression-na: brand-local E2E; sin consumers cross-brand.
 */

import { test, expect } from "../fixtures/base";

const TENANT = process.env.E2E_TENANT_ID || "comunify-demo";
const SHELL_ROUTE = `/${TENANT}/nina/marca`;

test.describe("comunify shell-organism — chat live (SC-chat-ok)", () => {
  test.skip(
    !process.env.E2E_BASE_URL,
    "E2E_BASE_URL no seteado — spec live, skip en unit CI",
  );

  test("login→tenant: usuario autenticado llega al shell (no /sign-in) con composer", async ({
    page,
  }) => {
    await page.goto(SHELL_ROUTE, { waitUntil: "domcontentloaded" });

    // Autenticado: NO rebotó a sign-in.
    await expect(page).not.toHaveURL(/\/sign-in/);
    // Nav resuelta: seguimos en la ruta tenant-scoped del shell.
    await expect(page).toHaveURL(new RegExp(`/${TENANT}/`));
    // El composer de la sidebar de Luana montó.
    await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 15_000 });
  });

  test("SC-chat-ok: Luana responde a un mensaje real vía engine /chat (write + stream)", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto(SHELL_ROUTE, { waitUntil: "domcontentloaded" });

    const composer = page.getByTestId("composer-input");
    await expect(composer).toBeVisible({ timeout: 15_000 });

    // El chat-store manda Bearer <Clerk token> + X-Tenant-ID; ShellLayoutWire los inyecta
    // en un useEffect async (getToken). Esperar a que Clerk hidrate la sesión asegura que
    // setAuthContext ya corrió antes del send (si no, el POST sale sin Bearer → 401). El
    // usuario real tarda segundos en tipear; el headless dispara en ~1s → race.
    await page.waitForFunction(
      () => {
        const w = window as unknown as { Clerk?: { loaded?: boolean; session?: unknown } };
        return Boolean(w.Clerk?.loaded) && Boolean(w.Clerk?.session);
      },
      null,
      { timeout: 20_000 },
    );

    // Settle: dar tiempo a que el useEffect (getToken → setAuthContext) propague el Bearer
    // tras la hidratación de Clerk. Sin esto el POST sale sin token → 401.
    await page.waitForTimeout(2_000);

    const bubbles = page.getByTestId("msg-bubble");
    const before = await bubbles.count();
    const question = "¿Qué es una escalera de valor?";

    await composer.click();
    await composer.fill(question);
    await composer.press("Enter");

    // User bubble aparece de inmediato con el texto enviado.
    await expect(page.getByTestId("chat-messages")).toContainText(question, {
      timeout: 5_000,
    });

    // Bot responde: aparecen ≥2 burbujas nuevas (user + bot) y la última acumula
    // contenido real del LLM (write real al gateway, no canned).
    await expect
      .poll(async () => bubbles.count(), { timeout: 90_000 })
      .toBeGreaterThanOrEqual(before + 2);

    const last = bubbles.last();
    await expect(last).toBeVisible();
    await expect
      .poll(async () => (await last.textContent())?.trim().length ?? 0, {
        timeout: 60_000,
        message: "la burbuja del bot nunca acumuló contenido real del stream",
      })
      .toBeGreaterThan(20);

    // El bot NO se limitó a repetir la pregunta (prueba de respuesta genuina).
    const text = (await last.textContent())?.trim() ?? "";
    expect(text).not.toBe(question);
  });
});
