---
story_id: vitalia-payment-adapter-mvp
outcome: vitalia-mvp-ui-foundation
state: refining
phase: AWAITING_PO_DRAFT_RE_PRIORITIZED                    # ★ post 2026-05-22 paradigma shell-organism
last_artifact: checkpoint.md
last_modified: 2026-05-22                                  # touched 2026-05-22 cross-story deps update
ratified_by_chris: false
spawned_at: 2026-05-17
transitioned_at: 2026-05-17
spawned_by: /pm-vitalia
parallel_safe: true
blocked_reason: "Bloqueante de Fase 2 (F2-S1 valeria-agenda + F2-S4 adrian-embudo stage reservado + F2-S6 adrian-propuestas payment plans + F2-S20 config-cuenta plan Luana)"
priority: high
estimated_dev_weeks: 1-2
parent_spec: "vitalia/docs/product/stories/vitalia-ux-discovery/03-arch-be.md § Payment Provider Adapter + EP-8 payment_adapters registry"
cross_phase_2_consumers:                                   # ★ NEW post 2026-05-22 paradigm
  - vitalia-fase2-valeria-agenda                           # F2-S1 — subform Cobrar saldo inline
  - vitalia-fase2-adrian-embudo                            # F2-S4 — stage transition reservado dispara payment
  - vitalia-fase2-adrian-propuestas                        # F2-S6 — payment plans Stripe/MP subscription
  - vitalia-fase2-config-cuenta                            # F2-S20 — Plan Luana checkout (meta-billing)
next_action: "/po vitalia-payment-adapter-mvp — produce 01-spec.md service-story. RECOMMENDED priority bump cuando Fase 1 entra a developing. Inputs cementados: gateway primario MercadoPago Slice 1 (LATAM principal AR/PE/MX/CO/CL/BR) + Stripe Slice 2 (US/EU tenants + payment plans subscription para F2-S6 propuestas) + Culqi PE fallback Slice 2. 6 Gherkin scenarios: checkout link · paciente paga · webhook confirma · auto-cancel 24h sin pago · auto-cancel 72h pago parcial · reembolso 100% pre-confirma. Webhook HMAC + timestamp 5min per hipaa-lite.md. Idempotency keys per booking_id. Flow integración con sales_agent Adrián tool send_payment_link. Open Chris: ¿solo MP Slice 1 ó multi-gateway Strategy desde MVP?"
---

# vitalia-payment-adapter-mvp — checkpoint

## Goal

Wirear al menos 1 payment gateway (de los 3 scaffold en backend Vitalia Story 11) para que el booking prepaid 30% funcione end-to-end:

- Backend `vitalia/backend/src/modules/vitalia/payment/` tiene scaffold para 3 adapters (per 00-research.md audit)
- Webhooks ya operativos
- Falta: implementación concreta del adapter elegido + flow checkout link + confirmación

## Scope

### In-scope
- Decidir 1 gateway primario MVP (candidatos LATAM: MercadoPago, Stripe, Culqi, dLocal)
- Implementar adapter conforme contract EP-8 (`payment_adapters`)
- Flow: agenda crear turno → genera checkout link → enviar paciente WhatsApp via Adrián → paciente paga → webhook confirma → status turno actualiza a `paid_deposit`
- Tests: integration test con gateway sandbox + E2E flow paciente

### Out-of-scope
- Wirear los 3 gateways (solo 1 MVP, resto Slice 2+)
- Pagos finales (post-tratamiento) — solo depósito 30%
- Reembolsos automáticos — defer
- Multi-currency (USD vs locales) — usar default tenant currency

## Dependencies (post 2026-05-22 paradigma shell-organism)

Consumers cruzados Fase 2:
- **vitalia-fase2-valeria-agenda** (F2-S1) — subform "Cobrar saldo" inline en AppointmentDrawer
- **vitalia-fase2-adrian-embudo** (F2-S4) — stage transition `* → reservado` dispara payment deposit request
- **vitalia-fase2-adrian-propuestas** (F2-S6) — payment plans Stripe (subscription) + MP (cuotas)
- **vitalia-fase2-config-cuenta** (F2-S20) — Plan Luana checkout (meta-billing self-service)

Service blockers: Backend Vitalia Story 11 ya tiene scaffold (3 adapters listos para wirear).

## Bitácora

- 2026-05-17 spawned: idea formal abierta por /pm-vitalia para tracking explícito. Diferenciador #2 MUST MVP (booking prepaid 30%) depende de esta story.
- **2026-05-22 cross-story deps update:** consumers Fase 2 enumerados (4 historias). Story sigue `refining`. Priority bump recomendado cuando Fase 1 (F1-S0..F1-S10) entra `developing` — para que `developed` esté ANTES de F2-S1/F2-S4/F2-S6 arrancar. Outcome refactor v2.0 documentado: `vitalia/docs/product/outcomes/vitalia-mvp-ui-foundation.md`.
