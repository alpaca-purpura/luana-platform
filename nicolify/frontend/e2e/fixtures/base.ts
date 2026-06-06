/**
 * base.ts — Runtime-error gate (Critical Rule #37 §3 · gate anti-burbuja)
 * nicolify — ported + adapted from vitalia/frontend/e2e/fixtures/base.ts
 *
 * Convierte el harness de "verde si la request fue 200" a "verde si el cliente
 * NO vio ningún error". Atrapa lo que `GET 200` oculta porque ocurre en el
 * cliente DESPUÉS de la hidratación:
 *   - la burbuja roja de Next.js  → page.on('pageerror')   (excepción JS no atrapada)
 *   - errores de React / hidratación → page.on('console')  (HYDRATION_ERROR_PATTERNS)
 *   - 4xx/5xx en /api/ que la UI traga en un catch → page.on('response')
 *   - el overlay de error de Next en el DOM → expect([data-nextjs-dialog]).toHaveCount(0)
 *
 * Extiende auth.fixture (setupClerkTestingToken ya inyectado).
 * Cada spec nuevo importa de ESTE archivo, no de auth.fixture directamente.
 *
 * Uso:
 *   import { test, expect } from '../../fixtures/base';
 *
 * Opt-out cuando un test ejerce un error a propósito:
 *   test.use({ failOnRuntimeError: false });
 *
 * IMPORTANTE — allowlist (shrink-only):
 *   Agregar entradas requiere justificación explícita. La lista arranca mínima;
 *   solo ruido de infra no-accionable donde la alternativa es un false-positive
 *   permanente que bloquea CI sin valor. "No me gusta este error" NO es justificación.
 */

import { test as authBase, expect } from "../auth.fixture";
import type { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Allowlist TIGHT — solo ruido de infra no-accionable.
// NO incluye hydration / 5xx / 404 (esos DEBEN fallar el gate).
// Shrink-only: no agregar sin justificación en el mismo PR.
// ---------------------------------------------------------------------------
const CONSOLE_ERROR_ALLOWLIST: RegExp[] = [
  // Clerk SDK warnings emitidos en testing token mode (no son bugs de app)
  /ClerkJS/i,
  /clerk\.com/i,
  // CSS parsing warnings de librerías externas que no controlamos
  /Could not parse CSS/i,
  // React DevTools banner (browser extension, no app)
  /Download the React DevTools/i,
  // 401 = redirect de auth esperado en rutas gated (no es bug de runtime).
  // El flujo normal redirige al sign-in; en tests autenticados esto puede
  // aparecer brevemente antes de que Clerk hidrate la sesión.
  /Failed to load resource: the server responded with a status of 401/i,
];

// ---------------------------------------------------------------------------
// Patrones de errores de hidratación React/Next SSR.
// Insidiosos: la UI se ve igual, status 200, pero el DOM quedó inconsistente.
// SIEMPRE fallan el gate — no van a la allowlist.
// ---------------------------------------------------------------------------
const HYDRATION_ERROR_PATTERNS: RegExp[] = [
  /hydration failed because the server rendered html didn't match the client/i,
  /hydration completed but contains mismatches/i,
  /there was an error while hydrating/i,
  /did not expect server html to contain/i,
  /text content does not match server-rendered html/i,
];

// ---------------------------------------------------------------------------
// Tipos exportados
// ---------------------------------------------------------------------------

export type RuntimeErrorFixtures = {
  /** Apagar el gate para tests que ejercen un error a propósito. Default true. */
  failOnRuntimeError: boolean;
  /**
   * Opt-in TIGHT allowlist para pageErrors (excepciones JS no atrapadas) de
   * ORIGEN FRAMEWORK verificado — NUNCA para errores de app. Default [].
   *
   * El gate sigue 100% estricto en todos los specs (default vacío). Un spec
   * solo puede permitir un pageError específico si demuestra que es del
   * framework (no de nuestro código) y dev-only. Cada entrada exige
   * justificación verbatim en el `test.use({...})` del spec.
   *
   * Caso fundacional (2026-06-04): Next 16 en `next dev` emite
   * `TypeError: Failed to execute 'measure' on 'Performance': 'SubsubtabLayout'
   * cannot have a negative time stamp` al hacer `notFound()` desde un layout
   * async. Verificado framework-origin: (a) cero `performance.measure` en src/,
   * (b) la ruta compila, (c) navegaciones válidas limpias, (d) stack = frames
   * ignore-listed (Next interno). Ausente en `next build`+`next start`. NO es
   * un bug de app. SSoT: docs/learnings/2026-06-04-next16-notfound-async-layout-perf-measure.md
   */
  allowedPageErrors: RegExp[];
};

export type RuntimeErrorCollections = {
  pageErrors: string[];
  consoleErrors: string[];
  hydrationErrors: string[];
  failedApi: string[];
};

// ---------------------------------------------------------------------------
// Helper: determina si un mensaje de consola pasa la allowlist.
// Retorna true si el mensaje NO está en la allowlist (es decir, debe fallar).
// ---------------------------------------------------------------------------
export function notAllowlisted(msg: string): boolean {
  return !CONSOLE_ERROR_ALLOWLIST.some((re) => re.test(msg));
}

// ---------------------------------------------------------------------------
// Adjunta los 4 colectores a una página. Devuelve las colecciones (vivas).
// Llamar ANTES de navegar a cualquier URL.
// ---------------------------------------------------------------------------
export function attachRuntimeErrorGuards(page: Page): RuntimeErrorCollections {
  const c: RuntimeErrorCollections = {
    pageErrors: [],
    consoleErrors: [],
    hydrationErrors: [],
    failedApi: [],
  };

  // 1. Excepciones JS no atrapadas — la "burbuja roja" de Next.js
  page.on("pageerror", (err) => {
    c.pageErrors.push(`${err.name}: ${err.message}`);
  });

  // 2. Mensajes de consola tipo error — hidratación + errores de app
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();

    // Clasificar hidratación primero (no van a allowlist — siempre fallan)
    if (HYDRATION_ERROR_PATTERNS.some((p) => p.test(text))) {
      c.hydrationErrors.push(text);
      return;
    }

    // Luego allowlist para ruido de infra no-accionable
    if (notAllowlisted(text)) {
      const loc = msg.location();
      c.consoleErrors.push(`${text} @ ${loc.url}:${loc.lineNumber}`);
    }
  });

  // 3. Respuestas /api/ con status >= 400 que la UI pudo haber tragado en un catch
  page.on("response", (r) => {
    if (r.status() >= 400 && /\/api\//.test(r.url())) {
      c.failedApi.push(`${r.request().method()} ${r.url()} → ${r.status()}`);
    }
  });

  return c;
}

// ---------------------------------------------------------------------------
// Aserta que el DIÁLOGO de error de Next.js dev NO está en el DOM.
//
// ⚠️ `<nextjs-portal>` SIEMPRE existe en `next dev` (hostea el dev-indicator
// + toasts) — NO es señal de error. El error real es el DIÁLOGO modal dentro
// del portal: `[data-nextjs-dialog]` / `[data-nextjs-error-overlay]`.
// Detectamos ESO, no el portal en sí.
// ---------------------------------------------------------------------------
export async function expectNoNextErrorOverlay(page: Page): Promise<void> {
  const errorDialog = page.locator(
    "[data-nextjs-dialog], [data-nextjs-error-overlay], nextjs-portal [role='alertdialog']",
  );
  await expect(
    errorDialog,
    "El diálogo de error de Next.js (la burbuja roja) está en el DOM",
  ).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// Aserta que ninguna colección tiene errores. Llamar al final del test (teardown).
// ---------------------------------------------------------------------------
export function assertNoRuntimeErrors(
  c: RuntimeErrorCollections,
  allowedPageErrors: RegExp[] = [],
): void {
  // Filtrar SOLO pageErrors de origen framework verificado (opt-in tight).
  const realPageErrors = c.pageErrors.filter(
    (e) => !allowedPageErrors.some((re) => re.test(e)),
  );
  expect(
    realPageErrors,
    `Excepciones JS no atrapadas (la burbuja de Next): ${realPageErrors.join(" | ")}`,
  ).toEqual([]);
  expect(
    c.hydrationErrors,
    `Errores de hidratación React/SSR: ${c.hydrationErrors.join(" | ")}`,
  ).toEqual([]);
  expect(
    c.consoleErrors,
    `console.error en el browser (no-allowlisted): ${c.consoleErrors.join(" | ")}`,
  ).toEqual([]);
  expect(
    c.failedApi,
    `Respuestas /api/ 4xx-5xx que la UI pudo haber tragado: ${c.failedApi.join(" | ")}`,
  ).toEqual([]);
}

// ---------------------------------------------------------------------------
// Test extendido: auth.fixture base (Clerk token inyectado) + gate anti-burbuja.
//
// Cada test colecta errores durante toda su vida y asserta vacío al teardown.
// La page que recibe el spec ya tiene setupClerkTestingToken inyectado
// (heredado de auth.fixture).
// ---------------------------------------------------------------------------
export const test = authBase.extend<RuntimeErrorFixtures>({
  failOnRuntimeError: [true, { option: true }],
  allowedPageErrors: [[], { option: true }],

  page: async ({ page, failOnRuntimeError, allowedPageErrors }, use) => {
    // Adjuntar colectores ANTES de que el test navegue a cualquier URL.
    // auth.fixture ya inyectó setupClerkTestingToken en la page.
    const collected = attachRuntimeErrorGuards(page);

    await use(page);

    // Teardown: aserta vacío si el gate está activo.
    if (!failOnRuntimeError) return;
    if (!page.isClosed()) {
      // Si el spec permite un pageError framework específico, el overlay de Next
      // dev puede estar presente por ESE error — no por uno de app. Solo
      // chequeamos el overlay cuando no hay allowlist de pageErrors.
      if (allowedPageErrors.length === 0) {
        await expectNoNextErrorOverlay(page);
      }
    }
    assertNoRuntimeErrors(collected, allowedPageErrors);
  },
});

export { expect };
