# CLAUDE.md

**luana-platform** — Multi-brand multitenant SaaS. Modular Monolith DDD + uv/pnpm workspace + Docker-First. **10 brand verticals** consumen engine compartido `core/` (Luana, 26 paquetes `luana-core-*`).

@AGENTS.md cubre stack/commands/native-first/skills/quality/constraints. Este file = overlay project-specific.

**Topología completa + workspace tooling + paradigm v4 detail + 10 brand verticals catalog + cost-routing + bootstrap completo + skills detail:** ver `docs/rules-detail/_CLAUDE-original-backup.md` (load con Read on-demand).

## Topology (1-liner)

```
luana-platform/
├── core/luana-core-{26 paquetes}/   ← engine SSoT
├── {vitalia,nicolify,comunify,lupulo}/{backend,frontend,config}/   ← 4 brands activas
├── {saasora,inmoflow,retailly,fixia,guestly,fitflow}/   ← 6 brands pendientes bootstrap (template _pm-brand-template)
├── docs/   ← transversales Luana (portfolio + promotion-protocol + core-modules + process + specs + architecture)
└── scripts/   ← framework
```

Por-brand: `{brand}/docs/` = SSoT autónomo. Vista master cross-brand: `docs/portfolio/PORTFOLIO.md` (auto-gen via `make portfolio`).

## Workspace tooling (esenciales)

| Stack | Manager | Workspace |
|---|---|---|
| Python 3.12 | **uv** | `[tool.uv.workspace]` en root `pyproject.toml` (27 members editable) |
| TypeScript | **pnpm 9.15.9** | `pnpm-workspace.yaml` (core + 4 brand frontends) |
| Runtime | **Docker Compose** per brand (`make dev-{brand}` o `make dev-all`) | postgres compartido :5435 |

**Venv at workspace root** — `.venv/bin/{python,pytest,ruff}`. NUNCA `cd {brand}/backend && python -m venv .venv` (rompe resolución `luana_core_*`).

**Port allocation:** nicolify=8001/3001, vitalia=8002/3002, comunify=8003/3003, lupulo=8004/3004.

## SDD Level 3 — vocabulario v4 (cementado 2026-05-06)

10 estados macro unificados cross-nivel (idea/outcome/story/capability):

| # | Estado | Owner | WIP cap |
|---|---|---|---|
| 1 | `idea` | Chris + `/pm-*` | ∞ |
| 2 | `refining` | `/pm-*` + `/po-ux`/`/po`/`/ux-agentico` | ≤ 3 |
| 3 | `refined` | `/pm-*` cierra | ≤ 5 |
| 4 | `ready` | `/architect` cierra (paquete completo: 03-arch + 04-validators + 05-guidelines + 06-tickets) | ≤ 5 |
| 5 | `developing` | `/dev-team` (opencode/Sonnet, Opus si agentic prod) | ≤ 3 |
| 6 | `developed` | `/dev-team` + AUTO-HANDOFF `/auditor` | ≤ 1 |
| 7 | `reviewing` | `/auditor` + AUTO-HANDOFF `/pm-{brand}` merge si APPROVED | ≤ 1 |
| 8 | `done` | `/pm-*` merge | rolling 90d |
| 9 | `parked` | Chris | ∞ |
| 10 | `dropped` | Chris (terminal) | ∞ |

Paradigm full + flujo 3 conversaciones + cost-routing + skills ejes + ready package schema: `docs/process/pm-redesign-2026-05.md` + `docs/rules-detail/_CLAUDE-original-backup.md` § "Vocabulary".

**★ Story closure gate** (post 2026-05-18): story en `state: developed`/`reviewing` NO puede abandonarse para arrancar otra. `/dev-team` cerrar `developed` → AUTO-HANDOFF `/auditor`. APPROVED → AUTO-HANDOFF `/pm-{brand}` merge. Escape valve: `checkpoint.md::defer_audit: true` con razón documentada + Chris ratify. SSoT: `.claude/rules/story-closure-gate.md`.

## 10 Brand verticals (quick reference)

| Brand | Vertical | Estado |
|---|---|---|
| **Nicolify** | Agencias + Servicios B2B | ✅ shipped |
| **Vitalia** | Salud + Bienestar (HIPAA-lite) | ✅ shipped |
| **Comunify** | Creator Economy + Educación | ✅ shipped |
| **Lupulo Labs** | Gastronomía (KDS + reservas) | 🟡 placeholder |
| **SaaSora** | SaaS/Productos digitales | ⏳ bootstrap pendiente |
| **InmoFlow** | Real Estate | ⏳ bootstrap pendiente |
| **Retailly** | E-commerce/D2C | ⏳ bootstrap pendiente |
| **Fixia** | Servicios Hogar + Oficios | ⏳ bootstrap pendiente |
| **Guestly** | Turismo + Hotelería | ⏳ bootstrap pendiente |
| **FitFlow** | Fitness + Deporte | ⏳ bootstrap pendiente |

Bootstrap brand nueva: pattern Story 11 (vitalia) o Story 12 (comunify) → ver `_pm-brand-template/SKILL.md` + `docs/rules-detail/_CLAUDE-original-backup.md` § "Bootstrap pattern".

## Brand → Core mapping (Extension SDK)

3 categorías de módulo: **CORE-FULL** (idéntico cross-brand), **ENGINE + BRAND-EXTENSION** (copilot, sales_agent, scheduling, connections), **ENGINE + BRAND-CONFIG** (brand-studio, offer-studio, landing, analytics, campaigns). Tabla completa con paths: `docs/rules-detail/_CLAUDE-original-backup.md` § "Brand → Core mapping".

Extension SDK SSoT: `core/luana-core-extension-sdk/src/luana_core_extension_sdk/extension_points.py::ExtensionPointRegistry` (EP-1..EP-18). Cross-brand mirror prohibido — ver `.claude/rules/anti-duplication.md`.

## Git Workflow (1-liner)

**Triple-branch:** `wip/{slug}` (autosave per worktree) → `main` (integración, **staging deploy MANUAL**) → `release/{brand}-vX.Y.Z` (único auto-deploy prod).

**Worktrees obligatorios** para sesiones paralelas: `scripts/git/new-session.sh {brand} story {slug} [lane]`. Dashboard: `scripts/git/status-all.sh`. Cleanup: `scripts/git/cleanup-session.sh`. M11: nunca >30 min sin push.

**Forbidden:** `git pull`, `git fetch && merge`, `git push --force`, `git revert` sin aprobación, `git add .` / `-A`, `git commit --no-verify`. Push non-fast-forward → STOP.

Detail: `.claude/rules/git-safety.md` + `.claude/rules/parallel-safety.md` + `docs/architecture/luana-platform/ADR-{004,005}*.md`.

## Critical Rules (auto-loaded de `.claude/rules/`)

| # | Trigger | File |
|---|---|---|
| 1 | Anti-hallucination | leer `docs/portfolio/PORTFOLIO.md` o `{brand}/docs/product/checkpoint.md` antes coding |
| 2 | Tenant isolation | `tenant-isolation.md` |
| 3 | BE DDD | `backend-ddd.md` |
| 4 | FE FSD | `frontend-fsd.md` |
| 5 | Migrations idempotentes | `backend-migrations.md` |
| 6 | Git/Conventional Commits | `git-safety.md` |
| 7 | Parallel safety multi-instancia | `parallel-safety.md` |
| 8 | TDD obligatorio | `tdd-mandatory.md` |
| 9 | Debugging | `debugging.md` |
| 10 | Spanish neutro LatAm | `spanish-text.md` |
| 11 | PII (`response_model=`) | `@AGENTS.md` → Tessl pii-sanitisation |
| 12 | Anti-duplication (cross-brand mirror ban) | `anti-duplication.md` |
| 13 | Ticket states + checkpoint protocol | `docs/process/{ticket-states,checkpoint-protocol}.md` |
| 14 | Auditor downstream regression | `auditor-downstream-regression.md` |
| 15 | Hot-fix repro mandatory | `hotfix-repro-mandatory.md` |
| 16 | Git Haiku delegation | `git-haiku-delegation.md` |
| 17 | Story closure gate (developed→reviewing→done auto) | `story-closure-gate.md` |
| 18 | Brand docs schema (R1+R2+R3) | `brand-docs-schema.md` |
| 19 | Auditor self-fix policy | `auditor-self-fix-policy.md` |
| 20 | Anti default-flip audit | `anti-default-flip-audit.md` |
| 21 | PM skill chaining (Skill tool inline) | `pm-skill-chaining.md` |

## Conditional Rules (stub → skill on-demand)

| Tocas | Skill | Stub rule |
|---|---|---|
| Vista portfolio / cross-brand / core / promotion gate | `/pm-luana` (alias `/pm`) | `docs/portfolio/` + `docs/promotion-protocol/` + `docs/core-modules/` |
| PM brand-specific (×4 + 6 templates) | `/pm-{brand}` | `{brand}/docs/product/` |
| Bootstrap brand nueva | `_pm-brand-template/` | scaffold workflow |
| User story UI std | `/po-ux` | `docs/specs/templates/01-spec-template.md` |
| User story service | `/po` | idem |
| Conversational flow design | `/ux-agentico` | `docs/specs/templates/02-design-agentic-template.md` |
| Tech architecture + ready package | `/architect` | `03-arch + 04-validators + 05-guidelines + 06-tickets` templates |
| Autonomous build (Conv 2) | `/dev-team` | `T-handoff-template.md` |
| Code review (Conv 3) | `/auditor` | `T-review-template.md` |
| `core/luana-core-copilot/` o `{brand}/.../copilot/` | `copilot-expert` | `copilot-{resilience,observability}.md` |
| `core/luana-core-sales-agent/` o `{brand}/.../sales_agent/` | `sales-agent-expert` | `sales-agent-brand-voice.md` |
| `core/luana-core-offer-studio/` | `offer-expert` / `offer-type-preset-expert` | `offer-catalogs.md` |
| `core/luana-core-analytics-engine/` ETL | `metrics-expert` | `{etl-extraction-contract,analytics-metrics,data-reliability}.md` |
| `core/luana-core-brand-studio/` | `brand-expert` | — |
| BE quality/master-data/currency/arch-fitness | `backend-expert` | `{backend-quality,master-data,currency-handling,architectural-fitness}.md` |
| FE quality/form-runtime | `frontend-expert` / `brand-expert` | `{frontend-quality,form-runtime-array}.md` |
| Streamlit admin | `backend-expert` | `admin-panel.md` |
| E2E Playwright + Clerk | `playwright-expert` | `e2e-testing.md` |
| Worktree protocol (consulta/troubleshoot) | `worktree-protocol` | `parallel-safety.md` + `step-0-worktree.md` |
| Commit + push delegation Haiku | `commit-push` | `git-haiku-delegation.md` |

## Resume protocol

```bash
git status --short && git branch --show-current && git log --oneline -3
cat docs/portfolio/PORTFOLIO.md             # Vista master 11 universos
cat {brand}/docs/product/checkpoint.md      # State brand
cat {brand}/docs/product/stories/{id}/checkpoint.md   # Story específica
```

Schema checkpoint: `docs/process/checkpoint-protocol.md`. Paradigma v4: `docs/process/pm-redesign-2026-05.md`. Promotion workflow: `docs/promotion-protocol/README.md`.

## Workspace bootstrap (fresh clone)

```bash
# 1. Toolchain
curl -LsSf https://astral.sh/uv/install.sh | sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20 && corepack enable && corepack prepare pnpm@9.15.9 --activate

# 2. Deps + hooks
uv sync && pnpm install && make install-hooks

# 3. Dev stack per brand
cp {brand}/.env.dev.template {brand}/.env.dev
make dev-{brand}    # o make dev-all

# 4. Verify
.venv/bin/python -c "import luana_core_extension_sdk, luana_core_platform; print('OK')"
curl http://127.0.0.1:8002/health   # vitalia ejemplo
```

Bootstrap detail completo + troubleshooting: `docs/process/docker-dev-multibrand.md` + `docs/architecture/luana-platform/ADR-003*.md`.

## Anti-telephone-game (subagent return contract)

Cada subagent (builder-*, auditor-*, gate-runner, context-builder) MUST devolver UNA línea final: `<verdict> -> <path-to-artifact>`. NUNCA inline >500 tokens de artifact body. Caller lee file on demand.

## Vision

`docs/product/vision.md` (snapshot legacy hasta `/pm-luana` regenere). Glossary: `docs/product/glossary.md`. Plan multibrand: `docs/architecture/luana-platform/01-core-audit.md` + ADR-001.

@AGENTS.md
