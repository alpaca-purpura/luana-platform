# Observed (pre-existing): nicolify-r0-shell regression — 4 specs fail serially

**Found:** 2026-06-04, during `nicolify-r1-abel-icp-buyer` full-regression run (scroll fix). **Scope:** `nicolify-r0-shell` (NOT r1-abel — out of this story's scope, documented per anti-egoísmo).

## What

The `nicolify-r0-shell` regression specs fail even SERIAL (workers=1) — 4 failed / 12 passed in the sampled subset; the full regression project showed ~21 failed / 119 passed (the rest amplified by the OLD HB-32 parallel flakiness that was only fixed for the abel suite, not r0-shell).

Confirmed failing serially:
- `topbar-render-desktop.spec.ts` — "visible en TopBar izquierda" → `toBeVisible()` failed (a TopBar-left element not rendering as the spec expects).
- `theme-toggle.spec.ts` — "light↔dark toggle back to light" → `toHaveClass()` failed (theme class not reverting).

## Verify-first proof it's PRE-EXISTING (not the abel scroll fix)

`git stash` the AppPanelSlot scroll fix → re-ran the 4 specs → **identical 4 failures** (4 failed / 12 passed). So the AppPanelSlot `flex flex-col` change did NOT cause them. abel regression is 21/21 serial with the fix.

## Likely nature

Either (a) the r0-shell suite still carries the HB-32 flakiness debt (only abel got the self-provisioning + serial + retries:0 treatment), or (b) genuine r0-shell breakage (TopBar-left element + theme toggle). The r0-shell story was reopened 2026-05-31 (DoD #37). Needs an r0-shell bugfix pass: (1) apply the HB-32 hardening to the r0-shell suite, (2) diagnose whether topbar-left + dark-toggle are real product bugs or stale tests.

## Route

`/pm-nicolify` → open an `nicolify-r0-shell` bugfix story (HB-32 hardening for r0-shell + topbar/theme diagnosis). Does NOT block `nicolify-r1-abel-icp-buyer` (abel surface is green; these are r0-shell).
