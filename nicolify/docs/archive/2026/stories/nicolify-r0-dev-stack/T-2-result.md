# T-2 Result — BE alembic shallow baseline + env.py DATABASE_URL + seed_test_users_link.py

**Story:** nicolify-r0-dev-stack
**Ticket:** T-2
**Builder:** builder-backend (Sonnet)
**Brand:** nicolify
**Date:** 2026-05-30

---

## Summary

Implemented T-2 scope:

1. **DELETED** `nicolify/backend/alembic/versions/001_initial_snapshot.py` — legacy visionarias snapshot (115 tablas). AD-3 ratificado.
2. **CREATED** `nicolify/backend/alembic/versions/001_nicolify_iam_baseline.py` — baseline limpio (down_revision=None). Crea `tenants`/`users`/`user_tenants` idempotentes (IF NOT EXISTS). Schema-mirror exception per backend-ddd.md. DDL clonado de `vitalia/backend/alembic/versions/022_vitalia_add_engine_iam_tables.py`.
3. **MODIFIED** `nicolify/backend/alembic/env.py` — DATABASE_URL priority (asyncpg→psycopg sync strip) + POSTGRES_* fallback. `target_metadata = None` (idempotente sin modelos).
4. **CREATED** `nicolify/backend/scripts/seed_test_users_link.py` — port re-temizado de vitalia. 1 tenant "Agencia Demo" (slug=agencia-demo, PEN, PE) + 1 user owner.demo@nicolify.com (role=owner) + user_tenants(owner). uuid5 determinístico. Idempotente (ON CONFLICT). `--clerk-sync` flag. SIN clinic branch. NO Clerk Organizations.
5. **CREATED** `nicolify/backend/tests/modules/nicolify/test_tenant_isolation.py` — 3 tests (401 sin JWT, 403 cross-tenant via engine get_current_user directo, estático anti-reimplementación).
6. **MODIFIED** `nicolify/backend/pyproject.toml` — added PLR0911 ignore para scripts + INP001 ignore para alembic/*.py root.

---

## Validators GREEN

| Validator | CMD | Status |
|---|---|---|
| V-AV-3 | `pytest tests/architecture/test_migrations_idempotent.py -q` | ✅ 4 passed |
| V-AV-4 | `pytest tests/architecture/test_no_secret_leak.py -q` | ✅ 3 passed |
| V-FN-2 | `pytest tests/modules/nicolify/test_tenant_isolation.py -q` | ✅ 3 passed |
| V-FN-4 | requires docker (Postgres :5435) — SKIP if docker down | SKIP/pending INFRA |
| V-FN-5 | requires docker (Postgres :5435) — SKIP if docker down | SKIP/pending INFRA |
| ruff check (T-2 files) | `ruff check alembic/ scripts/seed_test_users_link.py` | ✅ All checks passed |
| ruff format (T-2 files) | `ruff format --check alembic/ scripts/seed_test_users_link.py` | ✅ All formatted |

**Pre-existing lint debt (NOT T-2 scope):**
- `tests/architecture/test_campaign_task_idx_workers.py` — SIM117 (pre-existing)
- `tests/integration/test_telegram_flow.py` — 3 warnings (pre-existing)
- 6 files need `ruff format` (pre-existing) — not in T-2 touched files

These are in legacy files from prior commits. T-2 scope is clean.

---

## Skills Consulted

| Skill | Por qué invocada | Decisión |
|---|---|---|
| `backend-expert` | T-2 scope: alembic migrations + seed script + architecture tests | Idempotent raw SQL (`op.execute` + `IF NOT EXISTS`). NUNCA `op.create_table()`. Schema-mirror exception documented. |
| `.claude/rules/backend-migrations.md` | Alembic migration idempotency rules | Raw SQL `IF NOT EXISTS` en TODO DDL. No `sa.Enum(create_type=True)`. `target_metadata = None`. |
| `.claude/rules/tenant-isolation.md` | test_tenant_isolation.py — mecanismo 403 cross-tenant | Engine `get_current_user` query `user_tenants` → None → HTTPException 403. Tests validan via engine dependency directo (no reimplementación brand-local). |
| `.claude/rules/anti-duplication.md` | Verificar que DDL no mirrorea fuera de exception permitida | Schema-mirror exception es la excepción canónica (backend-ddd.md § "Schema-mirror exception"). Reference: `docs/promotion-protocol/proposals/2026-05-19-vitalia-adopt-luana-core-iam.md` (state: accepted). |
| `.claude/rules/tdd-mandatory.md` | TDD RED→GREEN order | Tests RED verificados PRIMERO (migration test → FAIL antes de crear baseline), luego implementación → GREEN. Tenant isolation test: engine invocado directamente. |
| `brand-expert` (invocado para verificar scope) | NOT APPLICABLE — T-2 es puro infraestructura (platform/iam, no módulos de negocio brand). | N/A: ningún módulo brand tocado. |
| `offer-expert` (invocado para verificar scope) | NOT APPLICABLE — T-2 es alembic + seed, sin offer catalogs. | N/A |
| `offer-type-preset-expert` (invocado para verificar scope) | NOT APPLICABLE | N/A |
| `metrics-expert` (invocado para verificar scope) | NOT APPLICABLE — T-2 no toca analytics. | N/A |

---

## Architecture Decisions Applied

- **AD-3:** `001_initial_snapshot.py` borrado. `001_nicolify_iam_baseline.py` (down_revision=None) creado como baseline limpio. CERO tablas `nicolify_*`.
- **AD-4:** `env.py` — DATABASE_URL prioridad sobre POSTGRES_*. `asyncpg://` → `postgresql://` strip para alembic sync.
- **Schema-mirror exception (backend-ddd.md):** Las 3 tablas IAM engine son mirror permitido. promotion proposal referenciado (vitalia 2026-05-19, state: accepted).
- **Anti-duplication (anti-duplication.md):** Seed portado re-temizado de vitalia (no mirror — 1 tenant agencia-demo vs 3 clínicas vitalia). NO Clerk Organizations. Sin clinic branch. uuid5 NAMESPACE igual (convención RFC 4122).

---

## Files Changed

```
nicolify/backend/alembic/env.py                                [MODIFIED] DATABASE_URL priority
nicolify/backend/alembic/versions/001_initial_snapshot.py      [DELETED]  legacy visionarias 115 tablas
nicolify/backend/alembic/versions/001_nicolify_iam_baseline.py [NEW]      mirror engine IAM tables
nicolify/backend/scripts/seed_test_users_link.py               [NEW]      port re-temizado vitalia
nicolify/backend/tests/modules/nicolify/test_tenant_isolation.py [NEW]    V-FN-2 + V-AV-6
nicolify/backend/pyproject.toml                                [MODIFIED]  ruff per-file-ignores
```

---

## E2E_TENANT_ID (for .env.dev.template)

```
E2E_TENANT_ID = uuid5(NAMESPACE, "agencia-demo")
             = <computed at runtime by seed_test_users_link.py>
```

The seed script prints this on every run. To get the value without running seed:
```python
import uuid
NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
print(uuid.uuid5(NAMESPACE, "agencia-demo"))
```

---

## Dependencies External (pre-conditions not met yet)

- **Clerk dev instance nicolify** — NOT YET created. Requires Chris (per 03-arch.md § Open Questions Q2).
  - V-FN-4 (migration idempotency via docker) — requires docker dev stack.
  - V-FN-5 (seed idempotent via docker) — requires docker dev stack + Postgres :5435.
  - `--clerk-sync` flag — requires `CLERK_SECRET_KEY` from the dev instance.
- These are documented per-ticket; blocked validators are INFRA-gated, not code errors.

---

## Cross-module reads (read-only)

- `vitalia/backend/alembic/versions/022_vitalia_add_engine_iam_tables.py` — DDL reference (NOT edited)
- `vitalia/backend/scripts/seed_test_users_link.py` — seed pattern reference (NOT edited)
- `core/luana-core-iam/src/luana_core_iam/api/dependencies.py` — 403 mechanism (NOT edited)

---

## Commit SHA

`e1a5d803` — `feat(nicolify): T-2 alembic shallow baseline + env.py DATABASE_URL + seed agencia-demo`
Branch: `wip/nicolify` → pushed to `origin/wip/nicolify`
