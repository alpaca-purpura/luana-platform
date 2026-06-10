# Contract: core-ds-foundation — Design System buildable (tokens + layout-primitives + entity components + mechanical enforcement)

> **Consolidado.** Surface = **FE only** (TS packages `@luana/{design-tokens, ui-kit}` + a new `@luana/eslint-config` + vitalia/frontend pilot wiring). NO backend. NO agentic. NO BE tickets.
> The **canon** (`design-system-canon.md`) is the ratified contract; this `03-arch.md` translates it into a buildable ready package. Where canon §6 has code examples, those are the implementation contract — build EXACTLY those.

## 0. Context Summary

- **Story:** `core-ds-foundation` (Fase 0+1+2 consolidada) · `brand: platform` · `track: A` (independiente) · `state: refining → ready`
- **Architect run on:** 2026-06-08
- **Authorization note:** `core/@luana/*` are **TypeScript design packages**, NOT `core/luana-core-*/src/luana_core_*/` (Python engine). The engine-boundary rule does NOT apply here — this story explicitly **owns** `@luana/{design-tokens, ui-kit}` + a new `@luana/eslint-config`. Confirmed by `/pm-luana` in the dispatch prompt.
- **Modules touched:** `core/@luana/design-tokens`, `core/@luana/ui-kit`, `core/@luana/eslint-config` (net-new), `vitalia/frontend` (pilot: globals.css R-1SRC + eslint wiring + /showcase route + arch-tests + consume `@luana/ui-kit`).
- **NOT touched:** `nicolify/frontend/src`, `comunify/frontend/src` (lint unchanged — opt-in, RN-3/AC-5), `core/luana-core-*/src/` (Python engine).

### Surface → builder → auditor mapping (PM uses to spawn correct agents)

| Surface | Builder | Auditor |
|---|---|---|
| `core/@luana/design-tokens/src/**` | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
| `core/@luana/ui-kit/src/**` | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
| `core/@luana/eslint-config/**` | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
| `core/@luana/hooks/src/useAutosave.ts` (EXTEND existing) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
| `vitalia/frontend/src/app/globals.css` (R-1SRC) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
| `vitalia/frontend/eslint.config.mjs` (pilot wiring) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
| `vitalia/frontend/src/app/showcase/**` (route) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
| `vitalia/frontend/src/__tests__/architecture/**` (arch-tests + baselines) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |

> All FE, all non-agentic → `builder-frontend` (Sonnet) per R23. No agentic, no BE. No Opus production-code requirement.

### Skills consulted (decision per skill)

- **`frontend-expert`**: FSD-Lite layering for the pilot wiring; ui-kit is the canonical lego; lifts rewire `@/`-local imports (skeleton, cn) to ui-kit-local. Live-verify via `chrome-devtools-verify` for /showcase.
- **`frontend-visual-fidelity` rule (§ Design System Canon)**: D1 becomes mechanical (lint + arch-test) — the gates this story builds ARE the D1 enforcement.
- **`anti-duplication` rule**: cross-brand mirror (`EntitySubNavBar` in vitalia+nicolify, `EmptyState` in vitalia+nicolify) → lift to `core/@luana/ui-kit` is the **correct resolution** of the mirror, not a new violation.
- **`tdd-mandatory`**: Vitest RED before GREEN per component; arch-test RED before the gate exists.
- **`playwright-expert`**: consumed for the /showcase live-verify exit criterion (T-9 only).

### CONTEXT-BRIEF source

No `CONTEXT-BRIEF.md` for this story (R24 brief not produced). **Self-ran greps (Path B)** — see § Existing systems audit. All lift sources + existing arch-tests verified on disk 2026-06-08.

### capability YAML + modules updates (post-merge)

- `cap_target: infra/design-system-tokens-lock` (zone Infraestructura/plataforma-tecnica, `user_visible: false`) per 01-spec. The cap covers the **lock + token scale**; the layout-primitives/entity components are platform infra (no per-brand user-facing cap until Fase 3 adoption).
- `/pm-luana` at merge: changelog entry in `@luana/{design-tokens, ui-kit}` + **semver MINOR bump** (opt-in per brand — lock turns on per brand in Fase 3, not here).
- No `modules/{m}.md` narrative change (infra, not a brand feature).

### Architecture gates that must keep passing

- `vitalia/frontend`: `npx tsc --noEmit` · `npx eslint src/ --cache` · `npx vitest run` (incl. `src/__tests__/architecture/`) · FSD boundaries (`test_fsd_boundaries.test.ts`) · existing ratchets (`test_no_hardcoded_colors`, `test_page_padding`, `test-no-vt-classes-in-new-features`).
- `core/@luana/ui-kit`: `npm run typecheck` + `npm run test` (vitest).
- `core/@luana/design-tokens`: `npm run typecheck`.
- `core/@luana/eslint-config` (net-new): `npm run test` (rule unit tests via `RuleTester`).

---

## Existing systems audit (NO-NEW-LAYER rule)

### Source of evidence
- [x] Self-run greps (Path B — fallback; no CONTEXT-BRIEF)
- Commands + results below; lift sources + existing arch-tests verified on disk.

### Audit cross-module ejecutado (verbatim)
```bash
# packages export surfaces
cat core/@luana/design-tokens/src/index.ts            # → only z-index today
cat core/@luana/ui-kit/src/index.ts                   # → 44 atoms incl. select, tooltip, AutosaveBadge, detail-panel, skeleton, popover, command, scroll-area
cat core/@luana/hooks/src/index.ts                    # → useAutosave (2000ms, last-wins), use-debounce
# cross-brand mirror scan
for b in vitalia nicolify comunify; do find $b/frontend/src -name "EntitySubNavBar.tsx" -o -name "EntityWorkspaceLayout.tsx" -o -name "EmptyState.tsx"; done
# existing arch-tests overlapping scope
ls vitalia/frontend/src/__tests__/architecture/        # → test_no_hardcoded_colors, test_page_padding, test-no-vt-classes-in-new-features ALREADY present
# eslint/virtualization/eslint-config presence
grep no-arbitrary vitalia/frontend/eslint.config.mjs   # → none
ls core/@luana/ | grep eslint-config                   # → none
```

### Sistemas existentes encontrados

| Sistema | Path | Estado | Decisión |
|---|---|---|---|
| Token z-index scale | `core/@luana/design-tokens/src/z-index.ts` (`Z_INDEX` + `Z_INDEX_CLASSES` frozen) | active | **EXTEND** — mismo paquete, mismo patrón (frozen const + `*_CLASSES`). Add spacing/radius/typography/color-name siblings. |
| 44 átomos | `core/@luana/ui-kit/src/*` incl. `select.tsx`, `tooltip.tsx`, `AutosaveBadge.tsx`, `detail-panel.tsx`, `skeleton.tsx`, `popover.tsx`, `command.tsx`, `scroll-area.tsx`, `avatar.tsx`, `card.tsx`, `input.tsx` | active | **CONSUME** — `Select` canónico §2.5 = `select.tsx` existente (verify parity, NO rebuild). `tooltip.tsx` = §2.8. `AutosaveBadge` consumed by FloatingAutosaveIndicator. |
| `useAutosave` hook | `core/@luana/hooks/src/useAutosave.ts` (2000ms, **last-wins, NO coalesce**) | active | **EXTEND** — add `coalesce` option + lower default to 600ms + `flush()`. Lift the coalescing logic from vitalia `use-autosave.ts:112-139`. Do NOT create a parallel hook. |
| `EntitySubNavBar` | `vitalia/.../shell-organism/EntitySubNavBar.tsx` **AND** `nicolify/.../shell-organism/EntitySubNavBar.tsx` | **CROSS-BRAND MIRROR** | **LIFT to `@luana/ui-kit`** — this story explicitly resolves the mirror (nicolify is best version per inventory CAPA 3). Per-brand copies deprecate in Fase 3. |
| `EntityWorkspaceLayout` | `nicolify/.../shell-organism/EntityWorkspaceLayout.tsx` (only nicolify) | active (best) | **LIFT to `@luana/ui-kit`** — generalize, rewire `@/components/ui/skeleton`→`./skeleton`, `@/lib/utils`→ui-kit `cn`. |
| `EmptyState` | `vitalia/.../shell-organism/EmptyState.tsx` **AND** `nicolify/.../shell-organism/EmptyState.tsx` | **CROSS-BRAND MIRROR** | **LIFT to `@luana/ui-kit`** (base vitalia `EmptyState.tsx:38-82` per inventory). |
| `StaffCard` (EntityInfoCard base) | `vitalia/.../features/lisa/components/staff/StaffCard.tsx` | active (best) | **LIFT+GENERALIZE** to `EntityInfoCard` (Opción B) + agent-color icon from `nicolify IcpCard.tsx:110-119` + status rail from `vitalia ReEngagementCard.tsx:35-45`. |
| `Group`/`GroupHeader` | `nicolify/.../features/abel/components/icp/IcpDatosForm.tsx:123-163` | active (best) | **LIFT to `@luana/ui-kit`** (semantic error state + "para qué" chip + agent strip). |
| `FloatingAutosaveIndicator` | `vitalia/.../shared/FloatingAutosaveIndicator.tsx:68-116` (118 lines) | active (best) | **LIFT to `@luana/ui-kit`** (consumes `AutosaveBadge` already in ui-kit). |
| Page-primitives (PageContainer/Header/Section/Toolbar/FilterBar/ErrorState/skeletons/Pagination/DetailLayout/FormLayout) | absent in ui-kit; ~208 `<div p-N>` ad-hoc + 4 pagination reimplementations across vitalia | none | **NEW** in `@luana/ui-kit` — genuinely missing layer (inventory CAPA 4 confirms only `EmptyState` + `Skeleton` shipped). |
| `EntityPicker` | absent anywhere | none | **NEW** (canon §2.4/§6.4) — net-new; query-lib-agnostic via `searchFn`/`queryFn` prop. |
| no-hardcoded-hex arch-test | `vitalia/.../architecture/test_no_hardcoded_colors.test.ts` (ratchet `KNOWN_COLOR_VIOLATIONS`) | active | **EXTEND/verify parity** — the canon "no-hardcoded-hex" gate ALREADY exists. Do NOT create a parallel; verify it covers the lock scope, keep its ratchet. |
| page-padding arch-test | `vitalia/.../architecture/test_page_padding.test.ts` | active | **CONSUME as-is** — no-div-layout is complementary (presence of primitive vs inline padding), not a duplicate. |
| no-`.vt-*`-in-new arch-test | `vitalia/.../architecture/test-no-vt-classes-in-new-features.test.ts` (ratchet) | active | **ALIGN** — R-1SRC consolidation reinforces this; new-features must use semantic tokens not legacy `--vitalia-*`. |
| eslint no-arbitrary rule | none anywhere | none | **NEW** — genuinely missing (this is the Fase-0 lock). |
| `@luana/eslint-config` package | does NOT exist | none | **NEW package decision** — see §10 home decision. |

### Decisión por sistema (resumen)
- **EXTEND** (default): design-tokens scale, useAutosave coalesce, no-hardcoded-hex arch-test.
- **CONSUME**: select/tooltip/AutosaveBadge/detail-panel/skeleton/popover/command/scroll-area/avatar/card atoms.
- **LIFT** (resolve mirror / generalize best version): EntitySubNavBar, EntityWorkspaceLayout, EmptyState, EntityInfoCard(StaffCard), Group, FloatingAutosaveIndicator.
- **NEW** (genuinely missing): page-primitives, EntityPicker, eslint no-arbitrary rule, `@luana/eslint-config` package, no-native-select + no-div-layout arch-tests.

**Cross-brand mirror disposition:** `EntitySubNavBar` + `EmptyState` mirror across vitalia/nicolify → lifting to `core/@luana/ui-kit` is the SANCTIONED resolution (this story's mandate). Per-brand copies remain consuming their local versions until Fase 3 adoption rewires them to import from `@luana/ui-kit` (out of scope here).

---

## 1. Domain Entities

N/A — FE component library + tooling. No backend domain entities, no DB, no `tenant_id`/`deleted_at`. (The story is `verification_nature: tecnica` except the /showcase route.)

## 2. SQLAlchemy 2.0 Models

N/A — no persistence.

## 3. Pydantic v2 DTOs

N/A — no API. (EntityPicker takes a `searchFn` prop; the consumer brand wires the real API in Fase 3 — NO BE contract here.)

## 4. API Routes

N/A — no backend routes. The only route is the Next.js **page** `/showcase` (§ TypeScript / showcase, T-9) — a client-rendered dev surface, no API.

## 5. TypeScript Types (the real contract surface)

### 5.1 · `@luana/design-tokens` — net-new scale (EXTEND z-index pattern)

Same idiom as `z-index.ts` (frozen const + companion `*_CLASSES`). New files + index export:

```ts
// spacing.ts — Tailwind 4px-base AS-IS (D1, RN-4). Shared NAME contract; values identical cross-brand.
export const SPACING = Object.freeze({ "0":"0","1":".25rem","2":".5rem","3":".75rem","4":"1rem","5":"1.25rem","6":"1.5rem","8":"2rem","10":"2.5rem","12":"3rem","16":"4rem" } as const);
export type SpacingKey = keyof typeof SPACING;

// radius.ts — NAME contract sm/md/lg/bubble/pill. VALUES stay per-brand in each theme (RN-5). NEVER merge.
export const RADIUS_NAMES = Object.freeze(["sm","md","lg","bubble","pill"] as const);
export type RadiusName = (typeof RADIUS_NAMES)[number];

// typography.ts — NAME contract display/heading/body tiers. VALUES per-brand.
export const TYPOGRAPHY_TIERS = Object.freeze(["display","heading","body","caption"] as const);
export type TypographyTier = (typeof TYPOGRAPHY_TIERS)[number];

// color name contract — agent + semantic token NAMES (shared). VALUES per-brand (NEVER merge palettes, RN-5).
export const COLOR_NAMES = Object.freeze(["primary","background","foreground","card","muted","border","ring",
  "agent-lisa","agent-lucas","agent-adrian","agent-valeria","agent-camila","agent-mateo","agent-config",
  "success","warning","danger","info"] as const);
export type ColorName = (typeof COLOR_NAMES)[number];
```
`index.ts` adds `export * from "./spacing"; export * from "./radius"; export * from "./typography"; export * from "./color-names";` (keeps existing z-index export). `package.json` exports map gains `./spacing`, `./radius`, `./typography`. **Contract = NAMES shared, VALUES per-brand** (AC-1).

### 5.2 · `@luana/ui-kit` — lifted + new components (public types)

```ts
// EntityWorkspaceLayout (LIFT nicolify) — canon §2.1/§6.2
export interface EntitySubNavLeaf { id: string; label: string; href: string; isAddAffordance?: boolean; prefixEmoji?: string; avatarBgClass?: string; isPrimary?: boolean; }
export interface EntitySubNavEntity { id: string; name: string; initials?: string; }
export interface EntityWorkspaceLayoutProps {
  entity: EntitySubNavEntity | null;   // null ⇒ master mode (grid), entity ⇒ detail mode
  leaves: EntitySubNavLeaf[];
  rootHref: string; rootLabel: string;
  isLoading?: boolean;
  onAddAffordance?: () => void;
  children: ReactNode;                  // active leaf body
}

// EntitySubNavBar (LIFT) — canon §2.2: full-bleed third ribbon, root-pill '‹ {rootLabel}', EntityPicker, leaves
export interface EntitySubNavBarProps extends Omit<EntityWorkspaceLayoutProps,"isLoading"|"children"> {
  activeLeaf: string;                   // URL-derived, NEVER store (G2)
  agentSlug?: string;
  onEntityChange?: (id: string) => void;
}

// EntityPicker (NET-NEW) — canon §2.4/§6.4. Query-lib-AGNOSTIC: consumer injects searchFn.
export interface EntityPickerItem { id: string; name: string; initials?: string; subtitle?: string; }
export interface EntityPickerPage { items: EntityPickerItem[]; nextCursor: string | null; total?: number; }
export interface EntityPickerProps {
  entity: EntityPickerItem | null;
  agentSlug?: string;
  searchFn: (args: { q: string; cursor: string | null; limit: number }) => Promise<EntityPickerPage>;  // server-side debounced, cursor-paginated
  onChange: (id: string) => void;
  pageSize?: number;                    // default 20
}

// EntityInfoCard (LIFT StaffCard, Opción B) — canon §2.3/§6.5
export interface EntityInfoCardMetric { label: string; value: string | number; }
export interface EntityInfoCardAction { label: string; onSelect: () => void; danger?: boolean; }
export interface EntityInfoCardProps {
  entity: { id: string; name: string; subtitle?: string; initials?: string; metrics?: EntityInfoCardMetric[]; status?: { label: string; tone: "success"|"warning"|"danger"|"neutral" }; };
  accentSlug?: string;                  // agent-color top border
  actions?: EntityInfoCardAction[];     // kebab ⋮ menu (stopPropagation)
  onClick?: () => void;                 // whole card clickable
  selected?: boolean;
}
// + EntityInfoCardSkeleton + EntityInfoCardEmpty (OBLIGATORY variants)

// Group / GroupHeader (LIFT nicolify) — canon §2.6
export interface GroupProps { title: string; helpChip?: string; agentStrip?: string; error?: { missingFields?: string[]; message?: string }; children: ReactNode; }

// FloatingAutosaveIndicator (LIFT vitalia) — canon §2.6, ONE per page, role=status, consumes AutosaveBadge
export interface FloatingAutosaveIndicatorProps { saving: boolean; saved: boolean; error?: boolean; }

// Layout-primitives (NEW) — canon §2.7
export type PageContainerProps = { children: ReactNode; className?: string };
export interface PageHeaderProps { title: string; subtitle?: string; actions?: ReactNode; }
export interface PageSectionProps { title?: string; children: ReactNode; }
export type PageContentStackProps = { children: ReactNode; className?: string };
export interface ToolbarProps { search?: ReactNode; filters?: ReactNode; actions?: ReactNode; }
export interface FilterBarProps { sort?: ReactNode; viewToggle?: ReactNode; search?: ReactNode; }
export interface ErrorStateProps { title: string; message?: string; onRetry?: () => void; }  // role=alert
export interface ListPageSkeletonProps { rows?: number }
export interface FormPageSkeletonProps { sections?: number }
export interface PaginationProps { page: number; pageCount: number; onPage: (n: number) => void; }
export interface DetailLayoutProps { children: ReactNode }          // 1-col default
export interface FormLayoutProps { children: ReactNode; paired?: boolean }  // 2-col only when paired

// Page archetypes (NEW, compose primitives) — canon §6.2, inventory mechanism #3
export interface ListPageScaffoldProps { header: PageHeaderProps; toolbar?: ToolbarProps; children: ReactNode; isLoading?: boolean; isEmpty?: boolean; emptyState?: ReactNode; }
export interface DetailPageScaffoldProps { workspace: EntityWorkspaceLayoutProps; }
export interface FormPageScaffoldProps { header: PageHeaderProps; children: ReactNode; }
export interface DashboardPageScaffoldProps { header: PageHeaderProps; children: ReactNode; }
```

### 5.3 · `@luana/hooks::useAutosave` — EXTEND (add coalesce)

```ts
export interface UseAutosaveOptions<TValues> {
  // ... existing ...
  coalesce?: boolean;     // NEW — merge pending payloads (lift vitalia use-autosave.ts:112-139)
  debounceMs?: number;    // CHANGE default 2000 → keep 2000 for existing callers; coalesce callers pass 600
}
export interface UseAutosaveReturn<TValues> {
  // ... existing ...
  flush: () => Promise<void>;   // NEW — immediate save of pending payload
}
```
**Back-compat invariant:** existing callers (the autosave-primitive consumers) keep working — `coalesce` defaults `false`, `debounceMs` default unchanged at 2000. New canon consumers opt into `{ coalesce: true, debounceMs: 600 }`.

## 6. Repository Interfaces

N/A — no backend.

## 7. Application Services

N/A — no backend.

## 8. Agentic Surfaces

N/A — this story touches NO `copilot/` or `sales_agent/` surface. No LangGraph, no tools, no prompt cache, no goldens. (Skipped entirely.)

## 9. Migration Notes

N/A — no DB. The only "migration" is **R-1SRC** (CSS consolidation, T-1) — see §9.5.

## 9.5 Tests audit (default flip)

`[x] No aplica — 03-arch.md no flipea defaults side-effect.`

The eslint lock and arch-tests are **opt-in by brand**: vitalia wires them (pilot); nicolify/comunify config does NOT load them (RN-3, AC-5). No feature flag with a call-path side-effect (events/persistence/LLM routing) is flipped. The ratchet baselines are seeded high (no build break) and shrink-only.

### R-1SRC consolidation note (T-1, the one risky CSS change)
`vitalia/frontend/src/app/globals.css` has TWO parallel systems:
- **Shadcn** (`--primary` 198 99% 49%, `--agent-*`, `--radius: 0.625rem` @ line 51).
- **Legacy `--vitalia-*`** (`--vitalia-cian`, `--vitalia-text`, … + its own `--radius: 0.5rem` @ line 151 — **the clash**).
- **Blast radius:** 85 files consume `var(--vitalia-*)`.

**Strategy (additive, non-breaking):** consolidate to ONE `--radius` (keep `0.625rem` Shadcn; delete the line-151 `0.5rem`). Keep `--vitalia-*` color vars **as aliases pointing at the Shadcn tokens** (e.g. `--vitalia-cian: var(--primary)`) so the 85 consumers don't break, but the SSoT becomes Shadcn. Migrating those 85 consumers to semantic classes = Fase 3 (out of scope; the `test-no-vt-classes-in-new-features` ratchet already prevents NEW `--vitalia-*` usage). **TDD:** a test asserting a single `--radius` declaration in globals.css goes RED first.

## 10. File Structure

```
core/@luana/design-tokens/src/
  spacing.ts          NEW   radius.ts NEW   typography.ts NEW   color-names.ts NEW
  index.ts            MOD   (add exports)   package.json MOD (exports map)

core/@luana/ui-kit/src/
  EntityWorkspaceLayout.tsx   NEW(lift nicolify)   EntitySubNavBar.tsx NEW(lift nicolify)
  EntityPicker.tsx            NEW(net-new)
  EntityInfoCard.tsx          NEW(lift vitalia StaffCard) + Skeleton + Empty variants
  Group.tsx                   NEW(lift nicolify)
  FloatingAutosaveIndicator.tsx NEW(lift vitalia)
  layout/PageContainer.tsx PageHeader.tsx PageSection.tsx PageContentStack.tsx
        Toolbar.tsx FilterBar.tsx EmptyState.tsx(lift vitalia) ErrorState.tsx
        ListPageSkeleton.tsx FormPageSkeleton.tsx Pagination.tsx DetailLayout.tsx FormLayout.tsx   all NEW
  archetypes/ListPageScaffold.tsx DetailPageScaffold.tsx FormPageScaffold.tsx DashboardPageScaffold.tsx  NEW
  index.ts            MOD   (export all the above)
  __tests__/*.test.tsx NEW  (Vitest per component, TDD RED first)

core/@luana/hooks/src/
  useAutosave.ts      MOD   (add coalesce + flush, back-compat)   __tests__ MOD

core/@luana/eslint-config/   NEW PACKAGE
  package.json src/index.js src/no-arbitrary-value.js src/__tests__/no-arbitrary-value.test.js

vitalia/frontend/
  package.json        MOD   (add @luana/ui-kit + @luana/design-tokens + @luana/eslint-config workspace deps)
  src/app/globals.css MOD   (R-1SRC: single --radius, --vitalia-* → aliases)
  eslint.config.mjs   MOD   (wire @luana/eslint-config no-arbitrary + baseline allowlist)
  src/app/showcase/page.tsx + components NEW (renders REAL @luana/ui-kit components)
  src/__tests__/architecture/
    test-ds-tokens-lock.test.ts          NEW
    test-ds-tokens-lock-ratchet.test.ts  NEW   (+ baseline allowlist file)
    test-no-native-select.test.ts        NEW   (ratchet)
    test-no-div-layout.test.ts           NEW   (ratchet)
    test_no_hardcoded_colors.test.ts     EXTEND/verify (DO NOT duplicate)
```
**Mark:** lifts rewire local imports (`@/components/ui/skeleton`→`./skeleton`, `@/lib/utils`→ui-kit `cn`, nicolify avatar/dropdown→ui-kit equivalents). Strip `// cap:` / `// story-origin:` headers from lifted files; add canon-anchored headers.

## 11. Cross-Cutting Concerns

- **Tenant isolation:** N/A (no data).
- **Currency / master data:** N/A.
- **Spanish neutro LatAm:** all UI strings in the lifted/new components + /showcase labels = Spanish neutro (no voseo). EmptyState/ErrorState copy, EntityPicker "Buscar…"/"Sin resultados"/"Mostrando N de M".
- **PII:** N/A.
- **Native-first dev:** ALL lint/test/typecheck native — `npx tsc/eslint/vitest` (vitalia), `npm run typecheck/test` (`@luana/*` via root venv-equivalent pnpm). NEVER `docker exec`.
- **FSD-Lite (vitalia pilot):** /showcase route in `src/app/` (thin) consuming `@luana/ui-kit`; arch-tests under `src/__tests__/architecture/`. The `@luana/ui-kit` import is allowed (engine package via `@luana/*`).
- **Tailwind 4 / ESLint 9:** vitalia is Tailwind **4.1** (CSS-first `@theme`) + ESLint **9** (flat config). The no-arbitrary rule must be a flat-config-compatible custom rule.
- **Color per agent + semantic invariance:** EntityInfoCard accent + Group strip use `--agent-{slug}`; semantic tones (success/warning/danger) NEVER agent-colored (canon §2.8).

## 12. Architecture Fitness Impact

| Gate | File | Effect |
|---|---|---|
| ds-tokens-lock (eslint) | `vitalia/.../test-ds-tokens-lock.test.ts` + rule | NEW — locks spacing/radius/font-size/color-hex; sizing allowlisted (RN-1) |
| ds-tokens-lock ratchet | `test-ds-tokens-lock-ratchet.test.ts` + baseline file | NEW — shrink-only (RN-2, AC-4, AC-6); seed ~85 (color) + 32 (radius) + 83 (font) baseline |
| no-native-select | `test-no-native-select.test.ts` | NEW — ratchet (canon §2.5) |
| no-div-layout | `test-no-div-layout.test.ts` | NEW — ratchet, prohibit raw `<div>` layout where a primitive exists; LARGE seeded baseline (~208), do NOT migrate (Fase 3) |
| no-hardcoded-hex | `test_no_hardcoded_colors.test.ts` (EXISTING) | EXTEND/verify parity — keep its ratchet, do NOT fork |
| existing ratchets | `test_page_padding`, `test-no-vt-classes-in-new-features` | must stay GREEN; R-1SRC reinforces vt-class ratchet |
| ui-kit vitest | `core/@luana/ui-kit/src/__tests__/*` | NEW per-component RED→GREEN |

**Allowlist policy:** all new ratchets seed their baseline at the CURRENT count (no build break) and shrink-only. Migrating the baselines to zero = Fase 3 `{brand}-ds-adoption` (OUT of scope). Named escape `// ds-lock-allow: <razón>` is auditable (RN-6).

## 13. capability YAML + modules updates required (post-merge)

- `docs/product/capabilities/infra/design-system-tokens-lock.yaml` — confirm/create with `user_visible: false`, zone Infraestructura/plataforma-tecnica, `dev_preview.main_component` → `/showcase` route. (`/pm-luana` Fase F.)
- `@luana/{design-tokens, ui-kit}` CHANGELOG + semver MINOR bump (`design-tokens` 0.1.0→0.2.0; `ui-kit` 0.2.0→0.3.0).
- No `modules/{m}.md` change.

## 14. Test Surfaces (TDD RED-first)

- **`@luana/design-tokens`:** typecheck only (frozen consts). A unit test asserts the exported shape (names present, frozen).
- **`@luana/ui-kit`:** Vitest per component (RED first): EntityWorkspaceLayout (master vs detail mode, SSR-safe skeleton store-free), EntitySubNavBar (root-pill nav, roving tabindex), EntityPicker (debounced search calls `searchFn`, windowed render, empty state), EntityInfoCard (clickable + kebab stopPropagation + Skeleton + Empty), Group (semantic error), FloatingAutosaveIndicator (one-per-page, role=status), layout-primitives (render + a11y roles), archetypes (slot composition).
- **`@luana/hooks::useAutosave`:** RED test for coalesce (two rapid edits → one merged payload) + flush; back-compat test (existing 2000ms last-wins path unchanged).
- **`@luana/eslint-config`:** `RuleTester` cases — `text-[13px]`/`rounded-[7px]`/`text-[#635BFF]`/`p-[18px]` → error with token suggestion; `w-[200px]`/`max-w-[640px]` → no error; `// ds-lock-allow:` escape → allowed (SC-1/SC-2/SC-4).
- **vitalia arch-tests:** ds-tokens-lock + ratchet (SC-3: +1 fails, −5 passes) + no-native-select + no-div-layout (RED before gate).
- **/showcase (T-9, FUNCTIONAL):** Playwright + live-verify on localhost:3002 — renders REAL `@luana/ui-kit` components, console 0 errors, Next overlay absent (anti-burbuja fixture). NOT "GET 200".

## 15. Research Notes (DATE-AWARE)

- **Knowledge cutoff disclosure:** Opus 4.8 cutoff = Jan 2026. Tailwind 4 + ESLint 9 flat-config patterns are within cutoff but the project pins are version-checked against the repo (Tailwind 4.1, ESLint 9.29 — verified in `vitalia/frontend/package.json` on 2026-06-08). No live WebSearch needed: every pattern here is **lift from existing in-repo code** (anti-duplication), not a novel external pattern.
- **Custom ESLint rule (flat config, ESLint 9):** the no-arbitrary rule is a project-local rule object (`{ meta, create }`) in `@luana/eslint-config`, registered via flat-config `plugins`/`rules`. Verified the repo uses `typescript-eslint` flat config + `eslint-plugin-boundaries` v6 API (already in `vitalia/frontend/eslint.config.mjs`). Canonical ref if needed at build time: `https://eslint.org/docs/latest/extend/custom-rules` (accessed 2026-06-08).
- **EntityPicker virtualization:** repo has `@tanstack/react-virtual` (nicolify) + `react-window` (vitalia); `react-virtuoso` (the canon §6.4 example's `Virtuoso`) is NOT a dep. **Decision:** ui-kit stays query-lib + virtualization-lib agnostic — `EntityPicker` takes a `searchFn` prop (consumer owns react-query/fetch) and uses `@tanstack/react-virtual` (already a workspace dep, add to ui-kit deps) for windowing, NOT `react-virtuoso`. This honors the canon's intent ("never load the whole collection", windowed, debounced, paginated) without forcing a heavy dep on all ui-kit consumers. Document in build ticket.

## 16. Open Questions for PM

1. **EntityPicker virtualization lib:** I picked `@tanstack/react-virtual` (existing dep, query-lib-agnostic via `searchFn` prop) over the canon §6.4 literal `Virtuoso`/`useInfiniteQuery` (which would force `react-virtuoso` + `react-query` deps on ui-kit). The canon §6.4 code is illustrative; the **contract** (debounced + paginated + windowed + lazy, never-load-all) is preserved. Confirm OK, or insist on the literal libs.
2. **`@luana/eslint-config` as a new package** (vs a local custom rule in vitalia): I recommend the **shared package** (so nicolify/comunify opt-in cleanly in Fase 3 — single rule home, no per-brand copy = anti-duplication). Confirm package creation is in scope (it's a net-new `@luana/*` package this story owns).
3. **R-1SRC `--vitalia-*` as aliases vs delete:** I kept the 85 legacy consumers working by aliasing `--vitalia-*` → Shadcn tokens (non-breaking), deferring their migration to Fase 3. Confirm aliasing is acceptable (vs a bigger now-migration that's explicitly out of scope).
