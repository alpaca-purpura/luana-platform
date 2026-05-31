/**
 * Clerk Proxy — Nicolify (T-3 nicolify-r0-dev-stack)
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy` (deprecation
 * v16.0.0). Same location (src/), same `config.matcher` API. The default export
 * is now named `proxy`. Clerk's `clerkMiddleware()` SDK helper is unchanged —
 * its name is historical, it just wraps a request handler that Next.js invokes
 * via the proxy convention.
 *
 * Protege todas las rutas excepto las explícitamente públicas.
 * Rutas públicas (allowlist AD-6, 03-arch.md § AD-5):
 *   - /sign-in, /sign-up  — páginas auth Clerk
 *   - /api/health         — liveness probe (smoke Playwright + allowlist Clerk)
 *   - /__clerk/(.*)       — Clerk internal routes (account portal, OAuth callbacks)
 *
 * Root `/` está protegida — redirige a /sign-in sin sesión (Scenario 2).
 *
 * Auth delegada 100% a Clerk — sin redirect manual ni RBAC local.
 * auth.protect() redirige a /sign-in automáticamente si no hay sesión.
 *
 * SC-01: request sin sesión a ruta protegida → Clerk redirige a /sign-in
 * SC-02: request a ruta pública (/api/health) → 200, sin redirect
 *
 * Port from vitalia/frontend/src/proxy.ts re-temizado para nicolify.
 * Eliminado: /public, /marketing, /api/v1/vitalia/webhooks, /test-stack
 * — rutas vitalia-only, no aplican a nicolify B2B.
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { DEFAULT_LANDING } from "@/lib/routing/shell-routes";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Clerk internal routes (account portal, OAuth callbacks)
  "/__clerk/(.*)",
  // Health checks — liveness probe (smoke + allowlist Clerk proxy)
  "/api/health",
]);

// Bare tenant entry: exactly one path segment (e.g. /alpaca-purpura). Lo
// redirigimos en el middleware al deep link canónico del shell
// (/{tenant}/christian/pipeline) ANTES de montar el route-group shell, en vez
// de dejar correr el redirect() del Server Component (shell-organism)/page.tsx,
// que durante una navegación client-side disparaba "Rendered more hooks than
// during the previous render" (Next 16 redirect + dynamic({ssr:false})).
const isBareTenantRoute = createRouteMatcher(["/:tenantId"]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();

    if (isBareTenantRoute(request)) {
      const tenantId = request.nextUrl.pathname.slice(1); // strip leading "/"
      const dest = new URL(
        `/${tenantId}/${DEFAULT_LANDING.agent}/${DEFAULT_LANDING.subtab}`,
        request.url,
      );
      return NextResponse.redirect(dest);
    }
  }
});

export default proxy;

export const config = {
  matcher: [
    // Incluir todas las rutas excepto archivos estáticos Next.js y assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Incluir siempre rutas API y tRPC
    "/(api|trpc)(.*)",
  ],
};
