---
proposal_id: 2026-06-17-config-yaml-settings-source
state: proposed                # proposed | under_review | accepted | rejected | migrated
opened_date: 2026-06-17
opened_by: /pm-luana
ratified_by: null
ratified_date: null

# Origen
origin_learnings:
  - (pendiente captura) nicolify pilot B 2026-06-17 — config split proof-of-concept
origin_brands: [nicolify]          # piloto; el problema es de las 4 marcas

# Target
target_package: core/luana-core-platform
target_module: src/luana_core_platform/core/config.py   # Settings.settings_customise_sources
target_ep: null

# Impact assessment
semver_bump: minor                 # source nueva opcional, precedencia env-wins → no breaking
breaking_change: false
brands_affected_consumers: [nicolify, vitalia, comunify, lupulo]
brands_at_risk_regression: [nicolify, vitalia, comunify, lupulo]  # todas instancian Settings al boot

# Lift plan
lift_estimated_effort: "1 day (engine source + 4-brand migration + arch-test + downstream boot)"
lift_owner: /dev-team
arch_test_downstream_required: true
migration_notes_required: false
---

## 1. Patrón a promover

**Fuente YAML nativa en el engine `Settings`** (pydantic-settings `settings_customise_sources`) que lee la
**config NO-SECRETA** desde `{brand}/config/brand.yaml`, para que el `.env` quede **solo con secrets**.

Hoy la config no-secreta (`LOG_LEVEL`, `DOMAIN_NAME`, `TRAEFIK_NETWORK`, `FRONTEND_URL`, `QDRANT_COLLECTION*`,
`LITELLM_BASE_URL`, `COPILOT_TELEGRAM_BOT_USERNAME`, puertos…) está **TRIPLICADA** en
`{brand}/.env.dev` + `{brand}/config/brand.yaml` + `project.config.yaml`, pero **solo el `.env` la alimenta al
runtime**: `core/luana-core-platform/.../core/config.py` Settings lee `env_file=".env"` y **nada lee brand.yaml en
runtime** (grep backend/scripts = vacío). Drift garantizado (cambiás un puerto en un lado, los otros 2 quedan stale).

Esto **alinea con la doctrina ya documentada** del propio `/pm-luana` ("metadata-en-su-lugar": SSoT = `brand.yaml`,
index auto-gen = `INFRA-MATRIX`). El gap es que el **runtime** no consume el SSoT — esta proposal lo cierra.

## 2. Evidencia (piloto nicolify probado 2026-06-17)

Proof-of-concept nicolify-local, gates verdes (ruff + arch 20/20), verificado end-to-end:

- Shim `nicolify/backend/src/config_bootstrap.py`: lee `brand.yaml::runtime_env.dev` → `os.environ.setdefault`
  ANTES del engine `get_settings()` (lazy `@lru_cache`). Import side-effect en `src/main.py`.
- 4 keys (`LOG_LEVEL`/`DOMAIN_NAME`/`TRAEFIK_NETWORK`/`FRONTEND_URL`) movidas del `.env.dev` → `brand.yaml`.
- **Prueba en container** (proceso fresco): las 4 ausentes del env (`{LOG_LEVEL: False, ...}`) → shim `source=yaml`
  → `Settings` resolvió los valores exactos (`INFO`/`localhost`/`luana_default`/`https://app.nicolify.com`) →
  **health 200 sin failfast**.
- **Failfast contrastado**: `Settings()` sin `.env` → `ValidationError: 16 missing` (LOG_LEVEL/DOMAIN_NAME/
  TRAEFIK_NETWORK/API_SECRET_KEY/WHATSAPP_*/OPENAI_API_KEY required).

El piloto valida que **el yaml puede ser la fuente**. Su límite: es per-entrypoint (solo `main.py`) y nicolify-local
→ por eso se gradúa al engine.

## 3. Diseño técnico (engine)

Agregar a `Settings` (engine `config.py`):

```python
@classmethod
def settings_customise_sources(cls, settings_cls, init_settings, env_settings,
                               dotenv_settings, file_secret_settings):
    # Precedencia (gana el de más a la izquierda):
    #   init > env real > .env > brand.yaml (runtime_env) > secrets
    # env/.env GANAN sobre el yaml → transición sin ruptura + override explícito sigue valiendo.
    return (init_settings, env_settings, dotenv_settings,
            BrandYamlSettingsSource(settings_cls), file_secret_settings)
```

- `BrandYamlSettingsSource`: resuelve `{repo}/{BRAND_SLUG}/config/brand.yaml::runtime_env.<env>` (BRAND_SLUG +
  ENVIRONMENT ya están siempre en el env del container). Keys = nombres EXACTOS de los campos Settings.
- **Cubre TODOS los entrypoints** (no solo `main.py`: workers, scripts, cualquier `get_settings()`), porque vive en
  la clase Settings — supera el límite del shim nicolify.
- **env-wins**: durante la migración, mientras la key siga en `.env` no cambia nada; cuando se borra, el yaml la provee.

## 4. Qué migra al yaml vs qué queda en `.env`

| Queda en `.env` (secrets + casos especiales) | Por qué |
|---|---|
| `API_SECRET_KEY`, `OPENAI_API_KEY`, Clerk keys, `*_KEK`, `*_PASSWORD*`, `WHATSAPP_*`, webhook secrets | **Secrets** — nunca a un yaml versionado/indexado |
| `DATABASE_URL` / `POSTGRES_*` | **alembic** `env.py` los lee con `os.environ.get` **sin** instanciar Settings → no pasa por la source nueva. Además llevan password (secret) |
| `${...}` substituidos por compose (vitalia `${VITALIA_PHI_KEK}`) | Resuelven en **compose-layer** antes de Python → la source no los alcanza |
| Migra al yaml (no-secreto, consumido por Settings) | `LOG_LEVEL`, `DOMAIN_NAME`, `TRAEFIK_NETWORK`, `FRONTEND_URL`, `QDRANT_COLLECTION*`, `LITELLM_BASE_URL`, `COPILOT_TELEGRAM_BOT_USERNAME`, etc. (auditar por marca) |

## 5. Riesgos / caveats

- **Decisión de SSoT único** (a resolver en el lift): `brand.yaml::runtime_env` (recomendado — alinea con
  metadata-en-su-lugar) vs reusar `brand.yaml::infra` (keys no mapean 1:1 a env-var names) vs `project.config.yaml`
  (seam del harness). Hoy hay 2 copias yaml (brand.yaml::infra + project.config.yaml::ports con `qdrant_prefix`,
  `database_name`, puertos solapados). El lift debe elegir UNO y cross-checkear el otro (arch-test), no crear un 4º.
- **Frontend intacto**: `NEXT_PUBLIC_*` es build-time (otro mecanismo) — fuera de scope.
- **Per-key audit por marca**: cada marca tiene su set; vitalia agrega PHI/KEK secrets. Migrar con grep verbatim.
- **anti-default-flip no aplica** (no es flag side-effect), pero sí **downstream regression** (R3): boot de las 4
  marcas + `Settings` resuelve + arch suite.

## 6. Lift plan (post-accepted, `/dev-team` en worktree core efímero)

1. `BrandYamlSettingsSource` + `settings_customise_sources` en engine `config.py` (precedencia env-wins).
2. `runtime_env.<env>` en `brand.yaml` de las 4 marcas (keys no-secretas auditadas) + strip del `.env(.template)`.
3. **Retirar el shim piloto** `nicolify/backend/src/config_bootstrap.py` + su import en `main.py` (lo reemplaza la source nativa).
4. Arch-test consumer (engine + por marca): "la config no-secreta del `.env.template` vive en `runtime_env`" + "Settings
   resuelve sin esas keys en env".
5. Downstream: levantar las 4 marcas (`make dev-{brand}`) → health 200 + `get_settings()` resuelve los valores.
6. Bump `core/luana-core-platform` minor + CHANGELOG.
7. Worktree core efímero creado desde el PRINCIPAL (`new-session.sh core …`) — M13: NO desde un worktree de marca.

## 7. Recomendación /pm-luana: **APPROVED**

- Gap real del engine (runtime no consume el SSoT documentado) + drift activo por triplicación.
- Riesgo bajo: precedencia **env-wins** = migración sin ruptura; piloto ya probado end-to-end; minor opt-in.
- Beneficia a las 4 marcas + las 6 de bootstrap (heredan `.env` solo-secrets).
- **NO** incluye cambios de comportamiento (mismos valores, otra fuente).
- Caveat de scope: la decisión "qué yaml es el SSoT único" se resuelve en el lift (recomendado `brand.yaml::runtime_env`).

**Pendiente Chris:** ratificar (`accepted` → handoff `/dev-team`) o `rejected`. Mientras tanto el **piloto nicolify
queda como referencia** (sin commitear aún — decisión en el turno: commitear como evidencia o revertir al aterrizar el lift).
