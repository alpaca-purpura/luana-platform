/**
 * Clerk Proxy — Comunify (T-shell 2026-06-15)
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy` (deprecation
 * v16.0.0). Same location (src/), same `config.matcher` API. The default export
 * is now named `proxy`. Clerk's `clerkMiddleware()` SDK helper is unchanged —
 * its name is historical, it just wraps a request handler that Next.js invokes
 * via the proxy convention.
 *
 * Protege todas las rutas excepto las explícitamente públicas.
 * Rutas públicas: sign-in, sign-up, webhooks Clerk (BE los valida con HMAC),
 *   health check, Clerk internal routes.
 *
 * Auth delegada 100% a Clerk — sin redirect manual ni RBAC.
 * auth.protect() redirige a /sign-in automáticamente si no hay sesión.
 *
 * Edge-redirect pattern (T-shell, Next 16 soft-nav learning):
 *   Bare tenant routes (/{tenantId} exactly one segment) redirect in middleware
 *   to the deep link DEFAULT_LANDING BEFORE mounting the shell route-group,
 *   instead of using redirect() in Server Component render — which triggered
 *   "Rendered more hooks than during the previous render" in Next 16.2.x
 *   during soft-nav with dynamic({ssr:false}) layouts.
 *   Learning: docs/learnings/2026-06-03-next16-softnav-redirect-rendered-more-hooks.md
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { DEFAULT_LANDING } from "@/lib/routing/shell-routes";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/public(.*)",
  "/api/v1/comunify/webhooks(.*)",
  "/api/health",
  // Clerk internal routes (account portal, OAuth callbacks)
  "/__clerk/(.*)",
]);

// Bare tenant entry: exactly one path segment (e.g. /creator-studio). Redirects
// to the canonical deep link (/{tenant}/nina/marca) BEFORE mounting shell route-group.
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
