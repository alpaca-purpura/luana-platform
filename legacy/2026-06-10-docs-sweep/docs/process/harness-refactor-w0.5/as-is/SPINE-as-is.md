# SPINE — AS-IS reconstruction (W0.5 · operator POV)

> **Workstream:** Harness Refactor W0.5 (Process Model). **Phase:** AS-IS (reconstruct how the dev process REALLY works today, before any artifact touch). **Author:** Opus W0.5 spine subagent · 2026-06-08. **Constitution:** `docs/process/harness-refactor-charter-2026-06-08.md`.
>
> **Scope:** the SHARED PRODUCT-DEV SPINE — the canonical backbone WT1 (UI cap), WT2 (service cap), WT3 (agentic), WT5 (technical cap) all ride on. The 10-state macro lifecycle + the gates/artifacts/actors common to all. Per-WT agents reconstruct only their DELTAS from this spine; this is the authoritative reference.
>
> **Evidence rule:** every claim cites `file:line`. A path that drifted/is missing is itself a finding (§7). Where two docs contradict, both are quoted.

---

## 1 · One-paragraph definition

The shared spine is the **single linear backbone** every product-dev work-type rides: a story is born `idea`, walks the **10 macro states** (`idea → refining → refined → ready → developing → developed → reviewing → done`, with `parked`/`dropped` as off-ramps), and dies `done`→archive. Each state→state hop is **owned by exactly one entry skill** (`/pm-{brand}` orchestrates; `/po-ux`/`/po`/`/ux-agentico` refine; `/architect` packages; `/dev-team` builds; `/auditor` reviews; `/pm-{brand}` merges) and is **defended by a HARD gate** (Step 0 worktree, prior-art scan, ready-package-complete, WIP caps, the developed-boundary live-verify gate, the G/R Chris-verify+reconcile loop, the auditor gherkin-matrix, the merge REFUSE conditions, archive-on-done). The spine produces a **fixed artifact set per state** (`chris-input.md` + `checkpoint.md` from `idea`; `01-spec`…`07-merge` + `03/04/05/06` ready-package; `demo-script.md`; the cap YAML + modules MD + gherkin-matrix). The **invariant** behind the whole spine: a story closes only when (a) it was built TDD-first, (b) Chris exercised it live (G signoff), (c) docs were reconciled to reality (R), (d) the auditor verified the reconciled spec + ran the gherkin matrix + ≥1 live write, and (e) the capability ledger + archive were updated in the merge commit. Model SSoT: `docs/process/lifecycle.md` (4 ejes: Release→Story→Capability→Scenario + 10 states). The spine is shared because WT1-3+5 differ only in their **refiner** (`/po-ux` vs `/po` vs `/po`+`/ux-agentico`) and their **verification nature** (`técnica`/`funcional`/`ambas`), not in the states/gates/owners.

---

## 2 · Lifecycle states (canonical 10 + sub-phases)

**SSoT:** `docs/process/lifecycle.md:48-65` (§3, the 10-state table) — supersedes the 7-state vocab of `docs/process/pm-redesign-2026-05.md:17-27` (Punto 1, marked `[SUPERSEDED]` at `:15`). The 10-state machine is also drawn at `pm-redesign-2026-05.md:230-249` (Punto 4, the operative one).

> **WIP cap doctrine collision (resolved):** `lifecycle.md:50` says caps are **≤1 per worktree** and "cualquier doc que diga ≤2/≤3 está obsoleto". But the module-scoped v2 cap (`developed ≤ 1 per `code:{module}` bucket`, NOT per worktree) is the actually-enforced one under single-hub ADR-009 — `docs/rules-detail/story-closure-gate.md:278-289`. The `≤1 per worktree` text in lifecycle.md:50 is therefore stale vs the module-scoped reality. **Both quoted in §7-F1.**

| # | State | Meaning | Owner | WIP cap | Entry transition | Exit transition |
|---|---|---|---|---|---|---|
| 1 | `idea` | Spark + optional research | Chris + `/pm-{brand}` | ∞ | Chris creates (cockpit `idea↔refining` only — `lifecycle.md:65`) | `idea → refining` (Chris explicit "refinemos X" — `pm-redesign-2026-05.md:271`) |
| 2 | `refining` | Decompose + draft spec/UX | `/pm` + `/po-ux`/`/po`/`/ux-agentico` | ≤ 3 | `/pm` sets `state: refining` (`pm-vitalia/SKILL.md:166`) | `refining → refined` (Chris ratifies spec+design — `pm-redesign-2026-05.md:272`) |
| 3 | `refined` | Spec + design ratified | `/pm` closes | ≤ 5 | `/pm` sets `refined` on Chris ratify (`pm-vitalia/SKILL.md:167`) | `refined → ready` (`/architect` produces package) |
| 4 | `ready` | Complete ready package (03+04+05+06) | `/architect` | ≤ 5 | `/architect` transitions at end (`architect/SKILL.md:142`) | `ready → developing` (`/dev-team` picks) |
| 5 | `developing` | Autonomous build | `/dev-team` | **≤ 1 per `code:{module}`** | `/dev-team` Step 0 sets `developing` (`dev-team/SKILL.md:61`) | `developing → developed` (all validators GREEN + Phase-D-local + live-verify gate pass) |
| 6 | `developed` | Validators GREEN | `/dev-team` | **≤ 1 per module** | `/dev-team` Step 5 sets `developed` (`dev-team/SKILL.md:574`) | **branches on `autonomous_mode`** → G (default) or `/auditor` (autonomous) |
| 7 | `reviewing` | Auditor QA | `/auditor` | **≤ 1 per module** | `/auditor` transitions at pickup (`auditor/SKILL.md:70`) | `reviewing → done` (`/pm-{brand}` merge on APPROVED) |
| 8 | `done` | APPROVED + merge + cap promoted + archive | `/pm-{brand}` | rolling 90d | `/pm-{brand}` merge (`pm-vitalia/SKILL.md:173`) | terminal → `archive/{year}/stories/` |
| 9 | `parked` | De-prioritized (reversible) | Chris | ∞ | Chris manual (`lifecycle.md:62`) | reversible back to prior state |
| 10 | `dropped` | Won't do (terminal) | Chris | ∞ | Chris manual (`lifecycle.md:63`) | terminal |

### Sub-phases (live as `checkpoint.md::phase`, NOT new states — `process-coherence-v5-2026-06.md:165` "G vive como `phase` de developed")

| Sub-phase | Lives under state | Owner | What it does | SSoT |
|---|---|---|---|---|
| **G — `AWAIT_CHRIS_VERIFY`** | `developed` | Chris + `/dev-team` | default pause-and-offer: Chris exercises the kit (demo-script + dev-app live + ledger) BEFORE the auditor; each correction → `chris_verify.rounds`; satisfied → `chris_verify.signoff`. **Skipped if `autonomous_mode: true`.** Exempt from `developed ≤ 1` WIP cap (anti-deadlock). | `process-coherence-v5-2026-06.md:51-57,93-108`; `.claude/rules/story-closure-gate.md:24-46`; `dev-team/SKILL.md:572-602` |
| **R — reconcile** | between `developed` and `reviewing` | `/pm-{brand}` | reconciles `01-spec`/`03-arch`/`04-validators`/cap ⟵ built reality + ratified changes; freezes ledger `deferred` → spawns visible stories; writes `reconciled: true` (precondition the auditor reads). | `process-coherence-v5-2026-06.md:58-60,110-115`; `.claude/rules/story-closure-gate.md:24-46`; `pm-vitalia/SKILL.md:171` |
| **C — fix-loop** | `reviewing` (on CHANGES_REQUESTED) | `/dev-team` | targeted fix from `T-{n}-review.md` findings + re-audit. **Cap: 2 iter** (legacy `story-closure-gate.md:29`); auditor v5 caps `audit_iterations ≤ 4` (`auditor/SKILL.md:296`). | `docs/process/story-closure-gate.md:63-64`; `.claude/rules/auditor-self-fix-policy.md` |
| **D — gherkin (Phase D)** | embedded in `reviewing` (the audit) | `/auditor` | per-scenario `01-spec.md` Gherkin → test path → PASS/FAIL/MISSING matrix; any MISSING → CHANGES_REQUESTED. | `docs/process/story-closure-gate.md:66-87`; `auditor/SKILL.md:162-251` |

> **Phase naming collision:** the legacy 6-phase model labels phases **A(DEV)/B(AUDIT)/C(FIX)/D(GHERKIN)/E(DOCS)/F(MERGE)** (`docs/process/story-closure-gate.md:39-103`). Proceso v5 inserts **G** and **R** between A-developed and B-audit, renaming the spine to A→G→R→B→C→D→E→F (`process-coherence-v5-2026-06.md:36-69`). These letter-phases are an ORTHOGONAL labeling layer on top of the 10 states — flagged in §7-F4.

---

## 3 · Actors / skills per transition (the exact owner of each hop)

| Hop | Owning skill | Mechanism (file:line) |
|---|---|---|
| `idea → refining` | Chris (cockpit) → `/pm-{brand}` writes state | `lifecycle.md:65`; `pm-vitalia/SKILL.md:166` |
| `refining → refined` | `/po-ux` (ui) / `/po` (service) / `/po`+`/ux-agentico` (agentic) draft → `/pm-{brand}` closes on Chris ratify | refiner selection `lifecycle.md:69-73`; close `pm-vitalia/SKILL.md:167` |
| `refined → ready` | `/architect` (Opus) — produces 03+04+05+06, sets state | `architect/SKILL.md:142` ("transition checkpoint.md state: refined → ready") |
| `ready → developing` | `/dev-team` (Step 0 pickup) | `dev-team/SKILL.md:58-61` |
| `developing → developed` | `/dev-team` (Step 5, after Phase-D-local + live-verify gate) | `dev-team/SKILL.md:560-574` |
| `developed → [G]` | `/dev-team` pauses (default) — emits KIT, STOPs | `dev-team/SKILL.md:572-602` |
| `developed → reviewing` (autonomous) | `/dev-team` auto-handoff `/auditor` if `autonomous_mode: true` | `dev-team/SKILL.md:604-624` |
| `[G] → [R]` | `/pm-{brand}` on `chris_verify.signoff` | `pm-vitalia/SKILL.md:171` |
| `[R] → reviewing` | `/pm-{brand}` writes `reconciled: true` → `Skill(auditor)` | `pm-vitalia/SKILL.md:171-172`; auditor reads it `auditor/SKILL.md:77-87` |
| `reviewing` audit | `/auditor` spawns `auditor-{backend,frontend,agentic}` sub-auditors per ticket-surface | `auditor/SKILL.md:91-155` |
| fix-loop (`C`) | `/auditor` spawns `builder-{backend,frontend,agentic}` (`dev-team`) in `AUDITOR_AUTO_FIX_LOOP` mode | `auditor/SKILL.md:330-388` |
| `reviewing → done` | `/auditor` APPROVED → auto-handoff `/pm-{brand}` merge | `auditor/SKILL.md:602` (Step 5 merge handoff); `pm-vitalia/SKILL.md:173` |
| gate execution (any state) | `gate-runner` (Haiku) produces `gate-output.json` | `dev-team/SKILL.md:435-455`; `auditor/SKILL.md:91-128`; `pm-redesign-2026-05.md:290` |
| context pre-flight | `context-builder` + `context-validator` (Haiku) produce `CONTEXT-BRIEF.md` | `dev-team/SKILL.md:122-155`; `auditor/SKILL.md:30-63` |

**Builder model routing (R23 hard rule):** AGENTIC ticket + `production_code: true` → **Opus obligatorio** (`dev-team/SKILL.md:201-218`, cost-routing `pm-redesign-2026-05.md:287`). BE/FE non-agentic → Sonnet/opencode (`pm-redesign-2026-05.md:286`).

**Auto-chain rule (PM skill chaining):** PMs invoke the next skill via `Skill` tool **inline**, never a textual "Chris, invocá /po-ux" — `pm-vitalia/SKILL.md:181-213` (origin case F1-S4 at `:211`); rule `.claude/rules/pm-skill-chaining.md`.

---

## 4 · Gates (every HARD gate in spine order, with file:line)

| # | Gate | When | Owner | Mechanism + REFUSE condition (file:line) | tier |
|---|---|---|---|---|---|
| G0 | **Step 0 worktree** (detect type + manifest + sync + bucket lock + enforcement matrix) | every `/pm-*` skill invocation | `/pm-{brand}`, `/pm-luana` | `.claude/rules/step-0-worktree.md` (12-step logic + enforcement matrix). HARD REFUSE if `/pm-{brand-X}` runs in brand-Y/PRINCIPAL/core/UNKNOWN worktree. | PROJECT (brand enum) over CORE shell |
| G1 | **Prior-art scan** (grep core + active brands before refining/design/arch) | refining/design/arch start | `/pm-{brand}`, `/po-*`, `/architect` | `.claude/rules/anti-duplication-refining.md`; `/architect` REFUSE if `01-spec.md` lacks `## Prior art applied` → `architect/SKILL.md:41-67`; `pm-vitalia/SKILL.md:54-91` | CORE concept / PROJECT (engine paths + brand list) |
| G2 | **cap_target declared** | `refining → refined` | `/po-*`/`/architect` | story without `cap_target` cannot pass `refining → refined` — `capability-protocol.md:27`; `/architect` rejects — `capability-protocol.md:196`; checkpoint enforce `checkpoint-template.md:131` | CORE |
| G3 | **Ready-package-complete (03+04+05+06)** + `## Integration design (CONN)` + Design-System-Canon (FE) | `refined → ready` | `/architect` | 4 files required `architect/SKILL.md:11,122-126`; CONN reachability or NO `ready` — `architect/SKILL.md:168`; FE canon binding or NO `ready` — `architect/SKILL.md:169` | CORE skeleton / PROJECT (canon ref, engine boundaries) |
| G4 | **WIP caps** (developing/developed/reviewing ≤ 1 per `code:{module}`) | pickup of any build | `/dev-team` Step 0.4 + `/pm-{brand}` Step 0 | `dev-team/SKILL.md:67-120` (module-scoped block + REFUSE pickup); `pm-vitalia/SKILL.md:91-121`; pre-commit Section 12 `story-closure-gate.md:203`. Escape: `defer_audit: true` ratified by Chris (`story-closure-gate.md:141-166`) | CORE |
| G5 | **Phase-D-local coverage** (every Gherkin scenario maps to ≥1 PASS test) | before `developing → developed` | `/dev-team` Step 4.5 | `dev-team/SKILL.md:485-525`; REFUSE auto-handoff if `SCENARIO_COUNT > COVERED_COUNT` | CORE concept / PROJECT (pytest/playwright cmds) |
| G6 | **DoD live-verify gate** (`dod_live_verified: true` + `dod_evidence` ≥1 + `demo-script.md` if `demo_required`) | before `developing → developed` (BLOCKING) | `/dev-team` Step 4.6 | `dev-team/SKILL.md:527-558` (exit 1 if `GATE_OK != true`); rule `.claude/rules/definition-of-done-live-verify.md` (#37); auto-skip if `verification_nature: técnica` + `demo_required: false` | CORE concept / **BRAND smear** (dev-app URLs, Clerk token, Chrome MCP) |
| G6.5 | **Ledger PISO HARD** (if `cap_change_type: new`, happy-path items must be `✅` before `developed`) | `developing → developed` | `/dev-team` Step 4.5b | `dev-team/SKILL.md:548-558`; REFUSE if a happy-path item is `⬜`/`→historia` | CORE |
| G7 | **G · chris_verify.signoff** (Chris exercises live, signs `result ∈ {SATISFIED, SATISFIED_WITH_FOLLOWUPS}`) | `developed` (G phase) | Chris + `/dev-team` | `process-coherence-v5-2026-06.md:93-108`; `.claude/rules/definition-of-done-live-verify.md` §5 (Layer 9); checkpoint `chris_verify:` block `checkpoint-template.md:51-52` | CORE concept / BRAND (dev-app live exercise) |
| G8 | **R · reconciled: true precondition** | entry to `reviewing` (auditor B) | `/pm-{brand}` writes, `/auditor` reads | auditor REFUSE if not `reconciled: true` AND not `autonomous_mode: true` → `auditor/SKILL.md:77-87` ("falta reconcile (R)... ANTES del auditor") | CORE |
| G9 | **Auditor gate-output preflight** (`any_fail=false` before sub-auditor spawn) | `reviewing` Step 2 | `/auditor` | `auditor/SKILL.md:106-128`; if `overall.any_fail=true` → return story to `developing` | CORE concept / PROJECT (gate cmds) |
| G10 | **Phase D gherkin matrix MISSING-blocks** | `reviewing` Step 2.5 + Phase D | `/auditor` | `auditor/SKILL.md:210-214,242` (any NO COVERAGE/FAIL/MISSING → CHANGES_REQUESTED); `06-tickets.yaml::gherkin_coverage` required post-2026-05-18 (`story-closure-gate.md:114-139`) | CORE |
| G11 | **LIVE_VERIFY_MISSING auto-FAIL** (auditor exercises ≥1 write live before any verdict) | `reviewing` Phase D | `/auditor` | `auditor/SKILL.md:253-274`; auto-FAIL if `dod_live_verified` absent/false, or `dod_evidence` only GETs, or spec imports `@playwright/test` directly (no `base.ts`) | CORE concept / BRAND (dev-app, Chrome MCP) |
| G12 | **Mutation gate** (diff-scoped; survivor on new lines in `mode:hard` → CHANGES_REQUESTED) | `reviewing` Phase D | `/auditor` | `auditor/SKILL.md:246`; only if `04-validators technical_gates.mutation.enabled: true` (`04-validators-template.yaml:34-35`); degrades advisory if tool absent | CORE concept / PROJECT (mutmut/Stryker) |
| G13 | **Auditor verdict** (APPROVED \| CHANGES_REQUESTED \| ESCALATED) + CHECKPOINTS C1-C5 | `reviewing` Step 3-4 | `/auditor` | verdict `auditor/SKILL.md:155`; C1-C5 grid `auditor/SKILL.md:472`; self-fix v5 Carril R/C `.claude/rules/auditor-self-fix-policy.md` | CORE concept / PROJECT (C4 checks name ruff/tsc/PHI/voseo) |
| G14 | **Merge REFUSE conditions** | `reviewing → done` | `/pm-{brand}` | `07-merge.md` 5 sections required or REFUSE (`story-closure-gate.md:38-112`); `demo_required: true` + missing `chris_verify.signoff` SATISFIED → REFUSE (`pm-vitalia/SKILL.md:247-255`); dev-app gate ADR-008 → REFUSE if evidence empty (`pm-vitalia/SKILL.md:245`); cap ledger Fase F.3 REFUSE (`capability-protocol.md:183`) | CORE concept / **BRAND smear** (ADR-vitalia-008 dev-app gate) |
| G15 | **Archive-on-done** (`git mv` story → `archive/{year}/stories/` in SAME merge commit) | `reviewing → done` | `/pm-{brand}` | `.claude/rules/brand-docs-schema.md` R2 (`brand-docs-schema.md:68-87`); `story-closure-gate.md:32`; auditor scrutinizes pre-merge C5 (`auditor/SKILL.md` C5 grid) | CORE concept / PROJECT (path scheme) |
| G16 | **cross_check_3 (scenario→e2e_test exists)** HARD pre-push | merge / pre-push | pre-push hook | `lifecycle.md:133`; `capability-protocol.md:568-573`; HARD block if drift > 0 | CORE concept / PROJECT (script) |
| G17 | **cross_check_4 (access roles ↔ `@require_phi_access`)** HARD for vitalia | merge / pre-push | pre-push hook | `lifecycle.md:134`; `capability-protocol.md:575-581`; **HARD vitalia, advisory other brands** | BRAND (PHI/vitalia) |
| G18 | **chris-input.md presence** (exists from `state: idea`) | any commit of checkpoint in non-done state | pre-commit Section 16 | `.claude/rules/brand-docs-schema.md` R4 (`brand-docs-schema.md:143-153`); `chris-input-protocol.md:207-211`; escape `# chris-input-skip: razón` | CORE concept / PROJECT (hook section #) |

---

## 5 · Artifacts (full per-state set; producer → consumer)

| Artifact | Born at state | Producer | Consumer(s) | SSoT (file:line) | tier |
|---|---|---|---|---|---|
| `chris-input.md` | `idea` (with checkpoint) | `/pm-{brand}` create (template `00-chris-input-template.md`) | all pipeline skills append verdicts | `chris-input-protocol.md:155-161`; `brand-docs-schema.md:143-153` | CORE concept / PROJECT (cockpit parser) |
| `checkpoint.md` | `idea` | `/pm-{brand}` (state machine) | every skill (state gate) | `checkpoint-template.md`; schema `pm-redesign-2026-05.md:38` | CORE (state) / BRAND smear (`dev_app_verified`, brand field) |
| `00-research.md` | `idea` (optional) | Chris/`/pm` | `/po-*` | `pm-redesign-2026-05.md:326` | CORE concept |
| `01-spec.md` (+ `§ Mapa funcional` + `§ Matriz de cobertura` = ledger SEED) | `refining→refined` | `/po-ux`/`/po`/`/ux-agentico` | `/architect`, `/dev-team`, `/auditor` Phase D | `pm-redesign-2026-05.md:329`; ledger seed `process-coherence-v5-2026-06.md:78-91` | CORE concept / PROJECT (mockup/canon refs) |
| `02-design-{ui,agentic}.md` | `refining→refined` (optional) | `/po-ux` (ui) / `/ux-agentico` (agentic) | `/architect` | `brand-docs-schema.md:21` | CORE concept |
| `03-arch.md` (+ `§ Integration design (CONN)` + `§ Prior art audit` + `§ Test Construction Plan`) | `refined→ready` | `/architect` (spawns architect-orchestrator) | `/dev-team`, `/auditor` | `architect/SKILL.md:122,168`; CONN `anti-orphan-integration.md` | CORE skeleton / PROJECT (engine paths, canon) |
| `04-validators.yaml` (`verification_nature`, `technical_gates`, `business_rules`, `demo_required`, `regression_guard`, `runtime_error_gate`, `playwright_visual_scope`, `mutation`) | `refined→ready` | `/architect` | `/dev-team` (build target), `gate-runner`, `/auditor` | `architect/SKILL.md:124,202-226`; fields `04-validators-template.yaml:29-62` | CORE skeleton / **PROJECT smear** (toolchain cmds, base.ts, mutmut/Stryker) |
| `05-guidelines.md` (`must_load_skills`, patterns required/forbidden, files in scope) | `refined→ready` | `/architect` | `/dev-team` builders | `architect/SKILL.md:125`; `pm-redesign-2026-05.md:64-69` | CORE concept / PROJECT (skill names, SA/Pydantic patterns) |
| `06-tickets.yaml` (`gherkin_coverage`, `assignment` block, R23 AGENTIC, DAG) | `refined→ready` | `/architect` | `/dev-team`, `/auditor` Phase D | `architect/SKILL.md:126`; `gherkin_coverage` `story-closure-gate.md:114-139`; `assignment` `.claude/rules/architect-autonomous-mode.md` | CORE skeleton / PROJECT (surface, owner_eligibility) |
| `dispatch-plan.md` (autonomous_mode, per-ticket agent+skills, playwright scope) | `refined→ready` (optional) | `/architect` Step 7 | `/dev-team` Step 0.7 | `dev-team/SKILL.md:174-195`; `.claude/rules/architect-autonomous-mode.md` | CORE concept / PROJECT (agent names) |
| `CONTEXT-BRIEF.md` | `developing` / `reviewing` | `context-builder` (Haiku) | `/dev-team`, `/auditor` | `dev-team/SKILL.md:122-155`; `auditor/SKILL.md:30-63` | CORE concept |
| `T-{n}-impl-log.md` / `T-{n}-result.md` | `developing` | `/dev-team` builders | `gate-runner`, `/auditor` | `dev-team/SKILL.md:12,429-431` | CORE concept |
| `gate-output.json` | `developing`/`reviewing` | `gate-runner` (Haiku) | `/dev-team` Step 4, `/auditor` Step 2 | `dev-team/SKILL.md:435-455` | CORE concept / PROJECT (make targets) |
| `demo-script.md` (4 sections: SETUP/HAPPY/EDGE/TEARDOWN) | `developed` (G) — required if `demo_required: true` | `/dev-team` | Chris (G live exercise), `/auditor` Phase D | `definition-of-done-live-verify.md` §5; `dev-team/SKILL.md:540`; template `demo-script-template.md` | CORE concept / BRAND (dev-app) |
| `06-audit/gherkin-matrix.md` (scenario→test→PASS/FAIL/MISSING) | `reviewing` (Phase D) | `/auditor` | `/pm-{brand}` (copies to 07-merge §1) | `auditor/SKILL.md:193-214`; `story-closure-gate.md:66-87` | CORE |
| `06-audit/T-{n}-review.md` + `CHECKPOINTS.md` (C1-C5) | `reviewing` | `/auditor` (+ sub-auditors) | `/pm-{brand}` merge | `auditor/SKILL.md:155,472` | CORE concept / PROJECT (C4 toolchain checks) |
| `07-merge.md` (5 cemented sections) | `reviewing→done` | `/pm-{brand}` | archive (immutable) | `story-closure-gate.md:38-112`; template `07-merge-template.md` | CORE skeleton / PROJECT (pytest/playwright cmds in §5) |
| `capabilities/{module}/{cap}.yaml` (PERMANENT ledger, N0-N4) | created/updated at `done` (Fase F.3) | `/pm-{brand}` via `make new-cap` | cockpit map, `/architect` (dev_preview), validators | `capability-protocol.md:42-93` (schema), `:143-190` (4 ramas), `:607-634` (N0-N4) | CORE concept / **BRAND smear** (agent_owner boxes, SYSTEM-MAP, PHI) |
| `modules/{module}.md` (auto-list) | refreshed at `done` | `/pm-{brand}` via `reconcile_capabilities.py` | humans, portfolio | `brand-docs-schema.md:99`; `pm-redesign-2026-05.md:131-156` | CORE concept / PROJECT (script) |
| `archive/{year}/stories/{id}/` (immutable snapshot) | `done` | `/pm-{brand}` `git mv` | read-only | `brand-docs-schema.md:68-87` (R2) | CORE concept / PROJECT (path) |

---

## 6 · Core-vs-Project split candidate (tier tag per spine element)

The agnostic lifecycle/gate/role concepts = **CORE**; anything naming luana tech, brands, dev-app URLs, or engine paths = **PROJECT/BRAND**. **Where the smear lives, named explicitly:**

### CORE (tech/domain-agnostic — extractable as-is)
- The **10-state machine** + the `idea↔refining`/`parked`/`dropped` off-ramps (`lifecycle.md:48-65`). Pure lifecycle.
- The **G/R/fix-loop/Phase-D sub-phase concepts** (`process-coherence-v5-2026-06.md:36-69`) — "Chris-verify before reviewer", "reconcile docs to reality", "fix-loop with cap", "scenario-coverage matrix" are all generic.
- The **role contract**: refiner → packager → builder → reviewer → merger (the 5 entry skills). Names happen to be pm/po/architect/dev-team/auditor but the contract is agnostic.
- The **gate concepts**: prior-art scan, ready-package-complete, WIP cap, live-verify-before-done, gherkin-matrix-MISSING-blocks, reconciled-precondition, merge-REFUSE, archive-on-done, chris-input-from-idea.
- **Story↔Capability doctrine** (story transitory / cap permanent append-only ledger; `cap_change_type` new/fix/extend/derive) — `capability-protocol.md:16-27,100-110`. Pure modeling.
- **`cap_target`/`cap_change_type` checkpoint fields**; the `chris_verify`/`reconciled`/`dod_live_verified`/`autonomous_mode`/`defer_audit` checkpoint vocabulary (`checkpoint-template.md:13-60`). The names are generic-enough.
- The **artifact skeleton** `01-spec…07-merge` + `03/04/05/06` (the SLOTS, minus their luana-filled bodies).

### PROJECT (which stack + which domain — the smear, ~per-product)
- **Toolchain literals everywhere**: `ruff`/`pytest`/`mypy`/`alembic`/`.venv/bin/`/`npx tsc/eslint/vitest/playwright` baked into `07-merge` §5 (`story-closure-gate.md:91-109`), CHECKPOINTS C1/C4 (`auditor/SKILL.md` C1-C4 grid), `04-validators technical_gates`, dev-team/auditor Step bodies. **This is the charter's `toolchain.*` seam slot (charter §3).**
- **Brand enumeration**: `for B in nicolify vitalia comunify lupulo` patterns; Step 0 worktree brand-X-vs-Y matrix (`.claude/rules/step-0-worktree.md`); `pm-vitalia/SKILL.md:57` "vitalia/ propio + comunify/". Charter `brands[]` slot.
- **Engine paths in process logic**: `core/luana-core-*` boundary rules in architect (`architect/SKILL.md:135,153-161`); anti-duplication engine inventory. Charter `engine_prefix` slot.
- **Mutation tools** mutmut/Stryker (`auditor/SKILL.md:246`); **gate-runner make targets** (`make ci-parity`, `test-{brand}`).
- **The verdict checks naming PHI/voseo/USD/Clerk** in CHECKPOINTS C4 (`auditor/SKILL.md` C4) — half generic (security), half luana-domain.
- **Cap model boxes** `agent_owner ∈ {lisa, mateo, adrian, lucas, camila, …}` + `SYSTEM-MAP.yaml` zones (`capability-protocol.md:230-261`) — the **3-zone model is CORE-able, the box names are BRAND**.

### BRAND (market instance — the deepest smear)
- **DoD live-verify infra hardcoded in the NORMATIVE rule body**: `dev-app.vitalialat.com`, `dr.demo@vitalialat.com`, `CLERK_TESTING_TOKEN_VITALIA`, ports `:3002/:8002`, `make dev-app-vitalia` — `.claude/rules/definition-of-done-live-verify.md` Infra-by-brand table + vitalia reference table. **Charter `live_verify_infra[]` slot. This is the single worst smear: a BRAND URL inside a CORE-aspiring gate rule (#37).**
- **Merge gate ADR-vitalia-008** (`dev_app_verified.evidence`) cited as a HARD merge REFUSE in `pm-vitalia/SKILL.md:245` — a brand ADR wired into the merge spine.
- **cross_check_4 "HARD for vitalia, advisory otherwise"** (`capability-protocol.md:581`) — PHI/health domain leaking into a validator's hardness.
- **`hipaa_lite_overlay`, PHI roles `doctor/nurse/admin_clinic`** in the cap schema (`capability-protocol.md:62,403-407`).

**WHERE the smear concentrates (operator takeaway for W5/W7):** `04-validators.yaml` template (toolchain + base.ts + mutation), the DoD rule #37 normative body (dev-app brand infra), the `07-merge`/CHECKPOINTS bodies (toolchain), and `pm-{brand}` skills (brand-scoped by design — these are PROJECT/BRAND instances of a CORE pm template, but they re-state spine gates inline instead of reading them, see §7-F1/F2).

---

## 7 · Scatter / contradiction / gap findings

Each fed to the W0.5 consolidation. Cited `file:line`; contradictions quote both.

### F1 — WIP cap stated 3 ways, two contradict (SCATTER + CONTRADICTION)
The same cap is restated in ≥4 places with divergent numbers:
- `lifecycle.md:50`: "WIP caps **≤1** por worktree para developing/developed/reviewing ... cualquier doc que diga ≤2/≤3 está obsoleto."
- `docs/rules-detail/story-closure-gate.md:170-176`: cap table **"≤ 1 por worktree"**.
- `docs/rules-detail/story-closure-gate.md:278-289` (WIP cap v2): cap is **"≤ 1 por `code:{module}` bucket (no por worktree)"** under ADR-009.
- `dev-team/SKILL.md:65`: "el cap `developing` ya **NO es por worktree** — es **≤ 1 por `code:{module}` bucket**."
- `pm-redesign-2026-05.md:263`: "`developing` ≤ 1 por worktree".
**Contradiction:** "per worktree" (lifecycle.md:50, story-closure-gate.md:170, pm-redesign:263) vs "per `code:{module}` bucket" (story-closure-gate.md:278, dev-team:65). The module-scoped one is the enforced reality (single-hub); the per-worktree text is stale. **→ Consolidate to one SSoT; lifecycle.md:50's own "supersede" claim is itself superseded by v2.**

### F2 — Story-closure-gate truth lives in 3 docs + 1 rule, structurally divergent (SCATTER)
The closure gate is authored in `.claude/rules/story-closure-gate.md` (71L, the slim stub), `docs/rules-detail/story-closure-gate.md` (318L, detail), `docs/process/story-closure-gate.md` (175L, rationale/case-study) — three files for one gate. The rule stub already declares the **8-phase A→F+G/R** model (`.claude/rules/story-closure-gate.md` from CLAUDE.md context), but the DETAIL doc `docs/rules-detail/story-closure-gate.md:21-36` still presents only the **6-phase A→F** model with NO G/R, and `docs/process/story-closure-gate.md:39-103` likewise only A→F. **Drift:** the v5 G/R insertion (`process-coherence-v5-2026-06.md:36-69`) is reflected in the slim rule + skills but NOT folded into the two longer story-closure-gate docs. An operator reading the detail doc gets the pre-v5 6-phase model. **→ Fold G/R into rules-detail + process docs, or repoint them to v5.**

### F3 — DoD demo gate "moved F→G" in v5, but old F-phase signoff text may linger (CONTRADICTION/STALE)
v5 explicitly **moves the demo signoff from F to G**: `process-coherence-v5-2026-06.md:98` "El demo_signoff de #37 §5 se MUEVE de F a G (no se duplica — un solo signoff, antes)"; consolidated to `chris_verify.signoff` (`process-coherence-v5-2026-06.md:222` D-E "consolidado a chris_verify.signoff (W2, 7 sitios)"). The rule #37 body now says §5 signoff is "ejercido en G" (`definition-of-done-live-verify.md` §5 + Layer 9 ⏳). **Risk surface:** rule #37 enforcement-layer table still marks Layer 3 (pm REFUSE) and Layer 9 (demo gate in G) as **⏳ partial** for non-vitalia brands, and the legacy `demo_signoff` name may survive in older story checkpoints/templates. **→ Grep for residual `demo_signoff` (vs `chris_verify.signoff`) across templates + brand skills; confirm the F-phase merge REFUSE reads `chris_verify.signoff`, not a stale `demo_signoff`.**

### F4 — Two orthogonal phase-labeling systems (A-F letters vs G/R vs 10 states) (SCATTER)
The spine is labeled three ways simultaneously: (a) 10 macro states (`lifecycle.md:48`), (b) 6/8 letter-phases A-F(+G/R) (`story-closure-gate.md:21`), (c) `checkpoint.md::phase` runtime values like `AWAIT_CHRIS_VERIFY`/`HANDOFF_TO_AUDITOR` (`checkpoint-template.md:19`) PLUS `phase_workflow: PO_SPEC` (`checkpoint-template.md:18`, "distinct from phase"). Four distinct phase vocabularies. An operator must hold all four to read a checkpoint. **→ W0.5 should pick ONE operator-facing phase vocabulary and map the others to it.**

### F5 — Charter-flagged GAP: WT5 (technical capability) has NO defined spine entry (GAP)
Charter §1.5 table marks **WT5 (technical capability) actors as "TBD" / "UNDER-DEFINED — gap to close"** (`harness-refactor-charter-2026-06-08.md:45`). The spine confirms this: refiner selection (`lifecycle.md:69-73`) lists only `ui-story`/`service-story`/`agentic-story`/`bugfix` — there is **no `technical-story` type**, no refiner owns a pure technical/observability/security/perf cap, and `04-validators verification_nature: técnica` is the only hook (it just auto-skips the live-verify gate, `dev-team/SKILL.md:534`). Technical caps ride the spine implicitly as `service-story` or `bugfix` with `user_visible: false`, but no owner/gate set is declared for them. **→ W0.5 must define WT5's spine deltas explicitly (this is the charter's named close-WT5 deliverable).**

### F6 — Missing/unimplemented scripts cited as spine machinery (GAP)
`lifecycle.md:202` (incoherence #9): "`generate_release_notes.py` + `validate_chris_input.py` **no existen** — MISSING. Quitar refs hasta crearlos." Yet `chris-input-protocol.md:210` still cites `scripts/validate_chris_input.py` as the schema validator. `lifecycle.md:204` (#11): validators silently skip ~10 caps on parse error. **→ Either implement or purge the dangling references before the surface refactor wires to them.**

### F7 — Auto-gen / R3 references the legacy `outcomes/` which lifecycle.md killed (STALE)
`brand-docs-schema.md:14` schema lists `product/outcomes/{slug}.md` as a valid dir, and `:61,121` route content there. But `lifecycle.md:40` **killed `outcome`** ("6 outcomes borrados") and `pm-redesign-2026-05.md` Punto 2/3 built the model on outcomes. The brand-docs-schema TARGET tree still blesses `outcomes/`, contradicting the 4-ejes consolidation that removed it. **→ Reconcile brand-docs-schema with the post-2026-05-28 4-ejes model (no outcome/phase/atomic).**

---

*End SPINE-as-is.md — authoritative spine reference for the W0.5 per-WT delta agents.*
