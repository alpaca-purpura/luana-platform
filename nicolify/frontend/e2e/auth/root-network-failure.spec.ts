// voseo-allowed: spec verifica AUSENCIA de voseo en mensajes UI (no es string user-facing)
/**
 * root-network-failure.spec.ts — Nicolify Scenario 7 (T-4 nicolify-r0-dev-stack)
 *
 * Scenario 7 — fe-network-failure:
 *   Root autenticado + BE mock 500 → root muestra mensaje español TUTEO,
 *   sin white-screen (error boundary graceful).
 *
 * Verifica que HomeClient (page-client.tsx) maneja errores BE 500 sin lanzar
 * error boundary global → pantalla en blanco inaceptable para usuarios.
 *
 * El mock intercepta /api/health (usado por HomeClient para el health check).
 * Devuelve 500 para simular BE caído.
 *
 * Nota de timing:
 * HomeClient dispara el fetch SÓLO cuando isLoaded && isSignedIn (Clerk).
 * Clerk hidrata de forma asíncrona post-page-load, incluso con storageState.
 * Usamos waitForSelector con timeout extendido para esperar el estado final.
 *
 * Prerequisito: storageState + setupClerkTestingToken (auth.fixture).
 */

import { test, expect } from "../auth.fixture";

/** Mensaje de error que HomeClient muestra cuando BE retorna 5xx. */
const ERROR_TEXT_500 = "No pudimos conectar";

/** Texto que aparece cuando la conexión es exitosa. */
const OK_TEXT = "Bienvenido a Nicolify";

test.describe("Scenario 7 — fe-network-failure", () => {
  test("BE 500 → mensaje error español tuteo visible, sin white-screen", async ({
    page,
  }) => {
    // Interceptar /api/health para simular BE caído (500).
    await page.route("**/api/health", (route) => {
      void route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      });
    });

    await page.goto("/");

    // No debe mostrar white-screen.
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();

    // Esperar hasta 20s: Clerk hydration (asíncrono) + useEffect + fetch + render.
    // HomeClient puede tardar varios segundos después del DOM load para:
    //   1. Clerk.loaded=true (FAPI response)
    //   2. isSignedIn=true
    //   3. useEffect(check) dispara
    //   4. fetchClient /api/health → 500
    //   5. setConnection({kind:"error"}) → render error UI
    const errorText = page.getByText(ERROR_TEXT_500, { exact: false });
    await expect(errorText).toBeVisible({ timeout: 20_000 });

    // Verificar texto español neutro TUTEO (no voseo).
    const fullText = await errorText.textContent() ?? "";
    const lowerText = fullText.toLowerCase();
    expect(lowerText).toMatch(/pudimos|servidor/);
    expect(lowerText).not.toMatch(/podés|tenés|hacé|mirá/);
  });

  test("BE 500 → botón 'Reintentar' visible", async ({ page }) => {
    await page.route("**/api/health", (route) => {
      void route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      });
    });

    await page.goto("/");

    // Esperar el mensaje de error.
    await expect(
      page.getByText(ERROR_TEXT_500, { exact: false }),
    ).toBeVisible({ timeout: 20_000 });

    // El botón "Reintentar" debe estar visible.
    await expect(
      page.getByRole("button", { name: /reintentar/i }),
    ).toBeVisible();
  });

  test("BE 500 → no hay white-screen (sin error boundary catastrófico)", async ({
    page,
  }) => {
    await page.route("**/api/health", (route) => {
      void route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      });
    });

    const reactCrashErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("Unhandled") ||
          (text.includes("React") && text.includes("Error")) ||
          text.includes("Cannot read properties of undefined")
        ) {
          reactCrashErrors.push(text);
        }
      }
    });

    await page.goto("/");

    // La página debe renderizar contenido (no blank).
    await expect(page.locator("main")).toBeVisible();

    // Esperar el error de HomeClient (o el estado OK si el mock no interceptó).
    // Al menos uno de los dos debe aparecer para confirmar que no es white-screen.
    await expect(
      page.locator(`text=${ERROR_TEXT_500}`).or(page.locator(`text=${OK_TEXT}`)),
    ).toBeVisible({ timeout: 20_000 });

    // Sin crashes React no controlados.
    expect(reactCrashErrors).toHaveLength(0);
  });
});
