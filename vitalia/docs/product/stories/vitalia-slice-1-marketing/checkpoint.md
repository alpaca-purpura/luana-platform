---
story_id: vitalia-slice-1-marketing
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
ola_rationale: "Reuso simple Lucas tools ya shipped (compute_attribution_matrix + compute_referrals_leaderboard + compute_stage_recommendation). NO usar nicolify/growth-studio (arch diferente per Chris)."
ticket_subset_inherited: [T-marketing-1, T-marketing-2, T-marketing-3, T-marketing-4, T-marketing-5, T-marketing-6, T-marketing-7, T-marketing-8]
blocker_dependencies: []                     # infra-cross-cutting DONE
side_story_blockers: []                      # vitalia-copilot-tools-impl ya DONE 2026-05-18 (Lucas tools shipped)
preflight_gates_required:
  - clerk_organizations_enabled
  - clerk_test_users_3_created
  - playwright_storage_state_generated
  - playwright_smoke_suite_green_23_specs
  - promotion_proposal_core_platform_extensions_slice_1_migrated  # cron_envelope (ETL channel_metrics cron)
priority: high
estimated_dev_weeks: 2-3
next_action: "REPLAN 2026-05-20 ratified Chris. Ola 2 — paralela con pipeline. AWAITING /architect refresh tras gates GREEN. /architect produce ready package propio acotado: Bowtie 5 stages SVG + Lucas recommendations cards + AttributionMatrix + ReferralsWidget + UTM tracking + read-only viewport. NO REUSAR growth-studio (arch diferente per Chris). Build NUEVO simple consumiendo Lucas tools ya shipped + core/luana-core-campaigns workers + cron_envelope core."
---

# vitalia-slice-1-marketing — checkpoint

## Goal

Ruta `/marketing` Bowtie 5 stages salud Slice 1 (Batch 6 cementado reframe): Bowtie SVG pixel-invariante + Lucas StageRecommendations protagonista 3 cards top per stage + AttributionMatrixWidget Stage Reserva (4 origins) + ReferralsWidget NEW Stage Expansión + Meta+Google APIs sync simplificado + read-only viewport + UTM tracking lead→origin.

## ★ Decisión Chris 2026-05-20: NO usar growth-studio Nicolify

Nicolify `frontend/src/features/growth-studio/` tiene arquitectura diferente (progressive loading 4 tiers, stage services, channel registry compleja, etc.) NO compatible con el patrón vitalia más simple. Build de vitalia/marketing es NUEVO desde cero usando como referencia el mockup HTML + tokens cementados + Lucas tools ya shipped.

## Mockup heredado (SSoT visual)

`02-design-ui-mockup.html` — copia del parent ratificado Chris 2026-05-17. Build respeta paleta 4 colores + chat-RIGHT rail + sidebar progresivo v3. Bowtie SVG es el componente visual central.

## Reuso explícito (Slice 1) — NO growth-studio

| Surface | Reuso de | Razón |
|---|---|---|
| FE Bowtie SVG component | Construir nuevo siguiendo mockup | Pattern simple SVG + Tailwind, no FSD-Lite legacy growth-studio |
| FE Lucas recommendations cards | `vitalia/frontend/src/components/shared/lucas-recommendations/` (2 tsx stubs) + nicolify/notifications patterns (cards rendering) | Reuso patterns notifications, no growth-studio |
| FE AttributionMatrix widget | `vitalia/frontend/src/components/shared/attribution/` (2 tsx stubs) | Reuso scaffold ya en código |
| FE Referrals widget | `vitalia/frontend/src/components/shared/marketing/` (2 tsx stubs) | idem |
| FE Channels viewport | `vitalia/frontend/src/components/shared/channels/` (2 tsx stubs) | idem |
| BE Lucas tools | `vitalia/backend/src/modules/vitalia/agentic/lucas/tools/{compute_attribution_matrix,compute_referrals_leaderboard,compute_stage_recommendation}.py` (ya shipped) | reuso directo |
| BE workers ETL channel_metrics | `core/luana-core-campaigns/workers/scheduler_tick.py` (engine batch) + brand-specific via EP | engine + brand ext |
| BE cron envelope | `core/luana-core-platform/workers/cron_envelope` (post lift) | reemplaza vitalia/_shared |
| BE PHI dual-filter (channel_sync_state + UTM tracking) | `core/luana-core-platform/repositories/CompoundScopeRepositoryBase` (post lift) | reemplaza vitalia/_shared |
| BE Meta + Google APIs OAuth | `vitalia/backend/src/modules/vitalia/connections/conversation_initiation/registry.py` (Extension SDK EP-8) | brand-local ya scaffolded |

## Side stories paralelas relevantes

- `vitalia-copilot-tools-impl` — ya DONE 2026-05-18, Lucas tools shipped.
- Ninguna otra side story bloquea.

## HANDOFF-cross-story coordination

Marketing + pipeline (Ola 2) comparten Lucas StageRecommendations cards (mismo backend tool, diferente render). Ver `vitalia/docs/product/outcomes/vitalia-mvp-ui-foundation/HANDOFF-cross-story.md`.

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story
- 2026-05-20 REPLAN: Ola 2 paralela con pipeline. growth-studio NO reusar (Chris ratificó arch diferente). vitalia-copilot-tools-impl unblock removido (ya done).
