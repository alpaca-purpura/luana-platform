---
story_id: vitalia-slice-1-infra-cross-cutting
outcome: vitalia-mvp-ui-foundation
parent_spec: vitalia-ux-discovery
state: developing
phase: T_INFRA_1_PUSHED_T_INFRA_2_NEXT
last_artifact: T-infra-1-result.md (state=pushed commit 1194941, 93/93 static PASS, 166 arch fitness PASS)
last_modified: 2026-05-18
dev_team_started_at: 2026-05-18
tickets_pushed: [T-arch-1, T-infra-1]
tickets_remaining: [T-infra-2, T-infra-3, T-infra-4, T-infra-5, T-infra-6, T-infra-7, T-infra-8, T-infra-9]
next_ticket_unblocked: T-infra-2 (Extension SDK 5 NEW registries + extensions.py real handlers placeholders)
ratified_by_chris: true
spawned_at: 2026-05-17
spawned_by: /pm-vitalia (split decision post /architect ready package)
parallel_safe: true
ticket_subset: [T-arch-1, T-infra-1, T-infra-2, T-infra-3, T-infra-4, T-infra-5, T-infra-6, T-infra-7, T-infra-8, T-infra-9]
blocker_dependencies: []
side_story_blockers: []
priority: critical
estimated_dev_weeks: 1
next_action: "/dev-team picks T-arch-1 first (ADR + design tokens cement). NO blockers. After T-infra-* migrations BLOCKED until /pm-luana ratifies 2 promotion proposals (engine modify): tenants location columns + offers multi-session/maintenance columns."
---

# vitalia-slice-1-infra-cross-cutting — checkpoint

## Goal

Foundation cross-cutting infra Slice 1 Vitalia (sub-story split del mega-story `vitalia-ux-discovery`). Sin blockers ni dependencies side stories — `/dev-team` arranca acá primero.

## Scope

10 tickets del slice infra-cross-cutting (T-arch-1 + T-infra-1..T-infra-9). Detalle en `../vitalia-ux-discovery/06-tickets.yaml` § sub_story: vitalia-slice-1-infra-cross-cutting.

- **T-arch-1**: ADR-vitalia-001 shared-vs-fork decision + globals.css design tokens cement
- **T-infra-1..T-infra-9**: 11 nuevas tablas + 5 column additions + 5 Extension SDK registries + 11 cron jobs + audit_log infra + pgcrypto encryption columns PHI

## Inherited ready package

Sub-story consume `parent_spec` artifacts (NO duplicar):
- `../vitalia-ux-discovery/03-arch.md` + `03-arch-be.md` + `03-arch-fe.md` + `03-arch-agentic.md`
- `../vitalia-ux-discovery/04-validators.yaml` (slice tickets validators)
- `../vitalia-ux-discovery/05-guidelines.md`
- `../vitalia-ux-discovery/06-tickets.yaml` § sub_story tabla

## Pre-requisitos

- `/pm-luana` ratifica 2 promotion proposals NEW (BLOCKED hasta accepted/migrated):
  - `docs/promotion-protocol/proposals/2026-05-17-platform-tenants-location-columns.md`
  - `docs/promotion-protocol/proposals/2026-05-17-offer-studio-multi-session-maintenance.md`

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story vitalia-ux-discovery. Sub-story state=ready (inherits parent package). Primera sub-story sin blockers — /dev-team arranca acá.
- **2026-05-18 sesión /pm-vitalia close-slice-1 · Fase D arranque** — state ready→developing. /dev-team picked T-arch-1 first (foundation, no blockers, Sonnet eligible, production_code=false). Spawned builder-frontend Sonnet → produjo ADR-vitalia-001-shared-vs-fork.md (NEW ~120 LOC, fork físico Slice 1 decision documented) + vitalia/frontend/src/app/globals.css (NEW ~60 LOC, :root CSS vars 5 brand + 9 neutrals + 4 semantic + 3 gradients en HSL channels) + tailwind.config.ts (MODIFY, replace SEED tokens con 18 oficiales consuming CSS vars) + vitalia/frontend/src/app/layout.tsx (MODIFY add import globals.css). Commits: d6f01b6 (work) + dc35339 (result SHA pin). Gate-runner Haiku verificó independent: fe_typecheck_tsc PASS (0 errors) + fe_lint_eslint PASS (0 errors 0 warnings --max-warnings=0) + fe_arch_fitness PASS (18/18 tests, 0.331s, 1 file). gate-output.json: any_fail=false all_pass=true (45s total duration). T-arch-1 state: pushed. Next unblocked: T-infra-1 (Migrations 002-016 idempotent Slice 1 — 15 Alembic migrations 11 tables + 8 column additions, blocked_by=T-arch-1 satisfied, prerequisites met Fase A engine lift commit 5ca6101 unblocks T-be-migration-014+015 sub-tasks).
- **2026-05-18 T-infra-1 PUSHED** — builder-backend Sonnet. 15 Alembic migrations (002-016) + smoke test file `test_slice1_migrations.py` (93 static PASS, 8 integration SKIP). 12 new tables + 4 column additions. HIPAA-lite: vitalia_audit_log PARTITION BY RANGE + payload_redacted BYTEA + NO deleted_at + monthly partitions 2026-04..2026-08. pgcrypto BYTEA on treatment_plans.notes + re_engagement_events.payload_phi + channel_sync_state.oauth_token_encrypted. TenantLocationContract (014) + OfferAdherenceContract+MaintenanceScheduleEnum (015) + marketing consent (016). Validators: be_lint_ruff_check PASS · be_format_ruff PASS · be_arch_fitness_brand 166/166 PASS · be_test_migrations_smoke 93/93 PASS. Commit: 1194941, branch: wip/vitalia-slice-1-shipping. Next: T-infra-2 (Extension SDK registries).
