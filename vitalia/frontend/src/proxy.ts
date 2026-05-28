// cap: auth.clerk-middleware
// atomics: TBD
// story-origin: TBD
/**
 * Clerk Proxy — Vitalia (T-1 vitalia-auth-base-functional)
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy` (deprecation
 * v16.0.0). Same location (src/), same `config.matcher` API. The default export
 * is now named `proxy`. Clerk's `clerkMiddleware()` SDK helper is unchanged —
 * its name is historical, it just wraps a request handler that Next.js invokes
 * via the proxy convention.
 *
 * Protege todas las rutas excepto las explícitamente públicas.
 * Rutas públicas: sign-in, sign-up, landing pública por clínica,
 *   webhooks Clerk (BE los valida con HMAC), health check, marketing.
 *
 * Auth delegada 100% a Clerk — sin redirect manual ni RBAC.
 * auth.protect() redirige a /sign-in automáticamente si no hay sesión.
 *
 * SC-01: request sin sesión a ruta protegida → Clerk redirige a /sign-in
 * SC-02: request a /public/* → 200, sin redirect
 *
 * F1-S9 routing-shell: matcher polish + /marketing(.*) explicit
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/public(.*)",
  // F1-S9 routing-shell: matcher polish + /marketing(.*) explicit
  "/marketing(.*)",
  // Clerk internal routes (account portal, OAuth callbacks)
  "/__clerk/(.*)",
  "/api/v1/vitalia/webhooks(.*)",
  "/api/health",
  // F1-S0 visual baseline pages (dev-only preview, no auth required)
  // Used by Playwright @project=visual for goldens generation.
  // No expone datos sensibles — solo renderiza Shadcn primitives + agent tokens swatches.
  "/test-stack(.*)",
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
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
