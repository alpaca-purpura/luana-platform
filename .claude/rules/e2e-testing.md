# E2E Testing

> **Slim pointer (W1-Phase2 eviction 2026-06-09 · tier: project).** Cuerpo operativo (preflight, ports, comandos, prohibidos) en `playwright-expert` skill → `references/e2e-rule-summary.md` — el skill auto-carga en cualquier trigger e2e/playwright/smoke.

Trigger: `{brand}/frontend/e2e/**` · `playwright.config.ts` · workflow E2E CI (deferred) · UI feature/bugfix/nav-auth change.

No-skip 1-liner: preflight `scripts/e2e-preflight.sh` SIEMPRE antes de correr · ejecución NATIVE host con `E2E_BASE_URL` per-brand (NUNCA `make e2e*` Docker — OOM) · specs autenticados via `auth.fixture` (nunca `@playwright/test` directo).
