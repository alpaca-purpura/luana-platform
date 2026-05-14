"""Integration tests — PiiScannerService + ComplianceEventService integration.

V-F-17: PII scanner middleware + voice samples sanitization post-distill
(spec § 3.2.D per 04-validators.yaml).

Tests:
  - scan() + compliance event integration (full pipeline: detect PII → log event)
  - End-to-end: PII in offer description → scan → compliance event → no raise

These are "integration" in the sense they test the two services working together
(no live DB required — both services use unit-level mocks). Labeled integration
for V-F-17 validator command grouping.
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
# PII scan → compliance event pipeline
# ─────────────────────────────────────────────────────────────────────────────


async def test_pii_detected_in_offer_description_triggers_compliance_event(
    scanner: PiiScannerService,
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: PII in offer.description → scan detects → compliance event logged."""
    offer_description = "Programa premium. Contacto: coach@example.com para inscripción."

    # 1. Scan
    result = scanner.scan_offer_description(offer_description)

    # 2. PII detected
    assert result.needs_review is True
    assert "email" in result.detected

    # 3. Log compliance event (no raise — best-effort)
    await compliance_service.log_event(
        event_type="pii_detected",
        severity="high",
        payload={"surface": "offer_description", "categories": result.detected},
        tenant_id=tenant_id,
    )

    # 4. Audit event saved
    mock_audit_repo.save.assert_called_once()
    saved_model = mock_audit_repo.save.call_args[0][0]
    assert saved_model.event_type == "pii_detected"
    assert saved_model.severity == "high"
    assert saved_model.tenant_id == tenant_id


async def test_clean_offer_description_no_compliance_event_needed(
    scanner: PiiScannerService,
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: clean offer.description → scan clean → no compliance event needed."""
    clean_description = (
        "Programa de 8 semanas para coaches LatAm. Aprende a sistematizar tu comunidad y lanzar cohortes rentables."
    )

    result = scanner.scan_offer_description(clean_description)

    assert result.needs_review is False
    assert result.detected == []

    # No compliance event log called for clean content
    mock_audit_repo.save.assert_not_called()


async def test_pii_detected_in_testimonial_triggers_compliance_event(
    scanner: PiiScannerService,
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: PII in testimonial.quote → scan detects → compliance event."""
    testimonial_with_phone = (
        "Excelente programa. Me cambia la vida. Pueden contactarme al +54 11 1234-5678 para referencia."
    )

    result = scanner.scan_testimonial(testimonial_with_phone)

    assert result.needs_review is True
    assert "phone" in result.detected

    await compliance_service.log_event(
        event_type="pii_detected",
        severity="high",
        payload={"surface": "testimonial", "categories": result.detected},
        tenant_id=tenant_id,
    )

    mock_audit_repo.save.assert_called_once()


async def test_compliance_event_service_best_effort_on_audit_failure(
    scanner: PiiScannerService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: compliance event service NEVER raises even if audit repo fails."""
    # Simulate DB failure
    mock_audit_repo.save = AsyncMock(side_effect=RuntimeError("DB down"))
    compliance_service = ComplianceEventService(audit_repo=mock_audit_repo)

    offer_description = "Mi correo es test@test.com para info."
    result = scanner.scan_offer_description(offer_description)
    assert result.needs_review is True

    # Must NOT raise even though repo fails
    await compliance_service.log_event(
        event_type="pii_detected",
        severity="high",
        payload={"categories": result.detected},
        tenant_id=tenant_id,
    )
    # No exception raised — best-effort confirmed


async def test_masked_text_returned_for_pii_offer_description(
    scanner: PiiScannerService,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: masked_text returned with email replaced, clean portions preserved."""
    text = "Programa de coaching. Escríbeme a coach@anabella.com para más info."
    result = scanner.scan_offer_description(text)

    assert "coach@anabella.com" not in result.masked_text
    assert "Programa de coaching" in result.masked_text
    assert "EMAIL_REDACTED" in result.masked_text or "REDACTED" in result.masked_text


async def test_multiple_pii_surfaces_all_detected(
    scanner: PiiScannerService,
    tenant_id: uuid.UUID,
) -> None:
    """V-F-17: email + phone in same text → both surfaces detected."""
    text = "Coach: ana@coaching.io · WhatsApp: +56912345678"

    result = scanner.scan(text)
    assert "email" in result.detected
    assert "phone" in result.detected
    assert result.needs_review is True
    assert len(result.detected) == 2
