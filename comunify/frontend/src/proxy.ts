/**
 * Clerk Proxy — Comunify (replicado de vitalia 2026-05-20 post merge `13d0138`)
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy` (deprecation
 * v16.0.0). Same location (src/), same `config.matcher` API. The default export
 * is now named `proxy`. Clerk's `clerkMiddleware()` SDK helper is unchanged —
 * its name is historical, it just wraps a request handler that Next.js invokes
 * via the proxy convention.
 *
 * Protege todas las rutas excepto las explícitamente públicas.
 * Rutas públicas: sign-in, sign-up, webhooks Clerk (BE los valida con HMAC),
 *   health check.
 *
 * Auth delegada 100% a Clerk — sin redirect manual ni RBAC.
 * auth.protect() redirige a /sign-in automáticamente si no hay sesión.
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/public(.*)",
  "/api/v1/comunify/webhooks(.*)",
  "/api/health",
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
