# Dispatch Plan — comunify-shell-organism

> Plan de spawn para `/dev-team comunify`. SSoT tickets: `06-tickets.yaml`. Validators: `04-validators.yaml`.

## autonomous_mode: **false** (default)

Story **funcional** (`verification_nature: funcional`) con DoD #37 + write live (SC-chat-ok) + demo Chris (gate G). **NO autonomous** — `/dev-team` cierra `developed` → pausa-y-ofrece (`phase: AWAIT_CHRIS_VERIFY`) salvo que Chris opt-in. Architect propone false; Chris ratifica si quiere autonomous.

## Ticket → agent → model → cost matrix

| Ticket | Surface | primary_agent | model (tier) | Est. cost | Depende de |
|---|---|---|---|---|---|
| **T-0** | hygiene | `builder-frontend` | workhorse | bajo | — |
| **T-agentic** | agentic (BE mount) | `builder-agentic` | **flagship (R23 HARD)** | medio | — |
| **T-tokens** | FE tokens | `builder-frontend` | workhorse | bajo | T-0 |
| **T-shell** | FE wrapper+routing | `builder-frontend` | workhorse | **alto** (grueso del shell) | T-0, T-tokens |
| **T-chat-store** | FE SSE store | `builder-frontend` | workhorse | medio | T-0, T-agentic |
| **T-e2e** | E2E + live-verify | `builder-frontend` | workhorse | medio-alto (Playwright) | T-agentic, T-shell, T-chat-store |

> **R23 (HARD):** T-agentic toca `production_code=true` en superficie agentic (`copilot/`) → **flagship obligatorio** (builder-agentic + auditor-agentic). El resto = workhorse. AGENTIC **separado** de FE (R23).

## DAG (orden de ejecución)

```
        ┌──────────────────────────────────────────┐
T-0 ────┤ blocks: T-tokens, T-shell, T-chat-store   │
        └──────────────────────────────────────────┘
T-agentic ──blocks──> T-chat-store, T-e2e

Wave 1 (paralelo):  T-0  +  T-agentic
Wave 2:             T-tokens         (← T-0)
Wave 3:             T-shell (← T-0,T-tokens)  +  T-chat-store (← T-0,T-agentic)
Wave 4:             T-e2e   (← T-agentic, T-shell, T-chat-store)
```

> Bucket lock M14: T-agentic = `code:copilot` (BE) · T-tokens/T-shell/T-chat-store/T-e2e = `code:frontend`. AGENTIC y FE pueden ir en paralelo (módulos distintos). Dentro de FE, serializa por el lock `code:frontend` (commit por pathspec).

## Playwright visual scope (de 04-validators)

- **story_scope_routes:** `/[tenantId]/(shell-organism)`, `/[tenantId]/nina/marca`, `/[tenantId]/[agent]/[subtab]`, `/[tenantId]/plataforma`.
- **story_scope_components:** `app/[tenantId]/(shell-organism)/**`, `components/shared/shell-organism/**`, `stores/{chat-store,shell-store}.ts`, `lib/routing/shell-routes.ts`.
- **forbidden_visual_changes:** `core/@luana/ui-kit/src/**` (kit — lift only) · `app/(dashboard)/**` (retirar routing, no refactorizar) · `app/onboarding/**` (intacto).
- **NO** screenshot full-page; scoped al shell. Avatares = placeholders SVG (Chris da finales).

## Live-verify (DoD #37)

- **env:** `make dev-comunify` → `dev-app.comunifylat.com` (Chrome DevTools MCP) o `localhost:3003` fallback.
- **write:** SC-chat-ok — enviar mensaje a Luana autenticado → burbuja stream + fila `copilot_trace_event` scoped al tenant + backend log sin traceback.
- **precondición:** `alembic upgrade head` en `comunify_dev` (tabla `copilot_trace_event`) + creds en `comunify/.env.dev`. ⚠️ binding tenant comunify 🟡 — si falta seed, el write SC-chat-ok se firma en G (gate manual Chris).

## Invocación manual (no-autonomous)

```
# Wave 1
/dev-team comunify T-0
/dev-team comunify T-agentic         # builder-agentic flagship

# Wave 2-4 (tras green + dependencias)
/dev-team comunify T-tokens
/dev-team comunify T-shell
/dev-team comunify T-chat-store
/dev-team comunify T-e2e

# Cierre developed → G (AWAIT_CHRIS_VERIFY) → /pm-comunify reconcile → /auditor → merge
```

## Invocación autonomous (solo si Chris ratifica autonomous_mode: true)

```
/dev-team comunify --autonomous   # corre T-0..T-e2e en DAG, developed → /auditor sin pausa G
```
> No recomendado por default: story funcional con write live + demo. El gate G (Chris ejerce el chat live) es valioso acá.
