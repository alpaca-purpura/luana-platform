---
proposal_id: 2026-06-16-copilot-chat-brand-mountable
state: accepted                # proposed | under_review | accepted | rejected | migrated
opened_date: 2026-06-16
opened_by: /pm-luana
ratified_by: Chris             # eligió dirección B (AskUserQuestion 2026-06-16)
ratified_date: 2026-06-16

# Origen (engine-fix, no lift de brand — el patrón nace de un blocker live)
origin_learnings:
  - comunify/docs/product/stories/comunify-shell-organism/checkpoint.md  # § Blocker (root cause anclado)
origin_brands: [comunify]      # 1er brand que intentó cablear el sidebar al motor copilot

# Target
target_package: core/luana-core-copilot
target_module: src/luana_core_copilot/api/chat.py  # + core/luana-core-platform/src/luana_core_platform/core/{config,rate_limit}.py (eager Settings)
target_ep: null

# Impact assessment
semver_bump: minor             # additive: nuevo router brand-mountable / Settings lazy; el path standalone del engine se preserva
breaking_change: false         # OBJETIVO: cero break del app standalone del engine + cero break de los 4 brands
brands_affected_consumers: [comunify, vitalia, nicolify, lupulo]  # todos los que quieran sidebar Luana cableado al motor
brands_at_risk_regression: [vitalia, nicolify, comunify, lupulo]  # luana_core_platform.Settings lo consume TODO → R3 obligatorio en los 4

# Lift plan
lift_estimated_effort: "1-2 days (engine refactor + downstream regression 4 brands + engine app)"
lift_owner: /dev-team (post /architect design · core worktree)
arch_test_downstream_required: true
migration_notes_required: false
---

## 1. Patrón a promover (engine FIX — no lift de brand)

El motor copilot (`core/luana-core-copilot`) expone un endpoint SSE `/chat` (`api/chat.py`) que **no es brand-mountable**: importar su `router` arrastra, vía `luana_core_platform.core.rate_limit`, la **instanciación EAGER (a import-time) del Settings monolítico legacy** `luana_core_platform.core.config.Settings` ("Visionarias Brain", pre-multibrand). Ese Settings exige `POSTGRES_HOST/PORT/USER/PASSWORD/DB`, `WHATSAPP_API_TOKEN/PHONE_NUMBER_ID/VERIFY_TOKEN`, `TRAEFIK_NETWORK`, `DOMAIN_NAME`, `API_SECRET_KEY`, `QDRANT_URL`. Los brands multibrand se configuran con `DATABASE_URL` / `QDRANT_HOST`+`PORT` / `LITELLM_*` y **no proveen** esas vars → `pydantic ValidationError` en el boot del app del brand.

**Objetivo:** que cualquier brand pueda montar el `/chat` del motor usando **su propia config multibrand**, sin arrastrar el Settings legacy a import-time.

**Origen story/incident:**
- comunify: [[comunify-shell-organism]] T-agentic — el thin-mount del `/chat` bricó el BE comunify (health 000). Lo cazó la live-verify del DoD #37 (los 312 tests nativos pasaban — verde ≠ booteable). Mitigado con un guard try/except en `comunify/backend/src/main.py` (endpoint 404, BE booteable). Root cause verbatim + logs: `comunify/docs/product/stories/comunify-shell-organism/checkpoint.md § Blocker`.

## 2. Por qué cross-brand

Cablear el sidebar (Luana/Valeria supervisora) al motor copilot real es **net-new en TODAS las marcas** (vitalia y nicolify tienen el chat-store MOCK; ninguna cableó el sidebar al `/chat`). El primer brand que lo intenta (comunify) choca con el límite del engine. Resolverlo en el engine desbloquea a las 4.

| Brand | Aplicabilidad | Razón |
|---|---|---|
| comunify | bloqueada hoy | 1er consumer del `/chat` real (shell-organism MVP) |
| vitalia | consumer próximo | sidebar Valeria hoy MOCK; querrá el motor real |
| nicolify | consumer próximo | sidebar Luana 100% MOCK |
| lupulo | futuro | hereda al activarse |

> **Patrón establecido hoy (anti-duplicación):** vitalia NO monta el `/chat` del engine — escribe sus **propias** rutas copilot (`vitalia/backend/src/modules/vitalia/copilot/api/routes/wizard_onboarding_routes.py`) usando el orquestador del engine. Eso evita el Settings legacy pero **duplica** el wiring del endpoint en cada brand. Este fix elimina la duplicación: un router del motor montable con la config del brand.

## 3. Análisis técnico

### Causa raíz (verificada)

```
brand/main.py
  → from luana_core_copilot.api.chat import router
      → chat.py importa luana_core_platform.core.rate_limit (+ .database, .context)
          → rate_limit.py instancia EAGER el Settings global (luana_core_platform.core.config.Settings)
              → BaseSettings con campos sin default (POSTGRES_*, WHATSAPP_*, TRAEFIK_NETWORK, ...)
                  → el brand no los provee → pydantic ValidationError en import → boot crash
```

### Opciones a evaluar en /architect (engine-scoped)

1. **Settings lazy** — diferir la instanciación de `luana_core_platform.core.config.Settings` (no a import-time de `rate_limit`/`config`; usar `@lru_cache get_settings()` invocado dentro de las funciones, no en el módulo). Mínimo blast-radius si se hace bien; el riesgo es que muchos módulos del engine asuman el `settings` global eager.
2. **Chat-router factory** — `create_chat_router(*, get_db, rate_limiter, ...)` que recibe sus deps por DI (la config del brand) en vez de leer el global monolítico. El brand cablea sus propias deps multibrand. Más explícito, más cambio de superficie.

`/architect` (WT5 technical-story lane) decide el approach + el contract-spec (interface + consumers + invariante + verificación-por-efecto = el `/chat` montado en un brand multibrand bootea + responde 401/200 sin la env legacy).

### Risk assessment

| Riesgo | Severidad | Mitigación |
|---|---|---|
| `luana_core_platform.Settings` lo consume el app standalone del engine + otros módulos core | **Alta** | R3 downstream: correr la suite del engine + los 4 brands; el app standalone del engine NO debe romperse (su env legacy sigue válido) |
| Settings lazy cambia orden de validación de env (fail-fast perdido) | Media | Mantener un check de arranque explícito en el app standalone; el brand valida su propia env |
| Bump minor + brand existente no opt-in | Baja | comunify es el único consumer activo; vitalia/nicolify opt-in cuando cableen su sidebar |

## 4. Lift plan

### Pre-lift checklist (lo cierra /architect + /dev-team)
- [ ] /architect produce el ready package engine-scoped (contract-spec + 03-arch + 04-validators + 06-tickets) en una **platform/technical-story**.
- [ ] Approach ratificado (lazy vs factory) — Chris ve la blast-radius del cambio a `luana_core_platform` antes de commitear core.
- [ ] Tests engine + R3 downstream (4 brands + app standalone del engine).
- [ ] `docs/core-modules/luana-core-copilot.md` documenta el contract del router brand-mountable.

### Lift execution
- **Worktree core efímero** (`wip/core-copilot-mountable`) por parallel-safety (no editar core desde el hub de comunify).
- Engine change (Settings lazy / factory) + bump `core/luana-core-copilot` (+ `core/luana-core-platform` si toca) minor + CHANGELOG.
- R3 arch test downstream en los 4 brands + el app standalone del engine.

### Post-lift
- comunify: T-agentic **v2** — re-mount limpio del router brand-mountable (quita el guard) → desbloquea `comunify-shell-organism` → T-e2e + DoD #37 + auditor + merge.
- vitalia/nicolify: opt-in al cablear su sidebar (reemplazan su MOCK por el chat-store real, ver lift candidate `chat-store` de comunify).

## 5. Decisión

**Recomendación `/pm-luana`:** **APPROVED** (dirección B). Es la deuda real del engine; resolverla desbloquea a todas las marcas y elimina la duplicación per-brand del wiring del endpoint. La opción C (proveer env legacy a cada brand) se **rechaza** (acopla los brands al config "Visionarias Brain", anti-multibrand). La opción A (re-architect per-brand al patrón vitalia) resuelve comunify pero deja la deuda viva (cada brand re-duplica) — por eso Chris eligió B.

**Ratificación Chris:** ✅ **dirección B ratificada** (2026-06-16, AskUserQuestion). El **approach técnico concreto** (lazy vs factory) + el **semver** quedan pendientes de la design de `/architect` y una ratificación final antes de commitear código a `core/`.

## 6. Bitácora
- 2026-06-16: opened by /pm-luana (engine-fix desde blocker live comunify-shell-organism).
- 2026-06-16: Chris ratifica dirección B (AskUserQuestion) → state: accepted. Approach concreto → /architect.

## 7. Cross-references
- Origin blocker: `comunify/docs/product/stories/comunify-shell-organism/checkpoint.md § Blocker` + `chris-input.md` (2026-06-16).
- Target contract: `docs/core-modules/luana-core-copilot.md` (a crear/actualizar en el lift).
- Engine surface: `core/luana-core-copilot/src/luana_core_copilot/api/chat.py` · `core/luana-core-platform/src/luana_core_platform/core/{config,rate_limit}.py`.
- Patrón establecido a eliminar: `vitalia/backend/src/modules/vitalia/copilot/api/routes/wizard_onboarding_routes.py` (own-routes per-brand).
- Process: `docs/promotion-protocol/README.md`.
