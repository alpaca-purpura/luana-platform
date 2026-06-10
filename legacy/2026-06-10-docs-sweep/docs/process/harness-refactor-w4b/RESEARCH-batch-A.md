# W4b · Batch A — Capability / cap-ledger machinery (HB-51 4-ejes surface) · RESEARCH

**Date:** 2026-06-09 · **Session:** harness-refactor W4b (B-phase) research subagent, Opus · **Mode:** read-only classification + conformance audit (NO edits) · **Branch:** `wip/vitalia` (B-phase precedent HEAD).

> **North-star card (verbatim):** *This session succeeds only if (1) it implements its work-type per `PROCESS-MODEL.md`, AND (2) every file it tags `core` names ZERO tech/brand tokens (the rest went to the seam). The goal is an extractable `core-harness/`, not a nicer luana harness. Measured by the dependency-grep (§4) — the cheap W8.*

Batch = the 12 cap-machinery scripts (the heaviest process-conformance surface: 4-ejes Release→Story→Capability→Scenario, HB-51 8-layer deterministic enforcement). All consumers/paper-rules/proxy-hits verified on disk; nothing trusted from memory.

---

## 0 · Headline

- **12 scripts classified.** Tier shape mirrors W3/W4: **0 `core`** · **8 `hybrid`** · **3 `project`** · **1 `brand`**. Every script names ≥1 proxy token (brand enum / `.venv` / `pytest`/`fastapi`/`phi`/`alembic`) so **none earns `core`** under option-b. The portable IP is the *mechanism* (resolver two-way · derived-status state-machine · 9-gate dispatcher · scaffold generator · ledger schema); the project-half is the `brands[]` enum + capability-schema dimensions + PHI enforcement idioms + `.venv` path + `docs/product/capabilities/` layout — all → seam slots.
- **2 paper-rules** (both non-critical, docstring-only): `migrate_capability_ledger.py` cites a missing plan `.claude/plans/ok-lo-apruebo-realiza-cheeky-harbor.md`; `cap_doctor.py`/validator G8-G9 are documented nowhere in `cap-deterministic-enforcement.md` (doc lists G1-G7 only — doc-lag, the gates ARE real). Every executed sibling script + every cited test + the cap docs all resolve.
- **0 stale-vocab LIVE directives.** All `atomics` hits are either tombstones (docstrings marking it killed 2026-05-28) OR legitimate handling of **inert historical YAML data** that still lives in caps. The `outcome`/`outcomes` hits are the **scope-qualified platform exception** (W4 precedent): `render_friendly_status.py` reads PLATFORM `docs/product/BACKLOG.yaml` which legitimately still carries 6 `kind: outcome` items (purge was brand-docs only) — NOT stale.
- **1 orphan-ish + 1 one-shot:** `build_live_reconciliation_matrix.py` = no Makefile/hook/cockpit consumer (manual-only, brand-local vitalia, writes a TRACKED `.md`); `migrate_capability_ledger.py` = one-shot idempotent migration (wired in `make migrate-vitalia-schema`, fully migrated — dormant). Neither is dead, both are "live but not in a recurring gate."

---

## 1 · Master table

| Script | Purpose (1-line) | Consumer(s) | tier | proxy-hits | paper-rules | stale-tokens | conformance | orphan-verdict |
|---|---|---|---|---|---|---|---|---|
| `resolve_cap.py` | HB-51 Capa 1/5 — the SINGLE two-way resolver `cap_target↔cap_id` (resolve/resolve_cap_ids/canonical_cap_id/functional_area_of/cap_id_of) | `validate_code_cap_bidirectional`, `new_cap`, `generate_code_to_cap_index`, `cap_doctor` (imported) · pre-commit 05b · machinery CHECK 10/11 | **hybrid** | 1 (`vitalia.crm…` doc example) | none | none | **conformant** — implements cap-as-locator + HB-51 alias model (functional_area=area 1:N); 4-ejes Capability axis | LIVE (the SSoT of "which cap is this header"; 23 tests) |
| `cap_doctor.py` | HB-51 Capa 8 — one-shot health report (G1-G9 + schema + accuracy-debt advisory) | `make cap-doctor` · machinery CHECK 11 (existence) · cockpit `/api/capabilities/doctor` (via the JSON, not the script) | **hybrid** | 3 (`--brand vitalia` usage; "en vitalia" advisory note) | **doc-lag** (G8/G9 undocumented in `cap-deterministic-enforcement.md`) | none | **conformant** — reuses validator gates (one SSoT of drift); HB-57/58 accuracy = CIL L4 | LIVE (CLI + machinery-anchored) |
| `compute_capability_status.py` | derives `computed_status` per cap from scenario e2e-state-machine → `_status-computed.json` (gitignored R3) | cockpit `/api/capabilities/status` (reads JSON) · `build_live_reconciliation_matrix` (shells it) · DriftView | **hybrid** | 2 (`--brand vitalia` usage only) | none | none | **conformant** — scenario = unit of behavior (4-ejes Scenario axis); 8-state computed machine matches cockpit `ComputedStatusReport` contract | LIVE (cockpit producer) — **no Makefile target** (only cockpit + matrix shell it) |
| `reconcile_capabilities.py` | R32 — derive cap `status`/`stories_*` from story YAML; `--check` gate + coverage gate + ledger v2 validate + live⟹evidence WARN | pre-commit 05 (`05-r32-cap-story.sh`) + 05b · `make capability-ledger-check` · machinery (wraps) | **hybrid** | 7 (brand enum `vitalia nicolify comunify lupulo`, `.venv`, brand learnings paths) | none | **atomics = LIVE in `validate_ledger` Validation-2** (see §3.1 — *correct*, inert-data x-check, NOT a directive) | **conformant w/ caveat** — `--validate-atomics` flag already removed; `atomic_story_mismatch` still validates inert historical data | LIVE (pre-commit + make) |
| `new_cap.py` | HB-51 Capa 2 — GENERATOR; scaffolds schema-valid cap, REFUSE if exists | `make new-cap` · machinery CHECK 11 (existence) · cited by `pm-vitalia` F.3 / `capability-protocol.md` (Capa 6 repoint) | **hybrid** | 4 (`--brand vitalia`, `ADR-vitalia-005` in scaffold comment) | none | none | **conformant** — kills hand-authoring (deterministic format); `status: planned` default respects gate scoping | LIVE (make + skill-pointed) |
| `validate_caps_schema.py` | HB-51 Capa 3 — pydantic schema + STRICT dup-key loader (= cockpit gray-matter/js-yaml) | `make caps-schema-check` · imported by `new_cap`, `cap_doctor`, validator (G7) · machinery CHECK 11 | **hybrid** | 3 (`--brand vitalia`, "caps de comunify/nicolify" note) | none | none | **conformant** — strict-parse matches the REAL consumer (G7 anti-silent-invisible); enum tolerates partial/wip | LIVE (make + 4 importers + 13 tests) |
| `validate_code_cap_bidirectional.py` | cement 2026-05-28 + HB-51 — cross_check_3/4 + the 9 HARD gates G1-G9 (`run_cap_gates`) | pre-commit 05d/05e · pre-push §3/§4 · `make cap-gates` · cockpit `/api/capabilities/{bidirectional,doctor}` (JSON) · machinery CHECK 11 | **hybrid** | many (brand enum, PHI/`@require_phi_access`, FastAPI `Depends`, `def test`/pytest, "HARD para vitalia") | none | `cross_check 2 niveles (atomics killed…)` = tombstone (correct); `cross_check_1/2` absent (W4 already verified) | **conformant** — the 9-gate enforcement engine; cross_check_3 HARD, cc4 advisory→HARD-vitalia roadmap | LIVE (the central gate, both hooks + cockpit + 2 JSON producers) |
| `generate_code_to_cap_index.py` | grep `# cap:`/`// cap:` headers → `_code-index.json` (gitignored R3) + resolver-unified `resolved_cap_to_files` (Capa 5) | pre-commit 05c · cockpit `/api/capabilities/code-index` (JSON) · machinery CHECK 11 (resolver-unify) | **hybrid** | 1 (`--brand vitalia` usage) | none | `atomics killed 2026-05-28` = tombstone (correct) | **conformant** — header format per `lifecycle.md`; unifies the 2 conventions via resolver | LIVE (pre-commit + cockpit producer) |
| `generate_capability_index.py` | auto-gen user-facing `areas/{agent}.md` + `portfolio/{brand}-capabilities.md` (both gitignored R3) | `make capability-index{,-check,-all}` | **hybrid** | many (`VITALIA_AGENTS` roster hardcoded, `ADR-vitalia-005`, brand enum) | none | **`atomics` LIVE render L149-151** (`**Atomics:** {len}`) — renders inert historical data into MD (see §3.2 — minor stale rendering) | **partial** — `BRAND_AGENTS` only has `vitalia` (others "pendiente ADR"); the roster → `agent_roster` seam | LIVE (make only) — other brands silently skip (WARN) |
| `migrate_capability_ledger.py` | one-shot idempotent migration cap→schema v2 (atomics flat→v2, change_log seed, derives back-fill) | `make migrate-vitalia-schema` (sibling of `migrate_to_release_schema`) | **project** | 4 (`vitalia` default, `vitalia-…` id examples) | **1 — cites missing `.claude/plans/ok-lo-apruebo-realiza-cheeky-harbor.md`** | atomics flat→v2 conversion = LIVE but **migration target** (correct — its job IS to touch the historical field) | **conformant for its type** (WT-adjacent one-shot data migration; idempotent via `change_log` presence) | **one-shot, dormant** — migration done (`change_log` present everywhere ⇒ all skip); writes TRACKED report to `scripts/` (§3.4) |
| `render_friendly_status.py` | deterministic `/pm` "estado/panorama" template-fill from `BACKLOG.yaml` (cost-routing, no Opus) | `.claude-shared/skills/pm/SKILL.md` (BASH G8 invocation) | **project** | 1 (`.venv` in docstring) | none | **`outcome` LIVE L74-76 — NOT stale (platform scope)**; `legacy:` tag handling LIVE (forward-only) | **conformant** — reads PLATFORM `BACKLOG.yaml` (still has `kind: outcome`); 10-state vocab + caps correct | LIVE (pm SKILL BASH path; `.claude-shared` is the real PM home) |
| `build_live_reconciliation_matrix.py` | cap↔live-reality matrix v1 (shells compute + reads sweep findings → TRACKED `live-reconciliation.md`) | **NO Makefile/hook/cockpit consumer** — manual-only per story `vitalia-cockpit-live-reconciliation` | **brand** | many (`BRAND="vitalia"` hardcoded, `.venv`, vitalia-only sweep path) | none (its `# cap:` header + inputs all resolve) | none | conformant (brand-local tooling, `downstream-regression-na` declared) | **manual-only** (no recurring gate; the ONE `brand`-tier script — hardcoded single-brand) |

**Counts:** core 0 · hybrid 8 · project 3 · brand 1.

---

## 2 · Tier rationale (option-b proxy, per file)

The proxy was run by me over each body (`grep -nEi 'vitalia|nicolify|comunify|lupulo|ruff|pytest|mypy|alembic|clerk|next.js|tailwind|fastapi|sqlalchemy|core/luana-core|.venv|dev-app|hipaa|phi'`). **Every script returned ≥1 hit ⇒ none is proxy-clean ⇒ none `core`.** This matches the B-phase law (rules 18 core → skills 0 → agents 1 → hooks 5 → **scripts-capA 0**): the portable IP here is a *contract/mechanism*, the worker body is project-bound.

### The 8 `hybrid` (core mechanism + project-half → seam)

| Script | core half (portable mechanism) | project half → seam slot |
|---|---|---|
| `resolve_cap.py` | two-way token↔canonical-id resolution by identity-tier/area-tier; alias model; cache | `brands[]` (arg) + `docs/product/capabilities/{module}/{slug}.yaml` layout → `domain_modules[]`/layout; `WS` git-toplevel |
| `cap_doctor.py` | reuse-the-gates health-report aggregation + JSON/strict exit modes | `brands[]` (`--all-brands` iter); `.venv`-via-importers; HB-57/58 accuracy facet → `live_verify_infra.observability_evidence` |
| `compute_capability_status.py` | scenario→computed-status 8-state machine + cockpit JSON contract | `brands[]`; `docs/product/capabilities/` layout; e2e_test path resolution |
| `reconcile_capabilities.py` | story→cap derived-status pure fn + coverage/ledger gates | **hardcoded brand enum** `vitalia nicolify comunify lupulo` (`capability-ledger-check`), `config/brand.yaml` discovery, `.venv` |
| `new_cap.py` | scaffold-from-canonical-template generator + REFUSE-if-exists | the SCAFFOLD's v3 dimension fields (`agent_owner`/`functional_area`/`nature`) + `ADR-vitalia-005` → `design_system_ref`/capability-schema; `brands[]` |
| `validate_caps_schema.py` | pydantic identity+enum schema + strict-dup-key loader matching the real consumer | `VALID_STATUS`/`VALID_NATURE`/`FA_RE` (capability-schema dimensions) → seam; `brands[]` |
| `validate_code_cap_bidirectional.py` | the 9-gate dispatcher + cross_check_3 (scenario↔e2e) generic test-pattern detection | **PHI enforcement idioms** (`@require_phi_access`/`_assert_phi_access`/`require_brand_owner_access`/`_PHI_ROLES`) → `live_verify_infra`/PHI is **BRAND**; `brands[]`; FastAPI/pytest test patterns → `toolchain` |
| `generate_code_to_cap_index.py` | header-grep → index + resolver-unify (Capa 5) | `brands[]`; `backend/src`+`frontend/src` `.py/.ts/.tsx` layout → `toolchain` stack extensions |

### The 3 `project`

- `generate_capability_index.py` — the `VITALIA_AGENTS` roster + `BRAND_AGENTS` map is the **`agent_roster` seam** verbatim; only vitalia populated. The render mechanism is portable but the roster makes the whole script project-bound today.
- `migrate_capability_ledger.py` — a luana-specific one-shot data migration (schema v1→v2, atomics flat→dict). The migration mechanism is generic but the schema delta is luana's; defaults `vitalia`.
- `render_friendly_status.py` — reads luana's `docs/product/BACKLOG.yaml` shape + 10-state CAPS/EMOJI/LABEL. The 10-state vocab is CORE doctrine but the BACKLOG.yaml producer + cost-routing wiring is project; consumed by the project PM skill.

### The 1 `brand`

- `build_live_reconciliation_matrix.py` — **hardcodes `BRAND = "vitalia"`** + a vitalia-only sweep-findings path + writes to `vitalia/docs/domains/ops/`. Not config-driven (the `--brand` arg defaults vitalia but the module constant and the story-origin are vitalia). This is the rare genuine `brand`-tier (a per-brand reconciliation tool), unlike everything else where brand is config.

---

## 3 · Per-finding prose (file:line)

### 3.1 — `reconcile_capabilities.py`: `atomics` is LIVE but it's inert-data x-check, NOT a stale directive (verified correct)
- The docstring **correctly** tombstones it: L52-54 *"Atomics killed 2026-05-28 … The `--validate-atomics` flag was removed; `atomics[]`/`atomics_added` fields … are inert historical data left untouched."*
- But `validate_ledger` Validation-2 (L362-383, `category="atomic_story_mismatch"`) **still actively cross-checks** `atomics[].added_in_story` against `change_log[].story_id`. This is **NOT** a stale resurrection of the killed unit — it validates the consistency of *inert historical data that still physically lives in caps*. It only fires for caps that still carry `atomics[]` (legacy). `--validate-ledger` IS live-wired (`make capability-ledger-check` L264-267, pre-commit 05b references it). **Verdict: keep — correct handling of legacy data, not a directive that the unit-of-behavior is still `atomic`.** (Same class as W4's `15-cap-ledger.sh` atomics tombstone "left intact.")

### 3.2 — `generate_capability_index.py`: minor stale render of inert `atomics` (candidate cleanup, not a bug)
- L149-151 renders `- **Atomics:** {len(atomics)}` into the user-facing `areas/{agent}.md`. Since `atomics` is killed (unit of behavior = scenario), surfacing an "Atomics" count in a user-facing index is mildly anachronistic — but it only prints when the inert field is present, the output is gitignored R3, and it's a one-line cosmetic. **Verdict: low-priority W6/cleanup candidate, NOT a conformance break.** The bigger conformance gap is that the file emits NO `scenarios` count (the live unit) — the index predates the 4-ejes scenario axis.

### 3.3 — `render_friendly_status.py`: `outcome` is the scope-qualified platform exception (verified NOT stale — W4 precedent)
- L74-76 emit a `(outcome)` badge; L93 `_eligible` (and `_eligible`-gating in `render`) treats `kind == "outcome"` items specially (cap-excluded). The W0.5/4-ejes purge retired `outcomes/` **at the brand-docs level only**. The PLATFORM `docs/product/BACKLOG.yaml` (generated by `generate_backlog.py::read_outcomes` L228-234 reading `docs/product/outcomes/*.md`) **still contains 6 `kind: outcome` items** (verified). So `render_friendly_status` is correctly handling platform data that legitimately still has outcomes. **Verdict: NOT stale — leaving the outcome path is correct; ripping it would break the platform "estado" output.** (Identical to W4's `06-backlog.sh` `outcomes/` trigger ruling.)
- Note: the docstring (L4-7) says "/pm SKILL.md → invoca este script en lugar de Opus"; the real consumer is `.claude-shared/skills/pm/SKILL.md` (L105, L149 — BASH G8 cost-routing). `.claude/skills/pm/` is the thin alias-to-pm-luana; the executable PM template lives in `.claude-shared/`. Consumer verified present.

### 3.4 — `migrate_capability_ledger.py`: 1 paper-rule (missing plan) + tracked-report hygiene
- **Paper-rule:** docstring L15 cites `.claude/plans/ok-lo-apruebo-realiza-cheeky-harbor.md § Phase 3.4` → **file does not exist** anywhere. Non-critical (provenance ref in docstring; the migration logic doesn't read it). Candidate: repoint to a real SSoT or strike (it's a one-shot whose work is done).
- **Hygiene:** L532 writes `scripts/migrate-capability-ledger-report-{date}.json` to the **tracked** `scripts/` dir — one already committed (`scripts/migrate-capability-ledger-report-2026-05-27.json`, NOT gitignored). A one-shot migration leaving a dated report in tracked `scripts/` is minor clutter (W9/cleanup candidate; `--dry-run` skips the write).
- **Type-conformance:** it's a one-shot idempotent data migration (idempotency via `change_log` presence, L304). Wired in `make migrate-vitalia-schema` alongside `migrate_to_release_schema.py` (sibling verified present). Since vitalia is fully migrated, it's **dormant** (every cap skips). Not dead (re-runnable + the make target lives), but not in any recurring gate.

### 3.5 — `cap_doctor.py` + validator: G8/G9 are real gates undocumented in the SSoT (doc-lag, not phantom)
- `cap-deterministic-enforcement.md` documents G1-G7. The validator (`run_cap_gates` L914-926) + `cap_doctor` (`GATE_IDS` L59) ship **G8** (`user_visible_has_description`) + **G9** (`user_visible_has_scenario`) from "F2 cap-levels / HB-52/56" (their own docstrings L839, L877). The gates EXIST + run + are machinery-anchored (CHECK 11 iterates `gid in {G1..G7}` only — let me flag: machinery CHECK 11 may not assert G8/G9 — see §3.6). **Verdict: the SSoT doc lags the code (G8/G9 added later); not a paper-rule (mechanism is real), but a doc-update candidate for W6.**

### 3.6 — machinery CHECK 11 coverage of G8/G9 (flagged, not verified-failing)
- `validate_machinery_consistency.py` CHECK 11 (L326-334) iterates a gate set asserting `gate_g{N}` defined in the validator. From the grep it references gates by id but I did not confirm whether G8/G9 are in its asserted set or only G1-G7. **If CHECK 11 only checks G1-G7**, deleting G8/G9 would NOT trip the anti-rot gate (a latent paper-rule risk for the two newest gates). **Flagged for W4b/W10 owner to verify** (out of read-only scope to fix). Low risk (G8/G9 also have negative tests per their docstrings).

### 3.7 — `build_live_reconciliation_matrix.py`: the only true `brand` script + no recurring consumer
- L40 `WS = Path(__file__).parent.parent` (NOT git-toplevel like the others — works only when run from `scripts/`), L41 `BRAND = "vitalia"` module constant, L50 vitalia-only sweep-findings path, L351 writes a **TRACKED** `live-reconciliation.md` (not gitignored, unlike the other R3 outputs). It carries a `# cap: ops.live-reconciliation-sweep` header + `# story-origin: vitalia-cockpit-live-reconciliation` + `downstream-regression-na:` magic comment. **No Makefile target, no hook, no cockpit wiring** — invoked manually per its story. **Verdict: live-but-orphan-from-gates, brand-tier, single-brand-hardcoded.** Candidate for either (a) generalize `BRAND` to arg + gitignore the output (matrix is auto-gen), or (b) leave as a vitalia tooling artifact (W6/W7 decision).

---

## 4 · No-paper-rules ledger (`test -e` verified)

| Cited artifact | Exists? | Cited by |
|---|---|---|
| `scripts/resolve_cap.py` / `validate_caps_schema.py` / `validate_system_map.py` / `validate_code_cap_bidirectional.py` / `generate_backlog.py` | ✅ all | cross-imports |
| `scripts/tests/test_{resolve_cap,validate_code_cap_bidirectional,new_cap,validate_caps_schema,compute_capability_status}.py` | ✅ all | machinery CHECK 11 |
| `docs/process/{cap-deterministic-enforcement,capability-protocol,lifecycle}.md` | ✅ all | docstrings/Capa 6 |
| `docs/promotion-protocol/proposals/2026-05-16-capability-inventory-enforcement.md` | ✅ | reconcile coverage-gate |
| `vitalia/docs/architecture/ADR-vitalia-005-capability-model-4-dimensions.md` | ✅ | new_cap scaffold + capability-index |
| `scripts/migrate_to_release_schema.py` | ✅ | `make migrate-vitalia-schema` sibling |
| `docs/product/BACKLOG.yaml` (gitignored R3) + `scripts/generate_backlog.py` | ✅ | render_friendly_status |
| `vitalia/.../live-reconciliation/.sweep-findings.json` + `vitalia/docs/domains/ops/` | ✅ | build_live_reconciliation_matrix |
| **`.claude/plans/ok-lo-apruebo-realiza-cheeky-harbor.md`** | ❌ **MISSING** | migrate_capability_ledger docstring (§3.4) |

Plus a **doc-lag** (not a missing-mechanism paper-rule): G8/G9 gates exist in code but absent from `cap-deterministic-enforcement.md` (§3.5).

---

## 5 · Consumer wiring summary (verified, not self-description)

- **pre-commit checks:** 05 (`reconcile`), 05b (`reconcile --validate-ledger` advisory + `resolve_cap`), 05c (`generate_code_to_cap_index`), 05d/05e (`validate_code_cap_bidirectional` + `--cap-gates-hard`).
- **pre-push:** §3/§4 source `validate_code_cap_bidirectional` (cap-gates HARD for `CAP_GATES_HARD_BRANDS`).
- **Makefile:** `new-cap`, `caps-schema-check`, `cap-gates`, `cap-doctor`, `capability-index{,-check,-all}`, `capability-ledger-check`, `migrate-vitalia-schema`, `releases-vitalia`. (No target for `compute_capability_status` or `render_friendly_status` or `build_live_reconciliation_matrix`.)
- **cockpit (reads the gitignored JSON, never shells the script):** `/api/capabilities/{status,bidirectional,code-index,doctor}` → consume `_status-computed.json` / `_bidirectional-validation.json` / `_code-index.json`. `compute_capability_status` is invoked only by `build_live_reconciliation_matrix` (shell) + manually; its cockpit visibility is via the JSON. **CORE = the read-schema (the JSON shape); render = PROJECT (cockpit) — matches PROCESS-MODEL §7.**
- **machinery (`validate_machinery_consistency.py`):** CHECK 10 (resolve_cap exists + cap-as-locator cable) · CHECK 11 (resolver two-way + new_cap/validate_caps_schema/cap_doctor exist + gates defined + generate_code_to_cap_index resolver-unify) · CHECK 22 (CIL L4 → cap_doctor router).
- **PM skill:** `render_friendly_status` ← `.claude-shared/skills/pm/SKILL.md` (BASH G8).

---

## 6 · Process-conformance verdict (PROCESS-MODEL §6 checklist)

All 12 implement the **4-ejes Capability/Scenario axes** correctly: `scenario` is the unit of behavior (compute/validator/index all key off `scenarios[].e2e_test`); `atomics` is consistently treated as **dead unit + inert data** (no LIVE directive resurrects it as the behavior unit). No script hardcodes the OLD 4-story-type set, the A-F letter phases, `phase_workflow`, `02-design-ui`, `demo_signoff`, or `blocked` as a state. The HB-51 deterministic-enforcement doctrine (resolver-single-SSoT, generator-not-hand-author, 9 HARD gates, schema=real-consumer-strict) is faithfully implemented across `resolve_cap`/`new_cap`/`validate_caps_schema`/`validate_code_cap_bidirectional`/`cap_doctor`/`generate_code_to_cap_index`. The single conformance *gap* is **age, not staleness**: `generate_capability_index` (and to a lesser degree the matrix) predate the scenario axis and still surface `atomics` counts / lack scenario counts (§3.2) — a W6 modernization, not a W4b stale-token fix.

---

## 7 · Deferred / for downstream WS

- **Seam wiring (W5):** the recurring `brands[]` enum (reconcile L266, generate_capability_index `BRAND_AGENTS`, build_matrix const), the capability-schema dimensions (`VALID_STATUS`/`FA_RE`/scaffold v3 fields), the PHI idioms (validator cross_check_4 → BRAND), the `agent_roster` (generate_capability_index `VITALIA_AGENTS`), `.venv`/`toolchain`, `docs/product/capabilities/` layout. The single biggest extractability blocker is the **capability-schema + agent-roster** being baked into `new_cap`/`generate_capability_index`/`validate_caps_schema`.
- **W6 (docs/templates):** update `cap-deterministic-enforcement.md` to document G8/G9 (§3.5); modernize `generate_capability_index` to emit `scenarios` not `atomics` (§3.2); repoint/strike the missing `cheeky-harbor.md` plan ref (§3.4).
- **W9/W10 hygiene:** decide `build_live_reconciliation_matrix` fate (generalize `--brand` + gitignore output, or keep brand-tooling); the tracked `migrate-capability-ledger-report-*.json` in `scripts/` (§3.4); verify machinery CHECK 11 covers G8/G9 (§3.6).
- **W7 physical move:** 0 → `core-harness/` (no proxy-clean script); 8 hybrid split (mechanism→core, runner→project); 3 project + 1 brand → `project-profile/` resp `brands/vitalia/`.

---

## 8 · Pointers
- `docs/process/harness-refactor-charter-2026-06-08.md` §0.5 (option-b proxy), §3 (seam), §4 (fitness).
- `docs/process/harness-refactor-w0.5/PROCESS-MODEL.md` §2 (spine), §3 (WT cards), §5 (one-SSoT / outcomes-purge-scope), §6 (conformance), §7 (cockpit read-schema=core).
- `docs/process/cap-deterministic-enforcement.md` (HB-51 — the 8 layers these scripts implement; G1-G7 documented, G8/G9 doc-lag).
- `docs/process/harness-refactor-w4/W4-OUTPUT.md` (B-phase precedent: outcomes scope-qualified, propagation-grep, validate-after-apply).

*End RESEARCH-batch-A.md — 12 scripts classified · 2 paper-rules · 0 stale LIVE directives · 1 brand-orphan-from-gates + 1 dormant one-shot. Read-only; no edits applied.*
