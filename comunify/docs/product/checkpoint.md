---
brand: comunify
vertical: "Creator Economy + Educación"
status: shipped
last_updated: 2026-05-18
active_outcomes:
  - dev-stack-cross-brand-fixes              # outcome platform — comunify cerró su milestone 2026-05-17 (Playwright smoke 3/3 GREEN); outcome continúa active hasta nicolify + lupulo cierren sus análogos
active_stories:
  - id: comunify-warning-token-contrast-fix
    state: idea
    surface: [frontend, design-system]
    opened: 2026-05-18
    origin: auditor-frontend WARN on comunify-design-system-cement (WCAG AA contrast bg-comunify-warning + text-white = 1.80:1)
ssot_owner: /pm-comunify
---

# Comunify — checkpoint

> Estado actual del brand. Actualizado por `/pm-comunify` en cada transición.

## Estado funcional shipped (2026-05-16 inventory)

Story 12 (`luana-comunify-bootstrap`, mergeada 2026-05-15) shipped **17 capabilities en 11 módulos** — backend completo + frontend dashboard + 4-step onboarding wizard + voice cloning pipeline (D8 ON, NEW vs Vitalia) + 3 fixtures LATAM creator (Anabella AR / Trini CL / Pablo MX) + community moderation rails + recurring subscriptions + Dunning workflow embedded. Ver `comunify/docs/product/capabilities/` para detalle por módulo.

**Test coverage:** 102 backend tests (15 unit + 12 integration + 9 architecture + 3 infrastructure + 6 e2e + 55 agentic_evals — workflows + tools + smoke + voice_cloning + kb_pack + cache + cost_budget + compliance).

**Plan tiers activos:** creator (29 USD) · pro (99 USD) · agency (299 USD) — D20 cement.

**Distintivos vs Vitalia:**
- `voice_cloning_enabled: true` (D8 — pipeline 4-wave distillation 50+ chats → CompiledVoice v2)
- `compliance_level: creator_economy` (D7 — NO hipaa_lite vs Vitalia)
- Auto-approve signup (vs Vitalia clinic `pending_review`)
- 4-level offer ladder explícito (lead_magnet → tripwire → core → premium) vs Vitalia preset médico
- DunningWorkflow embedded en CohortEnrollmentWorkflow (4-state per D19)
- 4 community moderation rails (spam + nsfw + doxxing + prompt_injection)

**Diferidos a Story 12.bis (per `comunify/config/brand.yaml`):**
- `discord_circle_bridge: false` (Q3=B defer)
- `live_streaming: false`
- `gamification: false`
- `leaderboard: false`
- `multi_account_creator_switcher: false` (Q2=B defer)

## Bitácora

- 2026-05-18: **`comunify-design-system-cement` mergeada (idea→done) via /pm-comunify autonomous E2E run** (Chris pre-authorized full close, opción "Solo design-system-cement E2E" + "auto-ratificación full autónomo"). Trabajo cerrado:
  - **Spec** (Conv 1.1): 01-spec.md drafted + auto-ratified (4 Gherkin scenarios happy/negative/edge/adversarial + wireframes inline + token migration map 91 occurrences).
  - **Architect** (Conv 1.2): `architect-orchestrator` Opus → 03-arch.md + 04-validators.yaml (11 validators) + 05-guidelines.md + 06-tickets.yaml (8 tickets T-1..T-5). 8 decisiones D1-D8 documentadas. Brand overlay creator-funnels.md correctamente NO triggered (design system surface ≠ cohort/community/vault/voice).
  - **Build** (Conv 2 — 4 spawns Sonnet): T-1 (foundation: globals.css 15 vars + layout fonts Plus Jakarta Sans fallback per D2 + tailwind extend 16 slots) → T-2 (arch fitness RED baseline, 91 violations) → T-3a/b/c/d (23 archivos migrados: 9 dashboard + 7 features + 6 auth/onboarding/public + 1 utility) → T-4 (Playwright spec creado verbatim, ejecución deferida — worktree mount mismatch) → T-5 (validators bundle, gate-runner Haiku stalled → fallback inline).
  - **Audit** (Conv 3): `auditor-frontend` Opus verdict APPROVED. CHECKPOINTS C1-C5 all PASS (C4 PASS_WITH_NOTES — 1 WARN accesibilidad: `text-white` sobre `bg-comunify-warning` 1.80:1 < AA 4.5:1). 38/38 vitest GREEN, 0 stock palette violations, allowlist `[]` clean ratchet, 0 cross-brand pollution, 0 engine edits.
  - **Capability promovida:** nuevo módulo `frontend_design_system` (primera capability). `comunify/docs/product/capabilities/frontend_design_system/design-system-cement.yaml` (status: live, package_version 0.2.0).
  - **Follow-up story abierta:** `comunify-warning-token-contrast-fix` (state=idea) — fix SSoT `--comunify-warning` HSL para resolver WARN auditor (no bloqueante de merge, scope S = 1 token + ≤2 consumers).
  - **3 validators deferred a Chris post-merge:** `fe_build` (pre-existing Clerk env Story 12), `visual_smoke_design_system` + `visual_smoke_regression` (worktree mount mismatch — fix: post-merge `make dev-down-comunify && make dev-comunify` desde principal).
  - Story archivada: `comunify/docs/product/stories/comunify-design-system-cement/` → `comunify/docs/archive/2026/stories/comunify-design-system-cement/` (19 archivos snapshot inmutable).
  - Capabilities count: 17 → 18 (módulos: 11 → 12).
- 2026-05-17T20:15: **`comunify-dev-stack-functional` mergeada (refining→done)** vía Playwright smoke gate. Trabajo cerrado:
  - Receta vitalia 12 pasos replicada mecánicamente — bugs 1-13 verificados live (alembic 001_comunify head, 17 tables, /health 200 canonical, /sign-in 200 Clerk widget)
  - **Bug 14 nuevo descubierto:** named volume staleness post `comunify/pyproject.toml` bump — `comunify_backend_venv` creado pre-deps fix mantuvo `.venv` vacía → `ModuleNotFoundError: psycopg2`. Fix: `docker volume rm comunify_backend_venv` + rebuild. Learning escrito `comunify/docs/learnings/2026-05-17-named-volume-staleness-post-pyproject-bump.md` (promotable=yes — pattern cross-brand, candidato addendum `docs/process/docker-dev-multibrand.md`).
  - **Bug 15 nuevo descubierto:** Playwright runner gap parity vs nicolify — `comunify/frontend/package.json` declaraba script `test:e2e:smoke` + tenía 5 specs scaffolded pero NUNCA tenía `@playwright/test` en devDeps. Vitalia tiene mismo gap. Fix: add `@playwright/test ^1.59.1` + mirror nicolify 4 scripts pattern. Learning escrito `comunify/docs/learnings/2026-05-17-playwright-runner-parity-gap.md` (promotable=yes — fix-forward sweep candidato vitalia + lupulo bootstrap).
  - Playwright smoke creado `comunify/frontend/e2e/specs/smoke/dev-stack.smoke.spec.ts` (3 tests: BE /health shape + FE /sign-in + FE root). Verbatim: `3 passed (2.5s)`.
  - Merge artifact `comunify/docs/archive/2026/stories/comunify-dev-stack-functional/07-merge.md` con addendum receta cross-brand (paso 13 venv re-population + paso 14 Playwright runner setup).
  - Story archivada `comunify/docs/product/stories/comunify-dev-stack-functional/` → `comunify/docs/archive/2026/stories/comunify-dev-stack-functional/` (snapshot inmutable).
- 2026-05-17: **auditoría harness `/pm-luana` cross-skill override (autorización Chris explícita)** detectó gaps vs vitalia para que /pm-comunify cumpla rol. Trabajo aplicado:
  - SKILL.md `.claude/skills/pm-comunify/SKILL.md` referencias finales actualizadas (creator-funnels.md framework interpretativo + comunify/.claude/rules/README.md + brand.yaml creator_economy semantics)
  - Outcome platform `docs/product/outcomes/dev-stack-cross-brand-fixes.md` promovido state idea→refining + priority MEDIUM→HIGH + consumer_brands explícitos + canonical_recipe link
  - Story spawned: `comunify/docs/product/stories/comunify-dev-stack-functional/` state=refining con checkpoint + 00-research.md (receta canónica vitalia 07-merge.md 12 pasos + diff específico comunify)
  - Dev stack patches aplicados (replica receta vitalia paso 3-10): `comunify/pyproject.toml` deps runtime (uvicorn/fastapi/sqlalchemy/asyncpg/alembic/luana_core_*), `comunify/backend/Dockerfile` (COPY workspace pyproject + `--package luana-comunify` + intro comment block), `comunify/docker-compose.dev.yml` (UV_PROJECT_ENVIRONMENT + cd + alembic upgrade prefix), `comunify/backend/alembic/env.py` (DATABASE_URL priority + asyncpg→psycopg2 swap), `comunify/backend/src/main.py` (/health endpoint + HealthResponse DTO). Pendiente smoke verification live por Chris (`make dev-clean-comunify && make dev-comunify-tunnel && curl 127.0.0.1:8003/health`).
  - BACKLOG regenerado (3 archivos: BACKLOG.md + BACKLOG.yaml + BACKLOG-TLDR.md) — DRIFT cerrado
  - 11 modules docs creados `comunify/docs/product/modules/{m}.md` (agentic/brand_studio/cohorts/copilot/fixtures/iam/offer_studio/onboarding/payment/platform/public_landing) — paridad estructural con vitalia
  - Learning local 2026-05-16 capability-inventory-recovery escrito (referencia cross-brand al vitalia learning promotable=yes)
  - Archive dir `comunify/docs/archive/2026/stories/` creado (necesario cuando primera story brand cierre)
  - Promotion proposal `docs/promotion-protocol/proposals/2026-05-17-auto-regen-backlog-precommit.md` abierta (Section 11 pre-commit auto-regen BACKLOG cuando docs/product/** staged — lift cross-brand)
- 2026-05-15: brand topology bootstrap (F0 reorg multimarca) — Story 12 `luana-comunify-bootstrap` shipped
- 2026-05-16: story abierta `comunify-design-system-cement` state=idea — cementar tokens brandbook (morado/azul/coral/verde + Satoshi/Manrope/Inter) en `tailwind.config.ts` + `globals.css` + `layout.tsx`, migrar ~52 usos de paleta Tailwind stock a tokens `comunify-*` semánticos, arch fitness ratchet anti-stock-palette. SSoT design: `comunify/docs/architecture/design-system.md`. Inventario FE: 56 .tsx, 0 HEX hardcoded (clean slate), slots `--comunify-*` vacíos desde Story 12 (marker `T-fe-3` nunca ejecutado). Next: Chris dice "refinemos" → `/po-ux`.
- 2026-05-16: capability inventory recovery — 17 caps YAMLs escritas en `comunify/docs/product/capabilities/` desde archive (10 caps `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/capabilities/comunify/`) + código vivo (7 caps nuevas detectadas: coaching-offers-preset, creator-onboarding-4step, community-engagement-workflow, cohort-enrollment-workflow, creator-economy-agentic-tools, creator-public-landing, creator-signup-handler). Gap idéntico al detectado en vitalia 2026-05-16 (ver `vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md` + promotion proposal aceptada `docs/promotion-protocol/proposals/2026-05-16-capability-inventory-enforcement.md`). Coverage check verde: `.venv/bin/python scripts/reconcile_capabilities.py --require-capabilities-exist --brand comunify` PASS. **Cross-skill override:** ejecutado por `/pm-luana` con autorización explícita Chris (mismo plan que cerró gap nicolify carve-out audit + vitalia learning promotion). Devolución de jurisdicción a `/pm-comunify` para próximas iteraciones.
