---
brand: comunify
vertical: "Creator Economy + Educación"
status: shipped
last_updated: 2026-05-17
active_outcomes:
  - dev-stack-cross-brand-fixes              # outcome platform (docs/product/outcomes/) — comunify consumer pendiente replicación receta vitalia
active_stories:
  - id: comunify-design-system-cement
    state: idea
    surface: [frontend]
    opened: 2026-05-16
  - id: comunify-dev-stack-functional        # spawned 2026-05-17 por /pm-luana cross-skill override (auditoría harness)
    state: refining
    surface: [backend, devops]
    opened: 2026-05-17
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
