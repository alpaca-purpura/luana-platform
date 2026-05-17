---
story_id: vitalia-slice-1-agenda
outcome: vitalia-mvp-ui-foundation
parent_spec: vitalia-ux-discovery
state: refined
phase: READY_PACKAGE_INHERITED_BUT_BLOCKED
last_artifact: ../vitalia-ux-discovery/06-tickets.yaml (sub-story slice T-agenda-1..T-agenda-9)
last_modified: 2026-05-17
ratified_by_chris: true
spawned_at: 2026-05-17
spawned_by: /pm-vitalia (split decision post /architect ready package)
parallel_safe: true
ticket_subset: [T-agenda-1, T-agenda-2, T-agenda-3, T-agenda-4, T-agenda-5, T-agenda-6, T-agenda-7, T-agenda-8, T-agenda-9]
blocker_dependencies: [vitalia-slice-1-infra-cross-cutting]
side_story_blockers: [vitalia-payment-adapter-mvp, vitalia-fiscal-emission-pe]
priority: high
estimated_dev_weeks: 2-3
next_action: "BLOCKED. Spawn /dev-team cuando vitalia-slice-1-infra-cross-cutting state=developed Y vitalia-payment-adapter-mvp state≥developed (cobranza saldo) Y vitalia-fiscal-emission-pe state≥developed (Capa 2 fiscal Nubefact)."
---

# vitalia-slice-1-agenda — checkpoint

## Goal

Ruta `/agenda` Slice 1 (Batch 4 cementado): vista Semana default + 4 origins (sales_agent + walk_in + phone_manual + proactive_outbound) preservando atribución agentic + 3 capas cobranza (sheet inline + Nubefact boleta PE toggle + window.print() PDF) + Walk-in/Phone drawers NEW + DnD + modal fallback reschedule + 5 Extension SDK registries plugin-ready + 5 cron jobs + política reembolso 24h hardcoded.

## Scope

9 tickets slice agenda. Detalle en `../vitalia-ux-discovery/06-tickets.yaml` § sub_story: vitalia-slice-1-agenda.

## Blockers

- `vitalia-slice-1-infra-cross-cutting` (Extension SDK registries + payment_events table + cron jobs scheduler)
- `vitalia-payment-adapter-mvp` (cobranza saldo final Mercado Pago)
- `vitalia-fiscal-emission-pe` (Capa 2 fiscal Nubefact PE adapter + retry queue + CDR archive)

## Inherited ready package

`../vitalia-ux-discovery/{03-arch*.md,04-validators.yaml,05-guidelines.md,06-tickets.yaml}`.

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story.
