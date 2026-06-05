# cap: abel/icp-buyer  # noqa: ERA001
"""Seed sanitizer — RN-9 anti prompt-injection (defense in depth · SOTA 2026).

The seed (scraped URL / uploaded file text / pasted text) is UNTRUSTED. Before it
ever touches the extraction prompt it is:

1. **Truncated + PII-redacted** via the engine ``sanitize_payload`` (NEVER recreate —
   ``core/luana-core-observability/.../recording/sanitization.py`` per anti-duplication).
2. **Delimiter-wrapped** inside ``<untrusted_seed> … </untrusted_seed>`` so the model
   treats it as DATA to extract, never as an instruction to follow.
3. **Delimiter-smuggling neutralized:** any delimiter tokens the seed itself contains
   are stripped, so a crafted seed cannot "close" the block early and inject an order.

Least-privilege (the real blast-radius control) lives at the service layer: the
extractor can ONLY propose a ``borrador`` (status=borrador, origin=draft). Even if an
injection "works", the worst case is a junk draft the owner discards (RN-3 gate).

This module is PURE (no I/O) — unit-tested in isolation.
"""

from __future__ import annotations

from luana_core_observability.recording.sanitization import sanitize_payload

# Structural delimiters marking the untrusted region. Distinctive sentinel tokens
# (unlikely to appear verbatim in legitimate seed text) so smuggling-detection is reliable.
SEED_OPEN_DELIMITER = "<untrusted_seed>"
SEED_CLOSE_DELIMITER = "</untrusted_seed>"

# Hard cap on the seed length fed to the prompt — bounds token cost + storage.
# Aligned with the engine sanitizer truncation budget (MAX_PAYLOAD_CHARS = 4000),
# but we cap conservatively higher to allow a fuller document while staying bounded.
MAX_SEED_CHARS = 8_000


def _strip_smuggled_delimiters(text: str) -> str:
    """Remove any delimiter tokens the seed itself contains (anti break-out)."""
    return text.replace(SEED_OPEN_DELIMITER, " ").replace(SEED_CLOSE_DELIMITER, " ")


def wrap_untrusted_seed(seed_text: str) -> str:
    """Sanitize + delimiter-wrap an untrusted seed for safe prompt inclusion (RN-9).

    Order matters:
      1. cap length (bounded cost),
      2. sanitize_payload (engine) → truncate long strings + redact PII,
      3. strip smuggled delimiters (anti break-out),
      4. wrap in the structural untrusted-seed block.

    Returns a string the prompt embeds verbatim. The model is instructed (in the
    prompt) that everything inside the block is DATA, never an instruction.
    """
    raw = seed_text or ""
    # 1. Cap first so the engine sanitizer doesn't waste work on a giant blob.
    capped = raw[:MAX_SEED_CHARS]
    # 2. Engine sanitizer (truncate + PII redact). It operates on dict payloads;
    #    wrap the single field, then pull the cleaned value back out.
    cleaned = sanitize_payload({"seed": capped}).get("seed", "")
    if not isinstance(cleaned, str):  # defensive — sanitize_payload preserves str leaves
        cleaned = str(cleaned)
    # 3. Neutralize any delimiter the seed tried to smuggle in.
    safe = _strip_smuggled_delimiters(cleaned)
    # 4. Structural wrap.
    return f"{SEED_OPEN_DELIMITER}\n{safe}\n{SEED_CLOSE_DELIMITER}"
