# W4b · Scripts — RESEARCH Batch B (portfolio/backlog/system-map/release + migrations + metrics)

**Date:** 2026-06-09 · **Session:** harness-refactor W4b (B-phase) · **Owner:** harness-dedicated, Opus · **Branch:** `wip/vitalia` · **Mode:** READ-ONLY research (no edits applied — classification + conformance audit only).

> **North-star card:** *This session succeeds only if (1) it implements its work-type per `PROCESS-MODEL.md`, AND (2) every file it tags `core` names ZERO tech/brand tokens (the rest went to the seam). The goal is an extractable `core-harness/`, not a nicer luana harness. Measured by the dependency-grep (§4) — the cheap W8.*

Scope: 15 Python scripts + 2 one-time migration JSON reports (`scripts/`). Charter §0.5 option-b proxy applied (`tier:core` EARNED only if dependency-grep = 0; any token ⇒ `hybrid` core-half + project-half parked → seam). Consumer-side verified (`Makefile` / `scripts/git-hooks/` / `.claude/hooks/` / `.claude/skills/` / `tools/luana-cockpit/` / `docs/process/`), never the producer's self-description.

---

## 0 · Headline result

- **15 scripts + 2 JSON classified.** Tier shape mirrors W3/W4: almost all `hybrid` (generic mechanism + brand/`.venv`/path runner-half), **0 proxy-clean `core`**, **0 brand**, **1 project** (`migrate_to_release_schema` — 23 hits, vitalia-hardcoded release catalog).
- **No critical paper-rules** in the live-consumed scripts. Every Makefile target / hook-sourced script resolves on disk + sibling helpers (`build_live_reconciliation_matrix.py`, `migrate_capability_ledger.py`) exist.
- **2 stale-vocab findings (LIVE, low-sev):** (1) `generate_portfolio.py` brand 1-pager emits an `Outcomes` surface row + ownership line pointing at `{slug}/docs/product/outcomes/` — **purged at brand level** (4-ejes); (2) `generate_backlog.py::_map_legacy_phase_to_state` carries the retired `phase_workflow` A-F vocab (PM_DRAFT/PO_SPEC/ARCH_DONE) — but it is a **legacy-coercion bridge** (root scope only), a tombstone, not a live directive → keep.
- **`generate_backlog.py::read_outcomes` is NOT stale** (W4 note confirmed empirically): platform `docs/product/outcomes/` EXISTS (16 `.md`) and is read in **root scope only**; the purge is brand-level. Touching it breaks a live regen trigger.
- **3 dead/orphan → recommend `legacy/2026-06-09/`:** `validate_atomics_implementation.py` (atomics killed 2026-05-28, 0 live refs), `propagate-adr-vitalia-004.py` (one-time, brand-named, only the ADR refs it), `test_delta_check.py` (one-time, only the ARCHIVED `luana-nicolify-migration` story refs it).
- **2 one-time migration tools = keep-as-tombstone** (idempotent, Makefile-wired `migrate-vitalia-schema`): `migrate_to_release_schema.py` + `map_zones_migration.py`. **2 JSON reports = keep** (immutable audit-trail of a completed run).

---

## 1 · Classification table

| Script | One-line purpose | Consumer | tier | proxy-hits | paper-rules | stale-tokens | conformance | orphan-verdict |
|---|---|---|---|---|---|---|---|---|
| `generate_backlog.py` | Regen `BACKLOG.{yaml,md,TLDR}` from ideas/outcomes/stories/caps/releases (per-brand + root) | Makefile `backlog-vitalia`(L254) · checks `06-backlog.sh`,`07-checkpoint-enum.sh` · 5 PM skills | **hybrid** | 5 (docstring `--brand vitalia` examples + `ruff:noqa` comment) | none | `_map_legacy_phase_to_state` = retired `phase_workflow` (tombstone, KEEP); platform `read_outcomes` (NOT stale, KEEP) | 10-state `STATE_ORDER` canonical ✓; legacy v3→v4 coercion correct | LIVE · keep |
| `generate_portfolio.py` | Regen `docs/portfolio/*.md` (11 universos grid + 1-pagers) | Makefile `portfolio`(L164)/`portfolio-check`(L167) · `06-backlog.sh` · 5 PM skills | **hybrid** | 6 (hardcoded 10-brand `UNIVERSES`) | none | **L327/340 `outcomes/` brand surface row → purged dir (LIVE stale, low-sev)** | brand enum should be `brands[]` seam | LIVE · keep (flag L327) |
| `generate_infra_matrix.py` | Regen `INFRA-MATRIX.md` from `{brand}/config/brand.yaml::infra` | Makefile `infra-matrix`(L157) · `10-infra-matrix.sh` · pm-luana | **hybrid** | 1 (`.venv` in usage docstring only) | none | clean; auto-discovers brands via glob (OCP-good) | `.venv` → `toolchain` seam | LIVE · keep |
| `generate_actions_index.py` | Compose `_actions-index.json` (cap→action, Plano 2) from `_code-index.json` + cap YAMLs | `build_live_reconciliation_matrix.py` (EXISTS) · cap-determ-HANDOFF.md ("consumidor; verificar") | **hybrid** | 6 (`# cap:` header + `vitalia` default + path) | none | clean | default `--brand vitalia` + `vitalia.` cap-id fallback → `brands[]` seam | LIVE (verify-pending) · keep |
| `validate_system_map.py` | Validate cap `functional_area`/`map_box` + story `cap_target` ∈ SYSTEM-MAP (3 checks) | Makefile `system-map-validate`(L205)/`-all`(L207) · `15.5-system-map.sh` | **hybrid** | 3 (docstring ADR ref + `--brand vitalia` examples) | none | clean; smoke PASS live | ADR ref + `.venv` → seam | LIVE · keep |
| `map_zones_migration.py` | One-time idempotent re-tag of cap YAMLs with `map_box` (5th dimension) | cap-determ-HANDOFF.md L29 (test ref `test_map_zones_migration.py`) | **hybrid** | 4 (vitalia agents/boxes hardcoded) | none | clean (uses zones[].boxes v2.0) | SPECIALIST_AGENTS + VALERIA_OVERRIDES = brand roster → `agent_roster`/`brands[]` seam | one-time migration · keep-as-tombstone (idempotent) |
| `migrate_to_release_schema.py` | One-shot Phase-3 migration: F0..F8 release YAMLs + checkpoint v2 fields + chris-input.md | Makefile `migrate-vitalia-schema`(L271) · release-protocol.md | **project** | 23 (entire vitalia release catalog F0..F8 + slug heuristics) | none | self-test `--self-test` green; idempotent | vitalia-specific catalog = pure PROJECT data | one-time migration · keep-as-tombstone |
| `scan_promotables.py` | Scan `{brand}/docs/learnings/` for `promotable: candidate\|yes` → `scan-{date}.yaml` clusters | Makefile `scan-promotables`(L169) · W0.5 AS-IS WT6 docs | **hybrid** | 1 (hardcoded `BRAND_SLUGS` list) | none | clean; WT6-promotion aligned | `BRAND_SLUGS` → `brands[]` seam | LIVE · keep |
| `emit_process_metric.py` | Append 1 metric row to `metrics/runs.jsonl` (orchestrator-level) | `.claude/skills/{auditor,dev-team}/SKILL.md` (R12 layer 1) | **hybrid** | 0 | none | `--phase` choices = `po/architect/build/audit/...` (process phases, not stale) | PI/sprint legacy args = harmless metadata | LIVE · keep (proxy-clean but PI/sprint legacy fields → see note) |
| `extract_baseline_metrics_from_transcripts.py` | Harvest token/cache/tool metrics from CC JSONL transcripts → baseline jsonl | `.claude/skills/dev-team/SKILL.md` · metrics/README.md | **hybrid** | 0 | none | clean; CC transcript schema (current) | hardcoded `~/.claude/projects/-home-chris-AISALESHT` path (stale dir name) → see note | LIVE (one-shot baseline) · keep |
| `extract_changelog_section.py` | Extract a `CHANGELOG-PUBLIC.md` section for release notes | `.github/workflows/cd-prod.yml` L143 (GH-Actions **deferred**) | **hybrid** | 3 (docstring `--brand vitalia/nicolify` examples) | none | clean; Keep-a-Changelog ES | `--brand` → `brands[]` seam | LIVE-deferred (GH Actions) · keep |
| `test_parse_release.py` | Validate `release/{brand}-vX.Y.Z` branch regex (cd-prod parse helper) | cicd-multibrand-runbook.md · was 04-validators of archived S-CICD-DEPLOY | **hybrid** | 5 (`KNOWN_BRANDS` whitelist + fixtures) | none | clean | `KNOWN_BRANDS` → `brands[]` seam | LIVE-deferred (CI/CD runbook) · keep |
| `test_delta_check.py` | Story-10 test-parity gate (baseline vs current pytest/vitest JSON, new_failures≤cap) | **only** ARCHIVED `luana-nicolify-migration` 04-validators/06-tickets | **hybrid** | 9 (pytest/vitest/nicolify-migration paths) | none | D5 cap-delta doctrine (one story) | — | **ORPHAN** (one-time story tool) · recommend legacy |
| `propagate-adr-vitalia-004.py` | One-time: add `architecture_pattern: ADR-vitalia-004` field to vitalia story checkpoints | **only** the ADR itself (`vitalia/docs/architecture/ADR-vitalia-004...`) | **hybrid** | 13 (vitalia stories + ADR name) | none | idempotent | — | **ORPHAN** (one-time, brand-named) · recommend legacy |
| `validate_atomics_implementation.py` | Verify `atomics[].verification` paths exist → `_atomics-verification.json` | **NONE** (0 Makefile/hook/skill/cockpit/process refs) | **hybrid** | 2 (`--brand vitalia` examples) | n/a (dead) | **`atomics` KILLED 2026-05-28** (4-ejes; cross_check_1 removed); output JSON not consumed by cockpit | violates conformance §6.5 (cites dead concept) | **DEAD** · recommend legacy |
| `migrate-capability-ledger-report-2026-05-27.json` | Audit-trail JSON of `migrate_capability_ledger.py` run (71 caps, vitalia) | (output report — no consumer) | project | n/a | n/a | n/a (immutable history) | n/a | one-time report · keep (audit history) |
| `migrate-report-2026-05-27.json` | Audit-trail JSON of `migrate_to_release_schema.py` run (9 releases, vitalia) | (output report — no consumer) | project | n/a | n/a | n/a (immutable history) | n/a | one-time report · keep (audit history) |

**Counts:** core 0 · hybrid 13 · project 2 (`migrate_to_release_schema` + the 2 JSON, where JSON are data) · brand 0. Dead/legacy-recommend: 3 (`validate_atomics_implementation`, `propagate-adr-vitalia-004`, `test_delta_check`).

---

## 2 · No-paper-rules verification

Every cited path/script/make-target in the live-consumed scripts `test -e`-verified:
- **Makefile targets present:** `infra-matrix`(157), `portfolio`(164), `portfolio-check`(167), `scan-promotables`(169), `system-map-validate`(205/207), `backlog-vitalia`(254), `migrate-vitalia-schema`(271). All resolve.
- **Sibling consumers exist:** `scripts/build_live_reconciliation_matrix.py` ✓ (consumes `_actions-index.json`), `scripts/migrate_capability_ledger.py` ✓ (producer of the ledger JSON, wired in `migrate-vitalia-schema` L272).
- **Hook-sourced scripts:** `generate_backlog`/`generate_portfolio` (06-backlog), `generate_infra_matrix` (10), `validate_system_map` (15.5) all resolve (cross-confirmed in W4 RESEARCH-checks).
- **`generate_actions_index`** is cited in `cap-deterministic-enforcement-HANDOFF.md` as a *consumer to verify* — no broken claim; live but verification-pending (downstream WS).
- **Smokes (read-only):** `validate_system_map --brand vitalia` → **✅ PASS (0 issues)**; `generate_portfolio --check` runs clean (reports placeholder-brand drift = normal regen, not a code fault); `migrate_to_release_schema --self-test` has inline asserts (green per source).

**No critical paper-rules found.** The dead/orphan scripts are not paper-rules (they simply have no live consumer), addressed in §6.

---

## 3 · Process conformance (per PROCESS-MODEL §6)

- **10-state vocab (§1):** `generate_backlog.py::STATE_ORDER` (L60-71) = canonical 10 (`idea…done` + `parked/dropped`) ✓. `LEGACY_STATE_MAP` (L78) correctly coerces v3→v4 (`validated→refining`, `building→developing`, `review→reviewing`). No `blocked` macro-state: the only `status == "blocked"` (L445) maps a legacy **status field** → `parked` (bridge, correct).
- **4-ejes (Release→Story→Cap→Scenario):** `generate_backlog` reads `releases/F*.yaml` (schema v2) + groups stories-by-release ✓; `validate_system_map` validates cap `functional_area`/`map_box` + `cap_target` ✓. Both honor the post-2026-05-28 model.
- **5 story-types:** none of the batch hardcodes the OLD 4-type set; `migrate_to_release_schema` writes `cap_change_type: new|fix|extend|derive` (correct v2 vocab).
- **WT6 promotion:** `scan_promotables` aligns with the off-spine lift process (clusters ≥2 brands → proposal) ✓.

### Stale findings (file:line)

| # | Token | Where | Verdict |
|---|---|---|---|
| 1 | `outcomes/` brand surface | `generate_portfolio.py:327` (`\| Outcomes \| {slug}/docs/product/outcomes/`) + `:340` ("owner backlog, outcomes, stories") | **LIVE STALE (low-sev)** — brand `outcomes/` purged (4-ejes; `vitalia/docs/product/outcomes/` confirmed MISSING). Emits a dead link in every brand 1-pager. Fix → drop the row / swap to `releases/`. (`:403` "Roadmap platform: docs/product/outcomes/" is the **platform** dir = NOT stale.) |
| 2 | `phase_workflow` A-F (`PM_DRAFT/PO_SPEC/ARCH_DONE/BUILD_T*/AUDIT_*`) | `generate_backlog.py:436-462` (`_map_legacy_phase_to_state`) | **TOMBSTONE — KEEP.** Pure legacy-artifact coercion, root-scope only (`if brand is None`); per-brand never had `docs/projects/`/`pm-nico/`. Maps old phase strings → 10-state. Retired as operator-facing (X6) but this bridge reads historical files; not a live directive. |
| 3 | `outcomes` platform read | `generate_backlog.py:228 read_outcomes` (root scope) | **NOT STALE — KEEP** (W4 note confirmed: platform `docs/product/outcomes/` EXISTS, 16 files). Purge is brand-level only. |
| 4 | `atomics` | `validate_atomics_implementation.py` (whole file) | **DEAD concept** (killed 2026-05-28). Script is the only place atomics survives in this batch → covered by §6 dead-verdict (move to legacy, don't "fix"). |

CLEAN of `02-design-ui`, `cross_check_1/2`, `demo_signoff` across all 15 scripts (grep = none).

---

## 4 · Tier reasoning (proxy-earned, charter §0.5)

- **0 proxy-clean core.** Even the 2 zero-hit scripts (`emit_process_metric`, `extract_baseline_metrics_from_transcripts`) carry **non-token project coupling** that the proxy doesn't catch: `emit_process_metric` bakes a `PI/sprint` legacy taxonomy + a fixed `--phase` enum (process-phase names = arguably CORE doctrine, but the PI/sprint scaffolding is project-historic); `extract_baseline` hardcodes `~/.claude/projects/-home-chris-AISALESHT` (a **stale single-product transcript dir name** — predates multibrand). Both are `hybrid`: the metric-emit/harvest **mechanism** is portable CORE IP, the path/taxonomy is project. (Consistent with W4's "core is rare" learning — the portable IP is the *contract/skeleton*, not the runner.)
- **`migrate_to_release_schema` = the one true `project`** in the batch: 23 hits, the entire body is a vitalia release catalog + slug→release heuristics. Nothing portable beyond the upsert helper — it is project data, not a core mechanism.
- **The recurring W5 target** (same as W4): the hardcoded brand enum — `generate_portfolio.UNIVERSES`, `scan_promotables.BRAND_SLUGS`, `test_parse_release.KNOWN_BRANDS`, `map_zones.SPECIALIST_AGENTS/VALERIA_OVERRIDES` — lifts most `hybrid`→`core` once `brands[]`/`agent_roster` seams exist. `.venv` literals → `toolchain` seam.

---

## 5 · One-time / migration tooling verdict

| Script | Nature | Recommendation | Reasoning |
|---|---|---|---|
| `migrate_to_release_schema.py` | one-shot Phase-3 data migration, idempotent, Makefile-wired (`migrate-vitalia-schema`) | **KEEP** in `scripts/` | Idempotent + re-runnable + Makefile target alive; safe to leave. A future product re-runs an analogue. Not extractable as-is (vitalia catalog) → W7 may relocate to `project-profile/`. |
| `map_zones_migration.py` | one-shot map_box re-tag, idempotent, HALT-no-silent | **KEEP** as tombstone | Idempotent; referenced by a live test (`test_map_zones_migration.py`); harmless re-run. Brand-roster hardcode → W5 seam. |
| `migrate-capability-ledger-report-2026-05-27.json` | audit-trail report of a completed run | **KEEP** (history) | Immutable record; not consumed; deleting loses provenance. Tiny. |
| `migrate-report-2026-05-27.json` | audit-trail report of a completed run | **KEEP** (history) | Same. |

---

## 6 · Dead/orphan → recommend `legacy/2026-06-09/`

1. **`validate_atomics_implementation.py` — DEAD (confirmed).** My grep across `Makefile scripts .claude docs/process tools/luana-cockpit`: **0 live references** (only its own file). `atomics` was killed 2026-05-28 (4-ejes consolidation; `cross_check_1 atomics→headers` removed from the bidirectional validator per W4 §3 finding #1). Its output `_atomics-verification.json` is **not consumed by the cockpit** (grep = 0). Violates conformance §6.5 (cites a retired concept). **Recommend → `legacy/2026-06-09/` (W9 deletes after extraction test).** Do NOT "fix" — the concept is gone.
2. **`propagate-adr-vitalia-004.py` — ORPHAN, one-time, brand-named.** Only reference anywhere is the ADR it propagates (`vitalia/docs/architecture/ADR-vitalia-004-*.md`). A completed one-shot checkpoint-field backfill (idempotent). No Makefile/hook/skill. **Recommend → `legacy/2026-06-09/`.**
3. **`test_delta_check.py` — ORPHAN, one-time story tool.** Only referenced by the **ARCHIVED** `docs/archive/2026/stories/luana-nicolify-migration/{04-validators,06-tickets,...}` (Story-10 D5 cap-delta gate). No live Makefile/hook/skill. The migration it guarded is done + archived. **Recommend → `legacy/2026-06-09/`.** (Note: not strictly broken — would still run given baseline JSONs — but it has no live caller.)

**Edge / keep-but-watch:** `test_parse_release.py` + `extract_changelog_section.py` are tied to **GH-Actions (deferred)** `cd-prod.yml` / the CI/CD runbook — not orphans (live consumer exists, just not currently executing per `github-actions-deferred.md`). **Keep.**

---

## 7 · Findings for downstream WS (honest scope)

- **W5 seam:** the brand-enum smear (`UNIVERSES`/`BRAND_SLUGS`/`KNOWN_BRANDS`/`SPECIALIST_AGENTS`) → `brands[]`/`agent_roster`; `.venv` → `toolchain`; `engine_prefix` for `core/luana-core-*` doc-links in `generate_portfolio` (luana 1-pager). Biggest single lift.
- **W6/conformance fix (low-sev):** `generate_portfolio.py:327/340` `outcomes/` brand surface row → dead link (brand `outcomes/` purged). Swap to `releases/` or drop.
- **W7 relocation:** `migrate_to_release_schema.py` (pure project catalog) + the 2 JSON reports → `project-profile/` candidate. `extract_baseline_metrics` hardcoded `…/-home-chris-AISALESHT` dir name is stale (single-product, pre-multibrand) → repoint when transcript path becomes a seam.
- **W9 legacy delete:** the 3 dead/orphan above (`validate_atomics_implementation`, `propagate-adr-vitalia-004`, `test_delta_check`) — move to `legacy/2026-06-09/` now, delete after W8 extraction test.
- **`emit_process_metric` PI/sprint legacy fields:** the `--pi/--sprint` args reflect a retired (PI/sprint) project structure; the metric **mechanism** is sound — note for W7 (the args are optional/nullable, no breakage).

---

## 8 · Pointers

- `docs/process/harness-refactor-charter-2026-06-08.md` §0.5 (option-b proxy), §3 (seam slots), §4 (fitness), §6 (roadmap) · §7 B-phase recurring learnings.
- `docs/process/harness-refactor-w0.5/PROCESS-MODEL.md` §1 (10-state + retired phase_workflow), §5 (outcomes purged brand-only; generate_core_modules hand-maintain), §6 (conformance checklist).
- `docs/process/harness-refactor-w4/W4-OUTPUT.md` §3 — B-phase precedent + the explicit `generate_backlog::read_outcomes` platform-read-is-correct note (confirmed here empirically: platform `docs/product/outcomes/` EXISTS).

*End RESEARCH-batch-B.md — 15 scripts + 2 JSON classified · 0 core / 13 hybrid / 2 project / 0 brand · 0 critical paper-rules · 2 live stale (1 fix, 1 tombstone-keep) · 3 dead/orphan → legacy.*
