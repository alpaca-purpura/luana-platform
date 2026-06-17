// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell post-merge fix (landing post-login)
/**
 * resolvePrimaryTenantId — resuelve el tenant slug primario del usuario autenticado.
 *
 * R0 skeleton: lee `publicMetadata.tenant_slug` del usuario Clerk (seteado por el
 * flujo de provisioning). Resuelve server-side vía `clerkClient.users.getUser`
 * para NO depender de que el slug esté en el JWT template del session token
 * (que por default NO incluye publicMetadata). Fallback determinístico dev.
 *
 * La implementación completa (fetch user_tenants desde IAM, elegir primario,
 * multi-tenant) se difiere a R1+ — igual que el `fetchUserTenants` de vitalia.
 *
 * downstream-regression-na: brand-local helper; no cross-brand consumers
 */

import { auth, clerkClient } from "@clerk/nextjs/server";

/** Fallback dev tenant (coincide con el seed `agencia-demo`). */
export const DEV_FALLBACK_TENANT = "agencia-demo";

export interface TenantMetadata {
  tenant_slug?: string;
  tenant_id?: string;
}

/**
 * Extrae el tenant slug de un blob de metadata Clerk (sessionClaims o publicMetadata).
 * Pure — sin I/O. Reusado por resolvePrimaryTenantId (server component) y por el
 * proxy edge (resolución del root `/` sin redirect() in-render — ver proxy.ts).
 */
export function pickTenantSlug(meta: TenantMetadata | undefined | null): string | undefined {
  const slug = meta?.tenant_slug ?? meta?.tenant_id;
  return slug && typeof slug === "string" ? slug : undefined;
}

/**
 * Resuelve el tenant slug del usuario autenticado actual.
 *
 * Estrategia: (1) intenta leer del session JWT (`sessionClaims.metadata` /
 * `.publicMetadata` — disponible si el JWT template lo incluye); (2) si no,
 * fetch server-side del usuario Clerk por `userId` y lee `publicMetadata`.
 * Si nada resuelve, usa el fallback dev.
 *
 * @returns el tenant slug al que redirigir.
 */
export async function resolvePrimaryTenantId(): Promise<string> {
  const { userId, sessionClaims } = await auth();

  // 1. Fast path: claim en el session JWT (si el template lo incluye).
  const claimSlug = pickTenantSlug(
    (sessionClaims?.metadata ?? sessionClaims?.publicMetadata) as TenantMetadata | undefined,
  );
  if (claimSlug) {
    return claimSlug;
  }

  // 2. Reliable path: fetch del usuario Clerk server-side (siempre trae publicMetadata).
  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const slug = pickTenantSlug(user.publicMetadata);
      if (slug) {
        return slug;
      }
    } catch (err) {
      console.warn("[resolve-primary-tenant] clerk fetch failed:", err);
    }
  }

  return DEV_FALLBACK_TENANT;
}
