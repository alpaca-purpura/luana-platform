# Gherkin verification matrix — nicolify/nicolify-r0-dev-stack

> Auditor Phase D · 2026-05-30 · stack verificado LIVE (BE :8001 + FE :3001)

| # | Scenario (01-spec.md) | Test path | Status |
|---|---|---|---|
| 1 | stack-up-green (happy) | live: `curl :8001/health` + `/api/health` → 200 · `alembic upgrade head` · FE :3001 200 | ✅ PASS |
| 2 | protected-route-requires-auth (negative) | `e2e/auth/protected-redirect.spec.ts` (anon `/`→307 /sign-in) + `tests/modules/nicolify/test_auth_gate.py` (`/me` no-JWT→401) | ✅ PASS |
| 3 | migration-idempotency (edge) | `tests/architecture/test_migrations_idempotent.py` + live `alembic upgrade head` ×2 no-op | ✅ PASS |
| 4 | cross-tenant-isolation (adversarial) | `tests/modules/nicolify/test_tenant_isolation.py` (foreign X-Tenant-ID→403) + `tests/architecture/test_no_secret_leak.py` | ✅ PASS |
| 5 | auth-vertical-slice (edge/integration) | `e2e/auth/auth-slice.spec.ts` (Clerk signin → root autenticado → fetchClient X-Tenant-ID 7f464ab7 → BE /me 200) | ✅ PASS |
| 6 | smoke-green (edge/ci) | `e2e/smoke/stack.smoke.spec.ts` + `npx playwright test --project=smoke` → 16/16 live | ✅ PASS |
| 7 | fe-network-failure (edge) | `e2e/auth/root-network-failure.spec.ts` (BE 500 → mensaje español TUTEO, sin white-screen) | ✅ PASS |

**Resultado: 7/7 scenarios PASS.** Sub-categorías race/concurrent declaradas N/A en 01-spec (sin create/update con unique constraint ni list multi-tenant en infra). Gate-output.json: 6/6 gates GREEN (any_fail=false).
