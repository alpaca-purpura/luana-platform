// cap: auth.clerk-middleware
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
import { NextResponse } from "next/server";

import {
  bareTenantLandingRedirect,
  shellInRenderRedirectTarget,
} from "@/lib/shell-routes";

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
  // core-ds-foundation T-9: catalogo publico del design-system @luana/ui-kit.
  // Sin tenant, sin PHI — solo renderiza componentes con datos de ejemplo.
  "/showcase(.*)",
  // T-FE-pagina-publica (D3-D): página pública del doctor — no auth.
  // Anti-enumeration: BE returns identical 404 for toggle-OFF/unknown/cross-tenant.
  "/d/(.*)",
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Bug #1 hardening (vitalia-bugfix-shell-nav-scroll-errors): el redirect de
  // /{tenant} → /{tenant}/{DEFAULT_LANDING_SUBPATH} hecho por el Server Component
  // (shell-organism)/page.tsx queda DENTRO del mismo route group (shell-organism)
  // → Next.js 16.2.3 hace una soft-navigation parcial que dispara
  // "Rendered more hooks than during the previous render" en su Router interno
  // (~40% flake en navegación a /{tenant} bare; el landing queda colgado en
  // /{tenant} en vez de mateo/agenda). Hacer el redirect en el EDGE (307 HTTP)
  // elimina la soft-nav: el browser pide la ruta destino con un fetch fresco →
  // el Router monta limpio. Solo para usuarios ya autenticados (auth.protect
  // arriba ya mandó a sign-in a los anónimos). Server Component redirect queda
  // como defensa para tenants no-UUID (raro). Lógica de match en lib/shell-routes.ts.
  //
  // T-4 (vitalia-shell-core-hardening, Decisión A) — COVERAGE VERIFICADA: el
  // único redirect IN-RENDER intra-route-group del shell es este landing bare-
  // tenant; el 307 lo cubre. El flujo board→/adrian/recuperar (chip frozen-kpi)
  // NO necesita 307: /adrian/recuperar es una ruta estática real, sin redirect
  // in-render → su soft-nav (next/link) no dispara el "Rendered more hooks".
  // Por eso el band-aid hard-nav del chip se revirtió a next/link sin extender
  // este matcher. (grep `redirect(` en (shell-organism)/** = 0 fuera del landing.)
  const landingRedirect = bareTenantLandingRedirect(request.nextUrl.pathname);
  if (landingRedirect) {
    return NextResponse.redirect(new URL(landingRedirect, request.url));
  }

  // T-V2 (platform-lift-shell-chrome-ui-kit, 2026-06-11): la nota T-4 de arriba
  // ("el único redirect in-render es el landing") quedó FALSA — el censo del lift
  // encontró 4 redirect() in-render más (lisa/marca, [agent] bare, staff/[id],
  // embudo/[id]). Con el chrome consumido del kit el "Rendered more hooks" pasó
  // de flaky a determinista en esas rutas → TODOS al edge (307), mismo patrón.
  // Los page.tsx quedan como fallback defensivo. SSoT: lib/shell-routes.ts.
  const shellRedirect = shellInRenderRedirectTarget(request.nextUrl.pathname);
  if (shellRedirect) {
    return NextResponse.redirect(new URL(shellRedirect, request.url));
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
