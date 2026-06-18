// cap: comunify-shell-organism
/**
 * clerk.setup.ts — Comunify Clerk auth setup (T-e2e shell-organism).
 *
 * Lifecycle del setup project (serial):
 *  1. clerkSetup() — obtiene testing token via CLERK_SECRET_KEY (bypasea bot-protection FAPI).
 *  2. isAuthFileFresh() — gate de freshness (4h mtime + cookie Clerk vigente) → ahorra re-auth.
 *  3. /sign-in inicializa Clerk en el browser (__clerk_db_jwt dev cookie).
 *  4. Ticket strategy (signIn token server-side vía CLERK_SECRET_KEY) — robusto, sin flujo UI password.
 *  5. Navega / para verificar que el middleware acepta la sesión.
 *  6. Espera window.Clerk.loaded + window.Clerk.user (hidratación completa).
 *  7. Guarda storageState en playwright/.clerk/user.json (gitignored).
 *  8. Retry 2x con backoff lineal + sign-out entre intentos.
 *
 * Port re-temizado desde nicolify/frontend/e2e/setup/clerk.setup.ts.
 * Comunify: FE :3003. Usuario E2E_CLERK_USER_EMAIL (hola@alpacapurpura.lat) bound al
 * tenant comunify-demo (publicMetadata.tenant_id). Ver checkpoint § CHAT LIVE-VERIFICADO.
 *
 * Ejecución:
 *   E2E_BASE_URL=http://localhost:3003 npx playwright test --project=setup
 */

import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";

setup.describe.configure({ mode: "serial" });

const authFile = path.join(__dirname, "../../playwright/.clerk/user.json");

const FRESH_WINDOW_MS = 4 * 60 * 60 * 1_000; // 4 horas
const CF_BM_SAFETY_MARGIN_S = 5 * 60;
const SIGNIN_RETRIES = 2;
const SIGNIN_BACKOFF_MS = 3_000;

function isAuthFileFresh(): boolean {
  if (!fs.existsSync(authFile)) return false;
  try {
    const stat = fs.statSync(authFile);
    if (Date.now() - stat.mtimeMs > FRESH_WINDOW_MS) return false;

    const raw = JSON.parse(fs.readFileSync(authFile, "utf-8")) as {
      cookies?: Array<{ name: string; expires?: number }>;
    };
    const cookies = raw.cookies ?? [];
    if (cookies.length === 0) return false;

    const nowS = Math.floor(Date.now() / 1_000);
    const cfBm = cookies.find((c) => c.name === "__cf_bm");
    if (cfBm?.expires && cfBm.expires - nowS < CF_BM_SAFETY_MARGIN_S) return false;

    const clerkSession = cookies.find(
      (c) => c.name.startsWith("__session") || c.name.startsWith("__client"),
    );
    return Boolean(clerkSession);
  } catch {
    return false;
  }
}

function wipeAuthFile(): void {
  if (fs.existsSync(authFile)) {
    fs.unlinkSync(authFile);
    console.log("[clerk.setup] auth file eliminado (stale)");
  }
}

setup("clerk setup", async () => {
  await clerkSetup();
});

setup("authenticate", async ({ page }) => {
  setup.setTimeout(180_000);

  if (isAuthFileFresh()) {
    console.log("[clerk.setup] auth file fresco — omitiendo re-autenticación");
    return;
  }

  wipeAuthFile();
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await setupClerkTestingToken({ page });

  const email = process.env.E2E_CLERK_USER_EMAIL!;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= SIGNIN_RETRIES + 1; attempt++) {
    try {
      await page.goto("/sign-in", { waitUntil: "networkidle", timeout: 60_000 });
      await clerk.signIn({ page, emailAddress: email });
      await page.goto("/", { waitUntil: "networkidle", timeout: 60_000 });

      if (page.url().includes("/sign-in")) {
        throw new Error(`Post-signIn aterrizó en /sign-in (sesión no activa): ${page.url()}`);
      }

      await page.waitForFunction(
        () => {
          const w = window as unknown as {
            Clerk?: { user?: unknown; loaded?: boolean };
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
      console.warn(
        `[clerk.setup] intento ${attempt} falló: ${err instanceof Error ? err.message : String(err)}`,
      );
      try {
        await page.evaluate(async () => {
          const w = window as unknown as { Clerk?: { signOut?: () => Promise<void> } };
          await w.Clerk?.signOut?.();
        });
      } catch {
        /* best-effort */
      }
      wipeAuthFile();
      if (attempt <= SIGNIN_RETRIES) {
        await new Promise((r) => setTimeout(r, SIGNIN_BACKOFF_MS * attempt));
      }
    }
  }
  throw new Error(`Clerk auth falló tras ${SIGNIN_RETRIES + 1} intentos: ${String(lastErr)}`);
});
