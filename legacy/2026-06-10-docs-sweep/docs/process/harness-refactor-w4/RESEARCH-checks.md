# W4 Research — git-hooks checks/ + pre-push (READ-ONLY analysis)

> Subagent research for W4 harness-refactor. Two lenses: (1) **process conformance** (real mechanism, ratified-v5 vocab) · (2) **extractability** (`tier:core` earned only with ZERO tech/brand tokens). Repo: `/home/chalreme/Proyectos/luana-vitalia`. Date: 2026-06-09.

## How the dispatcher works (context)

`scripts/git-hooks/pre-commit` is the god-file dispatcher. It computes `GATE_LEVEL` from the branch:
- `wip/*` → **light** (sections 1-3 + any check with no `full` guard: 5b, 5c, 5d, 5e, 10, 11(no-op off-main), 12, 13, 14, 16, 17, 18)
- `main | release/* | detached/unknown` → **full** (all)

It `export`s `GATE_LEVEL CURRENT_BRANCH`, derives `STAGED_PY/TS/MD`, `ALL_TEXT_STAGED`, then **sources** each `checks/NN-*.sh`. Each check inherits that env under `set -euo pipefail`; an `exit 1` aborts the commit. Checks have **no shebang** and **no `set -e`** by design.

Token list used for the tier proxy (any hit ⇒ NOT core): `vitalia·nicolify·comunify·lupulo·saasora·inmoflow·retailly·fixia·guestly·fitflow·ruff·pytest·mypy·alembic·clerk·next·tailwind·fastapi·sqlalchemy·core/luana-core·.venv·dev-app·hipaa·phi·PHI·sales_agent·@require_phi_access`.

---

## Per-file table

| File | What it does | GATE | Cited artifacts (exists?) | Stale patterns | tech/brand tokens | TIER | fail-OPEN + ACK override |
|---|---|---|---|---|---|---|---|
| **02-voseo.sh** | Blocks voseo on added lines of user-facing `.py/.ts/.tsx` (skips harness/docs/tests/sales_agent voice). | no guard (effectively light+full; only uses `ALL_TEXT_STAGED`) | `.claude/rules/spanish-text.md` ✅ | none | `modules/sales_agent/*` (×6 path patterns), `.j2` | **hybrid** — core doctrine (neutro-LatAm) but hardcodes `sales_agent` voice-exception paths | magic-comment `# voseo-allowed` (per-file escape); NO env ACK |
| **03-ruff.sh** | Ruff `check` + `format --check` on staged backend/core Python (stdin from `git show :file`). | no guard (runs light too) | `${REPO_ROOT}/.venv/bin/ruff` ✅, fallback `backend/.venv/bin/ruff` | none | `ruff`, `.venv`, `core/luana-core-*`, `{brand}/backend` regex | **project** — entirely ruff/venv/brand-path specific | fail-OPEN (warn+skip if ruff missing); NO env ACK |
| **04-r3-ssot.sh** | New file under shared/engine surface must be in downstream-regression SSoT table OR carry `# downstream-regression-na:`. | **full** | `.claude/rules/auditor-downstream-regression.md` ✅ | none | `core/luana-core-*`, `{brand}/backend`, `.venv` (none here but path regex brand) | **hybrid** — core doctrine (downstream-regression freshness) + project paths/table | magic-comment `# downstream-regression-na:`; fail-OPEN if table missing; NO env ACK |
| **05-r32-cap-story.sh** | Runs `reconcile_capabilities.py --check [--brand B]` on staged caps/stories; block on drift. | **full** | `scripts/reconcile_capabilities.py` ✅; `.venv/bin/python` ✅ | none | `.venv`, brand path regex | **hybrid** — thin wrapper over `reconcile_capabilities.py` (real mechanism) + brand routing | fail-OPEN (warn+skip if venv/script missing); NO env ACK |
| **05b-cap-advisory.sh** | wip/* light: advisory reconcile + **HARD** block if checkpoint `cap_change_type∈{new,extend}` w/o cap YAML staged (accepts cap already in HEAD via resolve_cap). | **light** | `scripts/reconcile_capabilities.py` ✅; `scripts/resolve_cap.py` ✅; help-text cites `_cap-verification-decisions.md` **MISSING**; `docs/process/capability-protocol.md` ✅ | none | hardcoded 10-brand list, `.venv` | **hybrid** — core gate logic + hardcoded brand enum + script deps | env `CAP_ADVISORY_SKIP=1` |
| **05c-code-cap-index.sh** | Advisory: regen `_code-index.json`; warn on staged code files missing `# cap:`/`// cap:` header. | no guard (runs both) | `scripts/generate_code_to_cap_index.py` ✅; `.venv/bin/python` ✅ | none | hardcoded 10-brand list, `(backend|frontend)/src`, `.py/.ts/.tsx`, `.venv` | **hybrid** — core doctrine (code↔cap header) + brand enum + stack ext | env `CODE_INDEX_SKIP=1`; never blocks (advisory) |
| **05d-bidirectional.sh** | Advisory: run `validate_code_cap_bidirectional.py --brand B`; warn on HARD_FAIL/SOFT_DRIFT. HARD enforce lives in pre-push. | no guard (runs both) | `scripts/validate_code_cap_bidirectional.py` ✅; `.venv/bin/python` ✅; `docs/process/capability-protocol.md` ✅ | **`atomics`** (L16, L58 — describes `cross_check_1 atomics→headers` as live) | hardcoded 10-brand list, `.venv`, stack ext | **hybrid** — wrapper over bidirectional validator + brand enum | env `BIDIRECTIONAL_SKIP=1`; never blocks (advisory) |
| **05e-cap-gates.sh** | HARD block if MADURO brand (**vitalia·comunify**) fails cap-format gates G1-G6 (`--cap-gates-hard --strict`). | no guard (runs both) | `scripts/validate_code_cap_bidirectional.py` ✅; `docs/process/cap-deterministic-enforcement.md` ✅; `make cap-doctor` ✅; `make new-cap` ✅ | none | **`vitalia`, `comunify`** hardcoded as HARD; `.venv`, stack ext | **hybrid** — core gate machinery + hardcoded HARD-brand allowlist | env `CAP_GATES_SKIP=1` |
| **06-backlog.sh** | Regen BACKLOG.{yaml,md} locally (gitignored, no-stage) when backlog sources touched; advisory `make portfolio` hint. | **full** | `scripts/generate_backlog.py` ✅; `scripts/generate_portfolio.py` ✅ (via `make portfolio`); `.venv/bin/python` ✅ | **`outcomes/`** (L13, L18, L20, L37 — listed as live backlog source in trigger regex) | brand path regex, `.venv` | **hybrid** — core (backlog freshness) + brand routing + stale `outcomes/` glob | fail-OPEN (warn if venv/script missing); NO env ACK (advisory regen, no block) |
| **07-checkpoint-enum.sh** | Staged checkpoint `state:` must be in v4 10-state enum (else block). | **full** | `docs/process/pm-redesign-2026-05.md` ✅ | mild: regex accepts **`blocked`** (L32) — NOT in canonical 10-state list | brand path regex only | **project** — layout of brand story checkpoints; the 10-state model itself is core | magic-comment `<!-- state-enum-na: -->`; NO env ACK |
| **08-pii-seed.sh** | Scan staged eval seed YAMLs dir w/ `scan_seed_pii.py`; block on PII (whitelist-aware). | **full** | `scripts/scan_seed_pii.py` ✅; legacy fallback `backend/scripts/scan_seed_pii.py`; `.venv/bin/python` ✅; `.eval-whitelist` (data, per-brand) | none | `backend/tests/fixtures/eval`, `.venv`, brand path | **hybrid** — core doctrine (PII) + project scanner/path/`.venv` | fail-OPEN (warn+skip if venv/scanner missing); NO env ACK |
| **09-pii-goldens.sh** | Scan staged sales_agent goldens YAMLs w/ `scan_goldens_pii.py`; strict block, NO whitelist. | **full** | `scripts/scan_goldens_pii.py` ✅; legacy fallback `backend/scripts/scan_goldens_pii.py`; `.venv/bin/python` ✅ | none | `sales_agent`, `backend/tests/agentic_evals`, `.venv`, brand path | **hybrid** — core PII doctrine + project scanner/`sales_agent` path | fail-OPEN (warn+skip if venv/scanner missing); NO env ACK |
| **10-infra-matrix.sh** | On `{brand}/config/brand.yaml` change, regen INFRA-MATRIX.md (gitignored, no-stage); block if generator fails. | **ALL** (no guard) | `scripts/generate_infra_matrix.py` ✅; `.venv/bin/python` ✅ | none | dynamic brand discovery, `.venv` | **hybrid** — core pattern (metadata+autogen index) + `config/brand.yaml`/`.venv` | fail-OPEN (warn+skip if missing); NO env ACK |
| **11-worktree.sh** | Block direct commit to `main` unless SQUASH_MSG/MERGE_MSG present or bypass env. | **full** | git-native `.git/SQUASH_MSG`/`MERGE_MSG`; `scripts/git/new-session.sh` ✅ (in help text) | none | none | **core** — pure git-workflow doctrine, ZERO tech/brand tokens | env `LUANA_ALLOW_MAIN_COMMIT=1` |
| **12-story-closure.sh** | Module-aware: block staging another story's files while an open story (developed/reviewing, no defer_audit) shares its `code:{module}` bucket. | no guard (runs both) | `.claude/rules/story-closure-gate.md` ✅ (in help text) | none | hardcoded 10-brand loop | **hybrid** — core doctrine (closure gate, WIP-cap-v2 per `code:{module}`) + hardcoded brand enum | env `STORY_CLOSURE_GATE_SKIP=1` |
| **13-scope-branch.sh** | Block staging files outside the current branch's scope (wip/{brand} · wip/protocol-* · wip/core-*). | no guard (runs both) | `scripts/git/new-session.sh` ✅; `docs/process/worktree-protocol-v2-plan.md` ✅ | none | hardcoded 10-brand list, `core/luana-core-` | **hybrid** — core scope doctrine + hardcoded brand enum + `core/luana-core-` | env `SCOPE_GATE_SKIP=1` |
| **14-brand-docs-schema.sh** | Block loose `.md` at `{brand}/docs/` root (R1: only canonical sub-dirs allowed). | no guard (runs both) | `.claude/rules/brand-docs-schema.md` ✅ | **`outcomes/`** (L19, L54 — lists `docs/product/outcomes/{slug}.md` as valid sub-dir + remediation) | hardcoded 10-brand list | **hybrid** — core R1 doctrine + brand enum + stale `outcomes/` hint | env `BRAND_DOCS_SCHEMA_SKIP=1` |
| **15-cap-ledger.sh** | Inline Python: staged cap YAML must have `change_log:` field (schema v2). | no guard (runs both) | `docs/process/release-protocol.md` ✅; `docs/process/lifecycle.md` ✅; `.venv/bin/python` (fallback `python3`) ✅ | `atomics` only as **historical/removed** comment (L14-15, L96) — correctly retired, not live | hardcoded 10-brand list, `.venv` | **hybrid** — core (cap ledger schema) + brand enum + `.venv` | magic `# cap-ledger-skip:`; env `CAP_LEDGER_SKIP=1` |
| **15.5-system-map.sh** | Run `validate_system_map.py --brand B` when SYSTEM-MAP/caps/checkpoints staged; block on cross-vocab fail. | **full** | `scripts/validate_system_map.py` ✅; `{brand}/docs/architecture/SYSTEM-MAP.yaml` ✅ (vitalia); `ADR-vitalia-005-…` ✅; `.venv/bin/python` ✅ | none | `.venv`; help text hardcodes `ADR-vitalia-005` path | **hybrid** — wrapper over `validate_system_map.py` + `.venv` + vitalia-named ADR | env `SYSTEM_MAP_SKIP=1` |
| **16-chris-input.sh** | Staged checkpoint in active state (idea…reviewing) requires sibling `chris-input.md`. | no guard (runs both) | `.claude/rules/brand-docs-schema.md` ✅; `docs/specs/templates/00-chris-input-template.md` ✅ | none | hardcoded 10-brand list | **hybrid** — core R4 doctrine + brand enum | magic `# chris-input-skip:`; env `CHRIS_INPUT_SKIP=1` |
| **17-checkpoint-dupkeys.sh** | awk: block if checkpoint frontmatter has duplicate top-level keys (breaks YAML→cockpit board). | no guard (runs both) | `docs/process/checkpoint-protocol.md` ✅ | none (mentions `outcome:`/`phase:` only as *example legacy dup* — correct) | none (`/checkpoint.md$` is generic) | **core** — pure YAML-frontmatter integrity, ZERO tech/brand tokens | env `CHECKPOINT_DUPKEY_SKIP=1` |
| **18-machinery.sh** | Run `validate_machinery_consistency.py` when `.claude/{rules,skills,agents}/` or templates staged; block on drift. `exit 0` at end (last sourced check). | no guard (runs both) | `scripts/validate_machinery_consistency.py` ✅; `make machinery-check` ✅; `docs/process/audits/2026-05-28-*` ✅ | none | `.venv` (fallback python3) | **hybrid** — core anti-drift doctrine + `.venv` path | env `MACHINERY_CHECK_SKIP=1` |
| **pre-push** | Block push to `main` without ci-parity marker (ADVISORY if `.ci-parity-deferred` sentinel) + HARD bidirectional cross_check_3 + HARD cap-gates G1-G6 (vitalia·comunify). | n/a (push, main-only) | `scripts/ci-parity.sh` ✅ (drops marker); `.ci-parity-deferred` ✅; `scripts/validate_code_cap_bidirectional.py` ✅; `.venv/bin/python` ✅; `make ci-parity` ✅; `make cap-doctor`/`make new-cap` ✅; `docs/process/capability-protocol.md`, `cap-deterministic-enforcement.md`, `lifecycle.md` ✅ | `atomics` only as **historical** comment (L106) — retired correctly | hardcoded `BRANDS_ALL="vitalia nicolify comunify lupulo"`, `CAP_GATES_HARD_BRANDS="vitalia comunify"`, `@require_phi_access`/`PHI`, `.venv` | **hybrid** — core gate machinery (ci-parity, bidirectional, cap-gates) + hardcoded brand enums + PHI mention | env `CI_PARITY_OVERRIDE=1`, `BIDIRECTIONAL_PUSH_OVERRIDE=1`, `CAP_GATES_PUSH_OVERRIDE=1` |

---

## Paper-rule findings (cited-but-missing references)

Every executed script/path was `test -e`-verified. **No check sources or executes a missing file** — there are NO critical paper-rules in the mechanism path. All real mechanisms resolve:

- All 11 distinct Python scripts under `scripts/` exist: `reconcile_capabilities.py`, `resolve_cap.py`, `generate_code_to_cap_index.py`, `validate_code_cap_bidirectional.py`, `generate_backlog.py`, `generate_portfolio.py`, `generate_infra_matrix.py`, `validate_system_map.py`, `scan_seed_pii.py`, `scan_goldens_pii.py`, `validate_machinery_consistency.py`, plus `_pii_scan_lib.py` and `ci-parity.sh`.
- All cited rules/docs exist: `spanish-text.md`, `auditor-downstream-regression.md`, `brand-docs-schema.md`, `story-closure-gate.md`, `capability-protocol.md`, `cap-deterministic-enforcement.md`, `release-protocol.md`, `lifecycle.md`, `worktree-protocol-v2-plan.md`, `pm-redesign-2026-05.md`, `checkpoint-protocol.md`, `00-chris-input-template.md`, both `2026-05-28-*` audits.
- `scripts/git/new-session.sh` exists. Sentinel `.ci-parity-deferred` exists (pre-push is currently in ADVISORY phase for the Docker mirror).
- All cited `make` targets resolve in `Makefile`: `cap-doctor`, `new-cap`, `machinery-check`, `infra-matrix`, `portfolio`, `ci-parity`.

**ONE non-critical dangling reference (help-text only, NOT executed):**
- **05b-cap-advisory.sh L141** — error message cites SSoT `_cap-verification-decisions.md § F`. **No file named `_cap-verification-decisions.md` exists anywhere in the repo** (`find` returns nothing). It appears only inside the human-facing block message, so it does not affect the gate's mechanism, but it points a developer at a non-existent doc. **Severity: LOW (cosmetic / doc-rot).** Recommend repointing to `docs/process/cap-deterministic-enforcement.md` or `capability-protocol.md § 5`.

**Resilience note (not a paper-rule, but worth flagging for W4):** many checks are **fail-OPEN** when venv/script/table is missing (03, 04, 05, 06, 08, 09, 10, 15.5, 18). That is intentional (don't hard-block on tooling absence) but means the gate silently degrades to a no-op if `.venv` is broken. The cap-gate (05e), bidirectional (05d/pre-push), and machinery (18) all gate on `[ -f script ]` first — if the script is ever deleted, those HARD gates become silent no-ops with no warning.

---

## Stale-pattern findings (vs ratified v5 process)

| Pattern | Location | Verdict |
|---|---|---|
| `outcomes/` as **live** valid path | **06-backlog.sh** L13/18/20/37 (trigger regex `outcomes/`), **14-brand-docs-schema.sh** L19/54 (listed as valid sub-dir + remediation `docs/product/outcomes/{slug}.md`) | **STALE — flag.** `outcomes/` was purged (brand-docs-schema D-X2; 4-ejes Release entity replaced outcome). The physical `docs/product/outcomes/` dir still exists in this worktree, so the regex/hint aren't broken, but they advertise a retired model. 06 still *triggers* backlog regen on `outcomes/` edits; 14 still *suggests* creating `outcomes/{slug}.md` as a fix — that recommendation contradicts the ratified schema. |
| `atomics` described as a **live** cross-check | **05d-bidirectional.sh** L16, L58 — "drift en `cross_check_1` (atomics→headers)" / "HARD checks failing (cross_check_1 atomics→headers …)" | **STALE description — flag.** atomics was killed 2026-05-28. 15-cap-ledger.sh (L14-15, L96) and pre-push (L106) correctly mark atomics as *removed*. 05d still labels `cross_check_1` as "atomics→headers" in its advisory text. Whether `cross_check_1` still exists in `validate_code_cap_bidirectional.py` under a renamed concept needs verification, but the **text is stale**. |
| `blocked` extra state in enum | **07-checkpoint-enum.sh** L32 regex accepts `...|dropped|blocked` | **MILD DRIFT — flag.** The canonical macro-state list is exactly 10 (idea·refining·refined·ready·developing·developed·reviewing·done·parked·dropped). `blocked` is not one of them. Either intentional legacy tolerance (then document it) or drift to remove. |
| `outcome:`/`phase:` as legacy dup example | **17-checkpoint-dupkeys.sh** L48 | **NOT stale (correct usage).** Mentioned only as the *typical legacy duplicate-key example* the gate catches — this is the gate working as intended against stale frontmatter. |

**Clean (NOT present anywhere in git-hooks):** `demo_signoff`, `02-design-ui`/`02-design`, `phase_workflow`, A-F letter-phase labels (`Phase A`…`fase F`), `v4.2`/`v4.1` auditor self-fix, per-worktree WIP-cap language. The v5 vocab is **honored by absence** (none of the checks gate on `chris_verify`, `reconciled`, `dod_live_verified`, `dod_evidence` — those live in dedicated gates outside `checks/`, e.g. `scripts/git/dod-evidence-gate.sh` and `multi-session-scope-guard.sh`, not in this dispatcher). The state-enum (07) and chris-input (16) checks correctly use the 10-state vocabulary (modulo the `blocked` add).

---

## Tier summary counts

Tier proxy = ZERO tech/brand tokens ⇒ `core`; any token ⇒ `hybrid`/`project`.

| Tier | Count | Files |
|---|---|---|
| **core** (proxy-clean, zero tokens) | **2** | 11-worktree, 17-checkpoint-dupkeys |
| **hybrid** (core mechanism + project/brand half) | **17** | 02-voseo, 04-r3-ssot, 05-r32-cap-story, 05b-cap-advisory, 05c-code-cap-index, 05d-bidirectional, 05e-cap-gates, 06-backlog, 08-pii-seed, 09-pii-goldens, 10-infra-matrix, 12-story-closure, 13-scope-branch, 14-brand-docs-schema, 15-cap-ledger, 15.5-system-map, 16-chris-input, 18-machinery |
| **project** (stack/path-bound, no portable core) | **2** | 03-ruff, 07-checkpoint-enum |
| **brand** (single-brand only) | **0** | — |
| pre-push | (hybrid) | core gate machinery + hardcoded brand enums + PHI mention |

Total in `checks/`: 22 (note: the hybrid count above lists 18 names including 18-machinery; 02-voseo is hybrid, so the **hybrid total = 18**, core = 2, project = 2 ⇒ **22**). Re-stated cleanly:
- **core: 2** (11, 17)
- **hybrid: 18** (02, 04, 05, 05b, 05c, 05d, 05e, 06, 08, 09, 10, 12, 13, 14, 15, 15.5, 16, 18)
- **project: 2** (03, 07)
- **brand: 0**
- **pre-push: hybrid** (separate file)

### Tier rationale highlights (for W4 seam design)
- The recurring **hardcoded 10-brand enum** (`vitalia|nicolify|comunify|lupulo|saasora|inmoflow|retailly|fixia|guestly|fitflow`) is the single biggest extractability blocker — it appears verbatim in 05b, 05c, 05d, 05e, 12, 13, 14, 16 and as loops in 08, 09, 12, and pre-push. A `brands[]` seam (W5) would lift most of these from `project`/`hybrid` toward `core`.
- The recurring **`.venv` path** + `make`/script paths are the second seam (`engine_prefix`/venv slot).
- **05e-cap-gates + pre-push 4e** hardcode `CAP_GATES_HARD_BRANDS="vitalia comunify"` (maturity allowlist) — that is genuinely a brand-maturity *policy* value, candidate for a config slot, not core.
- Only **11** (git-workflow main-protection) and **17** (YAML frontmatter integrity) are genuinely proxy-clean core today; both are pure git/YAML mechanics with no stack coupling.

<DONE>
