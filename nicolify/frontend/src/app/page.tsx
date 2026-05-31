// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell post-merge fix (landing post-login)
/**
 * Root page (`/`) — server-side redirect al shell landing canónico.
 *
 * Flujo: usuario autenticado aterriza en `/` (Clerk afterSignIn) → este Server
 * Component resuelve el tenant primario y redirige DIRECTO al deep link del shell
 * `/{tenant}/{DEFAULT_LANDING.agent}/{DEFAULT_LANDING.subtab}` (christian/pipeline),
 * saltando el intermedio `/{tenant}` para evitar un doble-mount del shell.
 *
 * Sin sesión → el middleware Clerk (proxy.ts) intercepta y manda a `/sign-in`.
 *
 * Reemplaza el placeholder HomeClient (dev-stack T-3) que dejaba al usuario en
 * `/` post-login en vez del shell.
 *
 * No "use client" — redirect() es Server Action.
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { redirect } from "next/navigation";

import { DEFAULT_LANDING } from "@/lib/routing/shell-routes";
import { resolvePrimaryTenantId } from "@/lib/tenant/resolve-primary-tenant";

/**
 * Root page Server Component — redirige al deep link del shell.
 */
export default async function RootPage() {
  const tenantId = await resolvePrimaryTenantId();
  redirect(`/${tenantId}/${DEFAULT_LANDING.agent}/${DEFAULT_LANDING.subtab}`);
}
