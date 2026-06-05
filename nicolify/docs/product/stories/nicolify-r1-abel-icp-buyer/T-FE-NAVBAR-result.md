# T-FE-NAVBAR — EntitySubNavBar Permanent Bar + Root-as-Leaf Refactor

**Ticket:** T-FE-NAVBAR (Chris demo feedback round 4)
**Story:** nicolify-r1-abel-icp-buyer
**Status:** tests-passing

---

## What Changed

### 1. EntitySubNavBar.tsx — Root becomes a peer leaf

**Before:** "ICPs" was a `<Link>` back-link with a `‹` arrow, visually distinct from buyer leaves. The bar was only mounted on the detail route. `entity=null` put all content leaves in an `isDisabled` state.

**After:** "ICPs" is the FIRST entry in the `role="tablist"` — a `LeafTabButton` pill with the same shape as all other leaves. No `‹` arrow. No `Link` element.

- **Master mode (`entity=null`):** Root leaf is `aria-selected=true` (active). Only the root leaf renders. Placeholder "Selecciona un ICP" appears in the identity slot. No buyer leaves, no Datos leaf, no `+buyer` affordance.
- **Detail mode (`entity` present):** Root leaf is `aria-selected=false` (inactive peer). Clicking it navigates to `rootHref` via `router.push`. Entity identity (icon + name) + full leaf set rendered.

New props: `rootLeafId?: string` (default `"root"` → testid `entity-leaf-root`), `isRootLeaf?: boolean` on `EntitySubNavLeaf` (internal flag).

Removed: `<Link>` import, `isDisabled` global flag, `‹` arrow span.

### 2. EntityWorkspaceLayout.tsx — Skeleton updated

Loading skeleton updated to match the new layout (root leaf pill skeleton instead of back-link skeleton). No behavioral change.

### 3. SubTabContent.tsx — Permanent bar on master route

The `abel.icp` dispatch case now renders `<IcpMasterWithNavBar>` instead of a plain `<IcpMasterListView>` wrapper.

`IcpMasterWithNavBar` (thin internal component):
- Derives `rootHref` from `useParams<{ tenantId }>()` (self-contained, no prop threading)
- Renders `EntitySubNavBar` with `entity=null` + `leaves={EMPTY_LEAVES}` at the N3 sticky position
- Renders `IcpMasterListView` below the bar

The detail route continues to mount the bar via `[subsubtab]/layout.tsx → IcpEntityLayoutClient → EntityWorkspaceLayout` — no change to that path.

### 4. EntitySubNavBar.test.tsx — Tests updated for root-as-leaf behavior

- Updated workspace mode tests: now expects 4 tabs (root + 3 content), root inactive when content leaf selected
- Removed old directory-mode tests (entity=null all-disabled behavior no longer exists)
- Added master mode test suite: root active, only 1 tab, placeholder text, no content leaves, no `+buyer`
- Added keyboard navigation tests including root leaf (Home now goes to root at idx 0)
- Added root leaf testid tests (`entity-leaf-root`, `data-root-leaf=true`)
- Removed back-link test (no more `<a>` element)

### 5. AbelIcpDetailPage.ts POM — goBack() updated

`goBack()` now targets `[data-testid='entity-leaf-root']` instead of a Link back element (with `entity-sub-nav-back` alias for legacy compatibility).

---

## 3 States (Chris-ratified ASCII)

```
Master (no ICP):  [ ICPs ]   Selecciona un ICP
                  ↑active     ↑placeholder · no buyers · no Datos · no +buyer

Detail (ICP X):   [ ICPs ]  🎯 Agencias…  [ 📋 Datos del ICP ]  [🟣 Fundador ★]  [🔵 Director]  [ + buyer ]
                  ↑inactive, same pill shape as the buyer leaves
```

---

## Gate Outputs

### TypeScript (`tsc --noEmit`)
```
0 errors
```

### ESLint (`eslint src/`)
```
0 errors, 308 warnings (was 312 before — shrank by 4)
```

### Vitest (affected modules)
```
Test Files: 23 passed
Tests: 265 passed (all green)
```

### Architecture fitness (`vitest run src/__tests__/architecture/`)
```
Test Files: 5 passed
Tests: 127 passed
```

### Full Vitest suite
```
Test Files: 38 passed
Tests: 552 passed
Coverage: 55.97% statements (threshold: 20%)
```

---

## Files Touched

| File | Change |
|---|---|
| `src/components/shared/shell-organism/EntitySubNavBar.tsx` | Root-as-leaf refactor — removes Link/back-arrow, adds root LeafTabButton, master mode |
| `src/components/shared/shell-organism/EntityWorkspaceLayout.tsx` | Skeleton updated for new layout |
| `src/components/shared/shell-organism/SubTabContent.tsx` | abel.icp dispatch → IcpMasterWithNavBar (permanent N3 bar) |
| `src/components/shared/shell-organism/EntitySubNavBar.test.tsx` | Tests updated for root-as-leaf + new master mode tests |
| `e2e/poms/AbelIcpDetailPage.ts` | goBack() updated to use entity-leaf-root testid |

---

## Skills Consulted

- `frontend-expert` — FSD-Lite boundaries, component patterns, ESLint baseline, runtime quality checklist
- `brand-expert` — N/A (no brand studio fields touched)
- `offer-expert` — N/A (no offer studio fields touched)
- `copilot-expert` — N/A (no copilot fields touched)
- `sales-agent-expert` — N/A
- `metrics-expert` — N/A
- `chrome-devtools-verify` — live verification deferred to Chris staging gate (stack :3001 requires `make dev-nicolify` + cloudflared tunnel; dev-app.nicolify.com tunnel is up but FE must be running for the new bar to render live)

---

## Live Verification Note

The `entity-sub-nav-bar` is now permanent on `/abel/icp` (master route) and `/abel/icp/{id}/{leaf}` (detail route). Manual verification steps:

1. `make dev-nicolify` (starts FE :3001 + BE :8001)
2. Navigate to `/{tenantId}/abel/icp` → expect bar with `[ICPs]` active + "Selecciona un ICP" placeholder
3. Click an ICP card → navigate to `/abel/icp/{id}/datos` → expect bar with `[ICPs]` inactive + `🎯 {name}` + `[📋 Datos]` + buyers + `[+ buyer]`
4. Click `[ICPs]` leaf in detail view → navigate back to master list

<!-- @pm: build phase done (state: tests-passing). Commit: pending. Files: 5. Native ticket tests: 552/552 PASS. Awaiting orchestrator → gate-runner → auditor-frontend (independent verdict). -->
