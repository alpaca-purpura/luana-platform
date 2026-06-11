## 0.4.0 — 2026-06-11 (platform-lift-shell-chrome-ui-kit · T-K1)
### Added — organism layer (`src/organism/shell/`)
- **`createShellStore({ storageKey, version?, migrate? })`** — generic SSR-safe Zustand store factory for the shell state machine. Brand-agnostic port of the per-brand `shell-store.ts` (vitalia/nicolify), re-parametrized to neutral naming (RN-2): `valeriaOpen → supervisorOpen`, `valeriaPct → splitPct`. CONSUMES `@luana/hooks/createSsrSafePersistedStore` (RN-8 — never reimplements SSR-safe persistence). Brand passes `storageKey` (SC-6 — conserved for e2e: `vitalia-shell-state` / `nicolify-shell-state`) + optional `migrate` for legacy shapes. Machine: A=closed (strip) · B=chat (split) · C=chat+history (additive push). `historyOpen` never persisted open (no-clobber). Default migrate validates the current shape; corrupt → fallback + warn.
- **`extractAgentFromPath` / `extractSubtabFromPath` / `isValidAgent` / `isValidSubtab`** (`routing.ts`) — generic catalog-driven routing helpers (port of vitalia `lib/agent-catalog.ts` helpers). The brand passes its agent slug-set + special tabs + sub-tab map by argument; the kit ships zero hardcoded brand slugs/labels.
- **Generic organism types** (`types.ts`) — `ShellAgentDescriptor`, `ShellSubTabMeta`, `SupervisorOpen`, `ShellPersistedState`, `ShellStoreState`, `ShellChatStoreApi`, `ShellStore`, `CreateShellStoreOptions`, `ShellLayoutProps`, `ShellLayoutLabels`, `ShellRoutingOptions`. Verbatim from `03-arch.md § API contract`. Zero brand tokens.
- Vitest: `src/organism/shell/__tests__/{create-shell-store,routing}.test.ts` (machine A/B/C transitions + migrate hook + no-clobber hydration SC-6 + generic routing helpers).
### Changed — deps + SEMVER
- New runtime deps: **`react-resizable-panels` `^4.11.1`** + **`zustand` `^5.0.5`** (exact ranges of `vitalia/frontend`) — required by the shell organism. Additive; zero breaking on existing exports.
- **SEMVER 0.3.0 → 0.4.0 (minor — additive organism layer · Decisión D).**
### Notes
- **Group-name collision (Decisión D):** the kit already exports a form `Group`. T-K1 does NOT re-export `react-resizable-panels`' `Group`/`Panel`/`Separator` from the barrel. If a resize handle must be public (later ticket), it is named `ShellResizeHandle`.
- T-K1 scope = scaffolding only (factory + types + routing). Visual components (`ShellLayout`, `SupervisorSidebar`, `Ribbon`, `ChatPanel`, …), the `ssr:false` wrapper, and the RN-4 v4 fixes (key-remount, retry-rAF, collapsedSize px, push ±histPct, grid implícito) land in T-K2.

## 0.3.0 — 2026-06-08 (core-ds-foundation)
### Added
- Layout-primitives: PageContainer · PageContentStack · PageHeader · PageSection · Toolbar · FilterBar · EmptyState · ErrorState · ListPageSkeleton · FormPageSkeleton · Pagination · DetailLayout · FormLayout.
- Entity components: EntityWorkspaceLayout + EntitySubNavBar (lift nicolify, full-bleed N3 ribbon, store-free skeleton) · EntityInfoCard + Skeleton + Empty (lift vitalia StaffCard) · EntityPicker (net-new: searchFn-prop, debounced + cursor-paginated + @tanstack/react-virtual windowed).
- Autosave/Group: FloatingAutosaveIndicator + Group/GroupHeader (lifts).
- Page archetypes: ListPageScaffold · DetailPageScaffold · FormPageScaffold · DashboardPageScaffold.
### Changed
- Atoms dialog/sheet/alert-dialog/detail-panel no longer hard-couple to a consuming app's copilot store (via @luana/hooks use-copilot-offset decouple) → ui-kit now consumable cross-brand.

# @luana/ui-kit Changelog

## [0.2.0] — 2026-05-30

### Added (T-2 build-autosave-primitive-luana)

- **`AutosaveBadge`** component — autosave lifecycle status badge (ADR-012).
  - Props: `{ status: AutosaveStatus; savedAt?: Date | null; labels?: Partial<Record<AutosaveStatus, string>> }`
  - Composes the existing `Badge`/`badge.tsx` design system primitives.
  - `aria-live="polite"` for idle/dirty/saving/saved; `aria-live="assertive"` for error.
  - `role="status"` + `aria-atomic="true"` for screen reader support.
  - Icon + text on every non-idle state (never color alone — WCAG 1.4.1).
  - Contrast AA ≥4.5:1: uses `emerald-700` (5.49:1) for saved state, NOT vitalia's prior `emerald-600` (3.65:1 — known a11y bug not reproduced here).
  - `data-state={status}` attribute for test selectors.
  - Default labels Spanish neutro LatAm (no voseo): idle "" / dirty "Sin guardar" / saving "Guardando…" / saved "Guardado" / error "No se pudo guardar. Reintenta."
  - `labels` prop overrides any subset of labels (i18n-ready).
  - `savedAt` Date shows relative time when `status=saved`.
  - Design-token classes (Tailwind) — no hardcoded hex.
  - Zero Clerk coupling (`AutosaveStatus` imported from `@luana/hooks`).
- **`AutosaveShowcase`** (examples/AutosaveShowcase.tsx) — consumer-of-reference that wires `useAutosave` + `<AutosaveBadge>` end-to-end without brand coupling (proves the ADR-012 contract typechecks).
- Barrel export: `export * from "./AutosaveBadge"` added to `src/index.ts`.
- 32 Vitest unit/component tests (`src/__tests__/AutosaveBadge.test.tsx`).

## [0.1.0] — initial

- Lift from `AISALESHT/frontend/src/components/ui/` — 43 Shadcn/UI primitive components.
