// cap: comunify-shell-organism
/**
 * base.ts — Auth + runtime-error gate for comunify shell-organism authed specs.
 *
 * Critical Rule #37 §3 (gate anti-burbuja): convierte el harness de "verde si
 * la request fue 200" a "verde si el cliente NO vio ningún error". Atrapa lo
 * que `GET 200` oculta porque ocurre en el cliente DESPUÉS de la hidratación:
 *   - burbuja roja de Next.js   → page.on('pageerror')
 *   - errores React/hidratación → page.on('console') (HYDRATION_ERROR_PATTERNS)
 *   - 4xx/5xx en /api/ tragados en un catch → page.on('response')
 *   - overlay de error de Next en el DOM → [data-nextjs-dialog] count 0
 *
 * Self-contained (NO extiende auth.fixture cookie-bypass legacy): inyecta
 * setupClerkTestingToken({ page }) él mismo. La sesión pre-autenticada viene
 * del storageState del proyecto (playwright/.clerk/user.json, generado por
 * clerk.setup.ts) — no de un fixture. Patrón nicolify/vitalia.
 *
 * Uso:
 *   import { test, expect } from "../fixtures/base";
 *
 * Opt-out cuando un test ejerce un error a propósito:
 *   test.use({ failOnRuntimeError: false });
 *
 * Allowlist (shrink-only): agregar entradas exige justificación verbatim.
 */

import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// ── Allowlist TIGHT — solo ruido de infra no-accionable. ─────────────────────
const CONSOLE_ERROR_ALLOWLIST: RegExp[] = [
  /ClerkJS/i,
  /clerk\.com/i,
  /Could not parse CSS/i,
  /Download the React DevTools/i,
  // 401 transitorio antes de que Clerk hidrate la sesión en rutas gated.
  /Failed to load resource: the server responded with a status of 401/i,
];

// ── Hidratación React/Next SSR — SIEMPRE fallan el gate. ─────────────────────
const HYDRATION_ERROR_PATTERNS: RegExp[] = [
  /hydration failed because the server rendered html didn't match the client/i,
  /hydration completed but contains mismatches/i,
  /there was an error while hydrating/i,
  /did not expect server html to contain/i,
  /text content does not match server-rendered html/i,
];

export type RuntimeErrorFixtures = {
  failOnRuntimeError: boolean;
  allowedPageErrors: RegExp[];
};

export type RuntimeErrorCollections = {
  pageErrors: string[];
  consoleErrors: string[];
  hydrationErrors: string[];
  failedApi: string[];
};

function notAllowlisted(msg: string): boolean {
  return !CONSOLE_ERROR_ALLOWLIST.some((re) => re.test(msg));
}

function attachRuntimeErrorGuards(page: Page): RuntimeErrorCollections {
  const c: RuntimeErrorCollections = {
    pageErrors: [],
    consoleErrors: [],
    hydrationErrors: [],
    failedApi: [],
  };

  page.on("pageerror", (err) => {
    c.pageErrors.push(`${err.name}: ${err.message}`);
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (HYDRATION_ERROR_PATTERNS.some((p) => p.test(text))) {
      c.hydrationErrors.push(text);
      return;
    }
    if (notAllowlisted(text)) {
      const loc = msg.location();
      c.consoleErrors.push(`${text} @ ${loc.url}:${loc.lineNumber}`);
    }
  });

  // Solo /api/ — los 500 cosméticos de assets estáticos (favicon, avatar.svg)
  // NO matchean este regex y no rompen el gate.
  page.on("response", (r) => {
    if (r.status() >= 400 && /\/api\//.test(r.url())) {
      c.failedApi.push(`${r.request().method()} ${r.url()} → ${r.status()}`);
    }
  });

  return c;
}

async function expectNoNextErrorOverlay(page: Page): Promise<void> {
  const errorDialog = page.locator(
    "[data-nextjs-dialog], [data-nextjs-error-overlay], nextjs-portal [role='alertdialog']",
  );
  await expect(
    errorDialog,
    "El diálogo de error de Next.js (la burbuja roja) está en el DOM",
  ).toHaveCount(0);
}

function assertNoRuntimeErrors(
  c: RuntimeErrorCollections,
  allowedPageErrors: RegExp[] = [],
): void {
  const realPageErrors = c.pageErrors.filter(
    (e) => !allowedPageErrors.some((re) => re.test(e)),
  );
  expect(
    realPageErrors,
    `Excepciones JS no atrapadas (burbuja de Next): ${realPageErrors.join(" | ")}`,
  ).toEqual([]);
  expect(
    c.hydrationErrors,
    `Errores de hidratación React/SSR: ${c.hydrationErrors.join(" | ")}`,
  ).toEqual([]);
  expect(
    c.consoleErrors,
    `console.error no-allowlisted: ${c.consoleErrors.join(" | ")}`,
  ).toEqual([]);
  expect(
    c.failedApi,
    `Respuestas /api/ 4xx-5xx tragadas: ${c.failedApi.join(" | ")}`,
  ).toEqual([]);
}

// ── Test extendido: Clerk token inyectado + gate anti-burbuja. ───────────────
export const test = base.extend<RuntimeErrorFixtures>({
  failOnRuntimeError: [true, { option: true }],
  allowedPageErrors: [[], { option: true }],

  page: async ({ page, failOnRuntimeError, allowedPageErrors }, use) => {
    // Inyectar testing token (bypasea bot-protection de Clerk FAPI) ANTES de navegar.
    await setupClerkTestingToken({ page });
    const collected = attachRuntimeErrorGuards(page);

    await use(page);

    if (!failOnRuntimeError) return;
    if (!page.isClosed()) {
      if (allowedPageErrors.length === 0) {
        await expectNoNextErrorOverlay(page);
      }
    }
    assertNoRuntimeErrors(collected, allowedPageErrors);
  },
});

export { expect };
