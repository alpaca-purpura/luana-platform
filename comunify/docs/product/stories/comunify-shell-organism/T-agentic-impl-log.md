# T-agentic — IMPL LOG (comunify-shell-organism · BE thin copilot mount)

> Surface: AGENTIC · production_code: true · tier: flagship (R23 HARD)
> Owner: builder-agentic · Brand: comunify · Date: 2026-06-16

## Plan (technical design — pre-implementation)

**Goal:** comunify is the FIRST brand to wire the Luana sidebar to the shared
copilot engine. Thin mount of `core/luana-core-copilot` `/chat` at
`/api/v1/comunify/copilot`. Zero engine edit, zero domain tools (RN-3 by
construction), zero observability code (engine emits `copilot_trace_event`).

**Design:**
1. `comunify/backend/src/modules/comunify/copilot/api/__init__.py` (NEW) — pure
   reexport: `from luana_core_copilot.api.chat import router as copilot_router`.
   The engine exports a plain `APIRouter` named `router` with a single
   `POST /chat` endpoint (verified by reading `chat.py` — NOT a factory).
2. `comunify/backend/src/main.py` (EDIT) — `app.include_router(copilot_router,
   prefix="/api/v1/comunify/copilot", tags=["copilot"])`. Mirrors the existing
   `webhook_router` mount pattern in the same file.
3. Workspace deps (EDIT) — see "Deviation from literal ticket" below.

**Test battery (TDD RED-first):**
- `tests/modules/comunify/copilot/test_chat_mount.py`:
  - mount present at brand prefix (path discrimination)
  - 200 SSE with valid auth + mocked orchestrator (mirror engine
    `test_rate_limit.py::TestChatEndpointRateLimit` override pattern)
  - 401/403 without JWT/tenant (engine auth enforces — RN-2)
  - no `tools/` dir → RN-3 (agentic-no-tools-registered)
- `tests/modules/comunify/copilot/conftest.py` — engine `Settings()` env
  defaults (mirror `core/luana-core-copilot/tests/conftest.py`).

**Integration (CONN):** the mount is consumed by the FE chat-store (T-chat-store,
parallel ticket) hitting `/api/v1/comunify/copilot/chat`. Notarized via
`include_router` in `main.py`. Not an island.

**Cap header:** `# cap: comunify-shell-organism` on both new production files.

## Skills Consulted

- **copilot-expert** — invoked. Key decisions applied:
  - §0 anti-duplication cardinal: confirmed NO observability/recording/cost
    files created in `comunify/.../copilot/`. The engine emits
    `copilot_trace_event` + `copilot_llm_call`. Did NOT mirror
    `turn_envelope`/`callback_handler` (engine-owned).
  - "Regla cero — verificá que algo existe antes de declarar falta": grepped
    the engine `chat.py` to confirm the exact exported symbol (`router`,
    plain `APIRouter`, `POST /chat`) before writing the reexport. No factory.
  - Topology table: confirmed `api/` is the thin FastAPI route layer; the brand
    surface only adds `api/`, leaves `extractors/kb/workflows/` untouched.
  - ENGINE vs EXTENSION boundary: `core/luana-core-copilot/src/**` is read-only
    (lift = `/pm-luana`). Consumed via import, never edited.
- **sales-agent-expert** — invoked (auto-loaded). N/A to this ticket (sales_agent
  untouched). Confirmed §0 anti-dup applies cross-agent: did not create any
  observability mirror.
- **.claude/rules/anti-duplication.md §0 copilot** — applied. Engine abstraction
  consumed via import (EXTEND-by-reexport), NOT mirrored. No new subsystem.
- **.claude/rules/tenant-isolation.md** — applied. Tenant isolation is enforced
  by the engine deps (`get_current_user` validates JWT against `X-Tenant-ID`;
  `get_tenant_context` returns the resolved tenant or → 401). The mount adds NO
  query — isolation is delegated to the engine (RN-2). Verified by the 401 test.
- **.claude/rules/backend-ddd.md** — applied. Thin mount = API layer only, zero
  domain logic. `redirect_slashes=False` already present in `main.py` (arch
  test enforces, suite green).

## State-of-the-art validation

No LangGraph/graph code modified (pure router mount — the engine owns the
LangGraph orchestration). No WebFetch required: the surface consumes an existing
engine endpoint as-is; no new agentic pattern introduced. Anthropic prompt-cache
slots untouched (engine-owned).

## Cross-module audit (NO-NEW-LAYER)

- `grep` engine for the chat router → `core/luana-core-copilot/api/chat.py`
  exists and exports `router`. CONSUME via import. Zero new layer.
- `grep` comunify copilot for existing `api/` → none. Created `api/__init__.py`
  as the single thin reexport.
- vitalia precedent: `vitalia/backend/src/modules/vitalia/copilot/api/` exists
  (its own routes — wizard onboarding). comunify's is a thinner reexport of the
  engine chat router (no brand routes). No cross-brand import.
- Deps resolution: confirmed `comunify/backend` is NOT a uv workspace member;
  the workspace member is `comunify` (brand root `comunify/pyproject.toml`,
  mirror of `vitalia/pyproject.toml`). Core deps resolve from there.

## Deviation from literal ticket (deps location)

The ticket scope said "EDIT comunify/backend/pyproject.toml — deps
luana-core-{copilot,iam,platform}". On inspection, `comunify/backend/pyproject.toml`
is NOT a uv workspace member (confirmed via root `pyproject.toml` workspace
members + `uv.lock`), so editing it is a no-op for dependency resolution. The
ACTUAL resolution stub is `comunify/pyproject.toml` (the brand-root workspace
member), which already declares the other core packages with the explicit
comment "Engine core packages (comunify/backend/src importa luana_core_*)" and
is the documented mirror of `vitalia/pyproject.toml`. vitalia — which performs
the same copilot mount — declares `luana-core-iam` there (not in its backend
pyproject). I added the two missing deps (`luana-core-copilot`, `luana-core-iam`)
to `comunify/pyproject.toml` to match the vitalia convention, and ran `uv lock`
to record them as editable workspace deps. `luana-core-platform` was already
declared. This matches the architect's INTENT (the import resolves + the app
boots) while respecting the real workspace topology.

## Blocker

None. The architect's boundary-check held: the engine `/chat` router mounts
cleanly thin. Verified: (a) the engine router imports as code once `Settings()`
env is satisfied (a plain `APIRouter`, not a brand-specific factory); (b) the
real comunify app boots with the mount; (c) 200 SSE + 401 + mount-present all
green. No brand-specific orchestrator/agent registry is required — the
`CopilotOrchestrator(db)` is constructed inside the endpoint and module providers
are discovered at runtime via filesystem scan (not needed for the mount itself).

## Validator results — see T-agentic-result.md
