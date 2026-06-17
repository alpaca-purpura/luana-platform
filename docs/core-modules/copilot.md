---
package: luana-core-copilot
verdict: brand-mountable-router
version: 0.3.0
eps: [EP-4, EP-7, EP-14]
consumers: [comunify, vitalia, nicolify, lupulo]
status: active
---

# luana-core-copilot — public contract

Shared **copilot engine** (internal-audience agent — Plano 3 trabajador supervisado, zona
Infraestructura/motor-agentico del SYSTEM-MAP). A brand backend mounts the engine's `/chat`
SSE router instead of re-writing its own copilot routes.

## Contrato público — `/chat` brand-mountable (since 0.3.0)

```python
from luana_core_copilot.api.chat import router as chat_router

app.include_router(chat_router, prefix="/api/copilot")   # the brand chooses the prefix
```

- `router` is a bare `APIRouter()` — SSE streaming `/chat` → `CopilotOrchestrator` (the real engine).
- **Invariante (since 0.3.0):** importing `luana_core_copilot.api.chat` (and its transitive
  import-path: `luana_core_platform.core.{config,database,rate_limit,context}`,
  `luana_core_iam.api.dependencies`) **NEVER** instantiates the legacy "Visionarias Brain"
  `Settings` monolith nor creates the async DB engine / Redis client at import-time. A brand
  backend with **only multibrand env** (`DATABASE_URL` + `LITELLM_*`) mounts it without the
  legacy `POSTGRES_*` / `WHATSAPP_*` / `QDRANT_URL` / `TRAEFIK_NETWORK` vars.
- Env validation + engine/redis construction are deferred to first call (each deployable
  validates its own env). Auth: `/chat` returns 401 without auth, 200 SSE stream with valid auth.

This **eliminates the per-brand duplication** of copilot routes (brands used to hand-write their
own copilot routes to dodge the eager legacy `Settings`). One engine, one mount — `anti-duplication.md`.

## Dependency

- `luana-core-platform >= 0.5.0` — provides `get_settings()` (lazy `@lru_cache`) + the lazy
  `get_engine()` / `get_async_engine()` / `get_redis_client()` accessors that make the import-path
  import-safe. See `docs/core-modules/` platform notes + that package's CHANGELOG.

## Extension points

- **EP-4 / EP-7 / EP-14** — copilot brand extensions (tools, workflows, channels) registered via
  the Extension SDK. A brand extends `{brand}/backend/src/modules/{brand}/copilot/` (never mirrors
  the engine; engine edits go via `/pm-luana` promotion gate).

## Brands consumidoras

| Brand | `/chat` mount | Estado |
|---|---|---|
| comunify | re-mount limpio (quita el guard try/except) | desbloqueado post-fix (story comunify-shell-organism T-agentic v2) |
| vitalia | sidebar Valeria → motor real | opt-in (hoy MOCK; cleanup de rutas copilot propias = posterior) |
| nicolify | sidebar Luana → motor real | opt-in (hoy MOCK) |
| lupulo | — | al activarse (placeholder) |

## Promotion history

- `2026-06-16-copilot-chat-brand-mountable` (approach C, ratified Chris · accepted) — lazy
  `get_settings()` import-path migration so the `/chat` router is brand-mountable with multibrand
  env. Story `copilot-chat-mountable` (platform, technical-story). T-4 (retirar shim, end-state
  sin global) deferido a story follow-up.

## Drill-down

- Router: `core/luana-core-copilot/src/luana_core_copilot/api/chat.py`
- Lazy settings (dep): `core/luana-core-platform/src/luana_core_platform/core/{config,database}.py`
- Tests: `core/luana-core-copilot/tests/test_chat_import_multibrand_env.py` (driver subprocess) +
  `core/luana-core-platform/tests/test_lazy_settings_no_eager.py`
- CHANGELOG: `core/luana-core-copilot/CHANGELOG.md` (0.3.0)
