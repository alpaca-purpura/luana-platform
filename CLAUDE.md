# CLAUDE.md

**luana-platform** — Multi-brand multitenant SaaS platform. Modular Monolith DDD + uv/pnpm workspace + Docker-First runtime. **10 brand apps** consumen un engine compartido `core/` (Luana).

@AGENTS.md cubre stack/commands/architecture/git/quality/native-first/skills/constraints. Esto = overlay project-specific.

## Topology

```
luana-platform/                                  ← monorepo (pnpm + uv workspace)
├── core/                                        ← Luana engine SSoT (26 packages)
│   ├── luana-core-{iam,platform,observability,
│   │   events,extension-sdk,extraction,llm,
│   │   idempotency,channels,compliance,billing,
│   │   ...}/                                    ← FULL CORE packages
│   ├── luana-core-{copilot,sales-agent}/        ← CORE-ENGINE + BRAND-EXTENSION
│   ├── luana-core-{brand-studio,offer-studio,
│   │   landing,analytics-engine,campaigns}/     ← CORE-ENGINE + BRAND-CONFIG
│   └── luana-core-{crm,assets,social-proof,
│       commercial-calendar,tenant-{domains,profile}}/  ← FULL CORE
├── nicolify/{backend,frontend}/                 ← Brand vertical: Agencias + Servicios B2B (CRM ciclo largo, portal cliente, propuestas/contratos, horas facturables)
├── vitalia/{backend,frontend,deploy,config}/    ← Brand vertical: Salud + Bienestar (reservas prepagadas, HIPAA-lite, seguimiento post-tratamiento) — Story 11 done
├── comunify/{backend,frontend,deploy}/          ← Brand vertical: Creator Economy + Educación (escalera de valor, bóveda autoridad, motor comunidades) — Story 12 done + WIP recovery
├── lupulo/                                      ← Brand vertical: Gastronomía (reservas mesa, pedidos digitales, integración KDS) — placeholder
├── apps/test-brand/                             ← Reference brand for Extension SDK contracts
# Brand verticals PENDING bootstrap (4 ya existen + 6 nuevos = 10 total):
#   saasora/   ← SaaS + Productos Digitales (onboarding, subscriptions Stripe, dashboards Churn/MRR, changelogs)
#   inmoflow/  ← Real Estate (portales, mapas, lead routing por zona, calculadoras financieras)
#   retailly/  ← E-commerce/D2C (catálogos dinámicos, cart recovery, logística, cross-selling checkout)
#   fixia/     ← Servicios Hogar + Oficios (técnicos en campo, cotización on-site, reseñas locales SEO)
#   guestly/   ← Turismo + Hotelería (motor reservas, sync OTAs Airbnb/Booking, guest experience)
#   fitflow/   ← Fitness + Deporte (membresías recurrentes, aforo, calendario clases, waivers)
├── docs/                                        ← SSoT funcional + arquitectura + process + specs
└── scripts/                                     ← framework scripts (generate_backlog, reconcile_capabilities, validators, etc.)
```

**Migración mid-flight (2026-05-09 → in progress).** Plan target: `docs/architecture/luana-platform/01-core-audit.md` (Draft v0.1, owner Chris+Opus). Core packages ya extraídos como `luana-core-*` (Story 5+). Brand apps consumen via `luana_core_*` Python imports + `@luana/*` TS imports. Stories 11-12 ya shipped (vitalia + comunify); lupulo placeholder; **6 marcas nuevas (SaaSora, InmoFlow, Retailly, Fixia, Guestly, FitFlow) pendientes bootstrap** — patrón replicable de Story 11 (vitalia T-extensions-1 cement) o Story 12 (comunify pattern).

## Workspace tooling

| Stack | Manager | Lock | Workspace |
|---|---|---|---|
| Python 3.12 | **uv** | `uv.lock` (root) + `comunify/backend/uv.lock`, `nicolify/backend/uv.lock` | `[tool.uv.workspace]` en `pyproject.toml` raíz (27 members) |
| TypeScript | **pnpm 9.15.9** | `pnpm-lock.yaml` (root) | `pnpm-workspace.yaml` (core + nicolify + vitalia + comunify + lupulo) |
| Runtime | **Docker Compose** (`docker-compose.dev.yml`) | — | postgres + redis + qdrant (cuando aplique) |

**Venv at workspace root** — `.venv/bin/{python,pytest,ruff}` (uv-managed editable installs de todos los workspace members). NUNCA `cd nicolify/backend && python -m venv .venv` — los `luana_core_*` packages no estarían resueltos.

## Spec-Driven Development (SDD Level 3) — paradigma actual

SSoT funcional vive en `docs/{product,process,specs}/`. Vocabulario v4 (post pm-redesign 2026-05-06).

| Carpeta | Significado | Owner |
|---|---|---|
| `docs/product/` | SSoT vivo del producto. `BACKLOG.{yaml,md}` (auto-gen), `ideas-pool.yaml`, `outcomes/`, `stories/{id}/`, `capabilities/{module}/`, `modules/`. | `/pm` |
| `docs/product/legacy/snapshot-2026-05-09/` | Snapshot frozen pre-multibrand-migration. Read-only, ver `README.md` del dir | `/pm` (read-only) |
| `docs/process/` | Reglas transversales: ticket-states, checkpoint-protocol, parallel-sessions, learnings, pm-redesign, migration-plan, gap-reports. | `/pm` |
| `docs/specs/` | Templates + Rubrics + Personas (reusable cross-stories). | varios |
| `docs/architecture/` | ADR + multibrand carve-out plan (`luana-platform/01-core-audit.md`) | `/architect` |
| `docs/domains/` | Per-module SSoT (snapshot pre-migration, single-brand perspective) | `/pm` (referencia) |
| `docs/archive/{year}/` | Stories `done` snapshot inmutable + legacy PIs preservados. | `/pm` (read-only) |

### Vocabulary (10 estados macro unificados cross-nivel idea/outcome/story/capability)

Detalle completo: `docs/process/pm-redesign-2026-05.md` § Punto 4.

| # | Estado | Significado | Trigger entry | Owner | WIP cap |
|---|---|---|---|---|---|
| 1 | `idea` | Spark + research opcional (`00-research.md`). Puede nunca implementarse | Chris tira | Chris + `/pm` | ∞ |
| 2 | `refining` | Decompose stories + drafts spec/UX/agentic. Loop iterativo Chris | Chris dice "refinemos {x}" | `/pm` + `/po-ux`/`/po`/`/ux-agentico` | ≤ 3 |
| 3 | `refined` | Spec + UX/diseño ratificados Chris. Listo para architects | Chris ratifica | `/pm` cierra | ≤ 5 |
| 4 | `ready` | Paquete autocontenido completo (`03-arch` + `04-validators` + `05-guidelines` + `06-tickets`) | `/architect` cierra | `/architect` Opus | ≤ 5 |
| 5 | `developing` | Autonomous build activo iterando vs validators | `/dev-team` picks | opencode/Sonnet (Opus si agentic prod) | ≤ 3 |
| 6 | `developed` | Validators GREEN. Build cerrado, awaiting QA | `/dev-team` cierra | `/dev-team` | ≤ 10 |
| 7 | `reviewing` | Auditor QA en curso (Opus C1-C3 + Sonnet tests) | Chris triggers manual | `/auditor` | ≤ 2 |
| 8 | `done` | Auditor APPROVED + merge + capability promovida + docs | auditor APPROVED → `/pm` merge | `/pm` | rolling 90d |
| 9 | `parked` | De-prioritized, NO abandonado | manual | Chris | ∞ |
| 10 | `dropped` | Won't do (terminal) | manual | Chris | ∞ |

**Legacy exempt:** stories pre-paradigma (PI-12 sales-agent-eval) NO violan caps al migrar; cap aplica forward-only post 2026-05-06.

Outcome (epic) = agrupación semántica de stories por objetivo común. Story = work unit. Ticket = sub-unit. Outcome cierra event-driven (no time-driven). NO PI/Sprint.

### `ready` package (5 archivos autocontenidos por story)

```
docs/product/stories/{story-id}/
├── 01-spec.md              # /po-ux fusión: Gherkin + wireframes inline (UI std)
│                           # /po: service-stories (no UI)
│                           # /po + /ux-agentico: agentic-stories (spec.md + 02-design-agentic.md)
├── 03-arch.md              # /architect: technical design (incluye sub-arquitecturas BE/FE/AGENTIC)
├── 04-validators.yaml      # ★ CRITICAL ★ tests ejecutables, must_pass:true c/u
├── 05-guidelines.md        # patterns required/forbidden + files in scope + skills/rules a cargar
├── 06-tickets.yaml         # T-1, T-2, ... work units atómicos
└── checkpoint.md           # state + phase + next_action vivo
```

Tickets flat dentro: `T-{n}-impl-log.md`, `T-{n}-result.md`, `T-{n}-review.md`. Si > 10 tickets → story es demasiado grande, split.

### Flujo extremo-a-extremo (3 conversaciones)

```
Conv 1 — DISCOVERY + READY  (Chris + /pm + /po-ux + /architect)
  → idea (ideas-pool.yaml + opcional 00-research.md)
  → [Chris "refinemos"] → refining (/po-ux | /po | /ux-agentico drafts 01-spec + 02-design-*)
  → [Chris ratifica] → refined
  → /architect spawna /architect-{be,fe,agentic} en paralelo → 03-arch.md
  → /architect emite 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml
  → state=ready

Conv 2 — AUTONOMOUS BUILD   (opencode + Sonnet iterando contra validators)
  → /dev-team toma 06-tickets.yaml ticket-por-ticket
  → loop: implement → run validators → fix targeted file → repeat hasta GREEN o cap_reached
  → on GREEN: state=developing→developed
  → on cap reached: state=developing→blocked, escalate Chris

Conv 3 — REVIEW + MERGE     (Chris triggers /auditor + /pm merge)
  → state=developed → reviewing (manual por Chris)
  → /auditor spawna auditor-{be,fe,agentic}
  → CHECKPOINTS.md C1-C5 grid: Code | Spec | Architecture | Cross-cutting | Trace
  → APPROVED → /pm aplica merge → scenarios migran a capability → story archive a docs/archive/{year}/
  → state=reviewing→done
```

### Cost-routing por phase (model split)

| Phase | Modelo | Razón |
|---|---|---|
| `idea`/`refining`/`refined` (research, decomposition, specs, designs) | **Opus 4.7** | Pensamiento estratégico, alto valor, baja frecuencia |
| `/architect` orchestrator + sub-architects | **Opus 4.7** | Decisiones arquitectónicas, ROI altísimo |
| `/dev-team` BE/FE no-agentic | **Sonnet/opencode** | Ejecución contra validators, barato |
| `/dev-team` agentic production code (R23) | **Opus 4.7** | Calidad agentic = experiencia usuario |
| `/auditor` C1-C3 (código + spec + arch) | **Opus 4.7** | Juicio cualitativo |
| `/auditor` tests/lint/format | **Sonnet** | Determinístico |
| `gate-runner` / `context-builder` / `commit-push` | **Haiku** | Ejecuta + parsea |

### Skills ejes

| Skill | Modelo | Rol |
|---|---|---|
| `/pm` | Opus 4.7 | Director orquesta. Owner BACKLOG.{yaml,md}, ideas-pool, outcomes/, capabilities/, modules/, learnings.md. Ratifica merges. NO redacta specs/diseño/arq/código. |
| `/po-ux` | Opus 4.7 | UI standard stories (CRUD/list/detail/form/dashboard). Produce 01-spec.md con Gherkin + wireframes inline. |
| `/po` | Opus 4.7 | Service-stories only (no UI). Spec gherkin AI-resistant. |
| `/ux-agentico` | Opus 4.7 | Agentic-story design. State machine + slot architecture + voice constraints. Produce 02-design-agentic.md. |
| `/architect` | Opus 4.7 | Orquesta /architect-{be,fe,agentic}. Produce 03-arch.md + 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml = `ready` package. |
| `/dev-team` | opencode + Sonnet (BE/FE no-agentic + tests/docs sobre agentic) o Opus 4.7 (agentic production code) | Conv 2 autonomous build. Toma 06-tickets.yaml → TDD → push. |
| `/auditor` | Opus 4.7 | Conv 3. Spawna auditor-{be,fe,agentic}. CHECKPOINTS.md C1-C5. Verdict APPROVED/CHANGES_REQUESTED/ESCALATED. |
| `/commit-push` | Haiku 4.5 | Stage + commit + push delegation pattern. Orchestrator (Opus) prepara plan, Haiku ejecuta git workflow con guardrails verbatim. |

**Hard rule (R23):** AGENTIC tickets con `production_code: true` (luana_core_copilot/luana_core_sales_agent runtime + brand vertical extensions tocando esos cores) → Opus 4.7 SIEMPRE. opencode/Sonnet ban absoluto. AGENTIC tickets con `production_code: false` (tests/docs sobre agentic) → Sonnet OK.

### Resume protocol

`BACKLOG.md` es SSoT visible — UN read da estado completo:

```bash
git status --short && git branch --show-current && git log --oneline -3
cat docs/product/BACKLOG.md     # Roadmap + Mermaid kanban + Caps snapshot
```

Para drill-down a story específica:

```bash
cat docs/product/stories/{story-id}/checkpoint.md
```

Schema checkpoint: `docs/process/checkpoint-protocol.md`. Detalle paradigma + waves: `docs/process/pm-redesign-2026-05.md`. Plan multibrand: `docs/architecture/luana-platform/01-core-audit.md`.

### Anti-telephone-game (subagent return contract)

Cada subagent (builder-*, auditor-*, gate-runner, context-builder) MUST devolver UNA línea final:

```
<verdict> -> <path-to-artifact>
```

Ejemplos: `done -> docs/product/stories/foo/T-1-result.md`, `blocked -> docs/product/stories/foo/checkpoint.md`, `failed -> tests/scripts/test_x.py:42`.

NUNCA inline >500 tokens de artifact body. Caller lee file on demand.

## Brand → Core mapping (Extension SDK)

| Module conceptual | Verdict | Core package | Brand extension surface |
|---|---|---|---|
| `iam`, `core`, `crm`, `assets`, `commercial_calendar`, `tenant_domains`, `tenant_profile`, `social_proof`, `idempotency`, `events`, `compliance`, `billing`, `channels`, `llm`, `observability`, `extension-sdk`, `extraction` | **CORE-FULL** | `luana-core-{x}` | n/a (idéntico cross-brand) |
| `copilot` | **ENGINE + BRAND-EXTENSION** | `luana-core-copilot` | `{brand}/backend/src/modules/{brand}/copilot/{extractors,tools,workflows,kb}/` |
| `sales_agent` | **ENGINE + BRAND-EXTENSION** | `luana-core-sales-agent` | `{brand}/backend/src/modules/{brand}/sales_agent/tools/` + `personas/` + `goldens/` |
| `brand` | **ENGINE + BRAND-CONFIG** | `luana-core-brand-studio` | `{brand}/config/brand.yaml` (enabled_sections + field_overrides + preset_pack) |
| `offer` | **ENGINE + BRAND-CONFIG** | `luana-core-offer-studio` | preset packs registrados via Extension SDK EP-2 |
| `analytics` | **ENGINE + BRAND-CONFIG** | `luana-core-analytics-engine` | enabled_metrics + channel_groups per-brand |
| `campaigns` | **ENGINE + BRAND-CONFIG** | `luana-core-campaigns` | brand activa CampaignTemplateDefs via EP-7 |
| `landing` | **ENGINE + BRAND-CONFIG** | `luana-core-landing` | LandingTemplateDefs via EP-12 |
| `scheduling` | **ENGINE + BRAND-EXTENSION** | `luana-core-scheduling` (futuro, hoy en `luana-core-platform`) | BookingPolicyDef per-brand |
| `connections` | **ENGINE + BRAND-EXTENSION** | `luana-core-connections` | ChannelAdapterDef per-brand (Lupulo POS/KDS, Vitalia payment gateway, Retailly Shopify/WooCommerce, Guestly OTAs Airbnb/Booking, SaaSora Stripe subscriptions, etc.) |
| `advertising`, `social_media` | **DROP** | n/a | Placeholder, no implementación |

**Extension SDK SSoT:** `core/luana-core-extension-sdk/src/luana_core_extension_sdk/extension_points.py::ExtensionPointRegistry` (EP-1..EP-18). Cada brand monta sus extensiones via `modules/{brand}/extensions.py::register_all(registry)`. Per `.claude/rules/anti-duplication.md` § lift shared rule — mirroring de patrones cross-brand está prohibido.

## 10 Brand verticals catalog

| Brand | Vertical | Cliente objetivo | Diferenciación core | Estado |
|---|---|---|---|---|
| **Nicolify** | Agencias y Servicios B2B | Agencias marketing, software boutique, consultoras | CRM ciclo largo · portal cliente · propuestas/contratos · horas facturables | ✅ shipped (caso canónico) |
| **Vitalia** | Salud y Bienestar | Clínicas médicas, dentales, estéticas | Reservas prepagadas · historial médico · HIPAA-lite · seguimiento post-tratamiento | ✅ shipped (Story 11) |
| **Comunify** | Creator Economy + Educación | Coaches, creadores contenido, infoproductores | Escalera valor · bóveda autoridad · motor comunidad · embudos venta | ✅ shipped (Story 12) + WIP recovery |
| **Lupulo Labs** | Gastronomía | Restaurantes, bares, cafeterías | Reservas mesa · pedidos digitales · integración KDS vía agentes IA | 🟡 placeholder (Story 13 pendiente) |
| **SaaSora** | SaaS y Productos Digitales | Startups tech, micro-SaaS, software | Onboarding automatizado · subscripciones Stripe · dashboards Churn/MRR · changelogs | ⏳ bootstrap pendiente |
| **InmoFlow** | Real Estate (Inmobiliaria) | Brokers, agencias bienes raíces | Integración portales · mapas interactivos · lead routing por zona · calculadoras financieras | ⏳ bootstrap pendiente |
| **Retailly** | E-commerce / D2C | Tiendas online, marcas productos físicos | Catálogos dinámicos · cart recovery · integración logística · cross-selling checkout | ⏳ bootstrap pendiente |
| **Fixia** | Servicios Hogar + Oficios | Plomeros, electricistas, HVAC, reformas | Técnicos en campo · cotización on-site · reseñas locales SEO automatizadas | ⏳ bootstrap pendiente |
| **Guestly** | Turismo + Hotelería | Hoteles boutique, rentas vacacionales, tours | Motor reservas por temporada · sync OTAs (Airbnb/Booking) · guest experience | ⏳ bootstrap pendiente |
| **FitFlow** | Fitness y Deporte | Gimnasios, estudios yoga, boxes | Facturación recurrente membresías · control aforo · calendario clases · waivers | ⏳ bootstrap pendiente |

**Bootstrap pattern para brand nueva:** seguir Story 11 (vitalia) o Story 12 (comunify):
1. Crear workspace dir `{brand}/{backend,frontend,config,deploy}/`
2. Brand config `{brand}/config/brand.yaml` (compliance_level, enabled_sections, preset_pack, feature flags)
3. Extension mount `{brand}/backend/src/modules/{brand}/extensions.py::register_all(registry)` montando EP-1..EP-18
4. Brand-specific extensions: copilot/{extractors,tools,workflows,kb}, sales_agent/{tools,personas,goldens}, channel adapters
5. Migrations idempotent en `{brand}/backend/src/modules/{brand}/persistence/migrations/`
6. Frontend en `{brand}/frontend/` (Next.js 16 + FSD-Lite)
7. Deploy K8s manifests en `{brand}/deploy/`

## Critical Rules (auto-loaded)

| # | Trigger | File |
|---|---|---|
| 1 | Anti-hallucination | leer `docs/domains/INDEX.md` antes coding (snapshot, single-brand perspective) |
| 2 | Tenant isolation | `.claude/rules/tenant-isolation.md` |
| 3 | BE DDD | `.claude/rules/backend-ddd.md` |
| 4 | FE FSD | `.claude/rules/frontend-fsd.md` |
| 5 | Migrations idempotentes | `.claude/rules/backend-migrations.md` |
| 6 | Git/Conventional Commits | `.claude/rules/git-safety.md` |
| 7 | Parallel safety multi-instancia | `.claude/rules/parallel-safety.md` (canonical en `docs/process/parallel-sessions-protocol.md`) |
| 8 | TDD obligatorio | `.claude/rules/tdd-mandatory.md` |
| 9 | Debugging | `.claude/rules/debugging.md` |
| 10 | Spanish neutro LatAm | `.claude/rules/spanish-text.md` |
| 11 | PII (`response_model=`) | `@AGENTS.md` → Tessl pii-sanitisation |
| 12 | Anti-duplication (cross-brand mirror ban) | `.claude/rules/anti-duplication.md` |
| 13 | Ticket states + checkpoint protocol + crash recovery | `docs/process/{ticket-states,checkpoint-protocol}.md` |
| 14 | Auditor downstream regression scope | `.claude/rules/auditor-downstream-regression.md` |
| 15 | Hot-fix repro mandatory | `.claude/rules/hotfix-repro-mandatory.md` |
| 16 | Git Haiku delegation (commit+push pattern) | `.claude/rules/git-haiku-delegation.md` |

## Conditional Rules (stub → skill)

| Tocas | Skill | Stub |
|---|---|---|
| `core/luana-core-copilot/` o `{brand}/backend/src/modules/{brand}/copilot/` | `copilot-expert` | `rules/copilot-{resilience,observability}.md` |
| `core/luana-core-sales-agent/` o `{brand}/backend/src/modules/{brand}/sales_agent/` | `sales-agent-expert` | `rules/sales-agent-brand-voice.md` |
| `core/luana-core-offer-studio/` catalogs | `offer-expert` / `offer-type-preset-expert` | `rules/offer-catalogs.md` |
| `core/luana-core-analytics-engine/` ETL | `metrics-expert` | `rules/{etl-extraction-contract,analytics-metrics,data-reliability}.md` |
| `core/luana-core-brand-studio/` | `brand-expert` | — |
| BE quality/master-data/currency/arch-fitness | `backend-expert` | `rules/{backend-quality,master-data,currency-handling,architectural-fitness}.md` |
| FE quality/form-runtime | `frontend-expert` / `brand-expert` | `rules/{frontend-quality,form-runtime-array}.md` |
| Streamlit admin | `backend-expert` | `rules/admin-panel.md` |
| E2E Playwright + Clerk auth + smoke tests | `playwright-expert` | `rules/e2e-testing.md` |
| PM/SSoT funcional | `pm` skill | `docs/product/BACKLOG.md` + `docs/product/{outcomes,stories,ideas-pool.yaml}` |
| BE config flag flips (`core/config.py` defaults) | (none — `pm` skill ratification) | `rules/anti-default-flip-audit.md` |
| User story redacción (UI std) | `po-ux` skill | `docs/specs/templates/01-spec-template.md` |
| User story redacción (service-only) | `po` skill | `docs/specs/templates/01-spec-template.md` |
| Conversational flow design | `ux-agentico` skill | `docs/specs/templates/02-design-agentic-template.md` |
| Tech architecture + ready package | `architect` skill | `docs/specs/templates/03-arch-template.md` + `04-validators.yaml` + `05-guidelines.md` + `06-tickets.yaml` |
| Code implementation (autonomous build) | `dev-team` skill | `docs/specs/templates/T-handoff-template.md` |
| Code review (Conv 3) | `auditor` skill | `docs/specs/templates/T-review-template.md` |
| Process metrics emission | `dev-team` + `auditor` | `scripts/emit_process_metric.py` + `docs/process/metrics/README.md` |
| Hot-fix ticket origen handoff doc | `dev-team` + `po` | `.claude/rules/hotfix-repro-mandatory.md` |
| Backlog freshness | `pm` skill bootstrap + pre-commit hook Section 6 | `scripts/generate_backlog.py` |
| Capability reconciliation | `pm` skill | `scripts/reconcile_capabilities.py` |
| Multibrand carve-out (extracción a luana-core) | `architect` skill | `docs/architecture/luana-platform/01-core-audit.md` |

## Vision

`docs/product/vision.md` (snapshot legacy hasta /pm regenerar live). Glossary: `docs/product/glossary.md`. Story-map backbone: `docs/product/story-map/backbone.md`. Plan multibrand: `docs/architecture/luana-platform/01-core-audit.md` + ADR-001.

## Workspace bootstrap (fresh clone)

```bash
# 1. Toolchain (user-local)
curl -LsSf https://astral.sh/uv/install.sh | sh                                  # uv
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash  # nvm
nvm install 20 && corepack enable && corepack prepare pnpm@9.15.9 --activate    # node + pnpm

# 2. Deps
uv sync          # Python workspace (todos los luana-core-* + brand backends editables)
pnpm install     # TS workspace (todos los frontends + cores TS)

# 3. Docker dev stack
docker compose -f docker-compose.dev.yml up -d   # postgres on 127.0.0.1:5435

# 4. Verify
.venv/bin/python -c "import luana_core_extension_sdk, luana_core_platform; print('OK')"
cd comunify/backend && /home/.../.venv/bin/pytest tests/ --override-ini="addopts=" -q   # subset
```

User must be in `docker` group (`sudo usermod -aG docker $USER` + re-login).

@AGENTS.md
