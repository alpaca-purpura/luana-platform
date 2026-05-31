---
story_id: nicolify-r0-shell
brand: nicolify
type: ui-story
state: refined
release: R0
architecture_pattern: ADR-nicolify-001      # shell-feature gate (REQUIRED) · hereda ADR-vitalia-004
map_zone: infraestructura
map_box: plataforma-tecnica
po_ux_version: 2
ratified_by_chris: true
ratified_visual_by_chris: true               # ★ G1 satisfecho — mockup 5 tabs ratificado Chris 2026-05-30
ratified_at: 2026-05-30
cap_target: null
cap_change_type: new
---

# 01-spec — nicolify-r0-shell

> Spec UNIFICADO del shell-organism agéntico de Nicolify (esqueleto FE estático/navegable). Fusiona 6 stories R0 (tokens · topbar · layout/splitter · panel Luana · ribbon/sub-tabs · routing/empty-states). Porta verbatim re-tematizado el shell maduro de Vitalia. SSoT de diseño: `nicolify/docs/architecture/{SHELL-DESIGN-CONTRACT.md, ADR-nicolify-001-shell-feature-architecture.md}` + design-story `nicolify-r0-shell-organism` (navigation-tree + mockup `shell.html`).

## § Context

- **Release:** R0 — Fundación + shell agéntico (`nicolify/docs/product/releases/R0.yaml`).
- **Módulo:** shell-organism (contenedor · `components/shared/shell-organism/` + `app/[tenantId]/(shell-organism)/`).
- **Insertion point:** es la raíz de la app post-login del tenant. Todo lo demás (releases R1+) vive adentro.
- **Naturaleza:** **esqueleto estático**. Paneles renderizan estructura + empty-states; NO hay lógica de agentes, NO data real, NO endpoints nuevos (chat composer no envía, listas muestran empty-state). El cableado agéntico llega en releases posteriores.
- **Blocker externo:** `nicolify-r0-dev-stack` (BE :8001 + FE :3001 + Clerk + alembic baseline) debe estar verde antes de `developing`.
- **Decisiones ratificadas Chris (2026-05-30):** Sara entra como 5ª tab del Ribbon (5 agentes) · default landing = `christian/pipeline`.

### Out of scope (anti-creep)

- Lógica conversacional real de Luana / agentes (R1+ vía `/ux-agentico`).
- Endpoints BE nuevos, persistencia de conversaciones, RAG, tools.
- Data real en sub-tabs (todas arrancan en empty-state).
- Sub-sub-tabs N3 (se materializan cuando una hoja lo necesite, no en R0).
- Lift a `core/luana-core-ui` (diferido post-R0, N=2).

## § Prior art applied

- **Engine consumido:** `@luana/ui-kit` (átomos Shadcn: Button, Avatar, Tooltip, Sheet, ScrollArea, Skeleton, Input…) · `@luana/design-tokens` (`Z_INDEX`) · `@luana/hooks`. NO se recrean primitivas.
- **Reused from vitalia (port verbatim re-tematizado):**
  - `vitalia/frontend/src/components/shared/shell-organism/` (TopBarGlobal, ShellOrganismLayout, Ribbon, RibbonTab, SubTabsBar, ThemeToggle, LogoMark, ValeriaSidebar→`LuanaSidebar`).
  - `vitalia/frontend/src/app/[tenantId]/(shell-organism)/` (routing + not-found jerárquico + proxy.ts Next.js 16).
  - Mockups fuente: `vitalia-shell-organism/mockups/{dual-mode-shell,valeria-chat-sample,valeria-rail}.html`.
- **Stories archivadas replicadas (estructura de scenarios):** `vitalia-fase1-{design-tokens-theme, topbar-global, shell-layout-5050, ribbon-6-tabs, routing-shell}` + `vitalia-shell-state-persistence`. Vitalia las shippeó separadas; Nicolify las porta como una.
- **Learnings aplicados:**
  - `vitalia/docs/learnings/2026-05-25-q16-tailwind-jit-template-purge.md` → `_agent-tw-classes.ts` static helpers (G3, NUNCA template literals en class strings).
  - `vitalia/docs/learnings/2026-05-27-shell-mockup-wrapper-fidelity.md` → portar wrapper verbatim, no reinventar simplificado.
  - `vitalia/docs/learnings/2026-05-24-ui-hit-area-1px-anti-pattern.md` → hit-area del splitter ≥8px aunque la línea visible sea 4px.
  - `vitalia/docs/learnings/2026-05-26-nextjs-16-proxy-ts-pattern.md` → routing proxy.ts.
  - SSR-safe store (ADR-vitalia-006 → G2): `createSsrSafePersistedStore` + `useStoreHydration`, skeleton store-free (sin write espurio del default en ciclo SSR+hydration).
- **Lift candidates detectados:** todo el shell-organism es candidato a `core/luana-core-ui` cuando N=2 brands lo compartan — diferido post-R0, escalable a `/pm-luana` (ya anotado en R0.yaml).
- **Net-new justificado:** re-tematización a paleta nicolify.com (#635BFF indigo + #A855F7 púrpura + League Spartan/Bree Serif) + catálogo de 5 agentes Revenue/Ops (Vitalia tiene 5 agentes salud distintos) + `LuanaSidebar` (= ValeriaSidebar re-tematizado, mismo patrón 3 estados). SIN PHI (Nicolify usa tenant-isolation raíz + guardrails agénticos, no dual-filter clínico).

## § Gherkin scenarios

> Consolidados en 6 bloques (A–F) para evitar duplicar los transversales (a11y, i18n, hydration). Shell **estático** → varias sub-categorías v4.1 marcadas `not_applicable` (no hay create/update, ni fetch de datasets, ni paginación).

### Bloque A — Bootstrap + routing + empty-states

**A0 · happy · dev-stack boot LIVE (app realmente funcional)**
- given: `make dev-nicolify` levantado (BE :8001 + FE :3001).
- when: un usuario no autenticado abre `/{tenantId}` y luego se loguea vía Clerk.
- then: BE `:8001/health` responde 200 · FE `:3001` sirve la app · el middleware Clerk redirige al no-autenticado a `/sign-in` · tras login redirige a `DEFAULT_LANDING` (`/{tenantId}/christian/pipeline`) · el shell root renderiza sin crash (HTTP 200). Es el gate de **Definition of Done**: la app corre end-to-end, no son componentes sueltos sobre un stack apagado.
- playwright_required: true
- graders:
  - `{ type: shell, cmd: "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8001/health", expect: "200" }`
  - `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/boot-live-smoke.spec.ts" }`
- ticket: T-0 (boot+middleware) · verificado al final tras T-6 (shell construido)

**A1 · happy · bootstrap → default landing**
- given: tenant autenticado (Clerk) entra a la raíz del shell `/{tenantId}`.
- when: la app monta.
- then: redirige a `/{tenantId}/christian/pipeline` (default landing ratificado) · TopBar visible (`role="banner"`) · LuanaSidebar visible a la izquierda · Ribbon con 5 tabs + Configurar a la derecha · SubTabsBar de Christian · hoja en empty-state "Aún no hay deals en tu pipeline".
- playwright_required: true
- graders:
  - `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/bootstrap-default-landing.spec.ts" }`
  - `{ type: visual_state, screen: "shell-default", element: "[data-testid=app-panel]", expect: "empty-state visible" }`

**A2 · negative · slug de agente inválido → 404 contextual**
- given: usuario autenticado.
- when: navega a `/{tenantId}/zzz/pipeline` (agente inexistente).
- then: `not-found.tsx` jerárquico del segmento `[agent]` renderiza ("Ese agente no existe") · el shell (TopBar + Ribbon + Luana) sigue visible · Ribbon sin tab activa.
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/invalid-agent-404.spec.ts" }`

**A3 · negative · sub-tab inválida para agente válido → 404 contextual**
- given: usuario autenticado.
- when: navega a `/{tenantId}/abel/zzz` (sub-tab fuera de `AGENT_SUBTABS[abel]`).
- then: `not-found.tsx` del segmento `[subtab]` renderiza · Ribbon marca Abel activo · SubTabsBar de Abel visible.
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/invalid-subtab-404.spec.ts" }`

**A4 · adversarial · XSS / path injection en segmentos de ruta**
- given: usuario autenticado.
- when: navega a `/{tenantId}/<script>alert(1)</script>/pipeline`.
- then: segmento sanitizado por el whitelist de `shell-routes.ts` → 404 contextual · cero ejecución de script · cero render del payload como HTML.
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/path-xss-guard.spec.ts" }`

**A5 · empty_state · cada sub-tab del nav-tree renderiza su empty-state**
- given: usuario autenticado.
- when: navega a cada `[agent]/[subtab]` del whitelist (Abel 4 + Brenda 3 + Christian 5 + Sara 1 + Norvil 3 + Config 4).
- then: cada hoja renderiza un `EmptyState` elegante (icono + heading + sub-copy + CTA placeholder), NUNCA pantalla en blanco ni crash.
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/empty-states-all-subtabs.spec.ts" }`

### Bloque B — UI shell integration (TopBar + tokens + tema)

**B1 · happy · render desktop completo + 3 paneles en sync**
- given: viewport ≥1280px, tema light.
- when: carga `/{tenantId}/christian/pipeline`.
- then: TopBar h-12 (LogoMark izq, [control splitter · ThemeToggle · TenantSwitcher] der) · grid dual-mode 50/50 (Luana | App) · Ribbon agent-color border en Christian (azul #3B82F6) · tokens nicolify.com resueltos (primario #635BFF, fuentes League Spartan).
- playwright_required: true
- graders:
  - `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/topbar-render-desktop.spec.ts" }`
  - `{ type: visual_state, screen: "shell-desktop-light", element: "header[role=banner]", expect: "LogoMark full + controles derecha" }`

**B2 · happy · theme toggle light↔dark aplica a todo el shell**
- given: shell en light.
- when: click en ThemeToggle.
- then: `.dark` CSS vars aplican (fondo deep-indigo) · LogoMark swap a variante dark · agent-colors swap a `-soft` dark · sin FOUC (script SSR inline en `<head>`) · `suppressHydrationWarning` en `<html>`.
- playwright_required: true
- graders:
  - `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/theme-toggle.spec.ts" }`
  - `{ type: state_check, target: localStorage, query: "nicolify-theme", expect: "dark" }`

**B3 · happy · responsive 375 / 768 / 1280**
- given: las 3 anchuras.
- when: carga el shell en cada una.
- then: <768 → 1 columna, LuanaSidebar en drawer (cerrado por defecto, burger lo abre), LogoMark variante `mark` · [768–1104) → grid 2col, Luana forzada a `rail` (viewport guard one-way) · ≥1104 → dual-mode libre. Sin overflow horizontal salvo el scroll intencional del Ribbon en mobile.
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/responsive-breakpoints.spec.ts" }`

### Bloque C — Layout dual-mode + splitter (3 estados)

**C1 · happy · splitter drag + snaps (chat-collapsed / narrow / 50-50)**
- given: shell en dual-mode 50/50.
- when: arrastro el splitter; uso atajos C/R/F.
- then: el ancho de Luana cambia con clamp a sus mínimos por estado (full ~620px / narrow ~360px / collapsed rail ~60px) · snaps a los 3 estados · hit-area del handle ≥8px (línea visible 4px) · `aria-label="Redimensionar paneles"`.
- playwright_required: true
- graders:
  - `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/splitter-drag-snaps.spec.ts" }`
  - `{ type: visual_state, screen: "shell-luana-rail", element: "[data-testid=luana-sidebar]", expect: "rail 60px" }`

**C2 · edge · cambio de estado fuerza snap-up si el ancho actual < mínimo nuevo**
- given: Luana en `rail` (~360px asignado a su columna) con un ratio custom estrecho.
- when: expando a `full` (mín ~620px) y el ancho actual es menor.
- then: el layout hace snap-up automático al mínimo del estado destino (no deja la columna por debajo del mínimo) · sin layout shift roto.
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/splitter-snap-up.spec.ts" }`

**C3 · adversarial (bug Vitalia conocido) · NO hay write espurio del default en ciclo SSR+hydration**
- given: usuario con estado de shell persistido (ej. Luana en `history`).
- when: recarga la página (SSR → hydration).
- then: el estado persistido se respeta · el store NO pisa localStorage con el default durante la hidratación (G2 SSR-safe: skeleton store-free, gate `useStoreHydration`).
- playwright_required: true
- graders:
  - `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/no-spurious-default-write.spec.ts" }`
  - `{ type: state_check, target: localStorage, query: "nicolify-shell-state", expect: "valor persistido intacto post-reload" }`

### Bloque D — Panel Luana (orquestador, skeleton)

**D1 · happy · 3 estados del LuanaSidebar (collapsed/history/full)**
- given: shell montado, Luana en `full` (default visible).
- when: alterno entre `LuanaRail` (rail íconos) / `LuanaHistory` (lista conversaciones + búsqueda) / `LuanaChat` (ChatHeader + mensajes mock + ChatComposer + TypingIndicator).
- then: cada estado renderiza su estructura skeleton · `role="complementary"` · atajos teclado C/R/F · avatar de Luana (#635BFF) en el header. El ChatComposer es no-funcional en R0 (placeholder "Escríbele a Luana…", botón enviar deshabilitado o sin efecto).
- playwright_required: true
- graders:
  - `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/luana-sidebar-states.spec.ts" }`
  - `{ type: visual_state, screen: "luana-chat-skeleton", element: "[data-testid=chat-composer]", expect: "placeholder visible, sin envío real" }`

**D2 · happy mobile · drawer de Luana cerrado por defecto + burger lo abre + recuerda**
- given: viewport <768, fresh user.
- when: monto el shell, luego toco el burger, luego recargo.
- then: arranca con drawer cerrado · burger lo abre on-demand · el estado abierto/cerrado del drawer sobrevive el reload (slice mobile independiente del estado desktop de Luana).
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/luana-mobile-drawer.spec.ts" }`

### Bloque E — Ribbon (5 agentes + Config) + sub-tabs

**E1 · happy · click en tab de agente navega a su sub-tab default + marca active**
- given: shell en `christian/pipeline`.
- when: click en la tab de Abel.
- then: navega a `/{tenantId}/abel/oferta` (default subtab de Abel) · Ribbon marca Abel active (agent-color border #A855F7, font-semibold) · SubTabsBar muestra las 4 sub-tabs de Abel · roving tabindex (solo la active tabindex=0).
- playwright_required: true
- graders:
  - `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/ribbon-nav.spec.ts" }`
  - `{ type: visual_state, screen: "ribbon-abel-active", element: "[role=tablist]", expect: "Abel active agent-color" }`

**E2 · happy · deep-link marca el active state correcto (URL-derived)**
- given: URL directa `/{tenantId}/norvil/salud-cuenta`.
- when: carga en frío.
- then: Ribbon marca Norvil active (rosa #EC4899) · SubTabsBar marca `salud-cuenta` active · hoja en empty-state.
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/ribbon-deeplink.spec.ts" }`

**E3 · happy · ConfigTab navega a /config/conexiones**
- given: shell montado.
- when: click en Configurar (IconButton Settings + Tooltip "Configurar").
- then: navega a `/{tenantId}/config/conexiones` (default de config) · ConfigTab active.
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/config-tab-nav.spec.ts" }`

**E4 · edge · avatar PNG/SVG de agente falla → fallback inicial**
- given: shell montado, asset de avatar 404 (caso Sara: avatar placeholder pendiente).
- when: el Ribbon intenta renderizar el avatar.
- then: fallback a inicial (letra + `bg-agent-{slug}-soft`), NUNCA imagen rota. (Cubre el gap conocido del avatar de Sara.)
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/avatar-fallback.spec.ts" }`

**E5 · edge · Ribbon en mobile 375px → scroll horizontal, ConfigTab al final**
- given: viewport 375px.
- when: render del Ribbon (5 tabs + Config no entran).
- then: `overflow-x-auto`, ConfigTab `ml-auto` (último), sin romper la altura uniforme h-14.
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/ribbon-mobile-scroll.spec.ts" }`

### Bloque F — Accessibility + i18n (transversales)

**F1 · accessibility · navegación por teclado WAI-ARIA tablist completa**
- given: foco en el Ribbon.
- when: Tab / Arrow / Home / End / Enter.
- then: roving tabindex correcto · Enter activa la tab · skip-link "Saltar al contenido" (target `#main-content`) · focus ring visible (`focus:ring-2 focus:ring-primary`) en todos los controles (TopBar, Ribbon, splitter, composer).
- playwright_required: true
- graders:
  - `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/a11y-keyboard.spec.ts" }`
  - `{ type: axe, ruleset: "wcag2aa" }`

**F2 · i18n · microcopy Spanish neutro LatAm (tuteo, sin voseo)**
- given: shell renderizado.
- when: inspecciono todos los strings user-facing (ver § Microcopy).
- then: tuteo (sin `vos/sos/tenés`), tildes + ñ + apertura `¿!`, cero léxico regional. Currency/locale del tenant cuando aplique (no en R0 skeleton).
- playwright_required: true
- graders: `{ type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r0-shell/i18n-spanish-neutro.spec.ts" }`

### Sub-categorías v4.1 — cobertura

| Sub-categoría | Estado | Razón |
|---|---|---|
| race_condition | `not_applicable` | shell estático, sin create/update con unique constraint en R0 |
| concurrent_users | `not_applicable` | sin data fetch filterable (empty-states); multitenancy lo cubre dev-stack |
| network_failure | `not_applicable` | R0 no hace fetch de datos (sin endpoints nuevos); se cubre cuando una sub-tab traiga data (R1+) |
| empty_state | ✅ A5 (todas las sub-tabs) | — |
| large_dataset | `not_applicable` | sin listas con paginación en R0 |
| accessibility | ✅ F1 | — |
| i18n | ✅ F2 | — |

> `not_applicable_reason` ratificable por Chris al cerrar refined (shell skeleton — los datos llegan en releases posteriores).

## § Wireframes

**Opción B/C — HTML mockup ratificado (ya existe):** `nicolify/docs/product/stories/nicolify-r0-shell-organism/mockups/shell.html` (paleta nicolify.com + League Spartan + splitter drag + avatares). Servir local:

```bash
WS=$(git rev-parse --show-toplevel)
cd ${WS}/nicolify/docs/product/stories/nicolify-r0-shell-organism/mockups && python3 -m http.server 8888
```

> ⚠️ **G1 pendiente:** el mockup ratificado muestra **4 agentes**. Con Sara incluida (5 tabs · decisión Chris 2026-05-30) requiere **refit + re-ratificación del Ribbon de 5 tabs** antes de cerrar `refining→refined`. Fuentes verbatim del wrapper: `vitalia-shell-organism/mockups/{dual-mode-shell,valeria-chat-sample,valeria-rail}.html`.

Macro (referencia ASCII, detalle en mockup):

```
┌──────────────────────────────────────────────────────────────────┐
│ TopBar:  [Nicolify ▦]              [⇔ splitter][☾ tema][Agencia ▾] │
├───────────────────────┬──────────────────────────────────────────┤
│ LUANA (orquestadora)  │ Ribbon: Abel·Brenda·Christian·Sara·Norvil·⚙│
│ rail / history / chat ├──────────────────────────────────────────┤
│ [avatar Luana #635BFF]│ SubTabsBar (del agente activo)           │
│ ...mensajes mock...   ├──────────────────────────────────────────┤
│ [Escríbele a Luana… ] │ Hoja (page.tsx) — empty-state             │
└───────────────────────┴──────────────────────────────────────────┘
```

## § Estados visuales

| Estado | Trigger | Visible | Oculto |
|---|---|---|---|
| `shell-default` | bootstrap → christian/pipeline | TopBar + Luana(full) + Ribbon + SubTabsBar + empty-state | 404, drawer mobile |
| `luana-rail` | atajo C / drag a collapsed | LuanaRail (60px íconos) | History, Chat |
| `luana-history` | atajo R | LuanaHistory (lista + búsqueda) | Chat, Rail |
| `luana-chat` | atajo F (default) | ChatHeader + mensajes mock + Composer + Typing | Rail, History |
| `ribbon-active` | tab agente seleccionada | agent-color border + font-semibold | resto inactive (text-muted) |
| `dark` | ThemeToggle | `.dark` vars + LogoMark dark + agent-soft dark | assets light |
| `mobile-collapsed` | viewport <768 | 1 columna + burger + drawer cerrado | grid dual-mode |
| `404-contextual` | slug inválido | not-found + shell chrome intacto | hoja |
| `empty-state` | sub-tab sin data (R0) | icono + heading + sub-copy + CTA | tabla/data |

## § Componentes (reuse > inventar)

Todos los átomos = `@luana/ui-kit` (reuse). Moléculas/organismos = port verbatim re-tematizado de Vitalia (NEW en nicolify pero NO inventados — origen vitalia citado).

| Componente | Tipo | Origen / path |
|---|---|---|
| Button, Avatar, Tooltip, Sheet, ScrollArea, Skeleton, Input, Separator | átomo | `@luana/ui-kit` (reuse) |
| `LogoMark`, `ThemeToggle`, `TenantSwitcher`, `RibbonTab`, `ConfigTab`, `SubTab`, `AgentAvatar`, `EmptyState`, `ChatHeader`, `MessageBubble`, `ChatComposer`, `TypingIndicator` | molécula | port de `vitalia/.../shell-organism/` → `nicolify/frontend/src/components/shared/shell-organism/` (re-temizado) |
| `TopBarGlobal`, `LuanaSidebar` (+ `LuanaRail`/`LuanaHistory`/`LuanaChat`), `Ribbon`, `SubTabsBar`, `ShellOrganismLayout`, `AppPanelSlot` | organismo | idem (ValeriaSidebar→LuanaSidebar) |
| `_agent-tw-classes.ts` | helper | NEW (G3 JIT-safe static lookup) |
| `shell-routes.ts` (`AGENT_CATALOG` + `AGENT_SUBTABS` + `AGENT_SUBSUBTABS`) | lib | NEW (SSoT routing, del navigation-tree) |
| `useShellStore` (SSR-safe persist) | store | port (G2 `createSsrSafePersistedStore` + `useStoreHydration`) |

## § Routing SSoT (shell-routes.ts)

```yaml
AGENT_CATALOG: [abel, brenda, christian, sara, norvil, config]   # Luana NO es tab
DEFAULT_LANDING: christian/pipeline                              # ratificado Chris 2026-05-30
AGENT_SUBTABS:
  abel:      [oferta, angulos, escalera-valor, marca]
  brenda:    [campanas, contenido, presupuesto]
  christian: [prospectos, secuencias, pipeline, propuestas, licitaciones]
  sara:      [proyectos]                 # solo proyectos en R0 (ratif. Chris 2026-05-30)
  norvil:    [cuentas, salud-cuenta, renovaciones]
  config:    [conexiones, preferencias, tokens, agentes]
```

> Ruta: `app/[tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx` (+ `[subsubtab]` futuro). Server Component default · SSR initial state · proxy.ts Next.js 16 · clerkMiddleware · `not-found.tsx` jerárquico por segmento.
>
> ⚠️ **Sub-tabs provisionales:** el conjunto de sub-tabs por agente del nav-tree sirve para que R0 tenga rutas + empty-states que recorrer, pero **se va a replantear completo en una story dedicada** (ratif. Chris 2026-05-30). `shell-routes.ts` es el único punto de cambio cuando eso pase.

## § Microcopy (Spanish neutro LatAm — tuteo)

| Lugar | Copy |
|---|---|
| LogoMark aria-label | "Nicolify inicio" |
| Skip link | "Saltar al contenido" |
| ThemeToggle aria-label | "Cambiar tema (actual: claro)" / "(actual: oscuro)" |
| Splitter aria-label | "Redimensionar paneles" |
| Ribbon aria-label | "Agentes" |
| ConfigTab tooltip | "Configurar" |
| TenantSwitcher placeholder | "Cambiar de agencia" |
| Luana composer placeholder | "Escríbele a Luana…" |
| Empty-state pipeline (Christian) | heading "Aún no hay deals en tu pipeline" · sub "Cuando Christian capture oportunidades, aparecerán acá." · CTA "Conectar canales" |
| Empty-state genérico sub-tab | heading "Todavía no hay nada por aquí" · sub "Esta sección se activa cuando el agente empiece a trabajar." |
| 404 agente | "Ese agente no existe" |
| 404 sub-tab | "Esa sección no existe para este agente" |
| Mobile burger aria-label | "Abrir panel de Luana" |

<!-- voseo-allowed: glosario reference -->
**Spanish neutro check:** tuteo. Prohibido voseo (`vos/sos/tenés/escribile→escríbele`), léxico regional. Tildes + ñ + apertura `¿!`. (Nota: el composer es chrome UI → neutro; el output conversacional real de los agentes respeta voz tenant, pero eso es R1+.)

## § Responsive breakpoints

- **<768px (mobile):** 1 columna · LuanaSidebar en drawer (cerrado default, burger) · LogoMark `mark` · Ribbon `overflow-x-auto`.
- **[768–1104) (tablet):** grid 2col · Luana forzada a `rail` (viewport guard one-way) · SubTabsBar compacta.
- **≥1104px (desktop):** dual-mode 50/50 libre · splitter resizable 3 estados.

## § Accessibility

- `role="banner"` (TopBar), `role="complementary"` (LuanaSidebar), `role="tablist"`/`role="tab"` (Ribbon, roving tabindex), `role="main"` (`#main-content`).
- Skip link "Saltar al contenido".
- Focus visible `focus:ring-2 focus:ring-primary` en todos los controles.
- Contraste ≥4.5:1 texto / ≥3:1 UI (verificar paleta nicolify.com en light + dark con axe).
- Splitter operable por teclado (C/R/F) + `aria-label`.
- Cambio de hoja anuncia vía `<title>` (page title por ruta).

## § Telemetría (opcional R0)

```yaml
events:
  - { name: "nicolify_shell_mounted", trigger: "shell mount", props: ["default_landing"] }
  - { name: "nicolify_agent_tab_clicked", trigger: "ribbon tab click", props: ["agent_slug"] }
  - { name: "nicolify_theme_toggled", trigger: "theme switch", props: ["to"] }
  - { name: "nicolify_luana_state_changed", trigger: "C/R/F", props: ["state"] }
```

> Si se instrumenta, usar `nicolify_growth_studio_event` (NO `copilot_trace_event` engine) per `shell-feature-architecture.md`. En R0 puede quedar declarado sin emitir.

## § Open questions / gates pendientes

- **G1:** ✅ resuelto — mockup `shell.html` refiteado a **5 tabs** (Sara ámbar #F59E0B + sub-tab `proyectos`), pendiente solo el flip `ratified_visual_by_chris: true` al ratificar Chris.
- **Sara sub-tabs:** ✅ resuelto — solo `proyectos` en R0 (el resto de sub-tabs de todos los agentes se replantea en story dedicada).
- **Scope esqueleto:** ✅ confirmado Chris — shell estático, empty-states en todo, chat composer no-funcional, cero endpoints nuevos.
- **Avatar de Sara:** placeholder SVG creado (`assets/agents/sara.svg`, ámbar + inicial "S"). Chris entrega el final en semanas (reemplazo 1:1). E4 cubre el fallback a inicial.
