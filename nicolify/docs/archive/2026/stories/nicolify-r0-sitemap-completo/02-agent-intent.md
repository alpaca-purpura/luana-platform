---
story_id: nicolify-r0-sitemap-completo
kind: 02-agent-intent       # intención de negocio POR AGENTE (Chris verbatim) + research de canales · ANCLA del sitemap v2
owner: /pm-nicolify
state: refining
last_modified: 2026-06-02
source: "Chris (2026-06-02) — respuestas per-agente + encargo de research Brenda"
promote_to_vision: true     # graduar a nicolify/docs/product/vision.md § 1 al cerrar el refining (user-story no es SSoT)
---

# Nicolify — Intención del dueño por agente + estrategia de canales

> **Por qué existe:** Chris fijó qué espera el dueño (CEO/Gerente de la agencia que paga) de CADA agente. Esto **manda sobre el SYSTEM-MAP v1.1** — el sitemap v2 se ancla acá, no en lo que ya estaba. **El trabajo concreto se irá descubriendo**; esto es el norte de cada módulo.
> **Graduar:** al cerrar el refining, promover § agentes a `vision.md § 1` (es conocimiento durable, no de la story).

## El perfil del que paga (clave transversal)

El dueño es un **CEO / Gerente General**, NO un marketinero. Tiene el **know-how, la dirección y la visión** del negocio — es el cerebro. Lo que NO tiene es tiempo ni equipo. **Necesita empleados, no herramientas.** Cada cliente vale mucho (en este rubro, **cerrar UNO recupera toda la inversión de marketing**) → todo es alto-toque, relacional, con la **imagen/voz del fundador** como activo central.

---

## Lo que el dueño espera de cada agente (Chris, 2026-06-02)

### 🧭 Luana — la empleada más inteligente
**Espera:** que le **entienda la intención** y **jamás pierda la hilación de la conversación**. Que **hablando, haga todo por él**. Capta rápido, entiende — pero **JAMÁS propone sola: siempre va con los especialistas**.
**Implica (módulo):** orquestación + **memoria/continuidad conversacional persistente** (nunca pierde el hilo) + delegación obligatoria (Luana consulta al especialista antes de responder con sustancia; cero free-lancing). Engine: `core/luana-core-copilot` (deep_agent + provider registry — cada agente expone su `copilot_provider`).

### 🧠 Abel — el estratega del CEO no-marketinero
**Espera:** alguien que le ayude a **armar su oferta** y **estructurar su marca**. Quiere que Abel sea **su estratega**. El dueño **no sabe para qué sirve el marketing** (no es del rubro) PERO **da la dirección y la visión** — y quiere que **Abel la tenga/sostenga**.
**Implica (módulo):** Abel ABSORBE la visión/dirección del CEO y la convierte en oferta estructurada + marca. Es traductor de "visión de CEO → estrategia comercial". Engine: `core/luana-core-offer-studio` (21 secciones · 84 presets · value ladder) + `core/luana-core-brand-studio` (StoryBrand · positioning · personality · StyleAnalyzer). **El legacy ya construyó casi todo esto.**

### 💰 Brenda — la agencia de marketing B2B in-house (mucho más que pauta)
**Espera:**
- **Mantenerse vigente en redes** (sobre todo **LinkedIn**) + saber **cuánto invertir para conseguir reuniones de valor**.
- Que le **proponga temas, le dé todo, y si es posible postee POR ÉL a su nombre**.
- Atacar **dos frentes**: la **empresa** Y su **imagen personal de cabeza/fundador** para traccionar leads.
- Que haga **el trabajo de una agencia de marketing especializada en agencias B2B**: qué está funcionando en redes profesionales, **qué pega y qué no, CON SUSTENTO** (ej. extrayendo de **Apify** / social listening).
- El gerente está **muy ocupado**: quiere "hablar con alguien de marketing" que **capte todo, recomiende lo que REALMENTE funciona, le retroalimente y SIEMPRE le dé alternativas**.
**Implica (módulo):** Brenda = **content + organic LinkedIn (incl. post-by-proxy del fundador) + pauta (Meta+LinkedIn) con autonomía CAC/ROAS + social listening con evidencia (Apify) + recomendaciones data-backed**. Dos marcas: company + founder. Engine: `analytics-engine` (ETL+Bowtie) + `campaigns` + `channels` + `commercial-calendar` + `assets`. (Ver § Estrategia de canales abajo — research encargado por Chris.)

### 🏹 Christian — el alfil de batalla (outbound + voz del fundador)
**Espera:**
- **Filtrar bien las reuniones**: saber **quién atiende al lead** — un ejecutivo, o el dueño mismo si es buena oportunidad. (lead routing/qualification)
- **Seguimiento a TODOS los leads — que no se pierda nada.**
- **Prospectar** e incluso **hablar por él (el dueño) en LinkedIn**.
- Ser su **alfil de batalla**: atender **todos los frentes** donde el dueño quiere estar presente, poniendo **su imagen (la del gerente) o la de la marca**.
- Que **"clone" su voz** — en este rubro cada cliente es importantísimo; **cerrar uno recupera toda la inversión de marketing**.
**Implica (módulo):** lead routing (exec vs dueño) + follow-up implacable (zero-leak) + prospección + **outbound 1:1 hablando COMO el fundador (voice clone)** + inbox (atiende lo que entra) + agendamiento + asistencia al cierre (humano cierra). Engine: `core/luana-core-sales-agent` (LangGraph + specialists + follow-up + BrandVoicePort) + `crm` + `channels`. **El inbox/closer-studio del legacy es su base.**

### 📋 Sara — PRÓXIMAMENTE (diferida · OI-C resuelto 2026-06-02)
**Espera (norte futuro):** info de sus **ERPs como dashboard para que los OTROS agentes estén enterados** (capa de contexto compartida ERPs+Notion/Jira/Slack que alimenta a Abel/Brenda/Christian/Norvil). NO pantalla del dueño, NO gestor de proyectos.
**Decisión Chris (OI-C):** "no nos compliquemos — Sara de momento es **Próximamente**". → En el shell queda como tab con empty-state **"Próximamente"**, SIN funcionalidad este stage. La capa de contexto/ERP-sync es net-new (no hay engine) → se diseña/construye más adelante. Sara NO entra en el roadmap activo R0-R4.

### 🌱 Norvil — el CRM de los clientes ACTUALES (fidelización) · liviano + motor bien pensado (OI-D resuelto)
**Espera:** poder **tomar acciones con sus clientes actuales** — como un **CRM pero de quienes YA son clientes**. Christian los trajo; **Norvil le recuerda cumpleaños, propone mensajes, correos, regalos** — todo lo que permite a una agencia B2B **fidelizar a los clientes actuales**.
**Decisión Chris (OI-D):** arranca **liviano** (cartera + salud + renovación), PERO con un **motor de fidelización bien pensado, útil y NOVEDOSO** para agencias B2B chicas/medianas **sin gran área de marketing** — diseñado ahora, construido más adelante.

#### ★ Motor de fidelización Norvil (concepto propuesto · research junio 2026)

**El problema real (SMB B2B):** las agencias chicas pierden clientes **reactivamente** — se enteran del churn cuando el cliente ya se fue, se olvidan de hacer seguimiento, y **nunca prueban el valor** que entregaron. Tienen POCOS clientes de alto valor (perder uno duele muchísimo) y **cero equipo de account management**. La retención es su palanca #1 de revenue (73% de líderes priorizan crecer en clientes actuales).

**La idea novedosa — "Customer Success que nunca olvida + Relationship Intelligence en autopiloto":** hacer que una agencia de 3 personas se sienta como si tuviera un equipo dedicado de account management que **nunca olvida un cliente y SIEMPRE aparece en el momento justo con lo correcto.** 5 pilares:

1. **Cartera de clientes actuales** (post-cierre · los que trajo Christian) + **mapa multi-stakeholder** (la relación NO es con una persona: champion + decisor + usuarios).
2. **★ Momentos que importan** (lo diferencial): monitorea señales del cliente vía la MISMA infra de social listening que Brenda (Apify/news) — cumpleaños, aniversario del contrato, **ronda de inversión / prensa / hito del cliente**, inactividad — y le dice al dueño "es momento de X". Touch **contextual y oportuno**, no genérico de calendario.
3. **★ Champion-shield + expansión** (la joya · validado por research): cuando el **contacto/champion del cliente cambia de empresa** → (a) **alerta de churn** en esa cuenta (perdiste a tu aliado) + (b) **intro caliente en su NUEVA empresa** (deals con champion previo = **114% más win-rate, 54% más grandes**). Una sola señal = protege una cuenta + abre otra. Las big-CS tools hacen esto para enterprise; las agencias SMB **no tienen acceso** → ahí está lo novedoso.
4. **★ Value-proof / QBR automático**: genera el reporte "**esto logramos para vos este trimestre**" que justifica el retainer y dispara la renovación (los clientes se van cuando **no VEN el valor**).
5. **Touches/regalos orquestados**: cumpleaños/aniversarios/hitos → mensaje/correo/**regalo** timed al momento, con el dueño aprobando (separación de poderes: Norvil propone, dueño aprueba el contacto).

**Por qué es barato + alto valor:** reusa infra existente — social listening (Brenda/Apify), CRM (Christian/legacy: NPS+referral+inactivity+lifecycle), `commercial-calendar` (fechas). El **gap net-new** real es: account-health compuesto B2B + champion-tracking + QBR-generator + gifting-orchestration.
**Engine:** `crm` (NPS · referral · inactivity · lifecycle) + `commercial-calendar` + (compartido) social-listening de Brenda.
**Roadmap:** R3 arranca liviano (cartera+salud+renovación); el motor de fidelización completo (momentos+champion-shield+QBR+gifting) = release posterior.

---

## Estrategia de canales (research encargado por Chris · junio 2026)

Pregunta de Chris: marketing agéntico B2B para **Meta + LinkedIn**; ¿**TikTok** sirve?; ¿**email** sigue sirviendo? Principio: "ir donde están nuestros clientes y otros no miran; al final compran personas".

### Hallazgos

| Canal | Veredicto B2B 2026 | Dato | Para quién |
|---|---|---|---|
| **LinkedIn** | **PRIMARIO** — la casa del B2B | 80%+ de los leads sociales B2B · 4/5 miembros toman decisiones de negocio · mayor engagement orgánico (1.85%) · ~70% del budget B2B. Agentes 2026 ya manejan el **ciclo completo de contenido** (sugieren temas, redactan, gestionan la 1ª hora de engagement) + workflows founder-led | Brenda (orgánico + post-by-proxy + ads) **y** Christian (outbound 1:1) |
| **Meta** | **SECUNDARIO viable** (demand-gen) | Herramientas B2B (Metadata.io = único para Meta+LinkedIn con audiencias desde CRM, atribución a **pipeline/closed-won** no clicks · Cometly = ata spend a revenue, **auto-pausa perdedoras, -18-35% CAC**) | Brenda (pauta + kill-switch CAC/ROAS) |
| **Email** | **SIGUE SIRVIENDO** (con disciplina) | 61% de decisores B2B prefieren email como canal primario · ~40x más efectivo que social para adquisición · $42 ROI/$1. PERO genérico cayó (3.43% reply 2026); personalizado + signal-based llega a **15-18%** | Christian (cold outbound 1:1) + Brenda (nurture) |
| **TikTok** | **NO de lanzamiento** (con matiz) | LinkedIn domina (70% budget); TikTok = decisores más jóvenes + **descubrimiento** (15% de product discovery arranca ahí). Complementario, no primario | Diferir · revisitar como **repurpose de video founder-led** orgánico (a LinkedIn video / Shorts) |

### Recomendación (mi PROPONE)

- **LinkedIn = canal #1** de Nicolify. Es donde están los compradores de nuestros clientes (CEOs, procurement, decisores B2B). Brenda owna el **orgánico + presencia + post-by-proxy del fundador + ads LinkedIn**; Christian owna el **outbound 1:1 (DMs como el fundador, voice clone)**.
- **Meta = #2** para demand-gen con atribución a pipeline (no a clicks) + kill-switch (Brenda).
- **Email = sí**, pero solo personalizado + signal-based (Christian outbound + Brenda nurture). NO blast genérico.
- **TikTok = NO ahora** (coincido con tu duda). Matiz: hay un ángulo de **video founder-led orgánico** (thought-leadership repurposeado) que vale revisitar más adelante — no como canal de pauta, sino como amplificación de autoridad. Vos tenés razón: los buyers de alto-ticket B2B/minería no compran en TikTok; LinkedIn + relación + email es el terreno.

### ★ Insight estructural — el límite Brenda ↔ Christian (los dos tocan LinkedIn + la voz del fundador)

| | **Brenda** (marketing/broadcast) | **Christian** (outbound/1:1) |
|---|---|---|
| LinkedIn | Orgánico: propone temas, **postea por el fundador**, gestiona engagement + **pauta** | **DMs/mensajes 1:1 como el fundador** a cuentas objetivo |
| Objetivo | Vigencia + traccionar leads inbound (contenido/ads) | Conseguir **reuniones concretas** con cuentas concretas |
| Voz del fundador | La usa para **publicar** (presencia) | La **clona para conversar** 1:1 (prospección/cierre) |

→ **La "voz/autoridad del fundador" es una capability transversal** que consumen AMBOS (Brenda para publicar, Christian para conversar). Candidato a capability compartida (founder-voice/authority) — no duplicar en cada agente.

#### Regla de engagement (OI-B · propuesta Claude ratificada por Chris "considero, tú propón")

Quién **responde** una interacción se decide por **de quién es la voz/cuenta**:

| Interacción | Owner | Por qué |
|---|---|---|
| **DMs / inbox** (1:1, cualquier canal) | **Christian** | Siempre — es conversación 1:1, puede volverse lead/reunión |
| **Comentarios en publicaciones del fundador (nombre PERSONAL)** | **Christian** | Responde **como el fundador** (voz clonada) — es relacional, alto-toque, puede ser un lead |
| **Comentarios en publicaciones de la MARCA/empresa** | **Brenda** | Community management de la marca (no es la voz personal del fundador) |
| **Publicar** (posts, ambos frentes: empresa + fundador) | **Brenda** | Brenda crea/postea (incl. post-by-proxy en el perfil personal); responder ≠ publicar |

**Regla mnemónica:** *voz personal del fundador → Christian · voz de la marca → Brenda.* Publicar siempre Brenda; conversar/responder según la voz.

## Open items — RESUELTOS (Chris 2026-06-02)

- **OI-A** ✅ Canales confirmados: **LinkedIn #1 · Meta #2 · Email sí · TikTok no-ahora.**
- **OI-B** ✅ Límite Brenda↔Christian confirmado + **regla de engagement** (voz personal fundador→Christian incl. comentarios en posts personales; voz de marca→Brenda) + **voz del fundador = capability compartida.**
- **OI-C** ✅ **Sara = "Próximamente"** (diferida · fuera del roadmap R0-R4 · tab con empty-state).
- **OI-D** ✅ Norvil **liviano** (cartera+salud+renovación) + **motor de fidelización bien pensado** diseñado (momentos-que-importan + champion-shield + QBR + gifting) para release posterior.

> **Intención de negocio COMPLETA.** Próximo paso: rearmar `01-sitemap.md` v2 anclado en este doc (no en SYSTEM-MAP v1.1).

---

## Refinamiento del árbol — feedback de Chris sobre el sitemap (2026-06-02 · ronda 2 → v3)

> Chris leyó el sitemap v2 y dio 5 bloques de feedback estructural + el **modelo de navegación de 4 niveles**. Verbatim + el research que lo aterriza. Esto manda sobre v2 → produce `01-sitemap.md v3`.

### Modelo de navegación — 4 niveles (★ cardinal)
**Agente → Área → Subárea (N3) → Hoja.** "Si alguna de las áreas tendría más de una hoja debería estar en 3er nivel. Ninguna hoja tiene tabs." → **Regla de colapso:** Área con 1 sola hoja = el Área ES la hoja (sin N3); Área con 2+ hojas → esas hojas viven en N3. Ninguna Hoja tiene tabs internas (3 sub-vistas = 3 hojas N3).

### Pto 1 — Luana es CORE, no nicolify-única
*"Lo de Luana tiene que estar en sintonía con el espíritu agéntico… las funcionalidades que veremos son la parte funcional web que el usuario puede hacer y luego de forma agéntica todo se hará por él. Esto es algo más Core que solo Vitalia a nivel visual y funcional; son los OTROS 'agentes' los que cambian y son casi únicos."*
→ **Implica:** Luana (chat·memoria·orquestación·reportes) = **capa conversacional compartida** (mismo engine+shell cross-brand). Se gradúa a capability **core/platform**, NO a `vision.md §1` de nicolify. Lo nicolify-específico empieza en Abel. **Principio nuevo (§1 del sitemap):** cada hoja existe en 2 modos — operable a mano (web, Plano 1) e invocable por el agente (Plano 3, misma acción Plano 2).

### Pto 2 — Abel: packaging + escalera = catálogo · +ICP · −ángulos
*"El catálogo de servicios está bueno; el concepto de **packaging** investígalo — es un dolor de muchas B2B porque cotizar 'a la medida' se les hace un mundo, y a veces son 'paquetes' que no ven (ej. una agencia de software vende perfiles jr/middle/senior a distinto precio mensual). Somos los expertos que ayudan al cliente, siempre vía el chat de Valeria si es conversacional. La **escalera de valor es el catálogo organizado** (¿confirmame?) — hay que acoplarla a este tipo de negocios y ayudar a armarla. **No entendí los 'Ángulos de Venta por ICP'.** No vi nada sobre **ICP o buyer** pero debería poder definirse aquí — es útil para saber a quiénes apuntamos."*
→ **Research (confirma):** "productized services" = estandarizar trabajo a-la-medida en paquetes repetibles; **value ladder = catálogo en tiers ascendentes** (good/better/best; jr/mid/senior = SKUs). Fuentes: [Naviu](https://www.naviu.tech/blog/service-productization-framework), [DealHub](https://dealhub.io/glossary/productized-services/), [Assembly](https://assembly.com/blog/productized-services).
→ **Implica:** Abel = **ICP&buyer** (área nueva — a quiénes apuntamos; cada ICP lleva su dolor + **ángulo de venta** → "ángulos" deja de ser hoja, pasa a propiedad del ICP) · **Oferta** (catálogo & escalera-de-valor/packaging + dossier minería) · **Marca**.

### Pto 3 — Brenda: 2 merges + métricas a-la-mano en Config
*"Presencia y contenido se me hace que son lo mismo, uno nutre al otro — pensémoslo bien. Inteligencia y asesoría deberían estar en el mismo lugar; no tanto 'hablar con Brenda' (todo va por Valeria) sino **poner ahí todo lo novedoso** para verlo/entenderlo, seleccionar un post y tener opción de **replicar y darle una adaptación ya hecha** para postear a su nombre o de la empresa (detalle en la fase research). Todo lo que es **presencia, pauta y engagement debe tener las métricas reales 'a la mano'** con ver más detalle → integración con Meta/LinkedIn, **todo eso en Configuración como ya lo resolvió vitalia.**"*
→ **Implica:** **Contenido & Presencia** = 1 área (incluye community de marca) · **Inteligencia & Asesoría** = 1 área (social-listening Apify + **loop replicar-adaptar**) · **Pauta**. Métricas reales con drill DENTRO de cada hoja; integraciones Meta/LinkedIn en **Config → Conexiones** (patrón vitalia).

### Pto 4 — Christian: base de contactos + equipo comercial + sin secuencias
*"En prospectos debemos aceptar **integraciones con CRMs/otros sistemas** y tener **'bases de datos' de contactos** para outbound (en B2B LatAm se maneja mucho); uno también pone **contactos propios que conoce**. No duplicar CRM, pero sí algo del estilo, en la fase del funnel de **aún-no-cliente**. Si tuviéramos CRM, **Norvil = ya-clientes, Christian = parte operativa de ventas**. Somos agénticos: todo web pero **la parte fea la ven los agentes y el usuario es decisor** según lo que Christian hace con la BD. Ej: **botón por contacto para investigarlo en internet** (redes, gustos/preferencias — info comercial vital, nada ilegal). **NO debemos tener 'Secuencias' que el usuario maneje** — somos la solución confiable; en el **inbox** están esos DMs, filtrando por canal empresa/personal. **Lead-routing y pipeline tienen el mismo sentido → en el pipeline.** Quizá un apartado de **equipo comercial**: él + un par de ejecutivos, carga perfiles, define un default y **deriva por perfil** (qué cliente le calza mejor a cada ejecutivo). Investígalo a fondo y dame mejor propuesta."*
→ **Research (confirma):** **lead routing skill-based** (asignar por expertise/perfil) → **+30% win-rate**; el match es tan bueno como la **data** (de ahí el enrichment). El **botón investigar = contact enrichment** (Clay/Apollo: redes/señales/intereses). Fuentes: [Sparkdbi](https://www.sparkdbi.com/blogs/b2b-lead-routing-guide-2026), [ZoomInfo](https://pipeline.zoominfo.com/operations/top-lead-matching-routing-tools), [Clay](https://www.clay.com/), [Apollo](https://www.apollo.io/).
→ **Implica (re-propuesta):** 6 áreas — **Base de contactos** (CRM/import/propios + enrichment) · **Inbox** (omnicanal, filtrable por canal, sin secuencias) · **Pipeline** (lead-routing embebido) · **Equipo comercial** (skill-based, perfiles de ejecutivos) · **Agenda** · **Propuestas**(+Licitaciones N3). El **outbound** lo ejecuta el agente sobre la base; las respuestas caen al inbox — sin pantalla de secuencias.

### Pto 5 — Norvil: cartera client-first, salud dentro del cliente
*"Cartera y salud irían como juntos; la salud le pertenece al cliente — sería como trabajamos staff y doctores: dentro de doctores están los detalles del doctor. Por cuenta tenemos clientes (personas). Las funcionalidades que propones me gustan, pero el **orden y cómo entramos a cada una** es lo que quiero que funcione bien."*
→ **Implica:** **Cartera** = master-detail (lista de clientes → detalle del cliente). El **detalle** (una sola página, sin tabs) contiene **salud** + mapa multi-stakeholder + historia. Entry model **client-first**: todo se entra a través de un cliente. **Renovaciones** (se dispara desde el cliente). **Fidelización** (motor R5+, N3).

> **v3 producido** en `01-sitemap.md` con estos 5 reworks + el modelo de 4 niveles. **5 confirmaciones abiertas** (C1-C5, § 8 del sitemap) antes de cementar `SYSTEM-MAP.yaml v2`.
