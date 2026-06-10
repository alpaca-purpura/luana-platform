# W0.5 · AS-IS Process Model — consolidated operator map

> **Harness Refactor · W0.5 (Process Model, operator POV) · Step 1 output (AS-IS).** Constitution: `docs/process/harness-refactor-charter-2026-06-08.md`. This is the **single entry** an operator walks before the TO-BE ratification (Step 2). It synthesizes the 8 per-WT AS-IS reconstructions; it does **not** duplicate their detail (pointer-first). Author: W0.5 orchestrator (Opus) · 2026-06-08.
>
> **What W0.5 is:** the development process IS the requirements layer; rules/skills/agents/hooks/cockpit are its implementation (charter §1.5). We map how the process REALLY works today (this doc), ratify the TO-BE WITH Chris (Step 2 → `TO-BE-walk-agenda.md`), then conform the artifacts (W1+). **No artifact is touched in W0.5.**

---

## 0 · The 8 source maps (read on demand for file:line detail)

| # | Map | Covers |
|---|---|---|
| — | `as-is/SPINE-as-is.md` | the shared 10-state backbone WT1-3+5 ride on (states · gates G0-G18 · artifacts) |
| WT1+2 | `as-is/WT1-WT2-caps-as-is.md` | UI-cap vs service-cap deltas (po-ux/functional+demo vs po/technical) |
| WT3 | `as-is/WT3-agentic-as-is.md` | agentic deltas (ux-agentico, eval goldens, prompt slots, engine boundary) |
| WT4 | `as-is/WT4-bugfix-as-is.md` | bugfix lite lifecycle + hotfix-repro gate (ADR-011) |
| WT5 | `as-is/WT5-technical-cap-as-is.md` | technical/infra cap — **THE VOID** (charter-flagged gap) |
| WT6 | `as-is/WT6-promotion-as-is.md` | brand→engine lift (promotion-protocol) |
| WT7 | `as-is/WT7-harness-improvement-as-is.md` | the dev-OS improving itself (HLP + CIL 4 lanes) |
| — | `as-is/COCKPIT-views-as-is.md` | what the cockpit renders + WT→view map + read-schema contract |

---

## 1 · The shared spine in one picture (the backbone WT1-5 ride on)

```
idea ──> refining ──> refined ──> ready ──> developing ──> developed ──[G]──[R]──> reviewing ──> done ──> archive
 │         │            │           │           │              │          │   │        │           │
Chris   po-ux/po/    pm closes  architect   dev-team       dev-team    Chris pm   auditor      pm merge
+pm     ux-agentico             (03+04+05+06)               (build)     verify reconcile (gherkin+   (07-merge
                                                                        live   docs→     live-verify  +cap ledger
                                                                        signoff reality) ≥1 write)    +git mv archive)
```

- **10 macro states** (`lifecycle.md` SSoT) + `parked`/`dropped` off-ramps. One owner skill per hop, one HARD gate per hop.
- **Sub-phases live as `checkpoint.md::phase`, not new states**: **G** = `AWAIT_CHRIS_VERIFY` (Chris exercises the kit live, signs `chris_verify.signoff`, BEFORE the auditor — proceso v5; skipped if `autonomous_mode:true`). **R** = reconcile (pm aligns 01/03/04/cap to built reality, writes `reconciled:true` — precondition the auditor reads). **C** = fix-loop. **Phase D** = auditor gherkin-matrix.
- **18 spine gates** G0-G18 (`SPINE-as-is.md §4`): Step-0-worktree, prior-art-scan, cap_target, ready-package-complete+CONN+canon, WIP-caps, Phase-D-local coverage, **DoD live-verify (dod_evidence)**, ledger-PISO, **chris_verify.signoff**, **reconciled precondition**, gate-output preflight, gherkin-MISSING-blocks, **LIVE_VERIFY_MISSING auto-FAIL**, mutation, auditor-verdict, merge-REFUSE, archive-on-done, chris-input-presence, cross_check_3/4.
- **The invariant:** a story closes only when (a) built TDD-first, (b) Chris exercised it live (G), (c) docs reconciled (R), (d) auditor verified reconciled spec + gherkin matrix + ≥1 live write, (e) cap ledger + archive updated in the merge commit. Verde/build/GET-200 ≠ done.

**WT1-5 differ from the spine only in their refiner + their verification nature — NOT in states/gates/owners.** This is the spine's CORE virtue: the gates are keyed off `verification_nature` (técnica/funcional/ambas), never off the WT label.

---

## 2 · WT divergence matrix (the 7 work-types at a glance)

| | refiner | builder | sub-auditor | verification | defining artifact | defining gate | cockpit view | maturity |
|---|---|---|---|---|---|---|---|---|
| **WT1 UI cap** | `/po-ux` (PO+UX fused, 2-round/2-sig) | builder-frontend | auditor-frontend | funcional | mockup + demo-script.md | demo gate + anti-burbuja + Design-System-Canon + playwright-visual-scope | `/board`+`/map`+Cap Drawer | mature |
| **WT2 service cap** | `/po` | builder-backend | auditor-backend | técnica | minimal 01-spec | technical_gates (Schemathesis/Hypothesis) | `/board`+`/map` | mature |
| **WT3 agentic** | `/po` → `/ux-agentico` (2nd pass) | builder-agentic (**Opus oblig.**) | auditor-agentic (no behavior self-fix) | funcional + eval | **02-design-agentic.md** + eval goldens | pass^k + engine-boundary lift + prompt-slot integrity | `/board`+Diseño tab+`/arquitectura` | mature |
| **WT4 bugfix** | `/po` or `/po-ux` (lite) | builder-* | auditor-* | per nature | repro_evidence + regression-RED | repro-first (story+ticket) | `/board` **(renders as nothing — no type badge)** | mature doctrine, **broken wiring** |
| **WT5 technical cap** | **none** | builder-backend/agentic | auditor-backend | técnica (gates+runtime evidence) | **none (no infra-cap template)** | verification_nature:técnica (back-half only) | `/map` Infra zone (collapsed) **(phantom `tech` board slot, no producer)** | **UNDER-DEFINED — the gap** |
| **WT6 promotion** | — (off-spine) | /dev-team (lift) | folded into R3 downstream-regression | downstream tests ∀ brand | promotion proposal `.md` | engine-edit-detection (accepted/migrated) + mirror-scan | **NONE (zero surface)** | mature mechanism, no view, weak lift-start gate |
| **WT7 harness improvement** | — (off-spine, self-host) | sonnet edits / Haiku commits | opus diff-verify | verify-first + machinery-check | harness-backlog HB-N + learnings + tech-debt | never-mid-feature + ratifiable-batch + Chris-ratify | `/harness` (CIL 4-lane) | mature; cockpit **mostly built** (charter "needs view" is stale) |

---

## 3 · The 8 cross-cutting structural findings (the real synthesis)

These patterns span the WTs. They — not the per-WT nits — are what W0.5 must decide.

**X1 · The back-half is modern; the front-half is where the gaps cluster.** Across WT3/WT4/WT5/WT6 the same shape repeats: the gates that DELIVER (dev-team build, auditor verify, DoD live-verify, downstream regression) are real and coherent; the gates that PLAN (architect ready-package for non-UI work) cite vaporware or have no rails. WT5 states it bluntly — "back half (developing→done) fully defined and modern; front half (idea→ready) has no rails." The TO-BE work concentrates on **idea→ready for non-UI work-types.**

**X2 · One concept, N restatements, M drift (the high-cohesion violation, everywhere).** WIP-cap (3 places, 2 contradict) · story-closure-gate (3 docs+1 rule, G/R in only 2) · repro gate (4 skills) · promotion state-machine (README + pm-luana verbatim dup) · eval-policy pass^k (5 places, no SSoT) · apply-pipeline (2 docs, diverged) · demo-signoff (3 names, 2 phases). **Each needs ONE SSoT + pointers.** This is the charter's "1 SSoT per concern" smell, confirmed system-wide.

**X3 · Phantom machinery — validators that cite tools that don't exist.** `scripts/run_agent_evals.py`, `run_trajectory_eval.py`, `check_cost_budget.py` (architect agentic validators) · `generate_core_modules.py`, AST-similarity in `scan_promotables.py` (promotion) · `validate_chris_input.py`, `generate_release_notes.py` (spine) · `graceful-degradation` skill (agentic HARD-GATE). The architect **generates ready-packages that prescribe non-existent invocations.** Inverse of "paper rules": **paper machinery.** Decide per item: build it or purge the reference.

**X4 · Schema/key mismatches that silently break HARD gates.** (a) `verification_nature` (dev-team greps top-level) vs `verification.nature` (template emits nested) → WT2 technical auto-skip **silently never fires**. (b) promotion `state:` (auditor greps `^state:`) vs `| Campo | Valor |` table-format proposal → an `accepted` proposal reads as **missing → false FAIL**. (c) `repro_evidence` vs `hotfix_metadata` (same concept, two key names). (d) cockpit read-schema is **behind** the checkpoint schema by the whole G/R/signoff/dod-evidence refinement (0 render). These are silent-killers: green where they should block, or block where they should pass.

**X5 · Two missing work-types, mirror images.** WT4 (bugfix) is a **real cemented type the cockpit never wired** (renders as nothing, no badge). WT5 (technical) is a **ghost type the cockpit anticipates** (`'tech'` slot + emoji) **but no process produces.** WT4 = process-has/cockpit-lacks; WT5 = cockpit-has/process-lacks. Both block clean visibility.

**X6 · Five phase/state vocabularies an operator must hold.** (1) 10 macro states · (2) A-F + G/R letter-phases · (3) `checkpoint.phase` runtime values (`AWAIT_CHRIS_VERIFY`…) · (4) `phase_workflow` (`PO_SPEC`…) · (5) WT7's separate `reported→…→verified` 6-state HLP lifecycle. `/board` and `/harness` render identical-looking kanbans with different semantics. **Pick ONE operator-facing vocabulary per process; map the rest to it.**

**X7 · Two off-spine processes, asymmetric visibility.** WT6 (promotion) and WT7 (harness) do NOT ride the 10-state lifecycle, and `lifecycle.md` mentions promotion 0 times. WT7 has a good cockpit view (`/harness` CIL — charter's "needs view" is **stale**); WT6 has **zero** view (19 proposals invisible). Decide: does the Process Model SSoT own both off-spine processes explicitly, and does WT6 get a view?

**X8 · The smear concentrates in 6 surfaces (the W5 seam targets).** Where luana tech/brand is baked into would-be-CORE process: ① **DoD rule #37 normative body** (dev-app.vitalialat.com, dr.demo creds, ports — *a brand URL inside a core-aspiring gate; the worst smear*) · ② **`04-validators` template** (ruff/pytest/tsc/eslint + base.ts + mutmut/Stryker) · ③ **`07-merge`/CHECKPOINTS bodies** (toolchain literals) · ④ **`debugging.md`** (entirely luana stack: container names, brand ports, alembic) · ⑤ **cockpit `lib/`** (67 brand/tech literals across 16 files — agent-meta rosters, map-zones value-stream, MapView VITALIA_ROLES) · ⑥ **promotion README + paradigm decision-tree** (engine_prefix, brand enum, concrete infra concerns inline). These map 1:1 to the charter seam slots (`toolchain`, `brands[]`, `locale`, `engine_prefix`, `live_verify_infra[]`, `design_system_ref`, `domain_modules[]`).

---

## 4 · Master findings ledger (ranked; detail+file:line in the per-WT maps)

Severity per HLP: 🔴 silent-killer · 🟡 contradiction/blocking-clarity · 🔵 gap-needs-decision · ⚪ stale/cosmetic. "→ Dn" points to the TO-BE decision that resolves it (`TO-BE-walk-agenda.md`).

| ID | Sev | Type | Finding (short) | Source | → |
|---|---|---|---|---|---|
| MF-01 | 🔴 | schema-mismatch | `verification_nature` top-level grep vs nested `verification.nature` → WT2 auto-skip silently broken | WT1/2 #2 | D-X4 |
| MF-02 | 🔴 | schema-mismatch | promotion `^state:` grep vs `\| Campo \| Valor \|` table → accepted proposal reads as FAIL | WT6 C1 | D-X4 |
| MF-03 | 🔴 | schema-drift | cockpit read-schema behind checkpoint: G/R/`chris_verify`/`reconciled`/`dod_evidence` = 0 render | COCKPIT G1/G3 | D6, D-X6 |
| MF-04 | 🔴 | doctrine | technical caps build-first/document-later (~20 stub caps backfilled) — inverse of spec-first | WT5 F7 | D5 |
| MF-05 | 🟡 | gap (charter) | **WT5 has no technical-story type, no refiner, no infra-cap template** (the named deliverable) | WT5 F1/F2/F6 | **D5** |
| MF-06 | 🟡 | contradiction | WIP-cap stated 3 ways: per-worktree (lifecycle.md:50, stale) vs per-`code:{module}` (enforced) | SPINE F1 | D-X2 |
| MF-07 | 🟡 | scatter | story-closure-gate in 3 docs+1 rule; G/R folded into only the slim rule, not the 2 long docs | SPINE F2 | D-X2 |
| MF-08 | 🟡 | stale | demo signoff moved F→G but 3 names coexist (`demo_signoff`/`chris_verify.signoff`/`dev_app_verified`) | SPINE F3, WT1/2 #5 | D-X2 |
| MF-09 | 🟡 | contradiction | `02-design-ui.md` forbidden by po-ux yet cited live in 8 surfaces (architect, visual-fidelity, template) | WT1/2 #1 | D-X2 |
| MF-10 | 🟡 | contradiction | architect has **no `bugfix` story_type** + no lite mode — contradicts ADR-011 cementation | WT4 F3 | D4 |
| MF-11 | 🔴 | phantom | architect agentic validators cite `run_agent_evals.py`/`run_trajectory_eval.py`/`check_cost_budget.py` (don't exist) | WT3 #1 | D3, D-X3 |
| MF-12 | 🔵 | phantom | `graceful-degradation` cited as HARD-GATE skill, no `.claude/skills/` dir | WT3 #2 | D-X3 |
| MF-13 | 🔵 | phantom | `generate_core_modules.py` + scan AST-similarity promised, not implemented | WT6 G-b | D-X3 |
| MF-14 | 🔵 | phantom | `validate_chris_input.py` + `generate_release_notes.py` cited, don't exist | SPINE F6 | D-X3 |
| MF-15 | 🟡 | gap (cockpit) | `bugfix` absent from cockpit type model → renders no badge (4th type never wired) | WT4 F4 / COCKPIT | D4, D6 |
| MF-16 | 🟡 | gap (cockpit) | WT6 promotion has **zero cockpit surface**; 19 proposals invisible | WT6 G-a / COCKPIT | D6 |
| MF-17 | 🔵 | gap | WT5 cockpit `'tech'` board slot exists with no producer (mirror of MF-15) | WT5 F10 | D5, D6 |
| MF-18 | 🔵 | gap | promotion-protocol forbids net-new core → net-new infra (durable-flows L2, LLM gateway) homeless | WT5 F4, WT6 | D5 |
| MF-19 | 🔵 | gap | proposal-as-lifecycle improvisation: infra work invisible to lifecycle (no /board, no WIP-cap, no archive) | WT5 F5/F8 | D5 |
| MF-20 | 🔵 | scatter | repro gate restated in 4 skills (po/po-ux/dev-team/architect), hotfix-repro vs bugfix-type unmerged | WT4 F1 | D4, D-X2 |
| MF-21 | 🔵 | scatter | eval-policy pass^k (`3/0.66/0.5`) in 5 places, no `agentic-eval-policy.md` SSoT | WT3 #3 | D3, D-X2 |
| MF-22 | 🔵 | gap | architect `test_construction_plan` 100% Playwright-shaped, no agentic-trajectory→golden mapping | WT3 #4 | D3 |
| MF-23 | 🔵 | weak-gate | promotion lift-gate enforced only at PR-time; builder can write `core/` before proposal accepted | WT6 G-c | D7 |
| MF-24 | 🔵 | weak-gate | promotion machine has no `reviewing`/auditor handoff; review collapsed into R3 | WT6 G-d | D7 |
| MF-25 | ⚪ | paper-rule | auditor "Cat 11 repro check" claimed, doesn't exist; autonomous-mode ⏳ layers | WT4 F7, WT3 #7 | D4, D-X3 |
| MF-26 | ⚪ | smear | DoD #37 normative body hardcodes dev-app.vitalialat.com/creds/ports (worst smear) | SPINE §6, X8① | D-X5/W5 |
| MF-27 | ⚪ | smear | cockpit CORE-tier files carry 67 brand/tech literals (rosters/value-stream/roles) | COCKPIT G5 | D-X5/W5 |
| MF-28 | ⚪ | stale | brand-docs-schema still blesses `outcomes/` (killed by 4-ejes consolidation) | SPINE F7 | D-X2 |
| MF-29 | ⚪ | gap-partial | `/harness` L2/L4 count/link-only (not boardified); charter "needs view" stale | WT7 #1/#2 | D7 |
| MF-30 | ⚪ | stale | `/po` lacks inline prior-art-scan block that `/po-ux` has (LSP gap) | WT1/2 #3 | D-X2 |

*(The per-WT maps carry ~50 findings total with full file:line; this ledger ranks the 30 highest-signal. The "⚪ stale" tail — naming residue `/mejora-semanal`, dead `04-tickets.yaml` path, README "7 vistas", checkpoint-template missing `type:` field — are batch-fixable in the surface workstreams.)*

---

## 5 · Core / Project / Brand split — what's extractable vs what's the smear

**Extractable as CORE (the reusable IP — tech/domain-agnostic):**
- The 10-state machine + off-ramps; the role contract (refiner→packager→builder→reviewer→merger); the sub-phase concepts (G chris-verify, R reconcile, fix-loop, gherkin-matrix).
- The gate **concepts**: prior-art-scan, ready-package-complete, WIP-cap, live-verify-before-done, gherkin-MISSING-blocks, reconciled-precondition, merge-REFUSE, archive-on-done, chris-input-from-idea.
- The verification-by-nature doctrine (técnica/funcional/ambas + demo gate + anti-burbuja + business-rules matrix + regression_guard).
- The UI-vs-service-vs-agentic **branch** itself; the agentic design-pass + eval-gate + engine-boundary; the bugfix lite-lane; **(to add) the technical-cap lane**.
- The promotion mechanism (proposal state-machine + downstream-regression + semver + opt-in); the HLP+CIL self-maintenance loop (this is core IP — any adopting product inherits it).
- The cockpit **read-schema** (`types.ts` shape + the file globs + CHRIS_ALLOWED_TRANSITIONS).
- The artifact **skeleton** (01-spec…07-merge + 03/04/05/06 as SLOTS).

**The smear to push out (PROJECT/BRAND, behind the W5 seam — see X8):** toolchain literals (`toolchain.*`), brand enum (`brands[]`), Spanish-neutro gate (`locale`), `core/luana-core-*` (`engine_prefix`), dev-app URLs/creds/ports (`live_verify_infra[]`), design-system-canon + `@luana/ui-kit` (`design_system_ref`), offer/copilot/analytics + agent rosters + value-stream (`domain_modules[]` + a rosters slot). The cockpit render, the domain skills (offer/copilot/sales-agent/metrics/brand), the brand overlays, the agent roster — all PROJECT/BRAND.

---

## 6 · WT → cockpit-view matrix (visibility today)

| WT | View(s) | Wired? | Gap |
|---|---|---|---|
| WT1 UI | /board · /map · Cap Drawer N0-N4 | ✅ best-supported | charter's `/functionality` view doesn't exist (content = Cap Drawer) |
| WT2 service | /board · /map (infra box) | ✅ | rides WT1 surface; orphan panel if no `agent_owner` |
| WT3 agentic | /board · Diseño tab · /arquitectura | ✅ | no agentic-specific Cap level (goldens/slots/trace not surfaced) |
| WT4 bugfix | /board | ❌ **renders as nothing** | type never wired (MF-15) |
| WT5 technical | /map Infra (collapsed) | ⚠️ half | board `tech` slot has no producer; map collapsed-by-default (MF-17) |
| WT6 promotion | — | ❌ **zero surface** | no proposal/lift view (MF-16) |
| WT7 harness | /harness CIL 4-lane | ✅ mostly | L2/L4 link-only, not boardified (MF-29) |
| (all) | proceso-v5 G/R/signoff/dod | ❌ **0 render** | read-schema behind checkpoint (MF-03) |

---

## 7 · The WT5 void (the charter's named deliverable) — one screen

28 `user_visible:false` infra caps ARE registered + the map renders them. But there is **no process to build one.** Technical caps reach `done` four improvised ways: **(A)** byproduct of a feature story (back-tagged) · **(B)** ad-hoc core work via a **promotion-proposal-acting-as-lifecycle** (durable-flows, "flujo excepcional Chris") · **(C)** infra surfaced mid-build, parked as a proposal (LLM gateway) · **(D)** a **ghost `type: technical-story`** used by 2 archived stories but absent from every live process surface. The **back-half (developing→done) is fully defined** (`verification_nature: técnica` = gates + runtime evidence, no demo); the **front-half (idea→ready) has no rails** (no type, no refiner, no template, two done-SSoTs). Closing WT5 = the single biggest W0.5 decision → `D5`.

---

## 8 · How to read this into the walk

The per-WT detail is in `as-is/`. The decisions are in **`TO-BE-walk-agenda.md`** — a decision ledger: **cross-cutting** (D-X2 vocab/SSoT unification · D-X3 phantom-machinery build-or-purge · D-X4 schema-mismatch fixes · D-X5 smear→seam) and **per-WT** (D1-D7). Recommended walk order: resolve the cross-cutting de-tanglers first (they simplify every per-WT walk), then WT1→WT7. **WT5 (D5) and the cockpit unification (D6) are the charter's explicit close-this deliverables.**

*End AS-IS-MAP.md.*
