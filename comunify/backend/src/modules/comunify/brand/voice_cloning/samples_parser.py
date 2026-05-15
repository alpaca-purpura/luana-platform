"""Voice samples parser — WhatsApp ZIP + voice notes ingestion (T-voice-2).

R23: production_code=True AGENTIC. Opus 4.7 EXCLUSIVE (06-tickets.yaml::T-voice-2).

Per 03-arch-agentic.md voice cloning + 02-design-agentic.md § 5.3 samples flow:

  ZIP layout (WhatsApp export):
    _chat.txt              ← timestamped chat messages
    <opus voice notes>.opus / .ogg / .mp3 / .m4a / .wav  ← optional voice notes

  Output (D15 invariant — counts + sanitized patterns ONLY):
    ParsedSamples
      .chat_lines: list of {sender, text, timestamp}  (PII pre-stripped)
      .voice_note_paths: list of absolute paths in the temp dir
      .chats_count: int
      .voice_notes_count: int
      .warnings: list of strings

The orchestrator (T-voice-1) consumes ``ParsedSamples.chat_lines`` PLUS the
results of Whisper transcription for each voice note (also PII-sanitized).

Whisper transcription is BEHIND a Protocol (``WhisperTranscriberProtocol``)
so unit tests can inject a stub. Real production wiring: LiteLLM proxy +
Whisper-1 model. Per ``tessl__graceful-degradation``: every Whisper call
gets timeout + fallback (return empty transcription, surface warning).

D15 invariant: NOTHING raw persists across the call boundary except counts.
PII pre-strip uses ``shared.scripts._pii_patterns.PATTERNS`` (PI-12 Story D
SSoT) when available, else degrades to a built-in minimal pattern set.

Anti-duplication audit (Step 0 GATE, 2026-05-14):
  * ``grep -rn "class WhatsAppZipParser|samples_parser"`` cross
    luana-platform → zero collisions.
  * PII patterns SHOULD consume from ``scripts._pii_patterns`` (PI-12
    Story D SSoT). Comunify backend does NOT yet bridge that. Fallback
    inline patterns kept LOCAL + minimal (email + phone). When the
    cross-repo lift happens (e.g. ``luana_core_observability.pii_patterns``),
    swap the inline fallback for the shared import.
"""

from __future__ import annotations

import asyncio
import re
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

import structlog

logger = structlog.get_logger(__name__)


# ─── PII patterns (inline fallback — see anti-duplication note above) ─────


# Conservative minimal set: emails + LATAM phone formats. Patterns deliberately
# WIDE — false positives (e.g. "Llamame al 555..." in chat) are sanitized
# defensively; the extractor never reads raw matches anyway.
_PII_PATTERNS: dict[str, re.Pattern[str]] = {
    "email": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "phone": re.compile(
        r"\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}",
    ),
    # LATAM national IDs (conservative — only obvious shapes).
    "dni_ar": re.compile(r"\bDNI\s*\d{7,8}\b", re.IGNORECASE),
    "cuit_ar": re.compile(r"\b\d{2}-\d{8}-\d\b"),
    "rfc_mx": re.compile(r"\b[A-Z]{4}\d{6}[A-Z0-9]{3}\b"),
    "rut_cl": re.compile(r"\b\d{1,2}\.\d{3}\.\d{3}-[\dKk]\b"),
    "dni_pe": re.compile(r"\bDNI\s*\d{8}\b", re.IGNORECASE),
    "curp_mx": re.compile(r"\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b"),
}

_PII_REPLACEMENT = "[REDACTED]"


def _strip_pii(text: str) -> str:
    """Replace PII matches with ``[REDACTED]`` (defensive — pre-distillation).

    Conservative wide patterns; false positives are accepted (extractor reads
    sanitized text only, never the original).
    """
    if not text:
        return text
    out = text
    for pattern in _PII_PATTERNS.values():
        out = pattern.sub(_PII_REPLACEMENT, out)
    return out


# ─── WhatsApp _chat.txt parser ────────────────────────────────────────────


# Default WhatsApp export format (es-LATAM regional):
#   [DD/MM/YY HH:MM:SS] <Sender>: <Message>
# OR
#   DD/MM/YY HH:MM - <Sender>: <Message>
# We accept both with a tolerant regex. Anything that doesn't match is treated
# as a continuation of the prior line.
_WA_LINE_RE = re.compile(
    r"""
    ^                                              # start
    \[?                                            # optional [
    (?P<date>\d{1,2}/\d{1,2}/\d{2,4})              # date
    [, ]+
    (?P<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?)  # time
    \]?
    \s*[-–]?\s*                                    # optional sep
    (?P<sender>[^:]+?)                             # sender name
    :\s*
    (?P<message>.*)                                # message body (greedy)
    $
    """,
    re.VERBOSE | re.IGNORECASE,
)

# Voice note placeholder line in WhatsApp exports (es-AR/MX/CL):
#   "<archivo adjunto: 00000123-AUDIO-2024-01-01-12-30-00.opus>"
#   "audio omitido"
#   "<Media omitted>"
_VOICE_NOTE_HINT_RE = re.compile(
    r"(audio omitido|audio omitted|<media omitted>|<archivo adjunto:.+?\.(?:opus|ogg|mp3|m4a|wav)>)",
    re.IGNORECASE,
)

_VOICE_NOTE_EXTS = {".opus", ".ogg", ".mp3", ".m4a", ".wav"}


@dataclass(frozen=True, slots=True)
class ChatLine:
    """Single parsed chat line — PII pre-stripped.

    ``raw_text`` field intentionally absent — caller of the parser receives
    only the sanitized version, NEVER the original.
    """

    sender: str
    text: str  # PII-sanitized
    timestamp: str  # raw WhatsApp timestamp string (date + time)
    channel: str = "whatsapp"


@dataclass
class ParsedSamples:
    """Top-level parser output — counts + sanitized chat lines + voice notes."""

    chat_lines: list[ChatLine] = field(default_factory=list)
    voice_note_paths: list[Path] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def chats_count(self) -> int:
        return len(self.chat_lines)

    @property
    def voice_notes_count(self) -> int:
        return len(self.voice_note_paths)


# ─── Whisper transcriber protocol ─────────────────────────────────────────


class WhisperTranscriberProtocol(Protocol):
    """Whisper transcription surface (LiteLLM proxy in production).

    Per tessl__graceful-degradation: timeout + fallback to empty string
    + warning when Whisper unavailable.
    """

    async def transcribe(
        self,
        *,
        audio_path: Path,
        timeout_sec: float,
    ) -> str: ...


# ─── WhatsApp ZIP parser entry point ──────────────────────────────────────


def parse_whatsapp_zip(zip_path: Path, *, extract_dir: Path) -> ParsedSamples:
    """Parse a WhatsApp export ZIP into ``ParsedSamples``.

    Steps:
      1. Open ZIP. If corrupt → return empty samples + warning.
      2. Extract ``_chat.txt`` + voice notes (any audio extension above) into
         ``extract_dir``.
      3. Parse ``_chat.txt`` line-by-line. PII-strip each message text.
      4. Detect voice-note hint lines (audio omitted) — these are counted
         as voice notes even when the file is also extracted (the hint is
         what tells us the original chat referenced an audio).
      5. Return ``ParsedSamples`` with sanitized chat lines + voice note
         file paths in ``extract_dir``.

    Args:
        zip_path: Path to the WhatsApp export ZIP.
        extract_dir: Directory where ZIP contents are extracted (caller
                     owns the lifecycle — typically a tempdir).

    Returns:
        ParsedSamples with counts + sanitized chat lines + voice note paths.

    Never raises (best-effort): any IO / parsing error surfaces as a
    warning + empty samples.
    """
    samples = ParsedSamples()

    if not zip_path.exists():
        samples.warnings.append(f"zip_not_found:{zip_path.name}")
        return samples

    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_dir)
    except zipfile.BadZipFile:
        samples.warnings.append(f"corrupt_zip:{zip_path.name}")
        return samples
    except OSError as exc:
        samples.warnings.append(f"io_error:{type(exc).__name__}")
        return samples

    chat_txt = extract_dir / "_chat.txt"
    if not chat_txt.exists():
        # Some WhatsApp exports use the chat name as filename.
        candidates = list(extract_dir.glob("*.txt"))
        if candidates:
            chat_txt = candidates[0]
        else:
            samples.warnings.append("missing_chat_txt")
            # Still try to collect voice notes for transcription.
            samples.voice_note_paths = _collect_voice_notes(extract_dir)
            return samples

    samples.chat_lines = _parse_chat_txt(chat_txt)
    samples.voice_note_paths = _collect_voice_notes(extract_dir)

    return samples


def _parse_chat_txt(chat_txt: Path) -> list[ChatLine]:
    """Parse ``_chat.txt`` into ``ChatLine`` objects with PII stripped."""
    out: list[ChatLine] = []
    try:
        text = chat_txt.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return out

    for raw_line in text.splitlines():
        if not raw_line.strip():
            continue
        match = _WA_LINE_RE.match(raw_line)
        if not match:
            # Continuation lines (multi-line messages) are skipped here per
            # the spec scope — voice cloning is sensitive to per-line tone
            # samples, so single-line is the unit of analysis.
            continue
        sender = match.group("sender").strip()
        message = match.group("message").strip()
        timestamp = f"{match.group('date')} {match.group('time')}"

        # Drop pure voice-note hint lines from chat_lines (they're tracked
        # separately via _collect_voice_notes).
        if _VOICE_NOTE_HINT_RE.search(message):
            continue

        # PII strip BEFORE inserting into the ChatLine.
        sanitized = _strip_pii(message)
        # Skip empty post-sanitization (just punctuation / hint).
        if not sanitized.strip():
            continue

        out.append(
            ChatLine(
                sender=_strip_pii(sender)[:200],  # sender names also PII-strip
                text=sanitized[:4000],  # bound per chat line
                timestamp=timestamp,
            )
        )
    return out


def _collect_voice_notes(extract_dir: Path) -> list[Path]:
    """Collect voice-note file paths in extraction directory."""
    out: list[Path] = []
    for path in extract_dir.iterdir():
        if path.suffix.lower() in _VOICE_NOTE_EXTS and path.is_file():
            out.append(path)
    return out


# ─── Whisper transcription (with graceful degradation) ────────────────────


async def transcribe_voice_notes(
    paths: list[Path],
    *,
    transcriber: WhisperTranscriberProtocol,
    timeout_sec: float = 30.0,
) -> list[str]:
    """Transcribe a list of voice notes via Whisper, with timeout + fallback.

    Per tessl__graceful-degradation:
      * Every call wrapped in ``asyncio.wait_for(timeout_sec)``.
      * Timeout / exception → empty transcription + structlog warning.
      * NEVER raises to caller.

    Returns:
        List of PII-sanitized transcription strings (parallel to ``paths``).
    """
    if not paths:
        return []

    async def _one(path: Path) -> str:
        try:
            transcription = await asyncio.wait_for(
                transcriber.transcribe(audio_path=path, timeout_sec=timeout_sec),
                timeout=timeout_sec + 2.0,
            )
        except TimeoutError:
            logger.warning(
                "voice_note_transcription_timeout",
                path=path.name,
                timeout_sec=timeout_sec,
            )
            return ""
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "voice_note_transcription_failed",
                path=path.name,
                error_type=type(exc).__name__,
                error_msg=str(exc)[:200],
            )
            return ""
        # PII-strip the transcribed text BEFORE returning to caller.
        return _strip_pii(transcription)

    return await asyncio.gather(*[_one(p) for p in paths])


__all__ = [
    "ChatLine",
    "ParsedSamples",
    "WhisperTranscriberProtocol",
    "parse_whatsapp_zip",
    "transcribe_voice_notes",
]
