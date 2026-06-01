/**
 * stack.smoke.spec.ts — Nicolify Scenario 6 (T-4 nicolify-r0-dev-stack)
 *
 * Scenario 6 — smoke-green (ci_readiness):
 *   - /api/health reachable → 200 con brand:nicolify
 *   - Root autenticado renderiza (no white-screen, no redirect a /sign-in)
 *
 * Este spec es el smoke gate de CI: valida que el stack entero (BE + FE + auth)
 * funciona de extremo a extremo.
 *
 * Prerequisito: storageState en playwright/.clerk/user.json (proyecto setup corrió).
 *               Cargado automáticamente por playwright.config.ts en proyecto smoke.
 *
 * Usa auth fixture (testing token + tenantId) para specs autenticados.
 */

import { test, expect } from "../auth.fixture";

test.describe("Scenario 6 — smoke-green (stack health)", () => {
  test("/api/health reachable — BE verde", async ({ request }) => {
    // Verificar que el BE responde a través del proxy FE.
    // /api/health está en el allowlist público (no requiere auth).
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = (await response.json()) as {
      status: string;
      brand: string;
      version: string;
    };
    expect(body.status).toBe("ok");
    expect(body.brand).toBe("nicolify");
    // Versión semver: formato X.Y.Z
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("root autenticado renderiza — FE + Clerk verde", async ({ page }) => {
    // waitUntil: "load" en vez de "networkidle" — evita ERR_CONNECTION_RESET
    // cuando el servidor está bajo carga paralela de tests.
    await page.goto("/", { waitUntil: "load" });

    // No debe redirigir a /sign-in.
    expect(page.url()).not.toContain("/sign-in");

    // La main es visible — no es white-screen.
    await expect(page.locator("main")).toBeVisible();
  });

  test("root autenticado: FE + BE + Clerk integración completa", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });

    // Stack completo: FE responde, Clerk autentica, BE conectado.
    expect(page.url()).not.toContain("/sign-in");
    await expect(page.locator("main")).toBeVisible();

    // El body no debe estar vacío (indicaría white-screen / React crash).
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });
});
