# W6 · RESEARCH batch P1 — Process-docs (LIVE-SSoT / protocol)

> **Scope:** the 18 ratified-v5/W0.5 SSoT process-docs in `docs/process/`. READ-ONLY classification (no edits).
> **North-star (charter §0.5):** these are the docs W6 conforms TO. The job here = verify CURRENT (no internal stale-vocab vs the ratified v5/W0.5 SSoT), tag extractability via the OPTION-B proxy, flag phantom refs + one-SSoT violations + needed `{SLOTS}`.
> **Method:** proxy-grep (charter §0.5 token set) per file · stale-vocab tombstone scan · `test -e` phantom scan (basename-relative refs resolved manually) · machinery-validator grep (`scripts/validate_machinery_consistency.py`) · one-SSoT cross-read.
> **Headline:** process-docs are core-heavy in DOCTRINE but **only 6/18 earn `core`** by the proxy (the rest carry vitalia/toolchain/engine tokens → `hybrid`/`project`). **2 LIVE-STALE conformance gaps vs PROCESS-MODEL** (`story-closure-gate.md` is pre-v5 6-phase A-F; `lifecycle.md:50` WIP-cap "por worktree"; `spec-mapa-funcional.md:129` `demo_signoff`). **2 genuine phantoms** (`generate_release_notes.py`, `validate_chris_input.py`) — both already self-tombstoned. INDEX.md missing 5 live docs.

---

## Master table

| # | file | tier (proxy hits) | stale-vocab (LIVE-STALE?) | phantom refs | one-SSoT | {SLOTS} needed | machinery | W6 action |
|---|---|---|---|---|---|---|---|---|
| 1 | `capability-protocol.md` | **hybrid** (42) | tombstoned only (v4 atomics/outcome killed — historical) | none real (cap-det basenames illustrative; `validate_code_cap_bidirectional.py` OK) | OK (schema SSoT; cap-det/lifecycle pointed-to) | `engine_prefix` · `brands[]` · `agent_roster` (mateo/lisa…) · `live_verify_infra` (hipaa) · `design_system_ref` | N | add-{slots} |
| 2 | `cap-deterministic-enforcement.md` | **hybrid** (9) | clean | none (all 13 "DEAD" = illustrative brand-relative cap paths / cockpit libs that exist) | OK (HB-51 design SSoT; points to capability-protocol) | `brands[]` (vitalia/comunify HARD, nicolify/lupulo advisory) · `engine_prefix` · `live_verify_infra` | **Y · CHECK 11** | add-{slots} |
| 3 | `checkpoint-protocol.md` | **hybrid** (10) | line 61 cites legacy `outcome:`/`phase:` cruft as **migration target** (correct, not stale) | none real (`route.ts` OK under cockpit; `post-edit-checkpoint.sh` correctly noted removed) | OK | `brands[]` · `toolchain` (pytest scopes) | N | add-{slots} |
| 4 | `chris-input-protocol.md` | **hybrid** (6) | clean | `scripts/validate_chris_input.py` (L210 "opcional") — **genuine phantom** (self-flagged in lifecycle #9) | OK | `brands[]` (story_id examples) · `live_verify_infra` | N | conform-stale (drop/repoint phantom) · add-{slots} |
| 5 | `cockpit-permissions.md` | **core** (0) | clean | none (`01-spec.md` basename = artifact ref; exists per-story) | OK (whitelist SSoT; points to checkpoint/release/cap protocols) | none (10-state names are CORE vocab) | N | leave-current-SSoT (✅ proxy-clean) |
| 6 | `code-health-gate.md` | **hybrid** (15) | clean | none (`core/luana-core-iam/.../auth.py` = ellipsis illustrative) | OK (HB-61 gate SSoT) | `toolchain` (ruff/jscpd/vulture/fallow/pip-audit/npx) · `brands[]` · `engine_prefix` | N | add-{slots} |
| 7 | `continuous-improvement.md` | **core** (0) | clean | none (`harness-backlog.md`/`learning-capture.md`/`learnings.md` all exist; basename refs) | OK (★ explicitly a ROUTER not a 5th store — DIP, anti-dup self-aware) | none (CIL 4-lane mechanism is CORE per PROCESS-MODEL WT7) | **Y · CHECK 22-24** | leave-current-SSoT (✅ proxy-clean, exemplary cohesion) |
| 8 | `contributing.md` | **hybrid** (6) | line 14 footer "outcomes" (minor, generic prose) | none | OK | `toolchain` · `brands[]` · `engine_prefix` · `locale` (Spanish-neutro §) | N | add-{slots} |
| 9 | `harness-lifecycle.md` (HLP) | **core** (0) | clean | none (`cd-staging.yml`/`learning-detect.sh`/`harness-backlog.md` are pointer refs, exist or named) | OK (HLP SSoT; CIL points here) | none (HLP mechanism is CORE per WT7) | N | leave-current-SSoT (✅ proxy-clean) |
| 10 | `lifecycle.md` | **hybrid** (7) | **★ LIVE-STALE L50** "WIP caps ≤1 **por worktree**" (PROCESS-MODEL §1 X6: per-`code:{module}`, "per-worktree" PURGED) · no G/R/{C,D} phases mentioned (4-eje model predates spine phases) · tombstones OK | none real (`generate_release_notes.py` self-flagged #9; `validate_chris_input.py` #9) | **owns** the 4-eje model (canonical, supersedes others — correct cohesion) | `brands[]` (ports L160) · `live_verify_infra` (cc4 PHI/vitalia) · `agent_roster` | **Y · CHECK lifecycle (1 hit)** | conform-stale (WIP-cap → module-scoped) · add-{slots} |
| 11 | `parallel-sessions-protocol.md` | **hybrid** (31) | CURRENT internally (ADR-009 single-hub supersedes per-worktree; old model struck-through, marked historical) | `scripts/git/checkpoint-merge.sh` + `scripts/generate_migration.py` (both self-flagged "no existe / pendiente") | OK (D1-D14 SSoT; parallel-safety.md is runtime mirror) | `brands[]` · `engine_prefix` · `toolchain` (alembic/pytest/Docker) | N | add-{slots} |
| 12 | `release-protocol.md` | **hybrid** (11) | tombstone only (v3 "outcome+phase eliminados" — historical correct) | `cd-prod.yml`/`cd-staging.yml` (deferred CI, github-actions-deferred) · `generate_release_notes.py` (futuro, self-flagged) | OK (Release entity SSoT; lifecycle points here) | `brands[]` · `toolchain` (ci-parity/alembic) · `live_verify_infra` (ports 3002) | N | add-{slots} |
| 13 | `spec-mapa-funcional.md` | **core** (0) | **★ LIVE-STALE L129** `demo_signoff` (v5 → single `chris_verify.signoff` in G; PROCESS-MODEL §5/§8) | none (`REQ-TAKING-DETAIL.md` OK; artifact basenames) | OK (Opción A doctrine SSoT) | `design_system_ref` · `brands[]` (SHELL-DESIGN-CONTRACT) | N | conform-stale (`demo_signoff`→`chris_verify.signoff`) |
| 14 | `story-closure-gate.md` | **hybrid** (9) | **★★ LIVE-STALE (whole doc)** — describes pre-v5 **6-phase A-F** (DEV→AUDIT→FIX-LOOP→GHERKIN→DOCS→MERGE); **NO G (`AWAIT_CHRIS_VERIFY`) / R (reconcile) / `chris_verify.signoff` / `reconciled`** (PROCESS-MODEL §1-2 spine). L34 "outcome". Note: it's the *rationale/case-study* doc; hard-rule SSoT `.claude/rules/story-closure-gate.md` IS v5 | none real (per-story artifact basenames) | **drift** vs the rule SSoT (rationale doc lags v5) | `brands[]` · `live_verify_infra` (vitalia case-study) | **Y · CHECK 13-18** (the RULE, not this doc) | conform-stale (add v5 G/R phases or repoint to rule as SSoT) |
| 15 | `tech-debt.md` | **core** (0) | clean | none | OK (★ CIL L3 home; explicitly defers to learning-capture/harness-backlog — DIP) | none (CIL lane mechanism is CORE) | **Y · CHECK 21** (mutation→L4) + 22 (CIL router) | leave-current-SSoT (✅ proxy-clean) |
| 16 | `ticket-states.md` | **core** (0) | clean (`post-edit-checkpoint.sh` correctly noted removed 2026-05-06) | none | OK (ticket state-machine SSoT; distinct from 10 macro states — explicitly disambiguated L6) | none (ticket FSM is CORE; model preferences = `agent_roster` only in eligibility table) | N | leave-current-SSoT (✅ proxy-clean) |
| 17 | `INDEX.md` | **core** (0) | line 16 "outcome+phase legacy" (describing release-protocol's role — accurate) | none | **★ COHESION GAP** — missing 5 live docs (see below) | none | N | conform-stale (add missing rows) |
| 18 | `learnings.md` | **hybrid** (59) | **TOMBSTONE (append-only, L6)** — pre-reorg entries keep era vocab (outcome/atomics/PI) BY DESIGN; doctrine = CLAUDE.md | n/a (historical) | OK (append-only ledger; not an SSoT of doctrine) | n/a (frozen history; do not retro-edit) | **Y (2 hits, incidental)** | leave-current-SSoT (append-only; do NOT conform history) |

**Tier tally:** core = 6 (cockpit-permissions, continuous-improvement, harness-lifecycle, spec-mapa-funcional, tech-debt, ticket-states) · hybrid = 11 · project = 0 · brand = 0. INDEX = core. This matches the charter expectation that process-docs are the most core-heavy surface, but confirms the §0.5 option-b warning: **core is EARNED** — 11 docs carry tech/brand tokens and re-tag `hybrid` (core mechanism + project-half parked for W5).

---

## Per-finding prose (file:line)

### ★ LIVE-STALE conformance gaps (the W6 fixes that matter)

**1. `story-closure-gate.md` — pre-v5 6-phase A-F vocabulary (whole doc LIVE-STALE).**
- L10/L39-105 describe the cycle as **6 fases DEV → AUDIT → FIX-LOOP → GHERKIN → DOCS → MERGE**. PROCESS-MODEL §1-2 ratified the spine as `developed ─[G]─[R]→ reviewing` with **G = `AWAIT_CHRIS_VERIFY`** (Chris exercises live, signs `chris_verify.signoff`, before the auditor) + **R = reconcile** (`reconciled: true` precondition). This doc names **none** of `G`/`R`/`chris_verify`/`reconciled` (confirmed: 0 hits across all 18 targets except the v5 design docs).
- L34 "Sub-stories del mismo **outcome**" — dead token (outcome killed 2026-05-28).
- **Nuance:** this is the *rationale + case-study* doc (L5 declares `Hard rule SSoT: .claude/rules/story-closure-gate.md`). The RULE was updated to v5 (machinery CHECK 13-18 assert it). So this is **rationale-doc lag**, not a contradicting SSoT — but a reader landing here gets the pre-v5 model. **W6 action:** either insert the v5 G/R named-phases (mirror the rule) or restructure so the rationale doc explicitly defers the live process model to the rule + PROCESS-MODEL.

**2. `lifecycle.md:50` — WIP-cap "por worktree" (LIVE-STALE).**
- Text: *"WIP caps **≤1** por worktree para developing/developed/reviewing"*. PROCESS-MODEL §1 (D-X2): *"WIP cap ≤ 1 per `code:{module}` bucket … (NOT per-worktree). The 'per-worktree' text is purged."* The rule `.claude/rules/story-closure-gate.md` already says module-scoped; lifecycle.md is the stale implementer. **W6 action:** conform to per-`code:{module}`.
- Secondary: lifecycle's 10-state table (§3) is correct but does NOT carry the 4 named phases {G,R,C,D}; those live in story-closure-gate + checkpoint. Acceptable (different altitude), but worth a one-line pointer to the spine.

**3. `spec-mapa-funcional.md:129` — `demo_signoff` (LIVE-STALE).**
- Reference: *"§ Fase F — gate merge … exige `dod_evidence` + **demo_signoff** cuando `demo_required: true`"*. PROCESS-MODEL §5/§8 + REVIEW-process-v5: `demo_signoff` is RETIRED → **single `chris_verify.signoff`** exercised in **G** (not F). **W6 action:** `demo_signoff` → `chris_verify.signoff` (and note it's in G, before the auditor, not F).

### Genuine phantoms (already self-tombstoned — low risk)

- `scripts/generate_release_notes.py` — cited `release-protocol.md:178` ("futuro") + `lifecycle.md:202` (punch-list #9 "MISSING — no implementado. Quitar refs hasta crearlos"). **Self-flagged.** W6: either build or strike per #9's own instruction.
- `scripts/validate_chris_input.py` — cited `chris-input-protocol.md:210` ("opcional") + `lifecycle.md:202` #9. Same status. **Self-flagged.**
- `scripts/git/checkpoint-merge.sh` (`parallel-sessions:259`) + `scripts/generate_migration.py` (`parallel-sessions:472`) — both explicitly "no scripteado todavía / no existe / pendiente". Honest forward-refs, not silent phantoms.
- **NOT phantoms (false `test -e` from repo-root on basenames):** all `01-spec.md`/`07-merge.md`/`checkpoint.md`/etc. = per-story artifact refs; all cockpit libs (`lib/cap-badges.ts`, `lib/chris-input-parser.ts`, `app/api/stories/route.ts`, `lib/map-zones.ts`) **exist** under `tools/luana-cockpit/`; cap-deterministic's 13 "DEAD" hits are illustrative brand-relative cap paths (e.g. `capabilities/inbox/adrian-inbox.yaml`) inside example/backfill prose, not workspace-rooted file refs. The full-path load-bearing scripts (`resolve_cap.py`, `new_cap.py`, `validate_caps_schema.py`, `validate_code_cap_bidirectional.py`, `cap_doctor.py`, `mutation_gate.py`, `compute_capability_status.py`, `scan_harness_pointers.py`, `git/{new-session,cleanup-session,status-all,regenerate-manifest,push-wip}.sh`, `docs/specs/templates/{checkpoint,00-chris-input}-template.md`, `harness-refactor-w0.5/REQ-TAKING-DETAIL.md`) all resolve.

### one-SSoT / cohesion

- **`INDEX.md` COHESION GAP** — the process-doc index lists 12 of the 18 live docs but is **missing 5**: `cap-deterministic-enforcement.md`, `code-health-gate.md`, `continuous-improvement.md`, `contributing.md`, `tech-debt.md` (also no `harness-backlog.md` row though it's named in line 15's table). For an index whose job is "one place to find every process doc," omitting 5 live SSoTs is a cohesion miss. **W6 action:** add rows.
- **`continuous-improvement.md` + `tech-debt.md` = exemplary DIP/anti-dup** — both are explicit *routers/lanes* that point to their real homes (`harness-backlog.md`, `learning-capture.md` taxonomy, `cap_doctor.py`) and self-warn "❌ Crear un 5º store" / "no duplicar acá". No violations; cite as the model.
- **`lifecycle.md` correctly owns** the 4-eje model and declares supersession (L5) over `pm-redesign`/`release-protocol`/`capability-protocol` where they differ — clean cohesion, not a violation.
- **`ticket-states.md:6`** explicitly disambiguates ticket-states (12) vs the 10 macro story states — good (prevents the classic conflation).
- No cross-doc concern is *re-stated* (vs pointed-to). The hybrid docs each own a distinct concern (cap schema / cap-enforcement / checkpoint / chris-input / cockpit-perms / code-health / release / parallel-sessions / spine-rationale).

### {SLOTS} reconnaissance (charter §3 / PROCESS-MODEL §4 — for W5 wiring, not W6 rewrite)

Most-smeared slots across the hybrid set:
- **`brands[]`** — `vitalia/nicolify/comunify/lupulo` enum + `for B in` loops + `wip/{brand}` topology: capability-protocol, cap-deterministic (HARD-brand enum), checkpoint, chris-input, code-health, contributing, lifecycle (ports), parallel-sessions, release, spec-mapa-funcional, story-closure-gate.
- **`toolchain.{lint,format,typecheck,test,migrate}`** — `ruff/pytest/mypy/npx/.venv/alembic/jscpd/vulture/fallow/pip-audit/ci-parity`: checkpoint, code-health, contributing, parallel-sessions, release.
- **`engine_prefix`** — `core/luana-core-*`: capability-protocol, cap-deterministic, code-health, contributing, parallel-sessions.
- **`live_verify_infra`** (+ ports/dev-app/hipaa/phi) — capability-protocol (hipaa_lite), lifecycle (cc4 PHI), release (port 3002), story-closure-gate (vitalia case).
- **`design_system_ref`** — spec-mapa-funcional (SHELL-DESIGN-CONTRACT / design-system-canon), capability-protocol (`@luana/ui-kit` adjacency).
- **`agent_roster`** — capability-protocol + lifecycle (`lisa/valeria/adrián/lucas/camila/mateo` as cap dimension/box), ticket-states (model eligibility).
- **`locale`** — contributing (Spanish-neutro §).
- `value_stream` / `domain_modules[]` — incidental (cap `tech_module` examples); not a structural smear in this batch.

> **W6 doctrine reminder:** W6 does NOT wire the seam (that's W5). W6 = tag tier + add `{SLOTS}` markers to **templates** + conform the 3 LIVE-STALE docs + fix INDEX + strike/build the 2 self-flagged phantoms. The `core` set (6 docs + INDEX) is already proxy-clean → `leave-current-SSoT`.

### machinery-asserted (verified against `scripts/validate_machinery_consistency.py`)

| Doc | Asserted? | CHECK# (verbatim) |
|---|---|---|
| `cap-deterministic-enforcement.md` | Y | **CHECK 11** — cap-format determinístico G1-G6/G7 cableado (HB-51); doc named in its anti-rot pointer (L113) |
| `story-closure-gate.md` (the **rule**, not this process doc) | Y | **CHECK 13-18** — spine G/R/auditor (proceso v5 W2): G pausa-y-ofrece (13), `chris_verify`+`reconciled` schema (14), WIP-cap exime AWAIT_CHRIS_VERIFY (15), single `chris_verify` no `demo_signoff` (16), R reconcile marker (17), auditor precondición reconciled (18). **Validator targets `.claude/rules/story-closure-gate.md`, which is v5 — confirming the *process* doc lags.** |
| `continuous-improvement.md` | Y | **CHECK 22-24** — CIL 4-lane router (22: L1 backlog·L2 learnings·L3 tech-debt·L4 cap_doctor), /harnesses-improvement reads 4 lanes (23), learning-capture routes to lane / CIL no-fork (24). Also referenced by **CHECK 21** (mutation survivors → L4) |
| `tech-debt.md` | Y | **CHECK 22** (named as L3 home: `"tech-debt" in cil`) + **CHECK 21** (mutation_gate routes inherited survivors to L4/continuous-improvement) |
| `lifecycle.md` | Y (1 hit, incidental) | referenced in validator constant block; not a dedicated CHECK |
| `learnings.md` | Y (2 hits, incidental) | referenced as L2 home in CIL checks; not a dedicated assertion of this file's body |

**No machinery CHECK targets these process docs as load-bearing body strings** (unlike the rule `.claude/rules/story-closure-gate.md` for CHECK 13-18). So conforming the 3 LIVE-STALE process docs is **safe from the gate** (won't trip `make machinery-check`), but IS required for reader/operator coherence + W0.5 §6 checklist item 4 (one-SSoT) / item 1 (implements-its-WT).

---

## W6 action summary (by file)

- **conform-stale (3 LIVE-STALE):** `story-closure-gate.md` (add v5 G/R phases or repoint to rule SSoT) · `lifecycle.md:50` (WIP-cap per-worktree → per-`code:{module}`) · `spec-mapa-funcional.md:129` (`demo_signoff` → `chris_verify.signoff`, in G).
- **conform-stale (cohesion):** `INDEX.md` (add 5 missing rows + harness-backlog) · `chris-input-protocol.md:210` (strike or build `validate_chris_input.py` per lifecycle #9) · `release-protocol.md:178` / `lifecycle.md:202` (strike or build `generate_release_notes.py`).
- **add-{slots} (W6 marks, W5 wires):** capability-protocol, cap-deterministic, checkpoint, chris-input, code-health, contributing, lifecycle, parallel-sessions, release, spec-mapa-funcional, story-closure-gate (all `hybrid`).
- **leave-current-SSoT (✅ proxy-clean `core`):** cockpit-permissions, continuous-improvement, harness-lifecycle, tech-debt, ticket-states, INDEX (modulo the cohesion rows above) · `learnings.md` (append-only tombstone — never retro-conform).

*End RESEARCH-batch-P1.md — W6 process-docs (P1) classification.*
