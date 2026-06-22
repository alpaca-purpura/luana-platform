# Tools advertised + executable ≠ the agent autonomously dispatches them

**Date:** 2026-06-22 · **Scope:** cross-brand (engine `core/luana-core-sales-agent` + any brand registering EP-3 tools) · **Severity:** 🟡 (end-state gap, not a crash) · **Origin:** /pm-vitalia self-paced lift loop, F-path verification of `vitalia-fase2-adrian-canal-inbound` OLA-2.

## What happened

After ESC-17 (the EP-3 handler ABI) was fixed and `share_doctor_profile` + `match_service_and_specialist` were proven to **execute live** (real registry + real dev DB → real URLs/recommendations), the F-path tried to verify the *end-state*: that Adrián (the sales_agent LLM) **dispatches** those tools in a real conversation.

It does not. Across 3 increasingly-explicit Telegram turns — ending with "recomendame el especialista para blanqueamiento y mandame el link de su perfil" — the specialist LLM emitted **zero `[TOOL_REQUEST]` blocks**. It answered conversationally (and at least once off-topic). The tools were:

- **advertised** — `application/prompts/compose.py::_extension_tools_hint` renders all 3 brand tools into the (cacheable) prompt, verified at runtime;
- **executable** — dispatch via `node_tool_executor → merged_tools()[name](state, db)` returns real results, verified in-container;
- **dispatchable in any stage** — `node_tool_executor` does not stage-gate.

…and yet the LLM never called them.

## The lesson (durable, promotable)

There is one more rung on the "registered ≠ executable" ladder (ESC-17 / `verification-real-not-200`):

> **registered → advertised → executable → _autonomously dispatched_.**

ESC-17 fixed *executable*. But a tool that is registered, advertised in the prompt, and callable under the engine ABI is **still not used** until the model actually emits the tool-call in conversation. For a text-protocol tool-call (`[TOOL_REQUEST: {...}]`) on a Chinese-first model (DeepSeek/Kimi), that is **not free** — it is an agentic-behavior property that must be **tuned and verified with eval goldens** (`tool-trajectory`, `G-objection-trust`), not assumed because the wiring is green.

**Rule:** a tool seam's end-state is verified by an eval golden that asserts the agent *emits the tool-call for the triggering intent* — not by proving the handler executes when called directly. "I dispatched it by hand and it worked" ≠ "the agent uses it." Treat autonomous-dispatch as its own gate (deterministic via pass^k goldens), owned by sales-agent-expert / builder-agentic flagship (stake-asymmetric: a prompt nudge without goldens can overfit one phrasing and regress others).

## Refs

- `vitalia/docs/product/stories/vitalia-fase2-adrian-canal-inbound/demo-script.md` § F-path finding (the live evidence + the seam-exercise proof)
- `docs/learnings/2026-06-22-ep3-tool-handler-abi-mismatch.md` (ESC-17 — the *executable* rung)
- `[[verification-real-not-200]]` · `[[embudo-imagined-contract-never-integrated]]`
- Eval goldens (deferred): `04-validators.yaml` agentic_eval `tool-trajectory` + `G-objection-trust`
