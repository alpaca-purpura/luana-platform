---
story_id: vitalia-slice-1-onboarding-wizard
outcome: vitalia-mvp-ui-foundation
parent_spec: vitalia-ux-discovery
state: refined
phase: READY_PACKAGE_INHERITED_BUT_BLOCKED
last_artifact: ../vitalia-ux-discovery/06-tickets.yaml (sub-story slice T-onboarding-1..T-onboarding-7)
last_modified: 2026-05-17
ratified_by_chris: true
spawned_at: 2026-05-17
spawned_by: /pm-vitalia (split decision post /architect ready package)
parallel_safe: true
ticket_subset: [T-onboarding-1, T-onboarding-2, T-onboarding-3, T-onboarding-4, T-onboarding-5, T-onboarding-6, T-onboarding-7]
blocker_dependencies: [vitalia-slice-1-infra-cross-cutting]
side_story_blockers: [vitalia-copilot-tools-impl]
priority: high
estimated_dev_weeks: 2
next_action: "BLOCKED. Spawn /dev-team cuando vitalia-slice-1-infra-cross-cutting state=developed Y vitalia-copilot-tools-impl state≥developed."
---

# vitalia-slice-1-onboarding-wizard — checkpoint

## Goal

Wizard Brand Studio onboarding agentic Slice 1 — chat-LEFT 50/50 split + voz Adrián REAL backend wire desde primer setup + slot-filling adaptativo NLU + 4 tools wizard (extract_tenant_context · confirm_slot · simulate_personality · complete_onboarding) + extracción URL/doc/audio (Batch 7 cementado).

## Scope

7 tickets slice onboarding-wizard. Detalle en `../vitalia-ux-discovery/06-tickets.yaml` § sub_story: vitalia-slice-1-onboarding-wizard.

## Blockers

- `vitalia-slice-1-infra-cross-cutting` debe state=developed (tablas `onboarding_progress` + `brand_studio_drafts` + `tenants.{is_onboarded,location_*}` columns)
- `vitalia-copilot-tools-impl` debe state≥developed (4 tools Valeria backend implementadas)

## Inherited ready package

`../vitalia-ux-discovery/{03-arch*.md,04-validators.yaml,05-guidelines.md,06-tickets.yaml}`.

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story.
