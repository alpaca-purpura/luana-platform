---
story_id: comunify-shell-organism
brand: comunify
type: ui-mixed              # FE shell + AGENTIC copilot mount + HYGIENE(config)
state: ready
architect_run: 2026-06-16
verification_nature: funcional
demo_required: true
cap_target: comunify/shell-organism
cap_change_type: new
adr_001_compliance: n/a    # ADR-nicolify-001 is nicolify-only; comunify has no equivalent ADR (Open Question OQ-4)
surfaces: [frontend, agentic, hygiene]
---

# Contract — Comunify Shell-organism (R-shell MVP)

> SSoT técnico para build paralelo cross-surface. Consume `01-spec.md` (Mapa funcional + RONDA 2 firmados),
> `design-inventory.md` (goldens), `navigation-tree.md` (sitemap v2), `mockups/shell.html` (golden visual),
> `comunify/docs/architecture/design-system.md` (tokens). Builders consumen este contrato.

---

## 0. Context Summary

- **Story:** `comunify-shell-organism` · `comunify/docs/product/stories/comunify-shell-organism/`
- **Architect run on:** 2026-06-16
- **Knowledge cutoff disclosure:** el shell kit `@luana/ui-kit@0.4.1` + el engine `core/luana-core-copilot` son artefactos vivos de ESTE repo (post-cutoff de mi modelo). Toda decisión se ancló por lectura directa de los archivos del workspace (no por conocimiento del modelo). No hubo WebSearch — no se introduce ningún patrón novel; se CONSUMEN artefactos existentes.
- **Modules touched:** `frontend` (app shell + tokens + config + chat-store) · `backend/comunify/copilot` (thin mount) · `hygiene` (lockfiles/deps).

### Surface → builder → auditor mapping (PM usa esto para spawnear los agentes correctos)

| Surface | Path | Builder | Auditor |
|---|---|---|---|
| **HYGIENE (config)** | `comunify/frontend/{package.json, next-env.d.ts}` + lockfiles | `builder-frontend` (workhorse) | `auditor-frontend` (flagship) |
| **AGENTIC (BE thin mount)** | `comunify/backend/src/modules/comunify/copilot/api/` + `main.py` mount | **`builder-agentic` (flagship · R23 HARD)** | **`auditor-agentic` (flagship)** |
| **FE tokens** | `comunify/frontend/src/app/globals.css` + `tailwind.config.ts` + fonts | `builder-frontend` (workhorse) | `auditor-frontend` (flagship) |
| **FE shell wrapper + routing** | `comunify/frontend/src/app/[tenantId]/(shell-organism)/` + `lib/routing/shell-routes.ts` + `lib/agents.ts` + `components/shared/shell-organism/` + `proxy.ts` | `builder-frontend` (workhorse) | `auditor-frontend` (flagship) |
| **FE chat-store (SSE)** | `comunify/frontend/src/stores/chat-store.ts` | `builder-frontend` (workhorse) | `auditor-frontend` (flagship) |

> R23: el ticket AGENTIC toca `production_code=true` en superficie agentic (`copilot/`) → **flagship obligatorio** (`builder-agentic` + `auditor-agentic`). FE es workhorse.

### Skills consulted (decisión tomada de cada uno)

- **`frontend-expert`** → FSD-Lite: tokens en `app/globals.css` + `tailwind.config.ts`; chat-store en `stores/`; brand thin wrappers en `components/shared/shell-organism/` (no en `features/`, son chrome). Server-first; `"use client"` solo en el wire + chat-store consumers.
- **`copilot-expert`** → el engine `/chat` es brand-agnóstico y descubre módulos por convención (`module_registry`). comunify YA registra su provider (extractors/workflows/kb, **sin `tools/` de dominio**) → Luana conversa+anuncia pero **no puede ejecutar** (RN-3 satisfecho por construcción). Cero edición del engine. Trazas (`copilot_trace_event`) las emite el engine.
- **`sales-agent-expert`** → N/A (esta story no toca `sales_agent/`; Luana = supervisora copilot, no sales).
- **`brand-expert` / `offer-expert` / `offer-type-preset-expert` / `metrics-expert`** → N/A en MVP (tabs = placeholder; las áreas dashboard se portan en R-shell+1..N).

### CONTEXT-BRIEF source

- **Self-ran greps (Path B — fallback).** No había `CONTEXT-BRIEF.md` (story refinada por `/po-ux` con anchors pre-grepeados ya en el prompt). Se re-validaron por lectura directa (ver § Prior art audit / Existing systems audit).

### capability YAML + modules MD afectados (post-merge)

- `comunify/docs/product/capabilities/shell-organism/shell-comunify.yaml` (NEW · cap `comunify/shell-organism`) — crear en Fase E (`/pm-comunify`), con `dev_preview.main_component` → `app/[tenantId]/(shell-organism)/layout.tsx` + `code_ref` del chat-store + el thin mount.
- `comunify/docs/product/modules/platform.md` (o el módulo donde viva el shell) — narrativa del chrome 3-zonas si existe; si no, crear pointer.

### Architecture gates que deben seguir verdes

- BE: `cd comunify/backend && ${WS}/.venv/bin/pytest tests/architecture/ -x -q` (response_model mandatory, redirect_slashes=False, no cross-module imports, tenant-isolation).
- FE: `cd comunify/frontend && npx tsc --noEmit && npx eslint src/ --cache && npx vitest run src/__tests__/architecture/` (FSD boundaries, no-clerk-organizations, no-hardcoded-hex, no low-contrast pairs).
- Anti-dup Cat 12 (auditor): cero mirror del kit shell en comunify; cero mirror cross-brand de los locals de nicolify.

---

## 1. Domain Entities

**N/A — esta story NO crea entidades de dominio.** El shell consume el engine copilot (que ya tiene su propio modelo: `copilot_conversations`, `copilot_trace_event`, `copilot_llm_call`, checkpoints) read-only vía el endpoint `/chat`. comunify NO persiste nada nuevo. La única "escritura" del DoD es la fila en `copilot_trace_event` que **emite el engine** al procesar el turno (no la escribe comunify).

---

## 2. SQLAlchemy 2.0 Models

**N/A — sin tablas nuevas.** El engine copilot ya tiene su schema (gestionado en `core/luana-core-copilot`). comunify NO añade migraciones. (Ver § 9.)

---

## 3. Pydantic v2 DTOs

**Consumidos del engine — NO redefinir.** El thin mount reexpone el endpoint existente. El contrato request/response es el del engine:

- **Request:** `luana_core_copilot.api.dto.CopilotChatRequest` — `{ message: str (≤4000), conversation_id: str | None, blocks: list[dict] | None, context: ClientContextDTO }`.
- **Response:** `StreamingResponse` SSE (`text/event-stream`). Eventos: `status` · `message_start` · `block_start` · `block_delta` · `block_end` · `block_append` · `tool_start` · `tool_result` · `ui_action` · `message_end` · `done` · `error` (shape = `SSEEvent` DTO del engine).

> El builder-agentic **NO** crea DTOs nuevos. Reexporta/incluye el router del engine.

---

## 4. API Routes

| Method | Path | Auth | Request DTO | Response | Description |
|---|---|---|---|---|---|
| POST | `/api/v1/comunify/copilot/chat` | Bearer (Clerk JWT) + `X-Tenant-ID` | `CopilotChatRequest` (engine) | `StreamingResponse` SSE | **thin include** del engine `chat.router`. Luana = supervisora copilot. |

**Mount mechanics (builder-agentic):**

```python
# comunify/backend/src/modules/comunify/copilot/api/__init__.py  (NEW)
from luana_core_copilot.api.chat import router as _engine_chat_router
copilot_router = _engine_chat_router   # reexport thin — NO se redefine la lógica
```

```python
# comunify/backend/src/main.py  (EDIT — añadir mount)
from src.modules.comunify.copilot.api import copilot_router
app.include_router(copilot_router, prefix="/api/v1/comunify/copilot", tags=["copilot"])
```

- **Auth model (verificado en el engine):** el endpoint usa `Depends(get_current_user)` (HTTPBearer → Clerk JWT) + `Depends(get_tenant_context)` (header `X-Tenant-ID`) + `Depends(get_db)` (sync `Session`) — **todos de `luana_core_iam`/`luana_core_platform`**. El engine resuelve el tenant del **usuario** (iam) y valida contra `X-Tenant-ID` → **tenant isolation + adversarial-tenant los enforce el engine** (RN-2 + SC-adversarial-tenant). comunify NO reimplementa auth.
- **`redirect_slashes=False`** ya está en `comunify/backend/src/main.py` (verificado) — el mount no lo toca.
- **Rate limit:** el engine ya aplica `check_rate_limit(scope="copilot-chat")` (30 msg/min/user). El doble-envío (SC-chat-double-send) se mitiga **además** en el FE (composer bloqueado durante streaming).

---

## 5. TypeScript Types (Frontend)

El kit `@luana/ui-kit` define el contrato del chat-store (`ShellChatStoreApi`). comunify lo **implementa** con SSE real. Tipos clave (mirror del kit `organism/shell/types.ts` — NO redefinir, importar del kit):

```ts
// del kit — import type { ShellChatMessage, ShellChatStatus, ShellChatStoreApi } from "@luana/ui-kit"
type ShellMessageRole = "bot" | "user" | "delegate" | "thinking";
type ShellChatStatus  = "idle" | "thinking" | "streaming";

interface ShellChatMessage {
  id: string;
  role: ShellMessageRole;
  content?: string;
  time?: string;            // 'HH:MM'
  agent?: string;           // slug del agente (bot/thinking)
  fromAgent?: string;       // delegate
  toAgent?: string;         // delegate (DelegateMarker)
  delegateMode?: string;    // delegate
}

interface ShellChatStoreApi {
  messages: ShellChatMessage[];
  conversations: ShellConversationMeta[];
  activeAgent: string;
  status: ShellChatStatus;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  newConversation: () => void;
  setActiveAgent: (agent: string) => void;
}
```

> El kit **solo lee** `messages / conversations / activeAgent / status / sendMessage / clearMessages / newConversation / setActiveAgent`. comunify implementa `sendMessage` con SSE real (no `setTimeout` mock como nicolify/vitalia).

---

## 6. Repository Interfaces

**N/A — sin repos nuevos.** El engine copilot tiene los suyos. comunify no toca persistencia.

---

## 7. Application Services

**N/A — sin services BE nuevos.** El thin mount delega 100% al `CopilotOrchestrator` del engine. La "lógica de aplicación" del FE (gestión del stream, parse SSE → mensajes, estado idle/streaming/error/network, bloqueo del composer) vive en `chat-store.ts` (§ 10).

---

## 8. Agentic Surfaces

> Owner: `builder-agentic` (flagship). Auditor: `auditor-agentic` (flagship). R23 HARD.
> **ALCANCE MÍNIMO** — esta story NO construye grafo, ni state, ni tools, ni topología nuevos. **CONSUME** el engine `/chat` existente vía thin mount. Las sub-secciones 8.1-8.4 / 8.7 son del engine (referencia, no build).

### 8.0 Qué construye builder-agentic (scope real)

1. `comunify/backend/src/modules/comunify/copilot/api/__init__.py` — reexport thin del `chat.router` del engine.
2. `comunify/backend/src/main.py` — `include_router(..., prefix="/api/v1/comunify/copilot")`.
3. `comunify/backend/pyproject.toml` — declarar deps `luana-core-copilot`, `luana-core-iam`, `luana-core-platform` (editable workspace; hoy comunify solo declara fastapi/sqlalchemy/etc.).
4. **Persona supervisora Luana (conversa + anuncia, sin tools de dominio):** verificar que el `module_registry_entry.py` de comunify NO registra tools de dominio (CONFIRMADO: el módulo `copilot/` de comunify tiene `extractors/ kb/ workflows/` pero **NO `tools/`**) → Luana no puede ejecutar (RN-3 por construcción). **NO se añaden tools en esta story.** Si el system prompt de Luana necesita el "anuncio de delegación", se logra vía el comportamiento conversacional del engine (sin tools → el agente conversa y describe; el FE pinta el `DelegateMarker` por heurística de copy, no por tool-call de dominio).
5. Wiring de traza: **ya lo hace el engine** (`copilot_trace_event`). Verificar (no construir) que el turno deja la fila scoped al tenant.

> **Anti-duplication (copilot-expert §0):** NO crear archivos en `comunify/.../copilot/observability/` ni `recording/`. NO mirror de `turn_envelope`/`callback_handler`. El engine es el dueño.

### 8.1 LangGraph state · 8.2 Topology · 8.3 Nodes · 8.4 Tools

**Del engine (`core/luana-core-copilot`) — NO se toca.** comunify consume el grafo deep-agent existente. **Cero tools de dominio registradas por comunify** → Luana solo conversa+anuncia (RN-3, AC-3). El `tenant_id` viaja en el state del engine (tenant isolation interna del grafo).

### 8.5 Prompt cache slot architecture

**Del engine (system_prompt_layout F8/F10).** comunify NO reordena slots. La persona "Luana supervisora comunify" se deriva del brand_summary / module list que el engine ya cachea per-tenant (slots 4-6). **No-build en esta story.**

### 8.6 Checkpointer

**Del engine** (durable flows `core/luana-core-flows` + checkpointer Postgres). comunify no lo configura.

### 8.7 Stream modes (expuestos por API)

El SSE del engine emite (consumidos por el FE chat-store):
- `status` (streaming|done) — driver del estado `streaming`/`idle` del composer.
- `message_start` / `message_end` — límites de la burbuja del bot.
- `block_start` / `block_delta` / `block_end` — texto incremental (token-by-token de la burbuja).
- `block_append` — cards (no usado en MVP; el FE tolera no-op).
- `error` — driver del estado `error` (SC-chat-error).

### 8.8 Observability writes (mandatory)

- **Lo emite el engine** (`copilot_trace_event` recorder best-effort + `copilot_llm_call`). comunify NO escribe trazas.
- **DoD #37 write:** el turno del usuario → fila `copilot_trace_event WHERE tenant_id = :tid` (SC-chat-ok). Esto es el "write real" del DoD (ejercido live, no GET 200).
- **Cost:** el engine ya registra `copilot_llm_call` (tokens + cache + cost). Sin target nuevo en MVP (turnos cortos de bienvenida).

### 8.9 Eval goldens

**THIN — sin goldens de comportamiento de agente nuevos.** No hay specialist nuevo ni prompt modificado (se consume el engine tal cual). El gate `agentic_eval` de `04-validators.yaml` se reduce a: (a) verificar que el turno deja traza scoped al tenant, (b) verificar cero filas de dominio nuevas tras un turno de delegación (SC-chat-delegate). NO se piden ≥3 goldens (no aplica: no se crea/modifica prompt de agente).

### 8.10 RAG / Qdrant

**N/A en MVP** — Luana conversa+anuncia sin leer datos del tenant (RN-3). El KB pack comunify existe pero no es scope de esta story.

### 8.11 Skill decisions referenced

- `copilot-expert`: (1) engine es brand-agnóstico, descubre por convención → thin mount sin tocar engine. (2) comunify sin `tools/` de dominio → RN-3 por construcción, no se construyen tools. (3) trazas las emite el engine → cero recorder nuevo (anti-dup §0).
- **graceful-degradation (FE):** el chat-store envuelve el `fetch` SSE con timeout + fallback (estado `network` SC-chat-network) + manejo de 5xx (estado `error` SC-chat-error) — un solo request en vuelo (composer bloqueado, SC-chat-double-send).

---

## 9. Migration Notes

**N/A — sin migraciones.** El engine copilot ya tiene su schema. comunify no añade DDL. (Si el engine requiere tablas que aún no estén migradas en la DB de comunify, eso es un gate de `alembic upgrade head` del propio engine, no una migración nueva de esta story — verificar en live-verify que `copilot_trace_event` existe en `comunify_dev`.)

---

## 9.5 Tests audit (default flip)

- **[x] No aplica — 03-arch.md no flipea defaults side-effect.** Esta story no toca ningún feature flag (`USE_*_PATTERN_*`, `USE_DEEPAGENTS_*`, etc.). El mount es additive (nuevo router incluido), no cambia un call-path existente por flag.

> Nota de routing FE (no es flag): retirar `(dashboard)` del routing alcanzable (RN-5) es un cambio de estructura de rutas, no un flip de flag — se verifica por SC-dashboard-unreachable + grep, no por suite-con-ambos-valores.

---

## 10. File Structure

> **NEW** = crear · **EDIT** = modificar existente · **CONSUME** = importar del kit/engine (cero archivo).

### HYGIENE (T-0)
- **EDIT** `comunify/frontend/package.json` — declarar `@luana/{ui-kit,design-tokens,format,hooks,schemas,api-client}: "workspace:*"` (mirror nicolify; ver § Prior art para la lista exacta que el kit importa).
- **DELETE** `comunify/frontend/package-lock.json` (tracked) — root `pnpm-lock.yaml` es SSoT.
- **DELETE** `comunify/frontend/pnpm-lock.yaml` (tracked) — alinear a vitalia (sin lockfile frontend per-brand).
- **TRACK** `comunify/frontend/next-env.d.ts` (untracked → `git add`, como nicolify/vitalia).
- **GATE:** `pnpm install` desde root → verde (no blind-delete; verificar que resuelve).

### AGENTIC (BE)
- **NEW** `comunify/backend/src/modules/comunify/copilot/api/__init__.py` — reexport thin `chat.router` del engine.
- **EDIT** `comunify/backend/src/main.py` — `include_router(copilot_router, prefix="/api/v1/comunify/copilot")`.
- **EDIT** `comunify/backend/pyproject.toml` — deps `luana-core-{copilot,iam,platform}`.

### FE tokens
- **EDIT** `comunify/frontend/src/app/globals.css` — `:root` vars del design-system §4 + agentes `--agent-{luana,nina,tomas,sofia,bruno,lucia}` + dark mode override (mockup) + **`--radius` pill** (ver § Resolución punto 4).
- **EDIT** `comunify/frontend/tailwind.config.ts` — mapear tokens (design-system §5) + `borderRadius` pill + fonts Satoshi/Manrope/Inter.
- **EDIT** `comunify/frontend/src/app/layout.tsx` — cargar fonts (`next/font/local` Satoshi + `next/font/google` Manrope/Inter).

### FE shell wrapper + routing
- **NEW** `comunify/frontend/src/lib/routing/shell-routes.ts` — SSoT nav-tree (sitemap v2): `AGENT_CATALOG` (nina/tomas/sofia/bruno/lucia + plataforma), `AGENT_RIBBON_ORDER`, `AGENT_SUBTABS`, `AGENT_SUBSUBTABS`, `DEFAULT_LANDING = {agent:'nina', subtab:'marca'}`, guards (`isValidAgent`/`isValidSubtab`/`getDefaultSubtab` whitelist-only) — port re-temizado de nicolify.
- **NEW** `comunify/frontend/src/lib/agents.ts` (o `lib/agent-catalog.ts`) — catálogo cast full (slug/name/role/colorToken/initial/thumbnail) del ADR-comunify-001 (cementado en checkpoint + nav-tree + mockup).
- **NEW** `comunify/frontend/src/components/shared/shell-organism/` — brand thin wrappers: `AgentAvatar.tsx`, `LogoMark.tsx`, `ThemeToggle.tsx`, `TenantSwitcher.tsx` (single-user → display), `_agent-tw-classes.ts` (JIT-safe switch por agente · G3). **NO mirror de los organismos del kit** (RN-4) — solo wrappers de marca.
- **NEW** `comunify/frontend/src/stores/shell-store.ts` — `createShellStore({ storageKey: 'comunify-shell-state' })` (factory del kit, SSR-safe).
- **NEW** `comunify/frontend/src/app/[tenantId]/(shell-organism)/layout.tsx` — Server Component: valida sesión Clerk (`auth() → userId`; sin sesión → el edge-redirect del proxy ya cubre, este es defensa) → render `<ShellLayoutWire>`.
- **NEW** `comunify/frontend/src/app/[tenantId]/(shell-organism)/_components/ShellLayoutWire.tsx` — `"use client"` bridge: monta `ShellLayout` del kit con props de marca (catalog, `useShellStore`, `useChatStore`, `getAgentClasses`, slots, testIds, `supervisorName="Luana"`/`supervisorSlug="luana"`). Port re-temizado de nicolify.
- **NEW** `comunify/frontend/src/app/[tenantId]/(shell-organism)/page.tsx` — Server Component redirect a `DEFAULT_LANDING` (nina/marca). **Cuidado Next 16 soft-nav** — ver § Resolución punto 5 (el bare-tenant redirect va en `proxy.ts`, no en page).
- **NEW** `[agent]/page.tsx` + `[agent]/[subtab]/page.tsx` (+ `not-found.tsx`) — placeholders "Próximamente" (EmptyState del kit) con CTA "Hablar con Luana" (enfoca composer). N3 (`[subsubtab]`) opcional MVP (solo combos poblados nina.marca/nina.ofertas).
- **EDIT** `comunify/frontend/src/proxy.ts` — edge-redirect Clerk (port de nicolify): allowlist público (`/sign-in`, `/sign-up`, `/__clerk`, `/api/health`) + bare-tenant `/:tenantId` → `/:tenantId/nina/marca` (edge, NO `redirect()` in-render).
- **RETIRE-FROM-ROUTING** `comunify/frontend/src/app/(dashboard)/` — queda en git (no se borra), pero deja de ser reachable post-login (RN-5). El `app/page.tsx` raíz redirige al shell tenant-scoped. (Out of scope retirar el grupo físicamente.)
- **INTACT** `comunify/frontend/src/app/onboarding/` — NO se toca (wizard 4-step, fuera de scope).

### FE chat-store (SSE)
- **NEW** `comunify/frontend/src/stores/chat-store.ts` — zustand store que implementa `ShellChatStoreApi` con **SSE real** contra `/api/v1/comunify/copilot/chat` (vía `fetchClient` que auto-inyecta `X-Tenant-ID` + Bearer). Estados idle/thinking/streaming/error/network. ⚠️ **LIFT CANDIDATE → `@luana`** (ver § Prior art).

### NEVER-TOUCH
- `core/@luana/ui-kit/src/**` (kit — consume vía import; cambio = `/pm-luana` lift).
- `core/luana-core-copilot/src/**` (engine — consume vía import; cambio = `/pm-luana` lift).
- `comunify/frontend/src/app/onboarding/**` (wizard intacto).
- `nicolify/**` · `vitalia/**` · `lupulo/**` (cross-brand — NUNCA editar; nicolify es REFERENCIA read-only).

---

## 11. Cross-Cutting Concerns

- **Tenant isolation (RN-2):** el `tenant_id` del FE sale de `useTenantId()` (iam) — **NUNCA** `useAuth().orgId` (Clerk org). El BE thin mount delega al engine que resuelve el tenant del JWT + valida `X-Tenant-ID`. Adversarial-tenant (SC-adversarial-tenant) lo enforce el engine. Arch-test `test-no-clerk-organizations.test.ts` (comunify replica) debe estar verde.
- **Currency:** N/A — MVP sin montos (SC-i18n verifica cero strings currency).
- **Master data / locale:** N/A — sin fechas/montos user-facing nuevos (el `time` 'HH:MM' del chat es UI-local).
- **Spanish neutro LatAm (RN-6):** todo el copy del § Microcopy (01-spec) en neutro/tuteo, sin voseo. Pre-commit §1 escanea el código de producto FE. (El mockup usa voseo-allowed por ser diseño interno.)
- **PII:** el `response_model=` no aplica al SSE del engine (streaming) — el engine ya sanitiza vía `sanitize_payload` en sus writes de observabilidad. comunify no expone DTOs nuevos con PII.
- **Native-first:** lint/tests/tsc native (host), nunca `docker exec`. `pnpm install` desde root.

---

## 12. Architecture Fitness Impact

| Gate | Surface | Qué valida |
|---|---|---|
| `comunify/backend/tests/architecture/` | BE | `redirect_slashes=False` presente · response_model (N/A al SSE thin) · no cross-module imports prohibidos · tenant-isolation |
| `comunify/frontend/src/__tests__/architecture/` | FE | FSD boundaries · `test-no-clerk-organizations` · no-hardcoded-hex (tokens) · no-low-contrast-pairs |
| Anti-dup Cat 12 (auditor scan) | FE | cero mirror del kit shell · cero mirror de los locals de nicolify (`components/shared/shell-organism/{ConfigTab,EmptyState,SubSubTabsBar}` de nicolify NO se copian — esos viven en el kit y se consumen) |
| `pnpm install` verde | HYGIENE | lockfile SSoT root resuelve con `@luana/*` declaradas |

**Allowlist shrinkage:** ninguna esperada (story additive). Si el grep no-clerk-org de comunify tiene allowlist heredada del bootstrap, NO crece.

---

## 13. capability YAML + modules MD Updates Required (post-merge · Fase E `/pm-comunify`)

- **NEW** `comunify/docs/product/capabilities/shell-organism/shell-comunify.yaml` — cap `comunify/shell-organism`, header `# cap: comunify/shell-organism.shell-comunify` en los archivos clave (layout, chat-store, shell-routes), `dev_preview.main_component` → `app/[tenantId]/(shell-organism)/layout.tsx`, `scenarios` ← SCs del 01-spec.
- **EDIT** `comunify/docs/product/modules/platform.md` (o equivalente) — narrativa del chrome 3-zonas + Ribbon cast comunify, si existe el módulo MD; si no, pointer mínimo.
- **EDIT** `comunify/docs/architecture/design-system.md` — § Radius: documentar la decisión pill (controles `rounded-full`, cards/burbujas `--radius-lg`) + el cambio `--radius` (ver Resolución punto 4).
- **NEW** `comunify/docs/architecture/SHELL-DESIGN-CONTRACT.md` — graduar el `design-inventory.md` (goldens) al contrato vivo del shell comunify (port re-temizado de vitalia/nicolify).

---

## 14. Test Surfaces (TDD — RED first)

- **AGENTIC (BE):** test de integración del mount (`tests/modules/comunify/copilot/test_chat_mount.py`): el router responde en `/api/v1/comunify/copilot/chat` con auth válida (200 SSE) y 401 sin tenant. **RED primero.** (No se testea el engine — eso vive en `core/luana-core-copilot`.)
- **FE chat-store:** Vitest del store (`stores/__tests__/chat-store.test.ts`): parse SSE → mensajes; transición idle→streaming→idle; 5xx → error; abort → network; doble-send bloqueado. **RED primero.**
- **FE shell wrapper:** Vitest del wire (render del ShellLayout con catalog comunify) + arch-test (no-clerk-org, no-hardcoded-hex).
- **E2E (Playwright, `playwright_required: true`):** specs en `comunify/frontend/e2e/regression/comunify-shell-organism/` — uno por SC del 01-spec (ver `04-validators § scenario_coverage`). Smoke de la ruta nueva `(shell-organism)` ANTES de la página (TDD). Usar `auth.fixture` (no `@playwright/test` directo) + gate anti-burbuja `base.ts`.
- **DoD live-verify (#37):** SC-chat-ok ejercido en dev-app comunify (`dev-app.comunifylat.com` o `localhost:3003`) autenticado: enviar mensaje → burbuja stream → fila `copilot_trace_event WHERE tenant_id=:tid` + leer backend log sin traceback.

---

## 15. Research Notes (date-aware)

- **No WebSearch.** Esta story NO introduce un patrón novel. Todo se CONSUME de artefactos vivos del repo (`@luana/ui-kit@0.4.1`, `core/luana-core-copilot`). Verificado por lectura directa el **2026-06-16**:
  - `core/@luana/ui-kit/src/organism/shell/` — 35 archivos (ShellLayout, Ribbon, ChatPanel, types.ts con `ShellChatStoreApi`, etc.). `index.ts` reexporta. `package.json` → `@luana/ui-kit@0.4.1`.
  - `core/luana-core-copilot/src/luana_core_copilot/api/chat.py` — `POST /chat`, SSE, auth `get_current_user`(HTTPBearer/Clerk) + `get_tenant_context`(X-Tenant-ID) + `get_db`(sync Session). DTO `CopilotChatRequest`.
  - `nicolify/frontend/src/app/[tenantId]/(shell-organism)/` — port reference (layout 57L, page 32L, `_components/ShellLayoutWire.tsx`, `proxy.ts` edge-redirect, `lib/routing/shell-routes.ts` 328L, `stores/chat-store.ts` MOCK).
- **Knowledge cutoff disclosure:** el shell kit + copilot engine son post-cutoff de mi modelo → me apoyé 100% en lectura del workspace (cero confabulación de patrones).

---

## Prior art audit / Existing systems audit (NO NEW LAYER rule)

### Source of evidence
- [x] Self-run greps (Path B — fallback). Re-validados los anchors del prompt `/po-ux` por lectura directa.

### Audit cross-module ejecutado

```bash
# 1. ¿Algún brand ya monta el copilot /chat router thin?
grep -rln "luana_core_copilot.api.chat" {nicolify,vitalia,comunify,lupulo}/backend/src/   # → NONE
# 2. ¿Existe un copilot api/ en algún brand que incluya el engine chat?
find {vitalia,nicolify,comunify}/backend/src/modules/*/copilot -type d -name api          # → vitalia (solo wizard, NO chat)
# 3. ¿El kit shell organism existe (consumir, no recrear)?
ls core/@luana/ui-kit/src/organism/shell/   # → 35 archivos + index.ts
# 4. ¿Algún brand mockea chat-store que comunify deba lift (no mirror)?
#    nicolify/frontend/src/stores/chat-store.ts (MOCK setTimeout) + vitalia (idem)
# 5. ¿comunify copilot tiene tools/ de dominio? (RN-3)
ls comunify/backend/src/modules/comunify/copilot/   # → extractors/ kb/ workflows/  (NO tools/)
```

### Sistemas existentes encontrados

| Sistema | Path | Estado | Decisión |
|---|---|---|---|
| Shell chrome organism | `core/@luana/ui-kit/src/organism/shell/` (v0.4.1) | active · proposal migrated | **CONSUME (import)** — cero mirror |
| Copilot chat engine | `core/luana-core-copilot/.../api/chat.py` | active | **CONSUME (thin include_router)** — cero edición engine |
| nicolify shell port | `nicolify/frontend/src/app/[tenantId]/(shell-organism)/` | active (otra brand) | **REFERENCE read-only** — re-skin, NO importar de nicolify |
| nicolify locals `components/shared/shell-organism/{ConfigTab,EmptyState,SubSubTabsBar}` | nicolify | active (otra brand) | **NO mirror** — esos nombres viven en el KIT; comunify consume del kit, no copia de nicolify (RN-4, Cat 12) |
| chat-store mock | `nicolify/.../stores/chat-store.ts` + vitalia | active (MOCK) | comunify construye el REAL (SSE) brand-local → **LIFT CANDIDATE** (no ahora) |
| comunify copilot module | `comunify/backend/src/modules/comunify/copilot/` | active (extractors/kb/workflows, **sin tools/**) | **EXTEND** — añadir `api/` thin mount; RN-3 por construcción |

### Decisión por sistema

- **Shell kit (`@luana/ui-kit/organism/shell`)** → **CONSUME**. Es el dueño de los organismos/moléculas/átomos del shell. comunify importa, no recrea. (Anti-dup Cat 12.)
- **Copilot engine `/chat`** → **CONSUME (thin mount)**. El engine es brand-agnóstico (descubre módulos por convención). El thin mount es 1 reexport + 1 `include_router` + deps. **Boundary check (memoria `engine-boundary-consume-not-mount`):** el engine corre sync `Session` + `luana_core_iam` deps — PERO el endpoint `/chat` es **self-contained** (trae sus propias deps de iam/platform que TODAS las brands consumen). vitalia YA monta otro router copilot del engine (wizard) → compatibilidad probada. **NO es el caso de mismatch de mi memoria** (ese era sales-agent closer_studio con su propio IAM). Aquí el mount es limpio. CONSUME confirmado.
- **chat-store** → **NEW brand-local + LIFT CANDIDATE**. nicolify/vitalia tienen MOCKS (no sirven: no hacen SSE real). comunify es el PRIMERO en construir el real. Net-new justificado (instancia funcional, no recreación de primitiva). **NO lift ahora** — el lift a `@luana` es una `/pm-luana` promotion proposal **post-prueba** (cuando vitalia/nicolify reemplacen sus mocks). Se marca el candidato; no se escala en esta story.
- **comunify copilot module** → **EXTEND** (añadir `api/`). Cero tools de dominio → Luana conversa+anuncia (RN-3).

### Cross-brand mirror check
- **NEGATIVO.** Ningún sistema de esta story mirrorea otro brand. El shell + el copilot viven en `core/` (engine) y se consumen. El chat-store real es net-new (los demás son mocks, no equivalentes). Sin lift requerido AHORA.

---

## Integration design (CONN — anti-orphan)

> Ninguna funcionalidad llega a `done` como isla. Las 4 contenciones CONN:

- **C — Consumed:** el shell lo consume el creator post-login (único consumidor real, single-user). El chat-store lo consume `ChatPanel` (kit) vía inyección `useChatStore`. El thin mount lo consume el chat-store FE.
- **O — On the map:** vive en la cap `comunify/shell-organism` (`cap_target` declarado). Zona = chrome que hospeda las 3 zonas (Agentes/Plataforma/Infraestructura).
- **N — Navigable/reachable:** post-login → `proxy.ts` edge-redirect → `[tenantId]/(shell-organism)` → DEFAULT_LANDING (nina/marca). El `(dashboard)` viejo deja de ser reachable (RN-5). Ribbon + Luana sidebar = navegación.
- **N — Notarized/registered:**
  - BE: `app.include_router(copilot_router, prefix="/api/v1/comunify/copilot")` en `main.py`.
  - FE: el shell se registra en el routing (`app/[tenantId]/(shell-organism)/`); el `proxy.ts` matcher lo protege; el chat-store se inyecta en `ShellLayout.useChatStore`; los agentes se registran en `shell-routes.ts` (SSoT del Ribbon).

**Reachability path concreto:** `login (Clerk) → proxy.ts (auth.protect + bare-tenant redirect) → /[tenantId] → page redirect → /[tenantId]/nina/marca → (shell-organism)/layout.tsx (valida sesión) → ShellLayoutWire → ShellLayout(kit) → Luana sidebar (chat-store SSE) → POST /api/v1/comunify/copilot/chat → engine orchestrator → copilot_trace_event row.`

---

## Resolución de los 5 puntos (handoff /po-ux)

### Punto 1 — T-0 hygiene
**Resuelto: Ticket-0 (config, workhorse, BLOCKS todos los FE tickets).** Alinear lockfiles a vitalia (borrar `package-lock.json` + `pnpm-lock.yaml` de `comunify/frontend/`; root `pnpm-lock.yaml` es SSoT) + trackear `next-env.d.ts` + declarar `@luana/*` deps en `package.json` (mirror nicolify). **Gate de cierre:** `pnpm install` desde root → verde (verificar resolución, NO blind-delete). `production_code=config`.

### Punto 2 — Consume @luana/ui-kit organism/shell (cero mirror)
**Resuelto: CONSUME vía import.** El kit (v0.4.1, 35 archivos, `index.ts` reexporta) es el dueño. comunify NO copia ni los organismos del kit ni los locals de nicolify. Gate en `04-validators § architectural_validation` (grep Cat 12: cero `ConfigTab.tsx`/`EmptyState.tsx`/`SubSubTabsBar.tsx`/`Ribbon.tsx`/etc. en `comunify/frontend/src/` — esos se importan de `@luana/ui-kit`).

### Punto 3 — Mount engine /chat thin + SSE chat-store
**Resuelto.** BE: `include_router` del engine `chat.router` en `/api/v1/comunify/copilot` + deps `luana-core-{copilot,iam,platform}`. FE: `chat-store.ts` real (SSE) que implementa `ShellChatStoreApi` del kit + se inyecta en `ShellLayout.useChatStore` (cast `as unknown as ShellChatStore`, como nicolify). **DoD #37 write = SC-chat-ok** (mensaje → SSE → fila `copilot_trace_event` scoped al tenant). **LIFT CANDIDATE** del chat-store → `@luana`: NOTADO, NO se ejecuta (es `/pm-luana` proposal post-prueba; construir en comunify primero).

### Punto 4 — Radius pill token (decisión TOKEN-DRIVEN)
**Resuelto: token-driven, sin override per-componente.**
- **Decisión:** comunify adopta **pill para controles** (`rounded-full`) y `--radius-lg` (1.25rem) para cards/burbujas. Esto NO se hace cambiando `--radius` a un valor pill (rompería las cards que también leen `--radius`/`borderRadius.DEFAULT`).
- **Mecánica:** los controles del shell (botones, composer, tabs, chips) ya usan `rounded-full` **literal** en el mockup y en el kit (verificado en `shell.html`: `rounded-full` en TopBar buttons, composer, ribbon tabs, chips; las burbujas usan `rounded-2xl`). Es decir, **el kit ya pinta los controles del shell como pill por clase literal, no leyendo `--radius`** — no hay divergencia.
- **`--radius`** de comunify se mantiene en `0.75rem` (cards/inputs genéricos fuera del shell); `--radius-lg` en `1.25rem` (cards/burbujas). El token NO se fuerza a pill globalmente.
- **Verificación pedida (¿el kit honra el radio de marca vía token?):** los **controles del shell** son pill por clase literal del kit (`rounded-full`), NO por `--radius` → comunify NO necesita un fix de token en el kit para el pill de controles. Las **cards/burbujas** del kit usan `rounded-2xl`/`rounded-lg` (no `--radius` de marca tampoco). **Conclusión:** cero cambio en el kit; cero `/pm-luana` proposal por radius. El pill se logra porque el kit ya lo aplica por clase + comunify aporta los tokens de color/fonts. Documentar en `design-system.md § Radius` (Fase E).
- **Si en build se detecta** que algún control del shell lee `--radius` (no `rounded-full` literal) y se ve cuadrado → es un **divergence flag**: NO se parchea per-componente en comunify (rompería el token-driven); se levanta como **`/pm-luana` kit-token-fix proposal** (nota en checkpoint), y comunify consume lo que existe mientras tanto. **No se asume el fix en un ticket de esta story** (engine boundary HARD).

### Punto 5 — Routing + auth + SSR-safe
**Resuelto.**
- `app/[tenantId]/(shell-organism)/` + `shell-routes.ts` (sitemap v2 del nav-tree). `DEFAULT_LANDING = {agent:'nina', subtab:'marca'}`.
- **`tenant_id` vía `useTenantId()`** (iam), NUNCA Clerk org (learning no-clerk-organizations; arch-test enforce).
- **Auth = edge-redirect** (`proxy.ts` Clerk `auth.protect()` + bare-tenant `/:tenantId` → `/:tenantId/nina/marca`), **NO `redirect()` in-render** (learning Next 16 soft-nav "Rendered more hooks": el redirect del bare-tenant va en el proxy, no en el Server Component page, para evitar el bug con `dynamic({ssr:false})`).
- **SSR-safe store boundary:** el kit `ShellLayout` ya hidrata su shell-store dentro de su chunk `dynamic({ssr:false})` (verificado en nicolify wire) + skeleton store-free (ADR-vitalia-006). comunify usa `createShellStore({storageKey:'comunify-shell-state'})`.
- **`(dashboard)` retirado del routing** (no reachable; queda en git); **`onboarding/` intacto** (RN-5, AC-6, SC-dashboard-unreachable).

---

## 16. Open Questions for PM

- **OQ-1 (Tailwind JIT scan — memoria `tailwind-jit-scan-breaks-on-lift`):** los wrappers de marca (`_agent-tw-classes.ts`) usan switch literal por agente (G3 JIT-safe). PERO el kit `@luana/ui-kit` usa clases que deben ser escaneadas por el Tailwind de comunify. **Verificar en T-tokens** que `comunify/frontend/tailwind.config.ts` `content`/`@source` incluye el path del kit (`../../core/@luana/ui-kit/src/**`) — si no, los estilos del kit (incl. `rounded-full`, agent rings) se rompen silenciosamente y el gate es **visual e2e, no tsc-green**. (Nicolify ya lo resolvió — copiar su `content` glob.) **Recomendación:** incluir el path del kit en el content scan; flaggear a Chris si falta.
- **OQ-2 (ADR de arquitectura shell comunify):** nicolify tiene `ADR-nicolify-001` (9 secciones, gate bloqueante para sub-tabs). comunify NO tiene equivalente. ¿Se crea `ADR-comunify-002-shell-feature-architecture` (port del nicolify) AHORA, o se difiere a la primera story que porte un área real (R-shell+1)? **Recomendación:** diferir — esta story es el ORIGEN del patrón (como `nicolify-r0-shell-organism` lo fue), no aplica el gate a sí misma. El ADR se crea cuando se porte la primera sub-tab con feature real.
- **OQ-3 (skill `comunify-design-system`):** no existe (nicolify/vitalia lo tienen). El `must_load_skills` del FE no puede citarlo. **Recomendación:** crear el skill como follow-up `/pm-comunify` (no bloquea esta story; el `design-inventory.md` + `design-system.md` cubren los goldens). Notado en `05-guidelines.md`.
- **OQ-4 (avatares):** placeholders SVG en `comunify/frontend/public/agents/{slug}/avatar.svg` (Chris da finales después). NO bloquea (resuelto en spec Q1).
- **OQ-5 (chat-store lift):** confirmar con `/pm-luana` que el lift del chat-store real a `@luana` es una proposal POST-merge de esta story (no se ejecuta acá). Notado como lift candidate en § Prior art.
