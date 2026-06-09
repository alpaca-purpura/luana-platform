<!-- voseo-allowed: doc interno de proceso, no user-facing -->
# W5a · RESEARCH — Valores actuales ("luana value actual") por slot del seam DIP `project.config.yaml`

> **Read-only harvest** (2026-06-09) para el autor del schema. Cada slot trae los **literales exactos** del repo real (vitalia hub worktree de luana-platform). NO interpretar/normalizar — son los valores a copiar.
>
> Workspace root: `/home/chalreme/Proyectos/luana-vitalia`.

---

## SLOT 1 · `brands[]` — metadata per-brand

Fuentes: `scripts/generate_portfolio.py` (UNIVERSES, líneas 35-124) · `scripts/scan_promotables.py:34` (BRAND_SLUGS) · `scripts/git/cleanup-session.sh:109` (loop 10-brand) · CLAUDE.md/AGENTS.md port allocation + cockpit table · `docs/rules-detail/definition-of-done-live-verify.md` (dev-app URLs, líneas 25-28).

**⚠️ El `dev_app_url` NO es un patrón uniforme.** El pattern enunciado en rule #37 es `dev-app.{brand}lat.com`, pero la tabla real del detail diverge por marca. Valores LITERALES:

- vitalia → `dev-app.vitalialat.com`  (= `{brand}lat.com`)
- nicolify → `dev-app.nicolify.com`   (= `{brand}.com` — NO lat)
- comunify → `dev-app.comunifyagents.com` (= `{brand}agents.com`, zona `comunifyagents.com`)
- lupulo → `dev-app.lupulo.com`  (placeholder · sin deploy/cloudflared · `⚠️ verificar`)

El orden canónico del loop `cleanup-session.sh:109` (10 brands, hardcoded): `vitalia nicolify comunify lupulo saasora inmoflow retailly fixia guestly fitflow`.
`scan_promotables.py:34` BRAND_SLUGS (4 activas con docs/learnings/): `["nicolify", "vitalia", "comunify", "lupulo"]`.

| slug | vertical | status | be_port | fe_port | cockpit_port | dev_app_url | kind | cliente | diferenciacion (UNIVERSES) |
|---|---|---|---|---|---|---|---|---|---|
| luana | Engine compartido (no consumidor) | active (`status_default: active`) | n/a | n/a | 4000 | n/a | core | — | 26 paquetes luana-core-* + Extension SDK EP-1..EP-18 + cross-cutting concerns |
| nicolify | Agencias + Servicios B2B | shipped | 8001 | 3001 | 4001 | dev-app.nicolify.com | brand | Agencias marketing, software boutique, consultoras | CRM ciclo largo · portal cliente · propuestas/contratos · horas facturables |
| vitalia | Salud + Bienestar | shipped | 8002 | 3002 | 4002 | dev-app.vitalialat.com | brand | Clínicas médicas, dentales, estéticas | Reservas prepagadas · historial médico · HIPAA-lite · seguimiento post-tratamiento |
| comunify | Creator Economy + Educación | shipped | 8003 | 3003 | 4003 | dev-app.comunifyagents.com | brand | Coaches, creadores contenido, infoproductores | Escalera valor · bóveda autoridad · motor comunidad · embudos venta |
| lupulo | Gastronomía | placeholder | 8004 | 3004 | 4004 | dev-app.lupulo.com (placeholder) | brand | Restaurantes, bares, cafeterías | Reservas mesa · pedidos digitales · integración KDS via agentes IA |
| saasora | SaaS + Productos Digitales | pending-bootstrap | NOT FOUND (no allocado — no en CLAUDE.md port table) | NOT FOUND | NOT FOUND | NOT FOUND | brand | Startups tech, micro-SaaS, software | Onboarding automatizado · subscripciones Stripe · dashboards Churn/MRR · changelogs |
| inmoflow | Real Estate | pending-bootstrap | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | brand | Brokers, agencias inmobiliarias | Integración portales · mapas interactivos · lead routing por zona · calculadoras financieras |
| retailly | E-commerce / D2C | pending-bootstrap | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | brand | Tiendas online, marcas físicas | Catálogos dinámicos · cart recovery · integración logística · cross-selling checkout |
| fixia | Servicios Hogar + Oficios | pending-bootstrap | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | brand | Plomeros, electricistas, HVAC, contractors | Técnicos en campo · cotización on-site · reseñas locales SEO automatizadas |
| guestly | Turismo + Hotelería | pending-bootstrap | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | brand | Hoteles boutique, rentas vacacionales, tours | Motor reservas estacional · sync OTAs (Airbnb/Booking) · guest experience |
| fitflow | Fitness + Deporte | pending-bootstrap | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | brand | Gimnasios, estudios yoga, boxes | Facturación recurrente · control aforo · calendario clases · waivers |

> `status` literal usado en `generate_portfolio.py` STATUS_EMOJI: `active`(🟢) · `shipped`(✅) · `placeholder`(🟡) · `pending-bootstrap`(⏳) · `blocked`(🚧).
> Ports de las 6 pendientes-bootstrap: **NOT FOUND** — la tabla de CLAUDE.md/AGENTS.md solo alloca las 4 activas (nicolify/vitalia/comunify/lupulo). Se asignarán al bootstrap.

---

## SLOT 2 · `toolchain` — binarios/comandos exactos

Fuentes: `AGENTS.md` § Quick Commands + § Native-First · CLAUDE.md § Workspace tooling.

```yaml
toolchain:
  python_version: "3.12"                  # CLAUDE.md "Python 3.12"; uv workspace = 27 members editable
  package_manager_py: "uv"                # [tool.uv.workspace] en root pyproject.toml (27 members)
  package_manager_fe: "pnpm@9.15.9"       # package.json "packageManager": "pnpm@9.15.9"; node 20 LTS via nvm
  venv_path: "${WS}/.venv"                # venv AT WORKSPACE ROOT. ${WS} = $(git rev-parse --show-toplevel)
                                          # bins: ${WS}/.venv/bin/{python,pytest,ruff,alembic,pip-audit}
  runtime: "Docker Compose per brand"     # make dev-{brand} / make dev-all · postgres compartido :5435

  backend:
    lint:      "${WS}/.venv/bin/ruff check ."          # tb: ruff check src/ tests/ ; line-length 120, py312
    format:    "${WS}/.venv/bin/ruff format --check"   # double quotes, spaces (de Quality Gates)
    typecheck: "mypy --strict"            # de DoD detail § technical gates (NO citado en AGENTS.md Quick Commands)
    test:      "${WS}/.venv/bin/pytest --cov=src"      # arch primero: pytest tests/architecture/ -v ; fail_under=43%
    test_single_module: "${WS}/.venv/bin/pytest tests/modules/{brand}/{name}/ -v"
    migrate:   "docker exec luana-dev-{brand}_backend_dev-1 bash -c \"cd /workspace/{brand}/backend && /workspace/.venv/bin/alembic upgrade head\""   # HB-37 ground-truth
    audit:     "${WS}/.venv/bin/pip-audit"
    cwd:       "{brand}/backend"          # cd {brand}/backend && ...

  frontend:
    typecheck: "npx tsc --noEmit"         # strict
    lint:      "npx eslint src/ --cache"  # 0 errors, eslint.config.mjs
    test:      "npx vitest run --coverage" # 20% coverage threshold per-brand
    e2e_smoke: "E2E_BASE_URL=http://localhost:300X npx playwright test --project=smoke"
    cwd:       "{brand}/frontend"         # cd {brand}/frontend && npx ...

  ci_gate: "make ci-parity"               # mandatory pre-push-to-main; engine + 4 brands
  etl_contract_regen: "make extraction-contract"
```
Native-First HARD: NUNCA lint/tests/type-check dentro de Docker. Docker solo para runtime/migrations/`make ci-parity`.

---

## SLOT 3 · `locale`

Fuente: `.claude/rules/spanish-text.md`.

```yaml
locale:
  identifier: "Español LatAm neutro"      # título: "Spanish Text (UI user-facing)"
  rule: "tuteo"                           # Tuteo (tú). PROHIBIDO voseo (vos/sos/tenés/podés/mirá/dejá)
  forbidden: "voseo + léxico marcado"     # laburo/quilombo/pibe/dale/che/bárbaro/fijate
  excludes_dialects: ["MX", "CO", "PE", "CL", "EC"]   # voseo excluye estos
  scope: "SOLO interfaces de usuario — web UI (frontend) + output agéntico"  # acotado 2026-06-01 por Chris
  scope_excludes: ["harness (.claude/)", "docs/ + *.md", "scripts/", "tools/", "tests", "logs internos", "comentarios", "variables"]
  enforcement: "scripts/git-hooks/pre-commit §1 — escanea SOLO código de producto .py/.ts/.tsx"
  agentic_validation: "arch tests en core/ (test_*_voseo_compliance.py, test_system_prompt_neutro_latam.py)"
  magic_comment_escape: "# voseo-allowed"   # tb variante markdown: "<!-- voseo-allowed -->"
                                            # R25 obsoleto p/ archivos internos desde 2026-06-01; residual solo p/ código producto user-facing AR
  exception: "Output sales_agent respeta voz tenant (puede tener voseo si tenant AR)"
  glossary_full: "docs/rules-detail/spanish-glossary.md"   # 50+ conversiones
  ortografia: "tildes + ñ + apertura ¿/¡ (R1)"
```

---

## SLOT 4 · `engine_prefix`

Fuente: `ls core/luana-core-*` + CLAUDE.md + `core/pyproject.toml` (comment).

```yaml
engine_prefix:
  python_glob: "core/luana-core-*"        # src interno: core/luana-core-*/src/luana_core_*/
  ts_scope: "@luana/*"                     # paquetes TS scoped en core/@luana/ (consumo vía import @luana/...)
  package_count_claimed: 26                # CLAUDE.md root dice "26 paquetes luana-core-*"
  package_count_actual_dirs: 27            # ⚠️ DRIFT: hay 27 dirs core/luana-core-*/ en disco;
                                           #   core/pyproject.toml comment: "27 Python packages (alphabetical)"
                                           #   uv workspace [tool.uv.workspace] members = 27 (CLAUDE.md tooling table tb dice "27 members editable")
                                           #   → el "26" del CLAUDE.md header está STALE. Flag para el autor.
```
**Los 27 paquetes Python (`core/luana-core-*`, alfabético):**
`analytics-engine, assets, billing, brand-studio, campaigns, channels, commercial-calendar, compliance, connections, copilot, crm, events, extension-sdk, extraction, flows, iam, idempotency, landing, llm, observability, offer-studio, platform, sales-agent, scheduling, social-proof, tenant-domains, tenant-profile`

**Los 8 paquetes TS scoped (`core/@luana/`):** `api-client, design-tokens, eslint-config, extension-sdk, format, hooks, schemas, ui-kit`.

---

## SLOT 5 · `live_verify_infra[]` (+ facet `observability_evidence`)

Fuentes: `.claude/rules/definition-of-done-live-verify.md` · `docs/rules-detail/definition-of-done-live-verify.md` (líneas 19-67, 83-92) · `.claude/rules/hotfix-repro-mandatory.md` (líneas 11-21).

```yaml
live_verify_infra:
  dev_app_url_pattern: "dev-app.{brand}lat.com"   # ⚠️ pattern enunciado; valores REALES divergen (ver slot 1)
  mechanism: "cloudflared tunnel locally-managed → stack local localhost:300X (NO servidor cloud · deploy deferred)"
  localhost_fallback: "localhost:300X"    # vitalia :3002/:8002, nicolify :3001/:8001, comunify :3003/:8003, lupulo :3004/:8004
  api_route_proxy: "/api/* → BE"          # ej. vitalia FE :3002 proxea /api/* a BE :8002

  per_brand:
    - brand: vitalia
      dev_app: "dev-app.vitalialat.com"
      up_cmd: "make dev-app-vitalia"      # idempotente · scripts/dev-app-up.sh
      fe_port: 3002
      be_port: 8002
      backend_log: "docker logs luana-dev-vitalia_backend_dev-1"
      tunnel_status: "✅ OPERATIVO (verificado live 2026-06-02: /→307 sign-in + /api/health→200)"
      test_user: "dr.demo@vitalialat.com"   # role=owner + clinicId + tenant_id en public_metadata (tenant Sanaré)
      chris_crosscheck: "hola@alpacapurpura.lat"
      arming: "✅ full"
    - brand: nicolify
      dev_app: "dev-app.nicolify.com"
      up_cmd: "make dev-nicolify + make dev-nicolify-tunnel"
      fe_port: 3001
      be_port: 8001
      backend_log: "docker logs luana-dev-nicolify_backend_dev-1"
      tunnel_status: "✅ tunnel provisto + connector docker UP (be33b8dd…)"
      test_user: "owner.demo@nicolify.com"  # role owner, tenant_id 7f464ab7…
      chris_crosscheck: "hola@alpacapurpura.lat"
      arming: "✅ full"
    - brand: comunify
      dev_app: "dev-app.comunifyagents.com"
      up_cmd: "make dev-comunify + make dev-comunify-tunnel"
      fe_port: 3003
      be_port: 8003
      backend_log: "docker logs luana-dev-comunify_backend_dev-1"
      tunnel_status: "✅ tunnel provisto + connector docker UP (999f4a24…, zona comunifyagents.com)"
      test_user: "owner.demo@comunifyagents.com"
      chris_crosscheck: "hola@alpacapurpura.lat"
      arming: "🟡 Clerk-level (BLOQUEADO) — bug migración 001_comunify_initial_snapshot no crea tabla tenants"
    - brand: lupulo
      dev_app: "dev-app.lupulo.com"
      up_cmd: "make dev-lupulo + make dev-lupulo-tunnel"
      fe_port: 3004
      be_port: 8004
      backend_log: "docker logs luana-dev-lupulo_backend_dev-1"
      tunnel_status: "⚠️ verificar"
      arming: "⬜ placeholder (sin bootstrap)"

  test_creds:
    location: "{brand}/.env.dev"          # gitignored (patrón *.env.dev en .gitignore); per-worktree
    keys:                                  # NOMBRES cross-brand idénticos, VALORES per-brand
      - DEV_APP_TEST_EMAIL
      - DEV_APP_TEST_PASSWORD
      - DEV_APP_CHRIS_EMAIL
      - DEV_APP_CHRIS_PASSWORD
      - CLERK_TESTING_TOKEN_{BRAND}        # bypass bot-detection Playwright
      - CLERK_SECRET_KEY
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    tunnel_api_keys: "{brand}/deploy/cloudflared/.credentials/cf-api.env"   # gitignored (cfat_ token)
    nature: "creds de DESARROLLO (instancia pk_test_); NUNCA pk_live_; NUNCA en archivo tracked"

  clerk_verify_mechanism:                  # verify-real OBLIGATORIO antes de declarar cred seteada
    user_exists: "GET /v1/users?email_address={email}  → existe + public_metadata (role/tenant)"
    password_check: "POST /v1/users/{user_id}/verify_password  {\"password\":\"…\"}  → \"verified\": true"
    skill: "clerk-backend-api (o curl con CLERK_SECRET_KEY de {brand}/.env.dev)"

  tunnel_setup_script: "scripts/cloudflared-setup.sh {brand}"   # NO-INTERACTIVO (reescrito 2026-06-02), idempotente

  # facet observability_evidence — fuente: hotfix-repro-mandatory.md (trace_evidence.source)
  observability_evidence:
    sources: ["docker-logs", "sentry", "copilot_trace_event", "conversation-log"]
    schema: "trace_evidence: {source: <one-of-sources>, ref: \"<id/url/snippet del traceback/traza>\"}"
    note: "CORE declara la abstracción; PROJECT llena las `source` reales vía seam live_verify_infra.observability_evidence"
```
Footgun documentado: el compose usa project compartido `luana-dev`; los containers bind-montan el código del worktree desde el que se corrió `up` por última vez → correr `make dev-app-{brand}` desde el worktree donde construís ANTES de verificar.

---

## SLOT 6 · `design_system_ref`

Fuente: `.claude/rules/frontend-visual-fidelity.md` § Referencias + verificación de existencia en disco.

```yaml
design_system_ref:
  canon_ssot: "docs/architecture/luana-platform/design-system-canon.md"      # ✅ existe (18617 bytes)
  doctrina_adr: "docs/architecture/luana-platform/ADR-014-design-system-homologation.md"   # ✅ existe (9435 bytes)
  ui_kit_package: "@luana/ui-kit"          # core/@luana/ui-kit (único lego del builder-frontend); tb "core/@luana/ui-kit"
  design_tokens_package: "@luana/design-tokens"   # core/@luana/design-tokens (citado tb como "core/@luana/design-tokens")
  shadcn_atoms: "components/ui/"
  shared_molecules: "components/shared/"
  feature_components: "features/{m}/components/"
  shell_design_contract:                   # SHELL-DESIGN-CONTRACT es PER-BRAND (no platform-level único):
    - "vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md"      # ✅ existe
    - "nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md"     # ✅ existe
  visual_fidelity_body: ".claude/skills/frontend-expert/references/visual-fidelity.md"
  fsd_rule: ".claude/rules/frontend-fsd.md"
  quality_rule: ".claude/rules/frontend-quality.md"
  binding: "HARD (cement 2026-06-08, ADR-014) — toda hoja user-reachable, todas las marcas, se ARMA del canon"
```
> Nota: la rule cita el tokens package dos formas: `@luana/design-tokens` (import) y `core/@luana/design-tokens` (path). El SHELL-DESIGN-CONTRACT **NO existe a nivel platform** (`docs/architecture/luana-platform/`) — solo per-brand (vitalia + nicolify). Las 2 marcas con design system son vitalia + nicolify (skills `vitalia-design-system` + `nicolify-design-system`).

---

## SLOT 7 · `domain_modules[]`

Fuentes: `AGENTS.md:37` (Modules conceptuales) · `.claude/hooks/contract-guard.js` (RULES array) · `docs/rules-detail/_CLAUDE-original-backup.md` § Brand → Core mapping.

**Lista canónica de módulos conceptuales (AGENTS.md:37, literal, en orden):**
`brand, offer, landing, sales_agent, copilot, crm, scheduling, analytics, connections, assets, tenant_domains, commercial_calendar, campaigns, iam`

**Clasificación por categoría (Brand → Core mapping, 3 categorías):**

```yaml
domain_modules:
  CORE_FULL:           # idéntico cross-brand · core package · sin brand extension surface
    modules: [iam, core, crm, assets, commercial_calendar, tenant_domains, tenant_profile,
              social_proof, idempotency, events, compliance, billing, channels, llm,
              observability, extension-sdk, extraction]
    core_package: "luana-core-{x}"

  ENGINE_BRAND_EXTENSION:   # engine + extensión brand-specific (código)
    - module: copilot
      core_package: luana-core-copilot
      extension_surface: "{brand}/backend/src/modules/{brand}/copilot/{extractors,tools,workflows,kb}/"
    - module: sales_agent
      core_package: luana-core-sales-agent
      extension_surface: "{brand}/backend/src/modules/{brand}/sales_agent/tools/ + personas/ + goldens/"
    - module: scheduling
      core_package: "luana-core-scheduling (futuro; hoy en luana-core-platform)"
      extension_surface: "BookingPolicyDef per-brand"
    - module: connections
      core_package: luana-core-connections
      extension_surface: "ChannelAdapterDef per-brand (Lupulo POS/KDS, Vitalia payment gateway, etc.)"

  ENGINE_BRAND_CONFIG:      # engine + config brand-specific (YAML/registro, no código)
    - module: brand
      core_package: luana-core-brand-studio
      extension_surface: "{brand}/config/brand.yaml (enabled_sections + field_overrides + preset_pack)"
    - module: offer
      core_package: luana-core-offer-studio
      extension_surface: "preset packs via Extension SDK EP-2"
    - module: analytics
      core_package: luana-core-analytics-engine
      extension_surface: "enabled_metrics + channel_groups per-brand"
    - module: campaigns
      core_package: luana-core-campaigns
      extension_surface: "CampaignTemplateDefs via EP-7"
    - module: landing
      core_package: luana-core-landing
      extension_surface: "LandingTemplateDefs via EP-12"

  DROP: [advertising, social_media]   # placeholder, no implementación
```

**contract-guard.js RULES array — paths/triggers vigilados (SSoT-guard PostToolUse):**

```yaml
contract_guard_rules:   # cada uno: ENGINE (core/) / BRAND ({brand}/) / LEGACY (backend/)
  - name: etl-contract           # analytics providers|etl|etl_service|workers(scheduler|tasks)|domain/extraction_contract.py
    trigger_regen: "make extraction-contract && pytest .../test_extraction_contract.py"
  - name: metric-catalog         # analytics/domain/metric_catalog.py (+ brand metric_catalog_extension.py)
    trigger_regen: "pytest .../test_extraction_contract.py (catalog↔contract alignment)"
  - name: offer-catalogs         # offer-studio/domain/{archetype|format|offer_type_preset|section|value_level|variant_structure}_catalog.py + expert_business_type.py
    trigger_regen: "bump _CATALOG_VERSION + pytest .../tests/architecture/ + per-brand vitest test-no-catalog-duplicates"
  - name: channel-registry       # analytics/application/services/channel_registry.py
    trigger_regen: "NO duplicar STAGE_CHANNEL_MAP / PROVIDER_TO_CHANNEL_TYPES"
  - name: copilot-registry       # copilot/domain/module_registry.py
    trigger_regen: "New modules need ModuleDescriptor entry"
  hook_triggers_on: ["Write", "Edit", "MultiEdit"]
  brands_hardcoded_in_hook: ["vitalia", "nicolify", "comunify", "lupulo"]   # + 6 pendientes listadas en comment
```

---

## SLOT 8 · `agent_roster` (per brand)

Fuentes: `tools/luana-cockpit/lib/agent-meta.ts` (AGENTS record, líneas 40-57 — **única fuente con hex colors**) · `tools/luana-cockpit/lib/map-zones.ts` (BOX_EMOJI cajas transversales) · `scripts/generate_capability_index.py` (VITALIA_AGENTS, líneas 34-42, con subtitle) · `tools/luana-cockpit/components/map/MapView.tsx` (FALLBACK_AGENTS_BY_BRAND, líneas 714-733; VITALIA_ROLES :41).

> Las cifras de color hex SOLO viven en `agent-meta.ts`. Los subtitles vienen de `generate_capability_index.py` + `MapView.tsx`. Hay una pequeña divergencia mateo/valeria entre fuentes — se anota.

### VITALIA

```yaml
vitalia_roster:
  # de agent-meta.ts (hex) + generate_capability_index.py / MapView.tsx (subtitle)
  - slug: lisa
    name: Lisa
    emoji: "🏥"
    color: "#10b981"          # emerald
    subtitle: "Mi Clínica"
    role: especialista
    avatar: "public/agents/lisa/"   # (ver MEMORY vitalia-agents-catalog: public/agents/{slug}/)
  - slug: valeria
    name: Valeria
    emoji: "🗓"
    color: "#a855f7"          # purple — SUPERVISORA (sidebar, NO ribbon/caja de valor)
    subtitle: "Mi Día"        # (generate_capability_index.py)
    role: supervisor
  - slug: mateo
    name: Mateo
    emoji: "📅"
    color: "#FEE209"          # amarillo marca (--agent-mateo) — Operar/Mi Día
    subtitle: "Operar / Mi Día"   # (MapView FALLBACK)
    role: especialista
    note: "mateo NO está en VITALIA_AGENTS de generate_capability_index.py (allí 'valeria'=Mi Día); SÍ en agent-meta.ts + MapView FALLBACK + VALUE_STREAM (operar). Divergencia de fuentes — flag."
  - slug: adrian
    name: Adrián
    emoji: "💼"
    color: "#3b82f6"          # blue
    subtitle: "Vender"
    role: especialista
  - slug: lucas
    name: Lucas
    emoji: "📣"
    color: "#f59e0b"          # amber
    subtitle: "Marketing"
    role: especialista
  - slug: camila
    name: Camila
    emoji: "🌟"
    color: "#ec4899"          # pink
    subtitle: "Reputación + cohortes"
    role: especialista
  # cajas transversales (no agentes-persona, pero en el roster del cockpit)
  - slug: config
    name: Config / Configurar
    emoji: "⚙"
    color: "#64748b"          # slate
    subtitle: "tenant · iam · compliance · admin"
  - slug: infra
    name: Infra / Infra Vitalia
    emoji: "🔧"
    color: "#06b6d4"          # cyan
    subtitle: "observability · platform · payment · scaffolding"
```

### NICOLIFY

```yaml
nicolify_roster:
  - slug: luana
    name: Luana
    emoji: "🧭"
    color: "#635BFF"          # indigo · ORQUESTADORA (sidebar, único rostro · no ribbon)
    subtitle: "Orquesta · único rostro"
    role: orquestadora
  - slug: abel
    name: Abel
    emoji: "🧠"
    color: "#A855F7"          # púrpura · estratega/oferta
    subtitle: "Estrategia · oferta"
    role: especialista
  - slug: brenda
    name: Brenda
    emoji: "💰"
    color: "#22C55E"          # verde · growth/presupuesto
    subtitle: "Growth · presupuesto"
    role: especialista
  - slug: christian
    name: Christian
    emoji: "🏹"
    color: "#3B82F6"          # azul · SDR/outbound
    subtitle: "SDR · outbound"
    role: especialista
  - slug: norvil
    name: Norvil
    emoji: "🌱"
    color: "#EC4899"          # rosa · account manager/retención
    subtitle: "Account mgr · retención"
    role: especialista
  - slug: config
    name: Configurar
    emoji: "⚙"
    color: "#64748b"          # slate (común cross-brand, de agent-meta.ts)
    subtitle: "tenant · iam · tokens"
  # nota: MEMORY nicolify-agents-catalog cita tb 'Sara' (Jefa Proyectos/"Mi Día", color ámbar #F59E0B,
  # ADR-nicolify-002) agregada 2026-05-30 — NO presente todavía en agent-meta.ts ni MapView FALLBACK. Flag.
```

### COMUNIFY / LUPULO
**NOT FOUND** — `agent-meta.ts` solo define vitalia + nicolify + comunes. `BRAND_AGENTS` en `generate_capability_index.py:44-47` solo tiene `vitalia` (comentario: "nicolify, comunify, lupulo: catálogos pendientes ADR propio"). `MapView.tsx` FALLBACK_AGENTS_BY_BRAND solo trae vitalia + nicolify; cae a vitalia por default. Sin roster con hex colors para comunify/lupulo en el cockpit.

---

## SLOT 9 · `value_stream`

Fuente: `tools/luana-cockpit/lib/map-zones.ts` VALUE_STREAM_STAGES (líneas 201-226).

```yaml
value_stream:
  # 4 etapas del GTM clínico (lente "proceso" del mapa). boxIds = slugs de agentes de la zona Agentes.
  - id: atraer
    name: Atraer
    order: 1
    description: "Presencia pública + marketing que trae pacientes."
    boxIds: [lisa, lucas]
  - id: vender
    name: Vender
    order: 2
    description: "Captar, calificar y cerrar al paciente."
    boxIds: [adrian]
  - id: operar
    name: Operar
    order: 3
    description: "Agenda, reservas prepagadas y día clínico."
    boxIds: [mateo]
  - id: fidelizar
    name: Fidelizar
    order: 4
    description: "Post-tratamiento, NPS, reputación y cohortes."
    boxIds: [camila]
  # nota: 'order' es el índice del array (no campo literal en el código — es el orden de declaración).
  # Etapa dinámica 'otros' (id: otros) se appendea en runtime (buildProcessLens) para cajas Agentes sin etapa.
  # Esta cadena es VITALIA-específica (GTM clínico). Cadena de valor cross-brand (empleados-IA) =
  # Atraer→Vender→Operar→Retener (Lucas→Adrián→Mateo→Camila) per MEMORY luana-empleados-ia-vision (no en este file).
```

---

## SLOT 10 (D1) · `wip_caps`

Fuentes: `scripts/validate_session_close.py:73-82` · `scripts/generate_backlog.py:84-95` · `.claude/rules/story-closure-gate.md` (módulo-scoped).

```yaml
wip_caps:
  # validate_session_close.py:73 — IDÉNTICO a generate_backlog.py:84 (los 6 *_max coinciden):
  refining_max: 3
  refined_max: 5
  ready_max: 5
  developing_max: 3
  developed_max: 10        # ⚠️ NOTA: ambos scripts dicen developed_max=10, PERO el canon module-scoped
                           #   (story-closure-gate.md) es "≤ 1 story en developing/developed/reviewing
                           #   por code:{module} bucket". Set DISTINTO — ver abajo. NO resolver (per instrucción).
  reviewing_max: 2

  # validate_session_close.py — adicional:
  CHECKPOINT_STALE_DAYS: 7
  ACTIVE_STATES: [refining, refined, ready, developing, developed, reviewing]

  # generate_backlog.py:84 CAPS — adicionales (NO presentes en validate_session_close.py):
  idea_stale_days: 90
  refining_stale_days: 60     # "active refinement should not stagnate"
  refined_stale_days: 30      # "awaiting architect — pull through fast"
  done_rolling_days: 90

  # ── DIVERGENCIA CANÓNICA (solo anotar, no resolver) ──
  # CLAUDE.md § SDD Level 3 (vocabulario v4) tabla:
  #   refining ≤3 · refined ≤5 · ready ≤5 · developing ≤3 · developed ≤1 · reviewing ≤1 · done rolling 90d
  # story-closure-gate.md (WIP cap v2 module-scoped): "≤ 1 story en developing/developed/reviewing
  #   por code:{module} bucket. Módulos distintos paralelos = OK."
  # → developed: scripts dicen 10, CLAUDE.md dice 1, story-closure-gate dice ≤1 por módulo.
  #   reviewing: scripts dicen 2, CLAUDE.md dice 1.
  #   Tres SSoT con números distintos para developed/reviewing. FLAG para el autor del schema.
```
Confirmado: los 6 `*_max` entre `validate_session_close.py` y `generate_backlog.py` son **idénticos** (`refining=3, refined=5, ready=5, developing=3, developed=10, reviewing=2`). `validate_session_close.py:71` lo dice explícito en comment: "must match scripts/generate_backlog.py CAPS".

---

## Resumen de flags para el autor del schema

1. **`engine_prefix`**: CLAUDE.md dice "26 paquetes" pero hay **27** dirs reales (+ `core/pyproject.toml` y uv workspace = 27 members). El 26 está stale.
2. **`brands[].dev_app_url`**: NO es uniforme `{brand}lat.com` — vitalia=vitalialat.com, nicolify=nicolify.com, comunify=comunifyagents.com, lupulo=lupulo.com. Hardcodear per-brand.
3. **`brands[]` ports 6 pendientes-bootstrap**: NOT FOUND (sin allocación). Solo 4 activas tienen puertos.
4. **`agent_roster`**: hex colors SOLO en `agent-meta.ts` (vitalia + nicolify). Comunify/lupulo NO tienen roster. Divergencias: mateo vs valeria(=Mi Día) entre fuentes vitalia; Sara (nicolify, ADR-nicolify-002) aún no en código.
5. **`wip_caps.developed` / `.reviewing`**: 3 SSoT con números distintos (scripts=10/2, CLAUDE.md=1/1, story-closure-gate=≤1 por módulo). Sin resolver.
6. **`design_system_ref.shell_design_contract`**: NO es platform-level único — es per-brand (vitalia + nicolify).
7. **`toolchain.backend.typecheck` (mypy)**: NO citado en AGENTS.md Quick Commands; viene de DoD detail § technical gates (`mypy --strict`). Confirmar con el autor si va en el seam.
