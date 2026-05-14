"""Unit tests — PiiScannerService.

TDD RED phase: written before implementation exists.
Tests drive the contract per 03-arch-be.md § 9.9 + Tessl pii-sanitisation.md.

Covers:
  - C1: scan() returns PiiScanResult (dataclass with detected + blocked + needs_review)
  - C2: email detection
  - C3: phone detection
  - C4: LATAM national ID detection (AR DNI, CL RUT, MX RFC/CURP)
  - C5: blocking categories (email, phone, national IDs are blocking)
  - C6: empty text → no PII detected
  - C7: clean text → no PII detected
  - C8: masked_text returns text with PII redacted
  - C9: multiple categories detected simultaneously
  - C10: PiiScanResult.needs_review when any blocking category present
  - C11: scan_offer_description convenience method
  - C12: scan_testimonial convenience method
  - C13: scan_voice_sample convenience method

PiiScanResult shape per arch:
  - detected: list[str] — category names
  - masked_text: str — text with PII replaced
  - needs_review: bool — True when any blocking category detected
  - blocked: bool — alias for needs_review
"""

from __future__ import annotations

import pytest

from src.modules.comunify.application.services.pii_scanner_service import (
    BLOCKING_CATEGORIES,
    PiiScannerService,
    PiiScanResult,
)

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def scanner() -> PiiScannerService:
    """Stateless PiiScannerService singleton (no DI needed)."""
    return PiiScannerService()


# ─────────────────────────────────────────────────────────────────────────────
# C1 — PiiScanResult type
# ─────────────────────────────────────────────────────────────────────────────


def test_scan_returns_pii_scan_result(scanner: PiiScannerService) -> None:
    """C1: scan() returns PiiScanResult instance."""
    result = scanner.scan("Hola, mi nombre es Juan.")
    assert isinstance(result, PiiScanResult)


def test_pii_scan_result_has_required_fields(scanner: PiiScannerService) -> None:
    """C1: PiiScanResult has detected, masked_text, needs_review fields."""
    result = scanner.scan("texto sin PII")
    assert hasattr(result, "detected")
    assert hasattr(result, "masked_text")
    assert hasattr(result, "needs_review")
    assert isinstance(result.detected, list)
    assert isinstance(result.masked_text, str)
    assert isinstance(result.needs_review, bool)


# ─────────────────────────────────────────────────────────────────────────────
# C2 — Email detection
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "text",
    [
        "Contactame en juan@gmail.com para más info.",
        "Mi correo: coach@anabellaconexion.com.ar",
        "Escribe a support@plataforma-coaching.io",
    ],
)
def test_email_detected(scanner: PiiScannerService, text: str) -> None:
    """C2: email pattern detected in text."""
    result = scanner.scan(text)
    assert "email" in result.detected


def test_no_email_in_clean_text(scanner: PiiScannerService) -> None:
    """C2: no false-positive email in clean coaching description."""
    result = scanner.scan("Aprende a escalar tu negocio de coaching con nuestro programa de 8 semanas.")
    assert "email" not in result.detected


# ─────────────────────────────────────────────────────────────────────────────
# C3 — Phone detection
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "text",
    [
        "Llámame al +54 11 1234-5678 para agendar.",
        "WhatsApp: +56912345678",
        "Contacto: +52 55 1234 5678",
    ],
)
def test_phone_detected(scanner: PiiScannerService, text: str) -> None:
    """C3: LATAM phone numbers with country codes detected."""
    result = scanner.scan(text)
    assert "phone" in result.detected


# ─────────────────────────────────────────────────────────────────────────────
# C4 — LATAM national ID detection
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "text,expected_category",
    [
        # AR DNI formatted: 12.345.678
        ("Mi DNI es 28.456.123 y quiero inscribirme.", "dni_ar"),
        # CL RUT: 12.345.678-9
        ("RUT: 16.789.456-K del estudiante.", "rut_cl"),
        # MX RFC: 4 chars + 6 digits + 3 alphanum
        ("RFC: GAMA850312H45 para facturar.", "rfc_mx"),
        # MX CURP: 18 chars
        ("CURP: MOLA850312HMCNRL09 del alumno.", "curp_mx"),
    ],
)
def test_national_id_detected(scanner: PiiScannerService, text: str, expected_category: str) -> None:
    """C4: LATAM national IDs detected per category."""
    result = scanner.scan(text)
    assert expected_category in result.detected, (
        f"Expected '{expected_category}' in detected={result.detected} for text: {text!r}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# C5 — Blocking categories
# ─────────────────────────────────────────────────────────────────────────────


def test_email_is_blocking_category(scanner: PiiScannerService) -> None:
    """C5: email detection → needs_review=True (blocking)."""
    result = scanner.scan("Escríbeme a coach@example.com para info.")
    assert result.needs_review is True
    assert result.blocked is True  # alias


def test_phone_is_blocking_category(scanner: PiiScannerService) -> None:
    """C5: phone detection → needs_review=True (blocking)."""
    result = scanner.scan("Contacto al +54 11 5555-4444.")
    assert result.needs_review is True


def test_blocking_categories_set_non_empty() -> None:
    """C5: BLOCKING_CATEGORIES must include email, phone, national IDs."""
    assert "email" in BLOCKING_CATEGORIES
    assert "phone" in BLOCKING_CATEGORIES
    assert "dni_ar" in BLOCKING_CATEGORIES
    assert "rut_cl" in BLOCKING_CATEGORIES
    assert "rfc_mx" in BLOCKING_CATEGORIES
    assert "curp_mx" in BLOCKING_CATEGORIES


# ─────────────────────────────────────────────────────────────────────────────
# C6, C7 — Clean text returns no PII
# ─────────────────────────────────────────────────────────────────────────────


def test_empty_text_returns_no_pii(scanner: PiiScannerService) -> None:
    """C6: empty string → empty detected, needs_review=False."""
    result = scanner.scan("")
    assert result.detected == []
    assert result.needs_review is False
    assert result.masked_text == ""


def test_none_equivalent_whitespace_returns_no_pii(scanner: PiiScannerService) -> None:
    """C6: whitespace-only → empty detected."""
    result = scanner.scan("   \n\t  ")
    assert result.detected == []


def test_clean_coaching_description_no_pii(scanner: PiiScannerService) -> None:
    """C7: typical offer description without PII → empty detected, needs_review=False."""
    clean_text = (
        "Programa de 8 semanas para coaches que quieren escalar su negocio digital. "
        "Aprende a crear una comunidad comprometida, lanzar cohortes y sistematizar "
        "tu embudo de ventas. Incluye acceso a comunidad privada y sesiones grupales."
    )
    result = scanner.scan(clean_text)
    assert result.detected == []
    assert result.needs_review is False


# ─────────────────────────────────────────────────────────────────────────────
# C8 — Masked text
# ─────────────────────────────────────────────────────────────────────────────


def test_masked_text_redacts_email(scanner: PiiScannerService) -> None:
    """C8: masked_text replaces email with redaction placeholder."""
    result = scanner.scan("Correo: juan@gmail.com para consultas.")
    assert "juan@gmail.com" not in result.masked_text
    assert "[" in result.masked_text  # some placeholder present


def test_masked_text_preserves_non_pii_text(scanner: PiiScannerService) -> None:
    """C8: clean portions of text preserved in masked_text."""
    result = scanner.scan("Hola mundo sin PII aquí.")
    # No masking — original text preserved
    assert result.masked_text == "Hola mundo sin PII aquí."


# ─────────────────────────────────────────────────────────────────────────────
# C9 — Multiple categories simultaneously
# ─────────────────────────────────────────────────────────────────────────────


def test_multiple_pii_categories_detected(scanner: PiiScannerService) -> None:
    """C9: text with email + phone → both detected."""
    text = "Contacto: ana@coaching.com o al +54 11 1234-5678"
    result = scanner.scan(text)
    assert "email" in result.detected
    assert "phone" in result.detected
    assert result.needs_review is True


# ─────────────────────────────────────────────────────────────────────────────
# C10 — needs_review <=> blocked alias
# ─────────────────────────────────────────────────────────────────────────────


def test_needs_review_equals_blocked_alias(scanner: PiiScannerService) -> None:
    """C10: needs_review and blocked are equivalent (both True or both False)."""
    # With PII
    result_pii = scanner.scan("ana@test.com")
    assert result_pii.needs_review == result_pii.blocked

    # Without PII
    result_clean = scanner.scan("texto limpio sin datos personales")
    assert result_clean.needs_review == result_clean.blocked


# ─────────────────────────────────────────────────────────────────────────────
# C11-C13 — Convenience methods
# ─────────────────────────────────────────────────────────────────────────────


def test_scan_offer_description_method_exists(scanner: PiiScannerService) -> None:
    """C11: scan_offer_description() is a convenience alias for scan()."""
    assert hasattr(scanner, "scan_offer_description")
    result = scanner.scan_offer_description("Programa de coaching sin PII.")
    assert isinstance(result, PiiScanResult)


def test_scan_testimonial_method_exists(scanner: PiiScannerService) -> None:
    """C12: scan_testimonial() is a convenience alias for scan()."""
    assert hasattr(scanner, "scan_testimonial")
    result = scanner.scan_testimonial("Excelente programa, lo recomiendo.")
    assert isinstance(result, PiiScanResult)


def test_scan_voice_sample_method_exists(scanner: PiiScannerService) -> None:
    """C13: scan_voice_sample() is a convenience alias for scan()."""
    assert hasattr(scanner, "scan_voice_sample")
    result = scanner.scan_voice_sample("Hola, bienvenidos a mi comunidad.")
    assert isinstance(result, PiiScanResult)


def test_convenience_methods_detect_pii_same_as_scan(scanner: PiiScannerService) -> None:
    """C11-C13: all convenience methods return same detection as scan()."""
    pii_text = "contacta a coach@test.com"
    assert scanner.scan(pii_text).detected == scanner.scan_offer_description(pii_text).detected
    assert scanner.scan(pii_text).detected == scanner.scan_testimonial(pii_text).detected
    assert scanner.scan(pii_text).detected == scanner.scan_voice_sample(pii_text).detected
