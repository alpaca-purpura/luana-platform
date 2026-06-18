---
brand: comunify
story_id: comunify-shell-organism
module: platform
state: done
phase: MERGED  # 2026-06-17: auditor-frontend + auditor-agentic PASS (live-verified) → /pm-comunify merge (07-merge.md). cap shell-organism planned→live. autonomous_mode → live-verify sustituyó demo G.
reconciled: true             # R · /pm-comunify 2026-06-17 — 04-validators § reconciliation (scope real vs ideal, deferred SC, bugs fixed, engine debt → /pm-luana)
audit_verdict: APPROVED      # auditor-frontend PASS (16 cat, gates green, live-verified) + auditor-agentic PASS (engine boundary clean, RN-3, trace scoped)
merge_artifact: ./07-merge.md
dod_live_verified: true
dod_env: "localhost:3003 (Playwright @clerk/testing ticket+storageState) + dev-app.comunifyagents.com (Chrome DevTools MCP, lane D) · usuario hola@alpacapurpura.lat · gateway luana_litellm_dev:4000"
dod_evidence:
  - action: "Login (Clerk sign-in token) → shell /comunify-demo/nina/marca → enviar mensaje a Nina ('¿qué es una escalera de valor?')"
    observed: "Nina respondió coherente + on-topic en español neutro ('Una escalera de valor es la secuencia de ofertas…'), streamed en la burbuja"
    backend_log: "POST /api/v1/comunify/copilot/chat 200 OK · Bearer + X-Tenant-ID enviados · sin traceback fatal · DB tenant-scoped: copilot_llm_call=3 (kimi/kimi-k2), copilot_trace_event=11, copilot_conversations=6"
  - action: "T-e2e automatizado headless (shell-chat-ok.spec.ts · @clerk/testing ticket strategy + storageState) — login→tenant + write real al engine /chat (NO mock)"
    observed: "4 passed (25.9s): clerk setup + authenticate + login→tenant (authed, composer montado) + SC-chat-ok (≥2 burbujas + bot stream contenido real >20 chars vía gateway kimi). Gate anti-burbuja (base.ts) verde."
    backend_log: "DB tenant-scoped tras las corridas: copilot_trace_event 11→20, copilot_llm_call 3→7, copilot_conversations 6→7. Cero /api 4xx-5xx tragados."
    bugs_found_and_fixed: "(1) next.config.ts SIN async rewrites() → todo /api/* relativo 404 fuera del túnel (chat + todos los hooks); portado patrón vitalia/nicolify. (2) /agents/plataforma/avatar.svg 500 → placeholder SVG agregado."
verified_at: 2026-06-17
story_type: ui-mixed          # FE shell + AGENTIC copilot mount + HYGIENE(config)
created: 2026-06-15
last_updated: 2026-06-17
parallel_safe: true
owner: /architect
next_handoff: /auditor comunify comunify-shell-organism — state developed + reconciled:true + autonomous_mode:true (live-verify sustituye demo G). APPROVED → /pm-comunify merge (07-merge + archive + capability comunify/shell-organism)
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

## ✅✅ CHAT LIVE-VERIFICADO end-to-end 2026-06-17 (DoD #37 · Chris "probá con lane D")

**El chat de comunify FUNCIONA en vivo.** Login real (Clerk) → shell → mensaje a Nina → respuesta
coherente streameada (kimi/kimi-k2 vía gateway) → persistida tenant-scoped. Ejercido con Chrome DevTools
MCP (lane D, sign-in-token de hola@alpacapurpura.lat). Ver `dod_evidence` en frontmatter.

**Respuesta real de Nina:** *"Una escalera de valor es la secuencia de ofertas que diseñas para que un
cliente empiece con algo pequeño y de bajo riesgo (lead magnet), suba a una oferta media (trial o core),
y llegue hasta tu premium o programa estrella, maximizando el valor que capturas en cada etapa…"*

**5 bugs que cazó la live-verify (los tests mockeados los pasaban TODOS — el patrón "verde pero roto"):**
1. **FE auth nunca cableada** — `ShellLayoutWire` tenía `// NOTE: Future data-layer ticket will wire
   auth context` → `setAuthContext` jamás se llamaba → chat 401. Fix: inyecta token Clerk (`getToken`) +
   tenantId, refresh por intervalo (~60s expiry). Commit `0a968fd9`.
2. **FE SSE delta mal parseado** — el engine emite `block_delta: {delta:{markdown:"…"}}` (objeto), el store
   leía `parsed.delta` (objeto) → `[object Object]` ×N en la burbuja. Fix: leer `delta.markdown`.
3. **Tablas copilot del engine ausentes** — comunify_dev no tenía NINGUNA de las 13 (`copilot_conversations`
   etc.); ningún brand usa el orquestador de chat del engine (vitalia usa sus propias conversations). Migración
   `004` (create_all idempotente).
4. **Tablas llm/observability del engine ausentes** — `model_pricing_snapshot`/`llm_role_binding`/etc. (cost
   recorder las necesita). Migración `005`.
5. **Modelo LLM mal ruteado** — sin `AI_MODEL_*`/`AI_PROVIDER_*` el default `gpt-4o` → `openai/gpt-4o`/`openai/kimi-k2`,
   no existen en el gateway Chinese-first → 400. Fix compose: per-rol deepseek/kimi (paridad vitalia).

**+ Infra provisionada:** gateway LiteLLM levantado (estaba caído 11d) + apuntado por service-name · engine-IAM
foundation (migración 003 + iam router + seed + Clerk bind, tenant `9cf1ef9b`) · 16 campos legacy Settings.

**Follow-ups NO-fatales (no bloquean "el chat funciona", sí pulir antes de `done`):**
- `prompt_versions` table ausente → Nina usa prompt default (genérico, no la persona comunify-voiced). Seedear.
- chat-store manda `agent:"valeria"` hardcodeado (comunify usa Nina/Luana) — cosmético.
- `cost_recorder.unknown_provider` warning (no rompe el turno).
- `AI_MODEL_*`/legacy Settings viven en el compose (dev). DEUDA /pm-luana: engine hace esos campos Optional.

**Próximo:** T-e2e formal (15 SC) con @clerk/testing + fixes de los follow-ups (persona) → auditor → merge.

---

## ✅ T-e2e LIVE + RECONCILED (R · /pm-comunify · 2026-06-17 · autonomous_mode → G exento)

**SC-chat-ok ahora live-verificado por e2e AUTOMATIZADO real-backend** (no sólo Chrome MCP manual):
`comunify/frontend/e2e/shell-organism/shell-chat-ok.spec.ts` + `e2e/setup/clerk.setup.ts` (@clerk/testing
ticket + storageState) + `e2e/fixtures/base.ts` (gate anti-burbuja). `make dev-comunify` + gateway →
**4 passed (25.9s)**: clerk setup ×2 + login→tenant + SC-chat-ok (write real → stream LLM). DB:
trace_event 11→20, llm_call 3→7, conversations 6→7. Project `shell-organism` + dotenv en `playwright.config.ts`.

**2 bugs cazados por la live-verify (verde-pero-roto) + arreglados:**
1. **`next.config.ts` sin `async rewrites()`** — todo `fetch("/api/v1/…")` relativo daba **404 de Next**
   salvo vía el túnel (cloudflared rutea /api→BE). El chat **y todos los hooks de datos** sólo andaban
   detrás del túnel. Fix: portado el rewrite `/api`+`/public` → BE (patrón vitalia/nicolify). Bug de marca
   entera, no del chat. → e2e 404→401→200.
2. **`/agents/plataforma/avatar.svg` 500** (placeholder faltante) → SVG placeholder agregado.

**Follow-up #1 (persona) RE-DIAGNOSTICADO — NO se construye acá:** la voz comunify del copilot **NO** sale
de `prompt_versions` (verificado: esa tabla la lee SÓLO el sales_agent; el copilot chat nunca la consulta →
una migración 006 sería **dead code**). La palanca real = `_BASE_IDENTITY` del engine (hoy hardcodeado
"Nicolify", cross-brand) hecho brand-aware → **engine work `/pm-luana`**. Voz genérica = no-fatal, no bloquea.
Capturado: `comunify/docs/learnings/2026-06-17-engine-deuda-surfaced-by-shell-organism.md` (promotable).

**Follow-up #2 (agent default):** `chat-store.ts` default `activeAgent` "valeria"→**"luana"** (slug comunify) ✓.

**Scope reconciliado:** `04-validators.yaml § reconciliation` — live_verified [SC-chat-ok, login-tenant-nav,
SC-happy] · deferred (must_pass:false, HB-79) [SSE behaviors = unit-cubiertos · shell polish = R-shell+1..N].
Gates verdes: FE tsc + eslint + vitest 129/129. BE sin cambios (arch 144 / ruff intactos).

**Próximo real:** `/auditor` (autonomous → ejerce ≥1 write live + dod_evidence) → `/pm-comunify` merge.

---

## 🔧 Sesión 2026-06-17 (tarde · provisión + build autónomo · Chris "hazlo tú mismo")

Chris autorizó provisionar la infra + construir. Se hizo TODO el BE + infra; el chain quedó wired + 401-verified live (era 500/404). Falta sólo FE + verify autenticado.

**✅ Hecho + verificado live (commits `de6b9e9d` · `65ffe9c6` · `e6…iam`):**
1. **Gateway LiteLLM** — estaba caído (Exited 11d). `docker start luana_litellm_dev` (keys baked) → Up :4000, sirve deepseek/kimi. Backend comunify lo alcanzaba por `localhost:4000` (= su propio loopback → refused); fix: compose `environment` apunta a `luana_litellm_dev:4000` (service-name en `luana_dev_net`). comunify es la 1ª marca que ejerce el `/chat` real (vitalia/nicolify mockean). Verificado: backend container → gateway `/v1/models` OK.
2. **Engine-IAM foundation** (builder-backend · `T-iam-be-result.md`) — comunify_dev NO tenía NINGUNA tabla iam (Story 12 las difirió). Port de vitalia: migración `003` (tenants/users/user_tenants idempotente) + mount `iam auth_router` en main.py `/api/v1/iam/users` + `seed_test_users_link.py`. Tests 2/2, arch 144, migración aplicada+idempotente.
3. **Legacy Settings env** — el fix Settings-lazy desbricó el IMPORT pero a request-time el Settings monolítico aún valida 16 campos required (POSTGRES_*/WHATSAPP_*/QDRANT_URL/API_*/DOMAIN_NAME/LOG_LEVEL/TRAEFIK_NETWORK/OPENAI_API_KEY). comunify no los proveía → 500 en cada request engine. Provistos en compose (dev-only, paridad vitalia). **★ DEUDA /pm-luana:** completar el fix engine = hacerlos Optional (las marcas dejarían de proveerlos).
4. **Seed + Clerk bind** (`--clerk-sync`) — tenant `9cf1ef9b-958e-55b0-8b4f-ff603ba23095` + user hola@alpacapurpura.lat (clerk `user_3EaMO75tzdSqRrnne71Nr08Hbl3`) + user_tenants link. publicMetadata.{role=owner,tenant_id} seteado.

**Verify live (curl, sin auth):** health 200 · `GET /api/v1/iam/users/me/tenants` → **401** (era 500) · `POST /api/v1/comunify/copilot/chat` → **401** (era 500). El chain entero resuelve; sólo falta el token real para 401→200.

**⛔ Falta para `done` (NO se hizo · razón):**
- **FE iam-adoption** (root `/` → tenant resolve, patrón vitalia) — NO construido. Construirlo a ciegas sin poder live-verificarlo repite el anti-patrón "verde pero roto"; conviene build+verify juntos.
- **Authenticated live-verify (DoD #37 · SC-chat-ok real write)** — necesita sesión Clerk real (JWKS, sin bypass dev) vía Chrome MCP. **Chrome contendido** por una sesión claude paralela (pid 7829, default userDataDir → riesgo SingletonLock). Correr cuando Chrome esté libre, o vía T-e2e headless (@clerk/testing).
- **T-e2e** (15 SC) + **auditor** (autonomous → live-verify sustituye demo G) + **merge**.

> Próximo paso recomendado: (a) liberar Chrome (cerrar sesión paralela / lane propio) → build FE root-resolve + browser live-verify del chat (SC-chat-ok) + login→tenant juntos, o (b) construir T-e2e con @clerk/testing para el authenticated flow headless. Luego auditor + merge.

---

## ✅ DESBLOQUEADA 2026-06-17 (/pm-comunify reconcile · engine fix landed+validated)

El engine fix elegido por Chris (dir B — **Settings lazy** en `luana_core_platform`) **aterrizó en main y se mergeó a wip/comunify**:
- Commit engine: `e9f16d06 feat(core): /chat brand-mountable — lazy get_settings() en copilot+platform (semver minor)` · proposal `2026-06-16-copilot-chat-brand-mountable` = `accepted` (07-merge stamped) · expand `6b722105` (iam = 2º consumer).
- `core/luana-core-platform/.../core/config.py` ahora expone `@lru_cache get_settings()` (lazy) + el global `settings` quedó deprecado. `rate_limit.py` ya no instancia Settings a import-time.
- **Validado live (native import test, env multibrand SIN POSTGRES_*/WHATSAPP_*/QDRANT_URL legacy):** `import luana_core_copilot.api.chat` + `rate_limit` + `database` → **boot clean, cero `pydantic ValidationError`**. El boot-brick de T-agentic está RESUELTO en el engine.
- Sync: wip/comunify 0 detrás / 66 adelante de origin/main. arch suite comunify **144 GREEN**, ruff src limpio (24 F401/I001 residuales en tests/scripts/alembic = deuda pre-existente auto-fixable, no regresión del merge).

**Progreso 2026-06-17 (/dev-team autonomous):**
- ✅ **T-agentic v2 DONE** (`de6b9e9d`): el thin-mount ya estaba committeado (`3b6670ba`); el engine fix lo desbricó. Verificado: `copilot_router` monta (`/api/v1/comunify/copilot/chat` presente), `test_chat_mount.py` **4-pass** (200 SSE / 401), BE arch+ruff green, boot live 200. Comentario stale `BLOCKED` en main.py corregido (guard mantenido). NO se agregaron deps a backend/pyproject (resolución workspace, patrón vitalia/nicolify). Detalle: `T-agentic-v2-result.md`.
- ⛔ **Muro de infra (gateado por Chris)** para cerrar el `done`:
  - **LiteLLM gateway** `luana_litellm_dev` **Exited 11 días** + `deploy/litellm/.env` (LLM keys) **ausente en este worktree** (gitignored per-worktree) → el write real SC-chat-ok (mensaje a Luana → stream LLM) no puede correr.
  - **Tenant comunify** seedeado + bound a un Clerk user de prueba (`seed_fixture_creators.py` existe pero el binding iam↔Clerk es el gap 🟡 conocido) → sin esto ni el chat real ni el login→tenant live-verifican.

**Lo que falta para el done (resume /dev-team cuando la infra esté):**
1. ✅ ~~T-agentic v2~~ — DONE (ver arriba). Falta sólo el scenario 200-SSE write real (gateado por infra).
2. **iam-adoption** (login→tenant): root `/` resuelve tenant vía IAM API (`GET /api/v1/iam/users/me/tenants`, patrón vitalia/nicolify) — desbloqueado por la misma Settings-lazy.
3. **Seed tenant comunify en iam** + LiteLLM gateway corriendo (precond del write real SC-chat-ok). 🟡 gap conocido — si falta al cerrar `developed`, la live-verify del write se cubre con auditor live + `dod_evidence` (autonomous_mode: true → G exento).
4. **T-e2e** (15 SC) + DoD #37 → auditor → merge.

> ⚠️ Para el live-verify dentro de docker: el contenedor `comunify_backend_dev` usa venv en volumen (`comunify_backend_venv`) — asegurar que tenga el core actualizado (rebuild/sync) antes de probar el mount (memoria `dev-infra-triple` / engine-edits-invisible-to-venv).

---

## Histórico — Next action ⛔ BLOQUEADA (pre-2026-06-17, resuelto arriba)

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

### Trabajo paralelo 2026-06-16 (mientras el motor se arregla en vitalia)
- **FE dev image rebuildeada** (`comunify_frontend_dev`). Gotcha cazado: comunify nunca consumía `@luana/*`, así
  que su imagen FE horneaba `node_modules` SIN las deps que T-0 agregó (`@luana/ui-kit`/`design-tokens`/`zustand`/
  `next-themes`) → FE `:3003` daba **500 module-not-found** (espejo FE del bug BE de hoy). Fix: `docker compose
  build comunify_frontend_dev` + `up -d -V`. **Regla:** al cambiar deps del FE de comunify, **rebuild de la imagen**
  (las deps se hornean en build-time; el bind-mount solo trae el código). Memoria: `dev-infra-triple`.
- **Live-verify parcial OK** (sin Chrome MCP, evitando colisión con sesión vitalia): FE compila + sirve · `/` →
  307 → `/sign-in` (SC-auth vivo) · ruta tenant `/{t}/nina/marca` → 307 (edge-redirect protege antes de render) ·
  FE log `✓ Ready`, cero module errors. El build de T-shell es sólido a nivel framework.
- **Techo:** render autenticado del shell necesita login Clerk + tenant comunify seedeado (🟡 gap independiente) →
  pendiente para T-e2e/DoD #37.

### Live-verify del shell + T-shell fix 2026-06-16
Ejercí el shell en vivo (dev-app, Chrome MCP, `hola@alpacapurpura.lat`). El build de T-shell salió **121 tests
verdes pero roto en vivo** (DoD #37). **4 fixes previos** (login-loop · boot-crash heap · ruta N3 404 · "more hooks"
redirect in-render). Detalle builder-actionable + root-cause: **`T-shell-livefix.md`**.

**T-shell fix 2/2 (2026-06-16) — A/B/C RESUELTOS + live-verified DoD #37:**
- **A · avatares gigantes** → FIXED. Root: `@source` glob → **bare-dir** (forma vitalia) + limpiar `.next` del contenedor
  FE + restart (cache-trap: chunk dev nombre estable, el browser servía CSS viejo; hard-reload no alcanza). Live:
  avatares **28px** en fresh load, `size7InCss:true`.
- **B · sidebar Luana no renderiza** → RESUELTO por el fix de A (misma causa raíz: clases de layout del kit no
  generadas → dual-pane colapsaba). Live: `luana-sidebar` monta **382px** con chat-header/messages/composer.
- **C · `useTenantId` usa Clerk org** → FIXED. Reescrito al patrón vitalia (`user.publicMetadata.tenant_id`, sin
  `useOrganization`) + test (5 casos). tsc/eslint/vitest verde. Live: hook resuelve sin `org_xxx` ni crash. **Data
  path real sigue gateado por seed de tenant comunify en iam** (pendiente conocido, no regresión).
- **D · chat 404** = engine fix B (proposal accepted) — NO T-shell; T-agentic v2 lo re-cablea cuando aterrice.

Cosméticos nuevos (fuera A/B/C, follow-up, no bloquean): LogoMark aspect-ratio warning · `agents/plataforma/avatar.svg`
500 (placeholder faltante, fallback "P" OK) · favicon 500. Infra dev: 4 usuarios Clerk + túnel comunify (runtime, no-commit).

### Login → tenant (redirect post-login) — diagnóstico 2026-06-16
Chris reportó "logueo desde `/` y no redirecciona". **Reproducido en vivo** (login fresco → queda clavado en `/`).
- Causa: sign-out/entrar a `/` mete `?redirect_url=/`; Clerk v6 lo obedece sobre `AFTER_SIGN_IN_URL` (que es solo *fallback*); y el root `/` no resuelve usuario→shell. El "login fix" previo (`AFTER_SIGN_IN_URL` env) solo cubría el path ya-logueado (sin `redirect_url`).
- **Opción 2 (la real, ratificada Chris):** root `/` resuelve el tenant vía IAM API (`GET /api/v1/iam/users/me/tenants`, patrón vitalia/nicolify) → redirect a `/{tenant}/nina/marca`.
- **BLOQUEADA por la MISMA raíz que el copilot (defecto D):** montar el `auth_router` iam usa `luana_core_platform.core.database.get_db` → instancia el `Settings` legacy eager (exige 15 env POSTGRES_*/QDRANT/WHATSAPP/... + arma `database_url` de POSTGRES_*, ignora `DATABASE_URL`). comunify multibrand no los provee → boot crash. Acoplar (opción C) = rechazado.
- **Decisión Chris (2026-06-16):** **expandir proposal B → "Settings lazy" en `luana_core_platform`** (raíz). Desbloquea copilot `/chat` **e** iam de un saque. Es engine work (worktree core + `/architect`), NO inline desde este hub. SSoT: `docs/promotion-protocol/proposals/2026-06-16-copilot-chat-brand-mountable.md` § 3bis + bitácora.
- Provisional mientras B no aterrice: login dead-end en `/` (o Opción 1 `SIGN_IN_FORCE_REDIRECT_URL` al slug demo si se quiere chrome navegable post-login).

**Story sigue `blocked`** — un solo engine fix (proposal B expandida, Settings lazy) destraba: T-agentic v2 (copilot mount) **+** iam-adoption (login→tenant) → seed tenant iam → T-e2e → auditor → merge.

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
