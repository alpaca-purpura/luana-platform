---
story_id: vitalia-slice-1-onboarding-wizard
outcome: vitalia-mvp-ui-foundation
parent_spec: vitalia-ux-discovery
state: developing
phase: BUILD_T_ONBOARDING_5_DONE
last_artifact: delta-arch-refresh.md
last_modified: 2026-05-18
build_started_at: 2026-05-18
build_started_by: /dev-team (Conv 2 autonomous, Chris ratificó full E2E run)
ratified_by_chris: true
spawned_at: 2026-05-17
spawned_by: /pm-vitalia (split decision post /architect ready package)
refreshed_at: 2026-05-18
refreshed_by: /architect (architect-orchestrator)
parallel_safe: true
ticket_subset: [T-onboarding-1, T-onboarding-2, T-onboarding-3, T-onboarding-4, T-onboarding-5, T-onboarding-6, T-onboarding-7]
blocker_dependencies: []
blocker_dependencies_resolved:
  - vitalia-slice-1-infra-cross-cutting   # merged 2026-05-18 (commits 50143d57 + cc4fcd68)
  - vitalia-copilot-tools-impl            # merged wip/vitalia 2026-05-18 (chain 3331151..427b0f3, pending squash main)
side_story_blockers: []                   # all cleared
priority: high
estimated_dev_weeks: 2
refresh_verdict: MINOR_DRIFT
refresh_artifacts:
  - delta-arch-refresh.md                 # primary deliverable, 198 lines, 5-check matrix
  - 06-tickets-refresh.yaml               # override yaml, 330 lines, 5 SCOPE_REDUCED + 1 UNCHANGED + 1 SCOPE_REDUCED_FROM_CREATE_TO_VERIFY
next_action: "T-1/T-2/T-3/T-4/T-5 DONE (commits up to 69049df). Remaining: T-onboarding-6 (FE wizard 2200 LOC — critical path) + T-onboarding-7 (FE integration + E2E smoke). Spawn /dev-team con T-onboarding-6."
ratified_decisions_2026_05_18:
  - OQ-1: R23 OPT-OUT T-onboarding-4 + T-onboarding-5 → RATIFIED (Sonnet OK, production_code=false, wire-up + regression only)
  - OQ-2: T-onboarding-1 mini-arch inline → RATIFIED (Architect inline signatures repos + ORM models + DI binding in 06-tickets-refresh.yaml::T-onboarding-1::scope)
  - OQ-3: Whisper STT audio path → RATIFIED DEFER Slice 2 (audio_transcriber.py REMOVED from T-2 scope; re-evaluate post Slice 1 + tenant feedback)
  - OQ-4: FE feature path → RATIFIED features/onboarding/ verbatim per spec (NOT nested under features/vitalia/)
unblocked_for_spawn: true
---

# vitalia-slice-1-onboarding-wizard — checkpoint

## Goal

Wizard Brand Studio onboarding agentic Slice 1 — chat-LEFT 50/50 split + voz Adrián REAL backend wire desde primer setup + slot-filling adaptativo NLU + 4 tools wizard (extract_tenant_context · confirm_slot · simulate_personality · complete_onboarding) + extracción URL/doc/audio (Batch 7 cementado).

## Scope

7 tickets slice onboarding-wizard. Inherited package en `../vitalia-ux-discovery/{03-arch*.md,04-validators.yaml,05-guidelines.md,06-tickets.yaml}` + REFRESH overrides en `06-tickets-refresh.yaml` local.

## Refresh validation 2026-05-18 (post infra + copilot-tools-impl merges)

**Verdict: MINOR_DRIFT.** Ver `delta-arch-refresh.md` para 5-check matrix completo.

- DB schema (3 tablas + 4 columnas tenants): **NO_DRIFT**. Migrations 011+012+014 + bonus 020 (checkpoint table) ya aplicadas.
- Valeria tools contract (4 tools): **NO_DRIFT funcional**. Tools shipped en `copilot/tools/` con signatures refinadas (service-call pattern).
- Slot architecture / cache (5 slots): **NO_DRIFT funcional**. Shipped `wizard_prompt_compiler.py` usa 0-indexed labeling (slots 0-3 cacheable + slot 4 variable), spec usaba 1-indexed (slots 1-4 cacheable + slot 5 variable). Cosmético.
- Validators feasibility: feasible AS-IS. T-onboarding-6 introduce `e2e_smoke_wizard_onboarding` (port 3002 vitalia).
- Tickets scope: 5 SCOPE_REDUCED (T-1, T-2, T-3, T-4, T-5, T-7), 1 UNCHANGED (T-6 — FE wizard NEW). Total LOC ~49% reduction (~3380 vs 6600 spec).

## Blockers (todos resueltos)

- ~~`vitalia-slice-1-infra-cross-cutting`~~ — DONE 2026-05-18 (squash a main: 50143d57 + cc4fcd68). `07-merge.md` archived.
- ~~`vitalia-copilot-tools-impl`~~ — DONE 2026-05-18 (chain 3331151..427b0f3 en wip/vitalia, pending squash main). `07-merge.md` archived. 7 capabilities live + 16 goldens + 4 Valeria tools real + supervisor graph + 5-slot compiler + checkpointer.

## Inherited ready package (READ-ONLY)

- `../vitalia-ux-discovery/01-spec.md` (Gherkin scenarios SC-W1..SC-W4 — Batch 7 wizard agentic)
- `../vitalia-ux-discovery/03-arch.md` + `03-arch-{be,fe,agentic}.md`
- `../vitalia-ux-discovery/04-validators.yaml` (T-onboarding-1..7 validators feasible AS-IS)
- `../vitalia-ux-discovery/05-guidelines.md`
- `../vitalia-ux-discovery/06-tickets.yaml` § sub_story `vitalia-slice-1-onboarding-wizard` (T-onboarding-1..7)

## Local refresh artifacts (this folder)

- `delta-arch-refresh.md` — drift validation deliverable (5-check matrix + recommended actions + open questions)
- `06-tickets-refresh.yaml` — override yaml (5 SCOPE_REDUCED + 1 UNCHANGED + 1 SCOPE_REDUCED_FROM_CREATE_TO_VERIFY)
- (no `03-arch-refresh.md` produced — drift no toca arquitectura)
- (no `04-validators-refresh.yaml` produced — validators feasibles AS-IS)

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story.
- 2026-05-18 blockers resolved: infra-cross-cutting + copilot-tools-impl merged.
- 2026-05-18 refresh validation: `/architect` produjo `delta-arch-refresh.md` (verdict MINOR_DRIFT) + `06-tickets-refresh.yaml`. Inherited package ~85% válido as-is. Critical path domina T-onboarding-6 FE wizard 2200 LOC. Spawn /dev-team blocked en Open Questions OQ-1..OQ-4 awaiting /pm-vitalia ratificación.
- 2026-05-18 (post-refresh ratify): 4 Open Questions ratificadas Chris verbatim → `06-tickets-refresh.yaml` updated. R23 OPT-OUT T-4/T-5 (production_code=false, Sonnet OK), mini-arch inline T-1 (signatures + ORM + DI binding ~30 líneas), audio Whisper STT deferred Slice 2 (audio_transcriber removed), FE path `features/onboarding/` verbatim per spec. UNBLOCKED for /dev-team spawn.
