# cap: clinics.lisa.doctores
"""AvailabilityProjectionService — expands AvailabilityBlock into slots via dateutil.rrule.

Architecture decision D-2 (03-arch.md): recurrence engine is brand-local dateutil.rrule
(NOT luana-core-commercial-calendar which is a marketing-event calendar with zero RRULE
support). python-dateutil v2.9.0 is already in uv.lock.

RFC 5545 RRULE mapping:
  - weekly  → rrule(WEEKLY, interval=1, byweekday=day_of_week, ...)
  - biweekly → rrule(WEEKLY, interval=2, byweekday=day_of_week, ...)
  - end_date   → until=end_date (datetime)
  - occurrences → count=occurrences
  - open_ended → until=today+90d (rolling horizon, materialized on create/update)
  - one_off → single date, no rrule needed

Slot granularity: default 30min (tenant appointment duration config — passed by caller).
UTC: all start_ts/end_ts are timezone-aware UTC datetimes.
Tenant timezone conversion: caller passes slot_duration_minutes only; full tz conversion
is deferred to scheduling service (brand-local pattern — scheduler owns tz display).

Mutability:
  - project_block(block, reference_date): expand from reference_date onward (create/reproject)
  - classify_future_slots_for_deletion(existing_slots, reference_date): split into
    to_delete (free) vs preserved (confirmed) — used by repo delete_block / update_block
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta, timezone
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import structlog
from dateutil.rrule import WEEKLY, rrule

if TYPE_CHECKING:
    pass

logger = structlog.get_logger()

# Default slot granularity in minutes (tenant config can override)
_DEFAULT_SLOT_DURATION_MINUTES = 30

# Rolling horizon for open_ended blocks
_OPEN_ENDED_HORIZON_DAYS = 90


# ── Value object returned by projection ──────────────────────────────────────


@dataclass
class ProjectedSlot:
    """A single materialized availability slot.

    Returned by AvailabilityProjectionService.project_block().
    Caller maps this to VitaliaAvailabilitySlotModel for persistence.
    """

    tenant_id: UUID
    clinic_id: UUID
    doctor_id: UUID
    block_id: UUID
    slot_date: date
    start_ts: datetime
    end_ts: datetime
    has_confirmed_appointment: bool = field(default=False)
    id: UUID = field(default_factory=uuid4)


# ── Service ───────────────────────────────────────────────────────────────────


class AvailabilityProjectionService:
    """Expand AvailabilityBlock into materialized ProjectedSlot list.

    Usage::

        service = AvailabilityProjectionService(slot_duration_minutes=30)
        slots = service.project_block(block, reference_date=date.today())
        # slots is list[ProjectedSlot] ready for persistence

    reference_date filters out past dates — only slot_date >= reference_date
    are materialized. This implements the "reproject future only" invariant.
    """

    def __init__(self, slot_duration_minutes: int = _DEFAULT_SLOT_DURATION_MINUTES) -> None:
        """Initialize with slot granularity.

        Args:
            slot_duration_minutes: Duration per slot in minutes (default: 30).
        """
        if slot_duration_minutes < 1:
            raise ValueError(f"slot_duration_minutes must be >= 1, got {slot_duration_minutes}")
        self._duration = timedelta(minutes=slot_duration_minutes)

    def project_block(
        self,
        block: "AvailabilityBlock",  # noqa: F821 — forward ref avoided via string
        *,
        reference_date: date | None = None,
    ) -> list[ProjectedSlot]:
        """Expand a block into materialized slots.

        Args:
            block: The AvailabilityBlock domain entity.
            reference_date: Only project slots on or after this date.
                            Defaults to today (UTC). Use a specific date for
                            historical projection in tests.

        Returns:
            List of ProjectedSlot ready to be persisted as VitaliaAvailabilitySlotModel.
        """

        if reference_date is None:
            reference_date = datetime.now(tz=timezone.utc).date()

        if block.kind == "one_off":
            return self._project_one_off(block, reference_date=reference_date)
        elif block.kind == "recurrent":
            return self._project_recurrent(block, reference_date=reference_date)
        else:
            logger.warning("unknown_block_kind", kind=block.kind, block_id=str(block.id))
            return []

    def classify_future_slots_for_deletion(
        self,
        existing_slots: list[ProjectedSlot],
        *,
        reference_date: date | None = None,
    ) -> tuple[list[ProjectedSlot], int]:
        """Split future slots into deletable (free) and preserved (confirmed).

        Used by repository delete_block / update_block to determine which
        slots to soft-delete without touching confirmed appointments.

        Args:
            existing_slots: All current slots for the block (any date).
            reference_date: Cutoff date — only classify slots >= this date.
                            Defaults to today (UTC).

        Returns:
            Tuple of (to_delete: list[ProjectedSlot], preserved_count: int).
            to_delete: free future slots (has_confirmed_appointment=False)
            preserved_count: count of confirmed future slots (untouched)
        """
        if reference_date is None:
            reference_date = datetime.now(tz=timezone.utc).date()

        to_delete: list[ProjectedSlot] = []
        preserved_count = 0

        for slot in existing_slots:
            if slot.slot_date < reference_date:
                # Past slots — never touch regardless of confirmation status
                continue
            if slot.has_confirmed_appointment:
                preserved_count += 1
            else:
                to_delete.append(slot)

        return to_delete, preserved_count

    # ── Private expansion helpers ─────────────────────────────────────────────

    def _project_one_off(
        self,
        block: "AvailabilityBlock",  # noqa: F821
        *,
        reference_date: date,
    ) -> list[ProjectedSlot]:
        """Project a one_off block: single date only."""
        assert block.specific_date is not None, "one_off block must have specific_date"

        # Skip if specific_date is before the reference (past slot)
        if block.specific_date < reference_date:
            return []

        return self._slots_for_date(block.specific_date, block=block)

    def _project_recurrent(
        self,
        block: "AvailabilityBlock",  # noqa: F821
        *,
        reference_date: date,
    ) -> list[ProjectedSlot]:
        """Project a recurrent block using dateutil.rrule.

        Maps freq to interval:
          - weekly  → WEEKLY interval=1
          - biweekly → WEEKLY interval=2

        Maps end_condition_kind:
          - end_date   → until=datetime(end_date, tzinfo=UTC)
          - occurrences → count=occurrences
          - open_ended → until=reference_date + 90d
        """
        assert block.day_of_week is not None, "recurrent block must have day_of_week"
        assert block.freq in ("weekly", "biweekly"), f"unknown freq: {block.freq}"

        interval = 1 if block.freq == "weekly" else 2

        # dtstart: first occurrence on or after reference_date on the correct weekday
        dtstart = _next_weekday_from(reference_date, weekday=block.day_of_week)

        # Build rrule kwargs
        rrule_kwargs: dict[str, object] = {
            "freq": WEEKLY,
            "interval": interval,
            "byweekday": block.day_of_week,
            "dtstart": datetime.combine(dtstart, time(0, 0), tzinfo=timezone.utc),
        }

        if block.end_condition_kind == "end_date":
            assert block.end_date is not None, "end_date condition requires end_date field"
            if block.end_date < reference_date:
                return []  # entire range is in the past
            rrule_kwargs["until"] = datetime.combine(block.end_date, time(23, 59, 59), tzinfo=timezone.utc)

        elif block.end_condition_kind == "occurrences":
            assert block.occurrences and block.occurrences >= 1, "occurrences must be >= 1"
            rrule_kwargs["count"] = block.occurrences

        elif block.end_condition_kind == "open_ended":
            horizon = reference_date + timedelta(days=_OPEN_ENDED_HORIZON_DAYS)
            rrule_kwargs["until"] = datetime.combine(horizon, time(23, 59, 59), tzinfo=timezone.utc)

        else:
            logger.warning(
                "unknown_end_condition_kind",
                end_condition_kind=block.end_condition_kind,
                block_id=str(block.id),
            )
            return []

        occurrence_rule = rrule(**rrule_kwargs)  # type: ignore[arg-type]
        occurrence_dates = [dt.date() for dt in occurrence_rule]

        # Filter occurrences < reference_date (can happen with count-based)
        occurrence_dates = [d for d in occurrence_dates if d >= reference_date]

        slots: list[ProjectedSlot] = []
        for occ_date in occurrence_dates:
            slots.extend(self._slots_for_date(occ_date, block=block))

        return slots

    def _slots_for_date(
        self,
        slot_date: date,
        *,
        block: "AvailabilityBlock",  # noqa: F821
    ) -> list[ProjectedSlot]:
        """Generate slots for a single date from start_time to end_time.

        Uses UTC timezone. Each slot is self._duration long.
        Block's start_time and end_time are treated as UTC (tenant tz conversion
        is handled by the scheduling display layer, not the projection layer).
        """
        slots: list[ProjectedSlot] = []
        cursor = datetime.combine(slot_date, block.start_time, tzinfo=timezone.utc)
        end_dt = datetime.combine(slot_date, block.end_time, tzinfo=timezone.utc)

        while cursor + self._duration <= end_dt:
            slot_end = cursor + self._duration
            slots.append(
                ProjectedSlot(
                    id=uuid4(),
                    tenant_id=block.tenant_id,
                    clinic_id=block.clinic_id,
                    doctor_id=block.doctor_id,
                    block_id=block.id,
                    slot_date=slot_date,
                    start_ts=cursor,
                    end_ts=slot_end,
                    has_confirmed_appointment=False,
                )
            )
            cursor = slot_end

        return slots


# ── Utility ───────────────────────────────────────────────────────────────────


def _next_weekday_from(from_date: date, *, weekday: int) -> date:
    """Return the first date >= from_date that falls on weekday (0=Monday..6=Sunday)."""
    days_ahead = weekday - from_date.weekday()
    if days_ahead < 0:
        days_ahead += 7
    return from_date + timedelta(days=days_ahead)
