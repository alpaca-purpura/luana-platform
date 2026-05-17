---
module: payment
brand: comunify
last_updated: 2026-05-17
---

# payment — Recurring subscriptions + cohort installments + Dunning

Gateways: mercadopago primary LatAm + stripe_connect fallback US/EU + tokenized_recurring para subscriptions + cohort installments. Plan tiers: creator (29 USD) · pro (99 USD) · agency (299 USD) cementado D20. DunningWorkflow embedded en CohortEnrollmentWorkflow (4-state machine per D18) para retry inteligente de pagos fallidos.

## Capabilities

<!-- auto-list:start -->
- `recurring-subscriptions` (live)
- `dunning-workflow` (live)
<!-- auto-list:end -->
