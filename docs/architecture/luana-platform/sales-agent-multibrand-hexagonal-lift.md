# Sales-Agent Multibrand — Hexagonal Lift (architecture + staged plan)

> **Status:** design ratification pending (Chris). **Owner:** /pm-luana (engine). **Origin:** the
> `vitalia-fase2-adrian-canal-inbound` G live-verify (2026-06-22) — first time the sales_agent graph
> ran inside a brand process. It crashed on a cascade of walls (ESC-4..16). This doc is the deep
> architectural review Chris requested before doing the lift properly (real migrations + dep fixes +
> downstream regression), with the governing principle:
>
> **Shared core = runtime + ports. Each brand owns its own tools, nodes, models, per its business.**
> (high cohesion / low coupling · clean architecture · hexagonal: engine depends on ports, brands
> provide adapters — never the engine importing brand concepts.)
>
> Companion: `docs/promotion-protocol/proposals/2026-06-22-sales-agent-multibrand-graph-runtime.md`
> (the ESC ledger). This doc supersedes that proposal's design section.

## 1. Why the graph never ran in a brand (root, not symptoms)

The ESC walls are symptoms of **three structural couplings**. Evidence is from a 4-facet read-only
audit (graph runtime · Extension SDK · model/schema · deps/infra), 2026-06-22.

### C1 — One global `declarative_base()` (the root schema coupling)

`core/luana-core-platform/src/luana_core_platform/domain/base_entity.py:6` defines **one** `Base`.
**Every** engine package (~18) **and all 4 brands** map onto it (~60 `import Base` sites, ~112
`__tablename__`s). SQLAlchemy keeps **one global mapper registry per base**; string `relationship()`
targets resolve lazily at the **first** `configure_mappers()` (fires on the first DB session). So the
graph's first query (`fetch_tenant_config` → `SELECT tenants`) forces configuring **all 112 classes
atomically**. Consequences:

- One unresolvable string relationship anywhere → whole ORM init throws → "Could not fetch tenant" →
  graph dead. (ESC-7 `LeadModel.appointments→"AppointmentModel"`, ESC-8 `SaleModel.offer→"ProductModel"` —
  both dead/unused cross-package navigations; the engine CRM navigating brand/cross-package models it
  shouldn't.)
- Homonyms collide: engine `MessageModel` (`messages`) vs vitalia `MessageModel` (`vitalia_messages`) on
  the same registry → `Multiple classes found` (ESC-4; fixed by module-qualifying the string).
- A brand process must provision (or at least not-break) ~112 tables to run a graph that **actually
  queries ~5** (`tenants`, `prompt_versions`, `agent_state_checkpoints`, `leads`/`customer_profiles`/
  `customer_identities`, `messages`). The other ~107 only matter because they share the Base.

`crm.py`'s own docstring admits the Base is used as a cross-module JOIN escape hatch ("so analytics,
sales_agent… can JOIN without importing `luana_core_crm.*`"). That is the smell.

### C2 — The brand-extension seam (EP-3 et al.) is dead end-to-end (the tool/node ownership coupling)

This is the coupling that directly violates Chris's principle. Two different "seam" mechanisms exist and
must not be conflated:

- **Mechanism A — `luana_core_platform/links/ports/`**: cross-**module** ports *within* the engine
  (lazy-import factories so `sales_agent` reaches `scheduling`/`offer` without a DDD-illegal import).
  **74 consumer sites, clean, honored.** This is the good template. It is NOT a brand seam.
- **Mechanism B — `ExtensionPointRegistry` (EP-1..EP-18)**: the cross-**brand** seam. **Mostly dead:**
  - Only **EP-1 (field_override)** and **EP-2 (offer preset pack)** have a working dispatch.
  - **EP-3 (sales_agent tool)** stores `ToolDef`s but: the engine `TOOL_REGISTRY`
    (`application/agents/sales/tools.py:107`) is a **static module dict**; dispatch
    (`application/agents/sales/nodes.py:402` `TOOL_REGISTRY.get(name)`) **never merges** brand tools; the
    engine registry **has no `register_tool_from_extension`** (exists only in test fakes); the SDK adapter
    (`_adapters.py:71`) is **never injected**; and brand `register_all(registry)` is **never called at
    startup** (no lifespan wiring in any brand `main.py`). vitalia's 15 EP-3 tools + comunify's 5 (all
    `_not_implemented_yet`) reach the running graph **through nothing**.
  - **EP-6..EP-18** all `raise NotImplementedError` ("signature-only v0.1.0").
  - **No EP exists** for: graph **nodes**, **state-overlay**, **scheduler provider**, or static
    **persona/prompt** layers. vitalia's `domain/state_overlay.py`, `personas/*.yaml`, `prompts/*.md` are
    **orphan files with no runtime consumer**. The engine TypedDict/graph is closed.
- Related dead seams inside the runtime: `STAGE_TOOL_SCOPE`/`get_tools_for_stage`
  (`application/tools/registry.py:56`) is **never called** by the dispatcher; the prompt tool-hint
  (`application/prompts/compose.py:193` `_TOOLS_HINT`) is a **hardcoded string** divorced from the
  registry; `scheduler_provider_for_tenant` (`application/tools/scheduling/providers.py:447`) **ignores
  `tenant_id`** and always returns `"internal"` (ESC-1).

**The good parts (keep):** the LangGraph topology/nodes/state as the shared GTM machine; `PromptLoader`
per-tenant DB override (ESC-5/6 correct); `ModelRole` LLM routing; the `SchedulerProvider` **Protocol +
registry + frozen dataclasses** *shape* (only the resolver is a stub); `BrandVoicePort` (slot-5 voice
via DB) — a genuine honored brand→engine port.

### C3 — Dependency boundaries (the deps coupling)

- **ESC-13 (code):** `application/orchestrator/chat.py:259` imports `get_async_session_factory` from
  platform `core.database` — **doesn't exist** (renamed to `get_async_session_maker`). Masked by an
  `except` → inbound-campaign lookup silently fails every turn.
- **ESC-15/16 (code+infra):** `application/services/semantic_router.py:67` loads fastembed
  `TextEmbedding(...)` at runtime: `fastembed>=0.2.0` (unpinned) resolves to **0.8.0** (incompatible ONNX
  layout → `NoSuchFile model_optimized.onnx`); model **downloaded at runtime from HF** (blocks the async
  loop) into **dead path `/app/model_cache`** (backend runs at `/workspace`, no such volume); `.embed()`
  is **sync on the async loop**.
- **ESC-12/14 (config/seed, NOT a bug):** `LLMFactory.get_service_for_tenant` raises only because
  `tenant.can_use_platform_keys` defaults `False` (`tenant_model.py:38`). The LLM boundary is **clean**
  (one LiteLLM proxy port; no raw keys needed). Fix = arm the flag in seed.
- **Qdrant config split (code+config):** engine reads `settings.QDRANT_URL`; vitalia sets only
  `QDRANT_HOST/PORT`; no validator derives one from the other → `QdrantClient(url="")` → RAG silently
  misconfigured.
- **LiteLLM (infra):** not a service in vitalia compose; brand must point at the shared proxy
  (`luana_litellm_dev:4000`, not `localhost`). (ESC-11 — fixed in `.env.dev`.)

## 2. Target architecture (hexagonal)

> Engine = **runtime + ports**. Brands = **adapters** registered at their composition root. The engine
> NEVER imports a brand concept; it depends only on ports/Protocols and a registry it reads at dispatch.

| Concern | Today | Target |
|---|---|---|
| Sales tools | static engine `TOOL_REGISTRY`; EP-3 dead | engine `ToolRegistry` is **stateful**, exposes `register_tool_from_extension`; dispatch + prompt-hint + stage-scope all read the **merged** (engine ⊕ brand) set; brand injects `_SalesAgentToolRegistryAdapter` at lifespan; `register_all()` called at startup |
| Graph nodes | engine-closed | (Phase 2+) an EP/port to register brand nodes onto a graph **factory** (not module-global) — only if a brand genuinely needs a vertical node |
| Agent state keys | engine TypedDict closed; brand `state_overlay.py` orphan | a `register_state_extension` port the engine actually consumes (compose brand keys into `AgentState`) |
| Scheduler provider | `scheduler_provider_for_tenant` hardcodes `"internal"` | resolve per-tenant from config/connections (ESC-1); brand registers its provider via the existing Protocol+registry (already the right shape) |
| Personas / prompts | brand YAML/MD orphan; only `BrandVoicePort` honored | keep DB-backed `BrandVoicePort` as the seam; either consume the brand prompt layers via a prompt-slot port or delete the orphan files (decide per cohesion) |
| Models / schema | one global Base; 112 tables atomic; brand-data on shared Base | **(near)** drop dead cross-package relationships (ESC-7/8 ✓) so configure stops requiring unregistered targets; brand adopts only the ~5 engine tables it queries via per-table idempotent migrations (the `049` pattern). **(long)** split the single Base into **Base-per-bounded-context**, and graduate brand-data tables (`leads`/`messages`/`sales`/`nps`/`appointments`) OUT of the shared platform Base into per-brand models |
| LLM / embeddings / Qdrant | see C3 | LLM port stays (clean); pin+bake fastembed model + async-offload; `QDRANT_URL` derived from HOST/PORT via config validator |

## 3. Staged lift plan

**Tier 1 — Make the graph run in a brand, properly + governed (the immediate goal).**
Bounded, low-architectural-risk, unblocks Chris's Telegram test with real migrations (not `create_all`).
1. Engine code (keep ESC-7/8 already done): drop dead cross-package relationships in `crm.py`.
2. **ESC-13** fix: `chat.py` → `get_async_session_maker`.
3. **ESC-15/16**: pin `fastembed==0.5.1` (relock), bake/pre-cache the embedding model into the backend
   image + real volume + `HF_HOME`, wrap load/`.embed()` in `asyncio.to_thread`.
4. **Qdrant** config validator in `config.py` (derive `QDRANT_URL` from `QDRANT_HOST/PORT`).
5. **Brand migrations** (vitalia, `049` pattern, idempotent): the ~3 engine tables the graph queries and
   vitalia lacks — `agent_state_checkpoints`, `leads`/`customer_profiles`/`customer_identities`,
   `messages`. **NOT** `create_all` of 112. (Undo the dev `create_all` debt — keep only what migrations create.)
6. **Seed**: `can_use_platform_keys=true` for dev/brand tenants (seed/migration, not manual SQL).
7. **Downstream regression** ×4 brands (`ci-parity`) — engine touched, shared by all brands.
8. Verify: drive the graph end-to-end → Adrián replies live (the real bar).

**Tier 2 — True brand tool/node ownership (Chris's principle; = the proposal's Phase 2 / ESC-1/2/3).**
The hexagonal fix so "each brand owns its tools/nodes" is real:
1. Make engine `ToolRegistry` stateful + `register_tool_from_extension`; merge into dispatch +
   prompt-hint + stage-scope (ESC-2/3).
2. Inject `_SalesAgentToolRegistryAdapter` + call brand `register_all()` at brand lifespan.
3. `scheduler_provider_for_tenant` resolves per-tenant (ESC-1).
4. (If needed) EPs for nodes + state-overlay; consume or delete orphan persona/prompt files.
5. Implement vitalia's `_not_implemented_yet` tools for real (book/match/share = OLA-2).
6. Downstream regression ×4.

**Tier 3 — Root decoupling (large, separate ADR).**
Split the single `Base` into Base-per-bounded-context; graduate brand-data tables off the shared platform
Base. Removes C1 at the root. High blast radius → its own promotion proposal + phased migration.

## 4. Recommendation

Execute **Tier 1 now** (gets the bot replying with governed migrations + dep fixes + regression — what
Chris asked, minus the big refactor). Schedule **Tier 2** as the focused follow-on (it IS the proposal's
Phase 2; it's where "each brand owns its tools/nodes" becomes real). **Tier 3** is a deliberate future ADR.

Doing Tier 1+2 together is possible but larger; Tier 3 should not be bundled (blast radius across 4 brands).

## 5. Progress log (execution, /pm-vitalia self-paced loop 2026-06-22)

Hub `wip/vitalia`, `SCOPE_GATE_SKIP=1` for core/ edits (Chris ratified in-hub lift). Each step:
TDD (RED first) → impl → ruff → adversarial subagent review → net-new-regression=0 → live-verify
(synthetic Telegram webhook) → commit by pathspec → push.

- **Tier 1** — DONE (pre-loop): `44e1d4af` core, `1120381d` vitalia, `4a8ff847` docs. Graph runs
  end-to-end; Adrián replies; messages/agent_traces/sales_agent_llm_call/leads written.
- **Tier 2 seam** — DONE (pre-loop): `64c0e3e1` stateful ToolRegistry + merged dispatch; `846388a6`
  vitalia lifespan wires ExtensionPointRegistry(adapter)+register_all → 13 EP-3 tools enter the
  engine singleton.
- **Tier 2.1** — DONE `e43015ee`: prompt tools-hint advertises brand EP-3 tools (compose.py renders
  `extension_tools()` into the cacheable STATIC_TOOLS_HINT slot, sorted, stage-independent →
  cache-safe; advertised==dispatchable since dispatch is `merged_tools()`, stage-agnostic). NOT
  stage-filtered (would break the prefix + mismatch dispatch). 8 tests; live-verified (Adrián 4-chunk
  reply; only the expected synthetic-chat 400).
- **Tier 2.2** — DONE `3aff15af` (ESC-1): `scheduler_provider_for_tenant` resolves
  `tenants.config_json['scheduler_provider']` against the registry; brand registers via existing
  `register_scheduler_provider`. Resilient fallback to `internal` (missing/unknown/malformed/db-error).
  Vitalia behaviour-preserving (still internal). 6 tests; scheduling-dir net-new failures 0.
- **Tier 2.3** — DONE `833fece3`: state_overlay.py KEPT (real keys + test) with corrected docstring
  (no engine `register_state_extension` — keys live in the plain state dict / metadata_info per ratified
  §4 — DIVERGES from the design's blanket "delete", surfaced w/ rationale). Deleted genuinely-orphan
  `sales_agent/prompts/` (loaders, zero callers) + `sales_agent/personas/` (5 yaml, no loader); live
  voice path is BrandVoicePort slot-5. Backend reloads healthy; zero dangling imports.
- **Tier 2.4** (OLA-2 tool handlers) — PENDING. Reading canal-inbound 03-arch/06-tickets/04-validators.
- **Tier 3** (Base split) — PENDING (likely escalate w/ sub-phases; blast radius ×4).
- **Governance** (migrations 049-pattern + seed can_use_platform_keys + uv lock fastembed) — PENDING.
- **Promote+sync** (make promote-to-main + sync-all + downstream ×4 + proposal→migrated) — PENDING.
