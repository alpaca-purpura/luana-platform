<!-- voseo-allowed: ADR interno de arquitectura, no user-facing -->
# ADR-nicolify-002 — Adaptación del paradigma (3 planos / 3 zonas) a Nicolify

- **Status:** accepted (ratificado Chris 2026-05-30 — "arranca, entendiste todo")
- **Date:** 2026-05-30
- **Scope:** brand nicolify. Aterriza el modelo operativo platform-wide en la marca.
- **Hereda de (platform, NO se duplica):** `docs/architecture/luana-platform/PARADIGM.md` + `ADR-010-orquestacion-agentica.md`.
- **Complementa:** `ADR-nicolify-001` (shell-feature, hereda ADR-vitalia-004) — ortogonal: 001 dice *cómo se construye una sub-tab*, este ADR dice *en qué zona/caja vive cada cap*.
- **Espejo de:** la story `vitalia-paradigm-map-zones` (vitalia migró; nicolify nace bien).

## Contexto

Nicolify hizo su rebuild agentic-first el **2026-05-29**. El paradigma de **3 planos / 3 zonas** se cementó en vitalia el **2026-05-30** (un día después), vía `PARADIGM.md` + `ADR-010` (ambos platform-wide → ya aplican a las 10 marcas). Nicolify quedó **a mitad de camino**: nació agentic (Luana supervisora, un solo engine, consumo de core), pero con el `SYSTEM-MAP.yaml` del **schema pre-zonas** (agentes + pseudo-agentes `config`/`infra`, sin sección `zones:`).

A diferencia de vitalia —que tuvo que **migrar** 71 caps shipped + realinear el shell (Valeria→supervisora, Mateo→Operar) con scripts de migración (story `vitalia-paradigm-map-zones`, 6 tickets)— nicolify está en **rebuild desde cero**: 0 caps user-facing shipped (solo `platform/nicolify-brand-runtime-foundation`), shell aún en `idea` (7 stories R0). **Nicolify NACE BIEN: no migra, define las cajas finales desde el día 1.**

## Decisión

Aterrizar el paradigma en nicolify vía el `SYSTEM-MAP.yaml::zones` (las 12 superficies de 1er nivel) + alinear el lenguaje de overlay/rule/vision/shell-contract a los 3 planos. Tres decisiones de adaptación específicas (ratificadas):

### D-A · Luana = supervisora pura, FUERA del grid de cajas Agentes

En vitalia, Valeria es supervisora **pero figura como caja** en `zones.agentes.boxes` (legado de cuando poseía agenda/bookings — migrados a Mateo). Nicolify **nace más limpio**: Luana es el **chat sidebar orquestador, NO está en el Ribbon** (ya cementado en `SHELL-DESIGN-CONTRACT` 2026-05-29) y **NO posee caja de proceso**.

→ `zones.agentes.boxes = [abel, brenda, christian, sara, norvil]` (5 cajas user-facing = los 5 del Ribbon — Sara incorporada en D-D). Luana se declara como `zones.agentes.supervisor: luana` + nota; su **runtime** (grafo supervisor LangGraph) se documenta en `infraestructura → motor-agentico`. No ocupa columna en el mapa de valor.

### D-B · Christian = el bifronte (= Adrián de vitalia) ⭐

Define los dos engines por audiencia (PARADIGM §3.2):

| Trabajador | Audiencia | Engine | Habla con |
|---|---|---|---|
| Luana, Abel, Brenda, Norvil | **interna** | `copilot` | el **dueño de la agencia** (operan el sistema por él) |
| **Christian** | **bifronte** | `copilot` + `sales_agent` | dueño (interno: "conseguime reuniones") **y** prospectos/leads (externo) |

Christian es el único puente entre audiencias:
- **Interno** (`copilot`): el dueño le pide outbound/reuniones; configura su secuencia; recibe reportes vía Luana.
- **Externo** (`sales_agent`): contacta prospectos con la **autoridad del fundador** (LinkedIn + cold email) **y atiende la recepción pasiva de leads inbound por WhatsApp** — es el **front-line externo único**. La "recepción pasiva que nunca se corta" (token economy H5) vive acá: un lead entrante NUNCA se pierde por agotamiento de bolsa.

Brenda genera demanda (inbound: pauta/contenido) pero **no es front-line conversacional externo** — cuando un lead responde/escribe, lo conversa Christian (un solo `sales_agent`, sin duplicar engine externo).

### D-C · "Seguridad & Cumplimiento" sin PHI (B2B, no clínico)

En vitalia esa caja de Infraestructura es pgcrypto/PHI/dual-filter/retención 10-20 años. **Nicolify NO tiene PHI.** Su caja `seguridad-cumplimiento` cubre:

- **Tenant isolation** (raíz) — toda query filtra `tenant_id`; queries de una cuenta filtran además `account_id`.
- **Audit log de toda acción autónoma de agente** — Brenda kill-switch (`pause_campaign`), Christian outbound, Norvil upsell → audit row + reporte vía Luana (nunca silenciosa).
- **Consentimiento outbound LinkedIn** — perfil del fundador, `tenant.outbound_consent` antes de cualquier acción.
- **Anti-spam / opt-out / rate-limits** de plataforma (`tenant.outbound_policy`).
- **Firma electrónica B2B eIDAS-like** (AR Ley 25.506 · MX FIEL · CO Ley 527 · BR ICP-Brasil) para propuestas/contratos.
- **Retención de docs comerciales** 5-10 años per jurisdicción.

NO incluye: pgcrypto, dual-filter clínico, `PhiRepositoryBase` (eso es exclusivo de vitalia).

### D-D · Sara = "Operar / Mi Día" (= Mateo de vitalia, con lógica de agencia) ⭐

Vitalia, al volver a Valeria supervisora pura, dejó **huérfana** la territoria operativa que ella poseía (agenda/bookings) y creó **Mateo** (📅 "Operar / Mi Día") para alojarla. Nicolify nació sin ese huérfano (Luana fue supervisora pura desde el día 1), pero **sí necesita un hogar operativo del día a día** — y en una agencia B2B ese rol es la **Jefa de Proyectos**.

→ Se crea **Sara** (📋 "Operar / Mi Día"), **5ª caja** de la zona Agentes (`engine: copilot`, audiencia interna). Dueña de la **operación del día a día**: delivery de los proyectos de clientes activos (tareas, milestones, deadlines, entregables). Su área `mi-dia` es el **landing operativo post-login**.

Separación de territorios (cero solapamiento):

| Trabajador | Territorio | NO es |
|---|---|---|
| **Sara** (Jefa de Proyectos) | Delivery/operación: proyectos, tareas, deadlines, entregables. "Mi Día" operativo. | la relación comercial |
| **Norvil** (Account Manager) | Salud comercial de la cuenta: retención, upsell, churn. | la ejecución del trabajo |
| **Luana** (supervisora) | Digest cross-ciclo (Atracción→Cierre→Delivery→Retención) vía `reportes-digeridos`. | un hub operativo concreto |

Christian gana el deal → `DealWon` dispara **Norvil** (crea la cuenta + salud) **y Sara** (crea el proyecto + plan de entregas). Sara detecta entrega en riesgo → `DeliveryAtRisk` alimenta la salud de cuenta de Norvil + reporte de Luana. El **stack operativo** (Notion/Jira/Slack) lo **opera Sara**; Norvil deriva señales de salud del mismo stack (misma integración, lente distinta).

Ciclo del Ribbon (orden) = **Abel → Brenda → Christian → Sara → Norvil**.

## El mapa de nicolify = 3 zonas (12 cajas + supervisora)

| Zona | tier | `user_visible` | Cajas |
|---|---|---|---|
| **Agentes** | core | `true` | 🧠 abel · 💰 brenda · 🏹 christian · 📋 sara · 🌱 norvil — **+ 🧭 Luana supervisora (fuera del grid)** |
| **Plataforma** | supporting | `true` | 🔐 acceso · 🚀 onboarding · ⚙️ configuracion |
| **Infraestructura** | enabling | `false` | 🛡️ seguridad-cumplimiento · 📊 observabilidad · 🔧 plataforma-tecnica · 🤖 motor-agentico |

Regla de oro: ninguna cap existe sin caja, ninguna caja fuera de zona. La zona se **deriva** del registro (`zones[].boxes`), no se escribe por cap. Desde la **idea**, el árbol de decisión de `.claude/rules/paradigm-arquitectura.md` dice dónde aterriza.

## Encaje con los 3 planos

- **Plano 1 · Sistema:** las capacidades B2B reales (CRM cuenta/stakeholder, pauta, propuestas, salud de cuenta, licitaciones). Operables a mano; funcionan sin agentes.
- **Plano 2 · Capa de acción:** cada caso de uso expuesto UNA vez (el service layer DDD de `nicolify/backend`). Web (REST) y agentes (tool-call) ejecutan **la misma acción** (`pause_campaign`, `create_deal`, `send_sequence`…). Los agentes NUNCA reimplementan el negocio.
- **Plano 3 · Trabajadores:** Luana (supervisora) + 5 especialistas scoped (Abel · Brenda · Christian · Sara · Norvil) sobre **un solo engine por audiencia** (`core/luana-core-copilot` interno · `core/luana-core-sales-agent` externo). Difieren en persona + scope + guardrails — ver `agent-revenue-engine.md`.

## Consecuencias

**Positivas:** nicolify nace sin deuda de migración (cajas finales día 1); doctrina alineada cross-brand; el cap↔código + índice de acciones habilita navegación agéntica sin grep; cada cap del rebuild ya nace con hogar zona→caja→área.

**Trabajo derivado (NO en este ADR):**
- Las 7 stories R0 declaran `map_zone`/`map_box` en su checkpoint (este cambio las acompaña).
- Cada cap nuevo del rebuild declara `map_box` + `user_visible` (derivado de zona).
- Render por zona del cockpit `MapView.tsx` = **tool-scope cross-brand** (aún no implementado ni para vitalia; cuando se haga, pinta ambas marcas porque ambas tienen `zones[]`). Mientras tanto el cockpit agrupa por `agents[]` (shim).

**Riesgos:** que una cap del rebuild olvide `map_box` → mitigación: `validate_system_map.py` map_box-aware (futuro) + el árbol de decisión obligatorio desde la idea.

## Alternativas consideradas

- **Duplicar PARADIGM.md/ADR-010 en la marca:** descartado — son platform-wide, ya aplican; se cita, no se copia.
- **Mantener Luana como caja en el Ribbon (espejo literal de Valeria):** descartado — nicolify ya nació con Luana en el sidebar; forzarla al Ribbon contradice `SHELL-DESIGN-CONTRACT`.
- **Engine externo separado para inbound vs outbound:** descartado — un solo `sales_agent` (Christian front-line) cumple el invariante "un solo engine por audiencia".
- **Migrar con scripts (como vitalia):** innecesario — nicolify no tiene caps shipped que migrar; nace bien.

## Referencias

- `docs/architecture/luana-platform/PARADIGM.md` · `ADR-010-orquestacion-agentica.md` — doctrina platform
- `.claude/rules/paradigm-arquitectura.md` — árbol de decisión zona/caja
- `nicolify/docs/architecture/SYSTEM-MAP.yaml` — registro `zones` (este ADR lo formaliza)
- `nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md` — patrón sub-tab (ortogonal)
- `nicolify/.claude/rules/agent-revenue-engine.md` — autonomía + token economy + CRM + outbound (los guardrails de los trabajadores)
- `nicolify/docs/product/vision.md` — ecosistema de agentes (negocio)
- `vitalia/docs/product/stories/vitalia-paradigm-map-zones/` — story espejo (vitalia migró)
