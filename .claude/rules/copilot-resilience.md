---
globs: "core/luana-core-copilot/src/**/*.py,**/backend/src/modules/*/copilot/**/*.py"
description: Stub — invoca copilot-expert skill
---

# Copilot Resilience

Copilot es un módulo **ENGINE + BRAND-EXTENSION** (ver CLAUDE.md tabla mapping):

| Surface | Path | Owner |
|---|---|---|
| Engine runtime (read-only, requiere lift gate) | `core/luana-core-copilot/src/luana_core_copilot/` | `/pm-luana` promotion gate |
| Brand extensions (extractors, tools, workflows, kb) | `{brand}/backend/src/modules/{brand}/copilot/{extractors,tools,workflows,kb}/` | `/pm-{brand}` |

Detalle (field discovery, module/route registration, debug via trazas, subagentes deepagents `task`) en `copilot-expert` skill → `references/copilot-resilience.md`.

Trigger: tocas `core/luana-core-copilot/**` o `{brand}/backend/src/modules/{brand}/copilot/**` o user reporta bug copilot. Invoca skill antes coding.

**No-skip rule:** diagnóstico copilot SIEMPRE empieza con query a `copilot_trace_event` (tabla vive en engine). Sin trace = bug observabilidad, fix recorder primero (en engine).

## Multibrand awareness (post reorg 2026-05-15)

- Modificar engine `core/luana-core-copilot/` → afecta a todas las brands activas (nicolify, vitalia, comunify, lupulo). Requiere `/pm-luana` promotion proposal (ver `docs/promotion-protocol/README.md`).
- Extensión brand: `{brand}/backend/src/modules/{brand}/copilot/extensions.py` registra via Extension SDK EP-1..EP-18.
- Cross-brand mirror prohibido (ver `anti-duplication.md`) — si dos brands replican extractor/tool/workflow → lift a engine.
