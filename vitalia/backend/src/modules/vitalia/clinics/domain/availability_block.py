# cap: clinics.lisa.doctores
"""AvailabilityBlock domain entity — pure Python dataclass.

Domain validation enforces:
  - recurrent blocks MUST have exactly one end_condition_kind
  - one_off blocks MUST have specific_date
  - start_time MUST be before end_time

No framework imports — DDD domain layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, time, timezone
from typing import Literal
from uuid import UUID, uuid4


def _utc_now() -> datetime:
    """Return timezone-aware UTC datetime."""
    return datetime.now(tz=timezone.utc)


@dataclass
class AvailabilityBlock:
    """A time block defining when a doctor is available for appointments.

    Two kinds:
    - recurrent: repeats weekly or biweekly, with an end condition
    - one_off: a single specific date

    Slots are projected from blocks by AvailabilityProjectionService (dateutil.rrule).
    """

    tenant_id: UUID
    clinic_id: UUID
    doctor_id: UUID
    kind: Literal["recurrent", "one_off"]
    start_time: time
    end_time: time
    id: UUID = field(default_factory=uuid4)

    # Recurrent fields
    day_of_week: int | None = None
    """0=Monday ... 6=Sunday (used for recurrent kind)."""

    freq: Literal["weekly", "biweekly"] | None = None
    end_condition_kind: Literal["end_date", "occurrences", "open_ended"] | None = None
    end_date: date | None = None
    occurrences: int | None = None

    # One-off field
    specific_date: date | None = None

    created_at: datetime = field(default_factory=_utc_now)
    updated_at: datetime = field(default_factory=_utc_now)
    deleted_at: datetime | None = None

    def __post_init__(self) -> None:
        """Validate domain invariants after construction."""
        self._validate_time_order()
        if self.kind == "recurrent":
            self._validate_recurrent()
        elif self.kind == "one_off":
            self._validate_one_off()

    def _validate_time_order(self) -> None:
        """start_time must be strictly before end_time."""
        if self.start_time >= self.end_time:
            raise ValueError(
                f"start_time ({self.start_time}) must be before end_time ({self.end_time}). "
                "Revisa los horarios del bloque de disponibilidad."
            )

    def _validate_recurrent(self) -> None:
        """Recurrent blocks require exactly one end condition."""
        valid_end_conditions = {"end_date", "occurrences", "open_ended"}
        if self.end_condition_kind not in valid_end_conditions:
            raise ValueError(
                "Un bloque recurrente requiere condicion de fin: "
                "elige 'end_date', 'occurrences', o 'open_ended'. "
                f"Valor recibido: {self.end_condition_kind!r}"
            )
        if self.end_condition_kind == "end_date" and self.end_date is None:
            raise ValueError(
                "Un bloque recurrente con condicion 'end_date' requiere el campo end_date. "
                "Indica la fecha de fin del bloque."
            )
        if self.end_condition_kind == "occurrences" and (self.occurrences is None or self.occurrences < 1):
            raise ValueError(
                "Un bloque recurrente con condicion 'occurrences' requiere al menos 1 ocurrencia. "
                "Indica cuantas veces se repite el bloque."
            )

    def _validate_one_off(self) -> None:
        """One-off blocks require specific_date."""
        if self.specific_date is None:
            raise ValueError(
                "Un bloque one_off requiere una fecha especifica (specific_date). "
                "Indica el dia exacto de disponibilidad."
            )
