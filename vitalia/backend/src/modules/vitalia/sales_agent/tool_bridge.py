# cap: sales_agent.honor-mode-bridge
"""ESC-17 — brand sync ``(state, db) -> dict`` adapter for EP-3 sales_agent tools.

The engine sales graph dispatches every tool SYNC
(``application/agents/sales/nodes.py::node_tool_executor``)::

    result = tool_fn(state, db=state.get("_db"))   # sync; args read FROM state; _db is None at inbound

Vitalia's real EP-3 handlers are async LangChain ``StructuredTool``s, which are
NOT callable that way (``StructuredTool(state, db)`` → ``TypeError`` → the tool
errors on dispatch and never runs — the ESC-17 embudo, *registered != executable*).

The engine ABI is the **port**; the brand **adapts** (hexagonal — the engine never
learns about LangChain). This module provides:

* ``run_async(coro)`` — run an async coroutine to completion from the SYNC graph
  node. ``node_tool_executor`` is a sync node, so LangGraph offloads it to a worker
  thread; but rather than *assume* whether a loop is running, we ALWAYS run the coro
  in a dedicated thread that owns a fresh event loop. Any DB session created inside
  therefore connects within that loop → no cross-loop asyncpg trap, and it is safe
  whether or not the caller already has a running loop.
* ``structured_tool_adapter(tool)`` — wrap an async ``StructuredTool`` as a sync
  ``(state, db) -> dict | str`` handler. Args come from the LLM ``[TOOL_REQUEST]``
  (``state["_pending_tool"]["args"]``); ``tenant_id`` / ``clinic_id`` are OVERRIDDEN
  from ``state`` (authoritative — never trust the LLM for tenant scoping);
  ``lead_id`` / ``user_id`` / ``conversation_id`` fall back to ``state`` when the LLM
  omits them. Never raises — returns a structured error dict (engine also catches).

Learning: docs/learnings/2026-06-22-ep3-tool-handler-abi-mismatch.md
"""

from __future__ import annotations

import asyncio
import threading
from typing import Any, Awaitable, Callable

import structlog

logger = structlog.get_logger(__name__)

# Tenant scoping is authoritative from state — the LLM must NEVER pick the tenant.
_AUTHORITATIVE_STATE_KEYS = ("tenant_id", "clinic_id")
# Identity/context the engine seeds in state; inject only when the LLM omitted it.
_FALLBACK_STATE_KEYS = ("lead_id", "user_id", "conversation_id")


def run_async(coro: Awaitable[Any]) -> Any:
    """Run ``coro`` to completion from a sync context (the graph's sync tool node).

    Executes in a dedicated daemon thread with its own fresh event loop so a DB
    session opened inside the coroutine connects within that loop (no cross-loop
    asyncpg ``Future attached to a different loop``), regardless of whether the
    caller already has a running loop.
    """
    box: dict[str, Any] = {}

    def _runner() -> None:
        try:
            box["result"] = asyncio.run(coro)
        except BaseException as exc:  # noqa: BLE001 — re-raised in the caller thread
            box["error"] = exc

    thread = threading.Thread(target=_runner, name="ep3-tool-bridge", daemon=True)
    thread.start()
    thread.join()
    if "error" in box:
        raise box["error"]
    return box["result"]


def _build_args(tool: Any, state: dict[str, Any]) -> dict[str, Any]:
    """Merge LLM-provided args with authoritative/fallback values from state."""
    pending = state.get("_pending_tool") or {}
    args: dict[str, Any] = dict(pending.get("args") or {})
    schema: dict[str, Any] = getattr(tool, "args", None) or {}

    for key in _AUTHORITATIVE_STATE_KEYS:
        if key in schema and state.get(key) is not None:
            args[key] = state[key]
    for key in _FALLBACK_STATE_KEYS:
        if key in schema and not args.get(key) and state.get(key) is not None:
            args[key] = state[key]
    return args


def structured_tool_adapter(tool: Any) -> Callable[..., Any]:
    """Wrap an async LangChain ``StructuredTool`` as a sync ``(state, db) -> dict``.

    Matches the engine ``node_tool_executor`` ABI. Returns the tool's result
    (dict/str) or a structured ``{"status": "error", ...}`` dict — never raises.
    """
    name = getattr(tool, "name", repr(tool))

    def _handler(state: dict[str, Any], db: Any = None) -> Any:  # noqa: ANN401
        try:
            args = _build_args(tool, state)
            result = run_async(tool.ainvoke(args))
            if isinstance(result, (dict, str)):
                return result
            return {"status": "ok", "result": str(result)}
        except Exception as exc:  # noqa: BLE001 — agent resilience (engine also catches)
            logger.warning("vitalia.ep3.adapter_error", tool=name, error=str(exc))
            return {"status": "error", "tool": name, "message": str(exc)}

    _handler.__name__ = f"ep3_adapter__{name.replace('.', '_')}"
    _handler.__qualname__ = _handler.__name__
    # Introspection markers for the ESC-17 arch test + debugging.
    _handler._ep3_wrapped_tool = name  # type: ignore[attr-defined]
    _handler._ep3_sync_adapter = True  # type: ignore[attr-defined]
    return _handler
