# T-iam-be result — comunify engine-IAM foundation

**Story:** comunify-shell-organism  
**Ticket:** T-iam-be  
**State:** tests-passing  
**Date:** 2026-06-17

## Deliverables created / edited

| File | Type | Notes |
|---|---|---|
| `comunify/backend/alembic/versions/003_comunify_engine_iam_tables.py` | NEW | Migration: tenants + users + user_tenants (IF NOT EXISTS, raw SQL). `revision=003_comunify_engine_iam`, `down_revision=002_comunify`. No PHI columns. |
| `comunify/backend/src/main.py` | EDITED | Added `from luana_core_iam.api.routers import auth_router as iam_users` + `app.include_router(iam_users.router, prefix="/api/v1/iam/users", tags=["IAM - Users"])` after offer_router mount. |
| `comunify/backend/scripts/seed_test_users_link.py` | NEW | Seed: 1 creator-economy tenant + 1 user (hola@alpacapurpura.lat) + 1 user_tenants link. Idempotent ON CONFLICT. Supports DB-only + --clerk-sync modes. Strip PHI/clinic_branches/VITALIA_PHI_KEK. |
| `comunify/backend/tests/modules/comunify/iam/__init__.py` | NEW | Empty (test package). |
| `comunify/backend/tests/modules/comunify/iam/conftest.py` | NEW | 30+ env defaults via `os.environ.setdefault()` before Settings triggers (mirrors copilot pattern). |
| `comunify/backend/tests/modules/comunify/iam/test_iam_mount.py` | NEW | TDD mount test: asserts `/api/v1/iam/users/me/tenants` registered + returns 401/403 (not 404) without auth. |

## G5 gate results

| Gate | Command | Result |
|---|---|---|
| G1 ruff check | `ruff check src/ tests/ scripts/seed_test_users_link.py` | PASS — 0 errors |
| G2 ruff format | `ruff format --check` all files | PASS — 0 files to reformat |
| G3 pytest architecture | `pytest tests/architecture/ -q` | PASS — 144 passed |
| G4 alembic upgrade head (1st) | `alembic upgrade head` in container | PASS — `002_comunify -> 003_comunify_engine_iam` applied |
| G5 alembic upgrade head (2nd) | re-run in container | PASS — no-op (idempotent) |
| IAM mount tests | `pytest tests/modules/comunify/iam/` | PASS — 2 passed |

## Migration verify output

```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade 002_comunify -> 003_comunify_engine_iam
```

Tables present in comunify_dev after migration:
- `public.tenants`
- `public.users`
- `public.user_tenants`

2nd run output (idempotency):
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
```
(no migration line = already at head, no-op confirmed)

## Seeded IDs (printed by seed script)

Deterministic UUIDs (uuid5 namespace `6ba7b810-9dad-11d1-80b4-00c04fd430c8`):

```
TENANT_COMUNIFY_DEMO = uuid5(NAMESPACE, "comunify-demo-creator")
DEMO_USER_ID         = uuid5(NAMESPACE, "user:hola@alpacapurpura.lat")
clerk_id             = PLACEHOLDER_FILL_WITH_REAL_CLERK_ID
```

To resolve `clerk_id` to real value, run from workspace root:

```bash
CLERK_SECRET_KEY=sk_test_... \
POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=5435 POSTGRES_DB=comunify_dev \
POSTGRES_USER=postgres POSTGRES_PASSWORD=password \
.venv/bin/python comunify/backend/scripts/seed_test_users_link.py --clerk-sync
```

## TDD order

1. RED: `test_iam_tenants_without_auth_returns_401_not_404` failed (1 FAILED) before router mount — confirmed.
2. GREEN: after `app.include_router(iam_users.router, ...)` + conftest.py → 2 passed.

## Skills consulted

- `backend-expert` (anti-patterns FastAPI, SQLA 2.0, tenant isolation, migration idempotency)
- `.claude/rules/backend-migrations.md` (raw SQL IF NOT EXISTS, never `op.create_table()`)
- `.claude/rules/backend-ddd.md` (schema-mirror exception for engine IAM tables)
- `.claude/rules/tenant-isolation.md`
- `.claude/rules/anti-duplication.md` (REUSE engine router, no local `/me` stub)

## Cross-module reads (read-only)

- `vitalia/backend/alembic/versions/022_vitalia_add_engine_iam_tables.py` — source migration pattern
- `vitalia/backend/src/main.py` — IAM router mount pattern
- `vitalia/backend/scripts/seed_test_users_link.py` — seed script pattern + `_clerk_request` verbatim
- `core/luana-core-iam/src/luana_core_iam/infrastructure/models/*.py` — ORM schema cross-reference
- `core/luana-core-iam/src/luana_core_iam/api/routers/auth_router.py` — confirms `/me/tenants` endpoint

## Next: orchestrator action

Run `--clerk-sync` seed to populate real `clerk_id` for `hola@alpacapurpura.lat`, then live-verify `GET /api/v1/iam/users/me/tenants` with Clerk token returns tenant list (unblocks FE shell login→tenant resolution).
