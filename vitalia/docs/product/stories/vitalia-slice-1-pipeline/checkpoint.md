---
story_id: vitalia-slice-1-pipeline
outcome: vitalia-mvp-ui-foundation
parent_spec: vitalia-ux-discovery
state: refined
phase: READY_PACKAGE_INHERITED_BUT_BLOCKED
last_artifact: ../vitalia-ux-discovery/06-tickets.yaml (sub-story slice T-pipeline-1..T-pipeline-7)
last_modified: 2026-05-17
ratified_by_chris: true
spawned_at: 2026-05-17
spawned_by: /pm-vitalia (split decision post /architect ready package)
parallel_safe: true
ticket_subset: [T-pipeline-1, T-pipeline-2, T-pipeline-3, T-pipeline-4, T-pipeline-5, T-pipeline-6, T-pipeline-7]
blocker_dependencies: [vitalia-slice-1-infra-cross-cutting]
side_story_blockers: [vitalia-payment-adapter-mvp, vitalia-copilot-tools-impl]
priority: high
estimated_dev_weeks: 1-2
next_action: "BLOCKED. Spawn /dev-team cuando vitalia-slice-1-infra-cross-cutting state=developed Y vitalia-payment-adapter-mvp state≥developed (depósito 30% badge) Y vitalia-copilot-tools-impl state≥developed (Lucas screening tool)."
---

# vitalia-slice-1-pipeline — checkpoint

## Goal

Ruta `/pipeline` Kanban venta consultiva ética Slice 1 (Batch 3 cementado): 6 stages (Interesado · Calificando · Considerando · Listo · Reservado depósito · Decidió no) + atribución agentic per stage + DnD manual + auto-progression event-driven + screening clínico Lucas NEW + diferenciador MUST #2 badge depósito 30%.

## Scope

7 tickets slice pipeline. Detalle en `../vitalia-ux-discovery/06-tickets.yaml` § sub_story: vitalia-slice-1-pipeline.

## Blockers

- `vitalia-slice-1-infra-cross-cutting` (`lucas_recommendations` table + appointments columns)
- `vitalia-payment-adapter-mvp` (depósito 30% confirmed badge)
- `vitalia-copilot-tools-impl` (Lucas screening tool per vertical)

## Inherited ready package

`../vitalia-ux-discovery/{03-arch*.md,04-validators.yaml,05-guidelines.md,06-tickets.yaml}`.

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story.
