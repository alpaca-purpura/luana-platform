# cap: comunify-shell-organism
"""Comunify copilot API — thin mount of the engine copilot ``/chat`` router.

comunify is the FIRST brand to wire the Luana sidebar to the shared copilot
engine. This package is a **pure reexport** of the engine router — zero domain
logic, zero observability code, zero tools (RN-3 by construction: Luana
conversa + anuncia, no ejecuta).

Boundary (HARD):
  - The engine ``core/luana-core-copilot`` owns the chat orchestration, auth
    (Clerk JWT + ``X-Tenant-ID`` tenant isolation), SSE protocol, and the
    ``copilot_trace_event`` / ``copilot_llm_call`` observability writes.
  - This brand surface mounts it as-is. Editing the engine requires the
    ``/pm-luana`` promotion gate.

See: 03-arch-agentic.md (comunify-shell-organism) + .claude/rules/anti-duplication.md §0.
"""

from __future__ import annotations

from luana_core_copilot.api.chat import router as copilot_router

__all__ = ["copilot_router"]
