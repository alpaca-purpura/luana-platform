/**
 * protected-redirect.spec.ts — Nicolify Scenario 2 (T-4 nicolify-r0-dev-stack)
 *
 * Scenario 2 — protected-route-requires-auth:
 *   GET / sin sesión Clerk → redirige a /sign-in (no renderiza contenido autenticado).
 *
 * NOTA: Este spec corre en el proyecto 'smoke' que tiene storageState pre-cargado.
 * Para verificar el comportamiento anónimo, necesitamos un contexto de browser nuevo
 * sin el storageState (usando page con contexto limpio vía browser.newContext()).
 *
 * Rutas públicas del proxy (allowlist AD-6):
 *   /sign-in, /sign-up, /__clerk/*, /api/health
 *
 * Root `/` está protegida — redirige a /sign-in sin sesión (Scenario 2).
 */

import { test, expect } from "@playwright/test";

test.describe("Scenario 2 — protected-route-requires-auth", () => {
  test("GET / sin sesión redirige a /sign-in (contexto anónimo)", async ({
    browser,
  }) => {
    // Crear contexto limpio SIN storageState (anónimo).
    // El proyecto smoke carga storageState globalmente, pero podemos sobrescribir
    // creando un contexto nuevo sin cookies/almacenamiento.
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    try {
      await page.goto("/", { waitUntil: "load" });

      // Clerk clerkMiddleware emite 307 → /sign-in?redirect_url=...
      // Playwright sigue redirects automáticamente — la URL final debe contener /sign-in.
      expect(page.url()).toContain("/sign-in");
    } finally {
      await context.close();
    }
  });

  test("GET /api/health sin sesión retorna 200 (ruta pública allowlist)", async ({
    request,
  }) => {
    // /api/health está en el allowlist público del proxy (Scenario 2 negativo).
    // Debe responder 200 sin requerir sesión.
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = (await response.json()) as { status: string; brand: string };
    expect(body.status).toBe("ok");
    expect(body.brand).toBe("nicolify");
  });

  test("GET /sign-in retorna 200 (ruta pública allowlist)", async ({
    browser,
  }) => {
    // /sign-in es pública — no debe redirigir a otra ruta.
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    try {
      await page.goto("/sign-in", { waitUntil: "load" });
      expect(page.url()).toContain("/sign-in");
      // Verificar que la página cargó (tiene contenido Clerk).
      await expect(page.locator("body")).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
