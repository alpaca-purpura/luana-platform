# Luana Cockpit Go — Plan de Paridad Completa

**Objetivo:** Reescribir el cockpit Next (8 tabs + 18 APIs + editor integrado) en Go stdlib+yaml.v3,
con feature parity 100% + mejoras paradigm v4 (checkpoint v4, cap v3.2, release-protocol, lifecycle.md).

**Estimado total:** 4-5 semanas (3 fases).

---

## Fase 1 · Tabs read-only + live-reload (1.5w)

Objetivo: Board + Roadmap + Map + Arquitectura funcionando. APIs read-only. SSE watch multi-brand.

### Board
- Carga stories de checkpoint.md (32 en vitalia).
- 10 estados + color-code.
- Cards: ID, release, type, next_action, last_modified.
- Selector de brand + Caps badge + Stories count.
- **Live-reload** SSE (`/events?brand=vitalia`).

### Roadmap
- Lee releases/*.yaml (F0..F4 vitalia, 5 releases).
- Tabla release status (planning/in_progress/ready_to_merge/shipped) × release.
- Filtro por brand.
- Gráfico timeline (Gantt simple).

### Map (SYSTEM-MAP visual)
- Lee {brand}/docs/architecture/SYSTEM-MAP.yaml.
- Renderiza 3 zonas (Agentes · Plataforma · Infraestructura).
- Cajas dentro de cada zona (zonas del mapa).
- Coloreado por zona.
- Selector de brand.

### Arquitectura
- Lista ADRs platform (14) + brand-specific (8 vitalia).
- Tabla: title · date · status (adopted/proposed/deprecated) · authors.
- Panes de lectura (markdown → HTML).
- Filtro por platform/brand.

### APIs Fase 1 (todas GET)
- `/api/board?brand=vitalia` → stories por estado
- `/api/roadmap?brand=vitalia` → releases + timeline
- `/api/map?brand=vitalia` → SYSTEM-MAP parsed
- `/api/adrs?brand=vitalia&scope=platform|brand` → ADR list
- `/api/adrs/:id` → ADR content (markdown html)
- `/events?brand=vitalia` → SSE (mtime-poll todas las brands)

### Datos a parsear (orden crítico)
1. YAML: `release_resolver.py` referencia (releases/*.yaml schema).
2. Markdown: ADR → simple HTML (headings + lists + code fences).
3. checkpoint.md frontmatter (ya hecho en POC).
4. SYSTEM-MAP.yaml (estructura zonas).

---

## Fase 2 · Tabs read + datos ricos (1.5w)

Objective: Drift + Learnings + Harness (4 carriles). Observabilidad.

### Drift (divergencia cap↔código)
- Lee capabilities/*.yaml + busca `# cap:` headers en código.
- Cross-check: cap existe en YAML pero no referenciada en código? → huérfana.
- Código references cap que no existe YAML? → isla.
- Tabla: cap_id · status (live/orphan/island) · file_refs · audit_date.
- Severidad color-coded.

### Learnings
- Lee {brand}/docs/learnings/*.md (frontmatter: type · date · promotable).
- Agrupa por tipo (técnico · negocio · process · tooling).
- Cross-brand comparativa (si patrón ≥2 brands = lift candidate flag).
- Link a promotion proposals.

### Harness (CIL 4 carriles)
- L1: harness-backlog.md (HB-N items, estado abierto/cerrado).
- L2: learnings promotables (query `promotable: candidate|yes`).
- L3: tech-debt.md (deuda código/infra).
- L4: drift drift-detected (huérfanas + islas).
- Tabla: carril · item · severity · assigned_to · due_date.

### APIs Fase 2
- `/api/drift?brand=vitalia` → orphans + islands
- `/api/learnings?brand=vitalia&type=técnico|negocio|process` → learnings
- `/api/learnings?promotable=true` → candidates para lift
- `/api/harness?brand=vitalia&carril=L1|L2|L3|L4` → CIL items

---

## Fase 3 · Edit + git integration (1-2w)

Objective: Transitions, chris-input, cap edits, release merge, archive.

### Transitions (state machine)
- `/api/transition` POST `{story_id, from_state, to_state, rationale}`.
- Valida state machine (idea→refining, etc.).
- Append history a checkpoint.md.
- Trigger: `/pm-{brand}` filtra transiciones permitidas (solo Chris O /auditor o builders).
- SSE broadcast cambio a todos los clientes (mtime-poll con timestamp).

### Chris-input editor
- `/api/chris-input/:story_id` GET → lee chris-input.md.
- POST `{verdict, notes}` → append entrada a chris-input.md.
- Formato: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.
- Handoff detection: si verdict=❌ REFUTADO, auto-flag story como blocked.

### Capability editor
- `/api/capability/:cap_id` GET → lee cap YAML.
- POST `{field, value}` → edit YAML in-place.
- Valida schema v3.2 (obligatorios: capability_id, module, status, access, scenarios).
- Trigger: bump `last_modified`, auto-append a cap-ledger.
- Re-run drift detection post-edit.

### Release merge
- `/api/releases/:release_id/merge` POST.
- Archive stories a {brand}/docs/archive/{year}/stories/{id}/ (git mv).
- Bump release status → shipped.
- Archive release a docs/archive/releases/.
- SSE broadcast "release F2 shipped".

### Sessions overlay (🔨 lane)
- Lee `.session-lock/*.lock` (procesado por bucket-lock.sh).
- Overlay en board: 🔨 {LANE} sobre story en construcción (si `$LUANA_LANE` exportada).
- Read-only display (no edit).

### Git integration (dangerous)
- Todas las writes (transition, chris-input, cap, release merge) deben:
  1. Editar `.md` / `.yaml` local.
  2. `git add` pathspec exacto.
  3. `git commit -m "..."`
  4. `git push` (o detectar error non-FF).
  5. SSE broadcast cambio.
- Guardrails: `git status` check antes de commit, `git log --oneline -1` para audit.
- NUNCA `git add .` o `git add -A` (pathspec siempre).

### APIs Fase 3
- POST `/api/transition` → state change
- POST `/api/chris-input/:story_id` → append verdict
- PUT `/api/capability/:cap_id` → edit field
- POST `/api/releases/:release_id/merge` → archive + shipped
- GET `/api/sessions` → overlay 🔨 lanes
- GET `/api/git/status` → git diff/status para audit

---

## Arquitectura Go

```
main.go
  ├─ types.go (Story, Release, Cap, ADR, etc.)
  ├─ parsers.go (YAML, MD, checkpoint, SYSTEM-MAP)
  ├─ handlers.go (router + las 8 tabs)
  ├─ apis.go (18 endpoints)
  ├─ git.go (git integration si Fase 3)
  ├─ watcher.go (mtime-poll + SSE)
  └─ templates.go (7 templates por tab + inline CSS)

go.mod
  require: gopkg.in/yaml.v3
```

Libs externas: **solo yaml.v3** (no fsnotify, no goldmark, no git lib). Markdown→HTML es manual + sano.

---

## Orden de build

1. **POC existente** (board únicamente).
2. **Parsers** (YAML, MD, checkpoint) con tests contra datos reales.
3. **Roadmap** (release schema, timeline render).
4. **Map** (SYSTEM-MAP parse + zones render).
5. **Arquitectura** (ADR list + markdown reader).
6. **Drift** (cap orphan/island detection).
7. **Learnings** (read + cross-brand promote flag).
8. **Harness** (CIL 4 carriles).
9. **Sessions overlay** (lock file read).
10. **Transition API** (if Phase 3 approved).
11. **Chris-input + Cap edit** (if Phase 3 approved).
12. **Release merge + Archive** (if Phase 3 approved).

**Stop point después Fase 1:** si Chris quiere ver/probar antes de Fase 2-3.

---

## Testing

Para cada fase, validar contra datos reales:
- **Board:** 32 stories vitalia en 10 estados.
- **Roadmap:** F0..F4 en releases/, parse status/dates.
- **Map:** SYSTEM-MAP.yaml parse + 3 zonas render.
- **Arquitectura:** 14 platform + 8 vitalia ADRs, markdown→HTML.
- **Drift:** ceros orphans/islands hoy (gap-free setup), pero lógica probada si editamos.
- **Learnings:** learnings promotables = candidates para lift (cross-brand compare).
- **Harness:** HB-N items en backlog + L2 learnings + L3 tech-debt + L4 drift.

RAM medido post-Fase 1: debe rondar 15-20MB idle (POC = 14.6MB).

---

## Diferencias vs Cockpit Next (mejoras paradigm v4)

- **No mock data** (el Next cargaba algunos fixtures). Aquí siempre datos reales.
- **Release protocol explicit** (status machine clara: planning→in_progress→ready_to_merge→shipped).
- **Lifecycle.md 4-ejes** (Release→Story→Capability→Scenario) visible en breadcrumbs.
- **Capability v3.2 schema** (4 bloques aditivos: access + scenarios + business_rules + related) validados.
- **CIL carril explicado** (no es "cosas random", es L1/L2/L3/L4 clasificadas).
- **Chris-input protocol** (append format endurecido).
- **Drift detection automática** (no manual flag, es resultado de código↔cap mismatch).
- **Sessions overlay** 🔨 lane (multi-sesión visibility).

---

## Git safety durante edit (Fase 3)

- Todas las writes leen `git status` primero. Si hay untracked/dirty files → error "commit WIP first".
- Commit de edits: `git commit -m "edit {surface}: {field} {old}→{new}"`.
- No amend, no force-push. Cada edit = nuevo commit.
- Pre-commit validation (schema YAML, markdown, etc.) antes de `git add`.

---

## Rollout

- Desarrollar en `tools/luana-cockpit-go/` (paralelo, Next :4002 sigue vivo).
- Fase 1 testeable en :4102 (tabs read-only).
- Chris valida Fase 1 → decide si continuar Fase 2/3.
- Post-Fase 3: `make cockpit-up` apunta a Go en vez de Next (un flag ENV).
- Next cockpit → deprecado, archivo en `tools/luana-cockpit-legacy/` (history).

---

## Blockers conocidos

- **Markdown→HTML:** No usamos goldmark (dep), parseo manual de headings/lists/code-fences.
  Prueba contra 20+ ADR reales.
- **Git commits durante edit:** Require `git config` (name/email), que Chris tenga seteado.
  Si no → edit OK pero commit falla (degradado: edit queda local, sin push).
- **Permissions:** Hoy no tenemos RBAC. Las transiciones las ratea anyone. Fase 3 puede requiere
  verificación de Chris' Clerk `sub` si lo necesita.
- **Performance drift detection:** Comparar ≥75 caps × ≥1000 líneas código = O(n²). Cacheado por mtime.
