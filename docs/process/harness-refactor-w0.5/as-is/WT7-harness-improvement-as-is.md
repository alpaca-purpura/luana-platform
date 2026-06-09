# WT7 — Harness Improvement (dev-OS continuous improvement) · AS-IS map

> **Scope:** W0.5 (Process Model, operator POV) · AS-IS reconstruction of WT7 from the charter `docs/process/harness-refactor-charter-2026-06-08.md` §1.5 (the SECOND process — the dev-OS improving itself; dogfood/self-hosting). **Owner:** `/pm-luana`. **Charter maturity tag:** "mature; needs unified cockpit view" (charter:47) — **this AS-IS finds that claim partly STALE: the unified cockpit view already exists** (see §6).
>
> Every path below verified on disk (cwd `/home/chalreme/Proyectos/luana-vitalia`). Citations are `file:line`.

---

## 1. Definition (one line)

WT7 = **the harness improving ITSELF** — a deficiency noticed mid-work is captured frictionlessly → lands in a backlog/ledger → batch-remediated in a dedicated session → applied/verified, **never mid-feature**. The dev-OS is treated as its own product you maintain (`harness-lifecycle.md:3` "tus herramientas son un producto que mantenés"). Two named mechanisms: **HLP** (Harness Lifecycle Process — the cadence + apply-pipeline) and **CIL** (Continuous Improvement Ledger — the 4-lane router that consolidates where each improvement lives).

This is the **self-hosting / dogfood case**: the harness uses its own lifecycle discipline (capture → ratify → apply → verify) on itself. The charter (`charter:165`) makes this an invariant — "the charter and its outputs obey their own principles."

---

## 2. Lifecycle states

### 2.1 The HLP item lifecycle (5 states · `harness-lifecycle.md:15-20`)

```
reported → triaged → ratified → applied → verified
```

| State | Meaning | Who sets it | Source |
|---|---|---|---|
| `reported` | captured, untriaged | the capture (`/harness-issue`) | `harness-lifecycle.md:20`, `harness-issue/SKILL.md:22` |
| `triaged` | classified (severity → route) | the triage pass (Claude classifies) | `harness-lifecycle.md:20` |
| `ratified` | Chris approved the fix, not applied yet | Chris | `harness-lifecycle.md:20`, `harness-backlog.md:5` |
| `applied` | committed but effect not separately exercised (typical for doc staleness) | apply-pipeline | `harness-lifecycle.md:20`, `harness-backlog.md:5` |
| `verified` | effect confirmed live / re-read independently (not "gate green" — *exercised*) | re-read / live | `harness-lifecycle.md:20`, `harness-backlog.md:5` |

Plus a 6th out-of-band state used in practice: **`deferred`** (registered but parked — e.g. HB-11, HB-24). The cockpit parser treats `deferred` as a first-class column (`harness-backlog.ts:30`, `HarnessView.tsx:37`).

> **Contradiction (see §8):** the `/harness-audit-2026` workflow's findings schema uses a DIFFERENT state vocabulary — `severity: LOW/MEDIUM/HIGH` (`harness-audit.js:62`) — not the HLP 5-state `reported→verified`. The audit produces a *catalogue*, not backlog rows; its output feeds L1 where it gets re-stated into HLP states. Two vocabularies coexist by design but are never cross-walked in one doc.

### 2.2 The severity → route map (`harness-lifecycle.md:24-30`)

| Severity | Route |
|---|---|
| 🔴 silent-killer (breaks silently) | **immediate fix + commit** (the ONE documented exception to "never mid-work") |
| 🟡 quick-win (mechanical) | next **batch** |
| 🔵 decision (needs Chris criterion) | **ratification queue** (D-1..D-N style) |
| 🟣 wave (large/structural) | **dedicated workflow** in a fresh session |

Same 4-emoji severity is the backlog's `sev` column (`harness-backlog.md:11`) and the `/harness-issue` inference list (`harness-issue/SKILL.md:15-20`).

### 2.3 The 4 CIL lanes — WHERE each item routes (`continuous-improvement.md:13-18`)

The CIL is **a router/index, NOT a 5th store** (`continuous-improvement.md:5`). Each lane lives in its **existing home** (DIP — depends on `learning-capture.md` taxonomy, never forks it):

| Lane | What | Home (SSoT — NOT duplicated in the CIL) | Fed by |
|---|---|---|---|
| **L1 · harness** | process/tooling → reinforce skill/rule/agent/hook/template/cockpit | **`docs/process/harness-backlog.md`** (HB-N, captured via `/harness-issue`) | daily use + audit |
| **L2 · product / skills-arch** | product learning → skills/architecture/domain docs | **`docs/learnings/{date}-{slug}.md`** (technical ≥2 brands) · **`{brand}/docs/learnings/`** (business) · `docs/process/learnings.md` (process) — `learning-capture.md` taxonomy | `L · story-closure` routes |
| **L3 · tech-debt** | pure code/infra debt | **`docs/process/tech-debt.md`** (TD-N, append-only) | dev / auditor |
| **L4 · capability-desfasada** | caps with stale rules, now drifted | **auto-detect** (NOT hand-written): `scripts/cap_doctor.py` + caps pre-cement-date + mutation-gate survivors (`scripts/mutation_gate.py`) | auto |

Routing on story-closure (`continuous-improvement.md:27-32`, mirrored in `learning-capture.md:18`):
- process/tooling friction → **L1** (`/harness-issue` → harness-backlog)
- product/architecture learning → **L2** (`learning-capture.md` canonical path)
- code/infra debt → **L3** (`tech-debt.md`)
- stale cap detected → **L4** (auto — never hand-written)

### 2.4 Two cadences: the weekly stop vs the deep-sweep

| Mechanism | What it is | Trigger | Edits? |
|---|---|---|---|
| **Weekly stop** `/harnesses-improvement` | reads the 4 lanes, shows them (reuses the `/harness` cockpit board), Chris remediates in batches via apply-pipeline | weekly or on demand | NO — reads + remediates via apply-pipeline (`harnesses-improvement/SKILL.md:22-28`) |
| **Deep-sweep** `harness-audit-2026` (workflow JS) | exhaustive enumerate→audit→synthesize against verified CC schemas; produces a ratifiable catalogue | invoked **only via** the weekly stop, "when it smells like drift" (`harnesses-improvement/SKILL.md:29-37`) | **NO — produces catalogue, does not edit** (`harness-audit.js:12`, `:130` "NO edita") |

HLP cadence table (`harness-lifecycle.md:32-38`): daily = capture only · session-close = silent-killer fix · ~every 10 sessions/weekly = triage + batch-apply · monthly/quarterly = full `/harness-audit-2026`.

---

## 3. Actors / skills

| Actor | Role in WT7 | Surface (file:line) |
|---|---|---|
| **`/harness-issue`** (skill, `model: haiku`) | frictionless capture → appends ONE row to harness-backlog with `reported`. **Capturer, not fixer** — never fixes, never `git add .` | `harness-issue/SKILL.md:1-31` |
| **`/harnesses-improvement`** (skill, owner `/pm-luana`) | the weekly STOP — reads 4 lanes, shows board, batch-remediates. Renamed from `/mejora-semanal` | `harnesses-improvement/SKILL.md:1-53` |
| **`harness-audit-2026`** (Workflow JS, NOT a skill) | the deep-sweep engine — multi-agent enumerate(haiku)→audit(sonnet)→synthesize(opus), produces catalogue | `.claude/workflows/harness-audit.js:10-18`, reachable only via the stop (`:5`) |
| **The auditor reflex** (feeder) | auto-hardening: when `/auditor` detects a skipped Critical-Rule gate, it auto-appends an HB entry + (≥2× pattern) a learning, BEFORE closing turn — closes the loop without Chris noticing manually | `auditor-self-fix-policy.md:29-32`, `auditor/SKILL.md:709-742`, DoD layer #11 `definition-of-done-live-verify.md:259` |
| **The DoD reflex** (feeder) | same reflex, cited as enforcement layer #11 of Rule #37 ("auditor y dev-team/pm que detecta un gate saltado MUST auto-capturar HB + learning") | `definition-of-done-live-verify.md:259` |
| **`learning-detect.sh`** (hook, advisory feeder) | post-Edit/Bash suggests captures (Trigger 2 of learning-capture, never captures without Chris ratify) | `.claude/hooks/learning-detect.sh` (exists), `learning-capture.md` Trigger 2 |
| **dev-team / auditor** (L3 feeders) | append tech-debt L3 entries on story-close | `tech-debt.md:3`, `continuous-improvement.md:18` |
| **`cap_doctor.py` + `mutation_gate.py`** (L4 auto-feeders) | auto-detect stale caps + inherited survivors — no human writes L4 | `scripts/cap_doctor.py`, `scripts/mutation_gate.py` (both exist) |
| **Chris** | the ONLY ratifier + operator — decides, approves every diff, marks applied/verified. No external review (`harness-lifecycle.md:62-66`) | `harness-lifecycle.md:64` |
| **Claude** | auditor + applier (audits, proposes, batch-applies, verifies); counterweight = catalog+propose + REAL verification | `harness-lifecycle.md:65` |

Cost-routing (`harness-lifecycle.md:60`, mirrored in `harness-audit.js:14-17`): **haiku** enumerates/commits · **sonnet** edits/audits · **opus** synthesizes + verifies the diff + ratifies with Chris.

---

## 4. Gates (the rules with teeth)

| Gate | What it enforces | file:line |
|---|---|---|
| **Regla de oro — NEVER mid-feature** | every harness change = dedicated batch/session, never editing a skill mid-product-feature (origin: voseo-en-línea-1 bug) | `harness-lifecycle.md:46-48`, restated `harnesses-improvement/SKILL.md:10,41`, charter `:11`/`:133` |
| **Verify-first — la auditoría SOBREESTIMA** | every catalogue finding is verified against the REAL FS BEFORE touching anything; overestimates are explicitly recorded (Chris wants them tracked as catalogue-quality signal) | `harness-lifecycle.md:54`, evidence in backlog ("verify-first") e.g. `harness-backlog.md` HB-19/HB-27/HB-35 |
| **Catalog+propose + Chris ratifies** | nothing commits without Chris's ✓ (cardinal HLP rule) | `harness-lifecycle.md:48,57` step 4 |
| **Ratifiable batches** | loop per **ratifiable chunk** — one diff = one ratification | `harness-lifecycle.md:52` |
| **Disjoint-batch edits, no commit, no `isolation:worktree`** | edits land in the hub working tree so the `git diff` is reviewable | `harness-lifecycle.md:55` step 2 |
| **Independent orchestrator verification (opus)** | review the REAL `git diff` + spot-check the sub-agents' factual claims — DO NOT trust their report | `harness-lifecycle.md:56` step 3 |
| **Commit-by-pathspec, delegated to Haiku** | `git commit <exact-paths>` (NEVER `git add .`/`-A`), `SCOPE_GATE_SKIP=1` with reason in body, no `--no-verify`, non-fast-forward → STOP | `harness-lifecycle.md:58` step 5, `:48` |
| **machinery-check 0 regressions** | the weekly-stop apply-pipeline requires `make machinery-check` green before ratify | `harnesses-improvement/SKILL.md:26,43` |
| **Anti-rot pointer gate (CHECK 28, ADVISORY)** | shrink-only baseline ratchet — a NEW broken harness pointer warns (does not block); fix or `--update-baseline` | `scripts/validate_machinery_consistency.py:670-699`, `scripts/scan_harness_pointers.py`, `scripts/machinery/harness-pointer-baseline.txt` (HB-66) |

**The apply-pipeline (the 5 steps · `harness-lifecycle.md:50-58`):** (1) verify-first · (2) edit in disjoint batches via workflow JS, no commit · (3) independent opus diff-verification · (4) present diff → Chris ratifies · (5) commit-by-pathspec via Haiku. **This is the canonical "batched ratifiable remediation"** the W0.5 prompt asks about.

---

## 5. Artifacts

| Artifact | Role | Path (verified) |
|---|---|---|
| **`harness-backlog.md`** | L1 lane / HB-N tracker (the heart; "captura sin fricción"). HB-1..HB-66 today | `docs/process/harness-backlog.md` (125 lines, last id HB-66) |
| **`tech-debt.md`** | L3 lane / TD-N register (append-only; currently empty placeholder row) | `docs/process/tech-debt.md` |
| **`docs/learnings/**` + `{brand}/docs/learnings/` + `docs/process/learnings.md`** | L2 lane — learning .md files (taxonomy = `learning-capture.md`) | exist |
| **`continuous-improvement.md`** | the CIL SSoT (4-lane router model) | `docs/process/continuous-improvement.md` |
| **`harness-lifecycle.md`** | the HLP SSoT (cadence + apply-pipeline + roles) | `docs/process/harness-lifecycle.md` |
| **The audit catalogue** | `harness-audit-2026` output → a ratifiable markdown catalogue (e.g. `harness-audit-2026-06-01.md`) feeding L1 | `harness-audit.js:130` returns `catalog_markdown`; `docs/learnings/tooling/harness-audit-2026-06-01.md` (referenced `harness-lifecycle.md:86`) |
| **CC-schema baseline** | verified Claude-Code schema snapshot the audit checks against | `docs/learnings/tooling/claude-code-2026-capabilities.md` (referenced `harness-lifecycle.md:87`), embedded `SCHEMA_*` in `harness-audit.js:20-26` |
| **Charter feedback loop** | playbook step 7 routes cohesion/coupling/SOLID learnings back into the charter | `charter:121,165` |
| **MEMORY pointers** | pointer-only index entries (e.g. `harness-lifecycle`, `repo: docs/process/harness-lifecycle.md`) | MEMORY.md (in context) |

---

## 6. Cockpit view — the `/harness` board

**Finding: the cockpit ALREADY unifies all 4 CIL lanes** — the charter's "needs unified cockpit view" (`charter:47`) is **stale** (the charter is dated 2026-06-08; the unified view shipped earlier, HB-26 `verified` + the CIL franja).

What's visible (verified):
- **Route + view:** `/harness` titled "Harness · CIL · 4 carriles · read-only" (`HarnessView.tsx:258-261`).
- **4-lane franja** (top-of-page panorama, `HarnessView.tsx:271-283`): **L1** (harness open count, amber) · **L2** (learnings count, sky, → `/learnings`) · **L3** (tech-debt open count, rose) · **L4** (caps desfasadas, violet, → `/drift`).
- **L1 kanban board** by HLP state (reported→verified + deferred columns) with per-column tooltips + severity emoji (`HarnessView.tsx:315-329`, `:93-141`).
- **L3 kanban board** (tech-debt, same lifecycle shape) (`HarnessView.tsx:331-348`).
- **L2 + L4** rendered as chips/links to their own views (`/learnings`, `/drift` both exist: `tools/luana-cockpit/app/learnings/page.tsx`, `tools/luana-cockpit/app/drift/page.tsx`).
- **Aggregating API** `/api/cil` (`tools/luana-cockpit/app/api/cil/route.ts:64-101`) — "monitor único" reading L1 (`harness-backlog.md`) + L3 (`tech-debt.md`) items, L2 markdown count, L4 link.
- **Nav placement:** a **transversal "core" section** (`Sidebar.tsx:38-40,116` "Transversal · core") with a **live badge** = open CIL items (L1+L3) (`Sidebar.tsx:72,83,123`). Read-only: the `.md` stays SSoT, capture/transition is HLP's job (`route.ts:13`, `harness-backlog.ts:7-9`).

What's **missing / partial** (real gaps, not the stale charter claim):
- **L2 is count-only** (a number + link), **L4 is link-only** (no in-board items) — the franja shows L1+L3 as kanbans but L2/L4 are not boardified in `/harness` itself (`route.ts:89-94`, `HarnessView.tsx:350-360`). So the "single monitor where nothing goes unwatched" is true at the *panorama* level but only 2 of 4 lanes are operable in-place.
- **No badge for CIL lane on the L1 cards** despite the model saying the board is "extendido con badge de carril" (`continuous-improvement.md:38`, `harness-backlog.md:6`) — the cards show severity + state, not a lane tag. The `[L1]` tag convention (`harness-backlog.md:7`) is optional and unrendered.
- The cockpit is built/committed (`tools/luana-cockpit/{components/harness,app/api/cil,lib/tech-debt}` all tracked) but lives **inside the project tooling** — its read-schema (parser contract) is a core candidate, render is project (see §7).

---

## 7. Core-vs-Project split candidate — THE SELF-HOSTING CASE

The charter (§1.5, charter:34) is explicit: WT7 is the second modeled process, and the harness **self-hosts** it. The split is the subtle part:

| Element | Tier | Why |
|---|---|---|
| **The HLP mechanism** (capture→backlog→ratifiable-batch→apply pipeline + 5-state lifecycle + never-mid-feature + verify-first) | **CORE** | tech/domain-agnostic doctrine for maintaining ANY agent-harness. Any product adopting `core-harness/` inherits HLP to maintain its own copy. `harness-lifecycle.md` names no brand/tech in its mechanism. |
| **The CIL 4-lane router model** (L1/L2/L3/L4 + routing rules + weekly-stop ritual) | **CORE** | the consolidation pattern is generic; it's a router over lane-homes, DIP-clean (`continuous-improvement.md:5`). |
| **`/harness-issue`, `/harnesses-improvement` skills + `harness-audit-2026` workflow** | **CORE** (generic skeleton) | the capture/stop/deep-sweep *machinery* is product-agnostic — BUT see leaks below. |
| **The cockpit `/harness` read-schema** (parser contract `HarnessItem`/`TechDebtItem`, the 5-state + 4-lane shape) | **CORE contract** | charter `:70` "cockpit renders the CORE read-schema". The shape is generic. |
| **The cockpit render** (`HarnessView.tsx`, `/api/cil`, Sidebar) | **PROJECT tooling** | charter `:70` — `tools/luana-cockpit/` is project tooling that renders the core schema. |
| **The backlog CONTENT** (HB-1..HB-66 about luana: vitalia containers, Clerk, pnpm-lock, dev-app tunnels) | **PROJECT (instances)** | these are luana-specific issue instances, not the mechanism. |
| **L2/L4 lane homes** (`docs/learnings/` paths, `cap_doctor.py`, `mutation_gate.py`) | **PROJECT** (the home paths) / **CORE** (the routing rule) | the *rule* "stale cap → L4 auto-detect" is core; the *detector scripts* + brand learning paths are project. |

**The crisp formulation (answers the prompt's special note):** the **mechanism = CORE** (any product inheriting `core-harness/` gets HLP+CIL to maintain it — the harness-improvement process is inherently part of the reusable IP); the **instances = PROJECT** (HB content, learning files, cap-doctor detections are luana-specific). This is the cleanest dogfood example of the dependency rule: the dev-OS's self-maintenance process is exactly the kind of thing the extracted core must carry, while its accumulated luana backlog stays behind.

**Tech leaks to push out in W5/W7 (DIP violations):** the deep-sweep hardcodes luana in its enumeration — `harness-audit.js:102` loops `{vitalia,nicolify,comunify,lupulo}` brand dirs and `:104-106` names `tools/luana-cockpit`, `docs/architecture/luana-platform`. These must read the `brands[]` + `engine_prefix` + cockpit-path seam slots (`charter:84-90`).

---

## 8. Scatter / contradiction / gap findings

1. **[STALE CHARTER CLAIM]** Charter `:47` tags WT7 "needs unified cockpit view" — **already built** (`HarnessView.tsx` CIL franja + `/api/cil` + HB-26 `verified` in `harness-backlog.md`). The charter's §1.5 line `:49` ("never consolidated into one operator-walked model") is true for the *process docs*, but the *cockpit visibility* it lists as a W0.5 deliverable is largely done. W0.5 should re-scope WT7 from "build the view" to "boardify L2/L4 in-place + add lane badges".

2. **[CIL not-fully-unified in-place]** `/harness` shows L1 + L3 as kanbans but **L2 is count-only and L4 is link-only** (`route.ts:89-94`). The model promises "nada queda sin vigilar" (`HarnessView.tsx:264`) but only 2/4 lanes are operable on the page; the other 2 bounce to `/learnings` and `/drift`. Gap, not bug.

3. **[Two state vocabularies, never cross-walked]** HLP lifecycle = `reported→triaged→ratified→applied→verified` (`harness-lifecycle.md:15`) but the deep-sweep findings schema = `severity LOW/MEDIUM/HIGH` (`harness-audit.js:62`) and the synth catalogue has no state column. The catalogue→backlog hand-off (audit output "alimenta L1") is asserted (`harness-audit.js:6`, `harnesses-improvement/SKILL.md:37`) but the *mapping* from a catalogue finding to an HB-N row + its initial state is undocumented — a human re-states it.

4. **[Naming residue `/mejora-semanal`]** the old name survives in 4 files (`harnesses-improvement/SKILL.md:3` "Reemplaza al naming /mejora-semanal", plus `process-coherence-v5-2026-06.md`, `harness-backlog.md`, `REVIEW-process-v5.md`). Cosmetic but a discoverability/grep trap.

5. **[`harness-audit-2026` is a workflow, not a skill — the prompt's own assumption was wrong]** there is **no `.claude/skills/harness-audit-2026/` dir**; it's `.claude/workflows/harness-audit.js` with `meta.name: 'harness-audit-2026'` (`harness-audit.js:11`). The filename↔meta.name mismatch was itself an HB item (HB-20, `applied`). It is reachable ONLY via `/harnesses-improvement` (`harnesses-improvement/SKILL.md:37`), not as a loose command — intentional, but means there's no top-level skill entry for it (it won't appear in a skill scan).

6. **[Apply-pipeline lives in TWO docs, lightly diverged]** the canonical 5-step apply-pipeline is in `harness-lifecycle.md:50-58`; `/harnesses-improvement/SKILL.md:26` restates a 6-bullet version that ADDS `make machinery-check 0 regresiones` (not in the HLP §6 list). High-cohesion smell (charter `:106` "1 SSoT per concern"): the weekly-stop skill silently extends the pipeline. Reconcile into one SSoT.

7. **[L3 is an empty placeholder]** `tech-debt.md:18` has only a "(sin deuda L3 registrada todavía)" row — the lane exists but is unused; dev/auditor append-on-close (`tech-debt.md:3`) hasn't fired. Either the routing isn't happening or no qualifying debt arose. Worth confirming the feeder actually runs at story-close.

8. **[Backlog drifts about itself]** HB-27 was marked done-as-overestimate because "el backlog decía 'NO arrancado' = drift del propio backlog" (`harness-backlog.md:HB-27`). The L1 store is hand-maintained and has self-drifted ≥1×; verify-first exists precisely because the catalogue (and the backlog) over/mis-state. Mechanism is sound but the SSoT needs the cockpit (read-only) as ground-truth, which it now has.

9. **[CIL = "consolidates, not a 5th store" but adds a 5th *view*]** `continuous-improvement.md:5` insists the CIL is a router not a store; the cockpit then materializes a `/api/cil` aggregate (`route.ts`) — a read-only projection, consistent with the rule, but worth tagging that the "single monitor" is itself a (read-only) consolidation surface that must not become a writeable 5th store.
