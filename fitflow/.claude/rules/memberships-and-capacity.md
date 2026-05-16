<!-- voseo-allowed: brand-specific technical rule — references vertical patterns -->
# Memberships & Capacity — FitFlow Cardinal Rule

**Vertical:** Fitness + Deporte
**Brand:** FitFlow
**Aplica a:** toda sesión que toque `fitflow/backend/` o `fitflow/frontend/` o `fitflow/config/`.

## Regla cardinal

El diferenciador core de FitFlow es la **cuadriga operacional del fitness**:
1. **Membresías recurrentes** — facturación automática, pausa, cancelación y reactivación.
2. **Control de aforo** — cupo máximo por clase y por instalación en tiempo real.
3. **Calendario de clases** — programación, reservas, cancelaciones y listas de espera.
4. **Waivers digitales** — firma de descargo de responsabilidad antes de la primera clase.

Toda feature nueva DEBE encajar en al menos uno de estos cuatro pilares.
Features que no sirven a la cuadriga → escalar a `/pm-fitflow` antes de implementar.

## Membresías recurrentes (recurring_memberships)

- **Stripe es el procesador canónico.** Las membresías recurrentes DEBEN implementarse usando Stripe Subscriptions. No reinventar facturación recurrente propia. El `stripe_subscription_id` es el identificador externo en la DB, con `tenant_id` como discriminador mandatorio.
- **Estados de membresía.** Los estados válidos son: `active | paused | cancelled | past_due | trialing`. Transiciones permitidas: ver `membership_state_machine.py` (pendiente implementar). NO permitir estados ad-hoc.
- **Gracia period.** Cuando Stripe reporta `past_due`, dar 3 días de gracia antes de suspender el acceso. El período es configurable por tenant (`grace_period_days`, default=3).
- **Pausa de membresía.** Las pausas tienen `pause_start_date` y `pause_end_date`. Una membresía pausada no genera cargo pero mantiene el derecho a reactivar sin penalización. Stripe Subscription `pause_collection` mode.
- **Tenant isolation.** Todo query de membresías DEBE incluir `.where(Membership.tenant_id == tenant_id)`. Sin excepción.
- **Eventos de dominio obligatorios.** Cada cambio de estado DEBE emitir evento: `MembershipActivated`, `MembershipPaused`, `MembershipCancelled`, `MembershipReactivated`, `MembershipPastDue`. No hay cambio de estado silencioso.

## Control de aforo (capacity_control)

- **Aforo como invariante de negocio.** El cupo máximo de una clase (`max_capacity`) NO puede ser violado. La lógica de reserva DEBE ser atómica (no permitir race conditions que excedan el cupo).
- **Listas de espera automáticas.** Cuando el cupo se llena, las reservas adicionales entran a `waitlist`. Si un miembro cancela, el siguiente en waitlist DEBE recibir notificación automática y tiene `waitlist_promotion_window_minutes` (configurable, default=60) para confirmar antes de ceder el lugar.
- **Aforo en tiempo real.** El frontend DEBE mostrar cupos disponibles en tiempo real (no estimado ni cacheado con >30s de lag). Usar Redis para el contador de aforo en curso (fallback a DB si Redis no disponible).
- **Por instalación y por clase.** El aforo existe en dos niveles: por instalación (máximo concurrente en el gym) y por clase (cupo específico). Ambos niveles DEBEN validarse al hacer reserva.

## Calendario de clases (class_calendar)

- **La clase es el contrato.** Una clase tiene `instructor_id`, `room_id`, `start_datetime`, `end_datetime`, `max_capacity`, `class_type_id`. Ninguno puede ser null cuando la clase está publicada.
- **Cancelación de clase por instructor.** Si una clase se cancela por el instructor o por la instalación, todos los miembros inscritos DEBEN ser notificados automáticamente (email + push si disponible). El sistema DEBE ofrecer crédito de clase o reagendamiento como opción.
- **Recurrencia configurable.** Las clases pueden ser recurrentes (mismo horario semana a semana). La recurrencia DEBE generar instancias individuales en la DB (no recalcular en runtime) para soportar excepciones (festivos, instructor enfermo).
- **Timezone del tenant.** Todas las fechas/horas de clases DEBEN almacenarse en UTC en la DB y convertirse al timezone del tenant para display. NUNCA hardcodear timezone.

## Waivers digitales (digital_waivers)

- **Firma antes de primera clase.** El sistema DEBE bloquear el acceso a la primera clase si no existe `waiver_signature` activa para el miembro. No es opcional.
- **Versión de waiver.** Los waivers tienen `waiver_version`. Si el tenant actualiza el texto del waiver, todos los miembros deben re-firmar. El sistema DEBE notificar al miembro y bloquear el acceso después de `waiver_resign_grace_days` días (configurable, default=7).
- **Inmutabilidad.** Una firma de waiver (`WaiverSignature`) es inmutable después de creada. NUNCA modificar. Si el waiver cambia → nueva `WaiverSignature` requerida.
- **PII.** El nombre y firma digital del miembro son PII. `sanitize_payload()` obligatorio en todos los logs que incluyan datos de waiver.

## Anti-patterns prohibidos (FitFlow-específicos)

- **NO** aforo sin atomicidad — usar SELECT FOR UPDATE o equivalent al reservar cupo.
- **NO** facturación recurrente fuera de Stripe Subscriptions — no reinventar.
- **NO** estados de membresía ad-hoc fuera de los 5 estados canónicos.
- **NO** mostrar aforo sin tiempo real (>30s lag inaceptable).
- **NO** permitir acceso a clase sin waiver vigente — es bloqueante.
- **NO** modificar `WaiverSignature` después de creada — inmutable.
- **NO** hardcodear timezone en fechas de clase.
- **NO** loggear PII de miembros sin `sanitize_payload()`.
- **NO** mirror de lógica de membresías en otros brand backends — escalar a `/pm-luana` para lift a `core/luana-core-billing/` o `core/luana-core-platform/` (promotion gate).

## Referencias

- `fitflow/config/brand.yaml` — feature flags + infra metadata
- `fitflow/docs/product/` — SSoT brand (outcomes, stories, backlog)
- `/pm-fitflow` skill — PM de la vertical
- `core/luana-core-billing/` — engine de billing (BudgetGuard + RateLimiter)
- `core/luana-core-platform/` — scheduling + locale VO
- `core/luana-core-extension-sdk/` — Extension SDK EP-1..EP-18
- `.claude/rules/tenant-isolation.md` — aplica sin excepción en todas las queries
- `.claude/rules/anti-duplication.md` — memberships/capacity engine candidatos a lift si se replican en otra vertical
