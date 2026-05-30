"""Regression tests — audit_writer sanitize_phi_payload (T-1 · arreglar-guardado-voz-y-tono).

TDD RED→GREEN:
  RED:  Both call sites (write_audit_log_sync + AsyncAuditWriter.write) raise TypeError
        when luana_core_observability.sanitize_payload is called with compliance_level kwarg
        (the kwarg was removed from the engine signature).
  GREEN: After repointing to sanitize_phi_payload (vitalia brand-local wrapper),
         calls succeed and PHI fields are redacted.

Per vitalia/.claude/rules/hipaa-lite.md § PII sanitization en traces:
  "sanitize_phi_payload wraps luana_core_observability sanitize_payload
   with 22 vitalia-specific PHI field removal"

Per .claude/rules/tdd-mandatory.md:
  RED test MUST reproduce the bug BEFORE the fix is applied.

downstream-regression-na: brand-local regression tests for vitalia audit sanitization
"""

from __future__ import annotations

import asyncio
import json
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

# ─────────────────────────────────────────────────────────────────────────────
# Helper: engine sanitize_payload WITHOUT compliance_level kwarg (current engine signature)
# Used to reproduce the TypeError that happens when callers pass compliance_level=...
# ─────────────────────────────────────────────────────────────────────────────


def _engine_sanitize_no_kwarg(payload: dict[str, Any]) -> dict[str, Any]:
    """Simulate the current engine signature — no compliance_level kwarg.

    Calling this with compliance_level="hipaa_lite" raises TypeError,
    which is the root-cause bug this ticket fixes.
    """
    return dict(payload)


# Patch target for sanitize_phi_payload (lazy import inside audit_writer fn bodies).
# Since the import is `from src.modules.vitalia.compliance... import sanitize_phi_payload`,
# we patch the function at its source module so ALL callers see the mock.
_SANITIZE_PHI_PATCH = "src.modules.vitalia.compliance.application.compliance_service_adapter.sanitize_phi_payload"


class TestAuditWriterSanitizeRootCause:
    """RED → GREEN regression for TypeError on sanitize_payload(compliance_level=...).

    These tests verify that NEITHER write_audit_log_sync NOR AsyncAuditWriter.write
    raise TypeError when luana_core_observability.sanitize_payload does NOT accept
    compliance_level.
    """

    def test_write_audit_log_sync_no_typeerror(self) -> None:
        """write_audit_log_sync must NOT raise TypeError regardless of engine kwarg support.

        RED: Before fix, the lazy import calls
             sanitize_payload(payload, compliance_level="hipaa_lite") → TypeError.
        GREEN: After fix, sanitize_phi_payload(payload) is called instead → no TypeError.
        """
        from src.modules.vitalia.audit.audit_writer import write_audit_log_sync

        mock_db = MagicMock()
        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        user_id = str(uuid4())
        resource_id = str(uuid4())

        # Patch at source module — lazy import inside fn body resolves to the source.
        with patch(
            _SANITIZE_PHI_PATCH,
            side_effect=_engine_sanitize_no_kwarg,
        ) as mock_sanitize:
            # Must not raise TypeError
            write_audit_log_sync(
                mock_db,
                tenant_id=tenant_id,
                clinic_id=clinic_id,
                user_id=user_id,
                action="brand_personality_updated",
                resource_type="personality_profile",
                resource_id=resource_id,
                payload={"archetype": "sage"},
            )

        # Verify sanitize_phi_payload was called (not the old sanitize_payload)
        mock_sanitize.assert_called_once_with({"archetype": "sage"})
        mock_db.execute.assert_called_once()

    def test_async_audit_writer_write_no_typeerror(self) -> None:
        """AsyncAuditWriter.write must NOT raise TypeError.

        RED: Before fix, AsyncAuditWriter.write lazy-imports sanitize_payload and
             calls it with compliance_level="hipaa_lite" → TypeError.
        GREEN: sanitize_phi_payload(payload) is called → no TypeError.
        """
        from src.modules.vitalia.audit.audit_writer import AsyncAuditWriter

        mock_session = AsyncMock()
        mock_session.execute = AsyncMock()

        tenant_id = uuid4()
        clinic_id = uuid4()
        user_id = uuid4()
        resource_id = uuid4()

        with patch(
            _SANITIZE_PHI_PATCH,
            side_effect=_engine_sanitize_no_kwarg,
        ) as mock_sanitize:
            asyncio.run(
                AsyncAuditWriter(session=mock_session).write(
                    tenant_id=tenant_id,
                    clinic_id=clinic_id,
                    user_id=user_id,
                    action="brand_personality_updated",
                    resource_type="personality_profile",
                    resource_id=resource_id,
                    payload={"archetype": "sage"},
                )
            )

        mock_sanitize.assert_called_once_with({"archetype": "sage"})
        mock_session.execute.assert_called_once()

    def test_write_audit_log_sync_no_compliance_kwarg_in_call(self) -> None:
        """sanitize_phi_payload is called WITHOUT compliance_level kwarg.

        Ensures the deprecated kwarg is gone from both call sites.
        """
        from src.modules.vitalia.audit.audit_writer import write_audit_log_sync

        mock_db = MagicMock()
        captured_calls: list[Any] = []

        def capture(*args: Any, **kwargs: Any) -> dict[str, Any]:
            captured_calls.append((args, kwargs))
            return dict(args[0]) if args else {}

        with patch(_SANITIZE_PHI_PATCH, side_effect=capture):
            write_audit_log_sync(
                mock_db,
                tenant_id=str(uuid4()),
                clinic_id=str(uuid4()),
                user_id=str(uuid4()),
                action="test.action",
                resource_type="test",
                resource_id=str(uuid4()),
                payload={"some": "data"},
            )

        assert len(captured_calls) == 1
        _args, kwargs = captured_calls[0]
        # compliance_level kwarg MUST NOT be present
        assert "compliance_level" not in kwargs, (
            "compliance_level kwarg must not be passed to sanitize_phi_payload. "
            "It was a dead kwarg from the engine's old sanitize_payload signature."
        )

    def test_async_write_no_compliance_kwarg_in_call(self) -> None:
        """AsyncAuditWriter.write does NOT pass compliance_level to sanitize_phi_payload."""
        from src.modules.vitalia.audit.audit_writer import AsyncAuditWriter

        mock_session = AsyncMock()
        mock_session.execute = AsyncMock()
        captured_calls: list[Any] = []

        def capture(*args: Any, **kwargs: Any) -> dict[str, Any]:
            captured_calls.append((args, kwargs))
            return dict(args[0]) if args else {}

        with patch(_SANITIZE_PHI_PATCH, side_effect=capture):
            asyncio.run(
                AsyncAuditWriter(session=mock_session).write(
                    tenant_id=uuid4(),
                    clinic_id=uuid4(),
                    user_id=uuid4(),
                    action="test.action",
                    resource_type="test",
                    resource_id=uuid4(),
                    payload={"some": "data"},
                )
            )

        assert len(captured_calls) == 1
        _args, kwargs = captured_calls[0]
        assert "compliance_level" not in kwargs


# Patch target for the engine inner call used by sanitize_phi_payload itself.
# We mock the engine call so unit tests don't need luana_core_observability installed.
_ENGINE_SANITIZE_PATCH = "luana_core_observability.recording.sanitization.sanitize_payload"


class TestAuditWriterPhiRedaction:
    """test_phi_redacted — PHI fields are redacted by sanitize_phi_payload semantics.

    Tests use the REAL sanitize_phi_payload function (not mocked) and only mock the
    inner engine call (luana_core_observability.sanitize_payload) to avoid requiring
    the package in unit tests. This exercises the full vitalia PHI redaction logic.

    Per hipaa-lite.md § PHI fields canónicos: 22 canonical fields.
    Per compliance_service_adapter.py::sanitize_phi_payload: wraps engine
    sanitize_payload + vitalia-specific 22-field removal.
    """

    def test_phi_redacted_top_level_fields(self) -> None:
        """Top-level PHI fields in payload are REDACTED before audit write.

        sanitize_phi_payload removes: diagnosis, treatment_plan, medication,
        dosage, allergies, symptoms, medical_notes, lab_results, vital_signs,
        imaging_url, xray_filename, ultrasound_report, previous_treatments,
        family_history, surgical_history.
        """
        from src.modules.vitalia.audit.audit_writer import write_audit_log_sync
        from src.modules.vitalia.compliance.domain.phi_fields import REDACTED_PLACEHOLDER

        mock_db = MagicMock()
        raw_payload = {
            "archetype": "sage",
            "diagnosis": "Caries grado III",
            "treatment_plan": "Extracción + implante",
            "non_phi_field": "keep_this",
        }

        # Mock the engine's inner call; use real sanitize_phi_payload to verify redaction.
        with patch(_ENGINE_SANITIZE_PATCH, side_effect=lambda p: dict(p)):
            write_audit_log_sync(
                mock_db,
                tenant_id=str(uuid4()),
                clinic_id=str(uuid4()),
                user_id=str(uuid4()),
                action="brand_personality_updated",
                resource_type="personality_profile",
                resource_id=str(uuid4()),
                payload=raw_payload,
            )

        call_args = mock_db.execute.call_args
        assert call_args is not None
        params = call_args[0][1]
        persisted = json.loads(params["payload"].decode("utf-8"))

        # Non-PHI preserved
        assert persisted["archetype"] == "sage"
        assert persisted["non_phi_field"] == "keep_this"

        # PHI fields MUST be redacted
        assert persisted.get("diagnosis") == REDACTED_PLACEHOLDER, (
            f"Expected diagnosis={REDACTED_PLACEHOLDER!r}, got {persisted.get('diagnosis')!r}"
        )
        assert persisted.get("treatment_plan") == REDACTED_PLACEHOLDER, (
            f"Expected treatment_plan={REDACTED_PLACEHOLDER!r}, got {persisted.get('treatment_plan')!r}"
        )

    def test_phi_redacted_patient_nested_fields(self) -> None:
        """Nested patient.* PHI fields are REDACTED before audit write.

        sanitize_phi_payload removes under "patient" key:
        name, dni, cuit, date_of_birth, phone, email, address.
        """
        from src.modules.vitalia.audit.audit_writer import write_audit_log_sync
        from src.modules.vitalia.compliance.domain.phi_fields import REDACTED_PLACEHOLDER

        mock_db = MagicMock()
        raw_payload = {
            "action_context": "appointment_created",
            "patient": {
                "name": "María González",
                "dni": "12345678",
                "phone": "+54 11 9999-8888",
                "email": "patient@example.com",
                "appointment_count": 3,  # non-PHI: should be preserved
            },
        }

        with patch(_ENGINE_SANITIZE_PATCH, side_effect=lambda p: dict(p)):
            write_audit_log_sync(
                mock_db,
                tenant_id=str(uuid4()),
                clinic_id=str(uuid4()),
                user_id=str(uuid4()),
                action="appointment.detail_read",
                resource_type="appointment",
                resource_id=str(uuid4()),
                payload=raw_payload,
            )

        call_args = mock_db.execute.call_args
        params = call_args[0][1]
        persisted = json.loads(params["payload"].decode("utf-8"))

        patient = persisted.get("patient", {})
        # PHI fields under patient MUST be redacted
        assert patient.get("name") == REDACTED_PLACEHOLDER
        assert patient.get("dni") == REDACTED_PLACEHOLDER
        assert patient.get("phone") == REDACTED_PLACEHOLDER
        assert patient.get("email") == REDACTED_PLACEHOLDER
        # Non-PHI under patient MUST be preserved
        assert patient.get("appointment_count") == 3

    def test_phi_redacted_async_writer(self) -> None:
        """AsyncAuditWriter.write also redacts PHI fields via sanitize_phi_payload."""
        from src.modules.vitalia.audit.audit_writer import AsyncAuditWriter
        from src.modules.vitalia.compliance.domain.phi_fields import REDACTED_PLACEHOLDER

        mock_session = AsyncMock()
        mock_session.execute = AsyncMock()

        raw_payload = {
            "diagnosis": "Miopía -2.5",
            "archetype": "sage",
        }

        with patch(_ENGINE_SANITIZE_PATCH, side_effect=lambda p: dict(p)):
            asyncio.run(
                AsyncAuditWriter(session=mock_session).write(
                    tenant_id=uuid4(),
                    clinic_id=uuid4(),
                    user_id=uuid4(),
                    action="brand_personality_updated",
                    resource_type="personality_profile",
                    resource_id=uuid4(),
                    payload=raw_payload,
                )
            )

        call_args = mock_session.execute.call_args
        assert call_args is not None
        params = call_args[0][1]
        persisted = json.loads(params["payload"].decode("utf-8"))

        assert persisted.get("diagnosis") == REDACTED_PLACEHOLDER
        assert persisted.get("archetype") == "sage"

    def test_sync_writer_none_payload_no_error(self) -> None:
        """write_audit_log_sync with payload=None does not raise."""
        from src.modules.vitalia.audit.audit_writer import write_audit_log_sync

        mock_db = MagicMock()

        with patch(_ENGINE_SANITIZE_PATCH, side_effect=lambda p: dict(p)):
            # Must not raise
            write_audit_log_sync(
                mock_db,
                tenant_id=str(uuid4()),
                clinic_id=str(uuid4()),
                user_id=str(uuid4()),
                action="brand_personality_updated",
                resource_type="personality_profile",
                resource_id=str(uuid4()),
                payload=None,
            )

        mock_db.execute.assert_called_once()

    def test_async_writer_none_payload_no_error(self) -> None:
        """AsyncAuditWriter.write with payload=None does not raise."""
        from src.modules.vitalia.audit.audit_writer import AsyncAuditWriter

        mock_session = AsyncMock()
        mock_session.execute = AsyncMock()

        with patch(_ENGINE_SANITIZE_PATCH, side_effect=lambda p: dict(p)):
            asyncio.run(
                AsyncAuditWriter(session=mock_session).write(
                    tenant_id=uuid4(),
                    clinic_id=uuid4(),
                    user_id=uuid4(),
                    action="brand_personality_updated",
                    resource_type="personality_profile",
                    resource_id=uuid4(),
                    payload=None,
                )
            )

        mock_session.execute.assert_called_once()
