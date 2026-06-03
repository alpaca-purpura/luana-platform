---
story_id: nicolify-r0-sitemap-completo
kind: 01-sitemap            # inventario refinado de funcionalidades (NO un 01-spec Gherkin · meta-story planning)
version: 3                 # v3 — RE-ESTRUCTURADO con el feedback de Chris (2026-06-02): modelo 4 niveles + 5 reworks de agente
owner: /pm-nicolify
state: refining
last_modified: 2026-06-02
status: PROPUESTA            # PROPUESTA → ratificar con Chris → cementar en SYSTEM-MAP.yaml v2 + shell-routes.ts + releases
anchor: nicolify/docs/product/stories/nicolify-r0-sitemap-completo/02-agent-intent.md
promote_to_vision: true     # ★ Chris (2026-06-02): "veremos luego cómo lo volvemos SSoT como parte de la visión de producto"
preserve_intent: true       # ★ cada agente y hoja lleva su INTENCIÓN embebida — no solo el nombre
changes_v2_to_v3:           # qué cambió respecto a v2 (feedback Chris 2026-06-02)
  - "Modelo de navegación de 4 niveles formalizado: Agente → Área → Subárea(N3) → Hoja"
  - "Luana = CORE platform (no agente nicolify-único) — sus hojas son la capa conversacional compartida"
  - "Abel: +ICP/buyer (faltaba) · escalera de valor = catálogo empaquetado en tiers (confirmado) · 'ángulos' folded en ICP"
  - "Brenda: Presencia+Contenido fusionados · Inteligencia+Asesoría fusionados (con loop replicar-adaptar) · métricas reales a-la-mano + integraciones en Config"
  - "Christian: Base-de-contactos (CRM/import/propios + enrichment) · Pipeline absorbe lead-routing · +Equipo comercial (skill-based) · SIN pantalla de 'Secuencias' · Inbox filtrable por canal"
  - "Norvil: Cartera master-detail (salud DENTRO del detalle del cliente, patrón staff/doctores) · orden client-first"
---

# Nicolify — Sitemap refinado v3 (todas las funcionalidades + la intención que las origina)

> **Qué es:** inventario COMPLETO del árbol de funcionalidades — cada **hoja** (capability) nombrada + ubicada (zona → caja → área → subárea) + **la intención del dueño que la origina** + su **release**. NO diseña las hojas (cada una = su propia story futura).
>
> **Anclado en `02-agent-intent.md`** (lo que Chris dijo que espera de cada agente). **v3** aplica el feedback de Chris del 2026-06-02 (ver frontmatter `changes_v2_to_v3`).
> **Cementación:** al ratificar → `SYSTEM-MAP.yaml v2` + `shell-routes.ts` (nav skeleton) + releases. **Graduación:** § agentes → `vision.md § 1`.

---

## 0. Modelo de navegación — 4 niveles (★ Chris 2026-06-02)

> El esqueleto del menú tiene **exactamente 4 niveles**. Ninguna **Hoja** tiene tabs internas (si una vista necesita "3 sub-vistas", esas son 3 Hojas en N3, no tabs dentro de una hoja).

| Nivel | Qué es | Ejemplo | En el shell |
|---|---|---|---|
| **N1 · Agente** | El trabajador. Pestaña del Ribbon (+ Luana sidebar). | Abel, Brenda, Christian… | Ribbon |
| **N2 · Área** | Un territorio del agente. | Abel→"Oferta" | SubTabsBar |
| **N3 · Subárea** | **Solo si el Área tiene MÁS DE UNA Hoja.** | Oferta→"Catálogo" / "Dossier minería" | SubSubTabsBar |
| **Hoja** | La página navegable real (capability). **Sin tabs internas.** | "Catálogo & escalera de valor" | el contenido |

**Regla de colapso:** si un **Área tiene UNA sola Hoja**, el Área **ES** la Hoja (N2 abre la página directo, sin N3). Si tiene **2+ Hojas**, esas Hojas viven en **N3**. → La mayoría de las áreas serán hoja-directa; solo las cargadas (Abel→Oferta, Christian→Propuestas, Norvil→Fidelización) abren N3.

**Notación en las tablas de abajo:** columna `Área` (N2) · columna `Hoja (N3)` lista las hojas; si hay una sola, el Área es esa hoja; si hay varias, cada una es una subárea N3.

---

## 1. Principios transversales (la intención que atraviesa TODO — no perder)

- **El que paga es un CEO/Gerente NO-marketinero** con el **know-how, la dirección y la visión** — el cerebro. NO tiene tiempo ni equipo. **Quiere empleados, no herramientas.** No configura pantallas: **le habla a Luana** y delega.
- **La web es "la parte funcional que el usuario PUEDE hacer a mano"; lo agéntico es que todo eso se hace POR él.** Cada hoja existe en dos modos: operable a mano (Plano 1) e invocable por el agente (Plano 3, misma acción — Plano 2). (★ Chris pto 1)
- **Cada cliente vale muchísimo:** cerrar UNO recupera toda la inversión de marketing → todo alto-toque, relacional, con la **voz/imagen del fundador** como activo central.
- **Voz/autoridad del fundador = capability COMPARTIDA** (no se duplica): **Brenda la usa para publicar** · **Christian la clona para conversar 1:1**. Regla: *voz personal del fundador → Christian · voz de la marca → Brenda · publicar siempre Brenda.*
- **Las métricas reales (presencia/pauta/engagement) van "a la mano"** dentro de cada hoja, con drill-down — alimentadas por integraciones (Meta/LinkedIn/…) que viven en **Configuración → Conexiones** (patrón vitalia). (★ Chris pto 3)
- **Canales** (research jun-2026): **LinkedIn #1 · Meta #2 · Email sí (personalizado) · TikTok NO ahora.**
- **Separación de poderes:** los agentes **proponen, el dueño aprueba**. Decisiones pendientes se surfacean vía Luana (sin caja de aprobaciones — G2).
- **Token economy:** funciones críticas (recepción pasiva de leads) nunca se cortan; las proactivas se pausan al agotar bolsa. Tier gating server-side.
- **Luana nunca ejecuta acción de negocio ni propone sola** — siempre delega/consulta al especialista owner.

---

## 2. Roadmap — qué hoja en qué release

| Release | Tema | Áreas (alto nivel) |
|---|---|---|
| **R0** ✅ in_progress | Fundación + shell | shell-organism · dev-stack (done) · Acceso · Preferencias base · plataforma-técnica · **Luana (CORE)** {chat · memoria} |
| **R1** | Abel + Brenda · **Atracción inbound** (1er vendible) | Onboarding (+ Abel captura la visión) · **Abel** {ICP · Oferta · Marca} · **Brenda** {Contenido&Presencia · Pauta · Inteligencia&Asesoría} · **voz-fundador** · Conexiones · **Luana** reportes |
| **R2** | Christian · **Outbound + cierre** | **Christian** {Base-de-contactos · Inbox · Pipeline · Equipo-comercial · Agenda · Propuestas(+Licitaciones)} · motor-agéntico · seguridad {audit · consent · firma · compliance} |
| **R3** | Norvil · **Retención** (liviano) | **Norvil** {Cartera (salud en detalle) · Renovaciones} |
| **R4** | **Token economy** + observabilidad | Config {Tokens · Autonomía-agentes} · observabilidad |
| **R5+ / posterior** | Fidelización + operación | **Norvil → Fidelización** {momentos · champion-shield · QBR · gifting} · **Sara** (cuando se decida) · lift inbox/voz → engine |

---

## 3. ZONA AGENTES

### 🧭 Luana — Orquestadora (★ CORE platform · sidebar, NO Ribbon)

> **★ Chris (pto 1):** Luana es **más Core que nicolify-única**. Las funcionalidades que aquí listamos son **la parte funcional web**; de forma agéntica todo se hace por el usuario. Los que cambian y son **casi únicos por marca son los OTROS agentes** (Abel/Brenda/Christian/Norvil). Luana = la **capa conversacional compartida** (mismo engine + shell en vitalia/nicolify/comunify).
>
> **INTENCIÓN:** la empleada más inteligente. Entiende la **intención**, **JAMÁS pierde el hilo**, **hablando hace todo** por el dueño. **JAMÁS propone sola: va con los especialistas.**

| Área | Hoja (N3 si >1) | Qué hace (+ intención) | Surface | Release |
|---|---|---|---|---|
| chat | Chat persistente 3-estados | El único rostro; el dueño le habla y ella rutea/delega al owner | **CORE** | R0 |
| memoria | Memoria / continuidad ★ | Contexto persistente cross-sesión — *"jamás pierde el hilo"* | **CORE** | R0/R1 |
| orquestación | Delegación + ruteo ★ | Nunca responde con sustancia sin consultar al especialista | **CORE** | R1 |
| reportes | Digest + decisiones a aprobar | Resumen NL del ciclo + surface de lo que el dueño debe aprobar | **CORE** | R1 |

> **Engine:** `core/luana-core-copilot` (deep_agent + provider registry). Grafo supervisor en Infra→motor-agéntico. **Implicación:** las 4 hojas de Luana se gradúan a una **capability CORE/platform** (no a `vision.md § 1` de nicolify) — lo nicolify-específico empieza en Abel. *(confirmá pto 1)*

### 🧠 Abel — Estratega & Oferta

> **INTENCIÓN:** estratega de un **CEO que NO sabe de marketing** pero **SÍ da la dirección y la visión**. Abel **absorbe y SOSTIENE** esa visión → oferta estructurada + marca. Traductor "visión de CEO → estrategia comercial". *(Siempre que sea conversacional, se hace vía el chat de Luana — los expertos somos nosotros.)*

| Área | Hoja (N3 si >1) | Qué hace (+ intención) | Release |
|---|---|---|---|
| **ICP & buyer** ★NEW | Definición de ICP / buyer | *"a quiénes apuntamos"* — perfil de cliente ideal + buyer persona. **Cada ICP lleva su dolor + su ángulo de venta** (acá vive lo que antes era "ángulos", ahora como propiedad del ICP, no hoja suelta) | R1 |
| **Oferta** | → Catálogo & escalera de valor | Servicios B2B de la agencia + **packaging**: el catálogo **organizado/empaquetado en tiers** (lead-magnet → core → upsell; ej. jr/mid/senior como SKUs mensuales). *Ayudamos al dueño a armarla* — el packaging es un dolor B2B (cotizar "a la medida" agota; muchas cosas SON paquetes que no ven). *(confirmá pto 2: escalera = catálogo en tiers)* | R1 |
| **Oferta** | → Dossier de homologación (minería) | Maquinaria/personal calificado — vertical insignia Perú | R2 |
| **Marca** | Posicionamiento + StoryBrand + identidad | Brand Studio de la agencia tenant | R1 |

> **Engine:** `core/luana-core-offer-studio` (21 secciones · 84 presets · value ladder) + `core/luana-core-brand-studio`. **El legacy ya construyó casi todo esto.** · *Área "Oferta" tiene 2 hojas → abre N3. ICP y Marca = área-hoja directa.*

### 💰 Brenda — Agencia de marketing B2B in-house (≫ pauta)

> **INTENCIÓN:** que haga **el trabajo de una agencia de marketing especializada en agencias B2B**. El gerente ocupado quiere "hablar con alguien de marketing" que **capte todo, recomiende lo que REALMENTE funciona, retroalimente y SIEMPRE dé alternativas**. Mantenerse **vigente** (LinkedIn), saber **cuánto invertir para reuniones de valor**, que **proponga temas y postee por él**, atacar **dos frentes** (empresa + imagen personal del fundador), y saber **qué pega y qué no CON SUSTENTO** (Apify).

| Área | Hoja (N3 si >1) | Qué hace (+ intención) | Release |
|---|---|---|---|
| **Contenido & Presencia** ★MERGE | Contenido & Presencia | *(★ Chris pto 3: presencia y contenido son lo mismo — uno nutre al otro → una sola área.)* Propone temas → redacta → **postea por el fundador (post-by-proxy)** → gestiona la 1ª hora de engagement → community de la **marca** (responde comentarios de marca). **Dos frentes:** company page + perfil personal. **Métricas reales a-la-mano** (alcance/engagement) con drill | R1 |
| **Pauta** | Pauta (Meta + LinkedIn ads) | *"cuánto invertir para reuniones de valor"* — atribución a **pipeline** (no clicks) + **kill-switch CAC/ROAS autónomo**. **Métricas reales a-la-mano** + drill (integración en Config) | R1 |
| **Inteligencia & Asesoría** ★MERGE | Inteligencia & Asesoría | *(★ Chris pto 3: inteligencia y asesoría en el mismo lugar.)* Surface de **todo lo novedoso** (social listening Apify, qué funciona en redes profesionales **con sustento**) + **recomendaciones + alternativas**. ★ **Loop replicar-adaptar:** el dueño ve un post/tendencia → botón **"replicar"** → adaptación ya hecha → postear **a su nombre o de la empresa**. *(detalle fino en la fase research de esa story — acá se siembra la dirección)* | R1 |

> **Engine:** `analytics-engine` (ETL 12 providers + Bowtie) + `campaigns` + `channels` + `commercial-calendar` + `assets`. **Métricas:** las integraciones Meta/LinkedIn viven en **Config → Conexiones** (patrón vitalia); cada hoja muestra sus métricas "a la mano" con drill. *(confirmá pto 3: los 2 merges)* · *Las 3 áreas = área-hoja directa.*

### 🏹 Christian — Alfil de batalla (outbound + voz del fundador) · re-propuesto

> **INTENCIÓN:** su **alfil de batalla** — atiende **todos los frentes** poniendo **su imagen (el gerente) o la de la marca**. **Filtra las reuniones** (quién atiende: un ejecutivo o el dueño), **no pierde NINGÚN lead**, **prospecta**, y **habla por él en LinkedIn clonando su voz**.
>
> **★ Chris (pto 4) — espíritu agéntico:** todo esto va en web, pero **la parte fea la ven los agentes**; el usuario es **decisor** sobre lo que Christian hace con la base. **Christian = parte operativa de ventas (aún-no-clientes); Norvil = clientes actuales.** **NO** tenemos "Secuencias" que el usuario maneje — somos la solución confiable; las respuestas caen al **Inbox**.

| Área | Hoja (N3 si >1) | Qué hace (+ intención) | Release |
|---|---|---|---|
| **Base de contactos** ★RE | Base de contactos | *(★ pto 4: el "CRM del funnel aún-no-cliente".)* **Integra CRMs/sistemas externos** + importa **bases de contactos** + el dueño carga **contactos propios que conoce**. Modelo Cuenta+Stakeholder. **No duplica un CRM** — es el funnel previo al cliente. Por contacto: botón **"investigar en internet"** (= enrichment: redes, gustos/preferencias, info comercial — legal). El dueño decide; el agente hace la parte fea | R2 |
| **Inbox** ★RE | Inbox omnicanal | **Todos los DMs/mensajes** en un lugar, **filtrable por canal** (empresa / personal / etc.) y por quién escribió. Recepción pasiva inbound (**nunca se corta**). Responde DMs + **comentarios en posts PERSONALES del fundador** (voz clonada). 3-modos (Decide/Consulta/Manual) + OCC + undo. **Réplica de vitalia** (`00-research.md`). **No hay pantalla de secuencias** — el outbound lo ejecuta Christian; sus respuestas entran acá | R2 |
| **Pipeline** ★RE | Pipeline (con lead-routing) | *(★ pto 4: lead-routing y pipeline = el mismo sentido → routing va EN el pipeline.)* Deals por etapa ligados a la **Cuenta**. **Califica el lead + decide quién atiende** (un ejecutivo o el dueño si es buena oportunidad) embebido en el flujo del pipeline | R2 |
| **Equipo comercial** ★NEW | Equipo comercial | *(★ pto 4: lo propusiste.)* El dueño se carga a **sí mismo + ejecutivos** (perfiles) + define un **default**; el sistema **deriva por perfil** (skill-based routing: qué cliente le calza mejor a cada ejecutivo → **+30% win-rate** vs azar). El dueño carga los perfiles para que el match sea bueno | R2 |
| **Agenda** | Agenda comercial | Reuniones comerciales (Christian dueño de todo lo comercial — G3) | R2 |
| **Propuestas** | → Propuestas | Generación + seguimiento (viewed/accepted) + firma electrónica · accepted → Deal=won | R2 |
| **Propuestas** | → Licitaciones (minería) | Tracking RFI/RFQ/licitaciones — vertical insignia Perú | R2 |

> **Engine:** `core/luana-core-sales-agent` (LangGraph + specialists + follow-up + **BrandVoicePort** = voz clonada) + `crm` + `channels` + `compliance` (WABA/opt-in legacy). **Outbound (DMs como el fundador + cold email)** = capability del agente que opera SOBRE la Base de contactos; las respuestas caen al Inbox — **sin pantalla de secuencias que el usuario gestione.** · *De 9 hojas planas (v2) → **6 áreas** (Propuestas abre N3). Resuelve el OI-2 de saturación.* *(confirmá pto 4)*

### 📋 Sara — PRÓXIMAMENTE (diferida · OI-C)

> **INTENCIÓN (norte futuro):** hub de datos de **ERPs como dashboard para que los OTROS agentes estén enterados** (capa de contexto compartida). **Decisión:** *"no nos compliquemos — de momento Próximamente."*

| Área | Hoja | Estado | Release |
|---|---|---|---|
| — | Tab en el Ribbon con empty-state **"Próximamente"** | Placeholder · sin funcionalidad | — (fuera de R0-R4) |

### 🌱 Norvil — CRM de los clientes ACTUALES + fidelización · re-ordenado client-first

> **INTENCIÓN:** **tomar acciones con los clientes ACTUALES** — un CRM de quienes YA son clientes (Christian los trajo). **Cumpleaños, mensajes, correos, regalos** — todo lo que permite a una agencia B2B **fidelizar**. Arranca **liviano**; el **motor de fidelización** es "algo útil y novedoso para agencias chicas/medianas sin gran área de marketing".
>
> **★ Chris (pto 5):** Cartera y salud van **juntas** — la salud **pertenece al cliente** (igual que staff/doctores: dentro del doctor están sus detalles). Por cuenta tenemos **clientes (personas)**. Las funcionalidades te gustan; lo que importa es **el orden y cómo entramos a cada una**.

| Área | Hoja (N3 si >1) | Qué hace (+ intención) | Release |
|---|---|---|---|
| **Cartera** ★RE | Cartera de clientes (master-detail) | **Lista de clientes → detalle del cliente.** El **detalle** del cliente contiene TODO lo suyo en una sola página (sin tabs): **salud de cuenta** (account health + señales de churn) + **mapa multi-stakeholder** (champion/decisor/usuarios) + historia + touchpoints. *(★ pto 5: la salud vive DENTRO del cliente, patrón staff/doctores — no es un área aparte.)* **Entry model: client-first** — todo se entra a través de un cliente | R3 |
| **Renovaciones** | Renovaciones + upsell | Nurturing pre-renovación + cross/up-sell (dueño aprueba contacto) — se dispara desde el cliente | R3 |
| **Fidelización** ★ (motor, R5+) | → Momentos que importan | Señales del cliente vía Apify (cumpleaños · aniversario contrato · **ronda/prensa/hito** · inactividad) → touch contextual | R5+ |
| **Fidelización** ★ | → Champion-shield (la joya) | El champion del cliente cambia de empresa → **alerta churn** + **intro caliente en su nueva empresa** (+114% win con champion previo) | R5+ |
| **Fidelización** ★ | → Value-proof / QBR | Reporte trimestral "esto logramos para vos" → justifica retainer + dispara renovación | R5+ |
| **Fidelización** ★ | → Gifting orquestado | Cumpleaños/aniversarios/hitos → mensaje/correo/**regalo** timed, dueño aprueba | R5+ |

> **Engine:** `crm` (NPS · referral · inactivity · lifecycle) + `commercial-calendar` + (compartido) social-listening de Brenda. **Net-new:** account-health compuesto B2B + champion-tracking + QBR-gen + gifting. · *Cartera y Renovaciones = área-hoja directa; Fidelización abre N3 (4 hojas).* *(confirmá pto 5: el orden client-first + salud-en-detalle)*

---

## 4. Capability COMPARTIDA — Voz / autoridad del fundador ★

> El activo central = la **imagen/voz del fundador**. NO se duplica por agente — UNA capability, dos consumidores.

| Consumidor | Uso | Release |
|---|---|---|
| **Brenda** | **Publicar** como el fundador (post-by-proxy) + presencia | R1 |
| **Christian** | **Conversar 1:1** como el fundador (DMs/cold-email/comentarios personales — voz clonada) | R2 |

> **Engine base:** `core/luana-core-sales-agent::BrandVoicePort`. **Guardrails:** consent explícito del fundador + control de tono + aprobación humana antes del 1er envío.

---

## 5. ZONA PLATAFORMA (supporting · fuera del Ribbon)

| Caja | Área | Hoja | Intención | Release |
|---|---|---|---|---|
| **Acceso** | auth | Auth Clerk + sesiones | (shipped R0 dev-stack) | R0 ✅ |
| **Acceso** | iam | RBAC + roles del staff | Quién del equipo ve qué | R0/R1 |
| **Onboarding** | onboarding-agencia | Alta + activación | Datos + brand mínimo + conexión canales + provisioning · **Luana conduce** + **Abel captura la visión del CEO acá** | R1 |
| **Config** (⚙) | conexiones | Conexiones / integraciones | **LinkedIn/Meta/Google/WhatsApp/email/Notion/Jira/Slack** (13 del legacy) — **acá viven las integraciones que alimentan las métricas reales de Brenda + el inbox de Christian** (patrón vitalia) | R1 |
| **Config** (⚙) | preferencias | Preferencias del tenant | Datos agencia/usuarios/moneda/locale | R0/R1 |
| **Config** (⚙) | tokens | Tokens / Plan | Bolsa + tier + alertas 80/95/100% (críticas no se cortan) | R4 |
| **Config** (⚙) | autonomía-agentes | Autonomía de agentes | Umbrales CAC/ROAS (Brenda) · consent LinkedIn (Christian) · aprobaciones (Norvil) · tier gating | R4 |

---

## 6. ZONA INFRAESTRUCTURA (enabling · user_visible:false · nada huérfano)

| Caja | Hoja | Qué cubre | Release |
|---|---|---|---|
| seguridad-cumplimiento | Tenant isolation (raíz) | Filtro tenant_id en toda query | R0+ |
| seguridad-cumplimiento | Audit de acciones autónomas | Brenda kill-switch · Christian outbound · Norvil contacto | R2+ |
| seguridad-cumplimiento | Consent outbound + compliance | Consent LinkedIn del fundador + WABA24h/opt-in/blacklist/country-block (legacy `luana-core-compliance`) + anti-spam | R2 |
| seguridad-cumplimiento | Firma electrónica B2B | eIDAS-like (AR/MX/CO/BR) + retención docs | R2 |
| observabilidad | Metering de costo LLM | trace events + llm_calls + cost + FX + pricing (base token economy) | R4 |
| plataforma-tecnica | Foundation técnica | design tokens/shell · dev stack · events/outbox · idempotency · IAM engine · tier gating | R0+ |
| motor-agentico | Runtime de los trabajadores | engine copilot/sales_agent + RAG/Qdrant + prompt cache + **grafo supervisor de Luana** | R2 (wiring) |

> **NICOLIFY NO TIENE PHI.** Seguridad = audit de autonomía + consent + firma + compliance B2B.

---

## 7. Deltas vs SYSTEM-MAP v1.1 (qué cambia al cementar v2)

1. **Nav de 4 niveles** formalizado (Agente→Área→Subárea→Hoja) + regla de colapso área≡hoja.
2. **Luana = CORE platform** (no agente nicolify-único) — hojas chat/memoria/orquestación/reportes se gradúan a capability core compartida.
3. **Abel:** +**ICP & buyer** (faltaba) · **Oferta** = catálogo + **escalera-de-valor/packaging** (tiers) · **Marca** · "ángulos" → propiedad del ICP (no hoja).
4. **Brenda:** **Contenido&Presencia** fusionados · **Inteligencia&Asesoría** fusionados (+ loop replicar-adaptar) · **Pauta** · métricas reales a-la-mano + integraciones en Config.
5. **Christian:** **Base-de-contactos** (CRM/import/propios + enrichment) · **Inbox** filtrable por canal (sin secuencias) · **Pipeline** absorbe lead-routing · +**Equipo-comercial** (skill-based) · **Agenda** · **Propuestas**(+Licitaciones N3). 9 hojas planas → 6 áreas.
6. **Norvil:** **Cartera** master-detail client-first (salud DENTRO del detalle) · **Renovaciones** · **Fidelización** N3 (R5+).
7. **Sara → PRÓXIMAMENTE.** **Capability `voz-fundador`** compartida.
8. **Landing** (D2): `christian/pipeline`. **G2 aprobaciones:** surface vía Luana.
9. Releases alineados a § 2.

## 8. Confirmaciones pendientes (Chris — pre-cementar v2)

| # | Tema | Mi propuesta |
|---|---|---|
| C1 | **Luana = CORE** | Sus 4 hojas se gradúan a capability **platform/core** (no a `vision.md §1` de nicolify). ¿Va? |
| C2 | **Abel: escalera = catálogo en tiers** | Confirmado por research: la escalera de valor **ES** el catálogo de servicios empaquetado en tiers. Una sola hoja "Catálogo & escalera de valor". + ICP como área nueva. ¿Va? |
| C3 | **Brenda: los 2 merges** | Contenido+Presencia = 1 área · Inteligencia+Asesoría = 1 área (con loop replicar-adaptar). ¿Va? |
| C4 | **Christian: la re-propuesta completa** | 6 áreas (Base-contactos · Inbox · Pipeline+routing · Equipo-comercial · Agenda · Propuestas+Licitaciones), sin pantalla de secuencias. ¿Va o ajustás? |
| C5 | **Norvil: client-first** | Cartera master-detail, salud dentro del detalle del cliente, todo se entra por el cliente. ¿Es el orden que querés? |
