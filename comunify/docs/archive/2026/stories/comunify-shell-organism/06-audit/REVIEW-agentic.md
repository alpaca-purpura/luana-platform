<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->
# Agentic Review — comunify-shell-organism (AGENTIC surface · thin copilot mount)

> Auditor: `auditor-agentic` (flagship) — invariants validated against canonical docs as of 2026-06-17
> Brand: comunify · Iter: 1
> Verdict: **PASS**
> Generated: 2026-06-17

## Inputs
- CONTEXT-BRIEF.md: used (R24 gate OK — `Validator pass: INLINE_PROBE_CLEAN` populated, `Faithfulness flag: clean` non-blocking)
- gate-output.json: not present → verified gates directly (mount tests + arch fitness + ruff native)
- Skills invoked: copilot-expert=Y, sales-agent-expert=Y (auto-loaded; N/A — sales untouched)
- Scope: AGENTIC surface ONLY. FE shell/tokens/chat-store + IAM BE → `auditor-frontend` / `auditor-backend` files (not scored here).

## Surface nature (NARROW)
comunify is the **1st brand** to mount the engine copilot `/chat` via a **thin reexport** (CONSUMES `core/luana-core-copilot`, writes ZERO agentic code). Per 04-validators § agentic_eval this is THIN by design ("consume engine as-is") — no behavior goldens required. My job: verify consumption is correct + thin + on the right side of the engine/extension boundary. I did NOT review engine internals.

## Gate status (verified directly)
| Gate | Status | Errors |
|---|---|---|
| ruff check (main.py + copilot/) | PASS | 0 |
| ruff format --check (main.py + copilot/api/) | PASS | 0 (2 files already formatted) |
| pytest test_chat_mount.py | PASS | 0 (4/4 passed) |
| arch-fitness (tests/architecture/) | PASS | 0 (144 passed) |
| pip-audit | n/a | not run (no dep added in story BE commits; engine dep entered via main merge) |

## 16 categories
| # | Category | Score | Evidence |
|---|---|---|---|
| 1 | LangGraph state hygiene | n/a | engine-owned; brand adds zero graph/state code |
| 2 | Tool registration & no-fake-ifs | PASS | no `tools/` dir (RN-3 by construction); no keyword `if` branching; thin reexport only |
| 3 | Prompt cache architecture | n/a | engine-owned; brand adds zero prompt slots |
| 4 | deepagents subagent isolation | n/a | engine-owned |
| 5 | Observability (`copilot_trace_event` + cost) | PASS | engine emits trace; brand adds NO observability code, NO naked LLM call (grep litellm/ChatOpenAI/.invoke/.stream in copilot/api/+main.py → 0). DB: 21 rows scoped to tenant `9cf1ef9b…` |
| 6 | Eval goldens (sales_agent) | n/a | sales_agent untouched; THIN agentic_eval (no behavior goldens — by design) |
| 7 | RAG / Qdrant hygiene | n/a | engine-owned; brand adds zero vector ops |
| 8 | LLM provider routing | n/a | engine-owned; no model strings in brand surface |
| 9 | Cost optimization | n/a | engine-owned; THIN mount |
| 10 | Channel format & brand voice | PASS (with deferred debt) | brand surface hardcodes no voice; `_BASE_IDENTITY="Nicolify"` is ENGINE debt, correctly captured as /pm-luana (see Research notes) — NOT a brand-surface finding |
| 11 | DDD compliance (brand extension) | PASS | reexport in `copilot/api/`; mount in `main.py`; imports engine via `from luana_core_copilot.api.chat import router`; no cross-brand import (docstring refs only) |
| 12 | Tests / TDD | PASS | `test_chat_mount.py` 4 tests (mount present / 200 SSE / 401 no-auth / no-tools-dir RN-3); RED-first per impl-log |
| 13 | Mirror detection | PASS | `copilot/api/__init__.py` is canonical thin-mount; vitalia's copilot/api is a DIFFERENT surface (own routes+dtos, empty `__init__`, no engine reexport) → not a cross-brand mirror; no observability/turn_envelope/callback_handler mirror |
| 14 | Default-flip side-effect coverage | n/a | no platform config default flip in story BE commits (grep clean) |
| 15 | Decisions honored cite (R6) | n/a | agentic ticket has no `decisions_applicable` field |
| 16 | Connectivity (anti-isla) | PASS | mount notarized via `include_router` in `main.py`; consumed by FE chat-store hitting `/api/v1/comunify/copilot/chat` (live-verified, see DB rows) |

## Findings (file:line)

### FAIL
- (none)

### WARN
- (none)

### info
- [Cat 13] `comunify/backend/src/modules/comunify/copilot/api/__init__.py:21` — the engine reexport pattern is flagged **LIFT CANDIDATE** in CONTEXT-BRIEF §3 (other brands will inherit the same thin mount). Not a finding for this story — track as a future `/pm-luana` lift when ≥2 brands replicate. Captured.
- [Cat 5/10] `comunify/docs/learnings/2026-06-17-engine-deuda-surfaced-by-shell-organism.md` — three engine debts surfaced by being the first brand to drive real `/chat` traffic (Settings 16-field required → Optional; `_BASE_IDENTITY` hardcoded "Nicolify"; copilot/llm/observability engine tables without migrations). All three correctly routed to `/pm-luana` promotion. Verified the capture exists and the diagnosis is corrected (prompt_versions is sales_agent-only, NOT on the copilot chat path — materializing it would be dead code). **NOT in scope to fix here** (engine boundary).

## Engine boundary verification (HARD — the load-bearing check)
- Story BE commits (`3b6670ba` mount, `0a968fd9`, `73d84922`, `65ffe9c6`, `3302621d`) touch **ZERO** files under `core/luana-core-copilot/src/`. Confirmed by per-commit `--name-only | grep core/`.
- The enabling engine fix `e9f16d06` ("Settings lazy — /chat brand-mountable") is a **SEPARATE engine commit on `main`**, owned by `/pm-luana`, with promotion proposal `docs/promotion-protocol/proposals/2026-06-16-copilot-chat-brand-mountable.md` in state `accepted` (ratified Chris 2026-06-16). It entered this branch via `Merge branch 'main'` — it is NOT one of the builder's story commits. This is the boundary working correctly: the engine change went through the promotion gate, the builder consumed it.
- Engine-edit detection (downstream-regression rule): promotion proposal verified `accepted`. PASS.

## Cross-scope flags
- FE (shell wrapper, tokens, chat-store, e2e) + IAM BE mount + `next.config.ts` rewrite → owned by `auditor-frontend` / `auditor-backend`. NOT scored here. The reconcile-fixed bugs (`fe-api-rewrite-missing`, `plataforma-avatar-500`) are FE-surface and out of agentic scope.

## Downstream regression scope
| Surface touched | Downstream test targets | gate-runner status |
|---|---|---|
| `comunify/.../copilot/api/__init__.py` (thin reexport) | `comunify/backend/tests/modules/comunify/copilot/` + `tests/architecture/` | PASS (4/4 mount + 144 arch) |
| `comunify/backend/src/main.py` (include_router guarded) | `comunify/backend/tests/architecture/` (boot/redirect_slashes/cross-module) | PASS (144) |
| engine `e9f16d06` (NOT this story — on main via promotion) | engine `core/luana-core-copilot/tests/` (R3 ∀ brand per proposal) | out of this story's scope — owned by /pm-luana promotion R3 |

No cross-brand consumer tests apply (brand extension is comunify-local; the only cross-consumer surface is the engine, handled by the accepted promotion).

## Research notes (THIN — no novel pattern introduced)
- The surface introduces no new LangGraph topology, cache slot, or eval methodology — it consumes the existing engine `/chat` endpoint as-is. No live canonical-doc validation required.
- Knowledge cutoff disclosure: the model has a static cutoff (Jan 2026); this review used the live workspace state on 2026-06-17. No external doc fetch needed for a thin mount.
- Delta vs reference anchors: none.

## agentic_eval checks (04-validators § CATEGORÍA 4)
| Check | Result |
|---|---|
| agentic-trace-scoped (`≥1 copilot_trace_event WHERE tenant_id=:tid`) | PASS — DB returned **21** rows scoped to `9cf1ef9b-958e-55b0-8b4f-ff603ba23095` (e2e runs left ~20, as expected) |
| agentic-no-tools-registered (`test -d copilot/tools` → OK) | PASS — no `tools/` dir; copilot has only `extractors/ kb/ workflows/ api/` |
| agentic-no-domain-write (RN-3) | PASS by construction — no domain tools registered → Luana cannot execute → zero domain writes possible |

## Recommendations for builder fix-loop
- None. The surface is correct, thin, and on the right side of the engine boundary. No CHANGES_REQUESTED.

## Drift detection (CONTRACT vs code)
- NO drift. 03-arch-agentic.md specified exactly: (1) thin reexport in `copilot/api/__init__.py`, (2) `include_router(prefix="/api/v1/comunify/copilot")` in main.py, (3) NO domain tools (RN-3), (4) NO observability mirror. All four honored verbatim. The only deviation (deps in `comunify/pyproject.toml` vs `comunify/backend/pyproject.toml`, then omitted entirely in v2) is documented in the impl-log and matches the established vitalia/nicolify workspace-root resolution convention — it serves the architect's INTENT (import resolves, app boots), not a contract violation.
- The try/except guard around the import (defense-in-depth: an optional engine mount must never crash brand boot) is a sound resilience addition consistent with copilot-resilience best-effort posture — NOT scope creep.
