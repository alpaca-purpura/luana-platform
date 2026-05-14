/**
 * trini-nutrition-cl.fixture.ts — Trini Nutrición CL tenant fixture (Story 12 T-e2e-1)
 *
 * Tenant: trini-nutrition-cl
 * Locale: es-CL
 * Vertical: nutrition
 * Plan: starter
 */
import { test as authTest, expect, ComunifyAuthFixtures } from "../auth.fixture";

export type TriniFixtures = ComunifyAuthFixtures & {
  tenantSlug: string;
};

export const test = authTest.extend<TriniFixtures>({
  tenantSlug: async ({}, use) => {
    await use("trini-nutrition-cl");
  },
});

export { expect };
