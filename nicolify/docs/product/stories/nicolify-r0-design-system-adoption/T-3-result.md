# T-3 Result — Re-express abel/icp + shell via kit primitives/archetypes

**Commit:** `4baa816e`
**Branch:** `wip/nicolify`
**Deliverable:** structural re-expression of abel/icp components onto `@luana/ui-kit` primitives. ZERO business-logic change.

---

## Diff summary

| File | Change |
|---|---|
| `IcpMasterListView.tsx` | `PageContainer` / `PageHeader` / `ListPageSkeleton` / `ErrorState` from kit. Removed inline `IcpGridSkeleton`. Raw `<button>` → Shadcn `Button`. +33 / -80 net |
| `IcpWorkspaceView.tsx` | `FormPageSkeleton` / `ErrorState` from kit. Removed inline `WorkspaceSkeleton`. +12 / -28 net |
| `IcpDatosForm.tsx` | Kit `Group` + `GroupHeader` replace inline versions. `IcpGroupHeader` helper (React Fragment pattern) preserves `data-testid="group-missing-*"` for regression-test compat. `FloatingAutosaveIndicator` replaces `AutosaveBadge` header. `text-[10px]` → `text-xs`. +38 / -72 net |
| `BuyerLeafForm.tsx` | Same Group/GroupHeader/FloatingAutosaveIndicator migration. `text-[10px]` → `text-xs`. +22 / -23 net |
| `ShellLayoutWire.tsx` | **No change.** Already fully uses kit `ShellLayout`. |
| `SubTabContent.tsx` (`IcpMasterWithNavBar`) | **No change.** `flex flex-col flex-1 min-h-0 overflow-hidden` wrappers are overflow-control, not layout primitive candidates. |

Total diff: 4 files, +105 / -203 (net -98 lines — deletion-first).

---

## Validator output

```
tsc --noEmit: PASS (0 errors)
eslint src/features/abel src/components/shared: PASS (0 errors, warnings pre-existing)
vitest run src/features/abel src/components/shared:
  Test Files  21 passed (21)
       Tests  241 passed (241)
```

---

## Design decisions

**GroupHeader trailing slot for WhatForChip:**
Kit `GroupHeader` exposes `trailing: ReactNode` — passed local `<WhatForChip consumers={...} fieldLabel={title} />` directly. No consumers-array mapping needed; visual output identical to before.

**Missing-fields testid preservation (IcpGroupHeader):**
Kit `GroupHeader` with `missingFields` prop doesn't emit `data-testid="group-missing-*"`. Used React Fragment pattern: `<GroupHeader ... />` + conditional `<p data-testid="group-missing-{slug}" ...>` as siblings. Preserved exact testid format for `IcpDatosForm.test.tsx` regression guard.

**FloatingAutosaveIndicator placement:**
Added as last element before `</form>` in both `IcpDatosForm` and `BuyerLeafForm`. One per page (canon §2.6). The autosave hook logic (`autosaveStatus`) was already wired — only the display component changed.

---

## Follow-up FLAGs

**FLAG-1: IcpCard.tsx — not switched to EntityInfoCard**
`IcpCard` uses `<Link href=...>` wrapping the entire card (keyboard-navigable, full-card click). Kit `EntityInfoCard` uses `onClick`. Switching would change navigation semantics (Link → button with router.push). This is a business-logic-adjacent change — kept out of T-3 scope per constraint. Follow-up ticket recommended when ready to adopt the master-grid full EntityInfoCard pattern.

**FLAG-2: SubTabContent IcpMasterWithNavBar wrapper**
`flex flex-col flex-1 min-h-0 overflow-hidden` is an overflow-management shell, not a content layout container. No kit primitive covers this pattern. Kept as-is. No action needed.

---

## Skills consulted

| Skill | Why | Decision |
|---|---|---|
| `frontend-expert` | FSD-Lite boundaries, React patterns baseline, Server/Client split | Fragment pattern for GroupHeader children compat |
| `nicolify-design-system` | Kit API contract (Group/GroupHeader props, FloatingAutosaveIndicator) | `trailing` slot for WhatForChip; Fragment for testid preservation |
| `design-system-canon.md §2.6` | FloatingAutosaveIndicator = ONE per page | Placed at form root, not per-group |
| `frontend-visual-fidelity.md` D1/D3 | No arbitrary-values; scope discipline | `text-[10px]` → `text-xs`; IcpCard kept as-is |
| `shell-mockup-per-component.md` | Shell wrapper assessment | ShellLayoutWire already canonical; no change |
