/**
 * Unit tests — middleware.ts (T-1 vitalia-auth-base-functional)
 *
 * Verifica que la configuración del matcher en middleware.ts incluye las rutas
 * públicas correctas y protege el resto via auth.protect().
 *
 * Nota: clerkMiddleware de @clerk/nextjs no es directamente unit-testeable sin
 * un entorno Next.js completo. En su lugar, verificamos:
 *   1. La configuración de rutas públicas (publicRoutes array / matcher patterns)
 *   2. Que el matcher excluye _next y assets estáticos
 *   3. La existencia y estructura del archivo middleware.ts
 *
 * SC-01: Usuario no autenticado → redirect /sign-in (validado en E2E)
 * SC-02: Ruta pública /public/* → 200, sin redirect (validado en E2E)
 *
 * downstream-regression-na: brand-local middleware test; no cross-brand consumers
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve, join } from "path";

// __dirname = vitalia/frontend/src/__tests__
// ROOT = vitalia/frontend (2 levels up)
const ROOT = resolve(__dirname, "../..");
const MIDDLEWARE_PATH = join(ROOT, "src", "middleware.ts");

describe("Vitalia FE — Middleware Clerk (T-1 SC-01, SC-02)", () => {
  it("middleware.ts exists at src/middleware.ts", () => {
    expect(
      existsSync(MIDDLEWARE_PATH),
      "middleware.ts no encontrado en vitalia/frontend/src/middleware.ts — T-1 pendiente"
    ).toBe(true);
  });

  it("middleware.ts importa clerkMiddleware y createRouteMatcher de @clerk/nextjs/server", () => {
    if (!existsSync(MIDDLEWARE_PATH)) {
      console.warn("[SKIP] middleware.ts no existe todavía — T-1 pendiente");
      return;
    }
    const source = readFileSync(MIDDLEWARE_PATH, "utf-8");
    expect(source).toContain("clerkMiddleware");
    expect(source).toContain("createRouteMatcher");
    expect(source).toContain("@clerk/nextjs/server");
  });

  it("middleware.ts configura rutas públicas esperadas (sign-in, sign-up, public, webhooks, health)", () => {
    if (!existsSync(MIDDLEWARE_PATH)) {
      console.warn("[SKIP] middleware.ts no existe todavía — T-1 pendiente");
      return;
    }
    const source = readFileSync(MIDDLEWARE_PATH, "utf-8");

    // Rutas públicas requeridas per 06-tickets.yaml T-1 description
    expect(source).toContain("/sign-in");
    expect(source).toContain("/sign-up");
    expect(source).toContain("/public");
    expect(source).toContain("/api/v1/vitalia/webhooks");
    expect(source).toContain("/api/health");
  });

  it("middleware.ts exporta config con matcher que excluye _next y assets estáticos", () => {
    if (!existsSync(MIDDLEWARE_PATH)) {
      console.warn("[SKIP] middleware.ts no existe todavía — T-1 pendiente");
      return;
    }
    const source = readFileSync(MIDDLEWARE_PATH, "utf-8");

    // Debe exportar config con matcher
    expect(source).toContain("export const config");
    expect(source).toContain("matcher");

    // El matcher debe excluir _next (archivos estáticos Next.js)
    expect(source).toContain("_next");
  });

  it("middleware.ts protege rutas no públicas via auth.protect()", () => {
    if (!existsSync(MIDDLEWARE_PATH)) {
      console.warn("[SKIP] middleware.ts no existe todavía — T-1 pendiente");
      return;
    }
    const source = readFileSync(MIDDLEWARE_PATH, "utf-8");

    // auth.protect() es el mecanismo de protección — sin redirect manual
    expect(source).toContain("auth.protect()");
  });

  it("middleware.ts no contiene redirect manual ni RBAC (solo Clerk protect)", () => {
    if (!existsSync(MIDDLEWARE_PATH)) {
      console.warn("[SKIP] middleware.ts no existe todavía — T-1 pendiente");
      return;
    }
    const source = readFileSync(MIDDLEWARE_PATH, "utf-8");

    // Prohibido: redirect manual hardcodeado (ej. NextResponse.redirect + /sign-in literal)
    // El redirect a /sign-in lo maneja Clerk internamente
    const hasManualRedirectToSignIn =
      /NextResponse\.redirect\s*\(.*sign-in/.test(source);
    expect(
      hasManualRedirectToSignIn,
      "middleware.ts usa NextResponse.redirect manual a /sign-in — Clerk lo maneja internamente"
    ).toBe(false);

    // Prohibido: RBAC (role checks) en middleware — eso va en el servidor/API
    const hasRoleCheck =
      /role\s*===|sessionClaims\.role|user\.role/.test(source);
    expect(
      hasRoleCheck,
      "middleware.ts contiene lógica RBAC (role checks) — no permitido en middleware"
    ).toBe(false);
  });

  it("middleware.ts no usa 'use client' (es un módulo Edge Runtime, no React)", () => {
    if (!existsSync(MIDDLEWARE_PATH)) {
      console.warn("[SKIP] middleware.ts no existe todavía — T-1 pendiente");
      return;
    }
    const source = readFileSync(MIDDLEWARE_PATH, "utf-8");

    expect(
      source.includes('"use client"') || source.includes("'use client'"),
      "middleware.ts contiene 'use client' — middleware es Edge Runtime, no React Component"
    ).toBe(false);
  });
});
