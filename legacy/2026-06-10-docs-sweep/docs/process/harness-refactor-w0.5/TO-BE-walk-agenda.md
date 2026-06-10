# W0.5 · TO-BE walk agenda — the decision ledger

> **Harness Refactor · W0.5 · Step 2 input.** This is the structured set of decisions Chris ratifies WITH the orchestrator to produce the **Process Model SSoT** (Step 3). Each decision cites the findings it resolves (`MF-nn` / `X-n` from `AS-IS-MAP.md`) and proposes options with a **recommendation** (the orchestrator's read; Chris decides). Nothing here edits an artifact — W0.5 only DEFINES. As each decision is ratified, its resolution is recorded in the final `PROCESS-MODEL.md`.
>
> **Walk order (recommended):** the 4 cross-cutting de-tanglers (D-X) first — they simplify every per-WT walk — then WT1→WT7. WT5 (D5) + cockpit unification (D6) are the charter's explicit "close this" deliverables.

---

## Part A — Cross-cutting de-tanglers (resolve first)

### D-X2 · One SSoT per concern (kill the N-restatements)
**Resolves:** MF-06 (WIP-cap 3 ways), MF-07 (closure-gate 3 docs), MF-08 (demo-signoff 3 names), MF-09 (`02-design-ui.md` 8 refs), MF-20 (repro gate 4 skills), MF-21 (eval-policy 5 places), MF-28 (`outcomes/` stale), MF-30 (po prior-art).
**Decision:** for each over-stated concern, designate ONE SSoT + make the rest pointers. Concretely ratify:
- WIP-cap → SSoT = `story-closure-gate` (per-`code:{module}`, ADR-009); purge "per-worktree" from lifecycle.md:50 + pm-redesign.
- story-closure-gate → fold G/R into the one canonical doc; the other two become pointers.
- demo-signoff → ONE field `chris_verify.signoff` in G; retire `demo_signoff`; `dev_app_verified` is the vitalia *instance* of the generic `dod_evidence`.
- `02-design-ui.md` → DEAD (po-ux fusion is SSoT); the visual contract lives in `01-spec.md § Wireframes`; purge the 8 live refs.
- eval-policy → new SSoT `agentic-eval-policy.md`; the 5 restatements point to it.
- po → add the inline prior-art-scan block (LSP parity with po-ux).
**Recommendation:** ratify all of the above as a single "1-SSoT-per-concern" pass (mechanical in W1/W2/W6; the *decision* is here).

### D-X3 · Phantom machinery — build or purge (per item)
**Resolves:** MF-11/12/13/14 + MF-25.
**Decision (per phantom):** does the cited tool get BUILT (it's real machinery the process needs) or PURGED from the citing artifact (it was aspirational)?
| Phantom | Cited by | Build or purge? |
|---|---|---|
| `run_agent_evals.py` / `run_trajectory_eval.py` / `check_cost_budget.py` | architect agentic validators | **rec: PURGE** → point validators at the real `pytest tests/agentic_evals/ --trials=3` (D3) |
| `graceful-degradation` skill | ux-agentico/builder/architect HARD-GATE | **rec: DEMOTE** skill→rule/inline doctrine (it's guidance, not invocable) |
| `generate_core_modules.py` | promotion / pm-luana | **rec: PURGE or BUILD** (decide: is core-modules auto-gen worth it, or hand-maintained?) |
| AST-similarity in `scan_promotables.py` | promotion README | **rec: PURGE the claim** (script only does frontmatter clustering) |
| `validate_chris_input.py` / `generate_release_notes.py` | spine / chris-input-protocol | **rec: PURGE refs** (lifecycle.md already flags them missing) |
| auditor "Cat 11 repro" / autonomous-mode ⏳ layers | WT4 / WT3 | **rec: implement the enforcement OR drop the claim** (no paper rules) |
**Recommendation:** default to PURGE-the-reference unless Chris wants the tool; "paper machinery" is as toxic as "paper rules."

### D-X4 · Silent-killer schema/key fixes
**Resolves:** MF-01, MF-02, MF-03.
**Decision:** ratify these as must-fix in the surface workstreams (the *fix* is W-phase; the *acknowledgment they're bugs* is here):
- `verification.nature` (template) ↔ `verification_nature` (dev-team grep) → pick ONE spelling; fix both. **rec: top-level `verification_nature`** (matches dev-team + architect prose).
- promotion proposal schema → enforce YAML-frontmatter `state:` (kill the `| Campo | Valor |` table format); add a schema-lint so the auditor grep can't false-FAIL.
- cockpit read-schema → add G/R/`chris_verify`/`reconciled`/`dod_evidence`/`dod_live_verified` to `types.ts` + RICH_FIELDS (see D6).
**Recommendation:** ratify all three; they're the highest-severity (silent green/false-fail).

### D-X5 · Smear → seam (confirm the W5 slot list)
**Resolves:** MF-26, MF-27, X8.
**Decision:** confirm the charter seam slots are the right cut and the 6 smear surfaces are the targets. The slots: `toolchain.*`, `brands[]`, `locale`, `engine_prefix`, `live_verify_infra[]`, `design_system_ref`, `domain_modules[]` (+ likely an `agent_roster` / `value_stream` slot for the cockpit). **No move happens in W0.5** — this just ratifies the seam contract so W5 has agreed inputs.
**Recommendation:** ratify the slot list + add `agent_roster` and `value_stream` as slots (the cockpit smear needs them).

---

## Part B — Per-WT ratifications (lifecycle · actors · gates · artifacts · cockpit-view · core/project split)

For each WT the walk confirms the 6 columns and resolves its findings. Below = the *open* decisions per WT (the settled parts just get ratified as-is).

### D1 · WT1 (UI cap) — mostly settled
**Open:** (a) `/functionality` cockpit view — build it or rename to "Cap Drawer is the home" (MF, COCKPIT)? (b) confirm Design-System-Canon binding stays a WT1-only HARD gate. **Rec:** Cap Drawer is the home (drop the phantom `/functionality` column); canon binding stays.

### D2 · WT2 (service cap) — mostly settled
**Open:** (a) ratify WT2 = `verification_nature: técnica` auto-skip (after the MF-01 key fix). (b) add po prior-art-scan (D-X2). (c) confirm WT2 has no demo, no anti-burbuja. **Rec:** ratify as-is once MF-01 fixed.

### D3 · WT3 (agentic) — eval machinery + plan shape
**Open:** (a) eval-policy SSoT (`agentic-eval-policy.md`) + point the 5 restatements (D-X2). (b) architect `test_construction_plan` needs an **agentic-trajectory→golden** mode (today 100% Playwright-shaped) — design it (MF-22). (c) real eval invocation = `pytest tests/agentic_evals/ --trials=3` (purge the phantoms, D-X3). (d) `graceful-degradation` skill→rule. **Rec:** ratify (a)+(c)+(d); (b) needs a small design (the agentic analog of the scenario→POM plan).

### D4 · WT4 (bugfix) — unify the two mechanisms + wire the cockpit
**Resolves:** MF-10, MF-15, MF-20, MF-25, + WT4 F2/F5/F6/F8.
**Open decisions:**
1. **One repro doctrine, one SSoT:** merge "hotfix-repro (ticket-level R26)" + "bugfix-story-type (story-level)" into one model with two enforcement altitudes documented once. **Rec: yes.**
2. **Architect bugfix-lite mode:** add `bugfix` to the architect story_type enum + define the reduced ready-package (skip 03/05/dispatch when no arch decision). **Rec: yes** (ADR-011 already cements it; the skill just never implemented it).
3. **po-ux bugfix entry:** add `bugfix` to the po-ux decision matrix (UI bugfix has no home today). **Rec: yes.**
4. **Cockpit wiring:** add `bugfix` to `StoryType`/`TYPE_META`/`typeMetaOf`/board-filter + a `repro_verified` badge. **Rec: yes** (D6).
5. **Schema:** one key name (`repro_evidence` vs `hotfix_metadata`) + add top-level `type:` to checkpoint-template. **Rec: yes.**

### D5 · WT5 (technical cap) — **THE GAP — close it** ★ charter deliverable
**Resolves:** MF-04, MF-05, MF-17, MF-18, MF-19, + WT5 F1-F11.
**The 8 questions (from `WT5-technical-cap-as-is.md §9`):**
1. **Own type or reuse?** Cement `type: technical-story` as a 5th first-class type, OR formalize "infra rides `service-story` + `user_visible:false` + `nature:scaffold/extension-point`" and kill the ghost. **Rec: own type** (the cockpit already anticipates `tech`; service-story produces hollow specs for infra — the Path A problem).
2. **Owner skill?** new `/po-tech` · extend `/po` (BE/infra) · architect-first (infra is often arch-decision-first) · `/pm-luana` for core-infra + `/pm-{brand}` for brand-infra. **Rec: architect-first for core-infra (it's a design, not a behavior spec) + extend `/po` for brand-infra**; walk this.
3. **What is "verified" with no demo?** Ratify `verification_nature: técnica` = gates + **runtime evidence by effect** (encryption→decrypt round-trip; idempotency→replay dedup; observability→trace row; durable-flow→persist+resume). Define the bar per sub-domain. **Rec: ratify; this is the one piece that already works — protect it.**
4. **Net-new core infra home?** promotion-protocol forbids "research en core" → where does net-new infra (durable-flows L2, LLM gateway) live? **Rec: a technical-story with `cap_change_type: new` targeting `core/` + the lift gate as a sub-step** (decouples "build net-new core" from "lift brand mirror").
5. **WT5/WT6 boundary:** retire proposal-as-lifecycle for the BUILD (so infra is on /board, has WIP-cap, closure-gate, archive) and reserve promotion (WT6) for the LIFT only. **Rec: yes — WT5 builds, WT6 lifts.**
6. **Artifact template:** define the infra-cap spec analog (contract provided · consumers · invariant · verification-by-effect) instead of a hollowed 01-spec; teach `new_cap.py` an infra mode. **Rec: yes.**
7. **Spec-first or build-first?** forbid build-first/document-later for technical caps (or allow only `nature:scaffold`). **Rec: spec-first contract required for `extension-point`/`feature` infra; scaffold exempt.**
8. **Cockpit:** wire the `tech` slot to the new type + surface in-flight technical work (not just finished caps in the collapsed Infra zone); single "WT5 done" record. **Rec: yes** (D6).

### D6 · Cockpit unification ★ charter deliverable
**Resolves:** MF-03, MF-15, MF-16, MF-17, MF-29, X5, X6.
**Open decisions:**
1. **Surface proceso-v5 gates** (`phase:AWAIT_CHRIS_VERIFY`→"blocked on Chris" badge, `chris_verify.signoff`, `reconciled`, `dod_live_verified`/`dod_evidence`) as first-class read-schema fields + board indicators (fix MF-03). **Rec: yes — highest cockpit priority.**
2. **Wire WT4 bugfix + WT5 technical** types (D4.4, D5.8).
3. **Add a WT6 promotion view** (brand→core lift board reading `docs/promotion-protocol/proposals/`). **Rec: yes — a "promotion lane."**
4. **Unify `/harness`** (boardify L2/L4 in-place vs link-out) — note charter's "needs unified view" is stale; re-scope to "boardify L2/L4 + lane badges" (MF-29).
5. **Bridge the two state vocabularies** (10 product states vs 6 HLP states) with a legend/shared grammar (X6).
6. **De-smear the read-schema** (push agent rosters/value-stream/roles to config; `types.ts` schema = the CORE seam) (MF-27) — this is W4b/W5 work, ratified here.

### D7 · WT6 (promotion) + WT7 (harness) — off-spine processes
**Resolves:** MF-16, MF-23, MF-24, MF-29, + WT6 S1/C2/C3, WT7 findings.
**Open decisions:**
- **WT6:** (a) one SSoT for the state-machine (kill README↔pm-luana dup, D-X2). (b) document the `deferred` 6th state OR remove it. (c) scope-discipline: stop using promotion-protocol as a generic cross-brand-change tracker (purge/config tasks ≠ lifts). (d) add a lift-START gate (block `core/` edits before proposal accepted, not just at PR-time — MF-23). (e) give the lift an explicit auditor/reviewing pass (MF-24). (f) the promotion machine — does it become a formal `WT6` in the Process Model SSoT, sitting beside the 10-state spine? **Rec: yes to all; WT6 is a first-class off-spine process in the SSoT.**
- **WT7:** (a) one SSoT for the apply-pipeline (reconcile HLP §6 ↔ harnesses-improvement skill, D-X2). (b) cross-walk the audit-severity vocab ↔ HLP 5-state + document catalogue→HB mapping. (c) confirm WT7 is the second modeled process in the SSoT (dogfood). **Rec: yes; WT7 is the second first-class process.**

---

## Part C — The Process Model SSoT (Step 3 output shape)

Once Part A+B are ratified, the orchestrator writes `PROCESS-MODEL.md` (the W0.5 deliverable, charter roadmap A.5) containing:
1. **The two processes** (product-dev spine + harness-improvement) as the requirements layer.
2. **Per work-type (WT1-7)** the ratified: lifecycle states · actors · gates · artifacts · cockpit-view · core/project/brand tag.
3. **The unified phase/state vocabulary** (one per process, X6).
4. **The seam-slot contract** (D-X5) — the W5 inputs.
5. **The conformance checklist** every B-phase surface refactor (W1-W6) validates against.

This SSoT then **gates** W1+ (no surface refactor starts until the process it implements is ratified — charter §6 critical path).

*End TO-BE-walk-agenda.md.*
