"""Comunify backend scripts (CLI entrypoints).

Created by T-kb-1 (R23 Opus 4.7 production AGENTIC code).

Hosts seed scripts + maintenance CLI utilities. Each script must be:

* Idempotent (re-run safe — no duplicate side effects)
* Side-effect surfaced via structlog (no silent failures)
* Run via ``python -m scripts.<name>`` from ``comunify/backend/``
"""
