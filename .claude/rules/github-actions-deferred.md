# GitHub Actions Deferred (pre-commit / pre-push hooks are SSoT)

> **Slim stub (context-rot pass 2026-05-30).** Detalle completo en `docs/rules-detail/github-actions-deferred.md` — load on-demand vía Read. **Origen:** conversación 2026-05-27 — cement-date 2026-05-27.

## Regla cardinal

Hasta que haya servidor real con deploy automatizado, **GitHub Actions workflows están en modo `deferred`**: no se garantiza que corran. La calidad se enforce 100% via hooks locales:

- `scripts/git-hooks/pre-commit` — SSoT calidad por commit (light en `wip/*`, full en `main`/`release/*`)
- `scripts/git-hooks/pre-push` — tests + tsc + arch fitness antes de push
- `make ci-parity` — full suite equivalente a `ci.yml`, obligatorio antes de squash-merge wip→main

**Reactivar cuando:** servidor staging provisionado · primera release vX.Y.Z · 2º developer · customer-paying contract · auditor SOC2/ISO.

## Cuándo carga el detalle

- Se va a reactivar un workflow de `.github/workflows/` → leer tabla completa de workflows status + procedure de reactivación.
- Duda sobre qué secciones corre el pre-commit hook (13 secciones full gate) → leer detalle.
- Necesitás los comandos manuales equivalentes a cada workflow → leer tabla "Test invocation manual".

## Anti-patterns (top 3 — lista completa en el detalle)

- ❌ Esperar GitHub Actions verde para mergear (workflows están deferred — sin reliance)
- ❌ Skip pre-commit hook con `--no-verify` (rule git-safety.md prohíbe sin excepción)
- ❌ Eliminar workflows files de `.github/workflows/` (mantenerlos preserva history + reactivación rápida)

## Referencias

- `docs/rules-detail/github-actions-deferred.md` — **detalle completo** (tabla workflows status, 13 secciones hook, test invocation manual, reactivación procedure)
- `.claude/rules/git-safety.md` — prohíbe `--no-verify`
- `scripts/git-hooks/pre-commit` — código del hook SSoT
- `Makefile` § `ci-parity` — full suite local
