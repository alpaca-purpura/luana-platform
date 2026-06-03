# Nicolify — Product Vision

**Brand:** Nicolify (luana-platform).
**Fecha snapshot:** 2026-05-29.
**Owner:** `/pm-nicolify` (mantiene este file actualizado).
**Status:** v1 — **ratificado parcial por Chris 2026-05-29.** Ratificado: identidad agentic-pura + billing fuera del core (§ 0), ecosistema de agentes (§ 1), nichos Tier 1-3 (§ 2), personas (§ 6). NO decidido aún: pricing/planes/tokens (§ 5 es solo direccional, Chris lo define más adelante).

> Nicolify es la respuesta de luana-platform al mercado de **agencias y servicios profesionales B2B en LatAm**. NO competimos vendiendo "otra herramienta más" (un CRM, un gestor de pauta, un email-marketing). Competimos siendo **el equipo de Revenue & Operaciones que la agencia no puede contratar** — un equipo de agentes IA orquestados que ejecutan Atracción → Cierre → Retención bajo un único punto de contacto conversacional.

---

## 0. Posicionamiento — Agent-as-a-Service (no SaaS de features)

**Qué es:** Nicolify es un sistema SaaS **orquestado por IA (Agent-as-a-Service)** que funciona como un equipo de Revenue y Operaciones "in-house" para agencias B2B.

**El problema que resuelve (doble dolor):**

1. **Fragmentación de herramientas.** La agencia promedio paga y opera 5-8 herramientas desconectadas: CRM (HubSpot/Pipedrive), pauta (Meta/Google Ads Manager), email marketing (Mailchimp/lemlist), prospección (Apollo/Clay/Sales Navigator), analítica (GA4/Looker), gestión (Notion/Trello/Slack). Nadie las conecta; el dato vive en silos; el dueño "arma el Frankenstein" cada lunes.
2. **Dependencia de personal operativo junior.** Para escalar, la agencia contrata SDRs junior, community managers, media buyers, account managers. Caros, rotativos, con curva de aprendizaje, y que ejecutan tareas mecánicas (prospectar, postear, pautar, hacer seguimiento) que un agente IA bien orquestado hace 24/7 sin rotar.

**La propuesta de valor:** centralizar **Atracción, Cierre y Retención** de clientes a través de **un único punto de contacto conversacional** (Luana), eliminando la fragmentación de herramientas y la dependencia de personal junior. El dueño de la agencia le habla a Luana como le hablaría a su mano derecha; Luana orquesta al equipo de agentes expertos detrás.

**Por qué AaaS y no "SaaS con IA":** el producto NO se vende por features (no es "nuestro CRM tiene X"). Se vende por **outcome de un rol**: "¿cuánto te cuesta un SDR + un media buyer + un account manager? Nicolify te da los tres por una fracción, sin rotación, conectados entre sí". El usuario no configura herramientas; **delega un trabajo a un agente**.

> **★ Decisión de identidad (2026-05-29, agentic-first — RATIFICADO por Chris):** Nicolify ES el equipo de agentes. El CRM/pipeline, la gestión de pauta, las propuestas, la salud de cuenta, etc. son **superficies que los agentes operan**, no features standalone vendibles por separado. Se descarta el framing legacy pre-reset de Nicolify como "herramienta de horas facturables + portal de cliente" (no había time-tracking en la visión de Chris; el sistema es un **Revenue OS**, no un project-billing OS). El **billing de los clientes finales de la agencia queda FUERA del core** (lo resuelve la herramienta contable de la agencia).

---

## 1. El ecosistema de agentes (la mecánica)

Seis agentes con roles, autonomía y "territorio" distintos. Mapean al ciclo comercial completo de una agencia B2B (Atracción → Cierre → Delivery → Retención).

| Agente | Rol | Etapa del ciclo | Territorio / superficie que opera | Autonomía |
|---|---|---|---|---|
| **Luana** | Orquestadora / Front-End | Transversal | Chat único; traduce intenciones del dueño en comandos a los agentes; devuelve reportes digeridos | Alta (rutea, resume, prioriza) — nunca ejecuta acciones de negocio sin delegar |
| **Abel** | Estratega (Branding & Oferta) | Pre-Atracción (materia prima) | Absorbe info de la agencia; define ángulos de venta; estructura la escalera de valor; crea el discurso comercial | Media (propone estrategia; el dueño ratifica el posicionamiento) |
| **Brenda** | Guardiana del Presupuesto (Growth) | Atracción inbound | Recomienda qué contenido crear; distribuye; gestiona la pauta publicitaria | **Alta con contingencia** — apaga campañas perdedoras según umbrales CAC/ROAS predefinidos sin pedir permiso |
| **Christian** | Cazador (SDR) | Atracción outbound + Cierre temprano | Prospección outbound; **conectado al perfil real de LinkedIn del fundador/CEO** (la autoridad cierra reuniones en B2B); cold email; seguimiento implacable | Media-alta (ejecuta secuencias; agenda reuniones; escala a humano para el cierre) |
| **Sara** | Jefa de Proyectos (Operación / Delivery) — ⏳ **DIFERIDA "Próximamente"** (Chris 2026-06-02) | Delivery (post-cierre) — *fuera del roadmap activo R0-R5* | **Norte futuro:** hub de contexto (ERPs/Notion/Jira/Slack) para que los OTROS agentes estén enterados. De momento = tab "Próximamente" sin funcionalidad. El landing post-login ya **no** es "Mi Día" sino `christian/pipeline`. | — (diferida · ver ADR-nicolify-002 § Amendment) |
| **Norvil** | Cultivador (Account Manager) | Retención + Expansión | Monitorea la salud de la cuenta (integra Notion/Jira/Slack); detecta oportunidades de cross-sell/up-sell en la misma empresa (ej. entrar a otro departamento); asegura la renovación | Media (alerta + propone; ejecuta nurturing; el dueño aprueba contacto comercial) |

### Principio de diseño cardinal — Luana es el único rostro

El dueño de la agencia **nunca** habla directamente con Abel/Brenda/Christian/Sara/Norvil ni configura "pantallas de herramienta". Le habla a **Luana**. Luana:
1. Traduce la intención ("conseguime 10 reuniones con CTOs de fintech este mes") en comandos técnicos para el agente correcto (Christian).
2. Orquesta dependencias (Christian necesita la oferta de Abel + el ICP que Brenda validó con la data inbound).
3. Devuelve **reportes digeridos**, no dashboards crudos ("Christian agendó 7 reuniones, 3 confirmadas; el ángulo 'reducción de churn' convierte 2x mejor que 'ahorro de costos' — ¿lo escalamos?").

Esto es el equivalente Nicolify del paradigma **shell-organism agéntico** que Vitalia ya cementó (un Ribbon de agentes + un chat orquestador lateral + sub-tabs por agente). El paradigma UI concreto se ratifica al refinar la primera story de UI (`/po-ux` + `/architect`), reusando la base FE madura de Vitalia donde aplique.

### El ciclo end-to-end (cómo se encadenan)

```
ABEL define oferta + ángulos  ──►  materia prima discursiva
        │
        ├─► BRENDA: atracción INBOUND (contenido + pauta, mata campañas perdedoras)
        │
        └─► CHRISTIAN: atracción OUTBOUND (LinkedIn fundador + cold email)
                │
                ▼
        Leads calificados ──► reuniones ──► CIERRE (humano + asistencia Christian)
                │
                ▼
        Cliente ganado ──► SARA: arranca delivery del proyecto (tareas, deadlines, entregables · "Mi Día")
                │
                ▼
        NORVIL: salud de cuenta + cross/up-sell + renovación
                                    │
                                    └─► feedback de retención ──► ABEL refina oferta (loop)

  LUANA orquesta todo el ciclo y es el único punto de contacto del dueño.
```

> ⏳ **Nota (2026-06-02):** el paso de **Sara** (delivery) está **diferido** ("Próximamente"); en el ciclo actual el flujo va de Cierre directo a Norvil (retención). Se reactiva cuando Sara se priorice (candidata R5).

### La intención del dueño por agente — SSoT del producto

> **Graduado** de la story `nicolify-r0-sitemap-completo` (2026-06-02 · `promote_to_vision`). Fija **qué espera el dueño** (CEO/Gerente de la agencia que paga) de cada agente — el norte que manda sobre el árbol de funcionalidades. El **perfil del que paga:** un CEO/Gerente **NO-marketinero** con el know-how, la dirección y la visión (el cerebro), SIN tiempo ni equipo. **Quiere empleados, no herramientas** — le habla a Luana y delega. Cada cliente vale muchísimo (cerrar UNO recupera toda la inversión de marketing) → todo alto-toque, relacional, con la **voz/imagen del fundador** como activo central.

| Agente | Lo que el dueño espera (intención) |
|---|---|
| **Luana** *(★ CORE platform)* | Que le entienda la **intención** y **jamás pierda el hilo**; que **hablando haga todo** por él. **Jamás propone sola: va con los especialistas.** Es la capa conversacional compartida cross-brand — lo nicolify-único empieza en Abel. |
| **Abel** | Su **estratega**: que absorba y **sostenga** su visión/dirección (él no sabe de marketing, pero da el norte) y la vuelva **ICP/buyer + oferta empaquetada (escalera de valor = catálogo en tiers) + marca**. |
| **Brenda** | El trabajo de una **agencia de marketing B2B in-house**: mantenerlo vigente (LinkedIn), decir **cuánto invertir para reuniones de valor**, **proponer temas y postear por él** (dos frentes: empresa + fundador), y qué pega **con sustento** (Apify) + recomendaciones/alternativas. |
| **Christian** | Su **alfil de batalla**: **filtra las reuniones** (quién atiende: ejecutivo o el dueño), **no pierde NINGÚN lead**, **prospecta** y **habla por él clonando su voz**. Parte operativa de ventas (aún-no-clientes). |
| **Sara** ⏳ | *(diferida)* Norte futuro: hub de contexto ERP para que los otros agentes estén enterados. |
| **Norvil** | Un **CRM de los clientes ACTUALES** (Christian los trajo): **cumpleaños, mensajes, correos, regalos** — fidelizar. Arranca liviano + **motor de fidelización novedoso** para agencias SMB sin área de marketing (momentos · champion-shield · QBR · gifting). |

**Capability compartida — voz/autoridad del fundador:** NO se duplica. **Brenda la usa para publicar** (post-by-proxy) · **Christian la clona para conversar 1:1**. Regla: *voz personal del fundador → Christian · voz de la marca → Brenda · publicar siempre Brenda.*

**Estrategia de canales (research jun-2026):** **LinkedIn #1** (la casa del B2B) · **Meta #2** (demand-gen, atribución a pipeline + kill-switch CAC) · **Email sí** (personalizado/signal-based) · **TikTok NO ahora**.

**El árbol de funcionalidades (nav de 4 niveles · Agente → Área → Subárea → Hoja):** el inventario canónico vive en **`nicolify/docs/architecture/SYSTEM-MAP.yaml` v2.0** (zonas → cajas → áreas → hojas N3) — es el SSoT que el cockpit lee. El roadmap por release (qué hoja en qué release) en `nicolify/docs/product/releases/R0..R5.yaml`. El refinamiento completo (con la intención embebida por hoja) se archiva con la story en `nicolify/docs/archive/2026/stories/nicolify-r0-sitemap-completo/`.

---

## 2. Nichos B2B target (Tier 1-3)

Filtros aplicados — un nicho califica si cumple **los 5**: (1) ticket **alto** que justifica venta consultiva, (2) ciclo comercial **largo** (semanas-meses) con seguimiento, (3) **separación entre "Cuenta" (empresa) y "Stakeholder/Contacto" (persona)** — múltiples tomadores de decisión, (4) **retención/upsell** son palanca de revenue (no one-shot), (5) atracción **relacional/outbound** — networking del fundador, LinkedIn, referidos, pauta de autoridad (no retail impulsivo).

### Tier 1 — Foco MVP (confirmados Chris)

| Vertical | Modelo comercial | Ticket típico | Fit con agentes | Por qué MVP |
|---|---|---|---|---|
| **Agencias de marketing / publicidad** | Retainer mensual + proyectos | USD 2K-15K/mes retainer (6-24 meses) | Brenda (pauta es su lengua materna) + Abel (oferta/posicionamiento) + Christian (outbound a nuevos clientes) | Dolor de fragmentación máximo (viven en 8 herramientas); entienden de pauta y CAC/ROAS (Brenda vende sola); Chris conoce el vertical |
| **Agencias / boutiques de software** | Proyecto + maintenance/retainer | USD 10K-100K proyecto + recurrente | Christian (outbound consultivo, LinkedIn del fundador técnico cierra) + Norvil (expansión: nuevo módulo, nuevo departamento) | Venta consultiva pura, ticket altísimo, separación cuenta/stakeholder clara (CTO + CEO + procurement) |

### Tier 2 — Expansión 6-12 meses (parte del mercado base — ratificados Chris)

| Vertical | Por qué calza | Agente protagonista |
|---|---|---|
| **★ Contratistas / proveedores mineros B2B** (vertical insignia Perú — ver callout abajo) | Ticket muy alto, ciclo largo, contratos recurrentes/renovables; atracción = homologación + relación con procurement + licitaciones (no pauta). **Mercado base del fundador** | Abel (dossier homologación) + Christian (outbound procurement + tracking licitaciones + LinkedIn) + Norvil (renovación + expansión a nuevas faenas) |
| **Consultoría estratégica / de negocio** | Venden conocimiento; networking del socio fundador es el motor (Christian); retención de cuentas clave = revenue (Norvil) | Christian + Norvil |
| **Firmas de Headhunting / Staffing / Reclutamiento ejecutivo** | 100% relacional; LinkedIn es su océano; ciclo largo; cuentas recurrentes (la empresa que contrata vuelve) | Christian (es literalmente su día a día) + Norvil |
| **MSP / Servicios IT gestionados / Ciberseguridad** | Modelo **100% retención + upselling continuo** en las mismas cuentas (más usuarios, más módulos, más compliance); ticket recurrente alto | Norvil brilla (retención pura) + Christian (outbound a nuevas cuentas) |

### Tier 3 — Oportunista / a validar (research 2026-05-29 — recomendaciones Claude)

Verticales que **comparten el mismo perfil** (alto ticket, consultivo, account-based con separación cuenta/stakeholder, retención/upsell, atracción relacional/outbound). Recomendados para que Chris evalúe expandir:

| Vertical | Razón de fit | Agente protagonista | Riesgo / nota |
|---|---|---|---|
| **Estudios de arquitectura / ingeniería / diseño industrial B2B** (mencionado por Chris) | Proyectos largos, múltiples tomadores de decisión por cuenta, flujo constante de leads educados | Abel + Brenda (autoridad/portfolio) + Christian | Ciclo MUY largo; nurturing pesado |
| **Firmas contables / fiscales / auditoría / advisory** | Retainer recurrente, expansión de servicios dentro de la cuenta, relación de confianza largoplacista | Norvil (retención) + Abel (empaquetar servicios) | Venta menos "marketinera"; más referido |
| **Agencias de PR / comunicación corporativa** | Gemelo de las agencias de marketing: retainer, relación, autoridad | Brenda + Abel | Casi idéntico a Tier 1 marketing → posible Tier 1.5 |
| **Brokers de seguros comerciales / advisory financiero B2B** | Account-based, retención altísima (renovación de póliza/portafolio), cross-sell de productos | Norvil + Christian | Regulación financiera local a evaluar |
| **Proveedores de capacitación corporativa / e-learning B2B** | Venta consultiva a RRHH/L&D, ciclo largo, expansión por cohortes/departamentos | Christian + Norvil | Estacionalidad presupuestaria |
| **Empresas de logística / freight forwarding B2B** | Account-based, contratos recurrentes, expansión por rutas/volumen | Christian + Norvil | Vertical más operativo que "marketing" |

### ★ Callout — Contratistas / proveedores mineros (vertical insignia Perú)

**El tenant** es una empresa **contratista/subcontrata minera** (proveedor) que quiere **venderle servicios a las operaciones mineras**. Vende a dos tipos de cuenta:
1. **La minera directamente** (titular de la concesión).
2. **Un contratista minero "tier-1" más grande** que ganó un contrato que excede su capacidad logística y **subcontrata** el overflow.

**Qué venden:** alquiler de maquinaria pesada (operada o no), provisión de personal calificado, movimiento de tierras, servicios especializados para exploración/desarrollo/explotación.

**Cómo consiguen y retienen contratos (lo que los agentes deben orquestar):**

| Mecánica del negocio | Quién la opera en Nicolify |
|---|---|
| **Inscripción/registro** como "contratista minera especializada" ante el MINEM (requisito para contratar con titular de concesión) | Abel/Norvil mantienen el dossier vigente |
| **Homologación / pre-calificación de proveedor** en plataformas (MINDER/REDMIN, **SAP Ariba** de cada minera) — pasar homologación NO garantiza invitación a licitar, depende del comprador | Abel arma el dossier técnico + Norvil mantiene homologación vigente |
| **Networking + relación con procurement** (jefes de logística, analistas de contratos, superintendentes de operaciones) + presencia sectorial (ACOMIPE, PERUMIN) | Christian (outbound con LinkedIn del fundador = autoridad sectorial) |
| **Respuesta a RFI / RFQ / licitaciones** invitadas | Christian rastrea + alerta + ayuda a preparar; cierre humano |
| **Renovación de contrato + expansión a nuevas faenas/operaciones** de la misma minera, o nuevo overflow de un tier-1 | Norvil (retención + cross/up-sell account-based) |

**Modelo Cuenta vs Stakeholder (encaja perfecto):** Cuenta = la minera o el contratista tier-1; Stakeholders = jefe de logística + analista de contratos (procurement) + superintendente de operaciones — múltiples tomadores de decisión por cuenta, exactamente el patrón B2B de Nicolify. **Brenda** tiene rol menor aquí (es relacional, no de pauta masiva): a lo sumo autoridad/credibilidad técnica de marca.

> Diferencia clave vs agencias: la "atracción" no es pauta digital sino **estar homologado + bien relacionado con procurement + responder licitaciones**. Christian y Norvil cargan el peso; el flujo homologación→licitación→contrato→renovación es la maquinaria a modelar cuando se priorice este vertical.

### Verticales DESCARTADOS

- **Retail / e-commerce B2C** → ticket bajo, decisión impulsiva, no consultivo, no account-based.
- **Servicios de oficio / hogar (B2C)** → eso es vertical de otra brand (Fixia). One-shot, no retención corporativa.
- **Salud / clínicas** → vertical de Vitalia (paciente, no cuenta B2B).
- **Cualquier negocio con ciclo de venta < 1 semana** → no hay nada que "cultivar" (Norvil no tiene rol).

---

## 3. Landscape competidores

Nicolify NO compite contra un producto; compite contra **el stack fragmentado + el costo de personal**. Pero los puntos de comparación que el comprador tiene en mente:

| Categoría | Ejemplos | Qué hacen bien | Gap que Nicolify explota |
|---|---|---|---|
| **CRM** | HubSpot, Pipedrive, Salesforce, Close | Pipeline, contactos, reporting | Es una base de datos pasiva; **no prospecta, no pauta, no cultiva solo**. El dueño/SDR hace el trabajo. |
| **AI SDR / outbound** | 11x (Alice/Julian), Artisan (Ava), Relevance AI, Clay, Apollo, Instantly, lemlist | Prospección + secuencias automatizadas; enrichment | **Punto único** (solo outbound). No conecta con la oferta (Abel), la pauta (Brenda) ni la retención (Norvil). Genéricos, no verticalizados a agencias LatAm. Difíciles de operar (el dueño tiene que ser growth hacker). |
| **Gestión de pauta / growth** | Madgicx, Revealbot, Smartly, agencies tools | Automatización de bidding/creatives; reglas | No hablan con el CRM ni con el outbound; **sin contingencia conversacional** ("apagá lo que pierde" requiere configurar reglas técnicas, no decirle a un agente). |
| **Project/Account ops** | Notion, ClickUp, Asana, Slack | Gestión interna de proyectos/cuentas | No detectan oportunidad de upsell ni monitorean salud de cuenta proactivamente; son contenedores, no agentes. |
| **Suites "todo en uno" PYME** | GoHighLevel, Keap, Zoho One | Consolidan varias funciones | Orientados a B2C/local business; UX de "configurar 200 cosas"; **no es un equipo que delegás, es un panel que operás**. Sin orquestación conversacional verticalizada B2B. |
| **AI agent platforms horizontales** | Relevance AI, Lindy, Beam, Sierra | Construir agentes custom | Requieren que el cliente DISEÑE sus agentes (no son un equipo pre-armado verticalizado); sin conocimiento de negocio de agencias B2B out-of-the-box. |

### Patrones de gap identificados

1. **NINGÚN competidor orquesta el ciclo completo** (Atracción inbound + outbound + Cierre + Retención) **bajo un único punto de contacto conversacional**. Todos son point-tools que el dueño debe pegar con cinta.
2. **El "land & expand" relacional está huérfano**: las AI SDR tools traen leads fríos, pero ninguna cultiva la cuenta ganada para upsell (territorio de Norvil) ni conecta el outbound con la autoridad real del fundador en LinkedIn de forma nativa y segura.
3. **Autonomía de presupuesto conversacional**: matar una campaña perdedora hoy requiere reglas técnicas en Revealbot/Madgicx; Nicolify lo hace porque Brenda **tiene autonomía de contingencia** sobre umbrales CAC/ROAS y lo reporta en lenguaje natural.
4. **Verticalización LatAm B2B + español neutro + canales locales** (WhatsApp Business, LinkedIn, pauta Meta/Google en mercado LatAm) — las suites líderes son US-first y B2C-leaning.
5. **El producto se vende como rol delegable, no como features** — reduce la fricción de adopción (no hay que "aprender la herramienta", se le habla a Luana).

---

## 4. Diferenciadores Nicolify (hipótesis cementadas)

### H1 — Equipo orquestado, no herramientas sueltas (Luana como único rostro)

**Tesis:** el dueño de agencia no quiere otra herramienta; quiere **resultados sin gestionar gente ni stack**. Luana traduce intención → ejecución → reporte digerido. Reemplaza la carga cognitiva de operar 8 SaaS + coordinar 3 juniors.
**Impacto:** #1 diferenciador. Es la razón de compra ("delego, no configuro").

### H2 — Outbound con la autoridad real del fundador (Christian + LinkedIn del CEO)

**Tesis:** en B2B la autoridad cierra reuniones. Conectar Christian al **perfil real de LinkedIn del fundador/CEO** (no un perfil bot genérico) multiplica la tasa de respuesta — el prospecto recibe el mensaje del fundador, no de "un SDR". Tácticamente decisivo y difícil de replicar por las AI SDR tools genéricas.
**Impacto:** tasa de reunión agendada; defensibilidad (relación + autoridad no se commoditiza).

### H3 — Growth con autonomía de contingencia (Brenda mata lo que pierde)

**Tesis:** el desperdicio #1 de presupuesto de pauta es no apagar a tiempo. Brenda tiene **autonomía predefinida** (umbrales CAC/ROAS por el dueño) para apagar campañas perdedoras sin esperar aprobación, y lo reporta. Protege el ROI del cliente y demuestra valor medible mes a mes.
**Impacto:** ROI inmediato y medible (cada peso de pauta mal gastado evitado = valor tangible).

### H4 — Retención y expansión proactiva (Norvil cultiva la cuenta)

**Tesis:** el revenue B2B vive en la base instalada. Norvil monitorea salud de cuenta (integrando Notion/Jira/Slack del flujo de trabajo real), detecta señales de churn y oportunidades de cross/up-sell (ej. entrar a otro departamento de la misma empresa) **antes** de la renovación.
**Impacto:** eleva LTV y net revenue retention; convierte one-shot en relación multi-año.

### H5 — Modelo económico que protege el margen (tokens con guardrails)

**Tesis:** un AaaS intensivo en LLM puede evaporar el margen con un usuario heavy. Nicolify usa **suscripción base + límites de uso (tokens)** con alertas de recarga, PERO las funciones críticas (soporte, recepción pasiva de leads por WhatsApp) **nunca se cortan** — se mantiene la confianza del cliente mientras se protege el margen del negocio.
**Impacto:** unit economics sanos + experiencia de cliente sin "te quedaste sin créditos y perdiste un lead".

### Ranking impacto comercial

1. Equipo orquestado bajo Luana (H1) → razón de compra.
2. Outbound con autoridad del fundador (H2) → tasa de cierre + defensibilidad.
3. Brenda con autonomía de contingencia (H3) → ROI medible inmediato.
4. Norvil retención/expansión (H4) → LTV / NRR.
5. Token economy con guardrails (H5) → margen + confianza.

---

## 5. Modelo de negocio y pricing (SaaS híbrido) — ⚠️ NO DECIDIDO

> **★ Status (Chris 2026-05-29):** el pricing **NO está decidido y no es prioritario aún**. Esta sección es solo una **dirección tentativa** (será "similar a esto", pero los montos, la estructura final de tiers y el tamaño de la bolsa de tokens los define Chris más adelante). **No tomar como cementado** — no asociar planes a personas, releases ni features hasta que Chris lo ratifique explícitamente.

**Dirección tentativa (no cementada):** modelo híbrido **suscripción base + límites de uso (tokens)**, donde los tiers se diferencian por **qué agentes se desbloquean** (no por "cantidad de features"). Orientativamente: un tier de entrada con Luana+Abel+Brenda (atracción inbound), uno intermedio que suma Christian (outbound), y uno superior que suma Norvil + integraciones operativas (retención/expansión). **Montos: TBD por Chris.**

**Gestión de costos / protección de margen:**
- **Metering de tokens** por agente y por acción (cada llamada LLM se registra con costo — el engine de observabilidad/cost de Luana ya provee esto: `core/luana-core-observability/` cost recording + FX resolver).
- **Alertas de recarga** progresivas (80% / 95% / 100% de la bolsa) — el dueño recarga antes de quedarse sin créditos.
- **Funciones críticas no se cortan** aunque la bolsa se agote: soporte y **recepción pasiva de leads por WhatsApp** siguen activos (no se pierde un lead entrante por falta de créditos). Las funciones intensivas/proactivas (outbound masivo, generación de creatives) sí se pausan hasta recarga.
- **Tier gating** enforced a nivel de capacidad: el plan del tenant determina qué agentes puede invocar (gate de feature flag por capacidad, server-side). El *mecanismo* es real aunque los planes concretos estén sin decidir.

---

## 6. Buyer personas

### P1 — "Martín" — Fundador de agencia chica founder-led

- **Demografía:** 30-42 años, fundó su agencia de marketing/software hace 1-4 años. Equipo de 2-8 personas. Él vende, entrega y administra.
- **Contexto:** 5-20 cuentas activas. Hace el outbound a mano cuando tiene tiempo (casi nunca); la pauta la maneja él o un freelancer; el seguimiento se le cae. Vive en WhatsApp + LinkedIn + un CRM a medio llenar.
- **Pain points:** el pipeline depende 100% de él (si para de vender, se seca); pierde leads por no hacer seguimiento; no tiene tiempo para prospectar; no sabe qué pauta funciona; cuando gana una cuenta no la expande.
- **Valora:** delegar sin contratar; que "alguien" prospecte con su autoridad; ROI visible rápido; precio de entrada accesible.
- **Objeción principal:** "¿Un bot hablando por mí en LinkedIn no va a arruinar mi marca personal?" → control de tono + aprobación humana de secuencias + Luana reporta antes de escalar.

### P2 — "Daniela" — Dueña de agencia mediana establecida

- **Demografía:** 38-52 años, agencia de 10-40 personas, varios años de trayectoria. Tiene juniors (SDR, community, media buyer, AM).
- **Contexto:** stack fragmentado (HubSpot + Apollo + Meta Ads + Notion + Slack), nadie lo conecta; rotación de juniors le cuesta caro; atribución de marketing rota; no sabe qué cuentas están en riesgo de churn.
- **Pain points:** costo y rotación de personal operativo; data en silos; no escala sin contratar; retención reactiva (se entera del churn cuando el cliente ya se fue).
- **Valora:** consolidar el stack; reducir headcount junior; salud de cuenta proactiva (Norvil); reporting unificado vía Luana; integraciones con su flujo (Notion/Jira/Slack).
- **Objeción principal:** "Migrar de mi stack y reentrenar al equipo da pánico." → onboarding asistido + Luana convive con herramientas existentes vía integraciones (no rip-and-replace day 1).
- **Nota:** **sticky alto** post-integración (las integraciones operativas la atan al flujo de trabajo real).

### P3 — "Sebastián" — Consultor/headhunter individual escalando a firma

- **Demografía:** 28-45 años, consultor o reclutador ejecutivo independiente o socio de firma boutique (1-5 personas).
- **Contexto:** su negocio ES su red de LinkedIn + su reputación. Prospecta a mano; el seguimiento de cuentas recurrentes es informal (memoria + notas sueltas).
- **Pain points:** no escala su prospección sin perder el toque personal; olvida re-contactar cuentas que ya compraron; depende de su tiempo 1:1.
- **Valora:** amplificar su networking con su propia autoridad (Christian + su LinkedIn); que Norvil le recuerde y cultive las cuentas dormidas; precio por valor (un cierre paga meses).
- **Objeción principal:** "Mi diferencial es que soy yo, no un bot." → Nicolify amplifica SU voz/autoridad, no la reemplaza; él aprueba antes de cada escalamiento.

### Distribución TAM (estimada — a validar)

| Persona | % volumen tenants | % revenue |
|---|---|---|
| Martín (chica) | 50-60% | 25-35% |
| Daniela (mediana) | 15-25% | 45-55% |
| Sebastián (consultor) | 20-30% | 15-20% |

---

## 7. GTM strategy

- **Mercado base:** **Perú** (donde está el fundador) como beachhead geográfico — incluye el nicho de subcontratas/proveedores mineros (§ 2 Tier 3), fuerte en el país. Expansión LatAm después.
- **Dogfooding como prueba viva:** Nicolify se vende a sí mismo usando a Christian con el LinkedIn del fundador de luana-platform (el mejor demo es el pipeline real generado por el producto).
- **Beachhead de segmento:** Persona 1 (Martín) en nichos Tier 1 (agencias marketing + software boutiques). PLG + outbound con autoridad (H2) + referidos del ecosistema agencias.
- **Mid-market expansion:** Persona 2 (Daniela) tras tracción inicial; sales-led + onboarding asistido + integraciones (Notion/Jira/Slack) como hook de stickiness.
- **Volume relacional:** Persona 3 (Sebastián) — consultores/headhunters que viven en LinkedIn; canal de adopción viral (cada cierre que hacen con Nicolify es testimonio).

---

## 8. Roadmap implicaciones

Esta visión dicta la priorización de capacidades (el detalle vive en `nicolify/docs/product/releases/` — owner `/pm-nicolify`):

1. **R0 — Fundación + shell agéntico:** infra brand activa (BE :8001 / FE :3001) + shell-organism con Luana como chat orquestador + Ribbon de agentes (reuso base Vitalia). → habilita todo lo demás.
2. **R1 — Abel + Brenda (Atracción inbound):** onboarding de la agencia (Abel absorbe info, define oferta/ángulos) + Brenda recomienda contenido + gestiona pauta con autonomía de contingencia (umbrales CAC/ROAS). → cumple H1 + H3. **Primer producto vendible (atracción inbound).**
3. **R2 — Christian (Outbound):** prospección outbound + conexión segura al LinkedIn del fundador + cold email + secuencias + agendamiento. → cumple H2. **Suma outbound/cierre.**
4. **R3 — Norvil (Retención + Expansión):** integración Notion/Jira/Slack + salud de cuenta + detección cross/up-sell + nurturing pre-renovación. → cumple H4. **Suma retención/expansión (ciclo completo).**
5. **R4 — Token economy + observabilidad de costo:** metering por agente/acción + alertas de recarga + guardrails de funciones críticas + capability gating. → cumple H5 (transversal, puede adelantarse si el costo LLM lo exige).

> El orden R1→R2→R3 sigue el ciclo Atracción→Cierre→Retención, sumando un agente y entregando algo vendible en cada release. (La asociación de estas capas a planes/precios concretos está sin decidir — ver § 5.)

---

## 9. Implicaciones arquitectónicas (consumir engine, no recrear)

> **Marco — el paradigma de 3 planos (cement 2026-05-30).** Nicolify encaja en el modelo operativo platform-wide (`docs/architecture/luana-platform/PARADIGM.md` + `ADR-010`; adaptación brand `ADR-nicolify-002`): **① Sistema** (las capacidades B2B reales — CRM, pauta, propuestas, salud de cuenta — operables a mano, funcionan sin agentes) · **② Capa de acción única** (cada caso de uso expuesto una vez en el service layer; la web y los agentes ejecutan la MISMA acción, nunca reimplementan) · **③ Trabajadores** (Luana supervisora + 4 especialistas sobre **un solo engine por audiencia**: `copilot` interno habla al dueño, `sales_agent` externo habla a los prospectos — **Christian es el bifronte**). El mapa del producto agrupa toda capability en **3 zonas** (Agentes · Plataforma · Infraestructura) — registro en `nicolify/docs/architecture/SYSTEM-MAP.yaml::zones`.

Nicolify consume el engine compartido `core/luana-core-*` vía Extension SDK. Sistemas clave ya disponibles que los agentes Nicolify **deben reusar (no recrear)**:

- **Orquestación agéntica:** `core/luana-core-copilot/` + `core/luana-core-sales-agent/` (LangGraph + deepagents). Luana/Christian/Norvil/Brenda se construyen como brand-extensions en `nicolify/backend/src/modules/nicolify/{copilot,sales_agent}/`.
- **Observabilidad + costo (token economy):** `core/luana-core-observability/` (cost recording, FX resolver, pricing snapshots, trace events) — base del metering de tokens (H5).
- **CRM:** `core/luana-core-crm/` — modelo de cuenta/stakeholder, pipeline, deals (territorio de Christian/Norvil).
- **Oferta:** `core/luana-core-offer-studio/` — escalera de valor que Abel estructura.
- **Canales:** `core/luana-core-channels/` — WhatsApp/LinkedIn/email dispatch + format-for-channel.
- **Billing/guards:** `core/luana-core-billing/` (BudgetGuard + RateLimiter) — tier gating + límites de tokens.
- **Eventos + idempotencia:** `core/luana-core-events/` (outbox) + `core/luana-core-idempotency/`.

> El prior-art scan obligatorio (`.claude/rules/anti-duplication-refining.md`) corre al refinar cada story: greppar `core/` + brands activas (vitalia, comunify) + snapshot frozen nicolify (referencia arqueológica de patterns B2B/CRM shipped pre-reorg).

---

## 10. Sources (research 2026-05-29)

B2B sales / account-based / high-ticket / retention:
- [High-Ticket Sales in B2B (Martal)](https://martal.ca/high-ticket-sales-lb/)
- [B2B sales cycle stages 2026 (Highspot)](https://www.highspot.com/blog/sales-cycle-stages/)
- [B2B Sales trends 2026 (Peak Sales Recruiting)](https://www.peaksalesrecruiting.com/blog/b2b-sales-trends-2026/)
- [B2B sales 7 strategic shifts (180ops)](https://www.180ops.com/blog/b2b-sales-in-2026-the-7-strategic-shifts-reshaping-revenue/)
- [What is B2B sales 2026 (ZoomInfo)](https://pipeline.zoominfo.com/sales/what-is-b2b-sales)

LinkedIn outbound / industrias reliant en prospección:
- [LinkedIn changed B2B prospecting 2026 (Rev-Empire)](https://rev-empire.com/blog/linkedin-2026-updates-b2b-sales-outreach/)
- [LinkedIn prospecting strategy (Leadium)](https://www.leadium.com/services/linkedin-prospecting)
- [9 LinkedIn B2B outreach strategies 2026 (Belkins)](https://belkins.io/blog/linkedin-outreach)
- [LinkedIn lead generation services (memoryBlue)](https://memoryblue.com/linkedin-lead-generation-services/)

> Verticales reliant en outbound + account expansion identificados en research: SaaS, Cybersecurity, Freight/Logistics, Digital Transformation, Marketing Services, E-Learning, Staffing & Recruiting, Manufacturing — base de las recomendaciones Tier 2-3 § 2.

Contratistas / proveedores mineros Perú (vertical insignia):
- [ACOMIPE — Asociación de Contratistas Mineros del Perú](https://acomipe.pe/)
- [MINEM — Inscribir empresa como contratista minera especializada](https://www.gob.pe/769-inscribir-y-ampliar-a-mi-empresa-como-contratista-minera-especializada)
- [MINDER / REDMIN — registro + homologación de proveedores mineros](https://redmin.pe/registroproveedores/)
- [SAP Ariba transformando la minería en Perú (Omnia Solution)](https://omniasolution.com/2024/07/04/sap-ariba-transformando-la-mineria-en-peru/)
- [Alquiler de maquinaria operada para minería (Posada Perú)](https://www.posada.pe/alquiler-de-maquinaria-operada-mineria)

---

## Maintenance

Este file lo actualiza `/pm-nicolify` cuando:
- Nuevo nicho Tier 1/2/3 validado (research + Chris ratify).
- Nuevo agente o cambio de territorio/autonomía de un agente.
- Nuevo competidor relevante detectado.
- Nueva hipótesis diferenciador validada (post user research).
- Cambio de modelo de pricing / tiers / token economy.
- Cambio de buyer persona (descubrimiento post-ventas).

Update workflow: refresh file + cementar learning si surge insight (`docs/learnings/` o `nicolify/docs/learnings/`) + commit en mismo PR.

## Referencias

- `nicolify/CLAUDE.md` — overlay brand auto-load
- `nicolify/docs/product/checkpoint.md` — state brand
- `nicolify/docs/product/releases/` — roadmap detallado (R0..RN)
- `nicolify/.claude/rules/agent-revenue-engine.md` — overlay rule (autonomía agentes + token economy + CRM account model + outbound compliance)
- `core/luana-core-{copilot,sales-agent,crm,offer-studio,observability,channels,billing}/` — engine que Nicolify consume
- `.claude/rules/anti-duplication-refining.md` — prior-art scan obligatorio refining
- `vitalia/` — brand activa de referencia (paradigma shell-organism agéntico + base FE madura)
