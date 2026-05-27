/**
 * voice-preview-mock.ts — F2-S7 vitalia-fase2-lisa-marca
 *
 * MSW handler variants for GET /api/v1/lisa/marca/voice-preview:
 * - hit: cache hit (compilerVersion v2, cacheHit=true)
 * - miss: cache miss (cacheHit=false, fresh compile)
 * - compileError: 500 compile error scenario
 * - cacheInvalidation: simulate personality change → cache bust
 *
 * Usage in specs (SC-2 voice warning, SC-6 concurrent owners):
 *   import { setupVoicePreviewMock } from '../fixtures/voice-preview-mock';
 *   await setupVoicePreviewMock(page, 'hit');
 *
 * downstream-regression-na: brand-local vitalia e2e fixture F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 2
 */

import type { Page, Route } from "@playwright/test";

// ---------------------------------------------------------------------------
// Voice preview response variants
// ---------------------------------------------------------------------------

export type VoicePreviewVariant =
  | "hit"
  | "miss"
  | "compileError"
  | "cacheInvalidation"
  | "emptyPersonality";

export interface VoicePreviewMockOptions {
  variant: VoicePreviewVariant;
  /** Override personality content for cache invalidation test */
  newPersonalityHash?: string;
  /** Delay in ms to simulate compile latency (default: 0) */
  delayMs?: number;
}

function buildHitResponse() {
  return {
    preview: {
      openingHook:
        "En Salud Vitalia, cuidamos de ti con dedicación y expertise médico.",
      mainBody:
        "Nuestro equipo de profesionales trabaja con empatía y rigor clínico.",
      closingCta:
        "Agenda tu consulta hoy y da el primer paso hacia tu bienestar.",
    },
    cacheHit: true,
    compilerVersion: "v2",
    generatedAt: "2026-05-27T18:00:00.000Z",
    cachedAt: "2026-05-27T17:30:00.000Z",
  };
}

function buildMissResponse() {
  return {
    preview: {
      openingHook:
        "En Salud Vitalia, cuidamos de ti con dedicación y expertise médico.",
      mainBody:
        "Nuestro equipo de profesionales trabaja con empatía y rigor clínico.",
      closingCta:
        "Agenda tu consulta hoy y da el primer paso hacia tu bienestar.",
    },
    cacheHit: false,
    compilerVersion: "v2",
    generatedAt: new Date().toISOString(),
    cachedAt: null,
  };
}

function buildCacheInvalidationResponse(newHash?: string) {
  return {
    preview: {
      openingHook:
        "Somos Salud Vitalia — guías expertas en tu camino de bienestar.",
      mainBody:
        "Con vocación sanadora y metodología basada en evidencia, te acompañamos.",
      closingCta: "Da el primer paso: reserva tu consulta con nuestros especialistas.",
    },
    cacheHit: false,
    compilerVersion: "v2",
    generatedAt: new Date().toISOString(),
    cachedAt: null,
    invalidatedBy: newHash ?? "personality_updated",
  };
}

function buildEmptyPersonalityResponse() {
  return {
    preview: null,
    cacheHit: false,
    compilerVersion: "v2",
    generatedAt: new Date().toISOString(),
    message: "Configura los bloques de voz para generar una vista previa.",
  };
}

// ---------------------------------------------------------------------------
// setupVoicePreviewMock — wire page.route for voice-preview endpoint
// ---------------------------------------------------------------------------

export async function setupVoicePreviewMock(
  page: Page,
  variantOrOptions: VoicePreviewVariant | VoicePreviewMockOptions,
): Promise<void> {
  const opts: VoicePreviewMockOptions =
    typeof variantOrOptions === "string"
      ? { variant: variantOrOptions }
      : variantOrOptions;

  // Remove any existing route handler for this endpoint
  await page.unroute("**/api/v1/lisa/marca/voice-preview");

  await page.route(
    "**/api/v1/lisa/marca/voice-preview",
    async (route: Route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      // Simulate compile latency if requested
      if (opts.delayMs && opts.delayMs > 0) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, opts.delayMs),
        );
      }

      switch (opts.variant) {
        case "hit": {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(buildHitResponse()),
          });
          break;
        }

        case "miss": {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(buildMissResponse()),
          });
          break;
        }

        case "compileError": {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              detail:
                "Error al compilar la vista previa de voz. Verifica los bloques configurados.",
              code: "VOICE_COMPILE_ERROR",
            }),
          });
          break;
        }

        case "cacheInvalidation": {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(
              buildCacheInvalidationResponse(opts.newPersonalityHash),
            ),
          });
          break;
        }

        case "emptyPersonality": {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(buildEmptyPersonalityResponse()),
          });
          break;
        }

        default: {
          await route.continue();
        }
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Compound helper: simulate personality change → cache invalidation flow
// Used in SC-6 concurrent owners and SC-2 voice warning tests
// ---------------------------------------------------------------------------

export async function simulatePersonalityUpdateCacheInvalidation(
  page: Page,
  newArchetype: string = "sage",
): Promise<void> {
  // Step 1: personality PATCH returns updated archetype
  await page.unroute("**/api/v1/lisa/marca/personality");
  await page.route(
    "**/api/v1/lisa/marca/personality",
    async (route: Route) => {
      if (route.request().method() === "PATCH") {
        const body = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: "clinica-salud-vitalia-pe-test",
            archetype: newArchetype,
            ...body,
            updatedAt: new Date().toISOString(),
          }),
        });
      } else if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            tenantId: "clinica-salud-vitalia-pe-test",
            archetype: newArchetype,
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    },
  );

  // Step 2: voice-preview now returns cache-invalidated response
  await setupVoicePreviewMock(page, {
    variant: "cacheInvalidation",
    newPersonalityHash: `archetype_changed_to_${newArchetype}`,
  });
}
