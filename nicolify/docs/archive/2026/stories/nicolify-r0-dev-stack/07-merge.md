# 07-merge.md — nicolify-r0-dev-stack

> Fase F MERGE · `/pm-nicolify` · 2026-05-30 · state reviewing → done · audit APPROVED

## § 1 — Gherkin verification matrix

Copia de `06-audit/gherkin-matrix.md` — **7/7 scenarios PASS** (verificado live):

| # | Scenario | Test | Status |
|---|---|---|---|
| 1 | stack-up-green | `curl :8001/health`+`/api/health` 200 · alembic head · FE :3001 | ✅ |
| 2 | protected-route-requires-auth | `e2e/auth/protected-redirect.spec.ts` + `test_auth_gate.py` (401) | ✅ |
| 3 | migration-idempotency | `test_migrations_idempotent.py` + alembic ×2 | ✅ |
| 4 | cross-tenant-isolation | `test_tenant_isolation.py` (403) + `test_no_secret_leak.py` | ✅ |
| 5 | auth-vertical-slice | `e2e/auth/auth-slice.spec.ts` (Clerk→fetchClient X-Tenant-ID→BE 200) | ✅ |
| 6 | smoke-green | `e2e/smoke/stack.smoke.spec.ts` (16/16 live) | ✅ |
| 7 | fe-network-failure | `e2e/auth/root-network-failure.spec.ts` (BE 500→TUTEO) | ✅ |

## § 2 — Playwright E2E run

```bash
cd nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke
# → 16 passed (setup clerk.setup.ts genera storageState · auth/* + smoke/*)
```
Verdict: **GREEN 16/16** (live contra stack :3001).

## § 3 — Capabilities updated/created

- **CREADA** (`cap_change_type: new`): `nicolify/docs/product/capabilities/platform/nicolify-brand-runtime-foundation.yaml`
  - status: live · scenarios 1-7 embebidos · e2e_test=`e2e/smoke/stack.smoke.spec.ts` (cross_check_3 HARD satisfecho).

## § 4 — Modules MD refreshed

- N/A para R0 dev-stack (módulo `platform` es infra foundation, sin narrativa de módulo de negocio aún). Se poblará al mergear módulos brand (crm, copilot, sales_agent…).

## § 5 — How to verify (reproducible)

```bash
WS=$(git rev-parse --show-toplevel)
# 1. Stack
make dev-nicolify
curl -fsS http://127.0.0.1:8001/health        # {"status":"ok","brand":"nicolify",...}
curl -fsS http://127.0.0.1:8001/api/health
# 2. Migración + seed
docker exec luana-dev-nicolify_backend_dev-1 bash -c 'cd /workspace/nicolify/backend && /workspace/.venv/bin/alembic upgrade head'
# seed (host, con .env.dev):  .venv/bin/python nicolify/backend/scripts/seed_test_users_link.py --clerk-sync
# 3. Tests
cd ${WS}/nicolify/backend && ${WS}/.venv/bin/pytest tests/ -q          # 23 passed
cd ${WS}/nicolify/frontend && npx tsc --noEmit && npx eslint src/ --cache && npx vitest run
cd ${WS}/nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke  # 16/16
```

## Commits (wip/nicolify)

T-1 `82baefc3` · T-2 `e1a5d803` · T-3 `d056e487` · T-4 `f29d4737` · infra T-5 `31afed48` · e2e-cleanup `6e0fa3fb` · reset-completion `51a52aaf` · docs `5ada869c`/`2b89d41b`/`d1f8e8d9`/`4dee5b3a`.

## Dependencia externa registrada

Clerk dev instance `more-leech-83` (Chris proveyó keys · `.env.dev` gitignored). Tenant demo `agencia-demo` (7f464ab7…) + `owner.demo@nicolify.com` seedeados.

## Pendiente integración

Squash-merge `wip/nicolify → main` es el gate de integración (Chris-gated, "staging deploy MANUAL"). Esta story queda `done` en wip/nicolify; el squash a main lo decide Chris.
