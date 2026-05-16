# Nicolify — B2B Billable Hours + Client Portal + Contract Lifecycle

**Overlay:** extiende `.claude/rules/` raíz Luana platform (refuerza `tenant-isolation.md` + `currency-handling.md`).
**Brand:** nicolify (Agencias + Servicios B2B — agencias marketing, software boutique, consultoras)
**Scope:** integridad financiera time-tracking → invoice, lifecycle propuestas/contratos, portal cliente con auth separada, CRM enterprise multi-stage.

## Regla cardinal

En nicolify, dinero del cliente == confianza del cliente. Toda hora facturada DEBE trazar 1:1 a time_entry billable approved + project billable flag + client agreement vigente. Invoice line items DEBEN sumar exactamente time_entries del período + flat fees + retainers, sin discrepancia. Currency de invoice respeta client currency, NUNCA convertida a tenant currency.

## Time tracking model

Entidad canónica `time_entry`:

```
(id, tenant_id, client_id, project_id, task_id, user_id,
 entry_date, hours_decimal, billable_flag, hourly_rate,
 currency, description, approved_at, approved_by_user_id,
 invoice_line_item_id NULLABLE)
```

### Constraints
- `hours_decimal` entre `0.25` y `24.0` (validator hard; arch test enforces). Granularidad mínima 15min.
- `billable_flag` default = `project.billable` (inherit). Override explícito per entry requiere `override_reason` + audit_log row.
- `hourly_rate` default = `user.default_rate` o `project.override_rate` si exists; nunca null en billable=true.
- `currency` default = `client.currency` (NOT tenant.currency); arch test verifica.
- `approved_at` + `approved_by_user_id` requeridos antes incluir en invoice. State machine: `draft → submitted → approved → invoiced`.

## Invoice generation

Invoice agregada de:
1. `time_entries` aprobadas en período + project billable=true.
2. Flat fees (one-time charges, ej. setup).
3. Retainers recurrentes (monthly subscription a la agencia).

### Currency policy
- Invoice currency = `client.currency` SIEMPRE. NO convert a tenant currency.
- Cliente USA en USD → invoice en USD. Cliente AR en ARS → invoice en ARS. Cliente CL en CLP → invoice en CLP.
- Reporting tenant-side puede convert a tenant currency con FX snapshot (separate read model), pero invoice stored y emitido en client currency.
- Arch test `nicolify/backend/tests/architecture/test_invoice_currency_client.py` enforces.

### Integrity check
- `sum(invoice_line_items.amount where source=time_entry)` MUST == `sum(time_entries.hours_decimal * hours_decimal.hourly_rate where invoice_id = X)`.
- Test obligatorio cada PR tocando invoice generation.

## Proposal lifecycle

Stages canónicos: `draft | sent | viewed | accepted | rejected | expired`.

Transition rules (validator strict):

| From | Allowed To |
|---|---|
| `draft` | `sent` |
| `sent` | `viewed`, `expired` |
| `viewed` | `accepted`, `rejected`, `expired` |
| `accepted` | (terminal — triggers deal stage update) |
| `rejected` | (terminal) |
| `expired` | `draft` (clone como nueva) |

- `viewed` autodetectado via tracking pixel email / portal access log.
- `expired` cron diario: proposals con `expires_at < now()` y stage `sent | viewed` → expired.
- Notification webhooks: `proposal.viewed`, `proposal.accepted` emit a `core/luana-core-events/` outbox (no fire-and-forget).
- `accepted` event handler MUST update Deal stage en CRM a `won` mismo transaction (idempotency key = proposal_id).

## Contract management

Brand-extension `nicolify/backend/src/modules/nicolify/contracts/`.

- Templates DOCX/PDF rendered con variables tenant + client + project + price.
- Signature workflow: integración DocuSign (tier paid) o e-signature LatAm (Firmar.online, Validatel, Acepta.com).
- `audit_log` MUST registrar cada contract open por client (from_ip, user_agent, timestamp).
- Contract states: `draft | sent_for_signature | signed | countersigned | active | expired | terminated`.
- `signed` → `active` transition con `signed_at` timestamp + `signature_id` from provider.

## Client portal

Brand-extension `nicolify/frontend/src/features/client-portal/`.

### Auth separada
- Clerk separate org `client_users` (NO mismo org que tenant staff).
- JWT carga `client_id` + `tenant_id` + role `client_viewer | client_approver`.
- Login URL: `https://{tenant}.nicolify.com/client/login` separada del staff dashboard.

### Vista read-only
- Solo lee: proposals enviadas a su `client_id`, contracts firmados, invoices emitidos, time_entries de sus projects.
- TODA query portal aplica filter `.where(Model.client_id == jwt.client_id, Model.tenant_id == jwt.tenant_id)`.
- Arch test `nicolify/backend/tests/architecture/test_client_portal_filter.py` enforces dual filter.
- `client_approver` role puede aprobar time_entries / accept proposals; `client_viewer` solo lee.

## CRM enterprise

Stages canónicos: `lead | qualified | opportunity | proposal | negotiation | won | lost`.

- Deal value tracked + forecast (`expected_close_date`, `probability_pct`).
- Forecast revenue = `sum(deals.value * deals.probability_pct / 100 where expected_close_date in quarter)`.
- Pipeline view multi-stage Kanban con drag-drop.
- Lost deals registran `lost_reason` enum (price, timing, competitor, no_budget, no_decision, other).

## Tests requeridos

PR nicolify tocando `time_entries`, `invoices`, `proposals`, `contracts`, `client_portal`, `crm/deals` MUST incluir tests:

1. **Billable sum == invoice line items:** create N time_entries → generate invoice → assert sum equality (currency-aware).
2. **Client currency preserved:** create time_entry con client.currency=ARS → invoice line items currency=ARS (no conversion).
3. **Portal client_id filter:** request portal con `jwt.client_id=A` queries returnean SOLO records `client_id=A`.
4. **Proposal state transition invalid:** `draft → accepted` skip → 409 conflict.
5. **Contract audit on open:** open contract → audit_log row con action=`contract_opened`, from_ip, ua.
6. **Deal stage on proposal accept:** proposal `accepted` event → Deal stage actualizado `won` mismo transaction.
7. **Hours bounds:** create time_entry con `hours_decimal=25.0` → validator raise.

## Anti-patterns prohibidos

- Facturar `billable=false` sin `override_reason` + audit_log row.
- Mostrar time_entries de otro `client_id` en portal (single filter `tenant_id` sin `client_id`). CRITICAL leak.
- Convert invoice currency a tenant currency (rompe contrato con cliente).
- Contract sin signature audit trail (open silencioso no registrado).
- Proposal `accepted` sin actualizar Deal stage (CRM se desincroniza).
- Hardcodear `'USD'` en time_entry o invoice (siempre `client.currency`).
- `hourly_rate` null en `billable=true` (cobra $0 silencioso).
- Portal client expuesto en mismo Clerk org que staff (privilege escalation risk).
- Forecast revenue counting `lost` deals.
- Time entry creado con `entry_date > today` (future entry) sin flag explícito.

## Referencias

- Raíz: `.claude/rules/tenant-isolation.md`, `.claude/rules/currency-handling.md`, `.claude/rules/master-data.md`, `.claude/rules/auditor-downstream-regression.md`
- Brand config: `nicolify/config/brand.yaml` (client_portal_enabled, currency_per_client: true)
- Brand module home: `nicolify/backend/src/modules/nicolify/`
- E-signature adapters: `nicolify/backend/src/modules/nicolify/contracts/adapters/`
- CRM core: `core/luana-core-crm/`
- Currency engine: shared `master-data` raíz
