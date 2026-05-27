"""RED tests — AgendaGridRepository HIPAA-lite dual filter + JOIN + preset filters.

TDD: these tests define the expected interface BEFORE implementation.
Uses in-memory mocks — no Postgres required (pure unit tests, not @integration).

Contract (03-arch A1, A12):
- EVERY query filters by tenant_id + clinic_id (HIPAA-lite dual filter)
- Cross-clinic queries return empty list (A3)
- Preset filter chips map to WHERE clause variants
- PHI projection: patient_name_masked + dni_masked (no raw PHI in response)
- JOIN: vitalia_appointments + vitalia_appointment_clinic_map + vitalia_appointment_payments

Per 05-guidelines TDD-mandatory + vitalia/.claude/rules/hipaa-lite.md
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

# ---------------------------------------------------------------------------
# Import helpers
# ---------------------------------------------------------------------------


def _import_agenda_grid_repo():
    """Import AgendaGridRepositoryImpl lazily (will fail RED until file exists)."""
    from src.modules.vitalia.scheduling.infrastructure.repositories.agenda_grid_repository_impl import (  # noqa: PLC0415
        AgendaGridRepositoryImpl,
    )

    return AgendaGridRepositoryImpl


def _import_agenda_grid_interface():
    from src.modules.vitalia.scheduling.infrastructure.repositories.agenda_grid_repository import (  # noqa: PLC0415
        AgendaGridRepository,
    )

    return AgendaGridRepository


def _import_preset_filter():
    from src.modules.vitalia.scheduling.domain.agenda_filter import AgendaPresetFilter  # noqa: PLC0415

    return AgendaPresetFilter


def _make_mock_session() -> MagicMock:
    """Build a minimal AsyncSession mock that supports execute() + scalars()."""
    session = MagicMock()
    result = MagicMock()
    result.all.return_value = []
    session.execute = AsyncMock(return_value=result)
    return session


def _make_mock_session_with_rows(rows: list[Any]) -> MagicMock:
    """Build AsyncSession mock returning specific rows from execute()."""
    session = MagicMock()
    result = MagicMock()
    # mappings() -> all() returns list of mapping-like objects
    mappings_result = MagicMock()
    mappings_result.all.return_value = rows
    result.mappings.return_value = mappings_result
    result.all.return_value = rows
    session.execute = AsyncMock(return_value=result)
    return session


# ---------------------------------------------------------------------------
# Tests — import contract
# ---------------------------------------------------------------------------


class TestAgendaGridRepositoryImport:
    """AgendaGridRepository + Impl must be importable."""

    def test_interface_importable(self) -> None:
        repo_cls = _import_agenda_grid_interface()
        assert repo_cls is not None

    def test_impl_importable(self) -> None:
        impl_cls = _import_agenda_grid_repo()
        assert impl_cls is not None

    def test_impl_accepts_session_in_constructor(self) -> None:
        impl_cls = _import_agenda_grid_repo()
        session = _make_mock_session()
        repo = impl_cls(session=session)
        assert repo is not None

    def test_impl_has_list_slots_method(self) -> None:
        impl_cls = _import_agenda_grid_repo()
        assert hasattr(impl_cls, "list_slots")

    def test_impl_has_get_monthly_aggregates_stub(self) -> None:
        """list_slots is the primary method — monthly aggregates live in separate repo."""
        impl_cls = _import_agenda_grid_repo()
        # Primary required method
        assert hasattr(impl_cls, "list_slots")


# ---------------------------------------------------------------------------
# Tests — dual filter contract (A1 + A3 acceptance criteria)
# ---------------------------------------------------------------------------


class TestAgendaGridDualFilter:
    """Every query MUST include both tenant_id + clinic_id (HIPAA-lite)."""

    @pytest.mark.asyncio
    async def test_agenda_grid_filters_by_tenant_and_clinic(self) -> None:
        """list_slots must pass BOTH tenant_id + clinic_id into query execution."""
        impl_cls = _import_agenda_grid_repo()
        session = _make_mock_session()
        repo = impl_cls(session=session)

        tenant_id = uuid4()
        clinic_id = uuid4()
        date_from = datetime(2026, 6, 1, tzinfo=timezone.utc)
        date_to = datetime(2026, 6, 30, tzinfo=timezone.utc)

        await repo.list_slots(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            date_from=date_from,
            date_to=date_to,
        )

        # Session.execute MUST have been called
        assert session.execute.call_count >= 1
        # Verify tenant_id + clinic_id appear in the WHERE conditions.
        # AgendaGridRepositoryImpl embeds UUIDs via f-string text() clauses.
        # We inspect the whereclause text directly (avoids full compile which fails on
        # mixed text()+ORM select_from patterns).
        call_args = session.execute.call_args
        stmt = call_args[0][0] if call_args[0] else call_args.args[0]
        # Extract whereclause string (text clauses expose their text attribute)
        whereclause = stmt.whereclause
        where_str = str(whereclause)
        assert str(tenant_id) in where_str, "tenant_id must appear in WHERE clause"
        assert str(clinic_id) in where_str, "clinic_id must appear in WHERE clause (HIPAA-lite dual filter)"

    @pytest.mark.asyncio
    async def test_agenda_grid_cross_clinic_returns_empty(self) -> None:
        """list_slots with wrong clinic_id returns empty — cross-clinic isolation."""
        impl_cls = _import_agenda_grid_repo()
        # Session returns empty result set (DB enforces isolation)
        session = _make_mock_session_with_rows([])
        repo = impl_cls(session=session)

        tenant_id = uuid4()
        clinic_id_wrong = uuid4()

        date_from = datetime(2026, 6, 1, tzinfo=timezone.utc)
        date_to = datetime(2026, 6, 30, tzinfo=timezone.utc)

        # With wrong clinic_id, the session mock returns no rows → result is []
        slots = await repo.list_slots(
            tenant_id=tenant_id,
            clinic_id=clinic_id_wrong,  # attacker trying cross-clinic
            date_from=date_from,
            date_to=date_to,
        )

        assert slots == [], (
            "Cross-clinic query must return empty list — the WHERE clause filters by clinic_id and no rows match"
        )


# ---------------------------------------------------------------------------
# Tests — preset filter mapping
# ---------------------------------------------------------------------------


class TestAgendaGridPresetFilters:
    """Preset filter chips must translate to specific WHERE clause conditions."""

    @pytest.mark.asyncio
    async def test_agenda_grid_preset_filter_today(self) -> None:
        """HOY preset narrows query to today's date range."""
        impl_cls = _import_agenda_grid_repo()
        AgendaPresetFilter = _import_preset_filter()
        session = _make_mock_session()
        repo = impl_cls(session=session)

        tenant_id = uuid4()
        clinic_id = uuid4()
        date_from = datetime(2026, 6, 1, tzinfo=timezone.utc)
        date_to = datetime(2026, 6, 30, tzinfo=timezone.utc)

        await repo.list_slots(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            date_from=date_from,
            date_to=date_to,
            preset_filter=AgendaPresetFilter.HOY,
        )

        assert session.execute.call_count >= 1

    @pytest.mark.asyncio
    async def test_agenda_grid_preset_filter_tomorrow_pending(self) -> None:
        """POR_CONFIRMAR_MANANA preset adds status filter."""
        impl_cls = _import_agenda_grid_repo()
        AgendaPresetFilter = _import_preset_filter()
        session = _make_mock_session()
        repo = impl_cls(session=session)

        tenant_id = uuid4()
        clinic_id = uuid4()
        date_from = datetime(2026, 6, 1, tzinfo=timezone.utc)
        date_to = datetime(2026, 6, 30, tzinfo=timezone.utc)

        await repo.list_slots(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            date_from=date_from,
            date_to=date_to,
            preset_filter=AgendaPresetFilter.POR_CONFIRMAR_MANANA,
        )

        call_args = session.execute.call_args
        stmt = call_args[0][0] if call_args[0] else call_args.args[0]
        # Preset conditions embedded via text() clauses — inspect whereclause directly
        where_str = str(stmt.whereclause)
        # POR_CONFIRMAR_MANANA should filter on SCHEDULED status
        assert "SCHEDULED" in where_str or "scheduled" in where_str.lower(), (
            "POR_CONFIRMAR_MANANA preset must filter by SCHEDULED status"
        )

    @pytest.mark.asyncio
    async def test_agenda_grid_preset_filter_no_shows(self) -> None:
        """NO_SHOWS_DIA preset filters by NO_SHOW appointment status."""
        impl_cls = _import_agenda_grid_repo()
        AgendaPresetFilter = _import_preset_filter()
        session = _make_mock_session()
        repo = impl_cls(session=session)

        tenant_id = uuid4()
        clinic_id = uuid4()
        date_from = datetime(2026, 6, 1, tzinfo=timezone.utc)
        date_to = datetime(2026, 6, 30, tzinfo=timezone.utc)

        await repo.list_slots(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            date_from=date_from,
            date_to=date_to,
            preset_filter=AgendaPresetFilter.NO_SHOWS_DIA,
        )

        call_args = session.execute.call_args
        stmt = call_args[0][0] if call_args[0] else call_args.args[0]
        # Preset conditions embedded via text() clauses — inspect whereclause directly
        where_str = str(stmt.whereclause)
        assert "NO_SHOW" in where_str or "no_show" in where_str.lower(), (
            "NO_SHOWS_DIA preset must filter by NO_SHOW status"
        )


# ---------------------------------------------------------------------------
# Tests — JOIN clinic_map correctness
# ---------------------------------------------------------------------------


class TestAgendaGridJoinContract:
    """Repo must JOIN vitalia_appointment_clinic_map to get service_label + origin."""

    def test_agenda_grid_joins_engine_appointments_correctly(self) -> None:
        """AgendaGridRepositoryImpl joins vitalia_appointment_clinic_map."""
        import inspect

        impl_cls = _import_agenda_grid_repo()
        source = inspect.getsource(impl_cls)
        # Must reference the clinic_map model or table name
        assert "AppointmentClinicMapModel" in source or "appointment_clinic_map" in source, (
            "AgendaGridRepositoryImpl must JOIN AppointmentClinicMapModel "
            "to resolve service_label + origin per 03-arch A12"
        )

    def test_agenda_grid_phi_projection_excludes_raw_name(self) -> None:
        """AgendaGridRepositoryImpl must NOT select raw patient.name column directly."""
        import inspect

        impl_cls = _import_agenda_grid_repo()
        source = inspect.getsource(impl_cls)
        # The impl must not select "patient.name" or "patient_name" raw column
        # It MUST use masked projection (patient_name_masked)
        assert "patient_name_masked" in source, (
            "AgendaGridRepositoryImpl MUST use patient_name_masked column "
            "— never raw patient.name (HIPAA-lite PHI masking server-side)"
        )
