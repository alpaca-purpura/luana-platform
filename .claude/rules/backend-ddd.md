---
globs: "core/luana-core-*/src/**/*.py,**/backend/src/**/*.py"
description: Backend DDD (engine + per-brand)
---

# Backend DDD

## Layers (Inside-Out)
`domain` → `infrastructure` → `application` → `api`. Domain pure (no framework). Infrastructure implementa interfaces domain. Application = services/use cases. API = FastAPI routes + Pydantic DTOs (thin).

Aplica al engine (`core/luana-core-*/src/luana_core_*/`) y a cada brand (`{brand}/backend/src/modules/{brand}/...`).

## Constraints
- Every query filter `tenant_id` (incluye `get_by_id`).
- Soft deletes only (`deleted_at`).
- SQLA 2.0 `select(Model).where(...)` (no `session.query()`).
- New code `AsyncSession`. Legacy `Session` migrate incrementally.
- `structlog`, no `print`/`logging`.
- Pydantic v2 `model_config = ConfigDict(...)` (no inner `class Config`).

## FastAPI app
`FastAPI(redirect_slashes=False)` mandatory en `{brand}/backend/src/main.py` (default `True` → 307 POST → Next.js drops body). Arch test enforces per brand. NUNCA en `APIRouter` individual.

## Cross-module / cross-brand imports
- Cross-module dentro del mismo brand: default forbidden. Excepción: `copilot` (infra-like). Otros: port/interface en `core/luana-core-platform/src/luana_core_platform/links/` o domain event vía `core/luana-core-events/`.
- Cross-brand import absolutely forbidden — un brand NUNCA importa de otro brand. Compartir via engine package + Extension SDK.

## Extraction orchestrators
Wave-based LLM extraction (brand/offer/buyer_persona/landing) MUST subclass `luana_core_extraction.base_orchestrator.BaseExtractionOrchestrator` (engine package `core/luana-core-extraction/`). Subclass: wave composition + `_merge_and_save` + `run()`. Arch gate `test_extraction_orchestrator_inheritance.py` (corre en cada brand).

## Schema-mirror exception (origen R5 process-improvement 2026-05-05)

`builder-backend` MAY touch `{brand}/backend/src/modules/{brand}/copilot/persistence/models/` AND
`{brand}/backend/src/modules/{brand}/sales_agent/persistence/models/` SOLO para schema mirror desde
engine migration (`core/luana-core-observability/`, `core/luana-core-copilot/`, etc.). Cero juicio caso-a-caso auditor.

**Contexto:** business engine packages (`core/luana-core-observability/src/luana_core_observability/persistence/`)
introducen tabla → SQLAlchemy model class debe vivir en módulo consumer per-brand
(`{brand}/backend/src/modules/{brand}/{copilot,sales_agent}/persistence/models/`) para mantener domain ownership por brand. Builder-backend
genera/modifica esos archivos para reflejar DDL nuevo SIN tocar `domain/`, `application/`, ni `api/`
del módulo agentic per-brand.

**Permitido bajo esta exception:**
- Add/modify SQLAlchemy `Mapped[]` columns matching engine migration DDL
- Add/modify table indexes matching engine migration
- Add/modify foreign keys hacia tablas creadas por engine migration
- Mark deprecated columns con `# DEPRECATED:` comment

**NO permitido bajo esta exception:**
- Tocar `{brand}/backend/src/modules/{brand}/{copilot,sales_agent}/{domain,application,api,observability}/` — sigue jurisdicción `builder-agentic`
- Cambiar comportamiento runtime del módulo agentic per-brand (sólo schema)
- Crear nueva tabla SOLO en módulo agentic per-brand (debe nacer en engine `core/luana-core-*/` con consumer mirror per brand, no al revés)
- Modificar `personality_profiles.system_instruction` o cualquier otro field semantic-load del módulo

**Audit:** auditor-backend debe APPROVE estos cambios sin escalate.
Auditor-agentic NO audita schema mirror (es business migration ripple,
no agentic logic). Si schema change introduce regression cross-surface
→ R3 downstream regression scope captura.

**Caso origen:** PI-12 S1 T-1 (cost_recorder canonicalization). Builder
necesitaba mirror nuevas columnas `cost_usd`, `cache_read_tokens`,
`provider_canonical` en `modules/{copilot,sales_agent}/persistence/models/copilot_llm_call.py` (era single-brand; post-reorg vive en cada `{brand}/backend/src/modules/{brand}/copilot/persistence/models/`). Auditor inicialmente flagged "out-of-scope" — Chris
ratificó exception. Codificada aquí para evitar re-litigation.

## Multibrand awareness (post reorg 2026-05-15)

- Engine packages: `core/luana-core-*/src/luana_core_*/` — DDD interno aplica + contracts Extension SDK pública.
- Brand backends: `{brand}/backend/src/modules/{brand}/...` — DDD interno aplica + opcional registro Extension SDK.
- Compartir lógica entre brands → lift a engine vía `/pm-luana` promotion gate (NUNCA cross-brand import).
