/**
 * Clerk Middleware — Comunify (replicado de Vitalia 2026-05-19)
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

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Incluir todas las rutas excepto archivos estáticos Next.js y assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Incluir siempre rutas API y tRPC
    "/(api|trpc)(.*)",
  ],
};
