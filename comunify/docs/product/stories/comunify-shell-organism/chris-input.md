---
story_id: comunify-shell-organism
created_at: 2026-06-15T14:48:21-05:00
last_modified: 2026-06-15T15:10:00-05:00
notes_count: 0
refs_count: 4
conversation_count: 3
---

# chris-input.md · comunify-shell-organism

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Es la cocina de la story (la conversación) — separada del spec/design/arch (los outputs ratificados).

## 💭 Notas

### 2026-06-15 14:48
Sin notas todavía · Chris escribe aquí.

## 📎 Referencias

- **🔗 doc** · `core/@luana/ui-kit/src/organism/shell` — shell chrome compartido a consumir
- **📖 story-ref** · `nicolify/frontend/src/app/[tenantId]/(shell-organism)/` — referencia de port (re-skin)
- **📄 doc** · `comunify/docs/architecture/design-system.md` — tokens visuales comunify (SSoT)
- **📄 doc** · `.claude/rules/paradigm-arquitectura.md` + `docs/architecture/luana-platform/PARADIGM.md` — 3 planos / mapa 3 zonas

## 💬 Conversación

### 2026-06-15 14:48 · 🤖 claude · `/pm-luana`→`/pm-comunify` · ✓ APLICADO
**Pedido de Chris (verbatim):** "traer de main todo... el proceso /pm-luana coordina con /pm-nicolify para asegurarte que ahora comunify tiene toda la nueva base metodológica y de UI al día para revisar qué es lo que hemos hecho mal y debemos corregir para estar alineados empezando con tener el shell organism levantado."

**Hecho:**
1. **Sync con main** ✓ — `scripts/git/sync-from-main.sh`; wip/comunify quedó 0 detrás / 35 adelante de origin/main (HEAD `7501136e`). Trajo trabajo vitalia + nueva base de harness/metodología (tier-routing CLAUDE.md, learning lifecycle, parallel-safety M15, cockpit→binario alpaca, paradigm v5).
2. **Coordinación cross-brand** (/pm-luana; /pm-nicolify NO se corre desde worktree comunify por Step 0 — se leyó su SSoT). Diagnóstico: comunify es la única brand activa en dashboard viejo; nunca migró al shell-organism; consume cero `@luana/*`; sin cast de agentes; drift de lockfiles.
3. **Story creada** `comunify-shell-organism` (state=idea) de esta conversación.

**Decisiones ratificadas por Chris (AskUserQuestion):**
- **Path:** Historia SDD completa (refine→arch→build→audit→DoD live-verify).
- **Drift cleanup:** ahora → Ticket-0 hygiene (lockfiles align-a-vitalia + track next-env + deps @luana/* con install-verify, NO blind-delete).
- **Cast:** comunify-específico (personas propias, NO cast canónico Luana).
- **Scope:** MVP shell + features stub (10 áreas dashboard se portan en stories siguientes).

**Stories abiertas que NO bloquean (FYI):** `nicolify-r1-abel-icp-buyer` (nicolify, reviewing), `cockpit-go-process-coverage` (platform, developing).

💡 **PROPONE — cast comunify (a ratificar/renombrar por Chris):** el shell-organism es un Ribbon de especialistas + supervisora. Propuesta inicial mapeada a la cadena de valor creator economy (Luana orquestadora + Valeria supervisora se mantienen — canónicas platform-wide; los **especialistas** son los comunify-específicos):

| Rol (cadena de valor) | Persona propuesta | Dominio comunify | Color (tokens design-system) |
|---|---|---|---|
| Orquestadora (sidebar) | **Luana** | ruteo / supervisión global | marca |
| Supervisora | **Valeria** | coordina especialistas | — |
| Base / Setup | **Nina** (= Lisa) | perfil creator, identidad, onboarding | azul `#2D7FF9` |
| Atraer | **Tomás** (= Lucas) | audiencia + contenido + authority vault | morado `#7B2FF7` |
| Vender | **Sofía** (= Adrián) | cohorts + offer ladder + discovery calls | coral |
| Operar | **Bruno** (= Mateo) | comunidad + moderación + entrega cohort | verde |
| Retener | **Lucía** (= Camila) | suscripciones + dunning + churn | azul-deep `#1246D6` |

Nombres = placeholders; renombralos libremente. Una vez ratificado → escribo `ADR-comunify-NNN-agentes-cast` + catálogo, y recién ahí encadeno `/po-ux` (la UX del shell necesita el cast para el Ribbon fiel).

⚠️ **DUDA / próximo input de Chris:** (a) ¿ratificás/renombrás el cast de arriba?  (b) ¿avatares — Chris los provee como en nicolify/vitalia, o placeholders SVG?

### 2026-06-15 15:10 · 👤 chris
Comentarios sobre el cast:
1. Orquestadora y supervisora son lo mismo en las demás marcas y aquí también debería ser (a menos que haya razón técnica). También debería encargarse del onboarding.
2. Nina = estratega (como Lisa en Vitalia): setea el perfil del creator, ayuda a crear el offer ladder, armar cohorts. Todo lo relacionado a marca y producto.
3. Tomás = toma lo de Nina y lo promociona orgánico + paid. Equipo de marketing/publicidad digital. Setter combinado con growth marketing.
4. Sofía = vendedora estrella, atiende todos los canales de venta, closer que vende y recupera leads.
5. Bruno = día a día / operación (rol no del todo claro aún).
6. Lucía = fidelización: mantiene el CRM al día con acciones digitales para que cada cliente se sienta valorado.
Revisar cómo funciona en vitalia y nicolify y actualizar.

### 2026-06-15 15:10 · 🤖 claude · `/pm-comunify` · ✓ APLICADO
Revisé vitalia + nicolify. Hallazgos:
- **Punto 1 CONFIRMADO:** orquestadora == supervisora en AMBAS (una entidad, sidebar, fuera del Ribbon, runtime en zona Infraestructura·motor-agentico). Sin razón técnica para separarlas → unificadas. PERO el nombre diverge: vitalia=**Valeria**, nicolify=**Luana**. PARADIGM.md (SSoT) = "supervisora Valeria". **Recomiendo Valeria** para alinear.
- **Onboarding:** en ambas marcas vive en el tab **Plataforma** (zona acceso·onboarding·config), no como agente. Tu pedido calza: la supervisora es la **cara que guía** el onboarding; el surface vive en Plataforma. Nina hace perfil/marca/producto ongoing.
- **Tu mapping calza 1:1 con la cadena de valor canónica:** Nina=Estratega(=Lisa/Abel) · Tomás=Atraer(=Lucas/Brenda) · Sofía=Vender(=Adrián/Christian) · Bruno=Operar(=Mateo/Sara) · Lucía=Retener(=Camila/Norvil).

**Cast comunify corregido (ratificado salvo nombre supervisora):**

| Rol | Persona | = canónico | Dominio comunify |
|---|---|---|---|
| Supervisora+orquestadora+onboarding (sidebar) | **Valeria** (rec.) | Valeria/Luana | ruteo + supervisión + guía onboarding |
| Estratega (marca+producto) | **Nina** | Lisa/Abel | perfil creator + offer ladder + cohorts + brand-studio |
| Atraer (marketing org+paid) | **Tomás** | Lucas/Brenda | promueve lo de Nina, orgánico + paid, setter+growth |
| Vender (closer) | **Sofía** | Adrián/Christian | todos los canales de venta + recupera leads |
| Operar (día a día) | **Bruno** | Mateo/Sara | comunidad + moderación + cohort delivery (scope a confirmar) |
| Retener (fidelización) | **Lucía** | Camila/Norvil | CRM + dunning + subscripciones + fidelización digital |
| tab Plataforma | — | Plataforma/Config | acceso · onboarding · configuración |

⚠️ **DUDA abierta (cement-bound):** ¿nombre de la supervisora = **Valeria** (canónico SSoT + vitalia) o **Luana** (como nicolify)? En cuanto cierres → escribo `ADR-comunify-NNN-agentes-cast` + catálogo + encadeno `/po-ux`.
💡 **PROPONE:** avatares = placeholders SVG por ahora (como nicolify/vitalia), reemplazo 1:1 cuando los tengas.

### 2026-06-15 15:18 · 👤 chris
Supervisora = **Luana** (como nicolify).

### 2026-06-15 15:25 · 🤖 claude · `/po-ux` · 💡 PROPONE (prior-art + 1ª pregunta funcional)
**Prior-art scan (gate):** `@luana/ui-kit/organism/shell` trae el toolkit completo del shell (ShellLayout · Ribbon/RibbonTab · SupervisorSidebar · ChatPanel · ConfigTab · SubTabsBar · SubSubTabsBar · create-shell-store · routing.ts · keyboard shortcuts). nicolify + vitalia ya lo consumen vía wrapper fino en `app/[tenantId]/(shell-organism)`. comunify = port idéntico (wrapper marca + config), NO rebuild. `design-system-canon.md` existe (gate). Net-new comunify: config del shell (cast/colores/nav-tree) + reskin tokens.

**1ª pregunta funcional (migración):** ¿qué pasa con las 10 áreas dashboard durante la transición?
→ **Chris: (b) reemplazo.** El shell reemplaza el dashboard viejo; portamos cada área conforme avanzamos. Post-login aterriza en `[tenantId]/(shell-organism)`; el grupo `(dashboard)` se retira del routing (queda en git, no reachable). Las tabs de agente arrancan placeholder ("Próximamente") hasta portarse.

**2ª pregunta funcional (landing + estado MVP):** con reemplazo + tabs placeholder, ¿dónde aterriza el creator post-login y qué ve útil?
→ **Chris: (a) Luana viva.** El chat orquestador funciona de verdad en el MVP (saluda, entiende intención, delega-anuncia "eso lo hará Nina/Sofía… próximamente"). Da write real para DoD #37 (mensaje → respuesta → traza `copilot_trace_event`). Tabs de agente = "Próximamente".
→ "Landing" Chris no lo conocía; aclarado = pantalla/estado inicial post-login. **Chris CONFIRMÓ:** Luana expandida (saluda) + Ribbon con Nina activa en "Próximamente".

**3ª pregunta funcional (rol/quién usa):** ¿quién entra al shell — solo el creator dueño, o también equipo/multi-usuario?
→ **Chris: solo el creator.** En esta marca SOLO lo usa una persona = el creator. Sin role-gating, nunca (dato durable: comunify = single-user brand). Coherente con `multi_account_creator_switcher: false`.

**4ª pregunta funcional (acotar "Luana viva"):** ¿hasta dónde llega Luana en el MVP?
→ **Chris: (a) conversa + anuncia.** LLM real + traza real; entiende intención; tareas concretas → "lo hará Nina/Sofía… próximamente". NO ejecuta acciones ni lee datos del tenant todavía. Write real para DoD (#37).
→ **Chris (estratégico):** esto se replica en nicolify+vitalia. ¿Build-order? "Investigá primero qué conviene, vos decidís."

**INVESTIGACIÓN cross-brand (Explore) — resultado:**
- `core/luana-core-copilot` = supervisor chat engine **LIVE production-grade** (`POST /chat` SSE, deep-agent, observabilidad+cost). El motor YA EXISTE.
- vitalia (Valeria): UI shell shipped pero **chat-store MOCK** (`MOCK_RESPONSES_BY_AGENT`); solo el wizard onboarding consume copilot real. Sidebar NO cableado.
- nicolify (Luana): **100% MOCK**, sin router copilot montado.
- comunify: ausente. `@luana/ui-kit ChatPanel` = presentacional (`useChatStore` inyectado por marca).
- **Conclusión:** "Luana viva de verdad" es net-new en TODAS (ninguna tiene el sidebar cableado al motor). No hay marca "más avanzada" en esto específico.

**DECISIÓN (Claude, ratificable por Chris) — comunify-FIRST + consumir motor + liftear cableado:**
- comunify **consume** `core/luana-core-copilot /chat` (cero engine build).
- BE comunify: montar router copilot core en `/api/v1/comunify/copilot` (thin).
- FE comunify: `chat-store` real (SSE) → inyecta a `@luana/ui-kit ChatPanel`. System prompt supervisora = conversa+anuncia; **sin tools de dominio → no ejecuta** (= acota "(a)").
- **comunify-first** porque: motor ya compartido/listo · comunify = lienzo limpio (sin mock legacy) · ya construimos su shell ahora.
- `chat-store` real = **lift candidate → `@luana`**; después vitalia/nicolify cambian mock→compartido (follow-up). Coordina `/pm-luana` (promotion proposal) post-prueba.

**5ª pregunta funcional (onboarding / tab Plataforma):** ¿qué hacemos con el wizard onboarding 4-step en el MVP?
→ **Chris: (a)** wizard intacto, fuera de scope (sigue como flujo pre-shell). Tab Plataforma = mínimo. Integración Luana↔onboarding = story futura.

### 2026-06-15 15:40 · 🤖 claude · `/po-ux` · 💡 PROPONE (RONDA 1 lista — FIRMA 1)
Escrito `01-spec.md` RONDA 1 (funcional, SIN mockup): § Context/Dónde vive + § Mapa funcional (happy path + árbol bifurcaciones + RN-1..7 + AC-1..8) + § Pantallas (tabla campos) + § Dudas (Q1-Q3) + § Prior art applied. Refleja las 5 decisiones. **Esperando FIRMA 1.**

### 2026-06-15 15:48 · 👤 chris
"dale, esto es lo que quiero" (= **FIRMA 1**). + Q1/Q2/Q3 = recomendaciones. + pidió: recomendar un "sitemap" (sub-tabs por agente) como se hizo en nicolify.

### 2026-06-15 15:48 · 🤖 claude · `/po-ux` · ✓ APLICADO (FIRMA 1) + 💡 PROPONE (sitemap)
- **FIRMA 1 registrada** (`input_spec_signed: true` en spec + checkpoint). Q1=placeholders SVG · Q2=Plataforma link-a-existente · Q3=saludo genérico.
- **Sitemap recomendado** escrito en `navigation-tree.md` (formato nicolify): N1 Ribbon (Nina/Tomás/Sofía/Bruno/Lucía + Plataforma) + N2 sub-tabs por agente (✱ existe → port · △ net-new) + N3 candidatos. Nina(marca/voz/autoridad/ofertas/escalera/cohorts) · Tomás(contenido/pauta/audiencia) · Sofía(conversaciones/pipeline/recuperación) · Bruno(comunidad/moderación/cohorts-en-curso) · Lucía(suscripciones/clientes/fidelización) · Plataforma(conexiones/cuenta/plan/onboarding).
- **Decisiones abiertas del sitemap (Chris ratifica):** voz+autoridad → Nina o Tomás · cohorts split (diseño Nina / delivery Bruno) sí-o-no · nombres pulibles. → esperando a Chris. Tras ratificar → mockup creativo → FIRMA 2.

### 2026-06-15 16:00 · 👤 chris (idea nueva → sitemap)
Quiere: un lugar donde el creator ponga sus influencers de referencia → recomendar similares; vía **Apify** hacer scraping de tendencias del nicho + "qué está funcionando" → el creator elige/idea → ayudarlo a afinar el contenido de la semana. Proceso no claro aún. Pregunta: ¿dónde iría?

### 2026-06-15 16:00 · 🤖 claude · `/po-ux` · ✓ APLICADO (ubicación) + 💡 PROPONE
**Ubicación: Tomás (Atraer) → sub-tab nueva `referentes`** (referentes + recomendados + tendencias Apify → ideas → afina contenido; alimenta `contenido`). 3 dimensiones: UI en Tomás · integración Apify en Plataforma›conexiones + `core/luana-core-connections` · motor de recomendación backend. **Prior-art:** skill `content-hunter` (caza de referencias virales + swipe files + STEPPS) = esta sub-tab es su hogar UI. **NO es shell MVP** → story futura `comunify-tomas-referentes`; en MVP = "Próximamente". Agregado a `navigation-tree.md` (Tomás.referentes + Apify en conexiones). Proceso fino = en esa story.

### 2026-06-15 16:20 · 👤 chris
Antes de confirmar el sitemap: dale una última revisión vos mismo (juntar / falta / sobra), buscá en internet lo último en estos temas, y dame una alternativa final de sitemap.

### 2026-06-15 16:20 · 🤖 claude · `/po-ux` · 💡 PROPONE (sitemap v2 research-informed)
**Research (WebSearch 2026):** creator economy → interactivo (cohorts/comunidad) > curso estático (Skool/Maven ganan) · agentes IA por etapa (research/contenido/campañas/analytics) + research-agent escanea tendencias diario · funnel retención = post-compra+loyalty+LTV+email ciclo. **Autocrítica + v2 en `navigation-tree.md`:** Nina 6→3 (voz+autoridad→N3 marca; escalera→N3 ofertas) · Bruno `cohorts-en-curso`→`eventos` (delivery) · Tomás `audiencia` incluye email/nurture · Plataforma 4→3 (plan→N3 cuenta) · **analytics + email = transversales, NO tabs** (Luana digest + per-agent KPIs; email donde se usa). Resuelve las 3 decisiones abiertas: voz+autoridad=Nina · cohorts no-split (diseño Nina / delivery Bruno-eventos) · nombres pulidos. **Esperando que Chris elija: v2 / mezcla / ajustes** → luego mockup → FIRMA 2.

### 2026-06-15 16:30 · 👤 chris
"dale, va con v2, armá el mockup".

### 2026-06-15 16:30 · 🤖 claude · `/po-ux` · ✓ APLICADO (sitemap v2 ratificado) + 💡 PROPONE (mockup)
v2 ratificado. **Mockup creativo** escrito `mockups/shell.html` (port re-temizado del shell canónico, tokens comunify morado/azul, fuentes Manrope/Inter): TopBar (logo comunify + tenant single-user Anabella Ríos) · **Luana sidebar full** (landing) con saludo + ejemplo conversa+anuncia (DelegateMarker → Nina) + composer + starters · **Ribbon** 6 tabs con agent-colors (Nina activa) · **SubTabsBar** Nina (Marca/Ofertas/Cohorts) · contenido = **empty-state "Próximamente"** con CTA "Hablar con Luana". Servido en `localhost:8893/shell.html`. **Esperando feedback/iteración → FIRMA 2** (la final). Pendiente: avatares (placeholders), Satoshi (self-host real en build).

### 2026-06-15 16:50 · 👤 chris (feedback mockup)
1. Avatares: usar imágenes generadas con IA por agente como thumbnail de cada tab + Luana en su lugar.
2. Usar colores Comunify + logos.
3. Ribbon: en lugar del nombre del agente, la **función** ("Mi Marca", "Atraer", "Vender", etc.) tal como vitalia/nicolify.
4. No funciona modo nocturno + clicks no navegables (OK si es mockup, pero tomar el resto).

### 2026-06-15 16:50 · 🤖 claude · `/po-ux` · ✓ APLICADO (mockup v2)
- **Avatares generados** (DiceBear `personas`, seed por agente + ring de color) como thumbnail en Ribbon + Luana sidebar + tenant. ⚠️ son placeholders procedurales (NO tengo generador de difusión nativo) — se reemplazan por retratos IA reales cuando Chris los dé.
- **Logo comunify** = isotipo gradiente (signature `--comunify-gradient`) + wordmark "comunify" (comunify no tiene archivo de logo; el logo ES wordmark+gradiente per design-system).
- **Ribbon labels = función:** Mi Marca · Atraer · Vender · Operar · Retener · Plataforma (verificado: nicolify usa función "Estrategia/Growth/Ventas"). Nombre del agente → en el avatar/tooltip.
- **Modo nocturno funcional** (toggle `.dark` + tokens dark) + **tabs clickeables** (Ribbon + SubTabsBar navegan el sitemap v2 completo, contenido "Próximamente" por hoja). Sigue siendo mockup (sin datos/routing reales — eso es dev-team).
- Chrome MCP no pudo screenshot (SingletonLock otra sesión, HB-73). Chris abre `localhost:8893/shell.html`. **Esperando FIRMA 2.**

### 2026-06-15 17:05 · 👤 chris (feedback mockup)
Coherencia total: si la base es Fully Rounded (pill), que TODO sea pill — textbox, dropdowns, etc.

### 2026-06-15 17:05 · 🤖 claude · `/po-ux` · ✓ APLICADO + ⚠️ DUDA (design-system)
**Hallazgo:** el design-system comunify documenta `--radius: 0.75rem (12px)` para "botones/inputs/cards — premium pero no agresivo". La base **documentada NO es pill**; lo pill eran chips/avatares. El pedido cambia la base.
**Aplicado al mockup:** todos los **controles** → full-pill (botones, icon-buttons→círculos, Ribbon tabs, sub-tabs, composer, send, CTA, logo→círculo). Cards + burbujas de chat conservan su radio (pill en card se ve mal). Ribbon activo: subrayado → ring (mejor en pill). Audit: 18 full-pill / 3 rounded-2xl (solo burbujas).
⚠️ **Implicación de design-system (a cementar en build/architect):** cambiar `--radius` de comunify a pill para controles + **verificar que `@luana/ui-kit` honre el token de radio de la marca** (si no, comunify divergiría del kit compartido → riesgo anti-duplication). El architect lo resuelve en 03-arch (token-driven, no override per-componente). **Esperando FIRMA 2.**

### 2026-06-15 17:30 · 👤 chris
"firmo todo" (= **FIRMA 2**, la final). + ajustes mínimos: header Luana misma altura que Ribbon · línea blanca en dark se ve mal · subtabs con fondo de shell (no hoja) · logos reales (claro/oscuro/icono/ico, paths en Descargas). + Continuar en conversación NUEVA. + No olvidar dar todos los tokens/átomos/moléculas que se guardarán en código (mockups + goldens dev-team).

### 2026-06-15 17:30 · 🤖 claude · `/po-ux` · ✓ APLICADO (FIRMA 2 + cierre)
- **Ajustes mínimos:** header Luana h-16 (alinea Ribbon) · bordes vía token (fix dark) · subtabs bg panel (shell) · **logos reales Comunify** (isotipo TopBar + favicon; full claro/oscuro → `comunify/frontend/public/brand/` + `mockups/assets/`).
- **FIRMA 2 registrada** (`mockup_final_signed: true` en spec + checkpoint). Refinamiento de diseño COMPLETO.
- **`design-inventory.md` escrito** (lo que Chris pidió): tokens comunify (color/radius-pill/fonts/gradient/logos) + átomos/moléculas/organismos a CONSUMIR de `@luana/ui-kit` + lo único net-new comunify + **goldens dev-team** (mockup final + tokens + cast + sitemap + @luana kit + decisiones funcionales).
- **Cierre a conversación NUEVA.** Pendiente allí: generar RONDA 2 (Gherkin+matriz+estados+microcopy) → `refining→refined` → `/architect` ready package. Detalle en `checkpoint.md § Next action`.

---

### 2026-06-15 15:18 · 🤖 claude · `/pm-comunify` · ✓ APLICADO
Cast cementado en **`ADR-comunify-001-agentes-cast.md`** (status accepted):
- Sidebar: **Luana** (supervisora+orquestadora+onboarding).
- Ribbon: **Nina** (estratega) · **Tomás** (atraer) · **Sofía** (vender) · **Bruno** (operar) · **Lucía** (retener) + tab **Plataforma**.
- Colores mapeados a tokens comunify existentes (no hardcode); avatares = placeholders SVG.

Story `comunify-shell-organism` pasó **idea → refining** (`cast_ratified: true`). next_handoff `/po-ux`
(diseña el shell: consume `@luana/ui-kit` organism/shell, Ribbon del cast, sidebar Luana, nav 3 zonas,
Config; port re-temizado de vitalia/nicolify). Pendientes paralelos del flujo: skill
`comunify-design-system` + SHELL-DESIGN-CONTRACT comunify.

---

### 2026-06-15 (conversación nueva) · 🤖 claude · `/po-ux` · ✓ APLICADO (RONDA 2 generada + refining→refined)
**Generada la RONDA 2** en `01-spec.md` a partir del § Mapa funcional firmado (FIRMA 1) + el mockup FINAL (FIRMA 2):
- **§ Gherkin** — 4 base (happy `SC-happy`/`SC-chat-ok` · negative `SC-chat-error` · edge `SC-luana-states`/`SC-chat-delegate` · adversarial `SC-adversarial-tenant`) + sub-categorías mandatory: race (`SC-chat-double-send`) · network (`SC-chat-network`) · empty (`SC-tab-placeholder`/`SC-luana-history-empty`) · a11y (`SC-a11y`) · i18n (`SC-i18n`) + `SC-auth`/`SC-plataforma-min`/`SC-dashboard-unreachable`. Cada SC con `playwright_required` + graders + verificación REAL (el write del DoD = fila en `copilot_trace_event` en `SC-chat-ok`).
- **§ Matriz de cobertura** — cada `Bif-N`/`RN-1..7`/`AC-1..8` → ≥1 SC. **Huecos: ninguno · SC huérfanos: ninguno.**
- **§ Estados visuales** (Luana full/rail/history/streaming/error/network/empty · Ribbon · panel placeholder), **§ Componentes** (reuse del kit > new; `chat-store` = único net-new sustantivo + lift candidate), **§ Microcopy** (goldens del mockup, neutro), Responsive, Accessibility, Telemetría.
- **Gate /po-ux Step 5 PASS** → transition **`refining → refined`** (checkpoint + spec frontmatter `state: refined`, `ronda: 2`, `ratified_by_chris: true`).

⚠️ **DUDA (N/A propuesto):** `concurrent_users` (comunify = single-user brand RN-1 + MVP sin list/detail filtrable; el eje multi-tenant lo cubre `SC-adversarial-tenant`) y `large_dataset` (MVP sin list paginada) los marqué **no aplicables**. Si querés que sean SC reales, decímelo; si no, quedan N/A.

💡 **PROPONE:** encadeno `/architect comunify comunify-shell-organism` (ready package: 03-arch + 04-validators + 05-guidelines + 06-tickets, con T-0 higiene + mount copilot + radius-pill token + routing + lift-candidate chat-store).

---

### 2026-06-16 · 🤖 claude · `/architect` · ✓ APLICADO (ready package cerrado · refined→ready)

**READY PACKAGE completo** — `03-arch.md` (+ `03-arch-fe.md` · `03-arch-agentic.md`) + `04-validators.yaml` + `05-guidelines.md` + `06-tickets.yaml` + `dispatch-plan.md`. Story `refined → ready`, `phase: READY_PACKAGE_CLOSED`. Next handoff: `/dev-team comunify T-0`.

**6 tickets (DAG):** T-0 hygiene (config, blocks FE) → **T-agentic** (BE mount · **flagship R23 HARD**, builder-agentic) ∥ T-tokens → T-shell ∥ T-chat-store → T-e2e (DoD #37). Surface→builder→auditor declarado: AGENTIC = builder-agentic/auditor-agentic (flagship) · FE = builder-frontend/auditor-frontend.

**Cómo resolví los 5 puntos:**
1. **T-0 hygiene** — borrar lockfiles redundantes (root `pnpm-lock.yaml` SSoT) + trackear `next-env.d.ts` + declarar `@luana/*` deps; gate = `pnpm install` verde (no blind-delete).
2. **Consume kit, cero mirror** — `@luana/ui-kit@0.4.1` (verificado: 35 archivos + `index.ts`). Gate Cat 12 en validators (grep: cero organismos del kit copiados en comunify; cero import de nicolify).
3. **Mount copilot** — thin `include_router` del engine `/chat` en `/api/v1/comunify/copilot` + deps `luana-core-{copilot,iam,platform}`. **comunify es el 1er brand en cablear el sidebar→engine** (vitalia solo monta el wizard, no `/chat`). RN-3 (Luana no ejecuta) sale **gratis por construcción**: el `copilot/` de comunify NO tiene `tools/` de dominio. El chat-store SSE real FE es el único net-new sustantivo. DoD #37 write = SC-chat-ok (mensaje → SSE → fila `copilot_trace_event` scoped al tenant).

💡 **DECISIÓN RADIUS-TOKEN que necesito que mires (Chris):** resolví el pill **token-driven sin tocar el kit**. El kit `@luana/ui-kit` ya pinta los **controles del shell** como pill por **clase literal `rounded-full`** (verificado en tu `mockups/shell.html`: TopBar buttons, composer, ribbon tabs, chips); las burbujas/cards usan `rounded-2xl`/`rounded-lg`. O sea: el pill NO depende de `--radius`. Por eso comunify **mantiene `--radius: 0.75rem`** (cards/inputs genéricos) + `--radius-lg: 1.25rem` (cards/burbujas) y **NO hay `/pm-luana` kit-fix por radius**. Solo si en build aparece un control del shell que lee `--radius` (no `rounded-full`) y se ve cuadrado → eso sería un divergence flag = `/pm-luana` kit-token-fix proposal (NO se parchea per-componente en comunify; rompería el token-driven). **Mi recomendación: dale, así está bien (cero cambio de kit).**

💡 **LIFT CANDIDATE — chat-store (Chris):** el `chat-store.ts` SSE real que construye comunify es el primer chat-store funcional del portfolio (nicolify/vitalia tienen MOCKS con `setTimeout`). Lo construyo **brand-local en comunify** y lo dejo **marcado como lift candidate → `@luana`**. El lift NO se ejecuta en esta story — es una **`/pm-luana` promotion proposal POST-prueba** (cuando comunify lo valide live, vitalia/nicolify reemplazan sus mocks por este). ¿OK que quede así (no lift ahora)?

**Open questions (no bloquean):**
- **OQ-1 (footgun visual):** el `tailwind.config.ts` de comunify DEBE incluir el path del kit en su `content`/`@source` scan o el shell pierde estilos silenciosamente (memoria `tailwind-jit-scan-breaks-on-lift`; nicolify ya lo resolvió). Cableado como gate en T-tokens (visual e2e, no tsc).
- **OQ-2:** ADR de arquitectura shell comunify diferido — esta story es el **origen** del patrón (como `nicolify-r0-shell-organism`), no se aplica el gate a sí misma. El ADR se crea al portar la 1ª área real (R-shell+1).
- **OQ-3:** skill `comunify-design-system` NO existe (nicolify/vitalia lo tienen) → follow-up `/pm-comunify`. Mientras, los goldens = `design-system.md` + `design-inventory.md` + `mockup`.
- **dev-app:** binding tenant comunify 🟡 (Clerk-level ok, tenant seed pendiente) — si falta para el write live SC-chat-ok, se firma en G (gate manual).

✅ **N/A confirmado:** `concurrent_users` + `large_dataset` (single-user brand + MVP sin list paginada) — honrado en 04-validators (no inventados).
