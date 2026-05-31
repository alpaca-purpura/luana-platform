/**
 * clerk.setup.ts — Nicolify Clerk auth setup (T-4 nicolify-r0-dev-stack)
 *
 * Lifecycle del setup project (serial):
 *  1. clerkSetup() — obtiene testing token via CLERK_SECRET_KEY (bypasea Turnstile + heurísticas bot).
 *  2. isAuthFileFresh() — gate de freshness: 4h mtime + cookie cf_bm expiry + Clerk session cookie.
 *     Si el auth file es fresco, omite re-autenticación (ahorra ~30s por corrida).
 *  3. Navega /sign-in para inicializar Clerk en el browser (__clerk_db_jwt dev cookie).
 *  4. Usa ticket strategy (signIn token server-side vía CLERK_SECRET_KEY).
 *     Más robusto que password strategy: no depende del flujo UI email → password en 2 pasos.
 *  5. Navega / para verificar que el middleware acepta la sesión.
 *  6. Sanity check: confirma que NO estamos en /sign-in post-navegar a /.
 *  7. Espera window.Clerk.loaded + window.Clerk.user (session completamente hidratada).
 *  8. Guarda storageState en playwright/.clerk/user.json.
 *  9. Retry 2x con backoff lineal. sign-out entre intentos para evitar "ya autenticado".
 *
 * Salida: playwright/.clerk/user.json (gitignored).
 * Ejecución:
 *   E2E_BASE_URL=http://localhost:3001 npx playwright test --project=setup
 *
 * Port re-temizado desde vitalia/frontend/e2e/setup/clerk.setup.ts.
 * Cambiado: auth file path → ../../playwright/.clerk/user.json (relativo a este archivo).
 * Cambiado: ticket strategy (no password) — más confiable en dev instance Clerk.
 * Eliminado: password strategy fallback (clinic branch) — nicolify no tiene clinic.
 */

import {
  clerk,
  clerkSetup,
  setupClerkTestingToken,
} from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";

setup.describe.configure({ mode: "serial" });

// Ruta al auth file — relativa a este archivo (e2e/setup/ → playwright/.clerk/).
const authFile = path.join(__dirname, "../../playwright/.clerk/user.json");

// Freshness gate: re-autenticar sólo si el auth file tiene más de 4h
// o si las cookies de Clerk ya expiraron.
const FRESH_WINDOW_MS = 4 * 60 * 60 * 1_000; // 4 horas
const CF_BM_SAFETY_MARGIN_S = 5 * 60; // 5 min antes de expiración cf_bm
const SIGNIN_RETRIES = 2;
const SIGNIN_BACKOFF_MS = 3_000;

/**
 * Verifica si el auth file almacenado sigue siendo válido (< 4h + cookies vigentes).
 * Devuelve false si el archivo no existe, es demasiado viejo, o las cookies expiraron.
 */
function isAuthFileFresh(): boolean {
  if (!fs.existsSync(authFile)) return false;
  try {
    const stat = fs.statSync(authFile);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs > FRESH_WINDOW_MS) return false;

    const raw = JSON.parse(fs.readFileSync(authFile, "utf-8")) as {
      cookies?: Array<{ name: string; expires?: number }>;
    };
    const cookies = raw.cookies ?? [];
    if (cookies.length === 0) return false;

    const nowS = Math.floor(Date.now() / 1_000);
    const cfBm = cookies.find((c) => c.name === "__cf_bm");
    if (cfBm?.expires && cfBm.expires - nowS < CF_BM_SAFETY_MARGIN_S) {
      return false;
    }

    // Verificar cookie de sesión Clerk activa
    const clerkSession = cookies.find(
      (c) => c.name.startsWith("__session") || c.name.startsWith("__client"),
    );
    if (!clerkSession) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina el auth file si existe (limpieza pre-reintento).
 */
function wipeAuthFile(): void {
  if (fs.existsSync(authFile)) {
    fs.unlinkSync(authFile);
    console.log("[clerk.setup] auth file eliminado (stale)");
  }
}

/**
 * Test 1: inicializa el testing token de Clerk (llama CLERK_SECRET_KEY → Clerk FAPI).
 * Debe correr antes de 'authenticate' (configure serial garantiza el orden).
 */
setup("clerk setup", async () => {
  await clerkSetup();
});

/**
 * Test 2: autentica y guarda storageState.
 * Usa ticket strategy (server-side signIn token) — más robusto que el flujo UI password.
 * Retry 2x con backoff lineal en caso de fallo transitorio Clerk.
 */
setup("authenticate", async ({ page }) => {
  setup.setTimeout(180_000);

  if (isAuthFileFresh()) {
    console.log("[clerk.setup] auth file fresco — omitiendo re-autenticación");
    return;
  }

  wipeAuthFile();
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // Inyectar testing token interceptor (bypasea protección bot de Clerk FAPI).
  await setupClerkTestingToken({ page });

  const email = process.env.E2E_CLERK_USER_EMAIL!;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= SIGNIN_RETRIES + 1; attempt++) {
    try {
      // Visitar /sign-in inicializa Clerk en el browser:
      // carga el SDK + establece __clerk_db_jwt dev cookie.
      await page.goto("/sign-in", {
        waitUntil: "networkidle",
        timeout: 60_000,
      });

      // Ticket strategy: @clerk/testing crea un signInToken server-side (CLERK_SECRET_KEY),
      // luego ejecuta en browser: Clerk.client.signIn.create({ strategy:'ticket', ticket })
      // + Clerk.setActive(). Evita el flujo email → password → submit de 2 pasos.
      await clerk.signIn({ page, emailAddress: email });

      // Navegar al root autenticado para verificar que el middleware acepta la sesión.
      await page.goto("/", { waitUntil: "networkidle", timeout: 60_000 });

      // Sanity check: no debe redirigir de vuelta a /sign-in.
      const currentUrl = page.url();
      if (currentUrl.includes("/sign-in")) {
        throw new Error(
          `Post-signIn: aterrizó en /sign-in (sesión no activa): ${currentUrl}`,
        );
      }

      // Esperar hidratación completa de Clerk antes de guardar el storageState.
      // domcontentloaded retorna ANTES de window.Clerk.user — race condition causa falsos negativos.
      await page.waitForFunction(
        () => {
          const w = window as unknown as {
            Clerk?: { session?: unknown; user?: unknown; loaded?: boolean };
          };
          return Boolean(w.Clerk?.loaded) && Boolean(w.Clerk?.user);
        },
        null,
        { timeout: 30_000 },
      );

      await page.context().storageState({ path: authFile });
      console.log(`[clerk.setup] auth state guardado (intento ${attempt})`);
      return;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[clerk.setup] intento ${attempt} falló: ${msg}`);
      // Sign-out antes de reintentar para evitar "already signed in" en el siguiente intento.
      try {
        await page.evaluate(async () => {
          const w = window as unknown as {
            Clerk?: { signOut?: () => Promise<void> };
          };
          await w.Clerk?.signOut?.();
        });
      } catch {
        /* best-effort */
      }
      wipeAuthFile();
      if (attempt <= SIGNIN_RETRIES) {
        await new Promise((r) =>
          setTimeout(r, SIGNIN_BACKOFF_MS * attempt),
        );
      }
    }
  }
  throw new Error(
    `Clerk auth falló después de ${SIGNIN_RETRIES + 1} intentos: ${String(lastErr)}`,
  );
});
