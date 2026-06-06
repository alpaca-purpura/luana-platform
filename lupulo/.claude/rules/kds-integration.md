# Lupulo — KDS + POS Integration + Reservation Lifecycle

**Overlay:** extiende `.claude/rules/` raíz Luana platform (refuerza `tenant-isolation.md` + `anti-duplication.md`).
**Brand:** lupulo (Gastronomía — restaurantes, bares, cafeterías)
**Scope:** integridad bidireccional POS/KDS ↔ lupulo, lifecycle reservas multi-canal, sync menú con resolution conflict POS-wins, event stream cocina via outbox para sales agent realtime.

> ⚠️ **ASPIRACIONAL (verify-first 2026-06-02)** — Lupulo es **placeholder, bootstrap pendiente**: NO existe `lupulo/backend/src/modules/lupulo/`. Los adapters POS/KDS (Toast/Square/Clover/Fudo), el reservation lifecycle y el contract `core/luana-core-connections/.../pos/base.py` descritos aquí son **diseño target** — esta rule reserva el slot; nada está implementado todavía.

## Regla cardinal

POS es la única source of truth del restaurant (menú, precios, stock). Toda integración POS/KDS DEBE ser idempotente (webhooks pueden retry N veces) y usar outbox para eventos kitchen (perder evento `order_ready` = cliente esperando indefinidamente). Reservation duplicada por race condition webhook = problema operativo grave (mesa double-booked).

## POS/KDS adapters

Brand-extension `lupulo/backend/src/modules/lupulo/connections/{toast,square,clover,fudo}/` — adapters per-POS-system.

### Adapter contract
- Cada adapter implementa interface `POSAdapter` desde `core/luana-core-connections/src/luana_core_connections/pos/base.py`.
- Métodos canónicos: `sync_menu()`, `push_reservation()`, `pull_reservations()`, `push_order()`, `pull_orders()`, `subscribe_kitchen_events()`.
- Adapter MUST anti-duplication: NO mirror logic — reusa `BaseConnectionAdapter` + tool registry.
- Arch test `lupulo/backend/tests/architecture/test_pos_adapter_contract.py` enforces interface compliance.

### Sistemas POS soportados
- **Toast** — US restaurants tier mid-high.
- **Square** — US/LatAm small business.
- **Clover** — US retail-resto.
- **Fudo** — LatAm-native (AR/MX/CL).

Nuevo adapter requiere PR con contract tests + sandbox account credentials documented + mock fixture set.

## Reservation lifecycle

Stages canónicos: `requested | confirmed | seated | completed | no_show | cancelled`.

### Webhooks bidireccionales
- Cliente reserva desde IG / WhatsApp / web → llega como `requested` → push a POS via adapter → si POS confirma capacity → `confirmed`.
- POS notifica `seated` cuando mesa asignada físicamente (KDS scan QR mesa o input manual mesero).
- `completed` cuando bill closed en POS.
- `no_show` cron 30min post `confirmed.scheduled_time` sin `seated`.

### Idempotency obligatoria
- TODA escritura reservation usa `external_reservation_id` (from POS) o `internal_idempotency_key` (UUID hash de `tenant_id + client_phone + scheduled_at`).
- Tabla `reservations` UNIQUE constraint `(tenant_id, external_reservation_id)` y `(tenant_id, internal_idempotency_key)`.
- Webhook duplicado (POS retry) → 200 OK return existing row, no duplica.
- Validator hard: PR sin idempotency key en reservation creation = revert.

## Menu sync

### POS-wins resolution
- Sync menu items POS ↔ lupulo via cron job (default 15min cadence) o webhook POS-side (preferred si disponible).
- Source of truth = POS. Conflict resolution: POS gana.
- Diff detection: hash menu state cada sync, sync solo si checksum cambió (NO full overwrite cada cron).
- Soft delete lupulo side cuando POS remueve item (preserva histórico orders).

### Checksum mandatory
- `menu_sync_log` table: `(tenant_id, pos_system, sync_at, checksum_before, checksum_after, items_changed_count)`.
- Sync sin checksum stored = wasteful full overwrite = anti-pattern prohibido (arch test enforces).

## KDS event stream

Kitchen events propagados via outbox `core/luana-core-events/`:

| Event | Payload | Consumer |
|---|---|---|
| `order_placed` | order_id, items, table_id, timestamp | sales_agent (cliente notify "tu pedido entró"), KDS display |
| `order_in_progress` | order_id, item_id, station | sales_agent (ETA estimation) |
| `order_ready` | order_id, item_id, ready_at | sales_agent ("tu pedido está listo"), waiter notify |
| `order_delivered` | order_id, delivered_at | analytics (avg fulfillment time), customer satisfaction prompt |

### Outbox obligatorio
- TODO kitchen event MUST escribir a outbox antes responder request POS adapter.
- Perder evento `order_ready` = cliente esperando indefinidamente = NEVER.
- Arch test `lupulo/backend/tests/architecture/test_kitchen_events_via_outbox.py` enforces (no direct EventBus.publish, only outbox).

### Sales agent realtime query
- Sales agent lupulo puede `query_order_status(order_id)` tool — reads from `orders` table (sync via outbox consumer).
- Agent responde "tu pedido sale en ~5min" basado en KDS state realtime.

## Hours / availability

Brand-extension `lupulo/backend/src/modules/lupulo/availability/`.

- Horario apertura per día (config `business_hours` per tenant + day_of_week + open_time + close_time + timezone).
- Disponibilidad mesas por turno (`table_slots` table: `tenant_id, table_id, date, slot_start, slot_end, capacity, booked_count`).
- Sales agent valida disponibilidad ANTES confirmar reservation (`check_availability` tool obligatorio en flow).
- Closed dates (holidays) configurables; sales agent declina reservation auto.

## Photo upload

- Menu items pueden tener fotos. Storage en `core/luana-core-assets/` (engine).
- MIME validation: solo `image/jpeg | image/png | image/webp`.
- Size limit: 5MB per image.
- **EXIF strip mandatory** (privacy: remove GPS coords + camera model + capture timestamp).
- Resize a max 1920px largest side, generar thumbnails 400px + 800px (responsive).
- CDN cache 30d.

## Tests requeridos

PR lupulo tocando `reservations`, `orders`, `menu`, `pos_adapter`, `kitchen_events`, `availability` MUST incluir tests:

1. **Idempotency external_id:** webhook reservation duplicado (mismo `external_reservation_id`) → 200 retorna existing, no inserta.
2. **Idempotency internal key:** crear reservation con mismo `(tenant_id, phone, scheduled_at)` → retorna existing, no duplica.
3. **Tenant_id filter:** queries reservation/order/menu siempre filtran tenant_id (no cross-restaurant leak).
4. **POS adapter contract:** adapter nuevo implementa todos métodos `POSAdapter` interface (arch fitness).
5. **KDS event via outbox:** trigger `order_ready` → assert row en `outbox_events` table (NO direct publish).
6. **Menu checksum skip:** sync con checksum unchanged → no UPDATE rows (verify via row_count o updated_at).
7. **Availability blocks reservation:** intentar reservar en slot con `booked_count == capacity` → 409 conflict.
8. **EXIF stripped:** upload jpeg con GPS metadata → stored file sin GPS exif.

## Anti-patterns prohibidos

- Sync menu sin checksum (full overwrite cada cron, waste DB + perdés histórico precisión).
- Reservation creation sin idempotency key (duplicar al webhook retry = double-booking).
- POS direct query desde frontend (siempre via brand-extension API; frontend NUNCA habla a Toast/Square directo — credentials leak).
- KDS events sin outbox (direct `EventBus.publish` = perder eventos en crash worker).
- Hardcodear POS system per tenant (siempre via `connections` table; nuevo POS = nuevo adapter, NO if-else).
- Menu item delete hard (perder histórico orders referencing item); soft delete only.
- Photo upload sin EXIF strip (privacy leak GPS del restaurant + cocina).
- Reservation `confirmed` sin pasar `check_availability` (mesa double-booked).
- Sales agent estimar ETA sin consultar KDS realtime (`query_order_status`).
- Cross-tenant menu visibility (single filter por error).

## Referencias

- Raíz: `.claude/rules/tenant-isolation.md`, `.claude/rules/anti-duplication.md`, `.claude/rules/auditor-downstream-regression.md`
- Brand config: `lupulo/config/brand.yaml` (pos_system, kds_enabled, photo_max_mb)
- Brand module home: `lupulo/backend/src/modules/lupulo/`
- POS adapter base: `core/luana-core-connections/src/luana_core_connections/pos/base.py`
- Outbox pattern: `core/luana-core-events/` + `.claude/rules/anti-default-flip-audit.md` (USE_OUTBOX_PATTERN_*)
- Assets storage: `core/luana-core-assets/`
