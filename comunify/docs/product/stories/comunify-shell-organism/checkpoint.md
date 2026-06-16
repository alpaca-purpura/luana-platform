---
brand: comunify
story_id: comunify-shell-organism
module: platform
state: blocked
phase: BLOCKED_T_AGENTIC_LIVE_VERIFY
story_type: ui-mixed          # FE shell + AGENTIC copilot mount + HYGIENE(config)
created: 2026-06-15
last_updated: 2026-06-16
parallel_safe: true
owner: /architect
next_handoff: /dev-team comunify T-0 (hygiene) → T-agentic (flagship) → T-tokens/T-shell/T-chat-store → T-e2e
surface: [frontend, agentic, hygiene]
estimated_size: L
cap_target: comunify/shell-organism
cap_change_type: new
verification_nature: funcional
demo_required: true
autonomous_mode: true         # Chris ratificó run autónomo end-to-end ("arrancá /dev-team hasta el done", 2026-06-16) → G chris-verify exento; auditor live-verify + dod_evidence sustituye el demo G
cast_ratified: true   # ADR-comunify-001-agentes-cast (Chris 2026-06-15)
input_spec_signed: true    # FIRMA 1 funcional (Chris 2026-06-15)
mockup_final_signed: true  # FIRMA 2 final (Chris 2026-06-15 "firmo todo")
artifacts:
  - ADR-comunify-001-agentes-cast.md (cast cementado)
  - 01-spec.md (RONDA 1 funcional · FIRMA 1 + FIRMA 2)
  - navigation-tree.md (sitemap v2 ratificado)
  - mockups/shell.html (mockup FINAL firmado · localhost:8893)
  - design-inventory.md (tokens/átomos/moléculas/organismos · goldens dev-team)
  - 03-arch.md (consolidado FE+AGENTIC+HYGIENE · § Prior art audit · § Integration design CONN · Resolución 5 puntos)
  - 03-arch-fe.md · 03-arch-agentic.md (per-surface slices)
  - 04-validators.yaml (5 cat · scenario_coverage 15 SC · playwright_visual_scope · dev_app_verified)
  - 05-guidelines.md (must_load_skills · patterns req/prohibidos · files-in-scope)
  - 06-tickets.yaml (T-0..T-e2e · 6 tickets · assignment R23 flagship agentic · DAG)
  - dispatch-plan.md (autonomous_mode:false · matrix · DAG · visual scope · live-verify)
---

# Comunify — Shell-organism migration (R-shell · MVP)

## Spark

Comunify es la **única brand activa todavía en el paradigma dashboard viejo**. Su frontend
(`app/(dashboard)/{authority,cohorts,community,offers,ladder,subscriptions,voice,brand-studio,community-audit}`,
28 `page.tsx`, 10 áreas) shipped 2026-05-20 y **nunca migró al shell-organism agéntico** que nicolify
+ vitalia ya tienen. Consume **cero** `@luana/*` (nicolify consume 6: ui-kit, design-tokens, format,
hooks, schemas, api-client). No tiene shell-organism, ni routing `[tenantId]/(shell-organism)`, ni
features per-agente, ni skill `comunify-design-system`. Viola PARADIGM.md (trabajadores sobre un
sistema · mapa = 3 zonas · Ribbon de especialistas + supervisora).

Esta story levanta el **shell-organism MVP** de comunify: chrome consumiendo `@luana/ui-kit`
(incl. `organism/shell` ya lifteado 2026-06-11 — **consumir, NO mirror de nicolify**, anti-duplication),
routing tenant-scoped, nav de 3 zonas, Ribbon del cast comunify, sidebar supervisora, Config. Las 10
áreas dashboard se portan en stories siguientes (R-shell+1..N) — esta deja el shell **levantado** y
las tabs como shell/placeholder.

## Why now

- Chris pidió alinear comunify con la nueva base metodológica + de UI (sync con main hecho: wip/comunify 0/35 vs origin/main, HEAD 7501136e).
- nicolify/vitalia ya migraron; comunify es el rezagado → riesgo de mirror cuando se toque cualquier UI.
- El shell chrome compartido ya está en `@luana/ui-kit/organism/shell` (proposal migrated) → ventana óptima para consumir, no recrear.
- Backend agentic comunify ya existe (4 tools + 4 guardrails vía EP) — las acciones que los agentes invocan ya están; falta la cara (shell + cast).

## Decisiones de Chris (intake-handshake 2026-06-15 — ver chris-input.md)

1. **Path = Historia SDD completa** (refine → arch → build → audit → DoD live-verify). No spike.
2. **Drift cleanup = ahora**, plegado como **Ticket-0 hygiene** (con `pnpm install`-verify, no blind-delete):
   alinear lockfiles a vitalia (= sin lockfile frontend; root `pnpm-lock.yaml` es SSoT → quitar
   `comunify/frontend/{package-lock.json,pnpm-lock.yaml}`) + trackear `comunify/frontend/next-env.d.ts`
   (como nicolify/vitalia) + declarar deps `@luana/*` en `comunify/frontend/package.json`.
3. **Cast = comunify-específico** (personas propias creator economy, como nicolify con Abel/Brenda)
   → requiere ADR-comunify + catálogo ANTES de la UX del Ribbon. **BLOCKER de refining.**
4. **Scope = MVP shell + features stub** (esta story = shell up; features portados incremental).

## Scope hint (alcance probable, /po-ux lo refina)

**In scope (R-shell MVP)**
- T-0 hygiene: lockfiles + `next-env.d.ts` + deps `@luana/*` (con `pnpm install` verde).
- T-1 consumir `@luana/ui-kit` (incl. `organism/shell`) — reskin tokens comunify (morado `#7B2FF7` + azul).
- T-2 routing `app/[tenantId]/(shell-organism)/` (tenant-scoped, como nicolify/vitalia).
- T-3 Ribbon del cast comunify + sidebar supervisora (Luana orquestadora).
- T-4 nav 3 zonas (Agentes · Plataforma · Infraestructura) + Config tab.
- Tabs de agente = shell/placeholder (las 10 áreas dashboard se montan/portan después).

**Out of scope (stories siguientes R-shell+1..N)**
- Portar `(dashboard)/{authority,cohorts,community,offers,ladder,subscriptions,voice,brand-studio,community-audit}` a sus homes de agente.
- Retiro final del grupo `(dashboard)` viejo (se hace cuando todas las áreas migraron).

## Prior art / coordinación (de /pm-luana)

- Shell chrome compartido: `core/@luana/ui-kit/src/organism/shell` — **consumir vía import** (proposal ya migrated; NO nueva proposal).
- Referencia de port: `nicolify/frontend/src/app/[tenantId]/(shell-organism)/` + `nicolify/frontend/src/components/shared/shell-organism/` + skill `nicolify-design-system`.
- comunify necesita su propio skill `comunify-design-system` (nicolify/vitalia lo tienen; comunify no).
- Tokens comunify: `comunify/docs/architecture/design-system.md` (SSoT visual).

## Cast ratificado (ADR-comunify-001 · 2026-06-15)

Sidebar: **Luana** (supervisora+orquestadora+onboarding). Ribbon: **Nina** (estratega) ·
**Tomás** (atraer) · **Sofía** (vender) · **Bruno** (operar) · **Lucía** (retener) + tab **Plataforma**.
Mapeo 1:1 a cadena de valor canónica (vitalia/nicolify). Detalle: `ADR-comunify-001-agentes-cast.md`.

## Next action — ⛔ BLOQUEADA (decisión de Chris)

**Build autónomo corrió T-0→T-shell GREEN; se BLOQUEÓ en la live-verify de T-agentic (DoD #37).**

| Ticket | Estado | Commit |
|---|---|---|
| T-0 hygiene | ✅ done | `69852b1d` |
| T-tokens | ✅ done | `144c05d8` |
| T-agentic (BE mount) | ⚠️ committed PERO **rompe boot live** | `3b6670ba` (+ guard) |
| T-chat-store SSE | ✅ done | `ef3279e8` |
| T-shell wrapper | ✅ done | `1ab5a11a` |
| T-e2e + live-verify | ⛔ no arrancó (bloqueado) | — |

### ⛔ Blocker (arquitectura · root cause anclado en logs)

El thin-mount del engine `/chat` (`from luana_core_copilot.api.chat import router`) **rompe el boot del BE comunify**:
importar `chat.py` arrastra `luana_core_platform.core.rate_limit` → instancia eager el **Settings monolítico legacy**
(`luana_core_platform.core.config.Settings` "Visionarias Brain": `POSTGRES_HOST/PORT/USER/PASSWORD/DB`,
`WHATSAPP_*`, `TRAEFIK_NETWORK`, `DOMAIN_NAME`, `API_SECRET_KEY`, `QDRANT_URL`). comunify está configurado al
estilo **multibrand** (`DATABASE_URL`, `QDRANT_HOST/PORT`, `LITELLM_*`) y NO provee esas vars → `pydantic
ValidationError` en boot → `ModuleNotFoundError`/crash → BE caído (health 000).

**Por qué los tests verdes no lo cazaron:** native pytest (root `.venv` + conftest env) pasó 312 BE; el
contenedor docker (venv en volumen `comunify_backend_venv`, sin la dep + sin la env legacy) crasheó. Es el
valor exacto del DoD #37 (verde ≠ booteable live).

**El supuesto del architect fue erróneo:** "vitalia YA monta el router copilot del engine → compatibilidad
probada" — **falso**. NINGÚN brand thin-montea `luana_core_copilot.api.chat`. **vitalia escribe sus PROPIAS
rutas copilot** (`src/modules/vitalia/copilot/api/routes/wizard_onboarding_routes.py`) usando el orquestador
del engine con la config del brand. Ese es el patrón establecido. El engine `/chat` router no es
brand-mountable como está (acopla el legacy "Visionarias Brain" config).

**Mitigación aplicada (un-brick):** el mount en `comunify/backend/src/main.py` quedó **guardado**
(try/except + warning structlog) → BE bootea de nuevo (health 200), endpoint `/copilot/chat` = 404 (no
montado). Stack comunify usable. arch suite 144 passed, ruff clean.

### Decisión que necesito de Chris (opciones)

- **(A) Re-architect T-agentic al patrón vitalia** (recomendado): comunify escribe su propia ruta
  `copilot/api` (FastAPI route) que usa `CopilotOrchestrator` del engine con la config multibrand de comunify,
  sin arrastrar el Settings legacy. Re-abre la story (T-agentic v2), corrige el ready package. Es el patrón
  probado; cae en `/architect` (Carril C' — feature/arquitectura, no fix mecánico).
- **(B) Engine fix vía `/pm-luana`** (durable, más grande): el engine expone un chat-router brand-mountable
  (config lazy / factory que toma la config del brand). Promotion proposal. Desbloquea a TODOS los brands.
- **(C) Proveer la env legacy a comunify** (NO recomendado): acoplar comunify al config "Visionarias Brain"
  (`POSTGRES_*`+`WHATSAPP_*`+`TRAEFIK`+`QDRANT_URL` dummies). Brittle + va contra el modelo multibrand;
  además el runtime necesitaría Qdrant+LLM+tenant seedeado para que el chat realmente fluya.

**Recomendación: (A)** para esta story (rápido, patrón probado) + abrir (B) como proposal `/pm-luana` aparte
(deuda del engine). El resto del shell (FE: tokens+wrapper+routing+chat-store) está construido y verde —
solo le falta un endpoint copilot booteable detrás.

**Otros pendientes para el done (post-desbloqueo):** tenant comunify seedeado + LiteLLM gateway corriendo
(para el write real SC-chat-ok) + T-e2e (15 SC) + auditor + merge.

---

### Histórico (ready package · /architect)

READY PACKAGE CERRADO ✓ (2026-06-16 · `/architect`) · `refined → ready` ✓.
Paquete: `03-arch.md` (+ `03-arch-{fe,agentic}.md`) + `04-validators.yaml` + `05-guidelines.md` + `06-tickets.yaml` + `dispatch-plan.md`.

**6 tickets (DAG):** T-0 hygiene (blocks FE) → T-agentic (BE mount · **flagship R23 HARD**) ∥ T-tokens → T-shell ∥ T-chat-store → T-e2e (DoD #37).

**Decisiones clave del architect:**
- **Mount copilot:** thin `include_router` del engine `/chat` en `/api/v1/comunify/copilot` + deps `luana-core-{copilot,iam,platform}`. CONSUME, cero engine build. comunify es el 1er brand en cablear el sidebar→engine. RN-3 por construcción (copilot comunify sin `tools/` de dominio).
- **Radius pill (TOKEN-DRIVEN):** controles `rounded-full` (clase literal, ya en el kit) + cards/burbujas `--radius-lg`; `--radius` se mantiene 0.75rem. **Cero `/pm-luana` kit-fix por radius** (el kit ya pinta los controles pill por clase). Si en build un control lee `--radius` y se ve cuadrado → flag `/pm-luana` (no se parchea per-componente).
- **chat-store SSE real** = único net-new sustantivo · ⚠️ **LIFT CANDIDATE → @luana** (proposal `/pm-luana` POST-prueba; NO en esta story).
- **Routing:** edge-redirect (`proxy.ts`, no `redirect()` in-render) + `useTenantId` (iam, no Clerk org) + SSR-safe kit store. `(dashboard)` retirado del routing; `onboarding` intacto.

**Open questions (no bloquean):** OQ-1 Tailwind content debe incluir path del kit (footgun visual) · OQ-2 ADR shell comunify diferido (esta = origen) · OQ-3 skill comunify-design-system no existe (follow-up) · OQ-5 chat-store lift post-merge.

⚠️ **N/A confirmado:** `concurrent_users` + `large_dataset` (single-user + sin list paginada MVP) — honrado en 04-validators.

---

### Histórico

RONDA 2 GENERADA ✓ (2026-06-15) · `refining → refined` ✓ (gate /po-ux Step 5 PASS).
`01-spec.md` ahora tiene: § Gherkin (4 base + race/network/empty/a11y/i18n) + § Matriz de cobertura
(0 huecos / 0 huérfanos) + § Estados visuales + § Componentes (reuse>new) + § Microcopy (goldens mockup)
+ Responsive + Accessibility + Telemetría.

⚠️ **N/A propuesto (ratificar si querés que sean SC reales):** `concurrent_users` (single-user brand + sin
list/detail filtrable; multi-tenant cubierto por SC-adversarial-tenant) · `large_dataset` (MVP sin list
paginada). Si Chris no objeta → quedan N/A.

**Pendiente: handoff `/architect comunify comunify-shell-organism`** → ready package:
- T-0 higiene (lockfiles align-vitalia + next-env + deps `@luana/*` + `pnpm install` verde)
- montar `core/luana-core-copilot /chat` en `/api/v1/comunify/copilot` + `chat-store` real (lift candidate `@luana`)
- `--radius` pill token (design-system update) + verificar `@luana/ui-kit` honra radio de marca vía token
- routing `app/[tenantId]/(shell-organism)/` + `shell-routes.ts` (nav-tree v2)
- logos reales → `comunify/frontend/public/brand/` (ya copiados)
- avatares agentes = placeholders SVG (Chris da finales después)

Decisión motor: Luana consume `core/luana-core-copilot /chat` (comunify-first, lift chat-store).
Goldens dev-team: `design-inventory.md` + `mockups/shell.html` + tokens comunify + 01-spec § Mapa funcional/RONDA 2.
