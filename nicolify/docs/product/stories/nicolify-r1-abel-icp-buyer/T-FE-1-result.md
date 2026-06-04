---
ticket: T-FE-1
story: nicolify-r1-abel-icp-buyer
brand: nicolify
surface: frontend
agent: builder-frontend (Sonnet)
status: tests-passing
completed_at: 2026-06-04
cap_target: abel.icp-buyer
---

# T-FE-1 Result — EntitySubNavBar + EntityWorkspaceLayout + Detail Routing Layer

## Summary

Implemented the structural N3-dynamic navigation base for Abel's ICP workspace. This ticket is the routing+navigation skeleton that T-FE-3 (master list + forms) and T-FE-4 (buyer forms) navigate to and fill.

## Files Created / Modified

### New files — components/shared/shell-organism/

| File | Purpose |
|---|---|
| `nicolify/frontend/src/components/shared/shell-organism/EntitySubNavBar.tsx` | N3-dynamic navigation bar (port vitalia re-themed, dynamic leaves: datos + N buyers + "+ buyer") |
| `nicolify/frontend/src/components/shared/shell-organism/EntitySubNavBar.test.tsx` | Vitest — 19 tests (TDD RED-first): role=tablist, roving tabindex, arrow nav, directory-mode disabled, router.push, 30-leaves SC-large, + buyer affordance |
| `nicolify/frontend/src/components/shared/shell-organism/EntityWorkspaceLayout.tsx` | Client layout: mounts EntitySubNavBar + children slot. Store-free skeleton (G2). useParams → activeLeaf URL-derived |
| `nicolify/frontend/src/components/shared/shell-organism/EntityWorkspaceLayout.test.tsx` | Arch text-scan test (8 tests): G2 store-free, named export, "use client", Skeleton, EntitySubNavBar, cap header |

### New files — app routing layer

| File | Purpose |
|---|---|
| `nicolify/frontend/src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/[entityId]/layout.tsx` | Server layout: whitelist guard (agent=abel, subtab=icp, UUID entityId) → delegates to IcpEntityLayoutClient |
| `nicolify/frontend/src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/[entityId]/page.tsx` | Redirect entityId → datos (first leaf, ensures activeLeaf always set) |
| `nicolify/frontend/src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/[entityId]/[leaf]/page.tsx` | Leaf dispatch: datos → IcpDatosPlaceholder, buyerId → BuyerLeafPlaceholder (real forms in T-FE-3/T-FE-4) |

### New files — features/abel/

| File | Purpose |
|---|---|
| `nicolify/frontend/src/features/abel/components/icp/IcpEntityLayoutClient.tsx` | Client: builds dynamic leaves (datos + stub buyers + "+ buyer"), delegates to EntityWorkspaceLayout. G2 store-free. T-FE-3 replaces stubs with real useIcp/useBuyers hooks |
| `nicolify/frontend/src/features/abel/index.ts` | Barrel: exports IcpEntityLayoutClient (named export, no default) |

## Gate Results

| Gate | Status | Notes |
|---|---|---|
| tsc --noEmit | PASS | 0 errors, TypeScript strict |
| ESLint 0 errors | PASS | 0 errors; 114→114 warnings (delta=0, baseline did NOT grow) |
| Vitest component tests | PASS | 19 EntitySubNavBar + 8 EntityWorkspaceLayout = 27 new tests GREEN |
| Architecture fitness (90 tests) | PASS | All 90 PASS including new files auto-scanned by test_spanish_neutro |
| Pre-existing failures | INFO | 2 failures in ShellOrganismLayoutClient.test.tsx — pre-existing BEFORE T-FE-1 (verified via git stash), introduced by upstream T-0 work. Scope: NOT this ticket. |

See `gate-output-fe1.json` for full JSON gate report.

## Architecture Decisions

### EntitySubNavBar — dynamic leaves (nicolify vs vitalia)

**Vitalia:** fixed leaves per entity type (perfil/horarios/servicios for doctor).
**Nicolify:** dynamic leaves at runtime:
- `datos` leaf — always first (the ICP entity itself)
- `{buyerId}` leaf — one per buyer (grows as buyers are created in T-FE-4)
- `__add_buyer__` leaf — always last, `isAddAffordance: true` flag for visual distinction + aria-disabled in directory mode

The `agentSlug: AgentSlug` prop added (not in vitalia version) enables G3 JIT-safe agent-abel coloring (`#A855F7`) via `agentBgClass("abel")` + `agentTextClass("abel")` from `_agent-tw-classes.ts`.

### G2 SSR-safe (store-free skeleton)

`EntityWorkspaceLayout` is `"use client"` (needs `useParams`) but does NOT import `useShellStore`. The skeleton rendered during hydration is 100% store-free (arch test `EntityWorkspaceLayout.test.tsx` text-scan gate). `IcpEntityLayoutClient` is also store-free — it uses `useMemo` (React, not Zustand) for leaf computation.

### G3 JIT-safe (Tailwind)

All agent-abel Tailwind classes use `agentBgClass("abel")` → `"bg-agent-abel"` (literal string from switch/case). No template literals in class strings. Architecture test `test_agent_tw_classes.test.ts` (pre-existing) continues to pass.

### Routing whitelist guard (A4)

`[entityId]/layout.tsx` validates:
1. `isValidAgent(agent) && isValidSubtab(agent, subtab)` via shell-routes SSoT
2. `agent === "abel" && subtab === "icp"` (only N3-dynamic combination in R1)
3. entityId UUID-shape regex `/^[0-9a-f-]{8,64}$/i`

Cross-tenant isolation (full `tenant_id` validation) is deferred to `IcpEntityLayoutClient` via React Query hooks (T-FE-3 scope).

### T-FE-1 scope (D3 discipline)

This ticket implements ONLY:
- EntitySubNavBar + EntityWorkspaceLayout shared components (reachable via routing)
- [entityId]/layout + page + [leaf]/page routing skeleton
- IcpEntityLayoutClient with STUB data (no real API calls yet)

**NOT in T-FE-1 scope (D3 boundary respected):**
- IcpMasterListView, IcpCard (T-FE-3)
- IcpDatosForm, BuyerLeafForm (T-FE-4)
- SubTabContent "abel.icp" wire (T-FE-3 modifies SubTabContent)
- Real useIcp / useBuyers hooks (T-FE-3)
- Visual goldens (T-E2E-1)

### CONN (anti-orphan integration)

The routing layer is:
- **Consumed**: by `[entityId]/layout.tsx` which imports `IcpEntityLayoutClient`
- **On the map**: cap `abel.icp-buyer` declared in header comments
- **Navigable**: IcpEntityLayoutClient is exported from `features/abel/index.ts`; routing is reachable via `/{tenantId}/abel/icp/{entityId}/datos`
- **Notarized**: `[entityId]/layout.tsx` is registered in the Next.js App Router file system

The SubTabContent "abel.icp" wire (replacing EmptyState with IcpMasterListView) is T-FE-3 scope — documented here as residual.

## A11y Notes

- `role="tablist"` on `<nav>` ✓
- `role="tab"` + `aria-selected` + `aria-disabled` per leaf ✓
- Roving tabindex (only focused tab has `tabIndex=0`) ✓
- ArrowLeft/ArrowRight/Home/End keyboard navigation ✓
- Directory mode (`entity=null`): all leaves `aria-disabled="true"` + `tabIndex=-1` ✓
- "+ buyer" affordance also `aria-disabled` in directory mode ✓
- `aria-label` on nav + identity area ✓
- `aria-label` on back link (`Volver a {rootLabel}`) ✓
- `aria-busy="true"` on skeleton loading state ✓
- Focus-visible ring on all interactive elements ✓

axe wcag2aa validation: deferred to T-E2E-1 (Playwright visual + a11y tests scope). Component-level a11y verified via Vitest role/aria assertions.

## Residual for auditor-frontend

1. **SubTabContent wire** (T-FE-3): "abel.icp" EmptyState → IcpMasterListView replacement — NOT this ticket.
2. **Real data hooks** (T-FE-3): `useIcp(icpId)` + `useBuyers(icpId)` replace stubs in `IcpEntityLayoutClient`.
3. **Cross-tenant validation** (T-FE-3): full `tenant_id` validation in IcpEntityLayoutClient via React Query.
4. **Pre-existing test failures**: 2 failures in `ShellOrganismLayoutClient.test.tsx` are pre-existing upstream (not T-FE-1 scope). Flag for T-0 remediation.
5. **Visual goldens** (T-E2E-1): axe wcag2aa + Playwright visual assertions scoped to T-E2E-1.
6. **Live verification** (chrome-devtools-verify): deferred — dev-app.nicolify.com requires BE stack running + full FE feature (T-FE-3/T-FE-4). Escalated to Chris staging gate at story close per definition-of-done-live-verify.md.

## Downstream T-FE-3 / T-FE-4 handoff

T-FE-3 MUST:
1. Replace `IcpEntityLayoutClient` stubs with `useIcp(icpId)` + `useBuyers(icpId)` hooks
2. Modify `SubTabContent` ("abel.icp" → `<IcpMasterListView/>`)
3. Add `IcpMasterListView`, `IcpCard`, `IcpWorkspaceView` to `features/abel/`

T-FE-4 MUST:
1. Implement `IcpDatosForm` (replaces `[leaf]/page.tsx` placeholder for `leaf="datos"`)
2. Implement `BuyerLeafForm` (replaces `[leaf]/page.tsx` placeholder for `leaf={buyerId}`)
3. Wire `[leaf]/page.tsx` to dispatch to real form components
