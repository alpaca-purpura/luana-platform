# 03-arch-agentic — comunify-shell-organism (AGENTIC surface)

> Surface-specific slice. SSoT consolidado: `03-arch.md` (§ 0 mapping, § 4 routes, § 8 agentic, § Prior art audit).
> Owner: **`builder-agentic` (flagship · R23 HARD)** · Auditor: **`auditor-agentic` (flagship)**.

## Scope (alcance MÍNIMO — thin mount, cero engine build)

comunify es el **PRIMER** brand en cablear el sidebar Luana al engine copilot `/chat`. Se CONSUME el engine (cero edición de `core/luana-core-*`).

### Qué construye builder-agentic (3 cosas + 1 verificación)

1. **`comunify/backend/src/modules/comunify/copilot/api/__init__.py`** (NEW) — reexport thin:
   ```python
   from luana_core_copilot.api.chat import router as _engine_chat_router
   copilot_router = _engine_chat_router
   ```
2. **`comunify/backend/src/main.py`** (EDIT):
   ```python
   from src.modules.comunify.copilot.api import copilot_router
   app.include_router(copilot_router, prefix="/api/v1/comunify/copilot", tags=["copilot"])
   ```
3. **`comunify/backend/pyproject.toml`** (EDIT) — añadir deps editable workspace: `luana-core-copilot`, `luana-core-iam`, `luana-core-platform` (hoy comunify solo declara fastapi/sqlalchemy/etc.).
4. **Verificación (NO build):** el módulo `comunify/.../copilot/` NO tiene `tools/` de dominio (CONFIRMADO: solo `extractors/ kb/ workflows/`) → Luana conversa+anuncia, **no ejecuta** (RN-3 por construcción). NO añadir tools.

## Engine contract consumido (NO redefinir)

- **Endpoint:** `POST /chat` del engine → reexpuesto en `/api/v1/comunify/copilot/chat`.
- **Auth (del engine):** `Depends(get_current_user)` (HTTPBearer / Clerk JWT) + `Depends(get_tenant_context)` (`X-Tenant-ID`) + `Depends(get_db)` (sync Session). **El engine resuelve el tenant del JWT y valida contra X-Tenant-ID → tenant isolation + adversarial-tenant los enforce el engine** (RN-2 + SC-adversarial-tenant).
- **Request DTO:** `luana_core_copilot.api.dto.CopilotChatRequest` (`message ≤4000`, `conversation_id?`, `blocks?`, `context`).
- **Response:** `StreamingResponse` SSE (`text/event-stream`). Eventos: `status` · `message_start` · `block_start/delta/end` · `block_append` · `tool_start/result` · `message_end` · `done` · `error`.
- **Rate limit:** ya aplicado por el engine (`copilot-chat` 30 msg/min/user).

## Observability (lo emite el engine — anti-dup §0 copilot-expert)

- `copilot_trace_event` (best-effort, PII sanitizada) — **el DoD #37 write** (SC-chat-ok: fila scoped al tenant).
- `copilot_llm_call` (tokens + cache + cost) — ya lo escribe el engine.
- ❌ NO crear archivos en `comunify/.../copilot/observability/` ni `recording/`. NO mirror `turn_envelope`/`callback_handler`.

## Agentic eval (THIN)

- Sin specialist nuevo ni prompt modificado → **NO se piden ≥3 goldens de comportamiento.** El gate `agentic_eval` se reduce a:
  - `agentic-trace-scoped` — tras un turno, ≥1 fila `copilot_trace_event WHERE tenant_id=:tid`.
  - `agentic-no-domain-write` — tras un turno de delegación (SC-chat-delegate), **cero filas nuevas** en tablas de dominio (offer/cohort/community) → prueba RN-3 (sin tools de dominio).

## Tests (TDD RED-first)

- `tests/modules/comunify/copilot/test_chat_mount.py` — mount responde en `/api/v1/comunify/copilot/chat` (200 SSE con auth válida; 401 sin tenant/JWT). RED primero.
- Engine suite NO se corre acá (vive en `core/luana-core-copilot`).

## NEVER-TOUCH
- `core/luana-core-copilot/src/**` (engine — consume, no editar; cambio = `/pm-luana` lift).
- `comunify/.../copilot/{extractors,kb,workflows}/` (existentes — no se modifican; solo se añade `api/`).
- `comunify/.../sales_agent/` (N/A — esta story no toca sales).
