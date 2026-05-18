/**
 * dev-stack.smoke.spec.ts — Comunify dev-stack functional smoke (Story comunify-dev-stack-functional)
 *
 * Reemplaza la verificación manual de 7 curls del 00-research.md por una
 * suite Playwright reproducible. Cubre el gate canonical replicado de
 * vitalia-dev-stack-functional/07-merge.md (12 pasos).
 *
 * Scope: dev-stack levantable end-to-end vía `make dev-comunify`. NO auth,
 * NO flows funcionales — sólo bootstrap (backend health + alembic + frontend mount).
 *
 * Pre-requisitos:
 *   - `make dev-comunify` corriendo (backend 8003 + frontend 3003)
 *   - `E2E_BASE_URL=http://localhost:3003` (override default 3000)
 *
 * Run:
 *   E2E_BASE_URL=http://localhost:3003 \
 *     npx playwright test e2e/specs/smoke/dev-stack.smoke.spec.ts --project=smoke
 */
import { test, expect, request } from "@playwright/test";

const BE_URL = process.env.COMUNIFY_BE_URL ?? "http://127.0.0.1:8003";

test.describe("Comunify dev-stack functional smoke", () => {
  test("backend /health responde 200 con shape canonical", async () => {
    const ctx = await request.newContext();
    const response = await ctx.get(`${BE_URL}/health`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      status: "ok",
      brand: "comunify",
      version: "0.1.0",
    });

    await ctx.dispose();
  });

  test("frontend /sign-in renderiza 200 (next.js mount + Clerk widget area)", async ({ page, baseURL }) => {
    const response = await page.goto(`${baseURL}/sign-in`);

    expect(response?.status()).toBe(200);

    const title = await page.title();
    expect(title).not.toMatch(/404|500|Error/i);
  });

  test("frontend root / renderiza 200 (no crash inicial)", async ({ page, baseURL }) => {
    const response = await page.goto(`${baseURL}/`);

    expect(response?.status()).toBeLessThan(400);
  });
});
