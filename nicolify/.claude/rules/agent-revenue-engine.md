# Nicolify — Agent Revenue Engine (autonomía + token economy + CRM account model + outbound compliance)

**Overlay:** extiende `.claude/rules/` raíz Luana platform (refuerza `tenant-isolation.md` + `currency-handling.md` + `anti-duplication.md`).
**Brand:** nicolify (Agent-as-a-Service para agencias y servicios profesionales B2B LatAm).
**Cement-date:** 2026-05-29. **Reemplaza:** `b2b-billable-hours.md` (legacy framing project-billing descartado).
**Scope:** stories que tocan los agentes (Luana/Abel/Brenda/Christian/Sara/Norvil), su autonomía, el metering de tokens, el modelo CRM cuenta/stakeholder, el delivery de proyectos, y el outbound.

> ⚠️ **ASPIRACIONAL (verify-first 2026-06-02)** — Nicolify está en **rebuild agentic-first** (reset 2026-05-29): `nicolify/backend/src/modules/nicolify/` es esqueleto (solo `__init__.py`). Los agentes, el CRM cuenta/stakeholder, la token economy y los guardrails de autonomía descritos aquí son el **diseño target** — las invariantes aplican a medida que se construyen story-by-story (releases R0..RN). No asumas que los módulos ya existen.

## Regla cardinal

En Nicolify, **el producto es el equipo de agentes**, no un set de herramientas. Toda story respeta 4 invariantes simultáneas:

1. **Luana orquesta, los agentes ejecutan.** Luana NUNCA ejecuta una acción de negocio (pautar, prospectar, contactar, apagar campaña) directamente — siempre delega al agente owner del territorio. Luana rutea, resume y reporta.
2. **Autonomía con guardrails + audit.** Toda acción autónoma de un agente (especialmente Brenda apagando campañas, Christian enviando outbound, Norvil proponiendo upsell) registra un audit row + se reporta vía Luana. Umbrales/permisos vienen de config del tenant, NUNCA hardcodeados.
3. **Token economy protege el margen sin romper confianza.** Toda llamada LLM se mide y atribuye a (agente, acción, tenant). Las funciones críticas (soporte + recepción pasiva de leads) nunca se cortan por agotamiento de bolsa.
4. **Consumir engine, no recrear.** Orquestación agéntica, observabilidad/costo, CRM, canales, billing viven en `core/luana-core-*` — Nicolify extiende vía Extension SDK, jamás mirror.

## 0. Encaje con el paradigma (3 planos / 3 zonas)

Esta rule es el aterrizaje brand-specific del **paradigma platform-wide** (`docs/architecture/luana-platform/PARADIGM.md` + `ADR-010`, adaptado a nicolify en `ADR-nicolify-002`). Las 4 invariantes de arriba SON las invariantes del paradigma vistas desde Nicolify:

| Invariante nicolify (arriba) | Plano del paradigma |
|---|---|
| "Luana orquesta, los agentes ejecutan" | **Plano 3** — supervisora única + especialistas scoped (un solo engine por audiencia) |
| "Consumir engine, no recrear" + acción de negocio invocada (pautar/prospectar/contactar) | **Plano 2** — capa de acción única (service layer DDD); web y agentes ejecutan la misma acción, jamás reimplementan |
| Las capacidades B2B reales (CRM, pauta, propuestas, salud de cuenta) | **Plano 1** — el sistema; funciona sin agentes, operable a mano |

**Audiencia (PARADIGM §3.2 · ADR-nicolify-002 D-B):** internos (`copilot`, hablan al **dueño**) = Luana, Abel, Brenda, Sara, Norvil. **Christian es el bifronte** (`copilot` + `sales_agent`): el dueño le pide reuniones (interno) y él contacta prospectos + atiende la recepción pasiva de leads inbound (externo, front-line único).

**Sara (Jefa de Proyectos · ADR-nicolify-002 D-D):** dueña de la operación del día a día (delivery de proyectos de clientes activos). Su `mi-dia` es el landing operativo post-login (equivalente a Mateo de vitalia con lógica de agencia). Separación: Sara = ejecución/delivery del trabajo · Norvil = salud comercial/retención · Luana = digest cross-ciclo.

**Hogar de toda cap (3 zonas · `SYSTEM-MAP.yaml::zones`):** Agentes (abel/brenda/christian/norvil — Luana supervisora fuera del grid) · Plataforma (acceso/onboarding/configuracion) · Infraestructura (seguridad-cumplimiento/observabilidad/plataforma-tecnica/motor-agentico). La caja se declara desde la **idea** vía el árbol de decisión de `.claude/rules/paradigm-arquitectura.md`; la zona se **deriva** del registro.

## 1. Modelo de agentes (territorio + autonomía)

| Agente | Owner module (brand-extension) | Engine consumido | Autonomía máxima |
|---|---|---|---|
| **Luana** | `nicolify/backend/src/modules/nicolify/copilot/` | `core/luana-core-copilot/` | Rutea/resume/prioriza · **0 acciones de negocio directas** |
| **Abel** | `.../copilot/` (workflow estrategia) + `.../offer/` | `core/luana-core-offer-studio/` | Propone oferta/ángulos · dueño ratifica posicionamiento |
| **Brenda** | `.../sales_agent/` (growth workflow) | `core/luana-core-channels/` + billing guards | **Apaga campañas** por umbral CAC/ROAS (config tenant) · reporta |
| **Christian** | `.../sales_agent/` (outbound workflow) | `core/luana-core-sales-agent/` + channels | Ejecuta secuencias · **escala humano para cierre** |
| **Sara** | `.../copilot/` (delivery workflow) + `.../delivery/` | `core/luana-core-crm/` + `core/luana-core-channels/` (Notion/Jira/Slack) + events | Orquesta el delivery de proyectos activos · alerta riesgos de entrega · **escala humano lo que requiere decisión** |
| **Norvil** | `.../copilot/` (account-health workflow) + `.../crm/` | `core/luana-core-crm/` | Propone cross/up-sell · **contacto comercial requiere aprobación humana** |

### Anti-patterns

- ❌ Luana ejecutando pauta/outbound/contacto directamente (debe delegar).
- ❌ Un agente actuando sin emitir audit row + report vía Luana.
- ❌ Mirror de orquestación/CRM/observabilidad en `nicolify/` cuando existe en `core/` (lift gate `/pm-luana` si falta).

## 2. Autonomía de Brenda (budget kill-switch)

Brenda puede apagar campañas perdedoras **sin aprobación previa** SOLO bajo estas condiciones:

- Los umbrales (`max_cac`, `min_roas`, `min_sample_spend`, `evaluation_window`) viven en `tenant.growth_policy`, NUNCA hardcodeados.
- La acción `pause_campaign` registra audit row `(tenant_id, agent=brenda, action=pause_campaign, campaign_id, reason, metrics_snapshot, timestamp)`.
- Luana reporta la acción al dueño en lenguaje natural en el siguiente resumen (no silenciosa).
- **Solo apaga** (acción defensiva). **Encender/escalar presupuesto** SIEMPRE requiere aprobación humana.

### Tests requeridos (story que toca Brenda autonomy)

1. `pause_campaign` con métricas bajo umbral → ejecuta + audit row creado.
2. `pause_campaign` con métricas sobre umbral → NO ejecuta.
3. `increase_budget` SIN aprobación humana → bloqueado (raise).
4. Umbral leído de `tenant.growth_policy`, no constante hardcodeada (arch test).

## 3. Outbound de Christian (compliance + autoridad del fundador)

Christian prospecta usando el **perfil real de LinkedIn del fundador/CEO** del tenant. Esto es tácticamente potente y reputacionalmente sensible:

- **Consentimiento explícito** del dueño registrado (`tenant.outbound_consent: {linkedin_profile_id, granted_by, granted_at}`) ANTES de cualquier acción outbound. Sin consentimiento → bloqueado.
- **Rate limits de plataforma** respetados (LinkedIn connection/message limits, email warmup/throttle) — config en `tenant.outbound_policy`, nunca burst hardcodeado.
- **Anti-spam:** secuencias respetan opt-out + supresión de contactos que ya respondieron + frecuencia máxima por contacto.
- **Cierre = humano.** Christian agenda reuniones y nutre; el cierre comercial lo hace una persona (Christian asiste, no decide).
- **Personalización con la voz del fundador** (no bot genérico) — pero el dueño aprueba la plantilla/secuencia antes de su primer envío.

### Tests requeridos (story que toca outbound)

1. Acción outbound sin `outbound_consent` → bloqueada.
2. Secuencia respeta rate limit de `tenant.outbound_policy` (no excede).
3. Contacto con `opted_out=true` → excluido de la secuencia.
4. Contacto que ya respondió → pausa secuencia automática (no insiste).

## 4. Token economy (metering + guardrails)

Nicolify es AaaS intensivo en LLM. El margen depende del metering:

- **Metering por (agente, acción, tenant):** toda llamada LLM registra costo vía `core/luana-core-observability/` (cost recording + FX resolver + pricing snapshots). NUNCA recrear el recorder.
- **Bolsa de tokens por tenant** según tier (suscripción base + límites de uso). Consumo descuenta de la bolsa.
- **Alertas progresivas** 80% / 95% / 100% de la bolsa → notificación al dueño (recarga antes de quedarse sin créditos).
- **Tier gating** (vía `core/luana-core-billing/` BudgetGuard): tenant Básico no puede invocar Christian/Norvil. Enforcement a nivel de capacidad (feature flag por tier), no solo UI.
- **Funciones críticas NUNCA se cortan** aunque la bolsa = 0:
  - Soporte (Luana responde dudas operativas).
  - **Recepción pasiva de leads por WhatsApp** (un lead entrante NUNCA se pierde por falta de créditos).
  - Las funciones **proactivas/intensivas** (outbound masivo, generación de creatives, enrichment batch) SÍ se pausan hasta recarga.

### Anti-patterns

- ❌ Llamada LLM sin registro de costo (margen ciego).
- ❌ Cortar recepción pasiva de leads / soporte por agotamiento de tokens (rompe confianza).
- ❌ Tier gating solo en UI (debe ser server-side feature flag por tier).
- ❌ Recrear cost recorder / FX resolver / pricing snapshot (usar engine observability).

### Tests requeridos (story que toca token economy)

1. Llamada LLM → cost row registrado con (agent, action, tenant, cost_usd).
2. Tenant Básico invoca Christian → bloqueado por tier gate (server-side).
3. Bolsa agotada → outbound masivo pausado PERO recepción pasiva de lead WhatsApp sigue respondiendo.
4. Alerta emitida al cruzar 80/95/100% de la bolsa.

## 5. CRM — modelo Cuenta vs Stakeholder

El B2B agencia separa **Cuenta** (la empresa cliente/prospecto) de **Stakeholder/Contacto** (las personas que deciden). Consume `core/luana-core-crm/`.

- **Account** (`account_id, tenant_id, company_name, industry, currency, lifecycle_stage, owner_user_id, health_score`).
- **Stakeholder** (`stakeholder_id, tenant_id, account_id, name, role, linkedin_url, decision_power, channel_prefs`) — N stakeholders por account.
- **Deal/Opportunity** ligado a `account_id` (no a un solo contacto) — multi tomador de decisión.
- Pipeline stages: `lead | qualified | opportunity | proposal | negotiation | won | lost` (lost registra `lost_reason`).
- **Currency:** `account.currency` puede diferir de `tenant.currency` — preservar moneda de la cuenta, NUNCA convertir on-write (ver `.claude/rules/currency-handling.md`). Reporting tenant-side usa FX snapshot read-model separado.
- **Tenant isolation:** toda query CRM filtra `tenant_id` (raíz). Queries que exponen datos a una cuenta específica filtran además `account_id`.

### Anti-patterns

- ❌ Deal ligado a un contacto en vez de a la cuenta (pierde multi-stakeholder).
- ❌ Convertir `account.currency` a `tenant.currency` on-write.
- ❌ Forecast contando deals `lost`.
- ❌ Query CRM sin filtro `tenant_id`.

## 6. Propuestas / contratos (superficie que operan Christian/Norvil)

- Lifecycle propuesta: `draft | sent | viewed | accepted | rejected | expired` (transiciones validadas; `accepted` actualiza Deal stage a `won` mismo transaction, idempotency key = proposal_id).
- Firma electrónica eIDAS-like LatAm (AR Ley 25.506 · MX FIEL · CO Ley 527 · BR ICP-Brasil) cuando aplique — adapters en `nicolify/backend/src/modules/nicolify/contracts/adapters/`.
- Audit row por apertura de propuesta/contrato (from_ip, user_agent, timestamp).
- Eventos `proposal.viewed` / `proposal.accepted` → outbox `core/luana-core-events/` (no fire-and-forget).

## 7. Descartado del scope (legacy pre-reset)

El framing legacy de Nicolify (pre-2026-05-29) trataba al producto como herramienta de **horas facturables + portal de cliente**. **Descartado:**

- ❌ `time_entry` / billable hours / time-tracking del staff de la agencia — NO es core (lo resuelve la contable de la agencia).
- ❌ Generación de invoices de los clientes finales de la agencia — fuera de scope.
- ❌ Client portal como portal de facturación — reframe opcional como portal de cuenta/lead si una story futura lo justifica, pero NO es core day-1.

Si una story futura necesita billing del cliente final → escalar a Chris (decisión de scope, no asumir).

## Referencias

- Raíz: `.claude/rules/tenant-isolation.md`, `.claude/rules/currency-handling.md`, `.claude/rules/anti-duplication.md`, `.claude/rules/anti-duplication-refining.md`, `.claude/rules/master-data.md`
- Brand vision: `nicolify/docs/product/vision.md`
- Brand config: `nicolify/config/brand.yaml`
- Brand module home: `nicolify/backend/src/modules/nicolify/`
- Engine: `core/luana-core-{copilot,sales-agent,crm,offer-studio,observability,channels,billing,events}/`
- Skills: `copilot-expert`, `sales-agent-expert` (cargar al tocar módulos agénticos)
