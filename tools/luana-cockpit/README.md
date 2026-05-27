# Luana Cockpit

Visualizador + editor del workflow Spec-Driven Development de Luana platform (multi-brand). Lee directo del filesystem (no requiere DB) y permite editar metadata vía forms + chris-input.md conversacional.

## Status: v0.6 (Next.js standalone WIP · Phase 5.1+5.2)

Phase 5 del plan `ok-lo-apruebo-realiza-cheeky-harbor.md`:

- **5.1** workspace setup (Next.js 16 + Tailwind v4 + Vitest) — ✓ hecho
- **5.2** library functions críticas (workspace, fs-reader/writer, git, chris-input parser, cap ledger, release resolver, chokidar watcher) — ✓ hecho
- **5.3** API routes — pendiente
- **5.4** vistas pobladas (Roadmap / Board / Map / Learnings) — pendiente

## Quickstart

Requiere Node 20+ y pnpm 9.15.9+.

```bash
cd tools/luana-cockpit
cp .env.local.template .env.local      # edita si necesario
pnpm install
pnpm test                              # corre 6 tests vitest (cap-ledger + chris-input-parser)
pnpm dev                               # arranca dev server en :4000
pnpm build                             # build standalone Next.js
```

Abre <http://localhost:4000>. Redirige a `/roadmap` por defecto.

## Las 4 vistas

| Ruta | Vista | Estado |
|---|---|---|
| `/roadmap` | Roadmap por releases (drag stories entre releases) | placeholder · Phase 5.4 |
| `/board` | Backlog Board kanban por estados v4 | placeholder · Phase 5.4 |
| `/map` | Mapa Implementado agente × módulo × capability | placeholder · Phase 5.4 |
| `/learnings` | Timeline learnings cronológico | placeholder · Phase 5.4 |

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | Next.js 16 (App Router · standalone output) | SSR + API routes en mismo proceso · ideal para tool local |
| UI | React 19 + Tailwind v4 | Tokens del mockup v0.5.2 cementados en `tailwind.config.js` |
| Markdown | gray-matter + react-markdown + rehype-highlight | Frontmatter + render |
| Editor MD | @uiw/react-md-editor | Edit inline de chris-input.md y otros |
| FS watching | chokidar | Hot-reload cross-process (skill escribe → cockpit refresca) |
| Git | simple-git | Status / SHA / diff para metadata stories |
| Validación | zod | Schemas runtime tipados |
| Tests | vitest + @vitest/coverage-v8 | Fast + ESM-native |

## Fuente de datos (sin DB)

Todo se lee directo del filesystem:

- `{brand}/docs/product/stories/{id}/checkpoint.md` (front-matter YAML schema v2)
- `{brand}/docs/product/stories/{id}/chris-input.md` (conversación asíncrona)
- `{brand}/docs/archive/{year}/stories/{id}/` (stories done)
- `{brand}/docs/product/capabilities/{module}/{cap}.yaml` (ledger v2 con `change_log[]`)
- `{brand}/docs/product/releases/{release_id}.yaml` (releases v2 schema)
- `{brand}/docs/learnings/{date}-{slug}.md`

Edit en cockpit → escribe el archivo correspondiente (atomic write · `.tmp` + rename) → próxima invocación de `/pm-{brand}` lee actualizado. **Cero impacto en tokens de Claude.**

## Library functions (lib/)

Detalle en `docs/process/capability-protocol.md`, `release-protocol.md`, `chris-input-protocol.md`, `cockpit-permissions.md`.

| Módulo | Responsabilidad |
|---|---|
| `lib/types.ts` | TypeScript interfaces (Story, Capability, Release, ChrisInput, ConvEntry, ...) |
| `lib/workspace.ts` | Resolver WORKSPACE_ROOT + detección de brands |
| `lib/fs-reader.ts` | Read markdown con frontmatter + YAML |
| `lib/fs-writer.ts` | Atomic write (tmp + rename) + append-only |
| `lib/git.ts` | Wrappers simple-git (branch, SHA, status, diff) |
| `lib/chris-input-parser.ts` | Parse + serialize chris-input.md (round-trip idempotente) |
| `lib/cap-ledger.ts` | 4 ramas `applyCapChange` (new/fix/extend/derive) + `createDerivedCap` |
| `lib/release-resolver.ts` | Read / list / recompute status releases |
| `lib/chokidar-watcher.ts` | FS watching debounced para hot-reload cockpit |

## Por qué dentro de `tools/` y no en una brand

El cockpit sirve a **todas** las brands (vitalia + nicolify + comunify + lupulo + 6 futuras). No es código de producto. Pertenece al tooling del workspace, junto con `scripts/`. NO se agrega a `pnpm-workspace.yaml` root — corre standalone.

## Mockup ratificado

`mockup-v0.5.2.html` (147 KB) es la SSoT visual. Phase 5.4 popula las 4 vistas siguiendo ese mockup verbatim.

## Scope gate y commit

Branch dedicado: `wip/protocol-cockpit-v0-6` (worktree `~/Proyectos/luana-protocol-cockpit-v0-6/`). Scope: `tools/luana-cockpit/**` + `docs/process/cockpit-*` + `docs/process/{capability,release,chris-input}-protocol.md` + `docs/specs/templates/*template*`.
