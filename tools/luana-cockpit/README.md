# Luana Cockpit

Visualizador + editor del workflow Spec-Driven Development de Luana platform (multi-brand). Lee directo del filesystem (no requiere DB) y permite editar metadata vía forms + chris-input.md conversacional.

## Paradigma A · per-worktree (cement 2026-05-28)

**El cockpit es filesystem-as-DB · vive con vos en CADA worktree, no es servicio central.**

Cuando trabajás en `~/Proyectos/luana-vitalia/` (branch `wip/vitalia`), levantás cockpit desde ESE worktree y ve solo los archivos de ESE filesystem (incluye tus cambios live, antes del squash-merge a main).

Múltiples cockpits coexisten en distintos puertos según el brand inferido del path del worktree:

| Worktree | Brand | Puerto |
|---|---|---|
| `~/Proyectos/luana-platform/` (main) | cross-brand (vista consolidada) | **4000** |
| `~/Proyectos/luana-nicolify/` | nicolify | **4001** |
| `~/Proyectos/luana-vitalia/` | vitalia | **4002** |
| `~/Proyectos/luana-comunify/` | comunify | **4003** |
| `~/Proyectos/luana-lupulo/` | lupulo | **4004** |
| `~/Proyectos/luana-protocol-*/` (efímero) | cross-brand | 4000 |

Si trabajás en paralelo en vitalia + comunify, ambos cockpits corren simultáneo en :4002 y :4003 sin colisión.

**Por qué per-worktree:** un cockpit central apuntando a `main` NO vería los cambios pendientes en `wip/vitalia` (viven en otro filesystem físico). Cada worktree levanta SU propio cockpit que ve sus cambios live.

## TL;DR · levantar en cualquier worktree

```bash
# 1. Posicionate en el worktree donde estás trabajando
cd ~/Proyectos/luana-vitalia              # o luana-comunify, luana-platform, etc.

# 2. Comando único (auto-detecta brand + puerto)
make cockpit-up
# → http://localhost:4002  (vitalia)
# → http://localhost:4001  (nicolify · si corrés desde luana-nicolify)
# → http://localhost:4000  (cross-brand · si corrés desde luana-platform/main)

# 3. Ctrl+C para detener
```

El script `scripts/cockpit-up.sh` detecta automáticamente:
- Worktree root via `git rev-parse --show-toplevel`
- Brand inferido del basename (`luana-vitalia` → vitalia → :4002)
- Auto-install de deps si `node_modules` no existe en ese worktree
- Port check (te dice qué proceso ocupa el puerto si hay colisión)
- Sets `WORKSPACE_ROOT` + `DEFAULT_BRAND` envs antes de `exec pnpm dev`

**Override puerto manual:** `PORT=4099 make cockpit-up`.

**Requisitos:** Node 20+ y pnpm 9.15.9+.

```bash
# Si no los tenés:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
corepack enable && corepack prepare pnpm@9.15.9 --activate
```

## Comandos

```bash
pnpm dev          # dev server :4000 con hot reload + chokidar SSE
pnpm build        # Next.js build standalone
pnpm start        # producción :4000 (post-build)
pnpm test         # vitest run · ~67 tests en 6 files (cap-ledger · cap-status · chris-input-parser · drift-view · edit-permissions · tooltips)
pnpm typecheck    # tsc --noEmit
```

## Detener / reiniciar

```bash
# Si lo arrancaste con pnpm dev en foreground: Ctrl+C
# Si quedó en background:
ps aux | grep "next-server" | grep -v grep
kill <PID>

# O matar por puerto:
lsof -ti:4000 | xargs kill
```

## Configuración opcional · `.env.local`

NO es obligatorio crearlo. El cockpit usa fallbacks razonables si no existe.

```bash
cp .env.local.template .env.local
# editar si necesario
```

Variables disponibles:

| Variable | Default | Cuándo overridear |
|---|---|---|
| `WORKSPACE_ROOT` | autodetect via `git rev-parse --show-toplevel` desde cwd | Si el cockpit corre afuera del repo (ej. instalación standalone apuntando a workspace remoto) |
| `DEFAULT_BRAND` | `vitalia` | Si trabajás más con otra brand · usuario puede cambiarla en UI persiste en localStorage |
| `EDITOR_BIN` | fallback chain: `xdg-open,code,xed,gnome-text-editor,nano` | Default: prueba `xdg-open` (delega al editor configurado del desktop), luego `code`, luego `xed`, etc. Override con un solo editor (`EDITOR_BIN=code`) o cadena propia (`EDITOR_BIN=cursor,code,xdg-open`). El editor inline del cockpit cubre 90% de casos · este botón es escape hatch. |
| `PORT` | `4000` | Si el puerto está ocupado · ej. `PORT=4001 pnpm dev` |

## Las 6 vistas

| Ruta | Vista | Funcionalidad clave |
|---|---|---|
| `/roadmap` (default) | Roadmap por releases | Drag stories entre releases F0..F8 (solo idea/refining/refined) · Merge release a main cuando todas done |
| `/board` | Backlog kanban | 10 columnas estados macro v4 · drag CHRIS_ALLOWED only (idea↔refining + parked/dropped) · WIP badges + filtros |
| `/map` | Mapa Implementado | Banner **Salud de Producto** (distribución de caps por status del JSON live) + grid agentes (Lisa/Valeria/Adrián/Lucas/Camila/Configurar) + sección Infra full-width · click cap → **Cap Drawer** |
| `/arquitectura` | SYSTEM-MAP global | 7 agentes × functional_areas + flows cross-agent + data ownership |
| `/drift` | Caps no verified-live | Lista priorizada por severidad (stub/wip/partial/drift) para saber qué arreglar |
| `/learnings` | Timeline learnings | Cronológico desc · search + tags pills + xed open |

> No existe un tab `/functionality`. La trazabilidad de una capability (scenarios → code files → access → business rules → changelog) se ve en el **Cap Drawer**, que se abre clickeando un cap en `/map`.

## Story Drawer (slide-in 800px)

7 tabs por story:

1. **📋 Checkpoint** — frontmatter v2 read-only + action buttons contextuales por state (CHRIS_ALLOWED transitions). State=done → DoneBanner + "Nueva story basada en esta".
2. **💭 chris-input.md** — 3 paneles (notas / refs / conversación) con CRUD append-only Chris-facing.
3. **📝 Spec** — render `01-spec.md` + ↗ abrir en editor externo.
4. **🎨 Diseño** — render `02-design-*.md` + iframe mockups + fullscreen modal (ESC para cerrar).
5. **🏗 Arq** — render `03-arch.md`.
6. **✅ Audit** — gherkin-matrix + reviews.
7. **📂 Files** — listing artifacts canónicos esperados.

## Cap Drawer

Slide-in que muestra la traza completa de una capability (la unidad atómica es el **scenario**, no atomics — `atomic` murió en la consolidación 2026-05-28, ver `docs/process/lifecycle.md` § 2). Orden:

1. **YAML ledger** — identity + status + path (xed button) + ✚ Extender
2. **📍 Cómo verlo** — user-facing name/description + dev_preview (ruta, componente, endpoints, e2e_test)
3. **✨ Scenarios** — qué hace, en Gherkin Given/When/Then (con edge cases + e2e_test + spec ref)
4. **📁 Archivos de código** — cross-checked vía header `# cap:` (code-index)
5. **🔑 Acceso** — entry points + roles + clinic scope (HIPAA)
6. **📋 Reglas de negocio** + **🔗 Capabilities relacionadas**
7. **🔍 Validación bidireccional** (cross-checks) + **Historial** (change_log cronológico)

✚ **Extender** modal con 3 cards visuales (fix · extend · derive) → crea story que toca el cap.

## 6 modales

- `FullscreenMockupModal` — iframe 95vw · ESC close
- `OpenInEditorModal` — preview path + spawn editor
- `FromDoneModal` — crear story basada en done · parent_story declarado
- `NewReleaseModal` — crear release nuevo
- `MergeReleaseModal` — preview operaciones + dual-confirm
- `TransitionModal` — con razón obligatoria si parked/dropped

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | Next.js 16 App Router (Turbopack dev) | SSR + API routes en mismo proceso · ideal para tool local |
| UI | React 19 + Tailwind v4 | Tokens del mockup v0.5.2 cementados |
| Drag-drop | @dnd-kit/{core,sortable,utilities} | Drag stories entre releases/columnas |
| Markdown | gray-matter (frontmatter) + react-markdown + remark-gfm + rehype-highlight (render) | Parseo frontmatter v2 + render GFM con syntax highlighting |
| Editor MD | @uiw/react-md-editor | Edit inline chris-input.md |
| FS watching | chokidar + SSE | Hot-reload cross-process (Chris edita en xed → UI refresh <2s) |
| Git | simple-git | Status / SHA / diff metadata stories |
| Validación | zod | Schemas runtime tipados |
| Tests | vitest + @vitest/coverage-v8 | Fast ESM-native |

## Endpoints API (19)

Todos en `app/api/`. Reciben JSON · devuelven JSON · Zod validation · whitelist guards.

| Path | Métodos | Función |
|---|---|---|
| `/api/file` | GET/PUT | Read/write arbitrary file con whitelist paths |
| `/api/stories` | GET | Aggregate stories active + archive |
| `/api/stories/[id]` | GET/PATCH | Single story + edit fields editables Chris (release/priority/goal/anti/reuse) |
| `/api/releases` | GET/POST/PUT/DELETE | CRUD releases YAML · DELETE = soft-move a `_archived/` |
| `/api/chris-input/[storyId]` | GET/PATCH | CRUD secciones chris-input.md · conversación forces author=chris |
| `/api/capabilities` | GET | Aggregate caps |
| `/api/capabilities/[module]/[cap]` | GET/PATCH | Single cap + edit solo `status` con razón ≥10 chars |
| `/api/capabilities/status` | GET | Lee `_status-computed.json` (summary + computed_status por cap) · alimenta Salud de Producto + badges del Mapa |
| `/api/capabilities/code-index` | GET | Lee code-to-cap index (header `# cap:`) · archivos asociados por cap |
| `/api/capabilities/bidirectional` | GET | Lee reporte de validación bidireccional (cross-checks cap↔código) |
| `/api/system-map` | GET | Lee `SYSTEM-MAP.yaml` (agentes + functional_areas + flows) · esqueleto del Mapa + vista Arquitectura |
| `/api/extend-cap` | POST | Crear story que toca cap (fix/extend/derive) |
| `/api/from-done` | POST | Spawn story basada en parent done |
| `/api/transition` | POST | Cambiar state SOLO whitelist CHRIS_ALLOWED_TRANSITIONS (403 otros) |
| `/api/open` | POST | Spawn editor externo (`$EDITOR_BIN` env · default xed) · whitelist paths |
| `/api/merge-release` | POST | Preview + dual-confirm merge release a main (NO ejecuta git mv automático) |
| `/api/refs/upload` | POST | Multipart upload binarios a `{brand}/docs/product/stories/{id}/refs/` |
| `/api/watch` | GET | SSE stream (chokidar) push live cuando archivo .md/.yaml cambia |
| `/api/learnings` | GET | Aggregate learnings cronológico |

## Fuente de datos (filesystem-as-DB)

Todo lee directo del filesystem:

- `{brand}/docs/product/stories/{id}/checkpoint.md` (frontmatter YAML schema v2)
- `{brand}/docs/product/stories/{id}/chris-input.md` (conversación asíncrona)
- `{brand}/docs/archive/{year}/stories/{id}/` (stories done · read-only)
- `{brand}/docs/product/capabilities/{module}/{cap}.yaml` (ledger v2 con `change_log[]` + `scenarios[]`)
- `{brand}/docs/product/capabilities/_status-computed.json` (salud computada · summary + computed_status por cap)
- `{brand}/docs/product/releases/{release_id}.yaml` (schema v2)
- `{brand}/docs/learnings/{date}-{slug}.md`

Edit en cockpit → escribe atomic (.tmp + rename) → próxima invocación de `/pm-{brand}` lee actualizado. **Cero impacto en tokens de Claude · ningún proceso BE persistente requerido.**

## Live refresh cross-process (chokidar SSE)

Cuando Chris edita un `.md` o `.yaml` desde xed/code/CLI **externamente** al cockpit:

1. `chokidar` (server-side) detecta el cambio en `{brand}/docs/product/**/*.{md,yaml}`
2. SSE endpoint `/api/watch` empuja evento `{path, action, brand, docType}`
3. `FileWatchProvider` (1 sola EventSource compartida) distribuye al bus pub/sub
4. La vista activa (Roadmap/Board/Map/Learnings) re-fetcha el slice afectado vía `useFileWatchEvents`
5. UI refresh debounced 200ms

`WatchingIndicator` en Header muestra dot verde pulsante cuando conexión activa · tooltip con timestamp último evento.

## Library functions (lib/)

| Módulo | Responsabilidad |
|---|---|
| `lib/types.ts` | TypeScript interfaces (Story, Capability, CapScenario, ChangeLogEntry, Release, ChrisInput, ConvEntry, ComputedStatusReport, ...) |
| `lib/workspace.ts` | Resolver `WORKSPACE_ROOT` (env → git rev-parse fallback) + detección brands del FS |
| `lib/fs-reader.ts` | Read markdown con frontmatter + YAML + globPaths (** support sin lib externa) |
| `lib/fs-writer.ts` | Atomic write (tmp + rename) · writeMarkdownWithFrontmatter · appendToFile · writeYamlAtomic |
| `lib/git.ts` | Wrappers simple-git (branch, SHA, status, diff, commit history) |
| `lib/chris-input-parser.ts` | Parse + serialize chris-input.md round-trip idempotente · preserva `<!-- voseo-allowed -->` HTML comments |
| `lib/cap-ledger.ts` | 4 ramas `applyCapChange` (new/fix/extend) + `createDerivedCap` |
| `lib/release-resolver.ts` | Read/list/recompute status releases + map story→release |
| `lib/chokidar-watcher.ts` | FS watching debounced para SSE push UI |
| `lib/api-client.ts` | Cliente tipado para `/api/*` desde FE (332 LOC) |
| `lib/cn.ts` | clsx + twMerge helper |
| `lib/story-paths.ts` | Abs↔rel path helpers |

## Permisos · ¿qué hace Chris vs Claude?

Cockpit enforce el SSoT `docs/process/cockpit-permissions.md`. Chris (UI) solo puede:

- `idea → refining` (priorizar)
- `idea → parked` (pausar · razón ≥10 chars)
- `idea → dropped` (descartar terminal · razón ≥10 chars)
- `refining → idea` (volver a backlog)
- `refining → parked / dropped`
- `parked → idea` (reactivar)

Resto (refined / ready / developing / developed / reviewing / done) lo cambia Claude vía skill correspondiente (`/architect`, `/dev-team`, `/auditor`, `/pm-{brand}`). Si Chris intenta forzar transition desde UI → 403 con mensaje "esta transition la ejecuta skill /X".

## Por qué dentro de `tools/` y no en una brand

El cockpit sirve a **todas** las brands (vitalia + nicolify + comunify + lupulo + 6 futuras). No es código de producto. Pertenece al tooling del workspace, junto con `scripts/`. NO se agrega a `pnpm-workspace.yaml` root (`.npmrc` con `ignore-workspace=true`) — corre 100% standalone.

## Multi-máquina (portabilidad)

El cockpit es 100% reproducible desde el repo + lockfile:

```bash
# Máquina nueva
git clone <repo> luana-platform
cd luana-platform/tools/luana-cockpit
pnpm install     # regenera node_modules idéntico desde pnpm-lock.yaml
pnpm dev         # listo
```

Lo único que cambia entre máquinas es `EDITOR_BIN` (xed/code/etc.) si querés "abrir en editor" desde el cockpit · setealo en `.env.local`.

## Mockup ratificado SSoT visual

`mockup-v0.5.2.html` (147 KB) es la SSoT visual original ratificada por Chris. Los components v0.6 portan ese mockup 1:1 (con trade-offs documentados en plan § Phase 5.4).

## Status v0.6 (cement 2026-05-28)

- ✅ **5.1** workspace setup (Next.js 16 + Tailwind v4 + Vitest)
- ✅ **5.2** library functions (12 archivos en lib/)
- ✅ **5.3** 19 API routes Next.js + helpers `_lib`
- ✅ **5.4** components React + 6 vistas funcionales + 7 tabs Story Drawer + Cap Drawer + 6 modales
- ✅ **5.5** chokidar SSE + WatchingIndicator + vistas live refresh

Validación: `pnpm typecheck` clean · `pnpm test` ~67 tests GREEN (6 files).

## Pendiente Chris ratificación

1. Smoke test browser interactivo (10 puntos del plan § Phase 6)
2. Ratificar stories con `cap_target: null` (warnings migrate-report)
3. Poblar scenarios de las ~55 caps en `stub` (sin scenarios) · vía cockpit Extender o stories de refining
4. Merge `wip/protocol-cockpit-v0-6 → main` (require `make ci-parity` GREEN)

## Próximos sprints (v0.7+)

- Edit inline tabs Spec/Diseño/Arq/Audit (deferred Phase 6)
- Brand switcher refresh post-detect live brands
- Roadmap timeline horizontal Gantt-light
- Playwright screenshots auto-embedded a story mockups/

## Plan completo

Ver `/home/chalreme/.claude/plans/ok-lo-apruebo-realiza-cheeky-harbor.md` (autoportable) + memory file `cockpit-luana-state.md`.

Doctrina cementada (Phase 1):
- `docs/process/capability-protocol.md` · schema cap YAML v2 + cap_change_type ledger
- `docs/process/release-protocol.md` · Release entity SSoT
- `docs/process/chris-input-protocol.md` · 3 secciones + 4 verdict labels + output protocol per skill
- `docs/process/cockpit-permissions.md` · whitelist transitions Chris vs Claude
