# T-agentic — RESULT (comunify-shell-organism · BE thin copilot mount)

> Surface: AGENTIC · production_code: true · tier: flagship (R23 HARD)
> State: tests-passing · Brand: comunify · Date: 2026-06-16

## Verdict

`tests-passing` — thin mount of engine copilot `/chat` complete. All ticket
validators GREEN. The engine `/chat` router mounts cleanly thin (no blocker;
architect boundary-check held). Awaiting orchestrator → gate-runner →
auditor-agentic (independent verdict).

## Scope delivered

| File | Change | Notes |
|---|---|---|
| `comunify/backend/src/modules/comunify/copilot/api/__init__.py` | NEW | Thin reexport: `from luana_core_copilot.api.chat import router as copilot_router`. Cap header. |
| `comunify/backend/src/main.py` | EDIT | `include_router(copilot_router, prefix="/api/v1/comunify/copilot", tags=["copilot"])` + import. Mirrors existing webhook_router mount. |
| `comunify/pyproject.toml` | EDIT | Added `luana-core-copilot` + `luana-core-iam` (workspace-member stub — see deviation note in impl-log). |
| `uv.lock` | EDIT | Re-locked: comunify now depends on luana-core-{copilot,iam} (editable). |
| `comunify/backend/tests/modules/comunify/copilot/test_chat_mount.py` | NEW | 4 tests (mount, 200 SSE, 401, no-tools). |
| `comunify/backend/tests/modules/comunify/copilot/conftest.py` | NEW | Engine `Settings()` env defaults (mirror engine copilot conftest). |
| `comunify/backend/tests/modules/{,comunify/,comunify/copilot/}__init__.py` | NEW | Package path. |

**Zero engine edits. Zero domain tools (RN-3). Zero observability mirror (anti-dup §0).**

## Skills consulted

- **copilot-expert** — §0 anti-dup cardinal (no observability mirror), "regla
  cero" (grepped engine `chat.py` → confirmed `router` is a plain `APIRouter`
  with `POST /chat`, not a factory), ENGINE/EXTENSION boundary (engine read-only,
  lift = `/pm-luana`), topology (only `api/` added, `extractors/kb/workflows`
  untouched).
- **sales-agent-expert** — auto-loaded; N/A (sales_agent untouched). Confirmed
  cross-agent §0 anti-dup (no observability mirror).
- **.claude/rules/anti-duplication.md §0** — engine consumed via import, not mirrored.
- **.claude/rules/tenant-isolation.md** — isolation delegated to engine deps
  (`get_current_user` + `get_tenant_context`); verified by 401 test (RN-2).
- **.claude/rules/backend-ddd.md** — thin API mount; `redirect_slashes=False`
  already present (arch suite green).

(Full skill decision narrative: `T-agentic-impl-log.md` § Skills Consulted.)

## Validator output (G5 smoke gate — all GREEN)

```
[1] nf-be-arch ............ 144 passed
[2] ticket test_chat_mount  4 passed
[3] nf-be-lint ruff check . All checks passed!
[4] nf-be-lint ruff format  19 files already formatted
[5] arch-be-mount-thin .... PASS (reexport grep + include_router grep)
[6] agentic-no-tools-registered  OK (no tools/ dir)
[7] agentic-trace-scoped .. VERIFIED-BY-READING (engine emits copilot_trace_event
                            scoped to tenant_id in orchestrator.stream_chat; no
                            recorder built here. Live DoD #37 write → T-e2e / gate G)
```

### Ticket tests (4/4 PASS)
- `test_chat_route_is_mounted_at_brand_prefix` — POST `/api/v1/comunify/copilot/chat` present
- `test_chat_returns_200_sse_with_valid_auth` — 200 `text/event-stream` (mounted, auth + tenant resolve, orchestrator mocked)
- `test_chat_without_auth_is_rejected` — 401/403 without JWT (engine auth, RN-2)
- `test_comunify_copilot_has_no_domain_tools_dir` — RN-3 by construction

### Regression
- Broader BE suite (arch + unit + extensions + modules): **312 passed** — no
  regression from the `main.py` import/mount edit or the new dep.

## Engine boundary (HARD) — clean

`git status` confirms NO edits to `core/`, `nicolify/`, `vitalia/`,
`sales_agent/`, or `copilot/{extractors,kb,workflows,observability}/`.
FE files (`globals.css`, `tailwind.config.ts`) belong to the concurrent
T-tokens session and were NOT staged (parallel-safety M14 — commit by pathspec).

## DoD #37 note

The agentic trace write (`copilot_trace_event` scoped to tenant) is EMITTED BY
THE ENGINE (`orchestrator.stream_chat`), not built here. The live write
(SC-chat-ok) is exercised in T-e2e against dev-app; if the comunify dev-app
tenant binding is still pending seed (MEMORY: comunify 🟡), it is signed in
gate G by Chris (per 04-validators `dev_app_verified.note` + 06-tickets open_items).

## Commit

SHA: see final reply line (committed by pathspec + pushed to `wip/comunify`).
