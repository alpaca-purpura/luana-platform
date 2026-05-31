# T-5-result.md — INFRA verify (make dev-nicolify verde)

> Ejecutado por el orchestrator (`/dev-team`) directamente durante la fase de build, no por un builder spawn — el trabajo fue debugging de infra en vivo (levantar el stack real + diagnosticar crash-loops).

## Estado: DONE — stack dev nicolify verde end-to-end

### Verificación live (todo ✓)

| Check | Resultado |
|---|---|
| `make dev-nicolify` levanta BE+FE | ✓ contenedores running/healthy |
| `curl :8001/health` | ✓ 200 `{"status":"ok","brand":"nicolify","version":"0.1.0"}` |
| `curl :8001/api/health` | ✓ 200 |
| FE `:3001` `/sign-in` | ✓ 200 (Clerk publishable key cargada) |
| anon `GET /` | ✓ 307 → `/sign-in?redirect_url=...` (Scenario 2) |
| `GET /api/v1/iam/users/me` sin JWT | ✓ 401 (Scenario 2) |
| `alembic upgrade head` | ✓ baseline `001_nicolify` (tenants/users/user_tenants) |
| `alembic upgrade head` ×2 | ✓ no-op limpio (Scenario 3 idempotencia) |
| DB `nicolify_dev` | ✓ creada en postgres compartido :5435 |
| seed `--clerk-sync` | ✓ tenant agencia-demo (PEN/PE) + owner.demo@nicolify.com (DB + Clerk user_3EQj6n…) + user_tenants(owner) |
| Playwright smoke `--project=smoke` | ✓ 16/16 PASS (Scenarios 2,5,6,7) |
| BE tests nuevos (T-1+T-2) | ✓ 23/23 PASS (aislados) |

### Gaps de infra del skeleton corregidos (commit 31afed48)

El scaffold 2026-05-15 dejó el backend sin poder arrancar. Fixes (paridad con vitalia):
1. `nicolify/pyproject.toml` — deps runtime+engine reales (eran `[]`) + name `luana-nicolify`.
2. `nicolify/backend/pyproject.toml` — `[project]` stub (uv run lo exige).
3. `nicolify/backend/Dockerfile` — `COPY nicolify/pyproject.toml` + `uv sync --package luana-nicolify` (no copiaba el member → venv sin uvicorn/alembic).
4. `nicolify/docker-compose.dev.yml` — `UV_PROJECT_ENVIRONMENT` + comando con binarios del venv root directos (uv run podaba uvicorn) + alembic upgrade en boot.
5. `.env.dev.template` — POSTGRES_* + QDRANT_URL + WHATSAPP_* + API_URL + LOG_LEVEL + DOMAIN_NAME + TRAEFIK_NETWORK + API_SECRET_KEY + bloque E2E_* (Settings failfast).
6. `nicolify/.env.dev` (gitignored) — keys Clerk reales (instancia more-leech-83) + E2E block.

### Clerk dev instance (Chris proveyó)

- Instancia: `more-leech-83.clerk.accounts.dev`. Keys reales en `.env.dev`. Verificado API 200.
- Usuario de prueba creado autónomamente vía seed `--clerk-sync`.

## ⚠️ BLOQUEANTE para "suite completa verde" — decisión de scope para Chris

El reset (be4deb44) reseteó `src/` a esqueleto pero **dejó intacto el resto del monolito legacy**:
- **243 archivos de test legacy** (`tests/{admin,agentic_evals,architecture,modules/nicolify_advertising,scheduling,quality,shared,integration,...}`) que importan `src.modules.nicolify.*` (advertising/scheduling/copilot/sales_agent/brand/offer…) que **ya no existen** → la suite completa NO colecciona.
- **42 scripts legacy** (`scripts/seed_offers_visionarias`, `refresh_meta_metrics`, etc.) importando engine modules.

Ya removidos en esta story (misma clase de cruft): snapshot alembic (115 tablas), e2e frontend (105 archivos).

Los tests PROPIOS del dev-stack pasan (23/23). Pero `pytest tests/` falla en colección por el cruft legacy. El auditor (gate-runner test-nicolify) chocaría con esto.

**Decisión requerida (ver chris-input.md):** ¿completar el reset borrando los 285 archivos legacy ahora (consistente con "reseteado a esqueleto" + ya preservado en branch `legacy/nicolify-original`), o diferir a una story dedicada de cleanup? El vertical slice del dev-stack ya está verde — esto es independencia de la suite.
