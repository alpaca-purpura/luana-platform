/**
 * large-dataset.fixture.ts — F2-S7 vitalia-fase2-lisa-marca
 *
 * DB seed for SC-9 large dataset performance test:
 * - 50 trust signals (simulating Presencia trust signals list render)
 * - 30 team members (simulating sub-tab linked list view)
 *
 * Usage in specs:
 *   import { test, expect, buildLargeTrustSignals } from '../fixtures/large-dataset.fixture';
 *
 * downstream-regression-na: brand-local vitalia e2e fixture F2-S7 perf test
 *
 * @see 04-validators.yaml § test_construction_plan step 3
 */

import path from "path";
import { test as base, expect } from "@playwright/test";
import type { Page, BrowserContext, Route } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { LISA_MARCA_FIXTURE, setupLisaMarcaMocks } from "./lisa-marca.fixture";

// ---------------------------------------------------------------------------
// Storage state
// ---------------------------------------------------------------------------

const STORAGE_STATE_PATH = path.join(
  __dirname,
  "../../../../playwright/.clerk/user.json",
);

// ---------------------------------------------------------------------------
// Large dataset builders
// ---------------------------------------------------------------------------

export interface TrustSignalItem {
  id: string;
  type: string;
  value: string;
  displayOrder: number;
}

export interface TeamMemberItem {
  id: string;
  name: string;
  role: string;
  specialty: string;
  displayOrder: number;
}

export function buildLargeTrustSignals(count: number = 50): TrustSignalItem[] {
  const types = [
    "certification",
    "award",
    "rating",
    "professional_association",
    "regulatory",
    "patient_satisfaction",
    "custom",
  ];
  const typeLabels: Record<string, string> = {
    certification: "Certificación",
    award: "Premio",
    rating: "Calificación",
    professional_association: "Asociación profesional",
    regulatory: "Habilitación",
    patient_satisfaction: "Satisfacción",
    custom: "Reconocimiento",
  };

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    return {
      id: `ts-large-${String(i + 1).padStart(3, "0")}`,
      type: type ?? "custom",
      value: `${typeLabels[type ?? "custom"] ?? "Reconocimiento"} ${String(i + 1).padStart(2, "0")} — Salud Vitalia PE`,
      displayOrder: i + 1,
    };
  });
}

export function buildLargeTeamMembers(count: number = 30): TeamMemberItem[] {
  const roles = [
    "Médico especialista",
    "Médico general",
    "Enfermera",
    "Nutricionista",
    "Psicóloga",
  ];
  const specialties = [
    "Medicina interna",
    "Cardiología",
    "Nutrición clínica",
    "Salud mental",
    "Medicina general",
  ];
  const firstNames = [
    "Ana",
    "Carlos",
    "María",
    "José",
    "Patricia",
    "Luis",
    "Rosa",
    "Fernando",
  ];
  const lastNames = [
    "García",
    "López",
    "Martínez",
    "Rodríguez",
    "Sánchez",
    "Pérez",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `team-large-${String(i + 1).padStart(3, "0")}`,
    name: `Dra. ${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    role: roles[i % roles.length] ?? "Médico general",
    specialty: specialties[i % specialties.length] ?? "Medicina general",
    displayOrder: i + 1,
  }));
}

// ---------------------------------------------------------------------------
// Setup large dataset mocks on page
// ---------------------------------------------------------------------------

export async function setupLargeDatasetMocks(
  page: Page,
  tenantId: string = LISA_MARCA_FIXTURE.tenantId,
): Promise<void> {
  // First wire base mocks
  await setupLisaMarcaMocks(page, tenantId);

  // Override trust-signals with large dataset (50 items)
  await page.unroute("**/api/v1/lisa/marca/trust-signals");
  const largeTrustSignals = buildLargeTrustSignals(50);

  await page.route(
    "**/api/v1/lisa/marca/trust-signals",
    async (route: Route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId,
            items: largeTrustSignals,
            total: largeTrustSignals.length,
          }),
        });
      } else {
        await route.continue();
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

export type LargeDatasetFixtures = {
  /** Authenticated page with large dataset mocks wired */
  largeDatasetPage: Page;
  /** Authenticated BrowserContext */
  largeDatasetContext: BrowserContext;
  /** 50 trust signal items */
  largeTrustSignals: TrustSignalItem[];
  /** 30 team member items */
  largeTeamMembers: TeamMemberItem[];
  /** Base fixture constants */
  fixture: typeof LISA_MARCA_FIXTURE;
};

// ---------------------------------------------------------------------------
// Fixture extension
// ---------------------------------------------------------------------------

export const test = base.extend<LargeDatasetFixtures>({
  // eslint-disable-next-line no-empty-pattern
  fixture: async ({}, use) => {
    await use(LISA_MARCA_FIXTURE);
  },

  // eslint-disable-next-line no-empty-pattern
  largeTrustSignals: async ({}, use) => {
    await use(buildLargeTrustSignals(50));
  },

  // eslint-disable-next-line no-empty-pattern
  largeTeamMembers: async ({}, use) => {
    await use(buildLargeTeamMembers(30));
  },

  largeDatasetContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE_PATH,
    });
    await use(context);
    await context.close();
  },

  largeDatasetPage: async ({ largeDatasetContext }, use) => {
    const page = await largeDatasetContext.newPage();

    // Clerk testing token injection
    await setupClerkTestingToken({ page });

    // Wire large dataset API mocks
    await setupLargeDatasetMocks(page, LISA_MARCA_FIXTURE.tenantId);

    await use(page);
    await page.close();
  },
});

export { expect };
