---
story_id: comunify-shell-organism
brand: comunify
type: ui-story
state: refining
ronda: 1
input_spec_signed: true        # FIRMA 1 · Chris 2026-06-15 ("dale, esto es lo que quiero")
mockup_final_signed: false
open_questions_resolved: "Q1 placeholders SVG · Q2 Plataforma link-a-existente · Q3 saludo genérico (todas = recomendación, dale)"
cap_target: comunify/shell-organism
cap_change_type: new
verification_nature: funcional
---

# 01-spec · comunify-shell-organism (R-shell MVP)

> **RONDA 1 — FUNCIONAL (para FIRMA 1).** Sin mockup todavía. El mockup nace DESPUÉS de que Chris
> firme "esto es lo que quiero". Decisiones de origen: `chris-input.md` (intake 2026-06-15).

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
