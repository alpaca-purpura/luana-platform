"""Connections API dependencies — composition root stub.

Deferred to Story 7 (ChatOrchestrator composition root wiring).
Story 4 lift provides import-compatible stub only.

DEFERRED: Real wiring in Story 7 will inject ChatOrchestrator
as the concrete MessageHandlerPort implementation. Until then,
this module exports a stub that raises NotImplementedError at
call time (not import time), allowing tests that mock this
dependency to work normally.
"""

# downstream-regression-na: stub deferred to Story 7 — no cross-consumers yet


def get_message_handler():
    """Return the message handler dependency.

    STUB — deferred to Story 7 (ChatOrchestrator composition root).
    Production callers must override this via DI before use.
    Tests should mock this function directly.
    """
    raise NotImplementedError(
        "get_message_handler is deferred to Story 7 — "
        "ChatOrchestrator composition root wiring not yet available in luana-platform."
    )
