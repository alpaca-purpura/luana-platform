---
slug: luana-core-ui-foundation
kind: outcome
owner: /pm-luana
state: refining
created: 2026-05-21
priority: HIGH
why_now: |
  Vitalia necesita design system urgente (caso origen: vitalia-slice-1-marketing
  shipped state=done con merge fa921711 PERO sidebar nav vacío + Tailwind v4 no
  renderiza tokens en runtime + dashboard con placeholders). Frontend visualmente
  roto. Pero el problema es bigger: si construimos design system brand-only en
  vitalia, las 9 brands futuras (saasora/inmoflow/retailly/fixia/guestly/fitflow
  + lupulo + comunify/nicolify retrofit posible) heredan misma reinvención —
  nicolify ya construyó shell complejo evolutivamente y carga deuda. Anti-duplication
  preventive lift: construir engine TS package luana-core-ui AHORA antes de que
  vitalia genere primer mirror cross-brand.

  Decisión arquitectónica ratificada Chris 2026-05-21:
  - Pattern: shadcn copy-paste con CLI compartida (no npm package) → ADR-008
  - Tailwind v4 diag FIRST (PRE-REQUISITE) → bloquea todo
  - Vertical-slice agéntica (no horizontal ola Atomic Design) → cada slice end-to-end
  - Worktrees paralelos (wip/core-ui-extraction + wip/vitalia) → no secuencial
estimated_effort: 5-7 semanas wall-clock total (3 sem core foundation + 2-4 sem vitalia consumer slices)
stories:
  - S-CORE-UI-PACKAGE-BOOTSTRAP                        # ⏳ /pm-luana abre proposal extraction, /dev-team builds
  - S-CORE-UI-ATOMS-FOUNDATION                         # ⏳ depende bootstrap
  - S-VITALIA-TAILWIND-V4-DIAG                         # ⏳ /pm-vitalia owns (handoff) — PRE-REQUISITE bloquea downstream
  - S-VITALIA-THEME-TOKENS                             # ⏳ /pm-vitalia owns (handoff)
  - S-VITALIA-SHELL-ORGANISM                           # ⏳ PATTERN PENDING REVIEW con Chris (idea agéntica nueva)
  - S-VITALIA-AGENTIC-PATTERNS-FOUNDATION              # ⏳ depende shell pattern definido
  - S-VITALIA-SLICE-PATIENTS-AGENTIC                   # ⏳ primer vertical-slice, prueba matriz completa
  - S-VITALIA-SLICE-{OFFERS,BOOKINGS,MARKETING,...}    # ⏳ iter por surface
related_proposals:
  - docs/promotion-protocol/proposals/2026-05-21-luana-core-ui-extraction.md (state=proposed)
related_adrs:
  - docs/architecture/luana-platform/ADR-008-luana-core-ui-shadcn-cli-pattern.md (status=proposed)
related_learnings:
  - vitalia/docs/learnings/2026-05-21-auto-handoff-deferred-e2e-blocker.md (HIGH severity, cross-brand process gap)
  - vitalia/docs/learnings/2026-05-20-docker-frontend-ram-turbopack-issue.md (cause root Tailwind v4 issue probable)
related_rules:
  - .claude/rules/anti-duplication.md (§ lift shared rule)
  - .claude/rules/frontend-fsd.md (FSD-Lite + engine TS packages via @luana/*)
  - .claude/rules/frontend-quality.md (arch fitness ratchets per-brand)
---

# Luana Core UI Foundation — platform outcome

> Outcome owned por `/pm-luana` (modo Core Engineering). Crea engine TS package
> `@luana/ui` con shadcn primitives genéricos. Vitalia es primer consumer
> (urgent), 9 brands futuras heredan. Brands consumen via `npx @luana/ui add X` CLI
> (no npm dependency tradicional — ver ADR-008).

## Problema

Vitalia frontend visualmente roto (caso origen `vitalia-slice-1-marketing` shipped pero no integrado a app real). Inventario vitalia vs nicolify revela gap brutal en shell/nav + primitives + design tokens. Construir solo en vitalia/ reincide el patrón nicolify (brand-only build → deuda cross-brand diferida).

3 manifestaciones del problema:

1. **Vitalia urgente:** sidebar plano, sin Nav system, sin Mutex/Overlay, sin primitives Shadcn organizados, sin Storybook, Tailwind v4 tokens no renderizan runtime
2. **Nicolify deuda diferida:** shell construido evolutivamente desde 2024, mucho scaffolding histórico no abstraído — retrofit retroactivo a `@luana/ui` será necesario eventualmente
3. **9 brands futuras:** cada una arrancando bootstrap reinventaría el mismo design system local — costo lineal sin economía de escala

## Solución (3 capas)

### Capa 1 — Engine package `core/luana-core-ui/` (TS, nuevo)

Nuevo package en workspace `pnpm-workspace.yaml`. NO publish a npm tradicional — distribución via CLI shadcn-style.

**Contenido:**
- `src/components/atom/` — Button, Input, Label, Badge, Avatar, Icon, Separator, Skeleton, Spinner, Toast, Dialog
- `src/components/molecule/` — FormField, Card variants, NavItem, EmptyState, ConfirmDialog, FilterBar
- `src/components/organism/` — AppSidebar, AgentRail, ActivityStream, DashboardLayout, DetailLayout
  > **★ PATTERN PENDING REVIEW con Chris** — Chris flageó idea nueva agéntica que reutiliza átomos pero permite navegación más sencilla. Organism layer NO se cementa hasta revisar idea.
- `src/tokens/` — defaults CSS variables (brands override)
- `src/lib/cn.ts` — className utility (clsx + tailwind-merge)
- `cli/` — `add`, `update`, `diff`, `list` commands
- `stories/` — Storybook centralizado

**Filosofía:** shadcn copy-paste con CLI compartida. Brands ownan su copia. Drift visible con arch test. Ver `ADR-008`.

### Capa 2 — Brand consumer mechanism

Brand activa `@luana/ui` via `{brand}/config/brand.yaml::ui.luana_core_ui: true` + cada componente:

```bash
cd {brand}/frontend
npx @luana/ui add button       # copia atom/button/ a src/components/ui/button/
npx @luana/ui add app-sidebar  # copia organism/ (cuando shell pattern definido)
```

Theme override en `{brand}/frontend/src/lib/tokens/` define CSS variables que primitives engine consumen via `var(--luana-color-primary)` etc. Vitalia obtiene paleta médica + spacing scale propio + typography propia SIN tocar primitives engine.

### Capa 3 — Agentic patterns layer (PENDING REVIEW)

`AgentRail`, `RecommendationCard`, `ActivityStream`, `AgentCard`, `InlineAgentInvocation` — patterns que vitalia consume HOY (Valeria/Adrián/Lucas agents) y otras brands consumirán cuando opt-in agentic UX.

**★ Esta capa NO se cementa en este outcome.** Chris flageó idea nueva 2026-05-21 que reutiliza átomos pero permite navegación agéntica más sencilla. Próxima ronda Chris presenta idea → `/pm-luana` evalúa fit core + abre proposal específico agentic patterns separate.

## Why this matters más allá de vitalia

| Brand | Aplicabilidad | Razón |
|---|---|---|
| vitalia | urgente | Caso origen, design system roto hoy |
| nicolify | retroactivo eventual | Shell legacy → migrar a `@luana/ui` cuando estable |
| comunify | candidato | WIP recovery activo, design system pendiente |
| lupulo | candidato bootstrap | Placeholder hoy, va a consumir desde start |
| saasora / inmoflow / retailly / fixia / guestly / fitflow | candidates bootstrap | 6 brands pendientes — heredan desde día 1 |

## Stories sub-outcome (orden ratificado Chris)

### Pre-requisite

- `S-VITALIA-TAILWIND-V4-DIAG` — 1-2 días, /pm-vitalia owns. Bloquea todo lo demás. Reproduce + diagnóstico postcss/turbopack/CSS bundle. T-mki-3 actual se vuelve esta story standalone.

### Core foundation (worktree wip/core-ui-extraction)

- `S-CORE-UI-PACKAGE-BOOTSTRAP` — 3-5 días, /pm-luana proposes / /dev-team builds. Setup pnpm workspace + tsup/vite build + CLI scaffolding + Button atom como vertical-slice prueba + Storybook docs base.
- `S-CORE-UI-ATOMS-FOUNDATION` — 1 sem. ~10 atoms (Input, Label, Badge, Avatar, Icon, Separator, Skeleton, Spinner, Toast, Dialog). Cada uno con stories + tests + tokens.

### Vitalia consumer (worktree wip/vitalia)

- `S-VITALIA-THEME-TOKENS` — 2-3 días. Tokens médicos paleta vitalia + spacing scale + typography. Theme override mechanism consumiendo `@luana/ui` defaults.
- `S-VITALIA-SHELL-ORGANISM` — **PATTERN PENDING REVIEW con Chris** antes de spec. Una vez ratificado pattern, 1.5 sem build.
- `S-VITALIA-AGENTIC-PATTERNS-FOUNDATION` — depende shell pattern + ratificación capa 3. AgentRail + RecommendationCard + ActivityStream stub.
- `S-VITALIA-SLICE-PATIENTS-AGENTIC` — primer vertical-slice. PatientCard con AgentRail integration. Página /patients refactor. 1 sem.
- `S-VITALIA-SLICE-{OFFERS,BOOKINGS,MARKETING,FIDELIZACION,...}` — iter por surface, 1 sem c/u.

> Stories vitalia-* las owna `/pm-vitalia`. /pm-luana NO crea ni edita stories brand (anti-creep). Handoff explícito a `/pm-vitalia` para refining post este outcome ratificado.

## Cross-cutting

- **Storybook centralizado** en `core/luana-core-ui/stories/` — docs único cross-brand
- **Arch fitness tests** en `{brand}/frontend/src/__tests__/architecture/`:
  - `test-ui-component-source-diff.test.ts` — drift detection vs `@luana/ui` source
  - `test-no-shadcn-mirror-outside-ui.test.ts` — primitives solo bajo `src/components/ui/`
- **Promotion proposal track:** `core/luana-core-ui/` extraction registered como preventive lift (no hay mirror cross-brand todavía, pero patrón obvio amerita lift PROACTIVE)
- **Dependency:** Tailwind v4 diag DEBE cerrar GREEN antes de S-CORE-UI-PACKAGE-BOOTSTRAP (engine package consume Tailwind también)

## Decision points cementados (Chris 2026-05-21)

1. **Pattern UI package:** shadcn copy-paste con CLI compartida (ver ADR-008)
2. **Atacar Tailwind v4:** FIRST — bloquea todo lo demás
3. **Estrategia build:** vertical-slice agéntica (no horizontal Atomic Design)
4. **Worktrees:** paralelos (core-ui + vitalia simultáneo)

## Decision points PENDING (próxima ronda Chris)

1. **Shell/navigation organism pattern** — Chris flageó idea nueva que reutiliza átomos pero permite navegación agéntica más sencilla y útil. Pattern concreto NO se cementa hasta revisar idea. Sin esto NO arranca `S-VITALIA-SHELL-ORGANISM` ni `S-VITALIA-AGENTIC-PATTERNS-FOUNDATION`.

## Next actions

1. ✅ Outcome platform escrito (este file)
2. ✅ ADR-008 abierto state=proposed
3. ✅ Proposal extraction `2026-05-21-luana-core-ui-extraction.md` abierto state=proposed
4. ⏳ Chris ratifica proposal extraction → state=accepted
5. ⏳ Chris presenta idea shell navigation agéntica → /pm-luana evalúa
6. ⏳ Handoff `/pm-vitalia` para crear stories vitalia-* en `vitalia/docs/product/stories/`
7. ⏳ Handoff `/dev-team` (worktree wip/core-ui-extraction) para `S-CORE-UI-PACKAGE-BOOTSTRAP`

## Cross-references

- `docs/promotion-protocol/proposals/2026-05-21-luana-core-ui-extraction.md`
- `docs/architecture/luana-platform/ADR-008-luana-core-ui-shadcn-cli-pattern.md`
- `vitalia/docs/learnings/2026-05-21-auto-handoff-deferred-e2e-blocker.md`
- `vitalia/docs/product/stories/vitalia-slice-1-marketing-integration/checkpoint.md` (story actual obsoleta — scope reabsorbido en outcome)
- `.claude/rules/anti-duplication.md`
- `.claude/rules/frontend-fsd.md`
