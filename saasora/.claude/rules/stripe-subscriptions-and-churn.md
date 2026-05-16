# SaaSora — Stripe Subscriptions + Churn/MRR + Changelog Versioning

**Overlay:** extiende `.claude/rules/` raíz Luana platform (refuerza `tenant-isolation.md` + `anti-default-flip-audit.md`).
**Brand:** saasora (SaaS + Productos Digitales — startups tech, micro-SaaS, software)
**Scope:** subscriptions Stripe (recurring billing + webhooks idempotentes), dashboards Churn/MRR como SSoT cuantitativo del negocio, changelog versioning + release notes automatizados.

## Regla cardinal

Stripe es la única source of truth del billing recurrente. TODA escritura de subscription state DEBE ser idempotente (webhooks Stripe retry hasta 3 días). Métricas Churn/MRR DEBEN computarse desde events store, no desde snapshot mutable (auditable + recalculable). Changelog versioning DEBE seguir SemVer y publicar release notes a clientes automáticamente al deploy prod.

## Brand-extension layout

- `saasora/backend/src/modules/saasora/billing/` — Stripe adapter, webhook handler, subscription state machine.
- `saasora/backend/src/modules/saasora/analytics/` — MRR/ARR/Churn cohort calculator (lift candidate a `core/luana-core-analytics-engine/` si emerge cross-brand).
- `saasora/backend/src/modules/saasora/changelog/` — version tracking + release notes generator (markdown → email/in-app).

## Stripe webhook idempotency

- Eventos relevantes: `customer.subscription.{created,updated,deleted}`, `invoice.{paid,payment_failed}`, `customer.subscription.trial_will_end`.
- Tabla `stripe_webhook_events` con UNIQUE `(stripe_event_id)`. Insert before processing — retry duplica → 200 OK no-op.
- Webhook signature verification mandatory (`stripe.Webhook.construct_event`). Sin verificación = 400 reject.
- Procesamiento async via outbox (NEVER sync — Stripe espera 200 en <30s).

## MRR/ARR/Churn como event-sourced

- Tabla `subscription_events` append-only: `(tenant_id, customer_id, event_type, plan_id, mrr_delta_cents, currency, occurred_at)`.
- Tipos: `new_subscription`, `upgrade`, `downgrade`, `cancellation`, `reactivation`, `expansion`.
- Snapshots periódicos (`mrr_snapshots`) cron daily — recalculables desde events.
- Net MRR = sum(mrr_delta_cents) por tenant + currency. Churn rate = cancellations/active_at_start.

## Trial gating

- Trial period = N días configurables per plan. Sales agent NUNCA promete extender trial sin Stripe API call.
- Webhook `trial_will_end` (3 días antes) → trigger campaign retention (sales agent reach out).
- Trial → paid conversion event registered en `subscription_events`.

## Changelog versioning

- SemVer obligatorio per release.
- Cada release deploy a prod → auto-gen `changelog/v{X.Y.Z}.md` desde commits con `feat:` / `fix:` (Conventional Commits).
- Notificación in-app + email opt-in a clientes con feature flag granular.

## Tests requeridos

PR saasora tocando `billing`, `subscription`, `mrr`, `churn`, `changelog`, `stripe` MUST incluir tests:

1. **Webhook signature reject:** payload sin signature válida → 400.
2. **Webhook idempotency:** mismo `stripe_event_id` dos veces → 200 sin duplicar.
3. **Tenant_id filter:** subscription queries filtran tenant_id (no cross-tenant leak).
4. **MRR event-source recalc:** dado N events → MRR computado = snapshot persistido.
5. **Trial expiration:** webhook trial_will_end dispara outbox event correcto.
6. **SemVer enforcement:** changelog publish con version inválida (`1.0`) → reject.

## Anti-patterns prohibidos

- Subscription state mutado sync sin pasar por webhook handler (Stripe = SSoT, never local override).
- MRR computado desde DB snapshot mutable (perdés auditabilidad histórica).
- Webhook handler sync >30s (Stripe timeout = retry storm).
- Stripe API key hardcoded fuera de secrets manager.
- Currency hardcoded `USD` (per master-data.md — currency siempre de tenant config + Stripe Price object).
- Cross-tenant subscription visibility (single filter por error).

## Referencias

- Raíz: `.claude/rules/tenant-isolation.md`, `.claude/rules/master-data.md`, `.claude/rules/anti-default-flip-audit.md`
- Brand config: `saasora/config/brand.yaml`
- Brand module home: `saasora/backend/src/modules/saasora/`
- Stripe docs: https://stripe.com/docs/webhooks/best-practices (verify signature)
- Outbox pattern: `core/luana-core-events/`
