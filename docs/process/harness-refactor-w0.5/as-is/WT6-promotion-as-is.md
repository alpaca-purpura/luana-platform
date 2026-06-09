# WT6 — Promotion (brand→engine lift) · AS-IS reconstruction

> **W0.5 / Process Model · operator-POV · AS-IS only.** Reconstructs the brand→engine promotion gate as it exists today. No edits to the harness; findings flag scatter/contradiction/gaps for TO-BE ratification. Cite-everything. SSoT under audit: `docs/promotion-protocol/`, `.claude/skills/pm-luana/SKILL.md` Modo Core, `.claude/rules/anti-duplication*.md`, `docs/rules-detail/auditor-downstream-regression.md`.

---

## 1. Definition + trigger conditions

**Definition (one line):** WT6 is the gate by which a pattern built inside a brand (`{brand}/backend/src/modules/{brand}/...`) becomes shared engine (`core/luana-core-*`), so the other 9 brand verticals can opt-in instead of mirroring it — without breaking any existing consumer.

**Cardinal doctrine** (`docs/promotion-protocol/README.md:11-18`): brand-first/core-second · opt-in per brand · manual ratify by Chris · downstream regression mandatory · disciplined semver.

**Trigger conditions** (3 entries, all converge on `/pm-luana` opening a proposal):

| # | Trigger | Where detected | Citation |
|---|---|---|---|
| T1 | **Cross-brand mirror detected** — two brands replicate the same pattern | Auditor Cat 12 / `cross_brand_mirror_scan`; builder Step 0 grep; PM "Existing systems audit" | `.claude/rules/anti-duplication.md:43-58` (workflow pre-write) + `:65` (enforcement); `docs/rules-detail/auditor-downstream-regression.md:55-72,109-132` |
| T2 | **Engine abstraction needed** — pattern is cross-agent/cross-consumer (inventory in anti-dup table) | `/pm-luana` Modo Core; anti-dup inventory `.claude/rules/anti-duplication.md:17-40` | `.claude/skills/pm-luana/SKILL.md:75-87` |
| T3 | **Prior-art scan flags lift candidate** — refining phase finds a brand with a similar feature | `/pm-{brand}`, `/po-ux`, `/po`, `/ux-agentico`, `/architect` prior-art scan → escalate `/pm-luana` | `.claude/rules/anti-duplication-refining.md` stub; `docs/rules-detail/anti-duplication-refining.md:13,65-67,119` |

Auto-detect aid (NOT a decision): `make scan-promotables` → `scripts/scan_promotables.py` (real, 7.4 KB, executable — confirmed) groups `{brand}/docs/learnings/*.md` with `promotable: candidate|yes` frontmatter by declared `target_core_package`; ≥2 brands same target → cluster. Output `docs/promotion-protocol/scan-{date}.yaml` (`docs/promotion-protocol/README.md:105-120`). **Reality:** the 3 shipped scan YAMLs (`scan-2026-05-{15,18,19}.yaml`) found `clusters_found: 0` every time — the AST signature-similarity heuristic described in README:111-116 is NOT implemented; the script only does frontmatter clustering (`scripts/scan_promotables.py:6-12` docstring "Heurísticas (basic, ampliable)").

---

## 2. Lifecycle states (the promotion proposal state machine)

Canonical 5-state machine (`docs/promotion-protocol/README.md:20-34`, mirrored in `.claude/skills/pm-luana/SKILL.md:179-185`):

```
proposed → under_review → accepted → migrated
                       ↓
                    rejected
```

| State | Meaning | Entry trigger | Owner |
|---|---|---|---|
| `proposed` | Brand flagged `promotable` / auto-detect found it; `/pm-luana` opens proposal | brand learning + `/pm-luana` opens | `/pm-luana` |
| `under_review` | `/pm-luana` analyzes core fit (transversality, semver, leakage, regression risk) | `/pm-luana` decides review | `/pm-luana` + Chris |
| `accepted` | Chris ratifies APPROVED; lift to `core/luana-core-X` scheduled | Chris APPROVED | `/dev-team` executes lift |
| `rejected` | Chris ratifies reject; brand retains its pattern | Chris REJECTED + reason | `/pm-luana` archive |
| `migrated` | Lift complete + downstream arch test + semver bump | `/dev-team` closes lift | `/pm-luana` closes proposal |

**8-step workflow** (`docs/promotion-protocol/README.md:35-103`, dup in `SKILL.md:187-223`): (1) brand writes learning w/ `promotable:` frontmatter → (2) `/pm-luana` scan → (3) opens proposal `proposed` → (4) analyzes → `under_review` → (5) Chris ratifies → `accepted`/`rejected` → (6) `/dev-team` lift (git mv brand→core, generalize interface, R3 downstream tests, bump `pyproject.toml::version`, CHANGELOG, `docs/core-modules/{package}.md`) → (7) `/pm-luana` closes → `migrated` (records `migrated_date/migrated_pr/lift_summary`) → (8) brands opt-in via `{brand}/config/brand.yaml` (origin brand auto-on, others explicit opt-in default).

**Relation to the product 10-state lifecycle:** WT6 is a **parallel, orthogonal** state machine. The 5 promotion states do NOT map onto the 10 macro states (`idea…done`, `CLAUDE.md` SDD Level 3). Step 6 ("/dev-team executes lift") is the only point where the two touch: a lift is built by `/dev-team` but the proposal has no `developing/developed/reviewing` substates — the auditor's role is folded into the R3 downstream-regression check, not a separate `reviewing` pass. The 4-axis lifecycle SSoT (`docs/process/lifecycle.md`) does **not mention promotion at all** (grep: 0 hits for promotion/lift/proposal) — confirming WT6 lives entirely outside the consolidated product-lifecycle doc. This is the charter's "scattered across ~8 docs, never consolidated" smear (charter:49).

---

## 3. Actors / skills

| Actor | Role in WT6 | Citation |
|---|---|---|
| `/pm-luana` (Modo Core Engineering) | **Owner.** Opens proposal, runs scan, moves `proposed→under_review`, recommends APPROVED/REJECTED, closes `migrated`. Owns `docs/promotion-protocol/proposals/`, `docs/core-modules/`, `core/luana-core-*/pyproject.toml::version` (semver) | `.claude/skills/pm-luana/SKILL.md:156-268`; surfaces table `:160-173` |
| Chris | **Manual ratify gate.** APPROVED/REJECTED is always human (rule 3, README:15). `/pm-luana` NUNCA decides APPROVED alone (`SKILL.md:321`) | `README.md:69-72` |
| `/dev-team` | **Executes the lift** when `accepted`: git mv, generalize, R3 tests, semver bump, CHANGELOG, core-modules doc | `README.md:75-86`; `SKILL.md:209-215` |
| `/architect` | **Opus pre-builder** when a story touches `core/` or a cross-brand subsystem (designs the generalized interface/EP before build) | `.claude/rules/anti-duplication.md:65` "Architect Opus pre-builder si toca `core/` o subsystem cross-brand" |
| `/auditor` (+ sub-auditors be/fe/agentic) | **Enforces the gate at PR time:** engine-edit detection (proposal accepted/migrated check), cross-brand mirror scan, downstream test run ∀ brand | `docs/rules-detail/auditor-downstream-regression.md:50-107`; `.claude/agents/auditor-{backend,frontend,agentic}.md` (enforcement layers `:200-207`) |
| `/pm-{brand}`, `/po-ux`, `/po`, `/ux-agentico` | **Upstream detectors** — prior-art scan in refining → escalate lift candidate to `/pm-luana` | `docs/rules-detail/anti-duplication-refining.md:55-57,65-67` |

---

## 4. Gates (file:line each)

| Gate | What it enforces | Hardness | Citation |
|---|---|---|---|
| **G1 · Anti-duplication pre-write** | Before creating a file under a brand subsystem, grep core+all brands; match in core → EXTEND via import; match in another brand → escalate `/pm-luana` (lift candidate) | builder Step 0 (REVERT if skipped) | `.claude/rules/anti-duplication.md:43-58,65` |
| **G2 · Engine-edit detection (HARD)** | Auditor: any PR touching `core/luana-core-*/src/` MUST have a promotion proposal `state: accepted|migrated`. **No proposal → auditor FAIL, PR blocked.** | **HARD auto-FAIL** | `docs/rules-detail/auditor-downstream-regression.md:50-54,134-147,192`; algorithm `:140-143` (`grep -E '^state:\s*(accepted\|migrated)'`) |
| **G3 · Cross-brand mirror scan (HARD)** | Auditor: PR under `{brand}/.../modules/{brand}/` is scanned ∀ other brand; conceptual diff >50% of same basename → MIRROR → **automatic FAIL**, escalate `/pm-luana` proposal | **HARD auto-FAIL** | `docs/rules-detail/auditor-downstream-regression.md:55-72,109-132` (threshold `:132`) |
| **G4 · Downstream test run ∀ consumer** | Auditor: engine edit → run engine tests + ALL `${BRANDS}` consumer tests (per SSoT targets table A-I); FAIL → CHANGES_REQUESTED | **HARD** | `docs/rules-detail/auditor-downstream-regression.md:74-107`; SSoT table `docs/rules-detail/auditor-downstream-targets.md` |
| **G5 · Arch-fitness on engine + each consumer** | R3: lift step runs `tests/architecture/` on engine package AND each brand consumer | mandatory (R3) | `README.md:79-81`; `.claude/rules/architectural-fitness.md` (engine + brand levels) |
| **G6 · Semver bump (ratified)** | `/pm-luana` ratifies per-package bump: patch (bug, no brand action) / minor (opt-in feature) / major (breaking → ADR + migration notes, brands must migrate before upgrade) | ratify gate | `SKILL.md:252-259`; `README.md:17` |
| **G7 · Anti-default-flip audit** | If lift flips a feature-flag side-effect: grep old-path tests ∀ consumer, migrate mocks, run suite both values, document commit | mandatory when flag | `SKILL.md:261-267`; `.claude/rules/anti-default-flip-audit.md` |
| **G8 · Pre-commit freshness** | New `.py` under `core/luana-core-*/src/` → hook blocks unless added to downstream-targets reference doc or `# downstream-regression-na:` magic comment | pre-commit block | `docs/rules-detail/auditor-downstream-regression.md:165-184` |
| **G9 · Major-bump ADR** | Breaking change / new EP-N → ADR in `docs/architecture/luana-platform/` + migration notes | mandatory | `README.md:126` (anti-pattern); `SKILL.md:248` |

**Manual-ratify gate (not mechanical):** Chris APPROVED/REJECTED at `under_review→accepted` is the human seam — no hook enforces it (README:15, SKILL.md:321).

---

## 5. Artifacts

| Artifact | Schema / location | Citation |
|---|---|---|
| **Proposal `.md`** | `docs/promotion-protocol/proposals/{date}-{slug}.md`; YAML frontmatter: `proposal_id, state, opened_date, opened_by, ratified_by, origin_learnings[], origin_brands[], target_package, target_module, target_ep, semver_bump, breaking_change, brands_affected_consumers[], brands_at_risk_regression[], lift_estimated_effort, lift_owner, arch_test_downstream_required, migration_notes_required` + body §1-7 | `docs/promotion-protocol/template-proposal.md:5-139` |
| **Scan output** | `docs/promotion-protocol/scan-{date}.yaml` (auto-gen, `promotable_entries[]` + `clusters_found`) | `scan_promotables.py`; `scan-2026-05-19.yaml:1-25` |
| **Engine package change** | `core/luana-core-X/src/luana_core_X/...` (the lifted code) + `pyproject.toml::version` + `CHANGELOG.md` | `README.md:79-86` |
| **Extension SDK registration** | `core/luana-core-extension-sdk/src/luana_core_extension_sdk/extension_points.py::ExtensionPointRegistry` (EP-1..EP-18; EP-1..5 EXECUTABLE, EP-6..18 SIGNATURE-ONLY) + `models.py`/`protocols.py` per EP | `core/luana-core-extension-sdk/src/luana_core_extension_sdk/__init__.py:4-18`, `models.py:18-151` |
| **Public contract doc** | `docs/core-modules/{package}.md` (Contract público · Extension points · Brands consumidoras · **Promotion history** · Drill-down) — 26 packages indexed | `docs/core-modules/README.md:42-52` |
| **Downstream test targets** | `docs/rules-detail/auditor-downstream-targets.md` (sections A-I, surface→test-paths SSoT) | `docs/rules-detail/auditor-downstream-regression.md:23-31` |
| **Brand opt-in** | `{brand}/config/brand.yaml` (enable flag, e.g. `brand_studio.enable_visual_extraction: true`) | `README.md:96-102`; example `2026-05-26-lift-brand-visual-extraction-to-core.md:123-129` |

---

## 6. Cockpit view

**There is NO cockpit view for promotion.** Confirmed by enumerating `tools/luana-cockpit/app/`: `board · roadmap · map · harness · drift · learnings · arquitectura · api` — **no `promotion`/`proposals`/`lift` route.** Grep for `promotion-protocol|proposals/|scan-promotables` across the whole cockpit tree = 0 hits. (The earlier `cap-badges.ts`/`CapLevel.tsx` hits are capability "levels" N0-N4, a different "promotion" concept — unrelated to brand→engine lift.)

This matches the charter exactly: WT6 cockpit-view = **"TBD"** (charter:46). The promotion lifecycle is visible only by `ls docs/promotion-protocol/proposals/` + grepping `state:` — the read-only visibility path baked into `/pm-luana` (`SKILL.md:131-138`). **Gap:** the operator cannot see proposals on the board, has no "promotion lane," no cross-brand "what's lifting / what's blocked-on-lift" view, and the 19 live proposals (4 `proposed`, 5 `accepted`, 1 `accepted`-via-table, 9 `migrated`) are invisible to the cockpit.

---

## 7. Core-vs-Project split candidate

| Concept | Tier | Rationale |
|---|---|---|
| "There exists a brand→engine promotion gate with a proposal state machine + downstream revalidation ∀ consumer" | **CORE** | The mechanism is product-agnostic IP: any multi-instance product (one engine, N market instances) needs lift-with-revalidation. The 5 states, manual-ratify, opt-in default, semver discipline, downstream-regression — all generic. |
| `proposed→under_review→accepted→migrated/rejected` state names + `template-proposal.md` schema | **CORE** | Generic, no luana tokens. |
| `core/luana-core-*` path literals, the `luana_core_*` import prefix, the 26 packages, EP-1..EP-18 | **PROJECT** | This is the charter's `engine_prefix` seam slot (charter:88). A new product has its own engine prefix + its own extension-point catalog. |
| `for OTHER_BRAND in vitalia nicolify comunify lupulo` hardcoded loops in the mirror-scan + downstream-target expansion | **PROJECT** | The charter's `brands[]` seam slot (charter:86). Generic mechanism, luana-specific enum. |
| `{brand}/config/brand.yaml` opt-in path, `make scan-promotables`/`scan_promotables.py` | **PROJECT** | Stack/path specific. |
| Downstream-targets table A-I (concrete test paths per surface) | **PROJECT** | luana module map. The *requirement* "run consumer tests on engine edit" is CORE; the table is PROJECT. |
| `/pm-luana`, `/dev-team`, `/auditor`, `/architect` skill bodies | **CORE skeleton + PROJECT instance** | The generic promotion role is CORE; the luana-specific surface tables, package lists, brand loops are PROJECT (the smear to push out). |

**Is the mechanism generic or luana-shaped?** Largely generic but **smeared**: the README/template/SKILL all hardcode `core/luana-core-X`, the brand enum, and the `{brand}/config/brand.yaml` opt-in. **What a NEW product needs (the seam):** declare its `engine_prefix`, its `brands[]` enum, its `domain_modules[]`, and its opt-in config path; the proposal schema, state machine, manual-ratify gate, downstream-regression requirement, and semver discipline all lift unchanged. So WT6 is a clean **CORE-mechanism + PROJECT-config** candidate, gated on the W5 seam.

---

## 8. Scatter / contradiction / gap findings (file:line)

**SCATTER**
- **S1 · State machine + 8-step workflow duplicated verbatim** in two places: `docs/promotion-protocol/README.md:20-103` AND `.claude/skills/pm-luana/SKILL.md:175-223`. Two SSoTs for one concern (violates charter high-cohesion). Drift risk: if one is edited, the other goes stale.
- **S2 · Promotion lives outside the consolidated lifecycle.** `docs/process/lifecycle.md` (the 4-axis SSoT) has 0 promotion references; WT6 is documented only in `docs/promotion-protocol/` + `pm-luana` + 2 anti-dup rules + the downstream-regression rule = ~5 surfaces, never walked as one model (charter:49).

**CONTRADICTION**
- **C1 · Proposal schema drift in the live corpus.** Template + 17 proposals use **YAML frontmatter** (`template-proposal.md:5-37`); but `2026-05-26-lift-brand-visual-extraction-to-core.md:5-14` uses a `| Campo | Valor |` **markdown table** with `State` embedded in a table cell. The auditor's HARD engine-edit gate greps `grep -E '^state:\s*(accepted|migrated)'` (`auditor-downstream-regression.md:143`) — **this regex would NOT match the table-format proposal's state**, so a real `accepted` proposal could read as "no accepted proposal → FAIL." Schema is unenforced.
- **C2 · `deferred` state exists in practice but not in the canonical machine.** `2026-05-26-lift-brand-visual-extraction-to-core.md:185` offers `state: deferred` as a decision option, but the canonical 5-state machine (README:20-34, SKILL.md:179-185, template comment:8) has no `deferred`. Undocumented 6th state.
- **C3 · Protocol overloaded with non-lifts.** Several "proposals" are brand-purge / config tasks, not engine lifts: `2026-05-16-drop-nicolify-social_media-placeholder.md`, `2026-05-19-purge-nicolify-hardcodes-sales-agent.md`, `2026-05-17-auto-regen-backlog-precommit.md`. The promotion protocol is being used as a generic "cross-brand change" tracker, blurring WT6's definition (brand→engine lift specifically).

**GAP**
- **G-a · No cockpit view** (§6) — charter "TBD"; 19 proposals invisible to the operator.
- **G-b · Auto-gen tooling is vaporware.** `docs/core-modules/README.md:52` + `SKILL.md:250` promise `scripts/generate_core_modules.py` (F5 deliverable) — **the file does not exist**; core-modules docs are maintained by hand (`SKILL.md:250` admits "⏳ auto-gen NO implementado"). And `scan_promotables.py` only does frontmatter clustering, not the AST signature-similarity advertised in README:111-116 (every shipped scan = `clusters_found: 0`).
- **G-c · The lift-gate is enforced only at PR-time by the auditor, not at lift-start.** G2 (engine-edit needs accepted proposal) fires when the auditor reviews the diff (`auditor-downstream-regression.md:50-54`); nothing blocks `/dev-team` from editing `core/` *before* a proposal is accepted — the gate is documentation + a downstream auditor catch, not a pre-edit hard stop (pre-commit freshness G8 blocks *new files* but not edits to existing engine files). A builder can write engine code then discover at audit it was never sanctioned.
- **G-d · No `reviewing` substate / auditor handoff in the promotion machine.** The product lifecycle has a hard `developed→reviewing→done` auditor gate (`story-closure-gate.md`); the promotion machine collapses review into "R3 downstream tests" inside step 6 with no explicit auditor APPROVED on the lift itself — the lift's quality gate is weaker/implicit vs a normal story.
