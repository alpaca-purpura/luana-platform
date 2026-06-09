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
