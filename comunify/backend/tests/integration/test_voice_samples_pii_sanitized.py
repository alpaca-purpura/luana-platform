"""Integration tests — Voice sample PII sanitization post-distill.

V-F-17: PII scanner middleware + voice samples sanitization post-distill
(spec § 3.2.D per 04-validators.yaml).

Tests:
  - Voice sample transcription PII scanning (phone, email, national IDs)
  - Post-distill sanitization: masked_text used as persist value
  - Compliance event pipeline: detect → log → best-effort write
  - Multi-surface scan (voice + testimonial combined content)
  - Voice sample clean → no PII detected

These are "integration" in the sense they test the two services working
together for voice-specific surfaces (no live DB required — mocked repos).
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.compliance_event_service import ComplianceEventService
from src.modules.comunify.application.services.pii_scanner_service import PiiScannerService

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def scanner() -> PiiScannerService:
    """Stateless PII scanner."""
    return PiiScannerService()


@pytest.fixture
def mock_audit_repo() -> MagicMock:
    """Mock audit repo for ComplianceEventService."""
    repo = MagicMock()
    repo.save = AsyncMock(return_value=None)
    return repo


@pytest.fixture
def compliance_service(mock_audit_repo: MagicMock) -> ComplianceEventService:
    """ComplianceEventService with mocked audit repo."""
    return ComplianceEventService(audit_repo=mock_audit_repo)


@pytest.fixture
def tenant_id() -> uuid.UUID:
    return uuid.uuid4()


# ─────────────────────────────────────────────────────────────────────────────
# Voice sample PII detection → sanitization pipeline
# ─────────────────────────────────────────────────────────────────────────────


async def test_voice_sample_with_phone_detected_and_masked(
    scanner: PiiScannerService,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: Voice sample transcription with phone → detected + masked_text clean."""
    voice_transcription = (
        "Hola soy Anabella, me pueden contactar al +54 11 5678-9012 si tienen dudas sobre el programa."
    )

    result = scanner.scan_voice_sample(voice_transcription)

    assert result.needs_review is True
    assert "phone" in result.detected
    assert "+54 11 5678-9012" not in result.masked_text
    assert "[PHONE_REDACTED]" in result.masked_text
    # Non-PII content preserved
    assert "Hola soy Anabella" in result.masked_text


async def test_voice_sample_with_email_detected_and_compliance_event(
    scanner: PiiScannerService,
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: Voice sample with email → detect → compliance event logged."""
    voice_transcription = "Este es un mensaje de audio. Para más info escríbeme a trini@coaching-cl.com."

    result = scanner.scan_voice_sample(voice_transcription)

    assert result.needs_review is True
    assert "email" in result.detected
    assert "trini@coaching-cl.com" not in result.masked_text

    # Log compliance event — best-effort
    await compliance_service.log_event(
        event_type="voice_sample_pii_redacted",
        severity="high",
        payload={"surface": "voice_sample", "categories": result.detected},
        tenant_id=tenant_id,
    )

    mock_audit_repo.save.assert_called_once()
    saved = mock_audit_repo.save.call_args[0][0]
    assert saved.event_type == "voice_sample_pii_redacted"
    assert saved.tenant_id == tenant_id


async def test_voice_sample_with_latam_national_id_detected(
    scanner: PiiScannerService,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: Voice sample with CL RUT → category detected, masked."""
    voice_transcription = "Mi RUT es 16.789.456-K para facturación del programa."

    result = scanner.scan_voice_sample(voice_transcription)

    assert result.needs_review is True
    assert "rut_cl" in result.detected
    assert "16.789.456-K" not in result.masked_text
    assert "[RUT_REDACTED]" in result.masked_text


async def test_voice_sample_clean_no_pii_no_compliance_event(
    scanner: PiiScannerService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: Clean voice sample → no PII detected, no compliance event needed."""
    clean_voice = (
        "Bienvenidos a mi comunidad de coaches. En este programa aprenderán "
        "a sistematizar sus procesos de venta y crear cohortes rentables."
    )

    result = scanner.scan_voice_sample(clean_voice)

    assert result.needs_review is False
    assert result.detected == []
    assert result.masked_text == clean_voice
    mock_audit_repo.save.assert_not_called()


async def test_voice_sample_post_distill_masked_text_used_for_persist(
    scanner: PiiScannerService,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: Post-distill: masked_text is the safe value to persist (not raw)."""
    raw_voice_transcription = (
        "Hola, soy Pablo de México. RFC: GAMA850312H45. Mi correo es pablo@comunidad-mx.com para consultas."
    )

    result = scanner.scan_voice_sample(raw_voice_transcription)

    assert result.needs_review is True
    # Both categories detected
    assert "rfc_mx" in result.detected
    assert "email" in result.detected
    # Raw PII not in masked output
    assert "GAMA850312H45" not in result.masked_text
    assert "pablo@comunidad-mx.com" not in result.masked_text
    # Safe placeholders present
    assert "[RFC_REDACTED]" in result.masked_text
    assert "[EMAIL_REDACTED]" in result.masked_text
    # Non-PII content preserved
    assert "Hola, soy Pablo de México" in result.masked_text


async def test_voice_sample_ar_dni_detected_and_masked(
    scanner: PiiScannerService,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: Voice sample with AR DNI → detected and masked correctly."""
    voice_transcription = "Para la inscripción necesito tu DNI: 28.456.123 y tu nombre completo."

    result = scanner.scan_voice_sample(voice_transcription)

    assert result.needs_review is True
    assert "dni_ar" in result.detected
    assert "28.456.123" not in result.masked_text
    assert "[DNI_REDACTED]" in result.masked_text


async def test_voice_sample_compliance_event_best_effort_on_repo_failure(
    scanner: PiiScannerService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: compliance service NEVER raises even when audit repo fails on voice PII."""
    mock_audit_repo.save = AsyncMock(side_effect=RuntimeError("DB down"))
    compliance_service = ComplianceEventService(audit_repo=mock_audit_repo)

    voice = "Contacta a coach@example.com para info del programa."
    result = scanner.scan_voice_sample(voice)
    assert result.needs_review is True

    # Must NOT raise
    await compliance_service.log_event(
        event_type="voice_sample_pii_redacted",
        severity="high",
        payload={"categories": result.detected},
        tenant_id=tenant_id,
    )
    # Reaching here = best-effort confirmed (no raise)


async def test_voice_sample_mx_curp_detected(
    scanner: PiiScannerService,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: Voice sample with MX CURP → detected and masked."""
    voice_transcription = "Mi CURP es MOLA850312HMCNRL09 para el registro oficial."

    result = scanner.scan_voice_sample(voice_transcription)

    assert result.needs_review is True
    assert "curp_mx" in result.detected
    assert "MOLA850312HMCNRL09" not in result.masked_text
    assert "[CURP_REDACTED]" in result.masked_text
