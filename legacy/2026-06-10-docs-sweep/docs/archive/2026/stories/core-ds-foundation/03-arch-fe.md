# 03-arch-fe — core-ds-foundation (FE surface)

> This story is **FE-only**. The consolidated contract is `03-arch.md`. This file adds the FE-specific § Integration design (CONN), § Design System Canon adherence, and § Prior art audit that the builder + auditor consume. No `03-arch-be.md` / `03-arch-agentic.md` (no BE, no agentic surfaces).

## § Prior art audit (anti-duplication-refining)

The **inventory IS the prior-art scan**. Decisions (full table in `03-arch.md § Existing systems audit`):

- **CONSUME (already in `@luana/ui-kit`, do NOT recreate):** `select.tsx` (= canon §2.5 `Select`), `tooltip.tsx` (= §2.8), `AutosaveBadge`, `detail-panel`, `skeleton`, `popover`, `command`, `scroll-area`, `avatar`, `card`, `input`, `textarea`, `badge`, `dropdown-menu`.
- **EXTEND:** `@luana/design-tokens` (z-index pattern → add spacing/radius/typography/color-name) · `@luana/hooks::useAutosave` (add `coalesce` + `flush`, back-compat) · `vitalia .../test_no_hardcoded_colors.test.ts` (the no-hardcoded-hex gate already exists — verify parity, keep ratchet).
- **LIFT (resolve cross-brand mirror / generalize best version) → `@luana/ui-kit`:**
  - `EntitySubNavBar` — MIRROR vitalia+nicolify → lift (nicolify base, `EntitySubNavBar.tsx`).
  - `EntityWorkspaceLayout` — nicolify `EntityWorkspaceLayout.tsx:1-130` (store-free skeleton, URL-derived activeLeaf, G2).
  - `EmptyState` — MIRROR vitalia+nicolify → lift vitalia `shell-organism/EmptyState.tsx:38-82`.
  - `EntityInfoCard` — vitalia `StaffCard.tsx` (media `:68-85`, title `:87-90`, subtitle `:91-105`, metrics `:109-134`) + agent-color icon `nicolify IcpCard.tsx:110-119` + status rail `vitalia ReEngagementCard.tsx:35-45`.
  - `Group`/`GroupHeader` — nicolify `IcpDatosForm.tsx:123-163`.
  - `FloatingAutosaveIndicator` — vitalia `FloatingAutosaveIndicator.tsx:68-116`.
- **NEW (genuinely missing — no prior art):** page-primitives (PageContainer/Header/Section/ContentStack/Toolbar/FilterBar/ErrorState/ListPageSkeleton/FormPageSkeleton/Pagination/DetailLayout/FormLayout), page archetypes, `EntityPicker`, eslint `no-arbitrary-value` rule, `@luana/eslint-config` package, `no-native-select` + `no-div-layout` arch-tests.

**Lift discipline:** lifts via IMPORT-and-generalize, NOT from-scratch. Rewire local imports: `@/components/ui/skeleton`→`./skeleton`, `@/lib/utils`→ui-kit `cn`, nicolify `Avatar`/`DropdownMenu`/`Popover`→ui-kit equivalents. Strip `// cap:`/`// story-origin:` headers; add canon-anchored headers.

## § Design System Canon adherence (binding HARD)

| Canon § | Contract | Where built |
|---|---|---|
| §1 Contenedor HOJA | 100% width, full-bleed N3 strips, content in PageContainer (`1.25rem 1.5rem`) + PageContentStack | layout-primitives (T-3) |
| §2.1 EntityWorkspaceLayout | 1-panel URL-driven (master grid ↔ detail workspace), NOT 2-col persistent | T-4 |
| §2.2 EntitySubNavBar | THIRD ribbon full-bleed (sticky, bg-card, border-bottom, `border-radius:0` — NEVER rounded card), root-pill `‹ {rootLabel}`, roving tabindex | T-4 |
| §2.3 EntityInfoCard | Opción B, `auto-fill minmax(250px,1fr)`, circular media, whole-card clickable, kebab ⋮ stopPropagation, + Skeleton + Empty obligatory | T-5 |
| §2.4 EntityPicker | server-side debounced search + cursor-paginated + windowed + lazy; ❌ never load whole collection | T-6 |
| §2.5 Select | = existing `@luana/ui-kit/select.tsx` (Shadcn) — verify parity, CONSUME | T-2 wiring (no rebuild) |
| §2.6 autosave + Group | use-autosave 600ms+coalesce + flush; ONE FloatingAutosaveIndicator/page; agent-strip; 1-col default / 2-col only paired | T-7 |
| §2.7 page-primitives | the ~10 primitives; pages armed from these, not `<div>` | T-3 |
| §2.8 atoms | tooltip + color-per-agent + semantic invariance | CONSUME + T-5 |

## § Integration design (CONN — anti-orphan-integration)

Nothing reaches `done` as an island. The 4 contentions:

- **Consumed (≥1 real consumer):** the `/showcase` route (T-9) imports and renders EVERY new/lifted `@luana/ui-kit` component → guaranteed real consumer + visual regression guard. (Comprehensive per-brand consumption = Fase 3.)
- **On the map:** home cap = `infra/design-system-tokens-lock` (zone Infraestructura/plataforma-tecnica, `user_visible: false`); `dev_preview.main_component` → `/showcase`.
- **Navigable/reachable:** `/showcase` is a real reachable route on localhost:3002 (pilot vitalia). The lint/arch-test gates are reachable via `npx eslint` / `npx vitest run` (the "action" for the tooling surface, per 01-spec § Matriz: ejercer el gate).
- **Notarized/registered:** every component exported from `core/@luana/ui-kit/src/index.ts`; every token from `core/@luana/design-tokens/src/index.ts`; the eslint rule registered in `vitalia/frontend/eslint.config.mjs`; the arch-tests discovered by vitest. The /showcase route registered as an app route (no nav-tree entry needed — it's a dev surface, reachable by URL).

**Reachability path (concrete):** `npx eslint src/` (vitalia) → loads `@luana/eslint-config` no-arbitrary → errors on new locked-axis arbitrary. `localhost:3002/showcase` → renders real `@luana/ui-kit` components → console 0 errors. `import { EntityWorkspaceLayout } from "@luana/ui-kit"` resolves (workspace dep added to vitalia/frontend).

## § FE notes

- **vitalia consumes `@luana/ui-kit` for the first time:** add `@luana/ui-kit` + `@luana/design-tokens` + `@luana/eslint-config` as `workspace:*` deps in `vitalia/frontend/package.json` (today only `@luana/hooks`). `pnpm install` after.
- **Tailwind 4.1 + ESLint 9 flat config:** no-arbitrary rule = project-local flat-config rule object; wires into existing `eslint.config.mjs` (which already uses `typescript-eslint` flat + `eslint-plugin-boundaries` v6).
- **R-1SRC first (T-1):** without one token source, the lock is meaningless. Single `--radius` (keep 0.625rem), `--vitalia-*` → aliases of Shadcn tokens (non-breaking for 85 consumers).
- **/showcase = the ONLY live-verifiable functional surface** (Critical Rule #37, T-9): exercise on localhost:3002, console 0 errors, real components render. All other tickets = technical (gates).
