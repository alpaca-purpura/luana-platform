---
story_id: vitalia-slice-1-marketing
outcome: vitalia-mvp-ui-foundation
parent_spec: vitalia-ux-discovery
state: refined
phase: READY_PACKAGE_INHERITED_BUT_BLOCKED
last_artifact: ../vitalia-ux-discovery/06-tickets.yaml (sub-story slice T-marketing-1..T-marketing-8)
last_modified: 2026-05-17
ratified_by_chris: true
spawned_at: 2026-05-17
spawned_by: /pm-vitalia (split decision post /architect ready package)
parallel_safe: true
ticket_subset: [T-marketing-1, T-marketing-2, T-marketing-3, T-marketing-4, T-marketing-5, T-marketing-6, T-marketing-7, T-marketing-8]
blocker_dependencies: [vitalia-slice-1-infra-cross-cutting]
side_story_blockers: [vitalia-copilot-tools-impl]
priority: high
estimated_dev_weeks: 2-3
next_action: "BLOCKED. Spawn /dev-team cuando vitalia-slice-1-infra-cross-cutting state=developed Y vitalia-copilot-tools-impl state≥developed (Lucas recommendation engine + StageRecommendations tool)."
---

# vitalia-slice-1-marketing — checkpoint

## Goal

Ruta `/marketing` Bowtie 5 stages salud Slice 1 (Batch 6 cementado reframe): Bowtie SVG pixel-invariante + Lucas StageRecommendations protagonista 3 cards top per stage + AttributionMatrixWidget Stage Reserva (4 origins) + ReferralsWidget NEW Stage Expansión + Meta+Google APIs sync simplificado + read-only viewport + UTM tracking lead→origin + REUSE 14 componentes growth-studio curados.

## Scope

8 tickets slice marketing. Detalle en `../vitalia-ux-discovery/06-tickets.yaml` § sub_story: vitalia-slice-1-marketing.

## Blockers

- `vitalia-slice-1-infra-cross-cutting` (channel_sync_state + channel_metrics + lucas_recommendations + referrals tables + cron jobs)
- `vitalia-copilot-tools-impl` (Lucas recommendation engine backend + 5 stage analysis tools)

## Inherited ready package

`../vitalia-ux-discovery/{03-arch*.md,04-validators.yaml,05-guidelines.md,06-tickets.yaml}`.

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story.
