<!-- voseo-allowed: brand-specific technical rule — references vertical patterns -->
# Field Services & Local SEO — Fixia Cardinal Rule

**Vertical:** Servicios Hogar + Oficios (técnicos en campo)
**Brand:** Fixia
**Aplica a:** toda sesión que toque `fixia/backend/` o `fixia/frontend/` o `fixia/config/`.

## Regla cardinal

El diferenciador core de Fixia es la **triada operacional en campo**:
1. **Despacho de técnicos** — asignación dinámica por zona, disponibilidad y especialidad.
2. **Cotización on-site mobile** — flujo de creación de presupuesto desde dispositivo móvil del técnico.
3. **Reseñas locales SEO automatizadas** — generación y distribución de reseñas post-servicio para posicionamiento local.

Toda feature nueva DEBE encajar en al menos uno de estos tres pilares.
Features que no sirven a la triada operacional → escalar a `/pm-fixia` antes de implementar.

## Despacho de técnicos (field_technician_dispatch)

- **Zona geográfica es filtro primario.** Todo técnico tiene `service_zones: list[str]` (códigos de zona). Queries de dispatch SIEMPRE filtran por zona antes de disponibilidad.
- **Especialidades requeridas.** Cada solicitud de servicio lleva `required_skills: list[str]`. El matcher filtra técnicos con `technician.skills ⊇ required_skills`.
- **Estado del técnico** es `available | en_route | on_site | unavailable`. Transiciones válidas: available → en_route → on_site → available. NO permitir saltos de estado.
- **Audit trail obligatorio.** Cada cambio de estado técnico DEBE emitir evento de dominio `TechnicianStatusChanged` con timestamp UTC, `technician_id`, `tenant_id`, estado anterior y nuevo. No hay cambio de estado silencioso.
- **Tenant isolation:** todo query de dispatch DEBE incluir `.where(Technician.tenant_id == tenant_id)`. Sin excepción.

## Cotización on-site mobile (on_site_quotation)

- **Modo offline-first.** El flujo de cotización debe ser funcional sin conexión a internet (local draft con sync posterior). No asumir conectividad estable en campo.
- **Aprobación en tiempo real.** El cliente debe poder aprobar el presupuesto digitalmente en el sitio (firma digital o código de confirmación). El sistema NO emite orden de trabajo sin aprobación explícita (`QuotationApprovedByClient` event requerido).
- **Fotografía como evidencia.** Las cotizaciones DEBEN soportar adjuntar fotos del estado actual (pre-trabajo). Mínimo 1 foto requerida para cotizaciones con valor > umbral configurable por tenant.
- **Desglose obligatorio.** El presupuesto on-site DEBE mostrar: materiales, mano de obra, tiempo estimado, y total. Ningún campo puede quedar en null si el estado es `approved`.
- **Validación de precios.** Usar `tenant_price_list` como referencia. Alertar (no bloquear) si precio manual difiere >20% del precio lista. Log del override obligatorio.

## Reseñas locales SEO (local_seo_reviews)

- **Trigger post-servicio.** Las reseñas se solicitan automáticamente cuando el trabajo pasa a estado `completed`. El delay configurable por tenant (default: 2 horas post-completion).
- **Multi-plataforma.** Las reseñas se distribuyen a Google Business Profile, Facebook y plataformas configuradas por tenant. Nunca solo una plataforma.
- **No fabricación.** El sistema asiste al cliente a redactar la reseña (sugerencias de puntos positivos basadas en el servicio completado) pero NUNCA publica texto sin confirmación explícita del cliente. Prohibido auto-publicar.
- **Privacidad del cliente.** El sistema NO incluye información PII del cliente en el texto sugerido de reseña. Usar solo tipo de servicio, zona genérica (no dirección exacta) y fecha.
- **SEO keywords.** Las sugerencias de reseña deben incluir naturalmente: nombre del servicio, ciudad/barrio del tenant, y especialidad del técnico. Confirmar con `/pm-fixia` la lista de keywords por tenant.

## Anti-patterns prohibidos (Fixia-específicos)

- **NO** dispatch sin filtro de zona (`service_zones`) — genera asignaciones cross-zona inválidas.
- **NO** cotización sin `QuotationApprovedByClient` event — la orden de trabajo no puede existir sin aprobación.
- **NO** asumir conectividad en flujo mobile — todo feature mobile debe tener modo degradado offline.
- **NO** auto-publicar reseñas sin confirmación explícita del cliente — riesgo legal y de reputación.
- **NO** cambios de estado de técnico sin emitir `TechnicianStatusChanged` event.
- **NO** hardcodear zonas geográficas — las zonas son configuración por tenant en `fixia/config/brand.yaml` o en la tabla `service_zones` de la DB.
- **NO** mirror de lógica de dispatch en otros brand backends — si hay lógica reutilizable, escalar a `/pm-luana` para lift a `core/luana-core-platform/` (promotion gate).

## Prioridades de diseño mobile

- Formularios con inputs grandes (mínimo 44px touch target).
- Flujos críticos (cambio de estado, cotización, firma) en 3 pasos o menos.
- Feedback visual inmediato para acciones en campo (no spinners de más de 500ms sin mensaje).
- Cámara nativa para adjuntar fotos (no uploads desde galería como único método).

## Referencias

- `fixia/config/brand.yaml` — feature flags + infra metadata
- `fixia/docs/product/` — SSoT brand (outcomes, stories, backlog)
- `/pm-fixia` skill — PM de la vertical
- `core/luana-core-extension-sdk/` — Extension SDK EP-1..EP-18 (dispatch, quotation y reviews se registran vía EP correspondiente)
- `.claude/rules/tenant-isolation.md` — aplica sin excepción en dispatch queries
- `.claude/rules/anti-duplication.md` — dispatch engine candidato a lift si se replica en otra vertical
