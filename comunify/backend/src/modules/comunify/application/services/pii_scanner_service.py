"""PiiScannerService — pre-persist PII detection for creator-economy surfaces.

Detects PII in offer descriptions, testimonial inputs, and voice samples
before they are persisted to the DB.

Pattern: same as Vitalia Story 11 PiiScannerService — adapted for
creator-economy context (no medical fields; full LATAM national IDs).

PII categories per Tessl pii-sanitisation.md + creator-economy additions:
  email, phone, dni_ar, rut_cl, rfc_mx, curp_mx

Anti-duplication (anti-duplication.md):
  grep cross-codebase found NO existing PiiScannerService in luana-platform/core/.
  sanitize_payload is consumed from luana_core_observability via conftest sys.path.
  Pattern mirrors vitalia.application.services.pii_scanner_service.

References:
  - 03-arch-be.md § 9.9
  - 04-validators.yaml V-F-17
  - Tessl pii-sanitisation.md (blocking categories: email, phone, national IDs)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Final

import structlog

logger = structlog.get_logger()


# ── PII Regex catalog (comunify-local SSoT) ──────────────────────────────────
#
# Patterns aligned with AISALESHT/backend/scripts/_pii_patterns.py canonical
# set and vitalia Story 11 PiiScannerService. Comunify uses compiled-regex for
# performance (scan is synchronous hot path called pre-persist).
#
# sanitize_payload (luana_core_observability) handles redaction for audit log
# writes. This service handles PRE-PERSIST DETECTION (block or log) for:
#   - offer.description
#   - testimonial.quote
#   - voice_sample content strings

_PATTERN_SPECS: dict[str, str] = {
    # Email — RFC 5321 practical subset
    # Negative lookahead excludes alphanumeric continuation (e.g. "x@y.comZ") but NOT
    # punctuation (period, comma, space) so "x@y.com." and "x@y.com," both match correctly.
    "email": r"(?<![a-zA-Z0-9._%+-])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![a-zA-Z0-9])",
    # International phone with country code (+54, +56, +52, +57, +51, etc.)
    "phone": r"(?<![\d])(\+\d{1,3}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{0,4})(?![\d])",
    # AR DNI formatted: 28.456.123 — lookahead excludes '-' to avoid false-positive on CL RUT
    "dni_ar": r"(?<![\d.])(\d{1,2}\.\d{3}\.\d{3})(?![\d.-])",
    # CL RUT formatted: 12.345.678-9 or 9.876.543-K (digit or K suffix)
    "rut_cl": r"(?<![\d])(\d{1,2}\.\d{3}\.\d{3}-[\dkK])(?![\d])",
    # MX RFC — structural uppercase 12-13 chars (3-4 letters + 6 digits + 3 alphanum)
    "rfc_mx": r"(?<![A-Z])([A-ZÑ&]{3,4}\d{6}[A-Z\d]{3})(?![A-Z\d])",
    # MX CURP — structural 18 chars (4 letters + 6 digits + H|M + 5 letters + 1 alphanum + 1 digit)
    "curp_mx": r"(?<![A-Z])([A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d)(?![A-Z\d])",
}

# Compiled pattern cache — avoid recompilation on each call
_COMPILED_PATTERNS: dict[str, re.Pattern[str]] = {
    category: re.compile(pattern) for category, pattern in _PATTERN_SPECS.items()
}

# Redaction placeholder per category
_REDACTION_PLACEHOLDER: dict[str, str] = {
    "email": "[EMAIL_REDACTED]",
    "phone": "[PHONE_REDACTED]",
    "dni_ar": "[DNI_REDACTED]",
    "rut_cl": "[RUT_REDACTED]",
    "rfc_mx": "[RFC_REDACTED]",
    "curp_mx": "[CURP_REDACTED]",
}

# Categories that trigger needs_review=True (caller decides whether to reject or log+warn).
# Email and phone expose real contact info publicly — always blocking.
# National IDs expose identity information — always blocking for public surfaces.
BLOCKING_CATEGORIES: Final[frozenset[str]] = frozenset(
    {
        "email",
        "phone",
        "dni_ar",
        "rut_cl",
        "rfc_mx",
        "curp_mx",
    }
)


# ── Result model ─────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class PiiScanResult:
    """Result of a PII scan on a text surface.

    Attributes:
        detected: List of PII category names found in the text.
        masked_text: Original text with PII replaced by redaction placeholders.
        needs_review: True if any detected category is in BLOCKING_CATEGORIES.
        blocked: Alias for needs_review (backward compat with vitalia pattern).
    """

    detected: list[str] = field(default_factory=list)
    masked_text: str = ""
    needs_review: bool = False
    blocked: bool = False

    def __bool__(self) -> bool:
        """True if any PII detected."""
        return bool(self.detected)


# ── Service ──────────────────────────────────────────────────────────────────


class PiiScannerService:
    """Pre-persist PII detection for offer descriptions, testimonials, voice samples.

    Synchronous scan (no I/O) called in hot path before any user-generated
    text is written to the DB. If needs_review=True, callers MUST either
    reject the write or emit a ComplianceEventService.log_event call.

    Usage (stateless — shared singleton OK):
        scanner = PiiScannerService()
        result = scanner.scan(offer.description)
        if result.needs_review:
            await compliance_svc.log_event("pii_detected", "high", ...)
            raise PiiDetectedError(result.detected)

    Convenience methods per surface:
        scan_offer_description(text) — for offer.description fields
        scan_testimonial(text) — for testimonial.quote fields
        scan_voice_sample(text) — for voice_sample transcription strings
    """

    def scan(self, text: str) -> PiiScanResult:
        """Scan text for PII categories.

        Args:
            text: User-generated text to scan. Can be empty.

        Returns:
            PiiScanResult with detected categories, masked_text, and
            needs_review flag. Empty detected list if no PII found.
        """
        if not text or not text.strip():
            return PiiScanResult(
                detected=[],
                masked_text=text if text is not None else "",
                needs_review=False,
                blocked=False,
            )

        detected: list[str] = []
        masked = text

        for category, pattern in _COMPILED_PATTERNS.items():
            if pattern.search(text):
                detected.append(category)
                # Replace all matches with redaction placeholder
                placeholder = _REDACTION_PLACEHOLDER.get(category, "[REDACTED]")
                masked = pattern.sub(placeholder, masked)

        needs_review = any(c in BLOCKING_CATEGORIES for c in detected)

        if detected:
            logger.info(
                "pii_scanner_detected",
                categories=detected,
                needs_review=needs_review,
                text_length=len(text),
            )

        return PiiScanResult(
            detected=detected,
            masked_text=masked,
            needs_review=needs_review,
            blocked=needs_review,  # alias
        )

    def scan_offer_description(self, text: str) -> PiiScanResult:
        """Scan offer.description field for PII before persist.

        Convenience alias for scan() — semantically distinct surface
        for logging/tracing clarity.

        Args:
            text: Offer description text.

        Returns:
            PiiScanResult.
        """
        return self.scan(text)

    def scan_testimonial(self, text: str) -> PiiScanResult:
        """Scan testimonial.quote field for PII before persist.

        Convenience alias for scan() — semantically distinct surface
        for logging/tracing clarity.

        Args:
            text: Testimonial quote text.

        Returns:
            PiiScanResult.
        """
        return self.scan(text)

    def scan_voice_sample(self, text: str) -> PiiScanResult:
        """Scan voice_sample transcription string for PII before persist.

        Convenience alias for scan() — semantically distinct surface.
        Voice samples from WhatsApp chats may contain phone numbers,
        emails, or national IDs from transcribed conversations.

        Args:
            text: Transcribed voice sample content.

        Returns:
            PiiScanResult.
        """
        return self.scan(text)
