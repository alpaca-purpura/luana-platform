# InmoFlow — Portales Sync + Geo Lead Routing + Financial Calculators

**Overlay:** extiende `.claude/rules/` raíz Luana platform (refuerza `tenant-isolation.md` + `anti-duplication.md`).
**Brand:** inmoflow (Real Estate — brokers, agencias bienes raíces)
**Scope:** sync bidireccional portales inmobiliarios (MercadoLibre Inmuebles/ZonaProp/Idealista/Properati), lead routing por zona geográfica/precio/tipo, calculadoras hipotecarias multi-banco.

## Regla cardinal

Property listings son el inventario crítico — desincronización entre portales = leads perdidos. TODA propiedad publicada DEBE sincronizarse a portales activos en <5min (eventual consistency con outbox). Lead routing DEBE ser determinístico (mismo lead → mismo agente, no random) basado en rules zona+especialización. Calculadoras financieras NUNCA mostrar tasas hardcoded — siempre fetch desde banco partner via API o config diaria.

## Brand-extension layout

- `inmoflow/backend/src/modules/inmoflow/properties/` — Property aggregate + lifecycle (`draft | active | reserved | sold | archived`).
- `inmoflow/backend/src/modules/inmoflow/portals/{meli,zonaprop,idealista,properati}/` — adapters per-portal.
- `inmoflow/backend/src/modules/inmoflow/lead_routing/` — geo + skill-based router.
- `inmoflow/backend/src/modules/inmoflow/financial/` — calculadoras hipoteca/préstamos.

## Portales sync

### Adapter contract
- Cada adapter implementa `PortalAdapter` desde `core/luana-core-connections/` (lift candidate cuando emerge en ≥2 brands).
- Métodos: `publish_listing()`, `update_listing()`, `archive_listing()`, `pull_leads()`, `sync_status()`.
- Push-based (lupulo-style): cambio en property → outbox event → worker pushea a portales activos.

### Idempotency portal_listing_id
- Tabla `portal_listings` UNIQUE `(tenant_id, property_id, portal_slug)` + `external_listing_id` (from portal).
- Retry publish con misma property → update no insert.

### Conflict resolution
- Property en lupulo state `archived` mientras portal lo muestra `active` → reconcile via cron pull (portal-wins en specific edge: agente editó manualmente en portal).
- Diff detection: hash listing payload — sync solo si changed.

## Geo lead routing

### Routing rules
- Lead llega con `geo_zone | property_type | price_range | language`.
- Tabla `agent_specializations`: `(tenant_id, agent_id, zone_polygons[], property_types[], price_min/max, languages[])`.
- Router resuelve match → asigna `lead.assigned_agent_id` determinístico (LRU dentro de matches para load balancing).
- Fallback: zone manager si no hay match exacto.

### Anti-circular routing
- Lead reasignable solo via supervisor manual (NOT automated reassignment cycle).
- Tabla `lead_assignment_history` append-only (auditabilidad cross-quarter).

## Calculadoras financieras

- Tasas hipoteca: tabla `mortgage_rates` per banco partner + currency + plazo + LTV. Updated daily via cron (banco APIs o manual admin).
- Calculadora NUNCA hardcoda tasa — siempre lookup desde tabla.
- Currency: respetar `master-data.md` — locale tenant determina default, override per query si listing en otra currency.

## Tests requeridos

PR inmoflow tocando `properties`, `portals`, `leads`, `routing`, `mortgage`, `calculator` MUST incluir tests:

1. **Idempotency portal publish:** mismo property + portal → no duplica listing.
2. **Tenant_id filter:** queries siempre filtran tenant_id.
3. **Lead routing determinístico:** mismo lead input → mismo agent assignment.
4. **Geo zone match:** lead en zona Z + agente con zone polygon containing Z → match.
5. **Mortgage rate fresh:** calc usa rate updated <24h o falla loud (NEVER stale silent).
6. **Portal sync diff skip:** listing checksum unchanged → no API call (cost saving).
7. **Currency in calc:** calculadora respeta currency de listing (no hardcoded USD).

## Anti-patterns prohibidos

- Listing sync sync-blocking (debe ser outbox async; portal API timeouts no rompen UI).
- Lead routing random (no determinístico = supervisor pesadilla para auditar).
- Tasa hipoteca hardcoded en código (cualquier rate fuera de DB = revert).
- Portal adapter sin contract test (mirror lupulo POSAdapter pattern).
- Cross-tenant property visibility (single missing filter).
- Listing `sold` reusable (soft delete only; perdés histórico market data).

## Referencias

- Raíz: `.claude/rules/tenant-isolation.md`, `.claude/rules/anti-duplication.md`, `.claude/rules/master-data.md`
- Brand config: `inmoflow/config/brand.yaml`
- Brand module home: `inmoflow/backend/src/modules/inmoflow/`
- Connections base: `core/luana-core-connections/` (lift point para portales adapters cross-brand)
- Outbox pattern: `core/luana-core-events/`
