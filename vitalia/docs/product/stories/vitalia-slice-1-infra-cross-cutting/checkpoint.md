---
story_id: vitalia-slice-1-infra-cross-cutting
outcome: vitalia-mvp-ui-foundation
parent_spec: vitalia-ux-discovery
state: ready
phase: READY_PACKAGE_INHERITED
last_artifact: ../vitalia-ux-discovery/06-tickets.yaml (sub-story slice T-arch-1, T-infra-1..T-infra-9)
last_modified: 2026-05-17
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
