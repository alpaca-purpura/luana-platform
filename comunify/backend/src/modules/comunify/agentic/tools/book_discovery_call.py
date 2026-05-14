"""Comunify AGENTIC tool — `book_discovery_call`.

R23: production_code=True AGENTIC tool. Opus 4.7 EXCLUSIVE.
Story 12 luana-comunify-bootstrap T-tools-4.

Spec sources:
  * 06-tickets.yaml::T-tools-4 acceptance criteria
  * 03-arch-agentic.md § 4.4 (book_discovery_call spec — 4 actions, $0 LLM,
    advisory lock per (creator_id, slot_iso) on confirm, idempotent 60s window)
  * 02-design-agentic.md (Pablo Productividad MX discovery call flow example)
  * 05-guidelines.md § R23 agentic patterns + § 1.6 PII sanitization +
    § 1.2 anti-duplication EXTEND base inventory
  * .claude/rules/tenant-isolation.md (tenant_id NEVER in input schema)
  * .claude/rules/anti-duplication.md (Protocol-based DI mirrors Story 11
    `appointment_reschedule_with_doctor` reference + "EXTEND > REPLACE > NEW"
    cardinal)
  * .claude/rules/copilot-observability.md (best-effort writes — never break turn)

Semantics — 4 actions discriminated by `input.action`:

  list_slots
    - READ-ONLY. Query candidate slots from `scheduler_query` callable
      (Protocol-based DI — extends @luana/core/scheduling.calendar surface
      via caller-supplied source per Story 11 precedent).
    - Filter by existing active bookings for this creator (subtracts occupied
      slots) under `max_concurrent_per_slot` from CreatorScheduleConfig
      (defaults to 1 for discovery calls — 1:1 sales conversation).
    - NO side effects. NO audit_log row.

  confirm_slot
    - Acquires `pg_advisory_lock(hash(creator_id, slot_iso))` via
      `advisory_lock` Protocol (caller-supplied — see Story 11 vitalia
      `advisory_locks.py` reference impl). Atomic guard prevents double-
      booking under concurrency.
    - 60s idempotency window: same (lead_id, creator_id, target_slot) within
      60s returns cached booking_id (matches arch § 4.4 idempotency_via).
    - On AdvisoryLockNotAcquired (race lost) → returns booking_status=
      "advisory_lock_failed" WITHOUT raising — sales_agent re-lists slots.
    - On slot_taken (existing booking found inside lock) → returns
      booking_status="slot_taken".
    - Creates ComunifyDiscoveryCallBookingModel row with
      appointment_type="discovery_call".
    - audit_log discovery_call_booked event (best-effort) — sanitized.

  reschedule_existing
    - Atomic: cancel old booking + reserve new slot under fresh advisory lock.
    - Implementation: soft-delete old booking (status="cancelled") + delegate
      new (creator_id, target_slot) reservation. Old booking preserved as
      cancelled — immutable audit trail.
    - If new slot acquisition fails → restore old booking status (no data
      loss — atomic rollback).
    - audit_log discovery_call_rescheduled (old_slot_iso + new_slot_iso).

  cancel
    - Soft-delete booking (status → "cancelled"). Slot freed for re-listing.
    - audit_log discovery_call_cancelled.

Tenant isolation (security boundary):
  * tenant_id MUST NEVER appear in input schema — injected from ctx via
    sales_agent/copilot tool dispatcher.
  * BookingRepository + ScheduleConfigRepository receive tenant_id at
    construction (caller wires tenant-scoped instances per
    `.claude/rules/tenant-isolation.md`).

Observability (best-effort per R23 + copilot-observability.md):
  * audit_log_repo + trace_event_repo writes wrapped in try/except + structlog
    warning. Tool turn NEVER breaks on observability failure.
  * PII sanitized via `_scrub_pii` + `_sanitize_payload` BEFORE persist —
    lead phone / email NEVER reach trace store raw. Creator/lead UUIDs surface
    as IDs only (safe identifiers).

Cost: $0 LLM (deterministic SQL + business rules — no LLM call ever).
Latency budget per 03-arch-agentic.md § 4.4:
  list_slots p50 200ms / p99 600ms; confirm_slot p50 300ms / p99 800ms.

Anti-duplication audit (Step 0 GATE pre-write — verified 2026-05-14):
  * grep -rn "book_discovery_call\\|BookDiscoveryCall" /home/chris/luana-platform/
    → only spec docs. NO collision.
  * find -name "book_discovery_call.py" → none.
  * @luana/core/scheduling — NO `luana-core-scheduling` package exists
    (verified via `ls /home/chris/luana-platform/core/`). Q4=A "reuse Story 11
    lift" maps to Story 11 PATTERN (Protocol-based DI deferring concrete to
    caller) — NOT a lift to core/. Story 11 vitalia kept concrete impl in
    vertical-medical module. Comunify follows the same convention: tool
    consumes via Protocol; concrete `discovery_call_booking_repo` +
    `advisory_lock` impls land in a follow-up T-be ticket (no comunify
    booking infrastructure today — verified via
    `ls comunify/backend/src/modules/comunify/infrastructure/models/`).
  * `_SchedulerQueryLike` Protocol mirrors Story 11
    `appointment_reschedule_with_doctor._SchedulerQueryLike` — same shape,
    different namespace (vertical-creator-economy vs vertical-medical).
    LIFT to shared at the THIRD vertical surface (Story 13+).
  * `sanitize_payload` consumed from `luana_core_observability.recording.sanitization`
    (canonical) with lazy-import + truncate-only fallback — NEVER re-implemented
    (`.claude/rules/anti-duplication.md`).
  * `_PII_KEYS` + `_EMAIL_RE` + `_PHONE_RE` + `_scrub_pii` inline at N=4
    inside `comunify/agentic/tools/` (qualify + link + nurture + here). Per
    `tools/__init__.py` deferred-lift note, the LIFT to
    `comunify/agentic/tools/_pii_scrub.py` is now overdue. Documented as
    forward debt — out of scope here (would create 4 sibling diffs +
    increase blast radius for a small refactor; assigned to next refactor
    ticket). The IMPL-LOG notes this explicitly.

Anti-duplication of `ForbiddenToolContextError` (defense-in-depth — currently
no forbidden contexts for `book_discovery_call` per arch § 4.5, but symbol
exposed for symmetry + future-proofing). Re-export from shared
`_exceptions.py` per the LIFT applied in T-tools-3.
"""

from __future__ import annotations

import asyncio
import hashlib
import re
import struct
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any, Literal, Protocol, runtime_checkable

import structlog
from pydantic import BaseModel, ConfigDict, Field

from src.modules.comunify.agentic.tools._exceptions import (
    ForbiddenToolContextError,  # noqa: F401 — re-exported for symmetry
)

logger = structlog.get_logger(__name__)


# ─── Constants ─────────────────────────────────────────────────────────────


# 03-arch-agentic.md § 4.5 — no forbidden contexts for book_discovery_call
# (lead may book at any stage). Frozenset kept empty for symmetry + future-
# proofing. Tool guard fires only when caller passes a context label that
# matches a future-added entry.
_FORBIDDEN_CONTEXTS: frozenset[str] = frozenset()

# Idempotency window — second identical call within 60s returns cached
# booking_id (per 03-arch-agentic.md § 4.4 idempotent_via=
# f"{action}:{lead_id}:{creator_id}:{target_slot}:60s").
_IDEMPOTENCY_WINDOW = timedelta(seconds=60)

# Active booking statuses that count as "slot occupied" (mirror vitalia
# BookingRepository pattern). Cancelled bookings free the slot.
_ACTIVE_BOOKING_STATUSES: frozenset[str] = frozenset(
    {
        "pending_confirmation",
        "confirmed",
    }
)

# Audit severity for routine discovery-call lifecycle events.
_AUDIT_SEVERITY_INFO: str = "info"

# Default appointment_type for this vertical-creator-economy surface.
_APPOINTMENT_TYPE: Literal["discovery_call"] = "discovery_call"

# Default max_concurrent_per_slot when CreatorScheduleConfig is absent —
# 1:1 conversation by convention (sales-agent discovery call).
_DEFAULT_MAX_CONCURRENT: int = 1

# Default list window when caller omits preferred_window.
_DEFAULT_WINDOW_DAYS: int = 7

# PII keys scrubbed defensively at tool boundary BEFORE sanitize_payload runs.
# Defense-in-depth — never trust the fallback sanitizer (truncate-only).
_PII_KEYS: frozenset[str] = frozenset(
    {
        "email",
        "email_address",
        "phone",
        "phone_number",
        "mobile",
        "telephone",
        "address",
        "street",
        "ssn",
        "national_id",
        "tax_id",
        "dob",
        "date_of_birth",
        "ip",
        "ip_address",
        "account_number",
        "card_number",
        "iban",
    }
)

# Regex fallback for inline PII in free-text values (email + phone basic).
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(r"(?:\+?\d[\s\-\(\)]?){7,}\d")


# ─── In-process idempotency cache (60s replay window) ──────────────────────
#
# Mirrors `nurture_via_authority_content._NURTURE_CACHE` shape. Process-local
# (cleared on restart) — production scale-out should replace with the
# canonical Redis-backed `luana-core-idempotency` store (T-be follow-up).
# For now, in-process matches the spec's "60s window" semantics in a single
# worker.

_BOOKING_CACHE: dict[tuple[uuid.UUID, uuid.UUID, uuid.UUID, str], tuple[datetime, "BookDiscoveryCallOutputV1"]] = {}


def _idempotency_key(
    *,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    creator_id: uuid.UUID,
    target_slot: datetime,
    action: str,
) -> tuple[uuid.UUID, uuid.UUID, uuid.UUID, str]:
    """Compose cache key — (tenant, lead, creator, action:slot_ts)."""
    slot_ts = int(target_slot.timestamp())
    return (tenant_id, lead_id, creator_id, f"{action}:{slot_ts}")


def _cached_result(key: tuple[Any, ...], now: datetime) -> "BookDiscoveryCallOutputV1 | None":
    """Return cached output if within window, else evict + None."""
    entry = _BOOKING_CACHE.get(key)
    if entry is None:
        return None
    cached_at, cached_output = entry
    if now - cached_at > _IDEMPOTENCY_WINDOW:
        _BOOKING_CACHE.pop(key, None)
        return None
    return cached_output


def _store_cached_result(
    key: tuple[Any, ...],
    output: "BookDiscoveryCallOutputV1",
    *,
    now: datetime,
) -> None:
    """Insert/refresh cache entry (60s window)."""
    _BOOKING_CACHE[key] = (now, output)


# ─── Advisory lock key derivation (mirror vitalia advisory_locks.py) ───────


def _slot_lock_key(*, creator_id: uuid.UUID, slot_iso: datetime) -> int:
    """Deterministic Postgres advisory lock key for (creator_id, slot_iso).

    Returns a signed 64-bit integer within Postgres bigint range [-2^63, 2^63-1].
    Combines creator_id bytes + UTC slot timestamp bytes for collision resistance.

    Mirror of `vitalia/infrastructure/advisory_locks._slot_lock_key` — same
    algorithm, different namespace (creator vs doctor). NO lift required
    until 3rd vertical needs this (Story 13+).
    """
    slot_ts = int(slot_iso.timestamp())
    raw = creator_id.bytes + struct.pack(">q", slot_ts)
    digest = hashlib.sha256(raw).digest()
    unsigned = int.from_bytes(digest[:8], byteorder="big")
    signed = unsigned if unsigned < 2**63 else unsigned - 2**64
    return signed


# ─── Pydantic schemas (V1 — frozen, schema_version cement) ─────────────────


class WindowSpec(BaseModel):
    """Preferred query window for list_slots — start date + days span."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    start: date = Field(..., description="Window start date (tenant TZ — caller converts to UTC).")
    days: int = Field(default=_DEFAULT_WINDOW_DAYS, ge=1, le=60, description="Span in days (max 60).")


_Action = Literal["list_slots", "confirm_slot", "reschedule_existing", "cancel"]


class BookDiscoveryCallInputV1(BaseModel):
    """Input schema — tenant_id intentionally OMITTED (ctx injection).

    Per 03-arch-agentic.md § 4.4 + .claude/rules/tenant-isolation.md:
    > tenant_id NOT in schema — injected via tool dispatcher from ctx
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    schema_version: Literal[1] = Field(
        default=1,
        description="Schema version cement — bump triggers breaking-change review.",
    )
    action: _Action = Field(
        ...,
        description="Discriminator for the 4-action handler.",
    )
    lead_id: uuid.UUID = Field(
        ...,
        description="Lead UUID who will attend the discovery call.",
    )
    creator_id: uuid.UUID | None = Field(
        default=None,
        description=(
            "Creator UUID (calendar owner). Spec § 4.4 names this field `doctor_id` "
            "(legacy from vitalia) — comunify uses `creator_id` for vertical-creator-"
            "economy semantic alignment. Required for list_slots / confirm_slot / "
            "reschedule_existing. Optional for cancel (resolved from booking)."
        ),
    )
    booking_id: uuid.UUID | None = Field(
        default=None,
        description="Booking UUID — required for reschedule_existing / cancel.",
    )
    preferred_window: WindowSpec | None = Field(
        default=None,
        description="Window for list_slots. Defaults to today + 7 days when omitted.",
    )
    target_slot: datetime | None = Field(
        default=None,
        description="Target slot — required for confirm_slot / reschedule_existing.",
    )


class BookDiscoveryCallOutputV1(BaseModel):
    """Result of book_discovery_call tool invocation.

    Per 03-arch-agentic.md § 4.4 output schema.
    """

    model_config = ConfigDict(frozen=True)

    schema_version: Literal[1] = Field(default=1, description="Schema version cement.")
    available_slots: list[datetime] = Field(
        default_factory=list,
        description="Populated only on action=list_slots.",
    )
    booking_id: uuid.UUID | None = Field(
        default=None,
        description="Booking UUID — populated on confirm/reschedule/cancel success.",
    )
    booking_status: str | None = Field(
        default=None,
        description=(
            "'pending_confirmation' / 'confirmed' / 'cancelled' / 'slot_taken' / "
            "'advisory_lock_failed' / 'booking_not_found' / 'missing_required_fields'."
        ),
    )
    meeting_url: str | None = Field(
        default=None,
        description="Meeting link (Zoom/Meet/etc.) — populated by downstream meeting provisioner.",
    )
    appointment_type: Literal["discovery_call"] = Field(
        default=_APPOINTMENT_TYPE,
        description="Always 'discovery_call' for this vertical-creator-economy tool.",
    )
    next_session_at: datetime | None = Field(
        default=None,
        description="Mirror of `target_slot` on confirm/reschedule — convenience field for callers.",
    )
    is_idempotent_hit: bool = Field(
        default=False,
        description="True iff response was returned from the 60s idempotency cache.",
    )


# ─── Domain event (inline today — lift to domain/events.py at N=2) ─────────


@dataclass(frozen=True)
class DiscoveryCallBookedV1:
    """Domain event — emitted when a discovery call is booked.

    Downstream subscriber (T-workflows-2 CohortEnrollmentWorkflow — state
    `discovery_call_scheduled`) wires later. Lift to
    `modules/comunify/domain/events.py` when 2nd event type appears
    (per `LeadQualifiedV1` inline pattern in `qualify_for_cohort.py`).
    """

    schema_version: Literal[1]
    tenant_id: uuid.UUID
    lead_id: uuid.UUID
    creator_id: uuid.UUID
    booking_id: uuid.UUID
    slot_iso: datetime
    booked_at: datetime


@dataclass(frozen=True)
class DiscoveryCallRescheduledV1:
    """Domain event — emitted when a discovery call is rescheduled.

    Carries old_booking_id ↔ new_booking_id for audit trail. Lift to
    `modules/comunify/domain/events.py` at N=2 alongside DiscoveryCallBookedV1.
    """

    schema_version: Literal[1]
    tenant_id: uuid.UUID
    lead_id: uuid.UUID
    creator_id: uuid.UUID
    old_booking_id: uuid.UUID
    new_booking_id: uuid.UUID
    old_slot_iso: datetime
    new_slot_iso: datetime
    rescheduled_at: datetime


@dataclass(frozen=True)
class DiscoveryCallCancelledV1:
    """Domain event — emitted when a discovery call is cancelled."""

    schema_version: Literal[1]
    tenant_id: uuid.UUID
    lead_id: uuid.UUID
    booking_id: uuid.UUID
    cancelled_at: datetime


# ─── Protocols (DI — decouple from concrete repos / infrastructure) ────────
#
# Protocol-based DI mirrors Story 11 vitalia `appointment_reschedule_with_doctor`
# pattern. Concrete repos + advisory_lock impls land in a follow-up T-be
# ticket (no comunify booking infrastructure today). Caller wires production
# adapters; tests wire in-memory fakes.


@runtime_checkable
class _DiscoveryCallBookingLike(Protocol):
    """Minimal surface a booking row must expose (mirrors vitalia
    `VitaliaBookingModel`)."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    lead_id: uuid.UUID
    creator_id: uuid.UUID
    slot_iso: datetime
    status: str
    meeting_url: str | None


@runtime_checkable
class _DiscoveryCallBookingRepoLike(Protocol):
    """Minimal surface consumed from a future ComunifyDiscoveryCallBookingRepository.

    Tenant scoping is bound at repo construction — every method filters by
    `self._tenant_id` natively (per `tenant-isolation.md`).
    """

    async def get_by_id(self, booking_id: uuid.UUID) -> _DiscoveryCallBookingLike | None: ...

    async def find_by_creator_slot(
        self,
        creator_id: uuid.UUID,
        slot_iso: datetime,
    ) -> _DiscoveryCallBookingLike | None: ...

    async def list_active_by_creator(
        self,
        creator_id: uuid.UUID,
    ) -> list[_DiscoveryCallBookingLike]: ...

    async def save(self, booking: _DiscoveryCallBookingLike) -> None: ...


@runtime_checkable
class _AdvisoryLockLike(Protocol):
    """Postgres advisory lock pair — mirrors Story 11 vitalia advisory_locks
    surface. Caller supplies concrete (production = SQL adapter; tests = fake).

    The Protocol takes the derived integer key (computed by `_slot_lock_key`)
    so the tool can be tested without a real session.
    """

    async def acquire(self, *, lock_key: int) -> None:
        """Blocking acquire. Returns when lock is held (or raises on error)."""
        ...

    async def try_acquire(self, *, lock_key: int) -> bool:
        """Non-blocking attempt. Returns True iff acquired."""
        ...

    async def release(self, *, lock_key: int) -> None:
        """Release a previously acquired lock. No-op if not held."""
        ...


@runtime_checkable
class _ScheduleConfigLike(Protocol):
    """Optional creator-level schedule config (max_concurrent_per_slot etc.).

    May be absent — tool defaults to `_DEFAULT_MAX_CONCURRENT = 1` when
    `schedule_config_repo` is None or the creator has no config row.
    """

    max_concurrent_per_slot: int


@runtime_checkable
class _ScheduleConfigRepoLike(Protocol):
    """Minimal surface consumed from a future CreatorScheduleConfigRepository."""

    async def get_by_creator_id(self, creator_id: uuid.UUID) -> _ScheduleConfigLike | None: ...


@runtime_checkable
class _SchedulerQueryLike(Protocol):
    """Calendar candidate slot enumeration — extends @luana/core scheduling
    via caller-supplied source.

    Returns naive list of candidate datetimes within the requested window.
    Filtering by occupancy is done downstream by this tool. Caller supplies
    a deterministic source (e.g. weekday 9-17 generator OR external
    @luana/core scheduling adapter once formalized).

    Mirror of Story 11 vitalia `appointment_reschedule_with_doctor.
    _SchedulerQueryLike`. Same shape, different namespace — LIFT to shared
    at 3rd vertical surface (Story 13+).
    """

    def __call__(self, creator_id: uuid.UUID, start: datetime, days: int) -> list[datetime]: ...


@runtime_checkable
class _AuditLogRepoLike(Protocol):
    """Minimal surface consumed from CommunityAuditLogRepository (T-be-3)."""

    async def save(self, audit_event: Any) -> None: ...


@runtime_checkable
class _TraceEventRepoLike(Protocol):
    """Mirror of BaseTraceEventRepoProtocol — see luana_core_observability."""

    def add(
        self,
        *,
        tenant_id: uuid.UUID,
        turn_id: uuid.UUID,
        span_id: uuid.UUID,
        event_type: str,
        name: str | None = ...,
        data: dict[str, Any] | None = ...,
        duration_ms: int | None = ...,
        status: str = ...,
        **agent_specific: Any,
    ) -> Any: ...


@runtime_checkable
class _EventPublisherLike(Protocol):
    """Pluggable event publisher (in-process bus / outbox / Kafka — all OK)."""

    async def emit(self, event: Any) -> None: ...


@runtime_checkable
class _MeetingProvisionerLike(Protocol):
    """Optional meeting-link generator (Zoom / Google Meet / etc.).

    When supplied, called after slot acquisition to mint a `meeting_url`.
    Tool best-effort: provisioner failure → meeting_url=None but booking
    persists (creator can add link manually). Provisioner runs OUTSIDE the
    advisory lock to avoid holding the lock during slow external API.
    """

    async def provision(
        self,
        *,
        tenant_id: uuid.UUID,
        creator_id: uuid.UUID,
        slot_iso: datetime,
        lead_id: uuid.UUID,
    ) -> str | None: ...


# ─── sanitize_payload — lazy with fallback (mirror compliance_event_service.py) ──


def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitize payload via luana_core_observability or truncate-only fallback.

    Mirrors `qualify_for_cohort._sanitize_payload` + `link_to_community`
    counterpart. Best-effort. Lift to shared at next refactor ticket (N=4
    flagged in `tools/__init__.py`).
    """
    try:
        from luana_core_observability.recording.sanitization import (
            sanitize_payload as _sp,  # type: ignore[import-not-found]
        )

        return _sp(payload)  # type: ignore[no-any-return]
    except ImportError:
        _MAX_LEN = 4000
        return {k: (v[:_MAX_LEN] if isinstance(v, str) and len(v) > _MAX_LEN else v) for k, v in payload.items()}


# ─── PII boundary scrub (defense-in-depth — N=4 inline) ────────────────────
#
# `_PII_KEYS` + `_EMAIL_RE` + `_PHONE_RE` + `_scrub_pii` are now duplicated
# across 4 tool files (qualify + link + nurture + book_discovery_call). Per
# `tools/__init__.py` deferred-lift note, the LIFT to
# `comunify/agentic/tools/_pii_scrub.py` is overdue. Documented as forward
# debt in T-tools-4-impl-log.md — out of scope here.


def _scrub_pii(payload: dict[str, Any]) -> dict[str, Any]:
    """Remove known PII keys + redact inline email/phone in remaining strings.

    Applied BEFORE `_sanitize_payload` to guarantee PII does not leak even when
    the observability sanitize fallback is in effect.
    """
    out: dict[str, Any] = {}
    for k, v in payload.items():
        if k.lower() in _PII_KEYS:
            out[k] = "[REDACTED]"
            continue
        if isinstance(v, str):
            v = _EMAIL_RE.sub("[REDACTED_EMAIL]", v)
            v = _PHONE_RE.sub("[REDACTED_PHONE]", v)
            out[k] = v
        elif isinstance(v, dict):
            out[k] = _scrub_pii(v)
        else:
            out[k] = v
    return out


# ─── Best-effort observability helpers ─────────────────────────────────────


async def _emit_trace_event_best_effort(
    trace_event_repo: _TraceEventRepoLike | None,
    *,
    tenant_id: uuid.UUID,
    turn_id: uuid.UUID | None,
    span_id: uuid.UUID | None,
    event_type: str,
    payload: dict[str, Any],
    status: str,
    duration_ms: int | None = None,
) -> None:
    """Best-effort trace_event emission. NEVER breaks tool turn (R23).

    Skips silently if repo not supplied or correlation IDs missing.
    Logs warning on persistence failure.
    """
    if trace_event_repo is None or turn_id is None or span_id is None:
        return

    try:
        scrubbed = _scrub_pii(payload)
        sanitized = _sanitize_payload(scrubbed)
        trace_event_repo.add(
            tenant_id=tenant_id,
            turn_id=turn_id,
            span_id=span_id,
            event_type=event_type,
            name="book_discovery_call",
            data=sanitized,
            duration_ms=duration_ms,
            status=status,
        )
    except Exception as exc:  # noqa: BLE001 — best-effort observability
        logger.warning(
            "book_discovery_call.trace_event_persist_failed",
            exc=str(exc),
            tenant_id=str(tenant_id),
            event_type=event_type,
        )


async def _append_audit_log_best_effort(
    audit_log_repo: _AuditLogRepoLike | None,
    *,
    tenant_id: uuid.UUID,
    event_type: str,
    severity: str,
    lead_id: uuid.UUID,
    booking_id: uuid.UUID | None,
    payload: dict[str, Any],
) -> None:
    """Append audit event. Best-effort — NEVER breaks turn (R23).

    Per `.claude/rules/copilot-observability.md`: PII sanitized via
    `_scrub_pii` + `_sanitize_payload` BEFORE persist.
    """
    if audit_log_repo is None:
        return
    try:
        # Late import: ComunifyCommunityAuditLogModel — keeps tool importable
        # in stripped test envs (per backend-ddd.md schema-mirror exception).
        from src.modules.comunify.infrastructure.models.community_audit_log_model import (  # noqa: PLC0415
            ComunifyCommunityAuditLogModel,
        )

        scrubbed = _scrub_pii(payload)
        sanitized = _sanitize_payload(scrubbed)
        audit_event = ComunifyCommunityAuditLogModel(
            tenant_id=tenant_id,
            event_type=event_type,
            severity=severity,
            lead_id=lead_id,
            booking_id=booking_id,
            payload_redacted=sanitized,
            actor_type="sales_agent",
        )
        await audit_log_repo.save(audit_event)
    except Exception as exc:  # noqa: BLE001 — best-effort observability
        logger.warning(
            "book_discovery_call.audit_log_persist_failed",
            exc=str(exc),
            event_type=event_type,
            tenant_id=str(tenant_id),
        )


async def _emit_event_best_effort(
    event_publisher: _EventPublisherLike | None,
    *,
    event: Any,
) -> None:
    """Best-effort domain event publish — NEVER raises."""
    if event_publisher is None:
        return
    try:
        await event_publisher.emit(event)
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "book_discovery_call.event_emit_failed",
            exc=str(exc),
            event_type=type(event).__name__,
        )


# ─── Domain model factory (lazy import — avoid coupling at module-load) ────


def _build_booking_model(
    *,
    booking_id: uuid.UUID,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    creator_id: uuid.UUID,
    slot_iso: datetime,
    status: str,
    meeting_url: str | None,
    now: datetime,
) -> Any:
    """Construct a ComunifyDiscoveryCallBookingModel row. Lazy import — keeps
    the tool importable in stripped test envs (per backend-ddd.md schema-mirror
    exception).

    The concrete model lands in a follow-up T-be ticket (no comunify booking
    infrastructure today). For tests, callers wire `_FakeBookingRepo` whose
    `.save(model)` accepts any object with the `_DiscoveryCallBookingLike`
    structural shape — the late import never fires.
    """
    from src.modules.comunify.infrastructure.models.discovery_call_booking_model import (  # noqa: PLC0415
        ComunifyDiscoveryCallBookingModel,
    )

    return ComunifyDiscoveryCallBookingModel(
        id=booking_id,
        tenant_id=tenant_id,
        lead_id=lead_id,
        creator_id=creator_id,
        slot_iso=slot_iso,
        appointment_type=_APPOINTMENT_TYPE,
        status=status,
        meeting_url=meeting_url,
        created_at=now,
        updated_at=now,
    )


# ─── Helper: list active bookings for a creator ────────────────────────────


async def _list_active_creator_bookings(
    booking_repo: _DiscoveryCallBookingRepoLike,
    *,
    creator_id: uuid.UUID,
) -> list[_DiscoveryCallBookingLike]:
    """Return only active (non-cancelled, non-deleted) bookings for a creator."""
    rows = await booking_repo.list_active_by_creator(creator_id)
    # Filter defensively — repo may return all if implementation pre-filters
    # by another status. We re-filter against the canonical active set.
    return [r for r in rows if getattr(r, "status", None) in _ACTIVE_BOOKING_STATUSES]


# ─── Action handlers ─────────────────────────────────────────────────────


async def _handle_list_slots(
    input: BookDiscoveryCallInputV1,
    *,
    tenant_id: uuid.UUID,
    booking_repo: _DiscoveryCallBookingRepoLike,
    schedule_config_repo: _ScheduleConfigRepoLike | None,
    scheduler_query: _SchedulerQueryLike,
    trace_event_repo: _TraceEventRepoLike | None,
    turn_id: uuid.UUID | None,
    span_id: uuid.UUID | None,
) -> BookDiscoveryCallOutputV1:
    """list_slots: READ-ONLY. Filter candidate slots by occupancy under
    `max_concurrent_per_slot` cap."""
    started = datetime.now(tz=timezone.utc)

    # Validation — creator_id required for list_slots.
    if input.creator_id is None:
        return BookDiscoveryCallOutputV1(booking_status="missing_required_fields")

    # Resolve window — default today + 7 days when not provided.
    if input.preferred_window is not None:
        window_start_dt = datetime(
            year=input.preferred_window.start.year,
            month=input.preferred_window.start.month,
            day=input.preferred_window.start.day,
            tzinfo=timezone.utc,
        )
        window_days = input.preferred_window.days
    else:
        now = datetime.now(tz=timezone.utc)
        window_start_dt = datetime(year=now.year, month=now.month, day=now.day, tzinfo=timezone.utc)
        window_days = _DEFAULT_WINDOW_DAYS

    # Query candidate slots via @luana/core scheduling-extending callable.
    candidates = scheduler_query(input.creator_id, window_start_dt, window_days)

    # Resolve max_concurrent_per_slot from ScheduleConfig if available.
    max_concurrent = _DEFAULT_MAX_CONCURRENT
    if schedule_config_repo is not None:
        try:
            config = await schedule_config_repo.get_by_creator_id(input.creator_id)
            if config is not None:
                max_concurrent = max(int(getattr(config, "max_concurrent_per_slot", 1) or 1), 1)
        except Exception as exc:  # noqa: BLE001 — config fetch is non-critical
            logger.warning(
                "book_discovery_call.schedule_config_fetch_failed",
                exc=str(exc),
                creator_id=str(input.creator_id),
            )

    # Pull active bookings for this creator and tally per-slot occupancy.
    active_bookings = await _list_active_creator_bookings(booking_repo, creator_id=input.creator_id)
    occupancy: dict[datetime, int] = {}
    for bk in active_bookings:
        occupancy[bk.slot_iso] = occupancy.get(bk.slot_iso, 0) + 1

    available: list[datetime] = [slot for slot in candidates if occupancy.get(slot, 0) < max_concurrent]

    duration_ms = int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000)
    await _emit_trace_event_best_effort(
        trace_event_repo,
        tenant_id=tenant_id,
        turn_id=turn_id,
        span_id=span_id,
        event_type="tool.book_discovery_call.list_slots",
        payload={
            "creator_id": str(input.creator_id),
            "lead_id": str(input.lead_id),
            "candidates_count": len(candidates),
            "available_count": len(available),
            "max_concurrent": max_concurrent,
        },
        status="ok",
        duration_ms=duration_ms,
    )

    return BookDiscoveryCallOutputV1(available_slots=available)


async def _handle_confirm_slot(
    input: BookDiscoveryCallInputV1,
    *,
    tenant_id: uuid.UUID,
    booking_repo: _DiscoveryCallBookingRepoLike,
    advisory_lock: _AdvisoryLockLike,
    meeting_provisioner: _MeetingProvisionerLike | None,
    audit_log_repo: _AuditLogRepoLike | None,
    event_publisher: _EventPublisherLike | None,
    trace_event_repo: _TraceEventRepoLike | None,
    turn_id: uuid.UUID | None,
    span_id: uuid.UUID | None,
) -> BookDiscoveryCallOutputV1:
    """confirm_slot: advisory-lock guarded slot reservation. Atomic +
    60s idempotent.

    Algorithm (mirror of vitalia BookingService.create_booking):
      1. Validate required fields.
      2. Idempotency cache check — return cached result within 60s.
      3. Try-acquire advisory lock per (creator_id, slot_iso).
         - If NOT acquired → return booking_status="advisory_lock_failed".
      4. Slot availability check UNDER lock — if taken → booking_status="slot_taken".
      5. Create booking model with status="pending_confirmation".
      6. Persist via repo.save().
      7. Release advisory lock (always, in finally).
      8. Provision meeting URL (best-effort, OUTSIDE the lock).
      9. If meeting URL minted → re-save booking with meeting_url + status="confirmed".
      10. Cache result (60s) + audit_log + emit event + trace.
    """
    started = datetime.now(tz=timezone.utc)

    # ── Step 1: Validate ──────────────────────────────────────────────────
    if input.creator_id is None or input.target_slot is None:
        return BookDiscoveryCallOutputV1(booking_status="missing_required_fields")

    # ── Step 2: Idempotency cache check (60s window) ──────────────────────
    cache_key = _idempotency_key(
        tenant_id=tenant_id,
        lead_id=input.lead_id,
        creator_id=input.creator_id,
        target_slot=input.target_slot,
        action="confirm_slot",
    )
    cached = _cached_result(cache_key, started)
    if cached is not None:
        logger.info(
            "book_discovery_call.idempotent_replay",
            tenant_id=str(tenant_id),
            lead_id=str(input.lead_id),
            creator_id=str(input.creator_id),
            target_slot=input.target_slot.isoformat(),
        )
        # Re-emit cached result with is_idempotent_hit=True (frozen Pydantic →
        # copy via model_copy).
        return cached.model_copy(update={"is_idempotent_hit": True})

    # ── Steps 3-7: Advisory lock + atomic reservation ────────────────────
    lock_key = _slot_lock_key(creator_id=input.creator_id, slot_iso=input.target_slot)
    acquired = False
    booking_id: uuid.UUID | None = None
    initial_status = "pending_confirmation"
    try:
        acquired = await advisory_lock.try_acquire(lock_key=lock_key)
        if not acquired:
            # Race lost — another concurrent request holds the lock.
            await _emit_trace_event_best_effort(
                trace_event_repo,
                tenant_id=tenant_id,
                turn_id=turn_id,
                span_id=span_id,
                event_type="tool.book_discovery_call.confirm_slot",
                payload={
                    "creator_id": str(input.creator_id),
                    "lead_id": str(input.lead_id),
                    "slot_iso": input.target_slot.isoformat(),
                    "outcome": "advisory_lock_failed",
                },
                status="error",
                duration_ms=int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000),
            )
            return BookDiscoveryCallOutputV1(booking_status="advisory_lock_failed")

        # ── Step 4: Slot availability check under lock ────────────────────
        existing = await booking_repo.find_by_creator_slot(
            creator_id=input.creator_id,
            slot_iso=input.target_slot,
        )
        if existing is not None and existing.status in _ACTIVE_BOOKING_STATUSES:
            await _emit_trace_event_best_effort(
                trace_event_repo,
                tenant_id=tenant_id,
                turn_id=turn_id,
                span_id=span_id,
                event_type="tool.book_discovery_call.confirm_slot",
                payload={
                    "creator_id": str(input.creator_id),
                    "lead_id": str(input.lead_id),
                    "slot_iso": input.target_slot.isoformat(),
                    "outcome": "slot_taken",
                },
                status="error",
                duration_ms=int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000),
            )
            return BookDiscoveryCallOutputV1(booking_status="slot_taken")

        # ── Step 5-6: Build + persist booking ─────────────────────────────
        booking_id = uuid.uuid4()
        booking = _build_booking_model(
            booking_id=booking_id,
            tenant_id=tenant_id,
            lead_id=input.lead_id,
            creator_id=input.creator_id,
            slot_iso=input.target_slot,
            status=initial_status,
            meeting_url=None,
            now=started,
        )
        await booking_repo.save(booking)

    finally:
        # ── Step 7: Always release lock if acquired ──────────────────────
        if acquired:
            try:
                await advisory_lock.release(lock_key=lock_key)
            except Exception as exc:  # noqa: BLE001 — release failure is non-fatal (session-scoped)
                logger.warning(
                    "book_discovery_call.advisory_lock_release_failed",
                    exc=str(exc),
                    lock_key=lock_key,
                )

    # ── Step 8: Meeting provisioning (OUTSIDE the lock — best-effort) ─────
    meeting_url: str | None = None
    final_status = initial_status
    if meeting_provisioner is not None:
        try:
            meeting_url = await meeting_provisioner.provision(
                tenant_id=tenant_id,
                creator_id=input.creator_id,
                slot_iso=input.target_slot,
                lead_id=input.lead_id,
            )
        except Exception as exc:  # noqa: BLE001 — provisioner failure is non-fatal
            logger.warning(
                "book_discovery_call.meeting_provisioner_failed",
                exc=str(exc),
                tenant_id=str(tenant_id),
            )
            meeting_url = None

    # ── Step 9: Re-save booking with meeting_url + promote to "confirmed" ──
    if meeting_url:
        try:
            # Re-fetch and update — repo.save is the only mutation surface.
            assert booking_id is not None  # for type checker
            existing_row = await booking_repo.get_by_id(booking_id)
            if existing_row is not None:
                existing_row.meeting_url = meeting_url
                existing_row.status = "confirmed"
                await booking_repo.save(existing_row)
                final_status = "confirmed"
        except Exception as exc:  # noqa: BLE001 — meeting attach is non-fatal
            logger.warning(
                "book_discovery_call.meeting_url_attach_failed",
                exc=str(exc),
                booking_id=str(booking_id) if booking_id else None,
            )

    # ── Step 10: Audit log + event emit + cache + trace ───────────────────
    assert booking_id is not None  # invariant: only reached on successful persist
    result = BookDiscoveryCallOutputV1(
        booking_id=booking_id,
        booking_status=final_status,
        meeting_url=meeting_url,
        next_session_at=input.target_slot,
        is_idempotent_hit=False,
    )

    await _append_audit_log_best_effort(
        audit_log_repo,
        tenant_id=tenant_id,
        event_type="discovery_call_booked",
        severity=_AUDIT_SEVERITY_INFO,
        lead_id=input.lead_id,
        booking_id=booking_id,
        payload={
            "creator_id": str(input.creator_id),
            "slot_iso": input.target_slot.isoformat(),
            "appointment_type": _APPOINTMENT_TYPE,
            "status": final_status,
            "meeting_url_minted": meeting_url is not None,
        },
    )

    await _emit_event_best_effort(
        event_publisher,
        event=DiscoveryCallBookedV1(
            schema_version=1,
            tenant_id=tenant_id,
            lead_id=input.lead_id,
            creator_id=input.creator_id,
            booking_id=booking_id,
            slot_iso=input.target_slot,
            booked_at=started,
        ),
    )

    _store_cached_result(cache_key, result, now=started)

    duration_ms = int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000)
    await _emit_trace_event_best_effort(
        trace_event_repo,
        tenant_id=tenant_id,
        turn_id=turn_id,
        span_id=span_id,
        event_type="tool.book_discovery_call.confirm_slot",
        payload={
            "creator_id": str(input.creator_id),
            "lead_id": str(input.lead_id),
            "booking_id": str(booking_id),
            "slot_iso": input.target_slot.isoformat(),
            "status": final_status,
            "meeting_url_minted": meeting_url is not None,
        },
        status="ok",
        duration_ms=duration_ms,
    )

    return result


async def _handle_reschedule_existing(
    input: BookDiscoveryCallInputV1,
    *,
    tenant_id: uuid.UUID,
    booking_repo: _DiscoveryCallBookingRepoLike,
    advisory_lock: _AdvisoryLockLike,
    meeting_provisioner: _MeetingProvisionerLike | None,
    audit_log_repo: _AuditLogRepoLike | None,
    event_publisher: _EventPublisherLike | None,
    trace_event_repo: _TraceEventRepoLike | None,
    turn_id: uuid.UUID | None,
    span_id: uuid.UUID | None,
) -> BookDiscoveryCallOutputV1:
    """reschedule_existing: release old slot + reserve new slot atomically.

    Old booking is soft-cancelled (immutable audit trail). New booking is
    created under fresh advisory lock — if acquisition fails, restore old
    booking status (no data loss).
    """
    started = datetime.now(tz=timezone.utc)

    # ── Validate required fields ──────────────────────────────────────────
    if input.booking_id is None or input.target_slot is None or input.creator_id is None:
        return BookDiscoveryCallOutputV1(booking_status="missing_required_fields")

    existing = await booking_repo.get_by_id(input.booking_id)
    if existing is None:
        return BookDiscoveryCallOutputV1(booking_status="booking_not_found")

    old_slot = existing.slot_iso
    old_status = existing.status

    # ── Step 1: Cancel old booking ────────────────────────────────────────
    existing.status = "cancelled"
    await booking_repo.save(existing)

    # ── Step 2: Reserve new slot under fresh advisory lock ────────────────
    new_lock_key = _slot_lock_key(creator_id=input.creator_id, slot_iso=input.target_slot)
    acquired = False
    new_booking_id: uuid.UUID | None = None
    new_status = "pending_confirmation"
    try:
        acquired = await advisory_lock.try_acquire(lock_key=new_lock_key)
        if not acquired:
            # Race lost on new slot — restore old booking.
            existing.status = old_status
            await booking_repo.save(existing)
            await _emit_trace_event_best_effort(
                trace_event_repo,
                tenant_id=tenant_id,
                turn_id=turn_id,
                span_id=span_id,
                event_type="tool.book_discovery_call.reschedule_existing",
                payload={
                    "booking_id": str(input.booking_id),
                    "creator_id": str(input.creator_id),
                    "new_slot_iso": input.target_slot.isoformat(),
                    "outcome": "advisory_lock_failed",
                },
                status="error",
                duration_ms=int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000),
            )
            return BookDiscoveryCallOutputV1(booking_status="advisory_lock_failed")

        # Check new slot occupancy under lock.
        conflict = await booking_repo.find_by_creator_slot(
            creator_id=input.creator_id,
            slot_iso=input.target_slot,
        )
        if conflict is not None and conflict.status in _ACTIVE_BOOKING_STATUSES:
            # New slot taken — restore old booking.
            existing.status = old_status
            await booking_repo.save(existing)
            await _emit_trace_event_best_effort(
                trace_event_repo,
                tenant_id=tenant_id,
                turn_id=turn_id,
                span_id=span_id,
                event_type="tool.book_discovery_call.reschedule_existing",
                payload={
                    "booking_id": str(input.booking_id),
                    "creator_id": str(input.creator_id),
                    "new_slot_iso": input.target_slot.isoformat(),
                    "outcome": "slot_taken",
                },
                status="error",
                duration_ms=int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000),
            )
            return BookDiscoveryCallOutputV1(booking_status="slot_taken")

        # Persist new booking row.
        new_booking_id = uuid.uuid4()
        new_booking = _build_booking_model(
            booking_id=new_booking_id,
            tenant_id=tenant_id,
            lead_id=existing.lead_id,
            creator_id=input.creator_id,
            slot_iso=input.target_slot,
            status=new_status,
            meeting_url=None,
            now=started,
        )
        await booking_repo.save(new_booking)

    finally:
        if acquired:
            try:
                await advisory_lock.release(lock_key=new_lock_key)
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "book_discovery_call.advisory_lock_release_failed",
                    exc=str(exc),
                    lock_key=new_lock_key,
                )

    # ── Step 3: Meeting provisioning (OUTSIDE lock) ───────────────────────
    meeting_url: str | None = None
    final_status = new_status
    if meeting_provisioner is not None:
        try:
            meeting_url = await meeting_provisioner.provision(
                tenant_id=tenant_id,
                creator_id=input.creator_id,
                slot_iso=input.target_slot,
                lead_id=existing.lead_id,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "book_discovery_call.meeting_provisioner_failed",
                exc=str(exc),
                tenant_id=str(tenant_id),
            )

    if meeting_url:
        try:
            assert new_booking_id is not None
            row = await booking_repo.get_by_id(new_booking_id)
            if row is not None:
                row.meeting_url = meeting_url
                row.status = "confirmed"
                await booking_repo.save(row)
                final_status = "confirmed"
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "book_discovery_call.meeting_url_attach_failed",
                exc=str(exc),
            )

    # ── Step 4: Audit + event + trace ─────────────────────────────────────
    assert new_booking_id is not None
    await _append_audit_log_best_effort(
        audit_log_repo,
        tenant_id=tenant_id,
        event_type="discovery_call_rescheduled",
        severity=_AUDIT_SEVERITY_INFO,
        lead_id=existing.lead_id,
        booking_id=new_booking_id,
        payload={
            "creator_id": str(input.creator_id),
            "old_booking_id": str(input.booking_id),
            "old_slot_iso": old_slot.isoformat(),
            "new_slot_iso": input.target_slot.isoformat(),
            "old_status": old_status,
            "new_status": final_status,
        },
    )

    await _emit_event_best_effort(
        event_publisher,
        event=DiscoveryCallRescheduledV1(
            schema_version=1,
            tenant_id=tenant_id,
            lead_id=existing.lead_id,
            creator_id=input.creator_id,
            old_booking_id=input.booking_id,
            new_booking_id=new_booking_id,
            old_slot_iso=old_slot,
            new_slot_iso=input.target_slot,
            rescheduled_at=started,
        ),
    )

    duration_ms = int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000)
    await _emit_trace_event_best_effort(
        trace_event_repo,
        tenant_id=tenant_id,
        turn_id=turn_id,
        span_id=span_id,
        event_type="tool.book_discovery_call.reschedule_existing",
        payload={
            "old_booking_id": str(input.booking_id),
            "new_booking_id": str(new_booking_id),
            "creator_id": str(input.creator_id),
            "lead_id": str(existing.lead_id),
            "old_slot_iso": old_slot.isoformat(),
            "new_slot_iso": input.target_slot.isoformat(),
            "status": final_status,
        },
        status="ok",
        duration_ms=duration_ms,
    )

    return BookDiscoveryCallOutputV1(
        booking_id=new_booking_id,
        booking_status=final_status,
        meeting_url=meeting_url,
        next_session_at=input.target_slot,
        is_idempotent_hit=False,
    )


async def _handle_cancel(
    input: BookDiscoveryCallInputV1,
    *,
    tenant_id: uuid.UUID,
    booking_repo: _DiscoveryCallBookingRepoLike,
    audit_log_repo: _AuditLogRepoLike | None,
    event_publisher: _EventPublisherLike | None,
    trace_event_repo: _TraceEventRepoLike | None,
    turn_id: uuid.UUID | None,
    span_id: uuid.UUID | None,
) -> BookDiscoveryCallOutputV1:
    """cancel: soft-cancel booking + audit_log."""
    started = datetime.now(tz=timezone.utc)

    if input.booking_id is None:
        return BookDiscoveryCallOutputV1(booking_status="missing_required_fields")

    existing = await booking_repo.get_by_id(input.booking_id)
    if existing is None:
        return BookDiscoveryCallOutputV1(booking_status="booking_not_found")

    existing.status = "cancelled"
    await booking_repo.save(existing)

    await _append_audit_log_best_effort(
        audit_log_repo,
        tenant_id=tenant_id,
        event_type="discovery_call_cancelled",
        severity=_AUDIT_SEVERITY_INFO,
        lead_id=existing.lead_id,
        booking_id=input.booking_id,
        payload={
            "creator_id": str(existing.creator_id),
            "slot_iso": existing.slot_iso.isoformat(),
        },
    )

    await _emit_event_best_effort(
        event_publisher,
        event=DiscoveryCallCancelledV1(
            schema_version=1,
            tenant_id=tenant_id,
            lead_id=existing.lead_id,
            booking_id=input.booking_id,
            cancelled_at=started,
        ),
    )

    duration_ms = int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000)
    await _emit_trace_event_best_effort(
        trace_event_repo,
        tenant_id=tenant_id,
        turn_id=turn_id,
        span_id=span_id,
        event_type="tool.book_discovery_call.cancel",
        payload={
            "booking_id": str(input.booking_id),
            "creator_id": str(existing.creator_id),
            "lead_id": str(existing.lead_id),
        },
        status="ok",
        duration_ms=duration_ms,
    )

    return BookDiscoveryCallOutputV1(
        booking_id=input.booking_id,
        booking_status="cancelled",
    )


# ─── Handler (top-level dispatcher) ────────────────────────────────────────


async def book_discovery_call(
    input: BookDiscoveryCallInputV1,
    *,
    tenant_id: uuid.UUID,
    booking_repo: _DiscoveryCallBookingRepoLike,
    advisory_lock: _AdvisoryLockLike,
    scheduler_query: _SchedulerQueryLike,
    schedule_config_repo: _ScheduleConfigRepoLike | None = None,
    meeting_provisioner: _MeetingProvisionerLike | None = None,
    audit_log_repo: _AuditLogRepoLike | None = None,
    event_publisher: _EventPublisherLike | None = None,
    trace_event_repo: _TraceEventRepoLike | None = None,
    turn_id: uuid.UUID | None = None,
    span_id: uuid.UUID | None = None,
    context: str | None = None,
) -> BookDiscoveryCallOutputV1:
    """Book / list / reschedule / cancel a vertical-creator-economy discovery call.

    See module docstring for full semantics + spec references.

    Parameters
    ----------
    input
        Pydantic input — `tenant_id` NEVER appears here (security boundary).
    tenant_id
        Ctx-injected by sales_agent/copilot tool dispatcher.
    booking_repo
        Tenant-scoped ComunifyDiscoveryCallBookingRepository (T-be follow-up).
    advisory_lock
        Postgres advisory-lock adapter — mirror of vitalia advisory_locks
        surface. Tests wire an in-memory fake; production wires the SQL impl.
    scheduler_query
        Callable returning candidate slots — extends @luana/core scheduling
        via caller-supplied source (Story 11 vitalia precedent).
    schedule_config_repo
        Optional — exposes `max_concurrent_per_slot` per creator. When
        absent or row missing → defaults to 1 (1:1 discovery call).
    meeting_provisioner
        Optional — when supplied and confirm/reschedule succeeds, tool calls
        `provision()` to mint a meeting URL (Zoom / Meet / etc.).
    audit_log_repo
        Optional — when supplied, tool appends a community_audit_log entry.
        Best-effort — failure NEVER breaks turn.
    event_publisher
        Optional — when supplied, tool emits DiscoveryCallBookedV1 /
        Rescheduled / Cancelled domain events. Best-effort.
    trace_event_repo
        Optional — when supplied, tool records one observability trace
        event per call. Best-effort.
    turn_id / span_id
        Correlation IDs required iff trace_event_repo supplied.
    context
        Caller's runtime context label. Reserved for future forbidden-context
        guards (currently no FORBIDDEN_CONTEXTS per arch § 4.5).

    Returns
    -------
    BookDiscoveryCallOutputV1 — see schema docstring.

    Raises
    ------
    ForbiddenToolContextError
        If context is in FORBIDDEN_CONTEXTS (currently empty — never raises today).
    """
    # Forbidden-context guard (defense-in-depth — frozenset currently empty).
    if context is not None and context in _FORBIDDEN_CONTEXTS:
        raise ForbiddenToolContextError(context, tool_name="book_discovery_call")

    if input.action == "list_slots":
        return await _handle_list_slots(
            input,
            tenant_id=tenant_id,
            booking_repo=booking_repo,
            schedule_config_repo=schedule_config_repo,
            scheduler_query=scheduler_query,
            trace_event_repo=trace_event_repo,
            turn_id=turn_id,
            span_id=span_id,
        )
    if input.action == "confirm_slot":
        return await _handle_confirm_slot(
            input,
            tenant_id=tenant_id,
            booking_repo=booking_repo,
            advisory_lock=advisory_lock,
            meeting_provisioner=meeting_provisioner,
            audit_log_repo=audit_log_repo,
            event_publisher=event_publisher,
            trace_event_repo=trace_event_repo,
            turn_id=turn_id,
            span_id=span_id,
        )
    if input.action == "reschedule_existing":
        return await _handle_reschedule_existing(
            input,
            tenant_id=tenant_id,
            booking_repo=booking_repo,
            advisory_lock=advisory_lock,
            meeting_provisioner=meeting_provisioner,
            audit_log_repo=audit_log_repo,
            event_publisher=event_publisher,
            trace_event_repo=trace_event_repo,
            turn_id=turn_id,
            span_id=span_id,
        )
    # input.action == "cancel"
    return await _handle_cancel(
        input,
        tenant_id=tenant_id,
        booking_repo=booking_repo,
        audit_log_repo=audit_log_repo,
        event_publisher=event_publisher,
        trace_event_repo=trace_event_repo,
        turn_id=turn_id,
        span_id=span_id,
    )


# Keep asyncio reference live (some checkers strip unused import otherwise).
_ = asyncio


__all__ = [
    "BookDiscoveryCallInputV1",
    "BookDiscoveryCallOutputV1",
    "DiscoveryCallBookedV1",
    "DiscoveryCallCancelledV1",
    "DiscoveryCallRescheduledV1",
    "ForbiddenToolContextError",
    "WindowSpec",
    "book_discovery_call",
]
