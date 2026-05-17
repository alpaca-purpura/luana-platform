---
story_id: vitalia-payment-adapter-mvp
outcome: vitalia-mvp-ui-foundation
state: refining
phase: AWAITING_PO_DRAFT
last_artifact: checkpoint.md
last_modified: 2026-05-17
next_action: "/po vitalia-payment-adapter-mvp — produce 01-spec.md service-story con: (1) Decisión cementada del gateway primario MVP. Recomendación architect 03-arch-be.md § Payment Provider Adapter: MercadoPago Slice 1 (LATAM principal, cobertura AR/PE/MX/CO/CL/BR), Stripe Slice 2+ (US/EU tenants), Culqi opcional Slice 2 (PE-only fallback). (2) 6 Gherkin scenarios: checkout link generation + paciente paga + webhook confirma + auto-cancel 24h sin pago + auto-cancel 72h pago parcial + reembolso 100% pre-confirma. (3) Webhook HMAC signature + timestamp window 5min validation (per hipaa-lite.md encryption in transit). (4) Idempotency keys per booking_id (cron sweeper detecta dups). (5) Flow integración con sales_agent Adrián tool `send_payment_link`. (6) Open questions Chris: aceptamos solo MercadoPago Slice 1 ó wiring multi-gateway Strategy pattern desde MVP?"
ratified_by_chris: false
spawned_at: 2026-05-17
transitioned_at: 2026-05-17
spawned_by: /pm-vitalia
parallel_safe: true
blocked_reason: "Bloqueante de Slice 1 funcional end-to-end (sin gateway, depósito 30% no cobra)"
priority: high
estimated_dev_weeks: 1-2
parent_spec: "vitalia/docs/product/stories/vitalia-ux-discovery/03-arch-be.md § Payment Provider Adapter + ../01-spec.md § Slice 1 cut + EP-8 payment_adapters registry"
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

## Dependencies

- **vitalia-slice-1-fe** consumer del adapter wired (depósito visible en /agenda + flow checkout en /pipeline)
- Backend Vitalia Story 11 ya tiene scaffold (no necesita nueva infra core)

## Bitácora

- 2026-05-17 spawned: idea formal abierta por /pm-vitalia para tracking explícito. Diferenciador #2 MUST MVP (booking prepaid 30%) depende de esta story.
