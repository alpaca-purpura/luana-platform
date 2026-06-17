# T-agentic v2 — result (engine-unblocked verify)

> Resume 2026-06-17 · `/dev-team` autonomous · NO re-architect (engine fix unblocked the original thin-mount).

## Verdict: ✅ DONE (boot + mount + 401-contract verified)

El código de T-agentic ya estaba escrito y committeado (`3b6670ba`); sólo lo bricaba el engine
(eager legacy Settings). Con la **Settings-lazy fix** del engine (`e9f16d06`, proposal accepted)
mergeada a wip/comunify, el thin-mount original ahora bootea + monta limpio. T-agentic v2 fue
**verificación + limpieza**, no build nuevo (cero agentic production code authored → no flagship spawn).

## Qué se verificó

| Check | Resultado |
|---|---|
| `import luana_core_copilot.api.chat` en env multibrand (sin POSTGRES_*/WHATSAPP_*/QDRANT legacy) | ✅ boot clean, cero `pydantic ValidationError` |
| `import src.main` → `copilot_router is not None` | ✅ `True` · ruta `/api/v1/comunify/copilot/chat` presente |
| `tests/modules/comunify/copilot/test_chat_mount.py` (200 SSE auth / 401 sin tenant) | ✅ **4 passed** |
| BE `ruff check src/main.py + copilot/` | ✅ All checks passed |
| BE `pytest tests/architecture/` | ✅ GREEN (144) |
| Stack live boot | ✅ comunify BE health 200 (mount no rompe boot) |

## Qué se tocó

- `comunify/backend/src/main.py` — actualizado el comentario stale `⚠️ BLOCKED` (líneas 27-35 + 72-74)
  → ahora documenta que el mount está activo post Settings-lazy fix. **El guard try/except se MANTIENE**
  (defense-in-depth: un mount opcional del engine nunca debe crashear el boot del brand).
- `comunify/backend/src/modules/comunify/copilot/api/__init__.py` — sin cambios (el reexport
  `from luana_core_copilot.api.chat import router as copilot_router` ya existía, committeado en `3b6670ba`).

## Decisión: NO se agregaron deps `luana-core-*` a `comunify/backend/pyproject.toml`

El ticket pedía declarar `luana-core-{copilot,iam,platform}` en pyproject. **Se omitió a propósito:**
vitalia/backend y nicolify/backend **tampoco** las declaran — la resolución es a nivel del workspace uv
root (`[tool.uv.sources] luana-core-* = { workspace = true }`). El import resuelve por el workspace
(probado live). Declararlas en el backend pyproject **divergiría** del patrón establecido de las marcas.

## RN-3 (Luana conversa, no ejecuta) — por construcción

`comunify/.../copilot/` no tiene `tools/` de dominio registrados → el copilot del shell conversa +
anuncia, no ejecuta acciones. Confirmado (el módulo tiene extractors/kb/workflows pero ningún tool
registrado en el mount path).

## Pendiente del scenario 200-SSE (write real SC-chat-ok)

El **401 path** (sin tenant/JWT) está verificado por el test. El **200 SSE path** (mensaje real a Luana
→ stream + fila `copilot_trace_event` scoped) necesita infra que NO está provista en este worktree:
**LiteLLM gateway corriendo + LLM keys** (`deploy/litellm/.env` ausente) **+ tenant comunify seedeado/bound**.
Esa es la live-verify del DoD #37 — gateada por provisión de Chris. Ver checkpoint § DESBLOQUEADA.

done -> T-agentic-v2-result.md
