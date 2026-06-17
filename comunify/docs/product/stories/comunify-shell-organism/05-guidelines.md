# 05-guidelines — comunify-shell-organism

> Reglas de construcción enforceables para los builders. SSoT técnico: `03-arch.md` (+ per-surface `03-arch-{fe,agentic}.md`).

## must_load_skills (por ticket)

| Surface / ticket | Skills obligatorios | Nota |
|---|---|---|
| **AGENTIC** (T-agentic) | `copilot-expert` + LangGraph canonical (referencia) | R23 flagship. El engine NO se toca — `copilot-expert §0` anti-dup. |
| **FE tokens** (T-tokens) | `frontend-expert` | + `design-system.md` (tokens) |
| **FE shell wrapper** (T-shell) | `frontend-expert` + `playwright-expert` | + `design-inventory.md` (goldens) + `navigation-tree.md` |
| **FE chat-store** (T-chat-store) | `frontend-expert` + `copilot-expert` (SSE contract) + `playwright-expert` | |
| **Live-verify** (todos FE/agentic) | `chrome-devtools-verify` | DoD #37 |
| **HYGIENE** (T-0) | `frontend-expert` (config) | gate `pnpm install` |

⚠️ **OQ-3 — NO existe skill `comunify-design-system`** (nicolify/vitalia lo tienen). Mientras tanto, los goldens de marca = `comunify/docs/architecture/design-system.md` + `design-inventory.md` + `mockups/shell.html`. Crear el skill = follow-up `/pm-comunify` (no bloquea).

## Canon de diseño (binding HARD — `design-system-canon.md` + `frontend-visual-fidelity.md`)

- Esta story es el **ORIGEN del shell comunify** (como `nicolify-r0-shell-organism` lo fue) → compone del kit `@luana/ui-kit`, NO maqueta primitivas a mano.
- Tabs de agente = placeholder (EmptyState del kit). NO list/detail en MVP (no `EntityWorkspaceLayout` todavía — eso es R-shell+1 cuando se porten áreas).
- `Select` canónico del kit (si aplica), NUNCA `<select>` nativo. Cero arbitrary-values salvo los del mockup ya ratificados (el shell.html usa `@[...]` solo en min/max width del sidebar — esos son los del kit).

## Patterns REQUERIDOS

- **consume-kit-not-mirror** — importar de `@luana/ui-kit` los organismos/moléculas/átomos del shell. Cero copia (Cat 12).
- **useTenantId-not-clerk-org** — `tenant_id` de `useTenantId()` (iam). Arch-test `test-no-clerk-organizations`.
- **edge-redirect-not-in-render** — auth + bare-tenant redirect en `proxy.ts` (edge). NUNCA `redirect()` en Server Component page (learning Next 16 soft-nav "Rendered more hooks").
- **ssr-safe-store** — `createShellStore` del kit (hidrata en chunk `ssr:false`); skeleton store-free (ADR-vitalia-006).
- **tokens-not-hardcoded-hex** — colores/radius/fonts vía tokens (`globals.css` + `tailwind.config.ts`). Arch-test no-hardcoded-hex.
- **radius-pill-token-driven** — controles `rounded-full` (clase literal del kit); cards/burbujas `--radius-lg`; `--radius` se mantiene 0.75rem (NO override per-componente; ver 03-arch Resolución punto 4).
- **tailwind-content-includes-kit** — el `content`/`@source` de `comunify/frontend/tailwind.config.ts` DEBE incluir el path del kit (`@luana/ui-kit/src/**`) o los estilos del kit se rompen silenciosamente (memoria `tailwind-jit-scan-breaks-on-lift`; copiar el glob de nicolify). Gate = visual e2e.
- **be-mount-thin** — `include_router` del engine `chat.router` + reexport. Cero lógica nueva en el BE.
- **sse-real-not-mock** — el chat-store hace SSE real contra `/api/v1/comunify/copilot/chat` (NO `setTimeout` mock como nicolify/vitalia).
- **spanish-neutro** — copy user-facing tuteo/neutro, sin voseo (pre-commit §1).
- **tdd-red-first** — test RED por capa antes de implementar (BE mount, FE store, FE wire, E2E specs).

## Patterns PROHIBIDOS

- ❌ Mirror de cualquier organismo del kit en `comunify/frontend/src/` (Ribbon/ChatPanel/ConfigTab/SubSubTabsBar/EmptyState/ShellLayout...).
- ❌ Mirror de los locals de nicolify (`components/shared/shell-organism/{ConfigTab,EmptyState,SubSubTabsBar}` de nicolify) — esos nombres viven en el KIT; consumir del kit.
- ❌ Importar de `nicolify/frontend` o `vitalia/frontend` (cross-brand absoluto).
- ❌ Editar `core/@luana/ui-kit/src/**` o `core/luana-core-copilot/src/**` (engine — `/pm-luana` lift).
- ❌ `useAuth().orgId` / `useOrganization()` como tenant_id.
- ❌ `redirect()` in-render para auth/bare-tenant.
- ❌ Añadir `tools/` de dominio al copilot de comunify (rompería RN-3 — Luana ejecutaría).
- ❌ Crear archivos en `comunify/.../copilot/observability/` o `recording/` (anti-dup §0).
- ❌ Lift del chat-store a `@luana` EN esta story (es `/pm-luana` proposal post-prueba).
- ❌ Tocar `app/onboarding/**` (wizard intacto) o refactorizar el contenido de `app/(dashboard)/**` (solo retirar del routing).
- ❌ Hardcoded hex en componentes (usar tokens).
- ❌ Blind-delete de lockfiles sin `pnpm install` verde.

## files-in-scope vs NEVER-touch

**IN SCOPE (crear/editar):**
- `comunify/frontend/{package.json, next-env.d.ts}` + borrar lockfiles redundantes (T-0).
- `comunify/frontend/src/app/{globals.css, layout.tsx}` + `tailwind.config.ts` (tokens/fonts).
- `comunify/frontend/src/app/[tenantId]/(shell-organism)/**` (wrapper/routing — NEW).
- `comunify/frontend/src/{lib/routing/shell-routes.ts, lib/agents.ts, components/shared/shell-organism/**, stores/{chat-store,shell-store}.ts}` (NEW).
- `comunify/frontend/src/proxy.ts` (EDIT — edge-redirect).
- `comunify/frontend/src/app/page.tsx` (EDIT — redirect al shell; retirar (dashboard) del routing).
- `comunify/backend/src/modules/comunify/copilot/api/__init__.py` (NEW thin mount).
- `comunify/backend/src/main.py` + `comunify/backend/pyproject.toml` (EDIT — mount + deps).
- `comunify/frontend/e2e/regression/comunify-shell-organism/**` + `e2e/pages/**` + `e2e/fixtures/base.ts` (tests).

**NEVER-TOUCH:**
- `core/**` (kit `@luana/ui-kit/src/**` + engine `luana-core-copilot/src/**` — CONSUME, lift = `/pm-luana`).
- `comunify/frontend/src/app/onboarding/**` (wizard intacto).
- `comunify/frontend/src/app/(dashboard)/**` contenido (solo retirar del routing, no refactorizar).
- `nicolify/**` · `vitalia/**` · `lupulo/**` (cross-brand — REFERENCE read-only).
- `comunify/.../copilot/{extractors,kb,workflows}/` (existentes — solo se añade `api/`).
