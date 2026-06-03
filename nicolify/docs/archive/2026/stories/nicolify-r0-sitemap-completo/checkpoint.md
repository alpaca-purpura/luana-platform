---
story_id: nicolify-r0-sitemap-completo
brand: nicolify
type: design-story                  # planning + thin build del esqueleto de menú — NO diseña ni construye hojas
state: done                         # idea→refining→refined 2026-06-02 → ready → developing → developed → reviewing → done 2026-06-03 (/pm-nicolify merge · 07-merge.md · cap extend G1-G4 · archive)
release: R0                          # cierre de la Fundación: completa el árbol + nav skeleton + ruta de desarrollo
map_zone: infraestructura            # paradigma 3 zonas (ADR-nicolify-002) · meta-story del shell-organism (contenedor del menú)
map_box: plataforma-tecnica
module: shell-organism              # bucket code:shell-organism (build-claim · cockpit pinta 🔨)
phase: MERGED_DONE
last_modified: 2026-06-03
phase_detail: DONE  # /pm-nicolify merge aplicado: 07-merge.md (7 secciones · DoD live tildado + §17 amendment) · cap extend shell-organism.shell-nicolify (change_log + G1-G4 + dev_preview N3) · R0.yaml stories[] += story · git mv → archive/2026/stories/. FLAG #1/#5 → harness-backlog. docker-compose NO stageado.
last_artifact: 07-merge.md
gherkin_matrix: 06-audit/gherkin-matrix.md
audit_verdict: APPROVED               # /auditor 2026-06-03 · auditor-frontend sub-auditor · 0 FAIL · 0 blocking WARN · 1 dev-mode artifact documentado (flaky sara/proximamente = next-dev cold-compile chunk race · prod-immune · warm re-run 33/0 + sara x5 0/flaky)
t2_status: GREEN                    # e2e nav-walk-v3 31 + empty-states 28 + ribbon-nav 4 + deeplink 3 + avatar 3 GREEN contra localhost:3001 · gate anti-burbuja activo (0 pageerror/console-error/hydration/api-4xx/Next-overlay)
redirect_change_note: >
  CAMBIO ratificado por Chris en live-verify (cambia 03-arch §17): un N2 con hojas N3 (abel/oferta,
  christian/propuestas, norvil/fidelizacion) hace redirect server-side al primer leaf → no muestra
  empty-state vacío. Commit b94c9ec6. [subtab]/page.tsx editado (era forbidden_to_touch · override Chris).
dod_live_verified: true
dod_env: "make dev-nicolify + make dev-nicolify-tunnel → localhost:3001 (stack interactivo real) + https://dev-app.nicolify.com (túnel, mismo código). Playwright autenticado (regression project) + Chris browse manual."
dod_evidence:
  - action: "Recorrer TODO el árbol v3 (20 N2 + 8 N3) autenticado contra localhost:3001 (nav-walk-v3.spec.ts, regression project)"
    observed: "61 passed · cada hoja: subtab-content + empty-state visibles · gate anti-burbuja base.ts: 0 pageerror, 0 console-error (allowlist), 0 hydration, 0 /api 4xx-5xx, 0 nextjs-error-overlay"
  - action: "N2 con hojas → redirect al primer leaf (abel/oferta→catalogo-escalera, christian/propuestas→propuestas, norvil/fidelizacion→momentos)"
    observed: "redirect server-side 307 · leaf marcado activo (SubSubTab URL-derived) · 55 passed post-fix"
  - action: "dev-app.nicolify.com público vía Cloudflare tunnel (Error 1033 resuelto · connector UP)"
    observed: "/ → 307 (Clerk sign-in), /api/health → 200, /{tenant}/{agent}/{subtab} → 307 auth · Chris browse manual con https → aprobó ('luego del fix del redirect, todo se ve bien')"
  verified_at: 2026-06-03
  caveat: "Live-verify automatizado contra dev-app (vía túnel) impráctico en dev mode (page.goto 45s+ por compile-por-ruta a través del edge). El nav-walk GREEN corrió contra localhost:3001 (código idéntico al que sirve el túnel). Chris hizo el recorrido visual manual en dev-app."
t1_status: GREEN                    # tsc 0 · eslint src/ exit 0 (0 errors) · vitest 131/131 · boundary clean
t1_eslint_validator_note: >
  Hallazgo: el validator 04-validators `eslint_zero` (`eslint src/ --max-warnings 0`) está SOBRE-especificado
  vs el gate real enforced (gate-runner test-fe-nicolify = `npx eslint src/` → exit 0 = 0 errors; warnings
  toleradas, ratchet por arch-fitness). El codebase nicolify FE tiene ~105 warnings PRE-EXISTENTES
  (nicolify-r0-shell debt: jsdoc, next/image, sonarjs no-duplicate-string en tests) que hacen `--max-warnings 0`
  inalcanzable sin un cleanup masivo fuera de scope. T-1 introduce 0 errores y 0 warnings nuevos no-consistentes
  con el baseline. Recomendación auditor/harness: alinear `eslint_zero` a `npx eslint src/` (0 errores).
t1_preexisting_debt_fixed: >
  2 errores PRE-EXISTENTES de eslint (NO introducidos por esta story) bloqueaban el gate real `npx eslint src/`
  para toda la FE de la marca → fixeados mecánicamente (commit 64132f1b, behavior-neutral, equivalente Carril-A):
  ShellOrganismLayoutClient.tsx (prettier reflow) + ChatComposer.tsx (eslint-disable-next-line unbound-method
  en el selector zustand · wrapping reintroduce el getSnapshot loop documentado). FLAG a Chris: toqué 2 archivos
  de maquinaria (forbidden_to_touch) SOLO para lint mecánico — no hubo cambio de comportamiento/diseño del shell.
next_action: "/pm-nicolify nicolify-r0-sitemap-completo merge → 07-merge.md (5 secciones · DoD live tildado + §17 redirect amendment) → cap extend shell-organism.shell-nicolify → git mv archive → state reviewing→done → update R0.yaml. NUNCA stagear docker-compose.dev.yml (FLAG #6). Forward FLAG #1/#5 a /harness-issue."
autonomous_mode: true                # ★ RATIFICADO Chris 2026-06-02 — correr la cadena completa dev→done sin pausas entre tickets
autonomous_chain: [dev-team:T-1, dev-team:T-2, auditor, live-verify-chrome-mcp, pm-nicolify:merge]
demo_signoff_preauth:                # ★ pre-autorización Chris para esta story THIN nav-skeleton (empty-states · cero lógica de negocio)
  signed_by: Chris
  date: 2026-06-02
  condition: "auditor APPROVED + live-verify Chrome MCP GREEN (todo el menú v3 navegable · 0 burbujas Next · console limpia · empty-states visibles)"
  result: APPROVED   # válido SOLO si la condición se cumple; si live-verify falla → NO merge, reportar a Chris
  scope_note: "Pre-auth acotada a este thin nav-skeleton. NO aplica a stories futuras con lógica/contenido real (esas requieren demo manual de Chris)."
ratified_by_chris: true              # FRAME ratificado 2026-06-02 (slug + R0 + refining PM-led)
ratified_at: 2026-06-02
refining_owner: /pm-nicolify         # PM-led (Chris 2026-06-02): completar SYSTEM-MAP + roadmap conversacional · nav skeleton = thin /architect → /dev-team
architecture_pattern: ADR-nicolify-001   # aplica SOLO a la fase build del nav skeleton (shell-routes.ts + empty-states) · NO a contenido de hojas
parent_story: nicolify-r0-shell-organism # continúa el nav-tree ratificado de la design-story del shell
cap_target: null                     # meta-story: NO produce una cap directa; declara los stubs planned de TODAS las hojas
cap_change_type: null                # sin cap_change directo — cada hoja declara su propia cap al construirse (cap-verification gate)
parallel_safe: true
priority: critical                   # bloquea el "ir hoja por hoja" ordenado de R1+
estimated_dev_weeks: 0               # planning + thin nav skeleton
spawned_at: 2026-06-02T16:31:02-05:00
spawned_by: chris
ssot_owner: /pm-nicolify

deliverables_esperados:
  - sistema_map_v2: "nicolify/docs/architecture/SYSTEM-MAP.yaml v2 — inventario COMPLETO a alto nivel: cada hoja (capability) nombrada + zona/caja/área + target_release. Resuelve las 3 discrepancias shell↔map + los 3 gaps de completitud (ver § Alcance)."
  - roadmap_desarrollo: "ruta de desarrollo: qué hoja en qué release (actualiza nicolify/docs/product/releases/R1..RN + crea los que falten). Secuencia el 'ir hoja por hoja'."
  - nav_tree_skeleton: "nicolify/frontend/src/lib/routing/shell-routes.ts — AGENT_SUBTABS + AGENT_SUBSUBTABS reestructurados = el menú vacío del árbol completo, navegable con empty-states. (thin build · /architect ticket → /dev-team)."
  - capability_stubs: "(opcional) nicolify/docs/product/capabilities/{module}/{cap}.yaml status=planned por hoja — para que el cockpit /functionality vea el árbol declarado."
---

# nicolify-r0-sitemap-completo — checkpoint

## Goal

Tener el **árbol completo de funcionalidades de Nicolify a alto nivel** — TODAS las hojas a implementar nombradas y ubicadas (zona → caja → área → capability), **sin diseñarlas** — más la **ruta de desarrollo** (qué hoja en qué release) y el **menú del shell-organism reestructurado** (subtabs + subsubtabs) reflejando ese árbol. Objetivo: cerrar "el árbol" para después ir **hoja por hoja** sin re-descubrir el mapa cada vez.

Es la continuación natural de `nicolify-r0-shell-organism` (que cementó el nav-tree de N2 para R0); acá se **completa** el árbol a su forma definitiva (N2 + N3) + la ruta de desarrollo cross-release.

## Alcance (qué SÍ / qué NO)

**SÍ:**
- Revisar + **completar al 100%** el `SYSTEM-MAP.yaml` (las 28 áreas actuales + las hojas a alto nivel dentro de cada una + dónde cada hoja vive mejor).
- Resolver las **3 discrepancias shell ↔ map**: Sara incompleta (shell solo `proyectos`; map declara `mi-dia`+`proyectos`+`entregas`) · landing post-login (Sara/"Mi Día" vs christian/pipeline) · zona Plataforma a medio mapear (Acceso/Onboarding fuera del menú).
- Resolver los **3 gaps de completitud** (decisiones de producto): bandeja de leads inbound (recepción pasiva WhatsApp) · bandeja de aprobaciones/decisiones del dueño (separación de poderes ADR-013) · reuniones/agenda.
- Producir la **ruta de desarrollo** (secuencia de hojas R1..RN).
- Reestructurar el **nav del shell** (subtabs + subsubtabs en `shell-routes.ts`) = el esqueleto navegable del árbol, con empty-states.

**NO (non-goals explícitos):**
- ❌ Diseñar las hojas (cada hoja = su propia story futura `/po-ux` / `/ux-agentico` / `/po`).
- ❌ Construir lógica de negocio / backend / contenido real de sub-tabs.
- ❌ Decidir pricing/SKU (eso es otra conversación — vision § 5).

## Estado del árbol HOY (verificado 2026-06-02)

- **SSoT doctrinal:** `nicolify/docs/architecture/SYSTEM-MAP.yaml` v1.1 — 3 zonas · 6 agentes (Luana supervisora + Abel/Brenda/Christian/Sara/Norvil) + Config + Infra · 28 áreas · 7 flujos cross-agente · 12 entidades.
- **Menú cableado:** `nicolify/frontend/src/lib/routing/shell-routes.ts` — Ribbon (5 agentes + Config) + AGENT_SUBTABS (coincide con el map salvo **Sara**) + AGENT_SUBSUBTABS = {} (N3 vacío en R0).
- **Discrepancia clave:** el map declara el landing post-login en Sara/"Mi Día"; `DEFAULT_LANDING` del shell = `christian/pipeline`.

## Próximos pasos sugeridos

1. ✅ **FRAME ratificado** (Chris 2026-06-02): slug `nicolify-r0-sitemap-completo` · release R0 · refining **PM-led**.
2. ⏭ **Refining (review + completar el árbol) — ARRANCA EN OTRA CONVERSACIÓN (Chris):** `/pm-nicolify` + Chris recorren las 6 cuestiones (3 discrepancias + 3 gaps) + nombran las hojas de cada área a alto nivel + secuencian la ruta → SYSTEM-MAP v2 + roadmap ratificados. Transición `idea → refining`.
3. **Thin build (nav skeleton):** `/architect` produce el ticket del nav-tree → `/dev-team` reestructura `shell-routes.ts` (subtabs/subsubtabs) + empty-states → `/auditor`.

## Bitácora

- 2026-06-02: story creada (`state: idea`) por Chris — "tener todas las funcionalidades a alto nivel + ubicarlas + ruta de desarrollo + reestructurar subtabs/subsubtabs del shell antes de ir hoja por hoja".
- 2026-06-02: **frame ratificado** (Chris) — slug + R0 + refining PM-led. Commiteada. Chris arranca el refinamiento en otra conversación.
- 2026-06-02: **refining arrancado** (`idea → refining`). Prior-art scan + 6 decisiones de Chris (D1-D3 + G1-G3) + inbox deep-dive (vitalia, encargo Chris) en `00-research.md`. **`01-sitemap.md` PROPUESTA escrito** — árbol completo (3 zonas · 6 agentes · todas las hojas + release) + roadmap R0..R4+futuro + deltas vs v1.1.
- 2026-06-02: **REANCLADO en la intención de negocio** (Chris frenó la propuesta: "nunca me preguntaste qué espero de cada agente"). Revisé **core (26 pkgs) + legacy** (AISALESHT monolítico · 2 Explore). Chris dio expectativas per-agente → `02-agent-intent.md` (ANCLA, `promote_to_vision`). Research de canales (LinkedIn#1·Meta#2·Email·TikTok no) + motor de fidelización Norvil (champion-shield/QBR) + regla engagement Brenda/Christian. **`01-sitemap.md` reescrito v2** con la intención embebida por agente/hoja (preserve_intent). Reframes: Brenda=agencia B2B completa · Christian+inbox/lead-routing/follow-up · Sara=Próximamente · Norvil=CRM clientes actuales+fidelización · voz-fundador compartida. Pendiente: ratificar nav (OI-2 N3 Christian · OI-3 Sara tab) → cementar `SYSTEM-MAP.yaml v2` + `shell-routes.ts` + releases.
- 2026-06-03: **/architect cerró el READY PACKAGE** (`refined → ready`). Thin nav-skeleton build FE-only (`cap_change_type: extend`). 5 deliverables: `03-arch.md`+`03-arch-fe.md` · `04-validators.yaml` · `05-guidelines.md` · `06-tickets.yaml` (2 tickets builder-frontend Sonnet · ningún agentic) · `dispatch-plan.md` (autonomous_mode:false). Confirmé que la maquinaria del shell es 100% data-driven desde `shell-routes.ts` → el cambio es de DATOS. **★ Hallazgo: la ruta `[subsubtab]/page.tsx` NO existe hoy → los 8 leaves N3 darían 404; T-1 la crea (cierra la isla).** T-1 = reescribe `shell-routes.ts`+`agent-catalog.ts`+content-map+ruta N3+tests-data · T-2 = e2e nav-walk + fixture anti-burbuja (DoD #37). Next: `/dev-team toma T-1`.

## Architect handoff — nav skeleton thin build (scope EXACTO)

> **Input SSoT:** `nicolify/docs/architecture/SYSTEM-MAP.yaml` v2.0 (árbol canónico) + `01-sitemap.md` v3 (intención) + `nav_model` (4 niveles + regla de colapso). **Pattern:** ADR-nicolify-001 (shell-feature-architecture).

**SÍ construir (thin · reusa la maquinaria del shell ya shipped):**
- Reescribir `nicolify/frontend/src/lib/routing/shell-routes.ts` = `cap_change_type: extend` de la cap `shell-organism.shell-nicolify`:
  - `AGENT_SUBTABS` (N2) al árbol v3:
    - **abel:** `icp` · `oferta` · `marca`
    - **brenda:** `contenido-presencia` · `pauta` · `inteligencia-asesoria`
    - **christian:** `contactos` · `inbox` · `pipeline` · `equipo-comercial` · `agenda` · `propuestas`
    - **sara:** `proximamente` (único · empty-state "Próximamente")
    - **norvil:** `cartera` · `renovaciones` · `fidelizacion`
    - **config:** `conexiones` · `preferencias` · `tokens` · `autonomia-agentes`
  - `AGENT_SUBSUBTABS` (N3) poblar los 3 árboles con leaves:
    - `abel.oferta` → [`catalogo-escalera`, `dossier-mineria`]
    - `christian.propuestas` → [`propuestas`, `licitaciones`]
    - `norvil.fidelizacion` → [`momentos`, `champion-shield`, `value-proof-qbr`, `gifting`]
  - `DEFAULT_LANDING` = `christian/pipeline` (se mantiene · pipeline sigue existiendo).
  - `AGENT_CATALOG` tabLabels: revisar (christian "Ventas", abel "Estrategia"… ya OK) · sara tabLabel "Próximamente".
  - Guards/whitelists (`isValidSubtab`, `getSubSubTabs`) + arch-fitness `test_shell_routes_ssot` deben seguir verdes con el árbol nuevo.
- **Empty-states** navegables por cada hoja/subárea nueva (placeholder "en construcción" / "Próximamente" para Sara) — reusa el patrón de empty-state del shell, NO diseñar contenido real.
- Actualizar el doc de nav-tree del shell si existe (`navigation-tree.md` / `SHELL-DESIGN-CONTRACT.md`) para reflejar el árbol v3.

**NO construir (fuera de scope · son stories futuras por release):**
- ❌ El contenido/diseño real de cualquier hoja (ICP screen, inbox, cartera detail, etc.) → R1..R5.
- ❌ Lógica de negocio / backend / DDD de los módulos.
- ❌ Tocar la maquinaria del shell (Ribbon/SubTabsBar/SubSubTabsBar components) — ya está shipped, solo se la alimenta con datos nuevos.

**DoD (#37):** el menú v3 navegable se ejerce LIVE en dev-app/localhost:3001 (Chrome MCP) — cada tab/subtab/subsubtab abre su empty-state sin burbuja de error + Console limpia.

**Naturaleza:** funcional (UI nav) → gate anti-burbuja + demo manual aplican (empty-states, liviano).

## Handoff — RUN AUTÓNOMO dev→done (sesión nueva · autorizado Chris 2026-06-02)

> Esta story está en `ready`. La sesión nueva la lleva de `ready → done` sin pausas. Todo el contexto necesario es autocontenido en el ready package (NO hace falta nada de la conversación de refinamiento).

**Estado al handoff:**
- Ready package commiteado: `03-arch.md` + `03-arch-fe.md` + `04-validators.yaml` + `05-guidelines.md` + `06-tickets.yaml` + `dispatch-plan.md`.
- PM loose ends CERRADOS pre-build: ADR-nicolify-002 D-D enmendado (Sara deferred) + `vision.md §1` graduado (intención = SSoT durable). El merge NO necesita re-graduar.
- `autonomous_mode: true` + `demo_signoff_preauth` (APPROVED contingente a live-verify GREEN) en frontmatter.

**Cadena a ejecutar:**
1. `/dev-team nicolify nicolify-r0-sitemap-completo` → T-1 (shell-routes.ts v3 + ruta N3 `[subsubtab]/page.tsx` + empty-states + tests de datos) → GREEN → T-2 (e2e nav-walk + fixture anti-burbuja `base.ts`). Bucket `code:shell-organism` (serie).
2. Auto-handoff `/auditor nicolify nicolify-r0-sitemap-completo` (Carriles self-fix per policy v4.2).
3. **Live-verify (Critical Rule #37) — OBLIGATORIO:** `make dev-nicolify` → ejercer el menú v3 LIVE en `localhost:3001` con Chrome DevTools MCP: recorrer Ribbon (5 + config) → cada N2 → los 3 N3 (abel.oferta, christian.propuestas, norvil.fidelizacion) → Sara="Próximamente". Assert: cada combo abre su empty-state · 0 burbujas Next (`nextjs-portal` ausente) · console limpia · backend sin traceback. Registrar `dod_evidence` en este checkpoint + `07-merge.md`.
4. `/pm-nicolify nicolify-r0-sitemap-completo merge`: si auditor APPROVED + live-verify GREEN → `demo_signoff_preauth` aplica (APPROVED) → escribir `07-merge.md` (5 secciones · DoD live tildado de verdad) → cap promotion (extend `shell-organism.shell-nicolify` change_log) → `git mv` story a `nicolify/docs/archive/2026/stories/` → state `reviewing → done` → update `R0.yaml`.

**Si algo falla (NO abandonar · diagnosticar):**
- live-verify con burbuja/console-error → es un bug real del build → volver a `/dev-team` fix-loop (NO mergear). Reportar a Chris si no se resuelve en 2 iteraciones.
- `demo_signoff_preauth` NO aplica si live-verify falla → STOP merge, reportar a Chris.
- WIP cap / closure-gate: ninguna otra story OPEN en `code:shell-organism` (verificado 2026-06-02).

**Forbidden (scope discipline):** NO diseñar hojas reales (R1..R5) · NO tocar maquinaria del shell (Ribbon/SubTabsBar/SubSubTabsBar components) · NO core/ · NO otros brands · NO commitear `nicolify/docker-compose.dev.yml` (cambio ajeno, dejar sin stagear).

## Bitácora (cont.)

- 2026-06-02: SYSTEM-MAP v2.0 + R1-R5 cementados (`17a35946`). `/architect` cerró ready package thin nav-skeleton (`787b4092`, 2 tickets builder-frontend, 0 agentic; cazó isla de nav: ruta N3 inexistente). ADR-nicolify-002 D-D enmendado (Sara deferred) + `vision.md §1` graduado (intención SSoT durable). `autonomous_mode: true` + demo pre-auth ratificados Chris. → handoff a sesión nueva para run autónomo dev→done.
- 2026-06-03: **/auditor APPROVED (`developed → reviewing`).** gate-runner (Haiku) → `gate-output.json` ALL GREEN (tsc 0 · eslint 0 errors/102 warns baseline · vitest 131/131 · boundary 0 cross-brand). auditor-frontend (Opus) → `T-1-review.md` APPROVED ambos tickets (16/16 categorías PASS · guard N2/N3 rechaza XSS/traversal/`__proto__` route-enforced · redirect loop-free + leaf-active · Spanish neutro · base.ts anti-burbuja port fiel · scope D3). Phase D `06-audit/gherkin-matrix.md` = RN-1..RN-5 → 5/5 PASS, 0 MISSING. **Live-verify (DoD #37):** nav-walk-v3 `--project=regression` localhost:3001 warm **33 passed / 0 flaky** + sara/proximamente aislado x5 = 0 flaky. **1 flaky en cold-run** (`sara/proximamente` pageerror `SyntaxError: Invalid or unexpected token` → retry GREEN) caracterizado = `next dev` first-compile chunk-load race · prod-immune · 0 causa en código (auditor confirmó). `CHECKPOINTS.md` C1-C5 APPROVED. → AUTO-HANDOFF `/pm-nicolify merge`. FLAGS #1/#5 → `/harness-issue` (validator mis-specs). FLAG #6 docker-compose NO stagear.
