---
story_id: nicolify-r0-sitemap-completo
created_at: 2026-06-02T16:31:02-05:00
last_modified: 2026-06-02T16:34:00-05:00
notes_count: 1
refs_count: 3
conversation_count: 4
---

# chris-input.md · nicolify-r0-sitemap-completo

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Es la cocina de la story (la conversación) — separada del spec/design/arch (los outputs ratificados).
>
> **3 secciones secuenciales** (mantener el orden + emojis para que parser + cockpit funcionen):
> - 💭 Notas — Chris escribe en lenguaje natural antes/durante refinement
> - 📎 Referencias — links, imágenes, story-refs, learning-refs, doc-refs
> - 💬 Conversación — turn-by-turn cronológico Chris ↔ Claude con verdicts
>
> Doc canónico: `docs/process/chris-input-protocol.md`.

## 💭 Notas

### 2026-06-02 16:31
Idea de Chris (verbatim): arrancar una historia de usuario propia con quien pueda **revisar todo el sitemap**, cuyo objetivo no solo sea **actualizarlo por completo** sino también **armar la ruta de desarrollo** y que se **modifiquen los subtabs y subsubtabs del shell-organism** para ya tener el "árbol" e ir luego **hoja por hoja**. La idea es tener **todas las funcionalidades a implementar primero a alto nivel, NO diseñarlas**, pero saber lo que haremos dentro y **ubicar dónde podría hacerse mejor**.

## 📎 Referencias

- **📄 doc** · `nicolify/docs/architecture/SYSTEM-MAP.yaml` (v1.1 — el árbol actual: 3 zonas · 6 agentes · 28 áreas · 7 flujos)
  > SSoT doctrinal a completar a v2.
- **📄 doc** · `nicolify/frontend/src/lib/routing/shell-routes.ts` (el menú cableado: AGENT_SUBTABS + AGENT_SUBSUBTABS={})
  > El nav a reestructurar (subtabs + subsubtabs).
- **📖 story-ref** · `nicolify-r0-shell-organism` (parent · cementó el nav-tree N2 de R0)

## 💬 Conversación

> Append-only · turn-by-turn cronológico.
> Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-06-02 16:31 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
Story creada en `state: idea` como **design-story PLANNING-ONLY** (hija de `nicolify-r0-shell-organism`), release R0, `cap_target: null` (meta-story que declara los stubs `planned` de todas las hojas).

Entregables esperados: (1) **SYSTEM-MAP v2** completo a alto nivel (cada hoja nombrada + zona/caja/área + release) resolviendo las 3 discrepancias shell↔map + los 3 gaps de completitud; (2) **roadmap de desarrollo** (qué hoja en qué release); (3) **nav skeleton** (`shell-routes.ts` subtabs/subsubtabs + empty-states). Non-goal explícito: NO diseñar ni construir hojas.

### 2026-06-02 16:31 · 🤖 claude · `/pm-nicolify` · ⚠️ DUDA
Necesito que ratifiques el **frame** antes de refinar: (a) slug `nicolify-r0-sitemap-completo` + release R0, (b) **refining path** — propongo `/pm-nicolify` + vos recorremos y completamos el SYSTEM-MAP + roadmap (es territorio PM: inventario de capabilities + secuenciación), y el nav skeleton sale como thin `/architect` → `/dev-team`. Alternativa: `/architect`-led si querés el rigor de placement/CONN desde el inicio.

### 2026-06-02 16:34 · 👤 chris
PM-led, dale, commitea. Arrancaré el refinamiento en otra conversación.

### 2026-06-02 16:34 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
Frame ratificado: slug `nicolify-r0-sitemap-completo` · release R0 · refining **PM-led** (`/pm-nicolify` + Chris completan SYSTEM-MAP v2 + roadmap; nav skeleton = thin `/architect` → `/dev-team`). Checkpoint marcado `ratified_by_chris: true` + `refining_owner: /pm-nicolify`. Story commiteada + pusheada. Sigue en `state: idea` — Chris arranca el refinamiento (`idea → refining`) en otra conversación invocando `/pm-nicolify nicolify-r0-sitemap-completo` o "refinemos nicolify-r0-sitemap-completo".

### 2026-06-02 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
Arranqué el refinamiento. `state: idea → refining`. Prior-art scan ejecutado + documentado en `00-research.md` (fuente principal: vitalia SYSTEM-MAP + shell maduro). Presenté las 6 cuestiones (D1-D3 discrepancias + G1-G3 gaps) vía AskUserQuestion.

### 2026-06-02 · 👤 chris (decisiones vía AskUserQuestion)
- **D2 landing** → christian/pipeline (se queda).
- **G1 inbox** → "un inbox donde el usuario vea TODAS las conversaciones atendidas por Christian. Investigá el inbox de vitalia (planificado, no construido aún allá — pero casi idéntico visual, difiere interno: vitalia tiene HIPAA y más). Decime la mejor ruta de réplica."
- **G2 aprobaciones** → descartado este stage ("para no complicarnos"). Sin caja.
- **G3 agenda** → Christian dueño de todo lo comercial + reuniones comerciales. Sara aún sin agenda definida; su día a día = hub, NO project-mgmt este stage (futuro cercano).

### 2026-06-02 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
Registré las 6 decisiones en `00-research.md § Decisiones de Chris`. D1 ajustada por la nota de G3: Sara este stage = `mi-dia` (hub), `proyectos`/`entregas` diferidos.

### 2026-06-02 · 🤖 claude · `/pm-nicolify` · 💡 PROPONE (ruta inbox)
Investigué a fondo el inbox de vitalia (capability + story activa + archivada + mockups + código FE/BE, vía Explore). Hallazgos en `00-research.md § Inbox deep-dive`:
- **Está SHIPPED en vitalia** (story `vitalia-slice-1-inbox` done, 927 BE + 237 FE tests); hay una story F2 de migración al shell aún en `idea`.
- **Dato histórico:** el inbox de vitalia nació forkeado del `nicolify/closer-studio/inbox` — replicar = traerlo de vuelta mejorado.
- **~85% visual genérico** (3-panel, 3-modos toggle Decide/Consulta/Manual, OCC, ActionReceipt 5min undo, activity stream) · **lo distinto es 100% HIPAA** (PHI masking, dual filter clinic_id, ComplianceService) que nicolify NO necesita.
- **Ruta recomendada:** copy re-tematizado del FE + patrón DDD sin capa HIPAA (solo `tenant_id`). **NO lift a engine todavía** (requiere promotion proposal `/pm-luana` por el mismatch clinic_id vs tenant_id). ~5-7 días, en una story dedicada de release futuro — NO en esta meta-story.
- **Aterrizaje:** Christian gana functional_area `inbox`; `Conversation` se reasigna a christian/sales_agent.

Necesito tu **nod a la ruta** (copy-retematizado, no-lift-ahora) + luz verde para seguir: recorrer las 28 áreas nombrando hojas faltantes + secuenciar el roadmap R1..RN → escribir SYSTEM-MAP v2.

### 2026-06-02 · 👤 chris
"Recuerda que esta historia es para obtener un sitemap refinado, una lista de todas las funcionalidades — basta con que lo entiendas y lo referencies. Continuemos con el refinamiento."

### 2026-06-02 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
Entendido — inbox queda entendido + referenciado en `00-research.md` (sin sobre-diseñar la ruta de build). Escribí **`01-sitemap.md` (PROPUESTA)** = el output de la story: árbol COMPLETO de funcionalidades — 3 zonas · 6 agentes + Plataforma + Infra · cada hoja nombrada + ubicada (zona→caja→área) + `qué haremos dentro` (1 línea, sin diseñar) + release. Incluye:
- **Roadmap matriz** R0..R4 + Futuro (alineado a vision §8 + R0.yaml).
- Las 6 decisiones aplicadas (inbox ★ + agenda comercial ★ nuevas en Christian · Sara=hub · landing christian/pipeline · sin caja de aprobaciones · Conversation→christian).
- **Deltas vs SYSTEM-MAP v1.1** (7 cambios para cementar v2).
- **3 open items** (OI-1 recepción inbound R1 vs R2 · OI-2 agenda subtab vs N3 · OI-3 Sara en Ribbon desde R0).

Pendiente: tu review del `01-sitemap.md` + cerrar OI-1..3 → cemento `SYSTEM-MAP.yaml v2` + nav skeleton (`shell-routes.ts`) + releases. ¿Lo revisás y me decís ajustes?

### 2026-06-02 · 👤 chris
"Revisá el core y el legacy para que entiendas qué hay. Además, nunca me preguntaste qué cosas espero de cada uno de los agentes para que hagas tu propuesta. Quiero estar seguro, antes de ponerme a leer un archivo, de que has captado TODO el objetivo de la solución a nivel de negocio: qué es lo que busco que hagamos, en qué ayudan los agentes a las personas que nos pagan y usan Nicolify."

### 2026-06-02 · 🤖 claude · `/pm-nicolify` · ⚠️ DUDA (pausa de comprensión — paro de proponer)
Reconocido: salté a `01-sitemap.md` desde el SYSTEM-MAP v1.1 sin anclarme en tu intención de negocio ni preguntarte qué esperás de cada agente. Lo corrijo.

**Revisé core + legacy** (vía 2 Explore agents · read-only):
- **Legacy (`~/Proyectos/luana-nicolify-legacy` = AISALESHT monolítico):** ya construyó casi todo el motor comercial — brand-studio (marca completa + StyleAnalyzer), offer-studio (21 secciones · 84 presets · value ladder), **sales-agent** (LangGraph + 3 specialists + outbound orchestrator + compliance WABA/opt-in/blacklist), **CRM/CDP** (contacts+identities+events · lead scoring · NPS · referral · inactivity), **closer-studio = inbox omnicanal + pipeline kanban** (el inbox NO se inventa, ya existió acá — origen del de vitalia), growth-studio (ETL 12 providers + Bowtie), scheduling (Calendly-like + Google Cal), copilot (deep_agent + provider registry), connections (13 integraciones), campaigns (FSM + drip). **NO existía:** delivery/project-mgmt (cero), account-health compuesto, licitaciones/tenders, propuestas/contratos/firma, cold-email/LinkedIn dedicado.
- **Core (26 paquetes):** los maduros = sales-agent (0.0.7) · copilot (0.0.6) · campaigns (0.0.8) · extension-sdk (0.0.8 · EP-1..18). El resto skeleton-con-dominio-completo. **Gaps de engine:** delivery, account-health B2B, tenders, inbox-unificado, billing comercial.
- **Confirma tu decisión:** Sara = hub (NO project-mgmt) está bien — ni el legacy ni el engine tienen delivery; construirlo sería net-new costoso, por eso "futuro cercano".

**Mi lectura del objetivo de negocio + per-agente** la puse en el turno de chat. Te pasé el micrófono: **decime agente por agente qué esperás que haga por la persona que paga** (confirmá/corregí mi lectura). Sin eso NO sigo armando el sitemap. State queda en `refining`, esperando tu input por agente.

### 2026-06-02 · 👤 chris (expectativas por agente — verbatim resumido)
- **Abel:** estratega del CEO no-marketinero (tiene visión/dirección, no sabe de marketing); arma oferta + estructura marca; Abel sostiene la visión del dueño.
- **Brenda:** agencia de marketing B2B in-house. Vigencia en redes (LinkedIn), cuánto invertir para reuniones de valor, propone temas + **postea por él**, dos frentes (empresa + imagen personal), qué pega y qué no **con sustento (Apify)**, recomienda lo que REALMENTE funciona + alternativas. (+ encargo: research Meta/LinkedIn/TikTok/email).
- **Christian:** filtra reuniones (quién atiende: ejecutivo o el dueño), follow-up zero-leak, prospecta, **habla por él en LinkedIn**, alfil de batalla, **clona su voz** (cada cliente recupera la inversión).
- **Sara:** info de ERPs como dashboard **para que los OTROS agentes estén enterados** (no tanto para él).
- **Norvil:** CRM de clientes ACTUALES — cumpleaños, mensajes, correos, regalos, fidelización B2B.
- **Luana:** entiende intención, **nunca pierde el hilo**, hablando hace todo; **jamás propone sola, va con los especialistas**.
- Visión general: "buena, cumple lo que esperamos".

### 2026-06-02 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO + 💡 PROPONE (canales)
Capturé las 6 expectativas en **`02-agent-intent.md`** (ancla del sitemap v2 · a graduar a `vision.md § 1`). **3 reframes vs mi lectura/v1.1:** (1) **Sara = hub de contexto PARA LOS OTROS AGENTES** (no pantalla del dueño · capa de integración ERPs+Notion/Jira/Slack); (2) **Brenda ≫ pauta** = agencia B2B completa (orgánico LinkedIn + post-by-proxy + dos frentes + social listening Apify); (3) **Norvil = CRM de clientes actuales con fidelización** (cumpleaños/regalos/touches).

**Research de canales (encargo):** LinkedIn = #1 (80%+ leads B2B · agentes 2026 manejan ciclo completo de contenido + founder-led) · Meta = #2 demand-gen (atribución a pipeline + auto-pausa CAC -18-35%) · Email = sí pero personalizado/signal-based (61% decisores lo prefieren · $42 ROI/$1) · **TikTok = NO ahora** (coincido con tu duda; matiz: video founder-led orgánico a revisitar). **Insight estructural:** Brenda↔Christian ambos tocan LinkedIn + voz del fundador → la **"voz/autoridad del fundador" = capability compartida** (Brenda publica, Christian conversa 1:1).

4 open items (OI-A canales · OI-B límite Brenda/Christian + voz compartida · OI-C Sara como hub-para-agentes · OI-D Norvil con motor de fidelización o liviano) en `02-agent-intent.md`. Pendiente tu confirmación → recién ahí rearmo el sitemap.

### 2026-06-02 · 👤 chris
"OI-A va. OI-B sí, pero Christian responde mensajes inbox y también comentarios a las publicaciones cuando son a su nombre personal; si son de la marca sería Brenda (considero, tú propón). OI-C no nos compliquemos, Sara de momento es 'Próximamente'. OI-D liviano; veamos motor de fidelización bien pensado para B2B, algo útil y novedoso para agencias B2B pequeñas y medianas que no tienen grandes áreas de marketing."

### 2026-06-02 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO + 💡 PROPONE
Las 4 OIs resueltas en `02-agent-intent.md`:
- **OI-A** ✅ canales (LinkedIn#1·Meta#2·Email sí·TikTok no).
- **OI-B** ✅ + **regla de engagement propuesta** (la pediste): voz **personal** del fundador → Christian (DMs + comentarios en posts personales, como el fundador); voz de **marca** → Brenda (community de posts de empresa); **publicar siempre Brenda**. Mnemónico: *voz personal→Christian, voz marca→Brenda.*
- **OI-C** ✅ **Sara = "Próximamente"** (tab empty-state, fuera del roadmap R0-R4).
- **OI-D** ✅ Norvil liviano + **motor de fidelización propuesto** (research): "Customer Success que nunca olvida" — 5 pilares: cartera multi-stakeholder · **momentos-que-importan** (señales del cliente vía Apify) · **★ champion-shield** (contacto del cliente cambia de empresa → alerta churn + intro caliente en su nueva empresa · deals con champion previo = +114% win) · **QBR/value-proof automático** · gifting orquestado. Reusa infra (Brenda social-listening + CRM legacy + commercial-calendar); net-new = champion-tracking + QBR-gen + gifting.

**Intención de negocio COMPLETA.** Próximo: rearmo `01-sitemap.md` v2 anclado en `02-agent-intent.md` (no en SYSTEM-MAP v1.1) — pendiente tu nod a las dos propuestas (engagement + motor Norvil).

### 2026-06-02 · 👤 chris
"Dale, pero busca poner comentarios/detalles para que toda esta visión no se pierda. Veremos luego cómo lo volvemos SSoT de nuestra solución como parte de la visión de producto."

### 2026-06-02 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
**`01-sitemap.md` reescrito a v2** anclado en `02-agent-intent.md` — con la **intención embebida** en cada agente y hoja (callout "INTENCIÓN (Chris)" por agente + columna "qué haremos dentro + intención" por hoja) para que la visión NO se pierda (`preserve_intent: true`). Incluye § 0 **Principios transversales** (el "por qué" que atraviesa todo: CEO no-marketinero, cada cliente recupera la inversión, voz-fundador compartida, canales, separación de poderes, token economy). Flag `promote_to_vision: true` para graduarlo a `vision.md § 1` como SSoT cuando lo decidas.

Estructura v2: 3 zonas · Luana(chat/memoria/delegación/reportes) · Abel(+visión-dirección) · Brenda(agencia B2B completa: linkedin-presencia/social-listening/pauta/community/asesora) · Christian(9 hojas: outbound voz-clonada/inbox/lead-routing/follow-up/pipeline/agenda/propuestas/licitaciones) · Sara(Próximamente) · Norvil(cartera/salud/renovación + motor fidelización R5+) · capability compartida voz-fundador · Plataforma · Infra · roadmap R0-R5+ · deltas vs v1.1.

2 open items menores de nav: **OI-2** Christian 9 hojas → propongo N3-grouping {Cazar·Atender·Cerrar·Minería}; **OI-3** ¿Sara tab "Próximamente" visible desde R0 o oculta? Tu review del `01-sitemap.md` v2 + esos 2 → cemento `SYSTEM-MAP.yaml v2` + `shell-routes.ts` + releases.

---

### Turn — /pm-nicolify (2026-06-02 · ronda 2: feedback v2 → sitemap v3)

✓ **APLICADO** — Chris leyó el v2 y dio el **modelo de navegación de 4 niveles** (Agente → Área → Subárea N3 → Hoja · regla de colapso: área con 1 hoja ≡ hoja, con 2+ → N3 · ninguna hoja tiene tabs) + 5 bloques de feedback estructural. Hice research (packaging/value-ladder + lead-routing skill-based + contact enrichment) que **confirma** los tres puntos que pediste investigar. Reescribí `01-sitemap.md` **v3** + actualicé `02-agent-intent.md` (feedback verbatim + research embebido · `preserve_intent`).

**5 reworks aplicados:**
1. **Luana = CORE platform** (no nicolify-única) — chat/memoria/orquestación/reportes = capa conversacional compartida; se gradúa a capability core, no a `vision.md §1`. + principio "cada hoja en 2 modos: web a mano / agente por él".
2. **Abel** — +**ICP & buyer** (faltaba) · **Oferta** = catálogo & **escalera-de-valor/packaging** en tiers (research confirma: escalera = catálogo organizado) · **Marca** · "ángulos" → propiedad del ICP (no hoja suelta).
3. **Brenda** — **Contenido&Presencia** fusionados · **Inteligencia&Asesoría** fusionados (+ loop **replicar-adaptar** post) · **Pauta** · métricas reales a-la-mano en cada hoja + integraciones Meta/LinkedIn en **Config→Conexiones** (patrón vitalia).
4. **Christian** (re-propuesta a fondo) — 9 hojas planas → **6 áreas**: **Base-de-contactos** (CRM/import/propios + botón **investigar=enrichment**) · **Inbox** filtrable por canal (**sin pantalla de Secuencias**) · **Pipeline** absorbe lead-routing · +**Equipo-comercial** (skill-based, +30% win) · **Agenda** · **Propuestas**(+Licitaciones N3). Espíritu: agentes hacen la parte fea, dueño decide.
5. **Norvil** — **Cartera** master-detail **client-first**, **salud DENTRO del detalle del cliente** (patrón staff/doctores) · **Renovaciones** · **Fidelización** N3 (R5+). Orden = todo se entra por el cliente.

**5 confirmaciones abiertas** (§8 del sitemap, C1-C5) antes de cementar `SYSTEM-MAP.yaml v2` + `shell-routes.ts`. El OI-2 (Christian saturado) queda resuelto por el modelo de 4 niveles.

---

### Turn — /pm-nicolify (2026-06-02 · cementación SYSTEM-MAP v2.0)

✓ **APLICADO** — Chris ratificó ("me gusta esta propuesta" + "Si, todo"). C1-C5 tomadas como confirmadas. Cementado:

- **`nicolify/docs/architecture/SYSTEM-MAP.yaml` → v2.0** (desde v1.1): modelo nav 4 niveles (`nav_model` + `leaves[]` en functional_area) · Luana `surface: core` · Abel {icp·oferta[N3:catalogo-escalera+dossier]·marca} · Brenda {contenido-presencia·pauta·inteligencia-asesoria} · Christian {contactos·inbox·pipeline·equipo-comercial·agenda·propuestas[N3]} · **Sara → `deferred` "Próximamente"** · Norvil {cartera·renovaciones·fidelizacion[N3×4]} · infra +voz-fundador · cross_agent_flows actualizados (+ momento-cliente, entrega-en-riesgo→deferred) · data_ownership +FounderVoice/SalesExecutive/LoyaltyMoment.
- **Releases creados:** `R1.yaml` (Abel+Brenda) · `R2.yaml` (Christian) · `R3.yaml` (Norvil liviano) · `R4.yaml` (token economy) · `R5.yaml` (fidelización + Sara candidata reactivar). Cada uno con `areas[]` derivadas del SYSTEM-MAP.

⚠️ **Flag a Chris:** la decisión "Sara = Próximamente" (OI-C) **supersede ADR-nicolify-002 D-D** (Sara activa "Jefa de Proyectos / Mi Día" landing). Lo marqué en el map (`sara_status: deferred`) — pendiente enmendar el ADR.

**Pendiente (lo respondo en el mensaje):** (a) build thin del nav skeleton `shell-routes.ts` (es código → `/architect`→`/dev-team`); (b) actualizar el **shell-organism** con esta info — Chris preguntó si en esta misma story o cómo; (c) cerrar la story + graduar la intención a `vision.md §1`.

---

### 2026-06-03 · 🤖 claude · `/architect` · ✓ APLICADO

✓ **READY PACKAGE CERRADO** — thin nav-skeleton build (FE-only · `cap_change_type: extend` de `shell-organism.shell-nicolify`). Estudié la maquinaria del shell (Ribbon/SubTabsBar/SubSubTabsBar/`SubTabContent` dispatcher) y confirmé que es **100% data-driven desde `shell-routes.ts`** → el cambio es de DATOS, no de componentes. `state: refined → ready`.

**5 deliverables:**
- `03-arch.md` (+ `03-arch-fe.md`) — contrato FE · NO-NEW-LAYER (el SSoT `shell-routes.ts` ya existe → se EXTIENDE; sin engine/cross-brand mirror) · § Integration design (CONN) · cita ADR-nicolify-001 (`adr_001_compliance: partial-with-rationale` justificado por sección — es thin nav-data, no una hoja de contenido).
- `04-validators.yaml` — `verification.nature: functional` · runtime_error_gate (base.ts anti-burbuja) · 5 reglas de nav (RN-1..RN-5) → scenarios · regression_guard (maquinaria intacta) · playwright_visual_scope (rutas del árbol v3 · forbidden = maquinaria+engine).
- `05-guidelines.md` — patterns FE (SSoT shell-routes · guards whitelist · ruta N3 clon · reuso EmptyState · base.ts) + files in scope + must_load_skills.
- `06-tickets.yaml` — **2 tickets**, ambos `builder-frontend` (Sonnet) · **NINGUNO agentic**: **T-1** reescribe `shell-routes.ts` + `agent-catalog.ts` + content-map + **crea la ruta N3 que falta** + actualiza tests-de-datos · **T-2** e2e nav-walk del árbol completo + fixture anti-burbuja. assignment + forbidden_to_touch (maquinaria shell + engine + cross-brand) por ticket.
- `dispatch-plan.md` — `autonomous_mode: false` (Chris ratifica) + caps + matrix + DAG (T-1→T-2) + invocación.

**★ Hallazgo clave (cierra una isla):** hoy la ruta `[agent]/[subtab]/[subsubtab]/page.tsx` **NO existe** → los 8 leaves N3 (abel.oferta, christian.propuestas, norvil.fidelizacion) serían **404** al navegar (la `SubSubTabsBar` ya navega ahí). T-1 la crea → los 3 árboles N3 quedan navegables (CONN completo).

**OQ-1 (no bloquea):** decidí `AGENT_CATALOG.christian.defaultSubtab = "pipeline"` (coherencia con `DEFAULT_LANDING` ratificado + `test_shell_routes_ssot`). Si preferís que el click directo en Christian abra `contactos`, es 1 línea — recomiendo `pipeline`.
**OQ-2 (doc del PM):** enmendar `ADR-nicolify-002 D-D` (Sara "Mi Día"→"Próximamente") sigue pendiente — no bloquea esta build.

**Próximo:** `/dev-team nicolify nicolify-r0-sitemap-completo toma T-1`.

---

### Turn — /pm-nicolify (2026-06-02 · cierre PM loose ends + handoff autónomo)

✓ **APLICADO** — Cerré mis 2 doc-tasks pre-build + preparé el run autónomo para sesión nueva (Chris pidió "dev hasta done autónomo en nueva conversación, resolviendo todo"):

1. **ADR-nicolify-002 D-D enmendado** — Sara activa "Jefa de Proyectos/Mi Día" → **diferida "Próximamente"** (§ Amendment 2026-06-02). Landing post-login confirmado `christian/pipeline` (ya no Sara). Cross-flow `DeliveryAtRisk` → deferred.
2. **`vision.md §1` graduado** — la intención del dueño por agente (02-agent-intent) ahora es **SSoT durable** en la vision (sobrevive el archive de la story): tabla intención per-agente + voz-fundador compartida + canales + puntero a SYSTEM-MAP v2.0 como árbol canónico. Fila Sara marcada deferred.
3. **Checkpoint** → `autonomous_mode: true` + `demo_signoff_preauth` (APPROVED contingente a live-verify Chrome MCP GREEN · scope acotado a este thin nav-skeleton) + § Handoff con la cadena exacta dev→done.

**Próximo (vos):** abrís conversación nueva (contexto liviano ~100k vs 341k acá) y pegás el prompt de arranque. La cadena corre sola: `/dev-team` T-1→T-2 → `/auditor` → live-verify (Chrome MCP en localhost:3001) → `/pm-nicolify merge` → `done` + archive. Único corte humano posible: si live-verify falla, para y te reporta.

---

### 2026-06-03T00:00 · 🤖 claude · `/auditor` · ✓ APLICADO
Veredicto **APPROVED** (`developed → reviewing`). Story thin nav-skeleton v3, 2 tickets FE, cero agentic.

**Lo que corrí (independiente):**
- **gate-runner (Haiku)** → `gate-output.json` ALL GREEN: tsc 0 · `npx eslint src/` 0 errores (102 warnings PRE-EXISTENTES = baseline, FLAG #1) · vitest 131/131 · 0 imports engine/cross-brand.
- **auditor-frontend (Opus)** → `T-1-review.md` APPROVED ambos tickets · 16/16 categorías PASS. Verificado: el guard N2/N3 rechaza XSS/`../../`/`__proto__`/empty → `notFound()` (unit + route-enforced ANTES de render) · redirect N2-con-leaves→primer-leaf sin loop + leaf marcado activo · Spanish neutro tuteo limpio · `base.ts` anti-burbuja portado fiel de vitalia · scope D3 (solo empty-states).
- **Phase D** `06-audit/gherkin-matrix.md` → RN-1..RN-5 (5 reglas → 5 scenarios → 5 tests) **5/5 PASS, 0 MISSING**.
- **Live-verify (DoD #37)** contra localhost:3001 (stack real): nav-walk-v3 `--project=regression` **warm 33 passed / 0 flaky** + sara/proximamente aislado **x5 = 0 flaky**.

**1 hallazgo (NO bloquea):** en el **cold-run** (servidor recién levantado) `sara/proximamente` lanzó un pageerror `SyntaxError: Invalid or unexpected token` en el 1er intento → passed on retry (1 flaky / 32, exit 0). Lo caractericé: es el **chunk-load race de `next dev`** (compila la ruta on-demand → sirve un chunk JS parcial → SyntaxError; en warm desaparece). **Prod-immune** (`next build` sirve chunks pre-compilados) · 0 causa en código de producto (la hoja es data estática → `EmptyState`, sin `eval`/`import()` dinámico). WARN dev-artifact, no bug de la story. El `dod_evidence` original decía "0 pageerror" porque se grabó con el server warm.

**FLAGS confirmados (no son bugs de la story):** #1 `eslint_zero --max-warnings 0` sobre-spec vs gate real → /harness-issue · #5 validator `nav_walk_v3` dice `--project=smoke` (matchea 0 tests = falso verde), corrí `--project=regression` → /harness-issue · #2 los 2 archivos de maquinaria tocados (ChatComposer/ShellOrganismLayoutClient) = eslint PRE-EXISTENTES, Carril-A-equivalente, behavior-neutral, aceptado · #4 redirect cambia `03-arch §17` (lo ratificaste live) → el PM lo registra en 07-merge · #6 `docker-compose.dev.yml` NO se stagea.

→ AUTO-HANDOFF `/pm-nicolify merge`. `CHECKPOINTS.md` C1-C5 APPROVED. `demo_signoff_preauth: APPROVED` cumplido (live-verify GREEN + tu browse manual).

---

### 2026-06-03T00:05 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
**MERGE Fase F — `reviewing → done`.** Story cerrada.

- **07-merge.md** escrito (7 secciones): §1 gherkin 5/5 PASS · §2 Playwright (warm 33/0) · §3 cap extend · §4 modules (no existe shell-organism.md aún · cap YAML es el SSoT) · §5 how-to-verify · §6 DoD live tildado con `dod_evidence` real · §7 Amendment 03-arch §17 (redirect N2-con-leaves→primer-leaf, que ratificaste live).
- **Cap promotion:** `extend` `shell-organism.shell-nicolify.yaml` — change_log entry + scenarios **G1-G4** (árbol v3 · leaf N3 navegable · redirect §17 · Sara proximamente, todos con e2e_test → nav-walk-v3.spec.ts) + `dev_preview` ruta N3 + `nav_ssot` → shell-routes.ts.
- **R0.yaml** `stories[]` += `nicolify-r0-sitemap-completo` (done).
- **Archive:** `git mv` story → `nicolify/docs/archive/2026/stories/nicolify-r0-sitemap-completo/` (incluye este chris-input, HANDOFF, T-*, 06-audit/) en el mismo commit.
- **FLAGS:** #1 (`eslint_zero --max-warnings 0`) + #5 (`nav_walk_v3 --project=smoke` → falso verde) → registrados en `harness-backlog.md`. #6 `docker-compose.dev.yml` **NO stageado** (sigue uncommitted · vos decidís si lo hacés permanente aparte). #3 (dual-render suite-wide) = cleanup story separada.

**Estado del árbol cerrado:** Nicolify tiene su sitemap v3 completo navegable (3 zonas · 6 agentes · N2+N3 · empty-states) + roadmap R1-R5. Listo para ir **hoja por hoja** en R1+.

**Próximo (vos):** la integración a `main` (staging deploy) es un paso separado MANUAL (triple-branch) — no lo hice. Cuando quieras arrancar una hoja real → `/pm-nicolify` + elegir release R1.
