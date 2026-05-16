# Retailly — E-commerce Cart Recovery + Catalog Sync + Logistics

**Overlay:** extiende `.claude/rules/` raíz Luana platform (refuerza `tenant-isolation.md` + `anti-duplication.md` + master-data currency).
**Brand:** retailly (E-commerce / D2C — tiendas online, marcas productos físicos)
**Scope:** sync bidireccional Shopify/WooCommerce, cart recovery flow multi-canal, cross-selling checkout, logística carriers (Andreani/OCA/UPS).

## Regla cardinal

Catálogo es el inventario crítico — discrepancia stock entre Shopify/WooCommerce y Retailly = ventas overselling (refund obligatorio). Cart recovery DEBE respetar consent legal (opt-in explícito + suppression list) — spam a usuarios sin consent = ban canal. Cross-selling checkout NUNCA inflar precio o agregar items sin acción usuario (dark pattern banned). Logistics carriers son críticos para SLA — perdés tracking event = customer ticket.

## Brand-extension layout

- `retailly/backend/src/modules/retailly/catalog/` — Product aggregate + stock state machine.
- `retailly/backend/src/modules/retailly/ecommerce/{shopify,woocommerce,tiendanube}/` — adapters per-platform.
- `retailly/backend/src/modules/retailly/cart/` — cart state + recovery flow.
- `retailly/backend/src/modules/retailly/logistics/{andreani,oca,ups,fedex}/` — carrier adapters.

## E-commerce platform sync (Shopify/WooCommerce/Tiendanube)

### Pull-based primary, push opcional
- Catálogo: pull cada 15min desde plataforma (webhook si supported = preferred).
- Stock: pull realtime via webhook `inventory_levels/update` (Shopify) / `wc-update-product-stock` (WooCommerce).
- Source of truth: la plataforma. Conflict = platform-wins (mismo patrón POS-wins lupulo).

### Adapter contract
- `EcommercePlatformAdapter` interface en `core/luana-core-connections/` (lift candidate).
- Métodos: `sync_catalog()`, `pull_orders()`, `update_stock()`, `subscribe_webhooks()`.

### Idempotency order_id
- Tabla `orders` UNIQUE `(tenant_id, platform, external_order_id)`.
- Webhook retry → no duplica.

## Cart recovery flow

### Consent + suppression
- Tabla `cart_recovery_consent` per (tenant_id, customer_email): `opted_in_at | opted_out_at | suppressed_until`.
- NUNCA enviar mensaje sin `opted_in_at IS NOT NULL` + `opted_out_at IS NULL`.
- Bounce/complaint webhook → auto-suppress.

### Multi-channel
- Email primero (24h post abandonment), WhatsApp/SMS opcional si opted-in (48-72h).
- Cap: max 3 mensajes per abandoned cart (avoid spam classification).

## Cross-selling checkout

- Recommendations engine query last N orders del customer + collaborative filtering same tenant.
- UI: card opcional "También te puede interesar" — NUNCA auto-add. Toggle explícito user.
- Logging: `cross_sell_impressions` para measurement CTR.

## Logistics carriers

### Adapter contract
- `CarrierAdapter` interface: `create_shipment()`, `get_tracking()`, `subscribe_events()`.
- Eventos canónicos: `label_printed | picked_up | in_transit | out_for_delivery | delivered | failed_attempt | returned`.
- Outbox obligatorio para eventos tracking — perdés `delivered` = customer no notificado.

### Currency
- Shipping cost en currency tenant (per master-data.md).
- NEVER hardcode USD.

## Tests requeridos

PR retailly tocando `catalog`, `cart`, `orders`, `recovery`, `shopify`, `woocommerce`, `logistics`, `carrier` MUST incluir tests:

1. **Webhook idempotency:** mismo order_id 2× → no duplica.
2. **Tenant_id filter:** all queries.
3. **Stock sync platform-wins:** local stock=5, platform stock=3 → final stock=3.
4. **Cart recovery consent gate:** sin opt-in → no message dispatched.
5. **Suppression on bounce:** webhook bounce → next dispatch attempt skipped.
6. **Cross-sell no auto-add:** suggestion clicked → still requires explicit add action.
7. **Carrier event via outbox:** `delivered` → row outbox_events.
8. **Currency respect:** order in MXN → shipping cost displayed MXN, no USD conversion automatic.

## Anti-patterns prohibidos

- Stock local override sync (platform-wins always).
- Cart recovery sin consent (legal liability).
- Cross-sell auto-add (dark pattern, refund storm).
- Carrier event sync (debe ser outbox).
- Currency hardcoded USD en checkout.
- Webhook handler >30s (Shopify timeout retry storm).
- Product hard-delete (rompe order history references).

## Referencias

- Raíz: `.claude/rules/tenant-isolation.md`, `.claude/rules/anti-duplication.md`, `.claude/rules/master-data.md`, `.claude/rules/currency-handling.md`
- Brand config: `retailly/config/brand.yaml`
- Brand module home: `retailly/backend/src/modules/retailly/`
- Connections base: `core/luana-core-connections/`
- Outbox: `core/luana-core-events/`
