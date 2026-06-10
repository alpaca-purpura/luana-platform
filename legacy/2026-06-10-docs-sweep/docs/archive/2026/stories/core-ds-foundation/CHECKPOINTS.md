# Story DoD CHECKPOINTS — platform/core-ds-foundation

> Brand: platform · Auditor: /auditor (orchestrator-verified, autonomous) · Date: 2026-06-08
> Verdict: **APPROVED** — ready for merge by /pm-luana

9 FE tickets (all builder-frontend/Sonnet · no agentic · no BE). Surfaces: `core/@luana/{design-tokens,ui-kit,eslint-config,hooks}` + vitalia pilot. Authorized platform story (/pm-luana owns `core/@luana/*` TS design packages ≠ `core/luana-core-*` Python engine).

## Gates (independent re-run, host native — 2026-06-08)
| Package / surface | Gate | Result |
|---|---|---|
| `@luana/design-tokens` | `tsc --noEmit` | ✅ 0 errors |
| `@luana/eslint-config` | RuleTester (`npm test`) | ✅ pass/0 fail (no-arbitrary SC-1/SC-2/SC-4) |
| `@luana/hooks` | vitest | ✅ 36/36 (incl. useAutosave coalesce + back-compat) |
| `@luana/ui-kit` | vitest + tsc src | ✅ 133/133 · src tsc-clean |
| vitalia arch ratchets | vitest (6 tests) | ✅ tokens-lock + ratchet + single-token-source + no-native-select + no-hardcoded-colors + **no-div-layout 300/301** |
| vitalia pilot | eslint(showcase) + tsc(showcase) | ✅ 0 errors · tsc-clean |
| **/showcase live-verify** | Playwright anti-burbuja smoke (:3002) | ✅ **3 passed** — real @luana/ui-kit renders, 0 console-error, 0 pageerror, no Next overlay |

## C1 — Code
- [x] TDD RED→GREEN per package (Vitest hook→component; arch-test RED before gate)
- [x] No coverage regression (full ui-kit suite 133/133; hooks 36/36)
- [x] Lint + format clean (eslint showcase 0; @luana/eslint-config RuleTester pass)
- [x] Type-check clean (design-tokens/ui-kit src + showcase tsc-clean; pre-existing jest-dom-matcher test noise = package convention, not new)

## C2 — Spec compliance
- [x] Canon contracts built (tokens scale · 13 layout-primitives · EntityWorkspaceLayout/SubNavBar/InfoCard/Picker · autosave/Group · archetypes · eslint lock + ratchets)
- [x] /showcase renders REAL components (R-FID durable) — live-verified, not GET 200
- [x] Tokens-lock SC-1..SC-4 (no-arbitrary error + sizing allowed + ratchet + named escape) GREEN via RuleTester + arch-tests
- [x] D1-D11 ratified decisions honored (EntityWorkspaceLayout 1-panel · full-bleed N3 · EntityPicker windowed · Select canónico · autosave 1-pill · EntityInfoCard B)

## C3 — Architecture
- [x] Arch fitness 0 violations (no-div-layout/no-native-select/no-hardcoded-hex ratchets GREEN)
- [x] NO-NEW-LAYER: lifts via import-and-generalize (EntityWorkspaceLayout/SubNavBar←nicolify, EntityInfoCard←vitalia StaffCard, autosave/Group lifts); useAutosave EXTENDED (no parallel hook); no-hardcoded-hex test EXTENDED (no fork). Cross-brand mirror (EntitySubNavBar/EmptyState) RESOLVED to @luana/ui-kit (sanctioned).
- [x] **★ ENGINE DECOUPLE verified zero-regression:** @luana/ui-kit was unconsumable in vitalia (4 atoms → `@/features/copilot/*`). Rewrote use-copilot-offset to optional `--copilot-offset` CSS var (default 0). **Confirmed: 0 brand files import the @luana/ui-kit barrel** (only the showcase does) → no consumer regression. Barrel no longer exports use-copilot-offset (subpath-only).
- [x] No cross-brand pollution in FEATURE code (only `@luana/*` + vitalia touched; no `core/luana-core-*`, no other-brand src)
- [x] 05-guidelines "Files in scope" respected

## C4 — Cross-cutting
- [x] Spanish neutro defaults (EmptyState/ErrorState/Pagination/showcase strings)
- [x] No PII / no monetary / no migration / no auth / no tenant — FE component library
- [x] Tokens: shared NAMES, per-brand VALUES (RN-5, no palette merge); R-1SRC single `--radius`, `--vitalia-*` aliased
- [x] No `--agent-*` literal residue (3 CSS-source fixes: arch-test comment + 2 fixture pages)
- [x] eslint lock opt-in per brand (nicolify/comunify UNCHANGED)

## C5 — Trace
- [x] checkpoint state → done set by /pm-luana at merge
- [x] Semver: @luana/{design-tokens,ui-kit,hooks,eslint-config} MINOR bump + changelog (at merge)
- [x] No brand capability YAML (infra/platform; cap_target infra/design-system-tokens-lock per 01-spec)
- [x] Story archive at merge (R2)

## Findings
1. **[FIXED · Carril R] no-div-layout ratchet RED** — T-9 showcase added 17 raw `flex-col gap-`/`grid-cols-` layout divs (318/301), violating the canon's "eat your own dog food." Fixed by composing the showcase from `@luana/ui-kit` primitives (`PageContentStack`/`PageSection` + `space-y-`/`flex-wrap`) → 300/301 GREEN, showcase contributes 0 flagged divs. Commit `79925085`. Live-verify re-confirmed GREEN after the refactor.
2. **[OBSERVATION · harness]** `nicolify/frontend/.fallowrc.jsonc` + `comunify/frontend/.fallowrc.jsonc` (HB-61 code-health config) were hook-staged into the story's commit range (cross-brand template replication). Content is legit infra (vitalia has one too), NOT feature pollution — but a pre-commit hook cross-brand-staging during a scoped platform commit is a process smell → harness-backlog.

## Upstream deficiency (auditor reflex)
The live-verify infra fought back hard (3 harness findings captured to `docs/process/harness-backlog.md`): (a) `builder-frontend` overflows on big packages by reading `pnpm-lock.yaml` (20k lines); (b) Docker dev frontend uses anonymous-volume `node_modules` with a separate pnpm store → host↔container version skew on a freshly-added dep breaks live-verify repeatedly; (c) pre-commit hook cross-brand-stages `.fallowrc.jsonc`. None are defects of the DS code; all are harness/infra gaps that cost significant wall-clock.

## Findings summary
- C1: 4/4 ✅ · C2: 4/4 ✅ · C3: 6/6 ✅ · C4: 5/5 ✅ · C5: 4/4 ✅
- 1 finding FIXED (Carril R) · 1 observation (harness) · 0 blocking

## Verdict
**APPROVED** — story ready for merge by /pm-luana.

## Notes for /pm-luana merge
- Semver MINOR bump: `@luana/design-tokens`, `@luana/ui-kit`, `@luana/hooks`, `@luana/eslint-config` (net-new) + CHANGELOG entries.
- The eslint lock turns ON per brand in Fase 3 (`{brand}-ds-adoption`), NOT at this merge — opt-in.
- Promotion/consumability note: @luana/ui-kit is now genuinely consumable cross-brand (copilot decouple). Fase 3 adoption stories can import the barrel.
- 3 harness-backlog items captured (builder lockfile overflow · docker store skew · hook cross-brand staging).
