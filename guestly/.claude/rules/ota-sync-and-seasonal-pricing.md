<!-- voseo-allowed: brand-specific technical rule — references vertical patterns -->
# OTA Sync & Seasonal Pricing — Guestly Cardinal Rule

**Vertical:** Turismo + Hotelería
**Brand:** Guestly
**Aplica a:** toda sesión que toque `guestly/backend/` o `guestly/frontend/` o `guestly/config/`.

## Regla cardinal

El diferenciador core de Guestly es la **triada de hospitalidad conectada**:
1. **Motor de reservas estacional** — disponibilidad, pricing dinámico y bloqueos por temporada.
2. **Sincronización OTAs** — bidireccional con Airbnb y Booking.com (y futuras plataformas).
3. **Guest experience automatizado** — flujos de comunicación pre-llegada, durante estancia y post-checkout.

Toda feature nueva DEBE encajar en al menos uno de estos tres pilares.
Features que no sirven a la triada → escalar a `/pm-guestly` antes de implementar.

## Motor de reservas estacional (seasonal_booking_engine)

- **Disponibilidad como fuente de verdad.** El calendario de disponibilidad es el sistema de registro. Cualquier modificación (reserva, bloqueo, liberación) DEBE emitir evento de dominio `AvailabilityChanged` con timestamp UTC, `property_id`, `tenant_id`, rango de fechas y razón del cambio.
- **Pricing por temporada.** Las tarifas DEBEN derivarse de `rate_plans` configurados por tenant, no hardcodearse. Cada `rate_plan` tiene `season_id`, `base_rate`, `minimum_nights`, y `occupancy_multiplier`. NUNCA un precio fijo en código.
- **Mínimo de noches configurable.** El `minimum_nights` es por `rate_plan` + `property_id`. No existe un mínimo global. Validar en la API antes de crear reserva.
- **Tenant isolation.** Todo query de disponibilidad o tarifas DEBE incluir `.where(Property.tenant_id == tenant_id)`. Sin excepción.
- **Conflictos de reserva = error 409.** Nunca sobreescribir silenciosamente una reserva existente. Si hay solapamiento → retornar `ConflictError` con las reservas conflictivas citadas explícitamente.

## Sincronización OTAs (ota_sync_airbnb, ota_sync_booking)

- **iCal es el contrato de interoperabilidad.** Las integraciones OTA exportan/importan formato iCal (RFC 5545). NUNCA depender de APIs propietarias de OTA como fuente única de verdad — el calendario interno es SSoT.
- **Sync bidireccional requiere idempotencia.** Cada evento de sync MUST llevar `ical_uid` como identificador único. Re-importar el mismo UID no duplica la reserva — es idempotente.
- **Conflicto OTA vs reserva directa.** Si una reserva directa llega mientras una OTA tiene el mismo periodo bloqueado → prioridad configurable por tenant (`direct_booking_priority: true/false`). Default: error 409, no resolución automática.
- **Webhook de OTA = evento asíncrono.** Los webhooks de Airbnb/Booking deben procesarse vía cola (no request-response síncrono). El endpoint del webhook DEBE responder 200 inmediatamente y encolar el evento para procesamiento posterior.
- **Rate limits OTA.** Respetar rate limits de cada OTA (Airbnb: 100 req/min, Booking: varía por plan). Usar exponential backoff. Loggear intentos fallidos con `structlog` (no silenciar errores de sync).

## Guest experience automatizado (guest_experience_automation)

- **Comunicación en idioma del huésped.** Los mensajes automáticos DEBEN respetar el idioma configurado en la reserva (`reservation.guest_locale`). Si no hay locale → usar el `default_locale` del tenant. NUNCA asumir español.
- **Triggers de automatización deben ser configurables.** Los mensajes pre-llegada, bienvenida y post-checkout tienen timing configurable por tenant (horas antes/después del evento). No hardcodear "24 horas antes".
- **PII de huéspedes.** Nombre, email y teléfono del huésped son PII. DEBEN ser excluidos de logs. Usar `sanitize_payload()` de `luana_core_observability` antes de cualquier log. NUNCA en mensajes de error de UI.
- **Consentimiento de marketing.** Solo enviar comunicaciones de marketing si `reservation.guest_marketing_consent == True`. Las comunicaciones transaccionales (confirmación, check-in info) no requieren consentimiento adicional.

## Anti-patterns prohibidos (Guestly-específicos)

- **NO** pricing hardcodeado — usar `rate_plans` configurados por tenant.
- **NO** sobreescribir reserva existente sin `ConflictError` — el calendario interno es SSoT.
- **NO** procesar webhook OTA síncronamente — siempre encolar.
- **NO** asumir idioma del huésped — usar `reservation.guest_locale` con fallback a `tenant.default_locale`.
- **NO** loggear PII de huéspedes sin `sanitize_payload()`.
- **NO** enviar marketing sin `guest_marketing_consent == True`.
- **NO** depender de API propietaria OTA como única fuente de verdad — iCal interno es SSoT.
- **NO** mirror de lógica de sync OTA en otros brand backends — escalar a `/pm-luana` para lift a `core/luana-core-connections/` (promotion gate).

## Multi-language UI

Guestly tiene `multi_language_ui: true` en `brand.yaml`. La regla de español neutro LatAm (`.claude/rules/spanish-text.md`) aplica al UI en español, pero el sistema DEBE soportar internacionalización real (i18n) para huéspedes internacionales.

## Referencias

- `guestly/config/brand.yaml` — feature flags + infra metadata
- `guestly/docs/product/` — SSoT brand (outcomes, stories, backlog)
- `/pm-guestly` skill — PM de la vertical
- `core/luana-core-connections/` — engine de conexiones OTA (cuando se implemente)
- `core/luana-core-extension-sdk/` — Extension SDK EP-1..EP-18
- `.claude/rules/tenant-isolation.md` — aplica sin excepción en todas las queries
- `.claude/rules/anti-duplication.md` — OTA sync engine candidato a lift si se replica en otra vertical
