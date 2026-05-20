---
story_id: vitalia-slice-1-agenda
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
ola_assigned: 3
ola_rationale: "Story más compleja Slice 1 — combina scheduling + 3 capas cobranza + fiscal PE + 5 cron jobs + reuso scheduling engine. Va sola en Ola 3 para concentrar deps payment + fiscal."
ticket_subset_inherited: [T-agenda-1, T-agenda-2, T-agenda-3, T-agenda-4, T-agenda-5, T-agenda-6, T-agenda-7, T-agenda-8, T-agenda-9]
blocker_dependencies: []                     # infra-cross-cutting DONE
side_story_blockers: [vitalia-payment-adapter-mvp, vitalia-fiscal-emission-pe]
preflight_gates_required:
  - clerk_organizations_enabled
  - clerk_test_users_3_created
  - playwright_storage_state_generated
  - playwright_smoke_suite_green_23_specs
  - promotion_proposal_core_platform_extensions_slice_1_migrated
  - vitalia_payment_adapter_mvp_state_developed_or_higher
  - vitalia_fiscal_emission_pe_state_developed_or_higher
priority: high
estimated_dev_weeks: 2-3
next_action: "REPLAN 2026-05-20 ratified Chris. Ola 3 — arranca DESPUÉS de Olas 1+2 done y side stories payment + fiscal shipped. AWAITING /architect refresh tras gates GREEN. /architect produce ready package propio acotado: agenda Semana default + 4 origins + 3 capas cobranza + 5 EP registries + 5 cron jobs. Reuso explícito: core/luana-core-scheduling + core/luana-core-channels.payment.* (mercadopago + stripe + tokenized_recurring) + cron_envelope core (recordatorios idempotent) + CompoundScopeRepositoryBase core."
---

# vitalia-slice-1-agenda — checkpoint

## Goal

Ruta `/agenda` Slice 1 (Batch 4 cementado): vista Semana default + 4 origins (sales_agent + walk_in + phone_manual + proactive_outbound) preservando atribución agentic + 3 capas cobranza (sheet inline + Nubefact boleta PE toggle + window.print() PDF) + Walk-in/Phone drawers NEW + DnD + modal fallback reschedule + 5 Extension SDK registries plugin-ready + 5 cron jobs + política reembolso 24h hardcoded.

## Mockup heredado (SSoT visual)

`02-design-ui-mockup.html` — copia del parent ratificado Chris 2026-05-17. Build respeta paleta 4 colores + chat-RIGHT rail + sidebar progresivo v3.

## Reuso explícito (Slice 1)

| Surface | Reuso de | Razón |
|---|---|---|
| FE calendar Semana view + DnD | Construir mix patterns nicolify/crm-hub (list+detail) + nicolify/closer-studio (DnD board) | NO hay equivalente directo Nicolify para calendar — mix patterns |
| FE drawer Walk-in / Phone | nicolify/closer-studio detail panel patterns | reuso drawer-pattern |
| FE rail copilot derecha | nicolify/frontend/src/features/copilot/ | rail unificado |
| BE Appointment + AvailabilitySchema + EventTypeSchema | `core/luana-core-scheduling/src/luana_core_scheduling/domain/` | engine domain entities |
| BE payment adapters (MercadoPago, Stripe, tokenized recurring) | `core/luana-core-channels/src/luana_core_channels/payment/{mercadopago_adapter,stripe_connect_adapter,tokenized_recurring_adapter}.py` | engine ya tiene adapters |
| BE cron envelope (recordatorios + 24h refund window + auto-cancel) | `core/luana-core-platform/workers/cron_envelope` (post lift) | reemplaza vitalia/_shared |
| BE PHI dual-filter (appointments + payment_events + fiscal_receipts PHI encrypted) | `core/luana-core-platform/repositories/CompoundScopeRepositoryBase` (post lift) | reemplaza vitalia/_shared |
| BE idempotency webhook payment/fiscal | `core/luana-core-idempotency/` `@idempotent` decorator | engine ya consumido |
| Side payment-adapter-mvp | `vitalia-payment-adapter-mvp` story shipped | provee cobranza saldo final |
| Side fiscal-emission-pe | `vitalia-fiscal-emission-pe` story shipped | provee Capa 2 Nubefact + CDR archive |

## Side stories paralelas relevantes

- `vitalia-payment-adapter-mvp` — BLOQUEA cobranza saldo. Refining en paralelo a Ola 1 (sesión actual arranca `/po draft`).
- `vitalia-fiscal-emission-pe` — BLOQUEA Capa 2 fiscal Nubefact PE. Refining en paralelo a Ola 1.

## HANDOFF-cross-story coordination

Agenda hereda contratos Lead + Customer + Conversation de Olas 1+2 (inbox + pipeline). Comparte payment + fiscal con side stories shipped. Ver `vitalia/docs/product/outcomes/vitalia-mvp-ui-foundation/HANDOFF-cross-story.md`.

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story
- 2026-05-20 REPLAN: Ola 3 asignada (sola, más compleja). Pre-flight + lift core + side payment + side fiscal documentados.
