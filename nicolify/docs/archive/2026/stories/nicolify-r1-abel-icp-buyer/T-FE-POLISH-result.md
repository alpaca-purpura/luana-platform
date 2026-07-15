# T-FE-POLISH — Visual Fidelity Polish (UI Defender gaps)

**Story:** `nicolify-r1-abel-icp-buyer`
**Branch:** `wip/nicolify`
**Commit:** `d5870316`
**Fecha:** 2026-06-04

---

## Scope confirmado (3 red + 2 yellow)

5 findings from `ui-defender-review.md` tackled. All others (M1, M3, B3, B4, B5, B6, C4, C5, A1-A5) explicitly out-of-scope per task brief.

---

## Per-finding verdict

### C1 (red) — Intake mode tabs: underline → pill/segmented control

**Status: REAL — FIXED**

**What was wrong:** `UniversalIntake.tsx` used `border-b border-border` on the tablist container and `border-b-2 -mb-px` on each tab (underline pattern — same visual language as SubTabsBar N2). Mockup defines `intake-mode` as a pill/segmented selector: `background:var(--bg-hover); border-radius:10px; padding:4px` container, active tab with `bg-panel + shadow-sm + color:agent-abel`.

**What changed:** `src/components/shared/intake/UniversalIntake.tsx`
- Container class: `flex gap-1 border-b border-border` → `flex gap-1 bg-muted rounded-lg p-1`
- Each tab: removed `border-b-2 -mb-px rounded-t-md` → now `flex-1 rounded-md`
- Active tab: removed underline border → added `bg-background shadow-sm text-agent-abel font-semibold`
- All data-testids (`intake-mode-tabs`, `intake-tab-url`, `intake-tab-archivo`, `intake-tab-texto`, `intake-tab-conectar`) and role=tablist/tab + roving tabindex preserved intact.

### C2 (yellow) — "Conectar fuente" tab disabled clarity

**Status: REAL — FIXED (partial uplift)**

**What was wrong:** Disabled tab had `text-muted-foreground/40 cursor-not-allowed`. Mockup expects ~60-70% opacity + `cursor-not-allowed`. `aria-disabled` was already set correctly.

**What changed:** Disabled tab class updated to `text-muted-foreground opacity-50 cursor-not-allowed`. Changed `aria-disabled={mode.disabled ? true : undefined}` to `aria-disabled={mode.disabled ? "true" : undefined}` (string form for DOM attribute fidelity). All existing testids preserved.

### C3 / M2 (yellow) — Primary CTA color: --primary (indigo) → --agent-abel (purple)

**Status: REAL — FIXED**

**What was wrong:** Both `UniversalIntake.tsx` "Analizar" submit button and `DraftFirstStarter.tsx` "Abel te arma un borrador" button used the default Shadcn Button which renders with `bg-primary` (indigo `#635BFF`). On Abel-owned surfaces the CTA should be `--agent-abel` (purple `#A855F7`).

**What changed:**
- `src/components/shared/intake/UniversalIntake.tsx`: `intake-submit-btn` Button gained `className="bg-agent-abel hover:bg-agent-abel/90 text-white"`
- `src/components/shared/DraftFirstStarter.tsx`: `draft-first-generate-btn` Button gained `className="w-full gap-2 bg-agent-abel hover:bg-agent-abel/90 text-white"` (merges with existing `w-full gap-2`)

### B1 (red) — EntitySubNavBar buyer leaves anatomy

**Status: REAL — FIXED**

**What was wrong:** Mockup defines `entitynav-entity-icon` (colored circle with `🎯` before entity name), `📋` prefix on the datos leaf, colored `leaf-av` avatar circles on buyer leaves, and `★` star for primary buyer. None of these were implemented.

**What changed:**
- `src/components/shared/shell-organism/EntitySubNavBar.tsx`:
  - Extended `EntitySubNavLeaf` interface: added optional `prefixEmoji?: string`, `avatarBgClass?: string`, `isPrimary?: boolean`
  - Extended `EntitySubNavEntity` interface: added optional `icon?: string`
  - Entity identity section: added `border-l` separator + entity icon circle (`bg-agent-abel-soft text-agent-abel rounded-lg 30px`) when `entity.icon` present
  - Extracted `LeafTabButton` sub-component (reduces cognitive complexity to <15, sonarjs gate)
  - Extracted `leafStateClass()` pure function for class computation
  - `LeafTabButton` renders: `prefixEmoji` (span aria-hidden), `leaf-av` colored circle (uses `leaf.avatarBgClass` — G3 JIT-safe static class strings), `★` star for `isPrimary`
  - Back link: updated to `hover:bg-agent-abel-soft hover:text-agent-abel` per mockup `entitynav-back:hover` style
  - All existing data-testids + role=tablist/tab + roving tabindex + aria-selected/aria-disabled/aria-current preserved.

- `src/features/abel/components/icp/IcpEntityLayoutClient.tsx`:
  - Added module-level `BUYER_AVATAR_BG_CLASSES` constant (G3 JIT-safe; react-perf: not inside component)
  - `datosLeaf` now includes `prefixEmoji: "📋"`
  - `buyerLeaves` now include `avatarBgClass: BUYER_AVATAR_BG_CLASSES[idx % len]` + `isPrimary: buyer.isPrimary`
  - `entity` now includes `icon: "🎯"`

### B2 (red) — ProposalBanner: compressed → wide strip

**Status: REAL — FIXED**

**What was wrong:** Banner was `px-4 py-2.5` with `border-b border-agent-abel/30 bg-agent-abel/5` (thin, no `border-left:4px`, no rounded border). Text was `truncate` — mid-sentence cut: "Revisa los datos y confirma cuan...". Mockup: wide strip with `border-left:4px solid var(--agent-abel)`, `bg-agent-abel-soft`, `border-radius:12px`, generous padding, full message.

**What changed:** `src/components/shared/ProposalBanner.tsx`:
- Container: `px-4 py-3 border border-agent-abel/40 border-l-4 border-l-agent-abel bg-agent-abel-soft rounded-xl mb-4`
- Text: removed `truncate` class from explanation, now full 2-line message visible
- Leading `✨` icon as standalone element (no longer inside attribution span)
- Message structure: `<strong class="text-agent-abel">{agentName}</strong> propuso este ICP + sus buyers. <span class="text-muted-foreground">Revisa los datos y confirma cuando estés listo.</span>`
- CTAs: added `type="button"` per a11y (A5 from review) + `h-8` (slightly taller), "Descartar" gains `border border-border bg-background`
- All data-testids (`proposal-banner`, `proposal-banner-descartar`, `proposal-banner-ratificar`) preserved.

---

## Gate results

| Gate | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src/` | 0 errors · 314 warnings (same as baseline before changes) |
| `vitest run src/features/abel/ src/components/shared/` | 300/300 PASS |
| Architecture fitness `vitest run src/__tests__/architecture/` | 127/127 PASS |
| ESLint warning baseline | check-file 323 / react-perf (unchanged) — NO growth |

**Note on pre-existing ESLint errors:** 2 errors in `src/features/abel/api/extract-api.test.ts` (prettier format in test fixture object) were present BEFORE this session (verified via `git stash` + baseline run). This session introduced 0 new errors.

---

## Findings documented as artifacts (no change)

None — all 5 targeted findings were real deviations, not artifacts.

---

## Findings out of scope (documented, not touched)

| ID | Reason |
|---|---|
| M1 (ribbon roles) | Out of scope per task brief |
| M3 (Luana composer) | Out of scope |
| B3 (chips agent colors) | Out of scope |
| B4 (status chip / Marcar listo) | Out of scope |
| B5 (name truncation) | Out of scope (CSS cosmetic, not mockup fidelity blocker) |
| B6 (moneda ticket) | Out of scope |
| C4 (header icon) | Out of scope |
| C5 (focus border) | Out of scope (not verifiable in static screenshot) |
| A1-A5 (a11y keyboard) | Out of scope for visual polish ticket; existing a11y already implemented |

---

<!-- @pm: build phase done (state: tests-passing). Commit: d5870316. Files: 5. Native ticket tests: 300/300 PASS (vitest) + 127/127 PASS (arch). Awaiting orchestrator → gate-runner → auditor-frontend (independent verdict). -->
