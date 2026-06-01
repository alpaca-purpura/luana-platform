/**
 * lisa-marca.fixture.ts — F2-S7 vitalia-fase2-lisa-marca
 *
 * Fixture: Clerk authedAsOwner + tenant PE setup + DB seed brand_identity +
 * visuals + personality + contact + MSW worker setup via page.route mocks.
 *
 * Usage in specs:
 *   import { test, expect } from '../fixtures/lisa-marca.fixture';
 *
 * Tenant: clinica-salud-vitalia-pe (locale es-PE, currency PEN, country PE)
 * Role: brand_owner (admin_clinic)
 * Seed: brand identity + visuals + personality (4 archetypes) + contact + trust signals
 *
 * downstream-regression-na: brand-local vitalia e2e fixture F2-S7; no cross-brand consumers
 *
 * @see 04-validators.yaml § test_construction_plan step 1
 */

import path from "path";
import { test as base, expect } from "@playwright/test";
import type { Page, BrowserContext, Route } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

// ---------------------------------------------------------------------------
// Tenant constants (PE — clinica-salud-vitalia-pe)
// ---------------------------------------------------------------------------

export const LISA_MARCA_FIXTURE = {
  tenantId:
    process.env["VITALIA_PE_TENANT_ID"] ?? "clinica-salud-vitalia-pe-test",
  tenantSlug: "clinica-salud-vitalia-pe",
  clinicId:
    process.env["VITALIA_PE_CLINIC_ID"] ?? "clinic-salud-vitalia-pe-001",
  locale: "es-PE" as const,
  currency: "PEN" as const,
  timezone: "America/Lima" as const,
  country: "PE" as const,
  /** Seed brand identity */
  identity: {
    brandName: "Salud Vitalia",
    tagline: "Tu bienestar, nuestra misión",
    description: "Clínica médica integral con enfoque preventivo y humanizado.",
    clinicVertical: "medicina_general",
    primarySpecialties: ["medicina_general", "nutricion"],
  },
  /** Seed visuals */
  visuals: {
    logoUrl: null as string | null,
    primaryColor: "#2E7D32",
    secondaryColor: "#66BB6A",
    fontFamily: "Inter",
  },
  /** Seed personality (Caregiver archetype — salud default) */
  personality: {
    archetype: "caregiver" as const,
    toneBlocks: {
      openingHook:
        "En Salud Vitalia, cuidamos de ti con dedicación y expertise médico.",
      mainBody: "Nuestro equipo de profesionales trabaja con empatía.",
      closingCta: "Agenda tu consulta hoy y da el primer paso hacia tu salud.",
    },
    languageStyle: "formal_warm",
    prohibitedPhrases: [] as string[],
  },
  /** Seed contact */
  contact: {
    website: "https://saludvitalia.pe",
    instagram: "@saludvitalia",
    tiktok: null as string | null,
    googleBusiness: null as string | null,
    address: "Av. Javier Prado Este 2300, San Isidro, Lima",
    phone: "+51 1 234-5678",
  },
  /** Trust signals seed (PE hybrid catalog) */
  trustSignals: [
    {
      id: "ts-001",
      type: "certification",
      value: "Acreditación SUSALUD",
      displayOrder: 1,
    },
    {
      id: "ts-002",
      type: "award",
      value: "Premio Salud Digital 2025",
      displayOrder: 2,
    },
  ],
  /** Voice blocklist seed (PE defaults) */
  voiceBlocklist: [
    { id: "vb-001", phrase: "barato", severity: "warning" },
    { id: "vb-002", phrase: "descuento", severity: "warning" },
  ],
  /** Trust catalog (PE seed 8 entries) */
  trustCatalog: [
    { id: "tc-pe-001", label: "Acreditación SUSALUD", category: "regulatory" },
    { id: "tc-pe-002", label: "ISO 9001:2015", category: "certification" },
    { id: "tc-pe-003", label: "Premio Salud Digital", category: "award" },
    {
      id: "tc-pe-004",
      label: "Miembro SOMECO",
      category: "professional_association",
    },
    {
      id: "tc-pe-005",
      label: "Clínica Verificada MINSA",
      category: "regulatory",
    },
    { id: "tc-pe-006", label: "5 estrellas Google", category: "rating" },
    {
      id: "tc-pe-007",
      label: "NPS 85+ (últimos 6 meses)",
      category: "patient_satisfaction",
    },
    { id: "tc-pe-008", label: "Otra", category: "custom" },
  ],
  /** Alternate tenant for cross-tenant SC-4 adversarial test */
  tenantB: {
    tenantId: process.env["VITALIA_MX_TENANT_ID"] ?? "clinica-salud-mx-test",
    tenantSlug: "clinica-salud-mx",
    clinicId:
      process.env["VITALIA_MX_CLINIC_ID"] ?? "clinic-salud-mx-001-intruder",
    country: "MX" as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Storage state (Clerk testing token)
// ---------------------------------------------------------------------------

const STORAGE_STATE_PATH = path.join(
  __dirname,
  "../../../../playwright/.clerk/user.json",
);

// ---------------------------------------------------------------------------
// API mock base data (used by page.route mocks — NO real BE calls)
// ---------------------------------------------------------------------------

export function buildMockIdentityResponse(
  tenantId: string = LISA_MARCA_FIXTURE.tenantId,
) {
  return {
    tenantId,
    brandName: LISA_MARCA_FIXTURE.identity.brandName,
    tagline: LISA_MARCA_FIXTURE.identity.tagline,
    description: LISA_MARCA_FIXTURE.identity.description,
    clinicVertical: LISA_MARCA_FIXTURE.identity.clinicVertical,
    primarySpecialties: LISA_MARCA_FIXTURE.identity.primarySpecialties,
    updatedAt: "2026-05-27T18:00:00.000Z",
  };
}

export function buildMockVisualsResponse(
  tenantId: string = LISA_MARCA_FIXTURE.tenantId,
) {
  return {
    tenantId,
    logoUrl: LISA_MARCA_FIXTURE.visuals.logoUrl,
    primaryColor: LISA_MARCA_FIXTURE.visuals.primaryColor,
    secondaryColor: LISA_MARCA_FIXTURE.visuals.secondaryColor,
    fontFamily: LISA_MARCA_FIXTURE.visuals.fontFamily,
    extractionStatus: "stub_disabled",
    updatedAt: "2026-05-27T18:00:00.000Z",
  };
}

export function buildMockPersonalityResponse(
  tenantId: string = LISA_MARCA_FIXTURE.tenantId,
) {
  // Returns shape matching PersonalityResponse interface (camelCase, BrandPersonalityDTO mirror).
  // Fix: arreglar-guardado-voz-y-tono T-3.bis — old shape (toneBlocks/languageStyle) caused
  // VozTonoView to fail to hydrate archetype correctly (missing personalityProfileId + soISpeak
  // fields). Now matches the real BE BrandPersonalityDTO with alias_generator=to_camel.
  return {
    tenantId,
    personalityProfileId: "mock-personality-profile-id-001",
    archetype: LISA_MARCA_FIXTURE.personality.archetype,
    soISpeak: LISA_MARCA_FIXTURE.personality.toneBlocks.mainBody,
    soIDontSpeak: "",
    technicalContext: "",
    formatInstructions: "",
    identityAnchor: LISA_MARCA_FIXTURE.identity.tagline,
    domainContext: LISA_MARCA_FIXTURE.identity.description,
    compiledAt: null,
    compilerVersion: "v2",
    updatedAt: "2026-05-27T18:00:00.000Z",
  };
}

export function buildMockContactResponse(
  tenantId: string = LISA_MARCA_FIXTURE.tenantId,
) {
  return {
    tenantId,
    website: LISA_MARCA_FIXTURE.contact.website,
    instagram: LISA_MARCA_FIXTURE.contact.instagram,
    tiktok: LISA_MARCA_FIXTURE.contact.tiktok,
    googleBusiness: LISA_MARCA_FIXTURE.contact.googleBusiness,
    address: LISA_MARCA_FIXTURE.contact.address,
    phone: LISA_MARCA_FIXTURE.contact.phone,
    updatedAt: "2026-05-27T18:00:00.000Z",
  };
}

export function buildMockTrustSignalsResponse(
  tenantId: string = LISA_MARCA_FIXTURE.tenantId,
) {
  return {
    tenantId,
    items: [...LISA_MARCA_FIXTURE.trustSignals],
    total: LISA_MARCA_FIXTURE.trustSignals.length,
  };
}

export function buildMockVoiceBlocklistResponse(
  tenantId: string = LISA_MARCA_FIXTURE.tenantId,
) {
  return {
    tenantId,
    items: [...LISA_MARCA_FIXTURE.voiceBlocklist],
    total: LISA_MARCA_FIXTURE.voiceBlocklist.length,
  };
}

export function buildMockTrustCatalogResponse(
  country: string = LISA_MARCA_FIXTURE.country,
) {
  return {
    country,
    items: [...LISA_MARCA_FIXTURE.trustCatalog],
    total: LISA_MARCA_FIXTURE.trustCatalog.length,
  };
}

export function buildMockVoicePreviewResponse() {
  return {
    preview: {
      openingHook:
        "En Salud Vitalia, cuidamos de ti con dedicación y expertise médico.",
      mainBody: "Nuestro equipo de profesionales trabaja con empatía.",
      closingCta:
        "Agenda tu consulta hoy y da el primer paso hacia tu salud.",
    },
    cacheHit: true,
    compilerVersion: "v2",
    generatedAt: "2026-05-27T18:00:00.000Z",
  };
}

// ---------------------------------------------------------------------------
// Network mock setup — page.route (NO real BE calls)
// ---------------------------------------------------------------------------

export async function setupLisaMarcaMocks(
  page: Page,
  tenantId: string = LISA_MARCA_FIXTURE.tenantId,
  overrides: {
    identityOverride?: object;
    visualsOverride?: object;
    personalityOverride?: object;
    contactOverride?: object;
  } = {},
): Promise<void> {
  // GET identity
  await page.route("**/api/v1/lisa/marca/identity", async (route: Route) => {
    if (route.request().method() === "GET") {
      const response = {
        ...buildMockIdentityResponse(tenantId),
        ...overrides.identityOverride,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    } else if (route.request().method() === "PATCH") {
      // Autosave endpoint: echo back the patched fields merged with seed
      const body = JSON.parse(route.request().postData() ?? "{}") as Record<
        string,
        unknown
      >;
      const response = {
        ...buildMockIdentityResponse(tenantId),
        ...overrides.identityOverride,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    } else {
      await route.continue();
    }
  });

  // GET/PATCH visuals
  await page.route("**/api/v1/lisa/marca/visuals", async (route: Route) => {
    if (route.request().method() === "GET") {
      const response = {
        ...buildMockVisualsResponse(tenantId),
        ...overrides.visualsOverride,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    } else if (route.request().method() === "PATCH") {
      const body = JSON.parse(route.request().postData() ?? "{}") as Record<
        string,
        unknown
      >;
      const response = {
        ...buildMockVisualsResponse(tenantId),
        ...overrides.visualsOverride,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    } else {
      await route.continue();
    }
  });

  // GET/PATCH personality
  await page.route(
    "**/api/v1/lisa/marca/personality",
    async (route: Route) => {
      if (route.request().method() === "GET") {
        const response = {
          ...buildMockPersonalityResponse(tenantId),
          ...overrides.personalityOverride,
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(response),
        });
      } else if (route.request().method() === "PATCH") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        const response = {
          ...buildMockPersonalityResponse(tenantId),
          ...overrides.personalityOverride,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(response),
        });
      } else {
        await route.continue();
      }
    },
  );

  // GET/PATCH contact
  await page.route("**/api/v1/lisa/marca/contact", async (route: Route) => {
    if (route.request().method() === "GET") {
      const response = {
        ...buildMockContactResponse(tenantId),
        ...overrides.contactOverride,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    } else if (route.request().method() === "PATCH") {
      const body = JSON.parse(route.request().postData() ?? "{}") as Record<
        string,
        unknown
      >;
      const response = {
        ...buildMockContactResponse(tenantId),
        ...overrides.contactOverride,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    } else {
      await route.continue();
    }
  });

  // GET voice-preview
  await page.route(
    "**/api/v1/lisa/marca/voice-preview",
    async (route: Route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(buildMockVoicePreviewResponse()),
        });
      } else {
        await route.continue();
      }
    },
  );

  // GET/POST/DELETE trust-signals
  await page.route(
    "**/api/v1/lisa/marca/trust-signals",
    async (route: Route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(buildMockTrustSignalsResponse(tenantId)),
        });
      } else if (method === "POST") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        const newItem = {
          id: `ts-${Date.now()}`,
          ...body,
          displayOrder:
            LISA_MARCA_FIXTURE.trustSignals.length + 1,
        };
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newItem),
        });
      } else {
        await route.continue();
      }
    },
  );

  // DELETE trust-signals/:id
  await page.route(
    "**/api/v1/lisa/marca/trust-signals/**",
    async (route: Route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    },
  );

  // GET trust-catalog/PE
  await page.route(
    "**/api/v1/lisa/marca/trust-catalog/**",
    async (route: Route) => {
      if (route.request().method() === "GET") {
        const urlParts = route.request().url().split("/");
        const country =
          urlParts[urlParts.length - 1]?.toUpperCase() ?? "PE";
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(buildMockTrustCatalogResponse(country)),
        });
      } else {
        await route.continue();
      }
    },
  );

  // GET/POST/DELETE voice-blocklist
  await page.route(
    "**/api/v1/lisa/marca/voice-blocklist",
    async (route: Route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(buildMockVoiceBlocklistResponse(tenantId)),
        });
      } else if (method === "POST") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        const newItem = {
          id: `vb-${Date.now()}`,
          ...body,
        };
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newItem),
        });
      } else {
        await route.continue();
      }
    },
  );

  // DELETE voice-blocklist/:id
  await page.route(
    "**/api/v1/lisa/marca/voice-blocklist/**",
    async (route: Route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

export type LisaMarcaFixtures = {
  /** Authenticated page for brand_owner role (PE tenant) */
  marcaPage: Page;
  /** Authenticated BrowserContext (for multi-context SC-6 concurrent owners) */
  marcaContext: BrowserContext;
  /** Fixture constants */
  fixture: typeof LISA_MARCA_FIXTURE;
};

// ---------------------------------------------------------------------------
// Base fixture — extend Playwright test with Clerk auth + MSW mocks
// ---------------------------------------------------------------------------

export const test = base.extend<LisaMarcaFixtures>({
  // eslint-disable-next-line no-empty-pattern
  fixture: async ({}, use) => {
    await use(LISA_MARCA_FIXTURE);
  },

  marcaContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE_PATH,
    });
    await use(context);
    await context.close();
  },

  marcaPage: async ({ marcaContext }, use) => {
    const page = await marcaContext.newPage();

    // Clerk testing token injection (per playwright-expert SSoT)
    await setupClerkTestingToken({ page });

    // Wire all API mocks (NO real BE calls)
    await setupLisaMarcaMocks(page, LISA_MARCA_FIXTURE.tenantId);

    await use(page);
    await page.close();
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Helper: navigate to lisa/marca route (N3-static sub-sub-tab)
// ---------------------------------------------------------------------------

export type LisaMarcaSubsubtab = "identidad" | "voz-y-tono" | "presencia";

export async function gotoMarca(
  page: Page,
  tenantId: string = LISA_MARCA_FIXTURE.tenantId,
  subsubtab: LisaMarcaSubsubtab = "identidad",
): Promise<void> {
  await page.goto(`/${tenantId}/lisa/marca/${subsubtab}`);
  await page.waitForLoadState("domcontentloaded");
}
