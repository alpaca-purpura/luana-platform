---
story_id: vitalia-slice-1-pipeline
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
ola_assigned: 2
ola_rationale: "Reuso fuerte nicolify/closer-studio board kanban. Depende side payment-adapter-mvp (badge depósito 30%) y consume Lucas screening tool ya shipped en vitalia-copilot-tools-impl."
ticket_subset_inherited: [T-pipeline-1, T-pipeline-2, T-pipeline-3, T-pipeline-4, T-pipeline-5, T-pipeline-6, T-pipeline-7]
blocker_dependencies: []                     # infra-cross-cutting DONE
side_story_blockers: [vitalia-payment-adapter-mvp]  # vitalia-copilot-tools-impl ya DONE 2026-05-18 (Lucas screening tool shipped)
preflight_gates_required:
  - clerk_test_token_fresh_and_webhook_secret_configured
  - clerk_test_users_3_created
  - playwright_storage_state_generated
  - playwright_smoke_suite_green_23_specs
  - promotion_proposal_core_platform_extensions_slice_1_migrated
  - vitalia_payment_adapter_mvp_state_developed_or_higher
priority: high
estimated_dev_weeks: 2-3
next_action: "REPLAN 2026-05-20 ratified Chris. Ola 2 — arranca DESPUÉS de Ola 1 done y side payment-adapter-mvp shipped. AWAITING /architect refresh tras gates GREEN. /architect produce ready package propio acotado: 6 stages kanban + atribución agentic + DnD + auto-progression + screening clínico Lucas + badge depósito 30%. Reuso explícito: nicolify/closer-studio + nicolify/copilot rail + core/luana-core-crm.Sale + core/luana-core-events StageAdvanced + CompoundScopeRepositoryBase core."
---

# vitalia-slice-1-pipeline — checkpoint

## Goal

Ruta `/pipeline` Kanban venta consultiva ética Slice 1 (Batch 3 cementado): 6 stages (Interesado · Calificando · Considerando · Listo · Reservado depósito · Decidió no) + atribución agentic per stage + DnD manual + auto-progression event-driven + screening clínico Lucas NEW + diferenciador MUST #2 badge depósito 30%.

## Mockup heredado (SSoT visual)

`02-design-ui-mockup.html` — copia del parent ratificado Chris 2026-05-17. Build respeta paleta 4 colores + chat-RIGHT rail + sidebar progresivo v3.

## Reuso explícito (Slice 1)

| Surface | Reuso de | Razón |
|---|---|---|
| FE kanban board | `nicolify/frontend/src/features/closer-studio/` (board kanban + detail panel) | closer-studio es el patrón pipeline Nicolify equivalente |
| FE rail copilot derecha | `nicolify/frontend/src/features/copilot/` | rail unificado cross-brand |
| BE Sale + Lead stages domain | `core/luana-core-crm/src/luana_core_crm/domain/sale.py` + `lead.py` | engine domain entities |
| BE StageAdvanced event | `core/luana-core-events/` domain event bus | engine event flow |
| BE PHI dual-filter | `core/luana-core-platform/repositories/CompoundScopeRepositoryBase` (post lift) | reemplaza vitalia/_shared |
| Lucas screening tool | `vitalia/backend/src/modules/vitalia/agentic/lucas/tools/compute_stage_recommendation.py` (ya shipped) | reuso directo |
| BE rate limiting | `core/luana-core-billing/RateLimiter` | engine ya consumido |

## Side stories paralelas relevantes

- `vitalia-payment-adapter-mvp` — BLOQUEA badge depósito 30%. Debe estar state≥developed antes Ola 2.
- `vitalia-copilot-tools-impl` — ya DONE 2026-05-18 (Lucas screening tool shipped).

## HANDOFF-cross-story coordination

Pipeline + inbox comparten contratos Lead + Conversation (provistos por Ola 1 inbox). Pipeline + marketing comparten Lucas stage_recommendations. Ver `vitalia/docs/product/outcomes/vitalia-mvp-ui-foundation/HANDOFF-cross-story.md`.

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story
- 2026-05-20 REPLAN: Ola 2 asignada (paralela con marketing). Pre-flight gates + side payment-adapter-mvp documentados. vitalia-copilot-tools-impl unblock removido (ya done).
