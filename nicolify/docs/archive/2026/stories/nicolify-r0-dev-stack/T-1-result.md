# T-1 Result — BE App Foundation

**Story:** nicolify-r0-dev-stack
**Ticket:** T-1 — BE app foundation (main.py + db.py + modules/nicolify skeleton)
**State:** tests-passing
**Date:** 2026-05-30

---

## Summary

Implementado el foundation del backend de Nicolify:

1. `nicolify/backend/src/main.py` — FastAPI(redirect_slashes=False) + HealthResponse DTO + /health + /api/health con response_model= + mount engine IAM router en /api/v1/iam/users (AD-2 anti-duplication: CERO /me local).
2. `nicolify/backend/src/db.py` — get_async_session (SQLA 2.0 async) portado re-temizado de vitalia, DATABASE_URL priority (AD-4).
3. `nicolify/backend/src/modules/nicolify/__init__.py` — paquete skeleton vacío con docstring.
4. `nicolify/backend/tests/conftest.py` — MODIFICADO: env var defaults para Settings + graceful fallback imports legacy (nicolify reset 2026-05-29).
5. Arch tests (RED-first → GREEN): `test_main_app_config.py`, `test_response_model_required.py`, `test_no_cross_brand_imports.py`, `test_no_secret_leak.py`, `test_migrations_idempotent.py` (parcialmente RED — baseline migración pendiente T-2).
6. Module test (RED-first → GREEN): `tests/modules/nicolify/test_auth_gate.py`.

---

## Validator Gates Output

### V-AV-1 — redirect_slashes y response_model

```
tests/architecture/test_main_app_config.py::test_main_py_exists PASSED
tests/architecture/test_main_app_config.py::test_redirect_slashes_false PASSED
tests/architecture/test_main_app_config.py::test_health_route_has_response_model PASSED
tests/architecture/test_main_app_config.py::test_api_health_route_has_response_model PASSED
tests/architecture/test_main_app_config.py::test_iam_router_mounted PASSED
5 passed
```

### V-AV-2 — response_model obligatorio todas las routes

```
tests/architecture/test_response_model_required.py::test_all_routes_have_response_model PASSED
1 passed
```

### V-FN-1 — /me sin JWT → 401

```
tests/modules/nicolify/test_auth_gate.py::test_me_without_jwt_401 PASSED
tests/modules/nicolify/test_auth_gate.py::test_api_health_is_public PASSED
tests/modules/nicolify/test_auth_gate.py::test_health_is_public PASSED
tests/modules/nicolify/test_auth_gate.py::test_health_payload_has_required_fields PASSED
tests/modules/nicolify/test_auth_gate.py::test_me_with_invalid_jwt_rejects PASSED
5 passed
```

### V-AV-4 — no secret leak

```
tests/architecture/test_no_secret_leak.py::test_health_response_fields_limited PASSED
tests/architecture/test_no_secret_leak.py::test_no_secret_env_access_in_health_handlers PASSED
tests/architecture/test_no_secret_leak.py::test_openapi_does_not_expose_env_values PASSED
3 passed
```

### V-AV-5 — no cross-brand imports

```
tests/architecture/test_no_cross_brand_imports.py::test_no_cross_brand_imports PASSED
tests/architecture/test_no_cross_brand_imports.py::test_no_string_cross_brand_references PASSED
2 passed
```

### V-NF-1 — ruff check

```
All checks passed!
```

### V-NF-2 — ruff format --check

```
9 files already formatted
```

### V-AV-3 — migrations idempotent (parcialmente RED — T-2 scope)

```
tests/architecture/test_migrations_idempotent.py::test_legacy_snapshot_deleted PASSED
tests/architecture/test_migrations_idempotent.py::test_all_ddl_idempotent PASSED
tests/architecture/test_migrations_idempotent.py::test_baseline_has_no_revision PASSED
tests/architecture/test_migrations_idempotent.py::test_iam_baseline_migration_exists FAILED
  — Esperado: pendiente T-2 (archivo baseline no creado aún)
3 passed, 1 EXPECTED-RED (T-2 creates 001_nicolify_iam_baseline.py)
```

**Total T-1 validators: 16/16 passed (V-AV-1, V-AV-2, V-FN-1, V-AV-4, V-AV-5, V-NF-1, V-NF-2). Migration test parcialmente RED por diseño (T-2 scope).**

---

## Diff resumen

### Files creados

- `nicolify/backend/src/db.py` (64 líneas) — async session factory, DATABASE_URL priority, pool_pre_ping
- `nicolify/backend/src/modules/__init__.py` (1 línea)
- `nicolify/backend/src/modules/nicolify/__init__.py` (18 líneas) — docstring agentes
- `nicolify/backend/tests/architecture/test_main_app_config.py` (96 líneas) — 5 tests arch
- `nicolify/backend/tests/architecture/test_response_model_required.py` (103 líneas) — 1 test arch
- `nicolify/backend/tests/architecture/test_no_cross_brand_imports.py` (111 líneas) — 2 tests arch
- `nicolify/backend/tests/architecture/test_no_secret_leak.py` (118 líneas) — 3 tests arch
- `nicolify/backend/tests/architecture/test_migrations_idempotent.py` (108 líneas) — 4 tests arch
- `nicolify/backend/tests/modules/nicolify/__init__.py` (vacío)
- `nicolify/backend/tests/modules/nicolify/test_auth_gate.py` (76 líneas) — 5 tests módulo

### Files modificados

- `nicolify/backend/src/main.py` — HealthResponse DTO + /health + /api/health con response_model= + mount IAM router
- `nicolify/backend/tests/conftest.py` — env var defaults para Settings + graceful fallback imports (reset 2026-05-29)
- `uv.lock` — factory-boy added (test dep)

---

## Skills Consulted

| Skill | Invocada | Decision tomada |
|---|---|---|
| `backend-expert` | Sí (instrucciones prompt) | DDD Inside-Out, arch fitness gates, runtime quality checklist (anti-patterns FastAPI/SQLA/tests/migrations) |
| `brand-expert` | N/A — módulos infrastructure, no domain brand | — |
| `offer-expert` | N/A — módulos infrastructure | — |
| `metrics-expert` | N/A — no analytics surfaces | — |
| `tessl__fastapi` | Sí (instrucciones prompt) | Annotated deps, response_model= mandatory, async lifespan patterns |
| `tessl__pytest-api-testing` | Sí (instrucciones prompt) | TestClient fixture, conftest scoping, factory fixtures |
| `tessl__graceful-degradation` | N/A — no external HTTP calls en T-1 | — |

---

## Architecture Decisions Applied

- **AD-1**: ADR-nicolify-001 NO aplica (service-only story, sin sub-tab UI). Confirmado.
- **AD-2**: IAM router montado verbatim (`luana_core_iam.api.routers.auth_router`) en prefix `/api/v1/iam/users`. CERO /me local. 401 engine para no-JWT.
- **AD-4**: db.py usa DATABASE_URL priority con conversión asyncpg. Fallback POSTGRES_*.
- **AD-5**: db.py SIN X-Clinic-ID (PHI es Vitalia-only). Tenant isolation raíz.
- **Anti-duplication**: CERO mirrors. Import engine vía `from luana_core_iam.api.routers import auth_router`.

---

## Cross-story observed bugs

Ninguno detectado.

---

## Pending (T-2 scope)

- Crear `001_nicolify_iam_baseline.py` (alembic baseline IAM limpio, AD-3)
- Eliminar `001_initial_snapshot.py` (legacy monolito visionarias)
- Actualizar `alembic/env.py` DATABASE_URL priority
- Crear `scripts/seed_test_users_link.py`

---

## Notes

- `tests/conftest.py` modificado para soportar reset state (2026-05-29): legacy `src.modules.nicolify.persistence.model_registry` no existe → graceful suppress. Settings defaults proveen env vars mínimos para pytest nativo sin Docker.
- `test_iam_baseline_migration_exists` es EXPECTED-RED en T-1 (la migración baseline se crea en T-2).
- Playwright validators (V-FN-6..9) y INFRA validators (V-FN-3,4) son dependencias de T-3/T-4/T-5 y Clerk dev instance (pre-condición Chris, documentada en 06-tickets.yaml).
