# W4b · RESEARCH Batch C — machinery/validators + git gate-scripts + ops shells + pii + subdirs + warp

**Date:** 2026-06-09 · **Session:** harness-refactor **W4b** (B-phase, read-only research) · **Owner:** harness-dedicated, Opus · **Branch:** `wip/vitalia`. **Status:** RESEARCH ONLY — zero edits applied (per W4b kickoff: classification + conformance audit, no fixes).

> **North-star card:** *This session succeeds only if (1) it implements its work-type per `PROCESS-MODEL.md`, AND (2) every file it tags `core` names ZERO tech/brand tokens (the rest went to the seam). The goal is an extractable `core-harness/`, not a nicer luana harness. Measured by the dependency-grep (§4) — the cheap W8.*

Scope of this batch: 8 Python validators/scanners (incl. the load-bearing `validate_machinery_consistency.py` + the Stop-hook `validate_session_close.py`), all 13 `scripts/git/*` gate-scripts, 4 subdir scripts (learning/quality/postgres-init/r2), 13 `scripts/` root ops shells, and `scripts/warp-workflows/` (7 yaml + README). **30 classifiable script files + warp-dir-as-a-whole.** Pointer-first; bodies are in the files cited by `file:line`.

---

## 0 · Headline

- **30 files classified** (per the master table). Tier shape mirrors W3/W4: **core RARE** (3 proxy-clean: `commit-paths.sh`, `session-lock.sh`, `multi-session-scope-guard.sh` — pure git/coordination; arguably `dod-evidence-gate.sh` too) · the rest `hybrid` (core mechanism + project runner-half → seam) or **`project`** (the ops shells that drive docker/ports/dev-app/litellm/cloudflared/ci-parity are project-bound by construction). **brand tier = 0** (OCP — brand specifics are config, never a script).
- **6 paper-rules / dead references found** (4 real, 2 cosmetic). The headline one: **`validate_ci_parity_mirror.py` reads `.github/workflows/deploy-prod.yml` + a `jobs.quality-gates` job — NEITHER EXISTS** (workflows were restructured to `ci.yml`/`cd-prod.yml`; job names are `python-lint`/`python-test`/`arch-fitness`/`ts-lint`/`ts-test`). The validator would `exit 2` on every run; only its own fail-soft caller (`ci-parity.sh` "skip silently if BE venv unavailable" + `|| yellow advisory`) hides it.
- **5 stale-vocab findings** (LIVE-directive, recommend fix in W4b apply). The big one: **`validate_session_close.py` — the Stop hook — is stale on TWO axes**: (a) hardcoded **single-brand pre-multibrand paths** (`backend/.venv/bin/python`, root `docs/product/stories`, `docs/product/BACKLOG.yaml`) that no longer match the 4-brand layout, AND (b) **retired epic/`outcomes` vocab** in `check_wip_caps`. The hook **does not actually enforce** the multibrand WIP caps it claims to.
- **`validate_machinery_consistency.py` (the gate `make machinery-check` runs)** is sound, current (CHECK 1-28, proceso v5 W1-W5), and **its body strings depend on cockpit + scripts file BODIES being load-bearing** — §7 below enumerates them so W4b's own edits don't trip it.

---

## 1 · Master classification table

Proxy = the dependency-grep (`vitalia|nicolify|comunify|lupulo|ruff|pytest|mypy|alembic|clerk|next\.js|tailwind|fastapi|sqlalchemy|core/luana-core|\.venv|dev-app|hipaa|phi`) run over each file. **tier=core EARNED only if proxy=0** (option-b). Consumer verified on the consumer side (Makefile / pre-commit checks / settings.json / .github), not the producer's self-description.

| File | one-line purpose | consumer | tier | proxy | paper-rules | stale | conformance | orphan |
|---|---|---|---|---|---|---|---|---|
| `validate_machinery_consistency.py` | anti-drift gate · 28 CHECKs assert doctrine↔template↔agent↔cockpit consistency | `make machinery-check` + `checks/18-machinery.sh` (pre-commit) | **hybrid** | 5 (pm-{brand} paths, `hipaa` in a comment) | none | tombstone-only (`atomics` = the thing it kills) | ✅ proceso-v5 current (CHECK 13-28) | no |
| `validate_session_close.py` | **Stop hook** — WIP-cap BLOCK + backlog/uncommitted/staleness WARN at session close | **settings.json `Stop`** | **hybrid** | 4 (`backend/.venv`, `.venv`) | none (paths self-skip, fail-soft) | **YES (2)** — single-brand paths + `outcomes`/epic vocab | ⚠ partial: doesn't enforce multibrand caps | no (registered) |
| `scan_harness_pointers.py` | anti-rot: workspace-rooted broken pointers in skills/agents/rules, baseline-ratchet | `make harness-pointers*` + machinery CHECK 28 (`warn`) | **hybrid** | 4 (brand enum in `ROOT_PREFIXES`) | none | none | ✅ | no |
| `mutation_gate.py` | diff-scoped mutation testing (mutmut/Stryker), degrade-advisory if tool absent | machinery CHECK 19-21 (asserts its body) · architect/dev-team/auditor (proceso v5 §5.6) | **hybrid** | 3 (`_BRANDS` enum, `.venv/bin/mutmut`) | none | none | ✅ proceso-v5 W3 | no |
| `validate_ci_parity_mirror.py` | assert `ci-parity.sh` mirrors the CI quality-gates job | `ci-parity.sh` (fail-soft) | **project** | 5 (ruff/pytest/npx) | **YES (1) ★** reads `deploy-prod.yml` + `jobs.quality-gates` — both GONE | none | ⚠ broken target (see §2) | no |
| `_pii_scan_lib.py` | shared PII detector (email/phone vectors) for seed+golden gates (HB-18) | imported by `scan_seed_pii.py` + `scan_goldens_pii.py` | **hybrid** | 1 (`phi`= false-positive in "philosophy") | none | none | ✅ | no |
| `scan_seed_pii.py` | scan eval tenant-seed YAMLs for real PII (whitelist-aware) | `checks/08-pii-seed.sh` (pre-commit §8) | **hybrid** | 0 | none | none | ✅ | no |
| `scan_goldens_pii.py` | scan sales_agent golden YAMLs for PII (strict, no whitelist) | `checks/09-pii-goldens.sh` (pre-commit §9) | **hybrid** | 0 | none | none | ✅ | no |
| `git/check-sync.sh` | step-0 worktree detect + graded sync (opencode/manual) | `warp-workflows/sync-check.yaml`; worktree-protocol docs | **hybrid** | 3 (brand enum, `core/luana-core` grep) | none | none | ✅ single-hub/triple-branch | no |
| `git/cleanup-session.sh` | push + remove worktree + story-closure gate (Layer 5) | docs (parallel-safety, cleanup) · manual `/cierra-limpio` | **hybrid** | 1 (brand loop) | none | none | ✅ 10-state gate (`developing/developed/reviewing`+`defer_audit`) | no |
| `git/cleanup-wip-branches.sh` | cron-delete stale `wip/*` remote branches (>30d) | `.github/workflows/cleanup-wip.yml` (deferred) | **core** | 0 | none | none | ✅ never-touches main/release | no |
| `git/commit-paths.sh` | commit by exact pathspec (`--only`) in shared-index hub (ADR-009) | `[[solo-chris]]` MEMORY · manual | **core** ★ | 0 | none | none | ✅ single-hub shared-index | no |
| `git/dod-evidence-gate.sh` | pre-commit BLOCK on `state:developed\|done` w/o `dod_live_verified`+`dod_evidence` (Rule #37 Layer 6) | `pre-commit` preamble (L79) | **core** ★ (proxy-clean) | 1 (`dev-app` in help text only) | none | **fixed by W4** (`demo_signoff`→`chris_verify.signoff`) | no |
| `git/multi-session-scope-guard.sh` | pre-commit BLOCK on cross-session sweep (HB-31, ≥2 live locks) | `pre-commit` preamble (L68) | **core** ★ | 0 | none | none (W4-verified v5-clean) | no |
| `git/new-session.sh` | create worktree+branch+manifest+venv-symlink (D1-D14 / ADR-005) | docs · manual (EXPLICIT_USER_REQUEST gate) | **hybrid** | 13 (brand enum, `.env.dev`) | none | none | ✅ single-hub default (canonical=stable `wip/{brand}`; story=exception) | no |
| `git/ps1-luana.sh` | PS1 prompt showing worktree/branch/dirty | sourced in `~/.bashrc` (manual) | **core** | 1 (`luana` regex) | none | none | ✅ | no |
| `git/push-wip.sh` | pre-push sync check + push wip/* (never main) | `warp-workflows/push-wip.yaml` · manual | **hybrid** | 5 (`core/luana-core` grep) | none | none | ✅ M5 (no pull, non-FF→STOP) | no |
| `git/regenerate-manifest.sh` | recovery: rebuild `.session.yaml` from path+branch | `warp-workflows/regenerate-manifest.yaml` · status-all advice | **hybrid** | 1 (brand enum) | none | none | ✅ | no |
| `git/session-lock.sh` | bucket lock (code/docs/tests/code:{module}) for N same-hub sessions (M14) | parallel-safety M14 · cockpit reads `.session-locks/*.lock` | **core** ★ | 0 | none | none | ✅ module-scoped buckets (ADR-009) | no |
| `git/status-all.sh` | cross-worktree dashboard (branch/dirty/story/docker) | `warp-workflows/status-all.yaml` · resume protocol | **hybrid** | 0 (brand only via docker-name regex) | none | none | ✅ | no |
| `git/sync-from-main.sh` | active sync KISS (graded FF/merge/stop) | step-0 (`check-sync` invokes the model) · push-wip advice | **hybrid** | 1 (`core/luana-core` grep) | none | none | ✅ D10-v2 | no |
| `learning/capture.sh` | write learning to canonical path + MEMORY pointer (CIL L2) | `learning-capture.md` rule · learning-detect hook cites it | **hybrid** | 16 (brand enum, hipaa example) | none | none | ✅ CIL L2 routing | no |
| `quality/code-health.sh` | maintainability gate BE+FE (dup/dead-code/docstrings/audit), baseline-ratchet | `make code-health` (HB-61) | **project** | 5 (ruff/`.venv`/vitest/jscpd) | none | none | ✅ | no |
| `postgres-init/01-create-databases.sh` | idempotent create the 4 brand dev DBs in shared postgres | postgres docker-entrypoint-initdb.d | **project** | 4 (brand DB names) | none | none | ✅ idempotent | no |
| `r2/upload-platform-agents.sh` | upload 6 agent avatars to Cloudflare R2 bucket | manual (asset provisioning) | **project** | 1 (one brand-path default) | none | path-coupled (`/home/chalreme/Trabajo/Vitalia/agentes` default) | OK (overridable `SRC_DIR`) | low-use |
| `cockpit-up.sh` | foreground cockpit launcher (brand→port, per-worktree) | superseded by `cockpit-daemon.sh` (Makefile uses daemon) | **project** | 13 (brand→port map) | none | none | ✅ per-worktree (Paradigma A) | ~superseded |
| `cockpit-daemon.sh` | true-detach cockpit daemon {start\|stop\|status\|restart} | `make cockpit-{up,down,status,restart}` | **project** | 4 (brand→port map) | none | none | ✅ | no |
| `dev-app-up.sh` | bring up brand stack + tunnel + verify live-verify readiness (Rule #37) | `make dev-app-vitalia` / `dev-app-%` | **project** | 25 (brand/ports/dev-app/clerk/cloudflared) | none | none | ✅ DoD live-verify infra | no |
| `dev-lock-check.sh` | warn if 2 docker stacks of same brand (D5 stub MVP) | step-0 / dev-up advice | **hybrid** | 0 (brand via arg+docker name) | none | none | ✅ (explicit "stub MVP, no STOP yet") | no |
| `ci-parity.sh` | cross-brand reproducer of CI quality-gates (docker test images) | `make ci-parity` / `ci-parity-%` · pre-push marker | **project** | 12 (ruff/pytest/npx/brand) | **YES (1)** header+validator cite `deploy-prod.yml` (gone) | none | ⚠ marker name mismatch w/ pre-push (§2) | no |
| `cloudflared-setup.sh` | non-interactive Cloudflare tunnel provision via REST API | `make dev-{brand}-tunnel` chain · Rule #37 · dev-app-up | **project** | 6 (brand/dev-app) | none | none | ✅ | no |
| `litellm-proxy-up.sh` | bring up the shared dev LLM gateway (Chinese-first) | promotion-proposal `2026-06-04-llm-gateway-chinese-first.md`; manual | **project** | 0 (`visionarias_litellm` legacy alias) | none | legacy alias `visionarias_litellm` (intentional back-compat) | OK | low-use |
| `e2e-preflight.sh` | preflight before Playwright (stack up + Clerk inputs) | `e2e-testing.md` rule · playwright-expert skill · `scripts/e2e-preflight.sh` cited verbatim | **project** | 18 (brand/ports/clerk) | none | none | ✅ | no |
| `publish_smoke_test.sh` | smoke-test published luana-core-*/@luana packages from GH registry | `.github/workflows/release.yml` L174 (deferred) · release-procedure doc | **project** | 0 (`luana-core` pkg names) | none | none | ✅ | no (deferred) |
| `rollback_partial_publish.sh` | delete partial-published packages from GH registry | release-procedure doc · manual | **project** | 0 (`luana-core` pkg names) | none | none | ✅ | low-use |
| `verify-no-backend-errors.sh` | fail if backend logged ERROR/Traceback since a timestamp (Rule #37 §3) | dev-team/architect/auditor live-verify · Rule #37 | **project** | 3 (brand/`dev-app` container) | none | none | ✅ anti-bubble | no |
| `generate_api_docs.sh` | pdoc (Python) + typedoc (TS) API docs for core packages | release-procedure doc · manual | **project** | 1 (`core/luana-core-*`) | none | none | ✅ (stub-fallback by design) | low-use |
| `playwright_console_network_audit.sh` | audit Playwright report for console errors + 4xx/5xx (SC-17) | builder-frontend agent · dev-team/test-design-doctrine · playwright-expert | **hybrid** | 8 (`vitalia/frontend` default path) | none | none | ✅ (has `downstream-regression-na:` magic comment) | no |
| `warp-workflows/` (dir + 6 yaml + README) | Warp palette wrappers for the 6 `git/*` scripts (opencode parity) | Warp import; opencode users (D14) | **project** | yaml = brand-agnostic shell wrappers; README names brands | none | none | ✅ | low-use (opencode) |

**Counts:** **core ~6** (`cleanup-wip-branches`, `commit-paths`, `dod-evidence-gate`, `multi-session-scope-guard`, `ps1-luana`, `session-lock`) · **hybrid ~14** · **project ~10** · **brand 0**. (The 4 ★ are the strongest core candidates: pure git-coordination/main-protection mechanisms with proxy=0.) Same shape as W3/W4: *the portable core is the coordination/protection SKELETON; every shell that shells `docker`/`make dev-{brand}`/`ruff`/`pytest` or maps a brand→port is project-bound.*

---

## 2 · No-paper-rules verification (deliverable: `test -e` every cited path/script/make-target)

I `test -e`-verified every cited artifact across all 30 files. **Mechanically the surface is mostly sound** — but **4 real dead references + 2 cosmetic** were found:

### ★ PAPER-RULE #1 (REAL, the worst) — `validate_ci_parity_mirror.py` points at a workflow that no longer exists

- `validate_ci_parity_mirror.py:54` → `WORKFLOW = ROOT/.github/workflows/deploy-prod.yml` → **MISSING**. Current workflows: `ci.yml`, `ci-wip.yml`, `cd-prod.yml`, `cd-staging.yml`, `cleanup-wip.yml`, `release.yml`, `_deploy-brand.yml`.
- `validate_ci_parity_mirror.py:67` → `data["jobs"]["quality-gates"]` → **no `quality-gates` job exists** in ANY workflow (grep = 0 hits). The CI gates now live in `ci.yml` jobs `python-lint`/`python-test`/`arch-fitness`/`ts-lint`/`ts-test`.
- **Effect:** the validator hits `if not WORKFLOW.exists(): return 2` (L125) on every run. It is **never actually validating parity**. Its only caller is `ci-parity.sh:92-95`, which runs it behind `[ -x "$BE_DIR/.venv/bin/python" ]` + `|| yellow "(advisory: validator not yet adapted to cross-brand layout…)"` — so the failure is silently swallowed as advisory. The "mirror drift" guard the comment promises (caught a 2-afternoon masked-bug regression in 2026-04) is **dead**.
- **Repoint target:** `ci.yml` (the live CI), and either re-derive the `quality-gates`-equivalent steps from its 5 jobs OR retire the validator under `github-actions-deferred` (the whole CI is `🟡 deferred` per `docs/rules-detail/github-actions-deferred.md`). Recommend W4b: at minimum a loud "workflow target missing → repoint or retire" rather than silent exit-2.

### PAPER-RULE #2 (REAL, minor) — `ci-parity.sh` marker-name mismatch with `pre-push`

- `ci-parity.sh:150` writes `.git/ci-parity-passed-$BRAND-$HEAD_SHA` (**per-brand**).
- `pre-push:34` reads `MARKER=".git/ci-parity-passed-${HEAD_SHA}"` (**no brand segment**).
- The two never match → the pre-push "ci-parity passed" fast-path marker is **never found**, so pre-push always treats ci-parity as not-run. Currently masked because pre-push is ADVISORY (sentinel `.ci-parity-deferred` present). Flag for W4b/W5.

### PAPER-RULE #3 (REAL) — `ci-parity.sh` header docstring also cites `deploy-prod.yml` (×2: L21, L82) — same dead workflow. Doc-rot, cosmetic but propagates the false belief.

### PAPER-RULE #4 (REAL) — `validate_session_close.py` docstring (L53) embeds a settings.json snippet with `${CLAUDE_PROJECT_DIR}/backend/.venv/bin/python` — the **wrong venv path** (and inconsistent with the ACTUAL `settings.json` which correctly uses `${CLAUDE_PROJECT_DIR}/.venv/bin/python`). The script's own runtime (L132 `repo/"backend"/".venv"/...`) carries the same stale path. (Covered also under §4 stale.)

### Cosmetic / not-paper-rules (verified existing)
- All other cited scripts/make-targets/rules **resolve**: `multi-session-scope-guard.sh`, `dod-evidence-gate.sh`, `mutation_gate.py`, `scan_*_pii.py`, `_pii_scan_lib.py`, `resolve_cap.py`, `new_cap.py`, `validate_caps_schema.py`, `cap_doctor.py`, `validate_code_cap_bidirectional.py`, `generate_code_to_cap_index.py`, `ci-parity.sh`, `learning/capture.sh`, cockpit `ScenariosSection.tsx` + `harness-backlog.ts`, `harness-audit.js`, `continuous-improvement.md`, all 4 pm-skills + dev-team/auditor/architect skills. **machinery-check passes** (W4 recorded 73/0/0; the cockpit + scripts bodies CHECK 12/22 depend on are present — §7).
- `publish_smoke_test.sh` / `rollback_partial_publish.sh` / `generate_api_docs.sh` are for the **deferred** release pipeline (`release.yml` 🟡); they reference real `luana-core-*`/`@luana/*` packages + `release-procedure-v0.1.0.md`. Not orphans, just dormant.

---

## 3 · Process conformance (single-hub / triple-branch / M14 bucket-locks · 10-states+{G,R,C,D})

**The git-scripts faithfully reflect the ratified process model** (`PROCESS-MODEL.md §1,§2,§5 D3`):

- **Single-hub, no branch fragmentation (D3):** `new-session.sh` defaults `canonical = wip/{brand}` STABLE and **refuses** story-worktrees without `EXPLICIT_USER_REQUEST=1` (L168) — exactly the "separate worktrees = exceptions only" doctrine. `session-lock.sh` implements the **M14 module-scoped buckets** (`code` / `code:{module}` / `docs` / `tests`) with the ADR-009 rule "two builds on different modules don't contend; same module serializes" (L21-23). `commit-paths.sh` implements the shared-index pathspec-commit (`git commit --only`) that single-hub requires. **`multi-session-scope-guard.sh`** is the M15 sweep-guard (HB-31, cement 2026-06-04), W4-verified v5-clean.
- **Triple-branch (`git-safety.md`):** `push-wip.sh` HARD-refuses pushing `main` (L33-37), enforces M5 (no pull, non-FF→STOP, L94-99); `sync-from-main.sh` is the graded D10-v2 sync; `cleanup-wip-branches.sh` only touches `wip/**` (belt-and-suspenders main/release guard).
- **10-states + closure gate:** `cleanup-session.sh:103-136` enforces the **story-closure gate (Layer 5)** — refuses cleanup if any story is `developing|developed|reviewing` without `defer_audit: true`. **Conformant to the 10-state canon** (uses the exact transition states). `new-session.sh:103` likewise refuses re-creating a worktree for a story already `developing|developed|reviewing|done`.

**No `phase_workflow` / `02-design-ui` / A-F letter-phases / `cross_check_1`/`atomics`-as-live found in any git-script.** The G/R/C/D phases live in dedicated scripts (`dod-evidence-gate.sh` = the DoD piece) — correctly NOT duplicated into these coordination scripts.

### Stale-vocab findings (LIVE-directive — recommend fix in W4b apply)

| # | file:line | stale token | ratified truth | fix |
|---|---|---|---|---|
| **S1** ★ | `validate_session_close.py:132,134` (+ docstring L53) | `backend/.venv/bin/python` (single-brand pre-multibrand path) | venv at workspace **root** `.venv/` (`backend/.venv` doesn't exist; settings.json already uses `${CLAUDE_PROJECT_DIR}/.venv`) | → `.venv/bin/python` |
| **S2** ★ | `validate_session_close.py:87,176-180` | reads root `docs/product/stories` + `docs/product/BACKLOG.yaml` (single-brand layout) | multibrand = `{brand}/docs/product/stories` + `{brand}/docs/product/BACKLOG.yaml` (4 brands). Root copies exist as **legacy/platform** only → the hook checks the wrong/stale tree, **does not enforce per-brand caps** | → loop the brand enum (or read platform BACKLOG only + document scope) |
| **S3** | `validate_session_close.py:99,113-118` | "outcomes are epics, exempt" + `kind == "story"` filter + `legacy:*` tag exempt | 4-ejes killed `outcomes`/epics (D-X2). The `kind`/`legacy:*` machinery is dead-model residue | → drop epic/outcomes language; cap-eligible = all stories |
| **S4** | `validate_session_close.py:30,82` | `ACTIVE_STATES` includes `building`/`review` in a docstring (L30 "ready,building,review") while the constant (L82) is correct (`developing…reviewing`) | 10-state canon (`developing`/`reviewing`, not `building`/`review`) | → fix the docstring to match the constant |
| **S5** | `validate_session_close.py` CAPS (L73-80) `developed_max:10` | matches `[[proceso-v5]]` developed≤1 module-scoped? **No** — these are GLOBAL WIP caps (refining 3 / refined 5 / ready 5 / developing 3 / developed 10 / reviewing 2), the *old* paradigm-v4 numbers, NOT the v5 module-scoped `developed≤1`. The Stop hook never adopted module-scoping | → reconcile with `story-closure-gate.md` WIP-cap v2 (or document that this is a coarse global net) |

**NOT stale (tombstones / literal — leave intact):**
- `validate_machinery_consistency.py` `atomics` refs (L36-49) — the validator EXISTS to keep `atomics` dead (CHECK 1). All references are the kill-list / allowed-death-context regex. Correct.
- `new-session.sh:256` "per-worktree gitignore" — literal `.git/info/exclude` file handling, NOT the WIP-cap "per-worktree" pattern that PROCESS-MODEL retired. Not stale.
- `litellm-proxy-up.sh:37` `--network-alias visionarias_litellm` — intentional legacy back-compat alias (documented). Tombstone-ish but functional; leave.
- `r2/upload-platform-agents.sh` `Adrián/Lisa/...` agent slugs + `SRC_DIR` default `/home/chalreme/Trabajo/Vitalia/agentes` — project asset paths (overridable). Project-tier, not stale-vocab.

---

## 4 · DEDICATED — `validate_session_close.py` (the Stop hook)

**(a) What it validates at session close (4 checks):**
1. **WIP-cap BLOCK** (`check_wip_caps`, exit 2): reads `docs/product/BACKLOG.yaml` `buckets`, counts `kind == "story"` (excl. `legacy:*`) per state vs `CAPS` (refining 3/refined 5/ready 5/developing 3/developed 10/reviewing 2). Exit 2 feeds the model on Stop.
2. **Backlog freshness WARN** (`check_backlog_freshness`): runs `generate_backlog.py --check` + `reconcile_capabilities.py --check` **via `backend/.venv/bin/python`** — which **does not exist** → returns `["backend/.venv/bin/python missing — skipping freshness checks"]`. **This check self-disables.**
3. **Uncommitted-WIP WARN** (`git status --short`).
4. **Checkpoint-staleness WARN** (stories `ACTIVE_STATES` with `checkpoint.md` mtime >7d) — globs root `docs/product/stories` only.

WARN→stderr+exit0 (deliberate anti-loop, per the docstring rationale L37-41); only WIP-cap is exit-2 BLOCK.

**(b) Retired vocab / phantom paths:** YES — **S1-S5 above**. Most consequential: it reads the **single-brand legacy layout** (root `docs/product/stories`, root `BACKLOG.yaml`, `backend/.venv`) and never loops the 4-brand multibrand layout. The freshness check is a guaranteed no-op (wrong venv). The WIP-cap caps are the **paradigm-v4 global numbers**, not the v5 module-scoped `developed≤1` (S5). It still contains the **dead epic/`outcomes`** filter (S3). No fully-broken `import`/path that crashes (it fail-soft skips), but it is **substantially a paper-rule by drift**: it advertises multibrand WIP enforcement it does not perform.

**(c) tier: `hybrid`.** Core = the Stop-hook contract (WIP-cap-BLOCK / WARN-only-for-non-blockers / exit-code protocol). Project = the venv path, the brand-loop, the BACKLOG/stories globs, the CAP numbers → all → `brands[]` / `toolchain` seam (W5).

**(d) Registered in settings.json:** **YES.** `.claude/settings.json` `Stop` (L54-66): `${CLAUDE_PROJECT_DIR}/.venv/bin/python ${CLAUDE_PROJECT_DIR}/scripts/validate_session_close.py --quiet` (timeout 30). **Note the registration uses the CORRECT root `.venv`** while the script's own `check_backlog_freshness` uses the WRONG `backend/.venv` (S1) — so the hook *fires* (entrypoint runs under root venv) but its internal freshness sub-check skips. Consumer-side two-level check (W4 learning): (a) registered ✓; (b) the registered command path is current ✓ — but the script's INTERNAL paths are stale.

**TAG + VERDICT:** `tier: hybrid · Stop-hook · STALE (single-brand paths + v4 cap numbers + epic/outcomes residue) — NON-CONFORMANT to multibrand 10-state model · fires but under-enforces.` **Recommend W4b apply: S1+S2 (root `.venv` + brand-loop) are the load-bearing fixes; S3/S4/S5 are vocab hygiene.** No edits made this session (research only).

---

## 5 · DEDICATED — `validate_machinery_consistency.py` (the deterministic gate · protects W4b's own edits)

`make machinery-check` + `checks/18-machinery.sh` run it; exit 1 on any failed CHECK (advisory CHECK 28 doesn't affect exit). **CHECKs whose assertions depend on a harness/cockpit/script file BODY being a load-bearing STRING — a future stub of any of these would turn the CHECK red.** W4b must NOT empty these bodies:

| CHECK | depends on body-string of | the load-bearing assertion |
|---|---|---|
| 1 | `.claude/rules/{story-closure-gate,brand-docs-schema,anti-duplication-refining}.md` | `atomics` token absent (unless death-context) |
| 2 | `docs/specs/templates/06-tickets-template.yaml` | ≥3 `primary_agent: builder-*` |
| 3 | `.claude/skills/architect-{be,agentic}/SKILL.md` | no `backend/src/{shared,core}/` greps |
| 4 | `docs/specs/templates/dispatch-plan-template.md` | file exists |
| 5,6 | `CLAUDE.md` + `.claude/rules/*` + machinery skill/agent dirs | required rules exist+registered; rule refs resolve |
| 7 | `.claude/agents/auditor-{backend,frontend,agentic}.md` | `Edit` in `tools:` |
| 8 | **`scripts/git-hooks/pre-commit` + `checks/*.sh`** | `validate_machinery_consistency` string present (self-wired) — **W4b must not remove the `checks/18` invoke** |
| 9 | `docs/specs/templates/01-spec*-template.md` (+ brand overrides) | MANDATORY_SPEC_CONCEPTS present |
| 10 | `scripts/resolve_cap.py` + 5 builder/architect surfaces | `resolve_cap.py` referenced |
| 11 | `scripts/validate_code_cap_bidirectional.py` + its test + `resolve_cap.py` + `new_cap.py` + `validate_caps_schema.py` + `cap_doctor.py` + `generate_code_to_cap_index.py` + **`pre-commit` (`checks/05e`)** + `pre-push` | gates G1-G9 + negative tests + `cap-gates-hard` wired in BOTH hooks |
| 12 ★ | **`tools/luana-cockpit/components/cap-drawer/sections/ScenariosSection.tsx`** | no version-jargon (`v3.x/F.3/migrar`) + has `userFacingDescription` fallback — **W4b cockpit edits to this file are gated** |
| 13-18 | `dev-team`/`checkpoint-template`/`story-closure-gate`/`auditor`/4×pm skills + `#37` rule | G/R/auditor spine wiring (`AWAIT_CHRIS_VERIFY`, `chris_verify.signoff`, `reconciled`, no `demo_signoff.result`) |
| 19-21 | **`scripts/mutation_gate.py`** + `04-validators-template.yaml` + architect + `#37` | `technical_gates.mutation` block + `tool is None`/`DEGRADADO`/`return 0` + `L4`/`continuous-improvement` strings |
| 22 ★ | `docs/process/continuous-improvement.md` + **`tools/luana-cockpit/lib/harness-backlog.ts`** | CIL 4-home router strings + `HarnessCarril`/`HarnessSeveridad` types — **W4b cockpit `harness-backlog.ts` edits gated** |
| 23 | `.claude/skills/harnesses-improvement/SKILL.md` + **`.claude/workflows/harness-audit.js`** | 4-lane read + deep-sweep invoke + workflow exists |
| 24 | `learning-capture.md` + `continuous-improvement.md` | CIL carril routing |
| 25-27 | `01-spec-template.md` + `auditor`/`dev-team` skills + `story-closure-gate.md` | live ledger column + producer step + PISO HARD happy-path |

**Two cockpit files (CHECK 12, 22) and three scripts (`mutation_gate.py` CHECK 19-21; `resolve_cap.py`/`validate_code_cap_bidirectional.py`/`new_cap.py`/`validate_caps_schema.py`/`cap_doctor.py`/`generate_code_to_cap_index.py` CHECK 11) are W4b-territory bodies that the gate string-asserts.** Any W4b stub/tier-tag-comment edit to them must preserve those substrings. The machinery validator itself: **tier `hybrid`** (the 4 pm-{brand} paths + `hipaa` comment are its only proxy hits; the CHECK *framework* is core, the *file lists* are project → seam).

---

## 6 · `warp-workflows/` — directory classification

**tier: project** (as a whole). The 6 `.yaml` are thin Warp-palette wrappers around the 6 `git/*` scripts (opencode/Warp parity per D14); the README names the 4 active brands in the opencode workflow. Per-yaml purpose:

| yaml | wraps | purpose |
|---|---|---|
| `sync-check.yaml` | `git/check-sync.sh` | step-0 sync from the palette |
| `push-wip.yaml` | `git/push-wip.sh` | pre-push sync+push (prompts branch) |
| `new-session.yaml` | `git/new-session.sh` | create worktree (prompts BRAND/TYPE/SLUG) |
| `cleanup-session.yaml` | `git/cleanup-session.sh` | cleanup worktree (prompts SLUG) |
| `status-all.yaml` | `git/status-all.sh` | dashboard |
| `regenerate-manifest.yaml` | `git/regenerate-manifest.sh` | rebuild manifest |

The **mechanism** (palette-wraps-a-script) is core-ish/portable, but the content (brand list, opencode-specific prose) is project. W5 seam: `brands[]`. Low-use (opencode-only channel; Claude Code uses the scripts directly via Bash). No paper-rules; all wrapped scripts exist. Not orphaned (referenced by `parallel-sessions-protocol.md §D14`).

---

## 7 · Findings deferred / for W4b apply + downstream WS

- **APPLY in W4b (path-stable, recommend):**
  - **S1+S2** `validate_session_close.py`: root `.venv` + brand-loop the stories/BACKLOG globs (the Stop hook currently under-enforces multibrand caps — biggest functional finding of this batch). S3/S4/S5 = vocab hygiene in the same file.
  - **Paper-rule #1**: `validate_ci_parity_mirror.py` repoint `deploy-prod.yml`→`ci.yml` (+ re-derive the gate steps) OR retire under github-actions-deferred (loud, not silent exit-2).
  - **Paper-rule #2**: `ci-parity.sh` marker name → add `$BRAND` to the pre-push read, or drop the brand from the writer (align the two).
  - **Paper-rule #3**: `ci-parity.sh` header doc-rot (`deploy-prod.yml` ×2).
  - **Tier-tag comments** on the ~30 files (W4-style inline `# tier:`), if W4b chooses to inline-tag (this manifest is authoritative for W7 either way).
- **W5 seam wiring:** every `hybrid`/`project` script's brand-enum / `.venv` / ports / dev-app URLs / engine_prefix → `brands[]` / `toolchain` / `live_verify_infra` / `engine_prefix`. The recurring **hardcoded brand enum** (`new-session.sh`, `check-sync.sh`, `cleanup-session.sh`, `regenerate-manifest.sh`, `learning/capture.sh`, `postgres-init`, all cockpit/dev-app/e2e port maps) is the #1 W5 target — lifts most `hybrid`→`core`.
- **W7 physical move:** the ~6 core-tagged coordination scripts (`commit-paths`, `session-lock`, `multi-session-scope-guard`, `dod-evidence-gate`, `cleanup-wip-branches`, `ps1-luana`) → `core-harness/scripts/`; project ops shells (docker/cockpit/ci-parity/dev-app/cloudflared/litellm/e2e/release) → `project-profile/scripts/`.
- **Fail-OPEN silent-degrade (W4 §2 echo):** `ci-parity.sh`'s silent swallow of the broken mirror-validator is the same "HARD gate degrades to no-op" pattern — the deferred-CI status masks it today; revisit at CI reactivation.
- **Pre-existing, NOT this batch:** `validate_atomics_implementation.py` (root `scripts/`, NOT in my batch) is a likely dead artifact (atomics killed) — flag for W4b/W6 to confirm/retire.

---

## 8 · Pointers
- `docs/process/harness-refactor-charter-2026-06-08.md` §0.5/§3/§4/§6 — north-star + seam slots + fitness + roadmap.
- `docs/process/harness-refactor-w0.5/PROCESS-MODEL.md` §1 (10-states+{G,R,C,D}), §2 (spine), §5 (D3 single-hub, D4 repro=evidence, demo_signoff→chris_verify), §6 (conformance), §7 (cockpit).
- `docs/process/harness-refactor-w4/W4-OUTPUT.md` §5 (install-drift), §6 (Stop-hook handed to W4b; `dod-evidence-gate` demo_signoff fix already done; multi-session-guard v5-clean).
- W3/W4 precedent: option-b proxy · propagation-grep · validate-after-apply · two-level consumer check.

*End RESEARCH-batch-C.md — 30 files classified · 6 paper-rules/dead-refs (4 real) · 5 stale-vocab findings (all in the Stop hook) · machinery body-string dependency map (§5) · NO edits (research only).*
