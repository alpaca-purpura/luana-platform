---
story_id: vitalia-slice-1-fidelizacion
outcome: vitalia-mvp-ui-foundation
parent_spec: vitalia-ux-discovery (archived 2026-05-20 — inheritance carryover)
state: refined
phase: REPLAN_AWAITING_ARCHITECT_REFRESH
last_artifact: 02-design-ui-mockup.html (heredado parent) + audit-2026-05-20 (parent archive)
last_modified: 2026-05-20
ratified_by_chris: true
spawned_at: 2026-05-17
spawned_by: /pm-vitalia (split decision post /architect ready package)
parallel_safe: true
ola_assigned: 1
ola_rationale: "Auto-contenida, sin side blockers. Reuso fuerte nicolify/campaigns-lite + nicolify/notifications + core/luana-core-campaigns workers + cron_envelope core post lift."
ticket_subset_inherited: [T-fidelizacion-1, T-fidelizacion-2, T-fidelizacion-3, T-fidelizacion-4, T-fidelizacion-5, T-fidelizacion-6, T-fidelizacion-7]
blocker_dependencies: []                     # infra-cross-cutting DONE 2026-05-18
side_story_blockers: []
preflight_gates_required:
  - clerk_organizations_enabled
  - clerk_test_users_3_created
  - playwright_storage_state_generated
  - playwright_smoke_suite_green_23_specs
  - promotion_proposal_core_platform_extensions_slice_1_migrated
priority: high
estimated_dev_weeks: 2-3
next_action: "REPLAN 2026-05-20 ratified Chris. AWAITING /architect refresh tras pre-flight gates GREEN. /architect produce ready package propio acotado: 4 patrones re-engagement + NPS stat card + 6 cron jobs. Reuso explícito: nicolify/campaigns-lite + notifications + core/luana-core-campaigns workers + cron_envelope core (re-engagement crons idempotent) + CompoundScopeRepositoryBase core (PHI re_engagement_events)."
---

# vitalia-slice-1-fidelizacion — checkpoint

## Goal

Ruta `/fidelización` Slice 1: 4 patrones re-engagement automatizado (multi-sesión + follow-up médico + mantenimiento periódico + ausencia prolongada) + NPS reducido stat card secundaria + 6 cron jobs scheduled. Detalle deferred a Slice 2: dashboard NPS completo (4 KPIs + chart + detractor flow + Google Reviews + birthday cron + doctor view).

## Mockup heredado (SSoT visual)

`02-design-ui-mockup.html` — copia del parent ratificado Chris 2026-05-17. Build respeta paleta 4 colores + chat-RIGHT rail + sidebar progresivo v3.

## Reuso explícito (Slice 1)

| Surface | Reuso de | Razón |
|---|---|---|
| FE re-engagement cards + segments | `nicolify/frontend/src/features/campaigns-lite/` | campaigns-lite es el patrón Nicolify equivalente |
| FE notification dispatch | `nicolify/frontend/src/features/notifications/` | reuso notification rendering |
| BE workers re-engagement scheduling | `core/luana-core-campaigns/workers/{scheduler_tick,execution_task,segment_refresh_tick,audit_retention_task}.py` | engine ya tiene worker batch — vitalia añade brand-specific patterns via EP |
| BE cron envelope (idempotency + OTel + audit + sentry) | `core/luana-core-platform/workers/cron_envelope` (post lift combinado 2026-05-20) | reemplaza vitalia/_shared/workers/base.py |
| BE PHI dual-filter queries (re_engagement_events PHI encrypted) | `core/luana-core-platform/repositories/CompoundScopeRepositoryBase` (post lift) | reemplaza vitalia/_shared/repositories/phi_repository.py |
| BE NPS events | `core/luana-core-events/` (NPSCollected domain event) | engine event bus |

## Side stories paralelas relevantes

Ninguna — `/fidelización` arranca sin side blockers.

## HANDOFF-cross-story coordination

Ola 1 fidelización + inbox NO comparten contratos directos. Pero ambas consumen `CompoundScopeRepositoryBase` + `cron_envelope` post lift core — refactor cross-story esperable cuando lift merge.

Ver `vitalia/docs/product/outcomes/vitalia-mvp-ui-foundation/HANDOFF-cross-story.md` para coordinación full Slice 1.

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story
- 2026-05-20 REPLAN: Ola 1 asignada paralela con inbox. Pre-flight gates + lift core requirements documentados.
