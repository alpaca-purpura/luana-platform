/**
 * anabella-coaching-ar.fixture.ts — Anabella Coaching AR tenant fixture (Story 12 T-e2e-1)
 *
 * Pre-configured auth fixture for the Anabella Coaching AR tenant.
 * es-AR locale with voseo dialect (Slot 5 BRAND_VOICE uses voseo per SSoT).
 *
 * Tenant: anabella-coaching-ar
 * Locale: es-AR
 * Vertical: coaching
 * Plan: growth
 */
import { test as authTest, expect, ComunifyAuthFixtures } from "../auth.fixture";

export type AnabellaFixtures = ComunifyAuthFixtures & {
  /** Anabella tenant slug */
  tenantSlug: string;
};

export const test = authTest.extend<AnabellaFixtures>({
  tenantSlug: async ({}, use) => {
    await use("anabella-coaching-ar");
  },
});

export { expect };
