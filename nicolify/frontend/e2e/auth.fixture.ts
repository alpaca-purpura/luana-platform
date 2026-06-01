/**
 * auth.fixture.ts — Nicolify E2E authenticated fixture (T-4 nicolify-r0-dev-stack)
 *
 * Extiende el test base de Playwright con:
 *   - setupClerkTestingToken(): inyecta interceptor de bypass bot por página
 *   - tenantId: string desde E2E_TENANT_ID (fixture option)
 *
 * Uso en specs autenticados:
 *   import { test, expect } from '../../auth.fixture';
 *   // NO importar { test } desde '@playwright/test' en specs autenticados (playwright-expert SSoT).
 *
 * El storageState (playwright/.clerk/user.json) lo carga playwright.config.ts
 * en el proyecto 'smoke' via storageState: 'playwright/.clerk/user.json'.
 * setupClerkTestingToken() inyecta el interceptor adicional que hace que Clerk
 * reconozca el contexto de testing → isSignedIn = true → useEffect en HomeClient dispara.
 *
 * Sin setupClerkTestingToken(), Clerk puede mantener isSignedIn=false en testing
 * aunque storageState tenga las cookies → el useEffect de HomeClient no dispara
 * → no hay fetch → no hay estado error → los tests de Scenario 7 fallan.
 *
 * Port re-temizado desde vitalia/frontend/e2e/auth.fixture.ts.
 *
 * @see clerk.setup.ts — genera el storageState
 * @see playwright.config.ts — configura el proyecto smoke con storageState
 */

import { test as base, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

export type NicolifyAuthFixtures = {
  /** Tenant ID del test (del env E2E_TENANT_ID). Usar en assertions X-Tenant-ID. */
  tenantId: string;
};

/**
 * Test fixture autenticado — inyecta Clerk testing token + tenantId.
 *
 * setupClerkTestingToken() es OBLIGATORIO para que Clerk reconozca el contexto
 * de testing y active isSignedIn=true en el browser. Sin esto, aunque storageState
 * tenga las cookies, Clerk puede no hidratar correctamente en E2E.
 */
export const test = base.extend<NicolifyAuthFixtures>({
  tenantId: [
    process.env["E2E_TENANT_ID"] ?? "",
    { option: true },
  ],

  page: async ({ page }, use) => {
    // setupClerkTestingToken DEBE llamarse ANTES de navegar cualquier URL.
    // Inyecta el interceptor que bypasea la protección bot de Clerk FAPI
    // y hace que Clerk reconozca el contexto de testing.
    await setupClerkTestingToken({ page });
    await use(page);
  },
});

export { expect };
