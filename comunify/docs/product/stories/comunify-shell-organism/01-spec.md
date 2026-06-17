---
story_id: comunify-shell-organism
brand: comunify
type: ui-story
state: refined
ronda: 2
input_spec_signed: true        # FIRMA 1 · Chris 2026-06-15 ("dale, esto es lo que quiero")
mockup_final_signed: true      # FIRMA 2 · Chris 2026-06-15 ("firmo todo")
ratified_by_chris: true        # FIRMA 1 + FIRMA 2 = refinamiento de diseño cerrado
open_questions_resolved: "Q1 placeholders SVG · Q2 Plataforma link-a-existente · Q3 saludo genérico (todas = recomendación, dale)"
cap_target: comunify/shell-organism
cap_change_type: new
verification_nature: funcional
---

# 01-spec · comunify-shell-organism (R-shell MVP)

> **RONDA 1 — FUNCIONAL (FIRMA 1 ✓) + RONDA 2 — GENERADA (post FIRMA 2 ✓).** Las secciones § Context →
> § Prior art son la RONDA 1 firmada (intención funcional). Las secciones § Gherkin → § Accessibility (abajo)
> son la RONDA 2 **generada** a partir del § Mapa funcional firmado + el mockup FINAL (`mockups/shell.html`).
> No es una tercera firma: la FIRMA 2 autorizó el GO. Decisiones de origen: `chris-input.md` (intake 2026-06-15).

## § Context · Dónde vive

- **Módulo:** `platform`. **Cap:** `comunify/shell-organism` (planned · ADR-comunify-001).
- **Zona/caja (paradigm):** el shell-organism ES el **chrome que hospeda las 3 zonas** (Agentes · Plataforma · Infraestructura). No compite con una caja; es el contenedor. Ribbon = zona Agentes (Nina/Tomás/Sofía/Bruno/Lucía) · tab Plataforma = zona Plataforma · Luana supervisora (runtime en Infraestructura·motor-agentico).
- **Shell que aplica:** PORT del shell compartido `@luana/ui-kit/organism/shell` (ShellLayout · Ribbon · SupervisorSidebar · ChatPanel · ConfigTab · SubTabsBar · create-shell-store · routing). Re-temizado a tokens comunify (`comunify/docs/architecture/design-system.md`, morado `#7B2FF7`). El `SHELL-DESIGN-CONTRACT` de comunify se **genera** en esta story (port re-temizado de vitalia/nicolify).
- **Ruta destino:** `comunify/frontend/src/app/[tenantId]/(shell-organism)/`. Post-login el creator aterriza acá.
- **Reemplaza:** el grupo `app/(dashboard)/*` (10 áreas) se **retira del routing** (queda en git, no reachable). Se portan en stories siguientes (R-shell+1..N).
- **Cast:** ADR-comunify-001 (Luana sidebar + Nina/Tomás/Sofía/Bruno/Lucía + Plataforma).

### Out of scope (recorte explícito)

- Porte/reskin de las 10 áreas dashboard (stories siguientes).
- Ejecución de acciones de dominio por los agentes (tabs = placeholder).
- Onboarding dentro del shell (el wizard 4-step `app/onboarding/*` queda **intacto**, fuera de scope).
- Lectura de datos del tenant por Luana (solo conversa+anuncia).
- Multi-usuario / roles / permisos (comunify = single-user creator).
- Lift del `chat-store` a `@luana` (follow-up `/pm-luana` post-prueba).

## § Mapa funcional

### 1. Happy path (narrado)

1. El creator (único usuario) inicia sesión.
2. Aterriza en `[tenantId]/(shell-organism)` — el shell nuevo (reemplaza el dashboard viejo).
3. **Luana arranca expandida** y lo saluda (chat real, LLM vía core copilot).
4. A la derecha ve el **Ribbon**: Nina · Tomás · Sofía · Bruno · Lucía + tab Plataforma. **Nina activa** por default; el panel muestra **"Próximamente"**.
5. El creator le escribe a Luana. Luana **conversa** (entiende la intención) y para cualquier tarea concreta **anuncia la delegación**: *"eso lo va a hacer Nina/Sofía… próximamente"*. **No ejecuta** acciones ni lee datos del tenant.
6. El creator puede: cambiar de tab (todas placeholder salvo Plataforma mínima), colapsar/expandir Luana (rail / history / full), abrir Config (Plataforma).
7. Cada turno con Luana deja **traza** (`copilot_trace_event`) — write real para el DoD.

### 2. Bifurcaciones (árbol)

```
Entrada al shell
├─ ¿autenticado?
│   ├─ no → redirect a sign-in                                  [SC-auth]
│   └─ sí → ¿tenant resuelto? (useTenantId, NO Clerk org)
│         ├─ no/!match → estado error tenant / redirect          [SC-tenant]
│         └─ sí → render shell en [tenantId]/(shell-organism)     [SC-happy]
├─ Luana (sidebar) — estado del panel
│   ├─ full (default landing) → chat completo                    [SC-luana-full]
│   ├─ collapsed → rail de íconos                                [SC-luana-rail]
│   └─ history → lista de conversaciones                         [SC-luana-history]
├─ Mensaje a Luana
│   ├─ LLM responde (stream SSE) → burbuja + traza               [SC-chat-ok]
│   ├─ intención = tarea de agente → Luana anuncia "próximamente"[SC-chat-delegate]
│   ├─ LLM error / 5xx → estado error + reintentar               [SC-chat-error]
│   └─ red caída / timeout → estado red + reintentar             [SC-chat-network]
├─ Click en tab de agente (Nina/Tomás/Sofía/Bruno/Lucía)
│   └─ panel → "Próximamente" (empty-state navegable)            [SC-tab-placeholder]
└─ Click en tab Plataforma
    └─ vista mínima (acceso/config) — sin features nuevas        [SC-plataforma-min]
```

### 3. Reglas de negocio (RN)

- **RN-1 · Single-user:** comunify = un solo usuario (el creator). Sin role-gating, nunca. El shell muestra todo el Ribbon.
- **RN-2 · Tenant isolation:** el `tenant_id` sale de `useTenantId()` (iam), **NUNCA** de Clerk org (`.claude/rules/tenant-isolation.md`). Toda llamada lleva `X-Tenant-ID`.
- **RN-3 · Luana no ejecuta:** en el MVP Luana solo conversa + anuncia delegación. **Sin tools de dominio registradas** → no puede ejecutar acciones ni leer datos del tenant.
- **RN-4 · Consume, no mirror:** el shell consume `@luana/ui-kit/organism/shell` vía import. Prohibido recrear/copiar componentes del shell (anti-duplication). comunify aporta solo wrapper + config (cast/colores/nav-tree) + chat-store.
- **RN-5 · Reemplazo:** el grupo `(dashboard)` viejo no es reachable post-merge. Post-login → shell.
- **RN-6 · Spanish neutro:** todo el copy user-facing en español neutro LatAm (sin voseo).
- **RN-7 · Engine único:** Luana consume `core/luana-core-copilot /chat` (no se construye motor nuevo).

### 4. Criterios de aceptación (AC)

- **AC-1** · Post-login el creator aterriza en el shell (`[tenantId]/(shell-organism)`), Luana expandida saludando, Ribbon con Nina activa.
- **AC-2** · El chat de Luana es real: mensaje → respuesta del LLM (stream) → traza en `copilot_trace_event` (verificable live, DoD #37).
- **AC-3** · Luana conversa y **anuncia delegación** para tareas concretas; no ejecuta ni lee datos del tenant.
- **AC-4** · Los 5 agentes + tab Plataforma se ven en el Ribbon; las tabs de agente muestran "Próximamente"; Plataforma muestra vista mínima.
- **AC-5** · El shell consume `@luana/ui-kit` (cero mirror); tokens comunify aplicados (morado/azul).
- **AC-6** · El dashboard viejo (`(dashboard)`) ya no es reachable; el wizard onboarding sigue intacto.
- **AC-7** · Luana soporta colapsar/expandir (rail/history/full) + navegación por teclado (heredado del kit).
- **AC-8** · Higiene (T-0): comunify/frontend sin lockfile redundante (root pnpm-lock SSoT) + `next-env.d.ts` trackeado + deps `@luana/*` declaradas + `pnpm install` verde.

## § Pantallas (tabla de campos · SIN mockup todavía)

| Pantalla / zona | Elementos | Dato / origen | Estado(s) |
|---|---|---|---|
| **Shell layout** | 2 paneles + splitter (Luana izq / App der) | `create-shell-store` (@luana) | collapsed / narrow / 50-50 |
| **Luana sidebar (chat)** | header (avatar Luana + estado) · lista mensajes · composer | `chat-store` real comunify → SSE `core copilot /chat` | full / rail / history · idle / streaming / error / network |
| **Ribbon (N1)** | 5 RibbonTab (Nina/Tomás/Sofía/Bruno/Lucía) + ConfigTab (Plataforma) | cast ADR-comunify-001 (slugs/colores) | Nina activa default |
| **Panel de tab agente** | empty-state "Próximamente" | estático | placeholder navegable |
| **Tab Plataforma** | vista mínima (acceso / config) | mínimo MVP | placeholder/mínimo |
| **TopBar** | logo comunify + theme + (tenant, si aplica) | brand tokens | — |

> Campos finos de cada tab, microcopy exacto, estados visuales y átomos finales = se cementan en el **mockup FINAL (FIRMA 2)**. Acá solo el esqueleto funcional.

## § Dudas (open questions para Chris)

- **Q1** · Avatar de Luana + de los 5 agentes en el MVP = placeholders SVG (reemplazo 1:1 cuando los tengas). ¿OK?
- **Q2** · Tab Plataforma "mínima": ¿mostramos algo concreto (link a config de cuenta existente) o un placeholder "Próximamente" como las tabs de agente? (recomiendo: link a lo que ya exista de acceso/config; si no hay, placeholder).
- **Q3** · ¿El system prompt de Luana debe conocer el contexto del creator (nombre, etapa) para saludar personalizado, o saludo genérico en MVP? (recomiendo: genérico en MVP; personalización = cuando lea datos, story futura — RN-3).

## § Prior art applied

- **Engine consumed:** `core/luana-core-copilot` (`POST /chat` SSE, deep-agent, observabilidad) — comunify lo monta thin en `/api/v1/comunify/copilot`. Cero engine build.
- **Consumed from @luana:** `@luana/ui-kit/organism/shell` (ShellLayout, Ribbon, SupervisorSidebar, ChatPanel, ConfigTab, SubTabsBar, create-shell-store, routing, keyboard shortcuts) — import, no mirror.
- **Reused pattern from:** nicolify `app/[tenantId]/(shell-organism)` + `SHELL-DESIGN-CONTRACT.md` (wrapper fino) · vitalia idem (port re-temizado).
- **Learnings aplicados:** `no-clerk-organizations` (tenant via `useTenantId`) · ADR-vitalia-006 (SSR-safe store · skeleton store-free) · Next 16 soft-nav redirect (edge-redirect, no `redirect()` in-render).
- **Lift candidate detectado:** el `chat-store` real (SSE consumer) → escalar `/pm-luana` para lift a `@luana` (lo consumirán vitalia/nicolify reemplazando sus mocks).
- **Net-new justificado:** wrapper comunify + config (cast/colores/nav-tree) — instancia de marca, no recreación.

---

# RONDA 2 — GENERADA (post FIRMA 2)

> Formaliza el § Mapa funcional firmado + el mockup FINAL. Cada SC cita los `Bif-N`/`RN-N`/`AC-N` que cubre.
> `verification_nature: funcional` → cada SC funcional FE lleva `playwright_required: true` + verificación REAL
> (acción ejercida + efecto observado + log, NUNCA "GET 200" — `.claude/rules/definition-of-done-live-verify.md`).

## § Gherkin scenarios

### Base (4 · AI-resistant)

**SC-happy** · `happy` · `playwright_required: true` · Covers: [Bif SC-happy, AC-1]
```gherkin
Given un creator autenticado con tenant resuelto vía useTenantId (no Clerk org)
When entra a /[tenantId]/(shell-organism)
Then aterriza en el shell: Luana sidebar en estado full saludando + Ribbon visible con la tab "Mi Marca" (Nina) activa + panel de tab en "Próximamente"
And el grupo (dashboard) viejo NO renderiza
```
- graders:
  - `{ type: e2e, path: "comunify/frontend/e2e/regression/comunify-shell-organism/shell-happy.spec.ts" }`
  - `{ type: visual_state, screen: "shell-landing", element: "aside[aria-label=Luana]", expect: "visible, estado full" }`
  - `{ type: visual_state, screen: "shell-landing", element: "[role=tab][data-slug=nina]", expect: "aria-selected=true, ring agent-nina" }`

**SC-chat-ok** · `happy` (write real · DoD #37) · `playwright_required: true` · Covers: [Bif SC-chat-ok, AC-2, RN-7]
```gherkin
Given el creator en el shell con Luana en full
When escribe "Hola" y envía
Then aparece su burbuja + la respuesta de Luana llega por stream SSE desde core copilot (/api/v1/comunify/copilot/chat)
And se escribe una fila en copilot_trace_event scoped al tenant del creator
```
- graders:
  - `{ type: e2e, path: ".../shell-chat-ok.spec.ts" }`
  - `{ type: state_check, target: db, query: "SELECT count(*) FROM copilot_trace_event WHERE tenant_id = :tid AND created_at > :t0", expect: ">= 1" }`
  - `{ type: live_verify, action: "enviar mensaje en dev-app autenticado", observed: "burbuja stream + fila trace + sin traceback en backend log" }`

**SC-chat-error** · `negative` · `playwright_required: true` · Covers: [Bif SC-chat-error]
```gherkin
Given el creator en el shell
When envía un mensaje y el core copilot responde 5xx (o el deep-agent falla)
Then el chat muestra estado de error inline con acción "Reintentar" + no se rompe el shell (sin overlay Next, sin pageerror)
And reintentar re-dispara el request sin perder el mensaje del usuario
```
- graders:
  - `{ type: e2e, path: ".../shell-chat-error.spec.ts (mock 500 en /copilot/chat)" }`
  - `{ type: visual_state, screen: "chat-error", element: "[data-testid=chat-error]", expect: "visible + botón Reintentar" }`

**SC-adversarial-tenant** · `adversarial` (cross-tenant) · `playwright_required: true` · Covers: [Bif SC-tenant, RN-2]
```gherkin
Given el creator del tenant A autenticado
When intenta cargar el shell de /[tenantB]/(shell-organism) o forjar X-Tenant-ID = B
Then el backend resuelve el tenant del usuario (iam), no del path/header arbitrario; no ve conversaciones ni trazas del tenant B (404/redirect, sin hint de existencia)
```
- graders:
  - `{ type: e2e, path: ".../shell-tenant-isolation.spec.ts" }`
  - `{ type: state_check, target: api, query: "GET conversaciones con tenant ajeno", expect: "404, cero filas del tenant B" }`

### Sub-categorías mandatory

**SC-chat-delegate** · `edge` (comportamiento núcleo) · `playwright_required: true` · Covers: [Bif SC-chat-delegate, RN-3, AC-3]
```gherkin
Given el creator en el shell
When le pide a Luana una tarea concreta de dominio (ej. "lanzá un cohort", "creá una oferta")
Then Luana responde conversando + muestra el DelegateMarker ("delega en {agente} · {función}") y anuncia que ese panel "llega pronto"
And NO se ejecuta ninguna acción de dominio ni se lee data del tenant (sin tools de dominio registradas)
```
- graders:
  - `{ type: e2e, path: ".../shell-chat-delegate.spec.ts" }`
  - `{ type: visual_state, screen: "chat-delegate", element: "[data-testid=delegate-marker]", expect: "visible, color del agente destino" }`
  - `{ type: state_check, target: db, query: "tablas de dominio (offer/cohort/community)", expect: "sin filas nuevas tras el turno" }`

**SC-chat-network** · `network_failure` · `playwright_required: true` · Covers: [Bif SC-chat-network]
```gherkin
Given el creator envía un mensaje
When la red cae / el stream SSE expira por timeout
Then el chat muestra estado de red ("Se perdió la conexión") + acción "Reintentar"; el shell no crashea
```
- graders: `{ type: e2e, path: ".../shell-chat-network.spec.ts (route.abort)" }`

**SC-tab-placeholder** · `empty_state` · `playwright_required: true` · Covers: [Bif SC-tab-placeholder, AC-4]
```gherkin
Given el creator en el shell
When hace click en cualquier tab de agente (Atraer/Vender/Operar/Retener) o sub-tab
Then el panel muestra el empty-state navegable "{Sub-tab} · Próximamente" + CTA "Hablar con Luana" + nota "Se portará en una próxima entrega"
And el click enfoca el composer de Luana (CTA) sin romper navegación
```
- graders:
  - `{ type: e2e, path: ".../shell-tab-placeholder.spec.ts" }`
  - `{ type: visual_state, screen: "tab-placeholder", element: "[data-testid=coming-soon]", expect: "título + Próximamente + CTA" }`

**SC-luana-states** · `edge` (recovery/persistencia UI) · `playwright_required: true` · Covers: [Bif SC-luana-full/rail/history, AC-7]
```gherkin
Given el creator en el shell con Luana en full
When colapsa (rail), abre historial (history) y vuelve a expandir (full) — por click o atajo de teclado (C/R/F)
Then cada estado renderiza su layout (rail = íconos · history = lista de conversaciones · full = chat) y el estado se mantiene al navegar entre tabs
```
- graders:
  - `{ type: e2e, path: ".../shell-luana-states.spec.ts" }`
  - `{ type: axe, ruleset: "wcag2aa" }`

**SC-a11y** · `accessibility` · `playwright_required: true` · Covers: [AC-7, RN-6]
```gherkin
Given el shell renderizado
When un usuario navega solo con teclado / lector de pantalla
Then Ribbon expone role=tablist con tabs enfocables (Tab order lógico) + aside Luana role=complementary aria-label="Luana" + composer con label accesible
And el contraste de texto cumple WCAG AA (≥4.5:1) en tema claro y oscuro
```
- graders:
  - `{ type: axe, ruleset: "wcag2aa", scope: "shell-landing + chat + tab-placeholder" }`
  - `{ type: e2e, path: ".../shell-a11y-keyboard.spec.ts (Tab nav + focus-visible ring)" }`

**SC-i18n** · `i18n` · `playwright_required: true` · Covers: [RN-6]
```gherkin
Given el shell con todo su copy
When se renderiza en español neutro LatAm
Then no hay voseo (vos/sos/tenés/escribí) ni léxico regional; tildes + ñ + apertura ¿! correctas
And no hay strings de currency (MVP sin montos); el copy del § Microcopy es el único user-facing
```
- graders:
  - `{ type: e2e, path: ".../shell-i18n-neutro.spec.ts (assert copy del § Microcopy)" }`
  - `{ type: grep, target: "comunify/frontend/src/.../(shell-organism)", expect: "0 matches voseo (pre-commit §1)" }`

**SC-chat-double-send** · `race_condition` · `playwright_required: true` · Covers: [RN-3, AC-2]
```gherkin
Given el creator escribe un mensaje
When envía dos veces rápido (doble Enter / doble click en enviar) mientras el stream está en curso
Then el composer se bloquea durante el streaming (un solo request en vuelo); no se duplica el mensaje ni la fila de traza
```
- graders:
  - `{ type: e2e, path: ".../shell-chat-double-send.spec.ts" }`
  - `{ type: state_check, target: db, query: "filas copilot_trace_event del turno", expect: "exactamente 1, sin duplicado" }`

**SC-luana-history-empty** · `empty_state` · `playwright_required: true` · Covers: [Bif SC-luana-history]
```gherkin
Given un creator sin conversaciones previas
When abre el historial de Luana (estado history)
Then ve un empty-state ("Aún no hay conversaciones") en vez de una lista vacía rota
```
- graders: `{ type: visual_state, screen: "luana-history-empty", element: "[data-testid=history-empty]", expect: "visible" }`

**SC-plataforma-min** · `happy` (placeholder) · `playwright_required: true` · Covers: [Bif SC-plataforma-min, Q2]
```gherkin
Given el creator en el shell
When abre la tab Plataforma
Then ve la vista mínima (sub-tabs Conexiones/Cuenta/Onboarding como "Próximamente"); "Onboarding" enlaza al wizard 4-step existente (intacto), sin features nuevas
```
- graders: `{ type: e2e, path: ".../shell-plataforma-min.spec.ts" }`

**SC-auth** · `negative` (security) · `playwright_required: true` · Covers: [Bif SC-auth]
```gherkin
Given un visitante NO autenticado
When intenta abrir /[tenantId]/(shell-organism)
Then es redirigido a sign-in (edge-redirect / middleware, no redirect() in-render — learning Next 16 soft-nav)
```
- graders: `{ type: e2e, path: ".../shell-auth-redirect.spec.ts" }`

**SC-dashboard-unreachable** · `edge` (reemplazo) · `playwright_required: false` (verificación de routing) · Covers: [Bif SC-happy, RN-5, AC-6]
```gherkin
Given el shell mergeado
When el creator navega a una ruta del grupo (dashboard) viejo
Then la ruta ya no es reachable (retirada del routing); post-login el destino es el shell. El wizard onboarding (app/onboarding/*) SÍ sigue intacto
```
- graders:
  - `{ type: grep, target: "comunify/frontend/src/app", expect: "(dashboard) fuera del routing alcanzable; onboarding intacto" }`
  - `{ type: e2e, path: ".../shell-replace-dashboard.spec.ts" }`

### Sub-categorías no aplicables (propuesto · ratificación de Chris en el handoff)

| Sub-categoría | not_applicable_reason |
|---|---|
| `concurrent_users` | comunify = **single-user brand** (RN-1) + el MVP **no tiene list/detail filtrable** (tabs = placeholder). La dimensión multi-tenant sí se cubre en `SC-adversarial-tenant`. |
| `large_dataset` | El MVP **no tiene list paginada**. El único stream de datos es el historial de chat (scroll simple, sin pagination). Aplicará cuando se porten las áreas dashboard (R-shell+1..N). |

## § Matriz de cobertura

| Ítem (Mapa funcional) | Tipo | Cubierto por | Verificación REAL (acción + efecto) |
|---|---|---|---|
| Bif SC-auth | branch | SC-auth | Visitante anónimo abre la ruta → redirect a sign-in (no render del shell) |
| Bif SC-tenant | branch | SC-adversarial-tenant | Forjar tenant ajeno → backend resuelve tenant del user (iam) → 404, cero filas del tenant B |
| Bif SC-happy | branch | SC-happy, SC-dashboard-unreachable | Login → render shell con Luana full + Nina activa; ruta `(dashboard)` no reachable |
| Bif SC-luana-full | branch | SC-luana-states, SC-happy | Landing renderiza estado full (chat completo) |
| Bif SC-luana-rail | branch | SC-luana-states | Colapsar (C) → rail de íconos; estado persiste al cambiar tab |
| Bif SC-luana-history | branch | SC-luana-states, SC-luana-history-empty | Abrir historial (R) → lista; sin conversaciones → empty-state |
| Bif SC-chat-ok | branch | SC-chat-ok | Enviar mensaje → stream SSE + **fila en copilot_trace_event** (write real DoD) |
| Bif SC-chat-delegate | branch | SC-chat-delegate | Pedir tarea de dominio → DelegateMarker + "llega pronto" + **cero filas de dominio nuevas** |
| Bif SC-chat-error | branch | SC-chat-error | Forzar 5xx del copilot → estado error + Reintentar, shell sin crash |
| Bif SC-chat-network | branch | SC-chat-network | Abortar red/stream → estado de red + Reintentar |
| Bif SC-tab-placeholder | branch | SC-tab-placeholder | Click tab agente → empty-state "Próximamente" + CTA enfoca composer |
| Bif SC-plataforma-min | branch | SC-plataforma-min | Abrir Plataforma → vista mínima; "Onboarding" → wizard existente |
| RN-1 · single-user | rule | SC-happy | El Ribbon completo se muestra sin role-gating (no hay gate que oculte tabs) |
| RN-2 · tenant via useTenantId | rule | SC-adversarial-tenant | Toda llamada lleva X-Tenant-ID de iam; tenant ajeno → 404 sin leak |
| RN-3 · Luana no ejecuta | rule | SC-chat-delegate, SC-chat-double-send | Tras turnos de chat → tablas de dominio sin cambios; sin tools de dominio registradas |
| RN-4 · consume, no mirror | rule | (auditor Cat 12 + arch-test) | Grep: shell importa de `@luana/ui-kit`; cero copia de componentes del kit en comunify |
| RN-5 · reemplazo | rule | SC-dashboard-unreachable | Ruta `(dashboard)` no alcanzable; post-login → shell |
| RN-6 · spanish neutro | rule | SC-i18n | Render del copy → 0 voseo (pre-commit §1) + tildes/ñ correctas |
| RN-7 · engine único | rule | SC-chat-ok | El stream viene de `core/luana-core-copilot /chat` montado thin (no motor nuevo) |
| AC-1 | accept | SC-happy | Landing observable: Luana full + Nina activa |
| AC-2 | accept | SC-chat-ok, SC-chat-double-send | Mensaje → respuesta stream + traza (sin duplicado en doble-envío) |
| AC-3 | accept | SC-chat-delegate | Conversa + anuncia delegación; no ejecuta |
| AC-4 | accept | SC-tab-placeholder | 5 agentes + Plataforma en Ribbon; tabs agente → "Próximamente" |
| AC-5 | accept | SC-happy + (auditor RN-4) | Shell consume `@luana/ui-kit`; tokens comunify (morado/azul) aplicados |
| AC-6 | accept | SC-dashboard-unreachable | `(dashboard)` no reachable; wizard onboarding intacto |
| AC-7 | accept | SC-luana-states, SC-a11y | Colapsar/expandir + navegación por teclado (heredado del kit) |
| AC-8 | accept | (Ticket-0 hygiene · gate de build) | `pnpm install` verde + sin lockfile redundante + next-env trackeado + deps `@luana/*` |

**Huecos detectados (Bif/RN sin SC):** ninguno.
**SC huérfanos (SC sin ítem del mapa):** ninguno.

> Nota: RN-4 (no mirror) y AC-8 (higiene) se verifican por gate de build/auditor (Cat 12 mirror scan + arch-test + `pnpm install`), no por Playwright — son arquitectura/higiene, no comportamiento de UI. Quedan ligados acá para no dejarlos huérfanos.

## § Estados visuales

### Luana sidebar (chat)

| Estado | Trigger | Componentes visibles | Componentes ocultos |
|---|---|---|---|
| `full` (landing) | Post-login / expandir (F) | ChatHeader (avatar Luana + "Orquestadora · en línea" + StatusDot) · ChatMessages · starters · ChatComposer | rail, history |
| `rail` | Colapsar (C) | SupervisorCollapsedStrip (íconos) | mensajes, composer |
| `history` | Abrir historial (R) | HistoryGroup/HistoryItem (lista de conversaciones) | chat activo |
| `streaming` | Mensaje enviado | TypingIndicator + burbuja en progreso · composer **bloqueado** | starters |
| `error` | Copilot 5xx | banner error inline + "Reintentar" | TypingIndicator |
| `network` | Red caída / timeout | banner "Se perdió la conexión" + "Reintentar" | TypingIndicator |
| `history-empty` | history sin datos | EmptyState "Aún no hay conversaciones" | lista |

### Ribbon (N1) + SubTabsBar (N2)

| Estado | Trigger | Visible |
|---|---|---|
| `tab-active` | Tab seleccionada | RibbonTab con ring del color del agente + label función (negrita color) + nombre debajo |
| `tab-idle` | No seleccionada | RibbonTab muted, hover bg |
| `subtabs` | Agente activo | SubTab pills (fondo del shell/panel) de ese agente; primera activa por default |

### Panel de tab (contenido)

| Estado | Trigger | Visible | Oculto |
|---|---|---|---|
| `placeholder` | Tab de agente / sub-tab | EmptyState: ícono color agente + "{Sub-tab} · Próximamente" + desc + CTA "Hablar con Luana" + nota "Se portará en una próxima entrega" | features reales |
| `plataforma-min` | Tab Plataforma | sub-tabs Conexiones/Cuenta/Onboarding (Onboarding → link wizard) | features nuevas |

## § Componentes (reutilizar > inventar)

> Detalle completo + paths del kit: `design-inventory.md` (goldens). Aquí el resumen reuse-vs-new.

| Componente | Origen | Reuse vs new |
|---|---|---|
| `ShellLayout` / `ShellLayoutClient` (splitter dual-mode · `dynamic({ssr:false})` boundary · skeleton store-free) | `@luana/ui-kit/organism/shell` | **reuse** (import) |
| `TopBarShell` · `SupervisorSidebar` (Luana: full/rail/history) · `ChatPanel`+`ChatMessages` · `Ribbon`/`RibbonTab` · `ConfigTab` · `SubTabsBar`/`SubSubTabsBar` | `@luana/ui-kit/organism/shell` | **reuse** |
| Moléculas: `ChatHeader` · `MessageBubble` · `TypingIndicator` · `ChatComposer` · `EmptyState`/`EmptyStateInline` · `PlaceholderCard` · `DelegateMarker` · `StatusDot` · `TogglePill` · `HistoryGroup`/`HistoryItem` · `SupervisorCollapsedStrip` | `@luana/ui-kit/organism/shell` | **reuse** |
| Átomos: `button` · `input`/`textarea` · `select` (canónico) · `badge` · `avatar` · `tooltip` · `separator` · `skeleton` · `switch` · `dropdown-menu` · `scroll-area` · `sonner` | `@luana/ui-kit` | **reuse** |
| Hooks/util: `create-shell-store` · `routing.ts` · `useKeyboardShortcuts (C/R/F)` · `useViewportGuard` | `@luana/ui-kit/organism/shell` | **reuse** |
| `AgentAvatar` (consume catálogo cast) · `LogoMark` (isotipo `Logo.png`) · `ThemeToggle` · `TenantSwitcher` (single-user → display) | comunify (derivado, thin) | **new (thin wrapper)** — instancia de marca |
| `chat-store` real (SSE → core copilot) | comunify `src/stores/chat-store.ts` | **new** · ⚠️ **LIFT CANDIDATE → `@luana`** (escalar `/pm-luana` post-prueba; vitalia/nicolify reemplazan su mock) |
| Tokens marca (`globals.css` + `tailwind.config.ts`: color + radius pill + fonts) | comunify | **new** (config) |
| Catálogo cast (`agents.ts`) + nav-tree (`shell-routes.ts`) | comunify | **new** (config · ADR-comunify-001 + navigation-tree.md) |
| Wrapper shell `app/[tenantId]/(shell-organism)/` | comunify | **new** (compone organismos del kit + inyecta config) |
| BE: mount `core copilot /chat` en `/api/v1/comunify/copilot` | comunify `backend/.../copilot/` | **new** (thin mount, cero engine) |

**Justificación de cada NEW:** todos son config/wrapper/instancia de marca (cast, colores, nav, chat-store, mount BE) — NO recreación de primitivas del kit. `chat-store` es el único net-new sustantivo y queda marcado como lift candidate.

## § Microcopy (Spanish neutro LatAm · goldens del mockup)

| Lugar | Copy |
|---|---|
| TopBar wordmark | "Comunify" |
| Luana header — rol/estado | "Orquestadora · en línea" |
| Saludo Luana (landing) | "¡Hola, {nombre}! 👋 Soy **Luana**, tu supervisora. Coordino a tu equipo: **Nina** (mi marca), **Tomás** (atraer), **Sofía** (vender), **Bruno** (operar) y **Lucía** (retener). ¿En qué estás pensando hoy?" |
| DelegateMarker | "delega en {agente} · {función}" (ej. "delega en Nina · Mi Marca") |
| Anuncio de delegación | "El diseño del cohort lo arma **Nina** (lo conecta a tu escalera de ofertas). Ese panel llega pronto. Mientras, lo pensamos: …" |
| Starters (sugeridos) | "💡 Idea de contenido" · "📊 ¿Cómo va mi semana?" · "🚀 Lanzar oferta" |
| Composer placeholder | "Escríbele a Luana…" |
| Empty-state tab (título) | "{Sub-tab} · Próximamente" |
| Empty-state tab (CTA) | "Hablar con Luana" |
| Empty-state tab (nota) | "Se portará en una próxima entrega" |
| Historial vacío | "Aún no hay conversaciones" |
| Error de chat | "Algo falló. Intenta de nuevo." + acción "Reintentar" |
| Red caída | "Se perdió la conexión." + acción "Reintentar" |
| Ribbon labels (función) | "Mi Marca" · "Atraer" · "Vender" · "Operar" · "Retener" · "Plataforma" |

**Spanish neutro check:** sin voseo (el mockup usa `escríbele`, `intenta`, `lo pensamos` — neutro/tuteo). Tildes + ñ + apertura `¿!`. Nombres de agentes y wordmark = propios (no se traducen).

## § Responsive breakpoints

- **Desktop (>1024px):** Luana sidebar `40%` (min 360 / max 540px) + App panel flex. Ribbon horizontal scrollable.
- **Tablet (768–1024px):** Luana colapsable a rail; App panel gana ancho. Ribbon mantiene labels.
- **Mobile (<768px):** Luana en `rail`/overlay (no 40% fijo); Ribbon labels → solo avatares + tooltip; SubTabsBar scroll horizontal. (Comportamiento heredado de `useViewportGuard` del kit.)

## § Accessibility

- Ribbon = `role=tablist`, cada RibbonTab `role=tab` + `aria-selected`; panel `role=tabpanel`.
- Luana = `aside role=complementary aria-label="Luana"`; composer con `<label>` accesible / `aria-label`.
- Foco visible (`focus-visible:ring-2`) en todos los controles pill; Tab order lógico (TopBar → Luana → Ribbon → SubTabs → contenido).
- Atajos de teclado C/R/F (colapsar/historial/full) heredados del kit, anunciados por tooltip.
- Contraste ≥ 4.5:1 texto / ≥ 3:1 UI, verificado en claro y oscuro (tokens, bordes vía `--line` adaptan a tema — sin blancos hardcodeados).
- StatusDot ("en línea") + estados de error/red con texto, no solo color.

## § Telemetría

```yaml
events:
  - { name: "shell_landed", trigger: "shell mount post-login", props: ["tenant_id"] }
  - { name: "luana_message_sent", trigger: "composer submit", props: ["len"] }
  - { name: "luana_delegate_announced", trigger: "respuesta con DelegateMarker", props: ["agent_slug"] }
  - { name: "ribbon_tab_clicked", trigger: "click RibbonTab", props: ["agent_slug", "subtab"] }
  - { name: "coming_soon_viewed", trigger: "render empty-state tab", props: ["agent_slug", "subtab"] }
```
> Traza de producto agéntico (`copilot_trace_event`) la emite el core copilot — es el write del DoD, no se duplica acá.
