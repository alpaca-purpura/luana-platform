/**
 * pablo-productividad-mx.fixture.ts — Pablo Productividad MX tenant fixture (Story 12 T-e2e-1)
 *
 * Tenant: pablo-productividad-mx
 * Locale: es-MX
 * Vertical: productivity
 * Plan: growth
 */
import { test as authTest, expect, ComunifyAuthFixtures } from "../auth.fixture";

export type PabloFixtures = ComunifyAuthFixtures & {
  tenantSlug: string;
};

export const test = authTest.extend<PabloFixtures>({
  tenantSlug: async ({}, use) => {
    await use("pablo-productividad-mx");
  },
});

export { expect };
