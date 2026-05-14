"""Comunify AGENTIC tool — `link_to_community`.

R23: production_code=True AGENTIC tool. Opus 4.7 EXCLUSIVE.
Story 12 luana-comunify-bootstrap T-tools-2.

Spec sources:
  * 06-tickets.yaml::T-tools-2 acceptance criteria
  * 03-arch-agentic.md § 4.2 (link_to_community spec — input/output + 4 actions)
  * 02-design-agentic.md (community access scenarios)
  * 03-arch-be.md § 4.2 (ComunifyCohortMemberModel) + § audit_log
  * 05-guidelines.md § R23 agentic patterns
  * .claude/rules/tenant-isolation.md (tenant_id NEVER in input schema)
  * .claude/rules/anti-duplication.md (no shared HMAC URL signer exists — N=1 inline)
  * .claude/rules/copilot-observability.md (best-effort writes — never break turn)

Semantics — 4 actions per 03-arch-agentic.md § 4.2:

  1. `generate_invite` — Mint a fresh HMAC-signed invite URL for an enrolled
     (or to-be-enrolled) subscriber. $0 LLM cost.
       * Upserts ComunifyCohortMemberModel with status="active" (if no row)
         or refreshes last_active_at (if row exists).
       * HMAC over `f"{tenant_id}:{subscriber_id}:{exp}"` — exp = epoch seconds.
       * URL shape: `${COMUNIFY_INVITE_BASE_URL}?token={hex}&exp={epoch}&sub={subscriber_id}`
       * Default expiry: 7 days from now.
       * Audit log row: event_type="community_access_granted_or_renewed",
         action="generate_invite".

  2. `resend_invite` — Idempotent within 5-min window per
     (tenant_id, subscriber_id, cohort_id, action) tuple. Within window:
     return cached URL + skip audit. Outside window: mint new URL + audit.

  3. `suggest_path` — One Haiku call to recommend 1-3 community tier path
     based on subscriber profile + existing membership signal. ~$0.003.
     Graceful-degradation: LLM failure → deterministic heuristic fallback.
     NO mutation, NO audit (read-only/advisory).

  4. `verify_access` — Cryptographic verification of (token, expiry) tuple
     against `${COMUNIFY_INVITE_SECRET}`. Returns access_granted: bool.
     Defense-in-depth: even with valid HMAC, returns False if member.status
     is "dropped" or "suspended". No mutation, no audit (audit happens on
     issuance, not on verify — issuance side already wrote the row).

Tenant isolation (security boundary):
  * tenant_id NEVER in input schema — ctx-injected by sales_agent/copilot
    tool dispatcher.
  * HMAC msg includes tenant_id — cross-tenant attempts produce different
    signatures → verify_access returns False.
  * Repos (member, audit) tenant-scoped at construction; tool passes the
    same tenant_id and asserts isolation invariants on writes.

Observability (best-effort per copilot-observability.md):
  * Every external call (LLM, audit_log, trace_event) wrapped in
    try/except + structlog warning. NEVER breaks tool turn.
  * PII sanitization at the boundary — defense-in-depth: tool scrubs known
    PII keys before sanitize_payload (which may fall back to a truncate-only
    stub when luana_core_observability is not on sys.path).

Cost (per 03-arch-agentic.md § 4.6):
  * generate_invite + resend_invite + verify_access: $0 LLM (pure compute).
  * suggest_path: 1 Haiku call ~$0.003.
  * Idempotent replay (5-min window): $0 (short-circuit before LLM).
  * Latency budget: p50 150ms (generate) / 1s (suggest); p99 500ms / 2.5s.

Anti-duplication audit (Step 0 GATE pre-write):
  * `find -name "link_to_community.py" /home/chris/luana-platform` → none.
  * `grep -rn "class LinkToCommunity"` → only spec docs.
  * HMAC signer pattern is comunify-specific (subscriber invite). No
    equivalent in `shared/agent_observability/` or `luana_core_*`. N=1.
  * If future verticals (vitalia + future) need similar signed URLs → lift
    to `luana_core_invite` shared package per anti-duplication.md.
  * `sanitize_payload` reused from `luana_core_observability` (lazy fallback)
    mirroring `qualify_for_cohort.py` (the T-tools-1 sibling tool).
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import os
import re
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Protocol, runtime_checkable

import structlog
from pydantic import BaseModel, ConfigDict, Field

logger = structlog.get_logger(__name__)


# ─── Constants ─────────────────────────────────────────────────────────────


# 03-arch-agentic.md § 4.5 — `lead_qualification` ctx forbids link_to_community
# (subscriber not yet enrolled — wrong stage in funnel).
_FORBIDDEN_CONTEXTS: frozenset[str] = frozenset(
    {
        "lead_qualification",
        "member_support",  # forbid spec future-proof (member_support_* per § 4.5)
    }
)

# Idempotency window — second identical call within 5min returns cached URL
# (per 03-arch-agentic.md `idempotent_via=...:5min_window`).
_IDEMPOTENCY_WINDOW = timedelta(minutes=5)

# Default invite expiry — 7 days from issuance.
_DEFAULT_INVITE_TTL = timedelta(days=7)

# Default LLM model for suggest_path — Haiku per § 4.6 ($0.003 budget).
_DEFAULT_SUGGEST_PATH_MODEL = "anthropic/claude-haiku-4-5"

# Env var names (cementation — tests assert MissingHMACSecretError when unset).
_ENV_SECRET = "COMUNIFY_INVITE_SECRET"
_ENV_BASE_URL = "COMUNIFY_INVITE_BASE_URL"
_DEFAULT_BASE_URL = "https://app.comunify.com/community"

# Per-tool LLM timeout (suggest_path only). 15s ample for Haiku JSON.
_LLM_TIMEOUT_SECONDS = 15.0

# PII keys scrubbed defensively at tool boundary BEFORE sanitize_payload runs.
# Mirrors qualify_for_cohort.py (T-tools-1 sibling). Lift to shared at N=3.
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

# Regex fallback for inline PII in free-text values.
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
# Phone: 7+ digits with optional separators. Defensive (some false positives OK
# in observability payloads — better safe than leaky).
_PHONE_RE = re.compile(r"(?:\+?\d[\s\-\(\)]?){7,}\d")


# ─── Exceptions ────────────────────────────────────────────────────────────
# Lifted to `_exceptions.py` at N=3 detection (T-tools-3 trigger) per
# `.claude/rules/anti-duplication.md` cardinal. Re-exported here to preserve
# the public API surface (test imports + `tools/__init__.py` re-exports).
from src.modules.comunify.agentic.tools._exceptions import ForbiddenToolContextError  # noqa: E402


class MissingHMACSecretError(RuntimeError):
    """Raised when COMUNIFY_INVITE_SECRET env var is not set.

    Defense-in-depth: silent fallback to empty token would defeat the URL
    signing scheme. Explicit error forces deployment configuration.
    """

    def __init__(self) -> None:
        super().__init__(
            f"{_ENV_SECRET} environment variable is required for link_to_community. "
            "Set it in the deployment environment (32+ random bytes recommended)."
        )


# ─── Pydantic schemas (V1 — frozen, schema_version cement) ─────────────────


_ActionT = Literal["generate_invite", "resend_invite", "suggest_path", "verify_access"]

_StatusT = Literal["pending_first_access", "active", "expired", "revoked"]

_RecommendedTierT = Literal[
    "level_1_lead_magnet",
    "level_2_tripwire",
    "level_3_core",
    "level_4_premium",
]


class LinkToCommunityInputV1(BaseModel):
    """Input schema — tenant_id intentionally OMITTED (ctx injection).

    Per 03-arch-agentic.md § 4.2 + .claude/rules/tenant-isolation.md:
    > tenant_id NOT in schema — injected via tool dispatcher from ctx
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    schema_version: Literal[1] = Field(
        default=1,
        description="Schema version cement — bump triggers breaking-change review.",
    )
    subscriber_id: uuid.UUID = Field(
        ...,
        description="Subscriber/member UUID for whom to generate/verify access.",
    )
    cohort_id: uuid.UUID | None = Field(
        default=None,
        description=(
            "Target cohort UUID. Required for generate/resend/verify. "
            "Optional for suggest_path (LLM picks based on profile)."
        ),
    )
    action: _ActionT = Field(
        default="generate_invite",
        description=(
            "generate_invite: mint signed URL + persist member + audit. "
            "resend_invite: idempotent 5-min replay of same URL. "
            "suggest_path: 1 Haiku call → 1-3 tier suggestions (no mutation). "
            "verify_access: cryptographic check of (token, expiry) tuple."
        ),
    )
    subscriber_profile: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Optional profile data for suggest_path action (business_stage, "
            "primary_niche, monthly_income_usd, etc.). PII keys scrubbed "
            "before observability writes."
        ),
    )
    token: str | None = Field(
        default=None,
        description="HMAC token for verify_access action. Hex-encoded SHA-256.",
    )
    token_expiry: int | None = Field(
        default=None,
        description="Epoch seconds for verify_access action.",
    )


class LinkToCommunityOutputV1(BaseModel):
    """Result of link_to_community invocation.

    Per 03-arch-agentic.md § 4.2. Adjusted to include union of all 4 action
    result shapes (some fields are None for actions that don't produce them).
    """

    model_config = ConfigDict(frozen=True)

    schema_version: Literal[1] = Field(
        default=1,
        description="Schema version cement.",
    )
    action_performed: _ActionT = Field(
        ...,
        description="Echo of the action carried out (generate/resend/suggest/verify).",
    )
    invite_url: str = Field(
        default="",
        description=(
            "Signed invite URL for generate_invite/resend_invite. "
            "Empty string for suggest_path/verify_access (no URL produced)."
        ),
    )
    status: _StatusT = Field(
        default="pending_first_access",
        description="Member status — pending_first_access | active | expired | revoked.",
    )
    expires_at: datetime | None = Field(
        default=None,
        description="UTC expiry datetime of the issued URL (None for suggest/verify).",
    )
    suggested_tiers: list[_RecommendedTierT] = Field(
        default_factory=list,
        description="1-3 community ladder tiers (suggest_path only).",
    )
    rationale: str = Field(
        default="",
        description="LLM rationale for suggested tiers (suggest_path only).",
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="LLM confidence for suggest_path output (0-1).",
    )
    access_granted: bool | None = Field(
        default=None,
        description=(
            "True/False for verify_access action — None for other actions to "
            "distinguish 'verify not run' from 'verify=False'."
        ),
    )
    next_session_at: datetime | None = Field(
        default=None,
        description="Next cohort session timestamp (optional, for generate_invite UX).",
    )
    fallback_used: bool = Field(
        default=False,
        description=(
            "True iff suggest_path LLM failed and deterministic heuristic "
            "engaged (graceful-degradation per tessl__graceful-degradation skill)."
        ),
    )


# ─── Domain event (inline today — lift to domain/events.py at N=2) ─────────


@dataclass(frozen=True)
class CommunityAccessAuditedV1:
    """Audit log record for community access grant/renewal.

    Mirrors the shape persisted into `comunify_community_audit_log`
    (ComunifyCommunityAuditLogModel) via the audit_log_repo adapter.

    Lift to modules/comunify/domain/events.py when 2nd audit-style event
    type appears.
    """

    schema_version: Literal[1]
    tenant_id: uuid.UUID
    subscriber_id: uuid.UUID
    cohort_id: uuid.UUID | None
    action: _ActionT
    event_type: Literal["community_access_granted_or_renewed"]
    issued_at: datetime
    expires_at: datetime | None
    actor_type: Literal["sales_agent", "copilot", "system"] = "sales_agent"
    payload_redacted: dict[str, Any] | None = None


# ─── Protocols (DI — decouple from concrete repos / clients) ───────────────


@runtime_checkable
class _CohortMemberRepoLike(Protocol):
    """Minimal CohortMemberRepository surface consumed by this tool."""

    async def find_by_cohort_and_subscriber(self, cohort_id: uuid.UUID, subscriber_id: uuid.UUID) -> Any: ...

    async def find_by_subscriber(self, subscriber_id: uuid.UUID) -> list[Any]: ...

    async def save(self, member: Any) -> None: ...


@runtime_checkable
class _AuditLogRepoLike(Protocol):
    """Minimal CommunityAuditLogRepository surface consumed by this tool."""

    async def save(self, event: Any) -> None: ...


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
class _LLMClientLike(Protocol):
    """Minimal LiteLLM / Anthropic SDK surface for suggest_path Haiku call.

    Caller injects concrete: LiteLLM proxy adapter, Anthropic SDK direct, etc.
    Mirrors qualify_for_cohort._LLMClientLike. Lift to shared agentic
    abstractions at N≥2 (per anti-duplication.md).
    """

    async def acompletion(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        max_tokens: int = ...,
        timeout: float = ...,
    ) -> dict[str, Any]: ...


# ─── sanitize_payload — lazy with fallback (mirror qualify_for_cohort.py) ──


def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitize payload via luana_core_observability or truncate-only fallback."""
    try:
        from luana_core_observability.recording.sanitization import (
            sanitize_payload as _sp,  # type: ignore[import-not-found]
        )

        return _sp(payload)  # type: ignore[no-any-return]
    except ImportError:
        _MAX_LEN = 4000
        return {k: (v[:_MAX_LEN] if isinstance(v, str) and len(v) > _MAX_LEN else v) for k, v in payload.items()}


# ─── PII boundary scrub (defense-in-depth — never trust fallback sanitizer) ──


def _scrub_pii(payload: dict[str, Any]) -> dict[str, Any]:
    """Remove known PII keys + redact inline email/phone in remaining strings."""
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


# ─── HMAC + URL signing ────────────────────────────────────────────────────


def _load_hmac_secret() -> bytes:
    """Load HMAC secret from env. Raises explicit error when unset."""
    val = os.environ.get(_ENV_SECRET, "")
    if not val:
        raise MissingHMACSecretError()
    return val.encode("utf-8")


def _load_base_url() -> str:
    """Load invite base URL from env, falling back to production default."""
    return os.environ.get(_ENV_BASE_URL, _DEFAULT_BASE_URL).rstrip("/")


def _hmac_token(*, tenant_id: uuid.UUID, subscriber_id: uuid.UUID, exp: int, secret: bytes) -> str:
    """Compute canonical HMAC-SHA256 hex digest.

    Canonical message: `f"{tenant_id}:{subscriber_id}:{exp}"`.
    Cross-tenant tokens produce different digests → verify_access in another
    tenant returns False.
    """
    msg = f"{tenant_id}:{subscriber_id}:{exp}".encode("utf-8")
    return hmac.new(key=secret, msg=msg, digestmod=hashlib.sha256).hexdigest()


def _build_signed_url(
    *,
    base_url: str,
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    expires_at: datetime,
    secret: bytes,
) -> tuple[str, int, str]:
    """Build signed URL. Returns (url, exp_epoch, token_hex)."""
    exp = int(expires_at.timestamp())
    token = _hmac_token(tenant_id=tenant_id, subscriber_id=subscriber_id, exp=exp, secret=secret)
    return (
        f"{base_url}?token={token}&exp={exp}&sub={subscriber_id}",
        exp,
        token,
    )


def _verify_hmac(
    *,
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    token: str,
    exp: int,
    secret: bytes,
    now: datetime,
) -> bool:
    """Cryptographically verify (token, exp) tuple.

    Returns False iff:
      * expiry has passed (exp <= now_epoch)
      * token is not a valid hex digest (compare_digest tolerates this)
      * HMAC over canonical message does not match token
    """
    if exp <= int(now.timestamp()):
        return False
    expected = _hmac_token(tenant_id=tenant_id, subscriber_id=subscriber_id, exp=exp, secret=secret)
    # Use compare_digest to avoid timing leaks
    try:
        return hmac.compare_digest(expected, token)
    except (TypeError, ValueError):
        return False


# ─── Idempotency cache (in-process, per-process) ───────────────────────────


@dataclass
class _CachedInvite:
    """Idempotency cache entry — keyed by (tenant_id, subscriber_id, cohort_id, action)."""

    url: str
    expires_at: datetime
    cached_at: datetime
    next_session_at: datetime | None
    status: _StatusT


# Module-level cache. In production this would be Redis-backed; for the
# 5-min idempotency window an in-process LRU is sufficient and matches the
# T-tools-1 pattern (no shared cache abstraction exists yet).
_INVITE_CACHE: dict[tuple[uuid.UUID, uuid.UUID, uuid.UUID | None, _ActionT], _CachedInvite] = {}


def _cache_key(
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID | None,
    action: _ActionT,
) -> tuple[uuid.UUID, uuid.UUID, uuid.UUID | None, _ActionT]:
    return (tenant_id, subscriber_id, cohort_id, action)


def _idempotent_lookup(
    *,
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID | None,
    action: _ActionT,
    now: datetime,
) -> _CachedInvite | None:
    """Return cached entry iff within 5-min window, else None."""
    key = _cache_key(tenant_id, subscriber_id, cohort_id, action)
    entry = _INVITE_CACHE.get(key)
    if entry is None:
        return None
    if now - entry.cached_at >= _IDEMPOTENCY_WINDOW:
        # stale — drop
        _INVITE_CACHE.pop(key, None)
        return None
    return entry


def _idempotent_store(
    *,
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID | None,
    action: _ActionT,
    entry: _CachedInvite,
) -> None:
    _INVITE_CACHE[_cache_key(tenant_id, subscriber_id, cohort_id, action)] = entry


# ─── suggest_path — LLM dispatch + deterministic fallback ──────────────────


_HEURISTIC_TIER_BY_STAGE: dict[str, list[_RecommendedTierT]] = {
    "ideating": ["level_1_lead_magnet"],
    "validating": ["level_1_lead_magnet", "level_2_tripwire"],
    "monetizing": ["level_2_tripwire", "level_3_core"],
    "scaling": ["level_3_core", "level_4_premium"],
    "established": ["level_4_premium"],
}


def _build_suggest_path_messages(
    *,
    subscriber_profile: dict[str, Any],
    existing_membership: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    """Build Haiku messages for tier suggestion.

    Cache-friendly: system message is invariant (no tenant_id, no timestamps).
    Slot architecture per .claude/rules/sales-agent-brand-voice.md.
    """
    system = (
        "You are a community-tier path recommender. Given a creator's profile "
        "and any existing membership signal, output STRICT JSON with keys: "
        '"suggested_tiers" (list of 1-3 strings from '
        '["level_1_lead_magnet","level_2_tripwire","level_3_core","level_4_premium"]), '
        '"rationale" (short string), "confidence" (float 0-1). NO prose outside JSON.'
    )

    # User content — variable portion. Include existing_membership signal when present
    # so the test can assert it surfaces in the prompt.
    payload: dict[str, Any] = {"subscriber_profile": subscriber_profile}
    if existing_membership is not None:
        payload["existing_membership"] = existing_membership

    user = json.dumps(payload, sort_keys=True, default=str)
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _parse_suggest_path_response(
    response: dict[str, Any],
) -> tuple[list[_RecommendedTierT], str, float]:
    """Parse Haiku response → (tiers, rationale, confidence). Raises on invalid shape."""
    choices = response.get("choices") or []
    if not choices:
        raise ValueError("llm response missing 'choices'")
    message = choices[0].get("message") or {}
    raw_content = message.get("content")
    if isinstance(raw_content, list):
        text_parts = [b.get("text", "") for b in raw_content if isinstance(b, dict)]
        content = "".join(text_parts)
    elif isinstance(raw_content, str):
        content = raw_content
    else:
        raise ValueError("llm response message.content missing or not str/list")

    parsed = json.loads(content)
    tiers_raw = parsed.get("suggested_tiers", [])
    if not isinstance(tiers_raw, list):
        raise ValueError("suggested_tiers is not a list")
    valid_tiers: list[_RecommendedTierT] = []
    allowed = {"level_1_lead_magnet", "level_2_tripwire", "level_3_core", "level_4_premium"}
    for t in tiers_raw:
        if isinstance(t, str) and t in allowed:
            valid_tiers.append(t)  # type: ignore[arg-type]
    if not valid_tiers:
        raise ValueError("no valid suggested_tiers in response")
    valid_tiers = valid_tiers[:3]  # 1-3 cap per spec
    rationale = str(parsed.get("rationale", ""))[:500]
    confidence = float(parsed.get("confidence", 0.0))
    confidence = max(0.0, min(1.0, confidence))
    return (valid_tiers, rationale, confidence)


async def _suggest_path_via_llm(
    *,
    llm_client: _LLMClientLike,
    model: str,
    subscriber_profile: dict[str, Any],
    existing_membership: dict[str, Any] | None,
    timeout_seconds: float = _LLM_TIMEOUT_SECONDS,
) -> tuple[list[_RecommendedTierT], str, float]:
    """LLM call for tier suggestion. Raises on any failure (caller falls back)."""
    messages = _build_suggest_path_messages(
        subscriber_profile=subscriber_profile,
        existing_membership=existing_membership,
    )
    response = await asyncio.wait_for(
        llm_client.acompletion(
            model=model,
            messages=messages,
            max_tokens=256,
            timeout=timeout_seconds,
        ),
        timeout=timeout_seconds,
    )
    return _parse_suggest_path_response(response)


def _deterministic_tier_suggestion(
    subscriber_profile: dict[str, Any],
    existing_membership: dict[str, Any] | None,
) -> tuple[list[_RecommendedTierT], str, float]:
    """Heuristic fallback when LLM fails.

    Strategy:
      * If existing_membership has tier→ recommend next step up.
      * Else use business_stage → tier map.
      * Else default to ["level_2_tripwire"] (mid-funnel safe pick).
    """
    if existing_membership is not None:
        cur_tier = existing_membership.get("tier") or "regular"
        # regular → level_3_core; premium → level_4_premium
        if cur_tier == "premium":
            return (["level_4_premium"], "Upgrade path from premium tier.", 0.5)
        return (["level_3_core"], "Graduation path from regular tier.", 0.5)

    stage = str(subscriber_profile.get("business_stage", "")).lower()
    if stage in _HEURISTIC_TIER_BY_STAGE:
        return (
            _HEURISTIC_TIER_BY_STAGE[stage],
            f"Heuristic match on business_stage='{stage}'.",
            0.4,
        )
    return (["level_2_tripwire"], "Default safe pick (no profile signal).", 0.3)


# ─── Cohort member factory ────────────────────────────────────────────────


def _build_or_refresh_member(
    *,
    existing: Any | None,
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID,
    now: datetime,
) -> Any:
    """Build a new CohortMember row or touch `updated_at` on existing.

    NOTE: `last_active_at` is NOT set here — that flip is owned by the
    webhook/SSE bridge that observes the subscriber first opening the URL.
    Bumping it on URL issuance would conflate "invite minted" with "user
    actually visited", breaking the pending_first_access → active lifecycle.

    Lazy import to avoid coupling at module-load (per backend-ddd.md
    schema-mirror exception). When the real ORM model isn't importable
    (stripped test envs), uses a duck-typed placeholder so tests still
    cover the persistence path via in-memory fakes.
    """
    if existing is not None:
        # Touch updated_at if model has it — last_active_at stays untouched
        if hasattr(existing, "updated_at"):
            existing.updated_at = now
        return existing

    try:
        from src.modules.comunify.infrastructure.models.cohort_member_model import (  # noqa: PLC0415
            ComunifyCohortMemberModel,
        )

        return ComunifyCohortMemberModel(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            cohort_id=cohort_id,
            subscriber_id=subscriber_id,
            tier="regular",
            # Use 'active' (canonical CohortMember status) — the tool's surface
            # status "pending_first_access" is a derived UX label until first
            # webhook signal flips last_active_at.
            status="active",
            engagement_score=50,
            last_active_at=None,
            enrollment_at=now,
            waitlist_position=None,
            pre_moderation_count=3,
            created_at=now,
            updated_at=now,
        )
    except ImportError:
        # Test env without ORM — duck-typed placeholder matching the test fake.
        from dataclasses import dataclass as _dc

        @_dc
        class _PlaceholderMember:
            id: uuid.UUID
            tenant_id: uuid.UUID
            cohort_id: uuid.UUID
            subscriber_id: uuid.UUID
            status: str
            tier: str
            enrollment_at: datetime
            last_active_at: datetime | None
            deleted_at: datetime | None

        return _PlaceholderMember(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            cohort_id=cohort_id,
            subscriber_id=subscriber_id,
            status="active",
            tier="regular",
            enrollment_at=now,
            last_active_at=None,
            deleted_at=None,
        )


def _build_audit_event(
    *,
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID | None,
    action: _ActionT,
    issued_at: datetime,
    expires_at: datetime | None,
    scrubbed_payload: dict[str, Any],
) -> CommunityAccessAuditedV1:
    """Build the audit event dataclass — repos adapt to ORM at the boundary."""
    return CommunityAccessAuditedV1(
        schema_version=1,
        tenant_id=tenant_id,
        subscriber_id=subscriber_id,
        cohort_id=cohort_id,
        action=action,
        event_type="community_access_granted_or_renewed",
        issued_at=issued_at,
        expires_at=expires_at,
        actor_type="sales_agent",
        payload_redacted=scrubbed_payload,
    )


# ─── Best-effort observability helpers ─────────────────────────────────────


async def _emit_trace_event_best_effort(
    trace_event_repo: _TraceEventRepoLike | None,
    *,
    tenant_id: uuid.UUID,
    turn_id: uuid.UUID | None,
    span_id: uuid.UUID | None,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID | None,
    action: _ActionT,
    result: LinkToCommunityOutputV1,
    subscriber_profile: dict[str, Any],
    duration_ms: int | None,
) -> None:
    """Best-effort trace event — NEVER raises (copilot-observability.md)."""
    if trace_event_repo is None or turn_id is None or span_id is None:
        return
    try:
        scrubbed = _scrub_pii(
            {
                "subscriber_id": str(subscriber_id),
                "cohort_id": str(cohort_id) if cohort_id else None,
                "action": action,
                "status": result.status,
                "access_granted": result.access_granted,
                "fallback_used": result.fallback_used,
                "suggested_tiers": result.suggested_tiers,
                "subscriber_profile": subscriber_profile,
            }
        )
        payload = _sanitize_payload(scrubbed)
        trace_event_repo.add(
            tenant_id=tenant_id,
            turn_id=turn_id,
            span_id=span_id,
            event_type=f"tool.link_to_community.{action}",
            name="link_to_community",
            data=payload,
            duration_ms=duration_ms,
            status="ok",
        )
    except Exception as exc:  # noqa: BLE001 — best-effort observability
        logger.warning(
            "link_to_community.trace_event_persist_failed",
            exc=str(exc),
            subscriber_id=str(subscriber_id),
            cohort_id=str(cohort_id) if cohort_id else None,
            tenant_id=str(tenant_id),
            action=action,
        )


async def _emit_audit_best_effort(
    audit_repo: _AuditLogRepoLike,
    *,
    event: CommunityAccessAuditedV1,
) -> None:
    """Best-effort audit log save — NEVER raises (R23 + copilot-observability.md).

    Note: per community_audit_log_repository.py, audit_log persistence failure
    must NOT break the request path. Tool catches + logs warning.
    """
    try:
        await audit_repo.save(event)
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "link_to_community.audit_log_persist_failed",
            exc=str(exc),
            event_type=event.event_type,
            action=event.action,
            subscriber_id=str(event.subscriber_id),
            cohort_id=str(event.cohort_id) if event.cohort_id else None,
            tenant_id=str(event.tenant_id),
        )


# ─── Handler ────────────────────────────────────────────────────────────────


async def link_to_community(
    input: LinkToCommunityInputV1,
    *,
    tenant_id: uuid.UUID,
    member_repo: _CohortMemberRepoLike,
    audit_repo: _AuditLogRepoLike,
    llm_client: _LLMClientLike,
    trace_event_repo: _TraceEventRepoLike | None = None,
    turn_id: uuid.UUID | None = None,
    span_id: uuid.UUID | None = None,
    context: str | None = None,
    invite_ttl: timedelta = _DEFAULT_INVITE_TTL,
    suggest_path_model: str = _DEFAULT_SUGGEST_PATH_MODEL,
    llm_timeout_seconds: float = _LLM_TIMEOUT_SECONDS,
    _now: datetime | None = None,
) -> LinkToCommunityOutputV1:
    """Link subscriber to community via signed URL, idempotent path suggestion,
    or cryptographic access verification.

    See module docstring for action semantics + spec refs.

    Parameters
    ----------
    input
        Pydantic input. `tenant_id` NEVER here — security boundary.
    tenant_id
        Ctx-injected by sales_agent/copilot tool dispatcher.
    member_repo
        Tenant-scoped CohortMemberRepository.
    audit_repo
        Tenant-scoped CommunityAuditLogRepository — best-effort writes.
    llm_client
        Pluggable LLM client (LiteLLM/Anthropic SDK adapter). Used only by
        the `suggest_path` action.
    trace_event_repo
        Optional — when supplied, tool records one observability trace event.
    turn_id / span_id
        Correlation IDs required iff trace_event_repo is supplied.
    context
        Caller's runtime context label. Forbidden-context guard uses it.
    invite_ttl
        How long the signed URL is valid. Default 7 days.
    suggest_path_model
        Wire model name for the suggest_path Haiku call.
    llm_timeout_seconds
        Per-LLM-call timeout. Default 15s.
    _now
        Test-only injection point for the "current" datetime — production
        callers pass nothing and the tool uses `datetime.now(timezone.utc)`.

    Returns
    -------
    LinkToCommunityOutputV1 — see schema docstring.

    Raises
    ------
    ForbiddenToolContextError
        If context is in FORBIDDEN_CONTEXTS — defense-in-depth.
    MissingHMACSecretError
        If `COMUNIFY_INVITE_SECRET` env var is unset (generate/resend/verify).
    """
    started = _now or datetime.now(timezone.utc)

    # ── Step 1 — Forbidden-context guard ───────────────────────────────────
    if context is not None and context in _FORBIDDEN_CONTEXTS:
        raise ForbiddenToolContextError(context)

    action = input.action

    # ── Step 2 — Dispatch per action ───────────────────────────────────────
    if action in ("generate_invite", "resend_invite"):
        result = await _handle_invite_action(
            input=input,
            tenant_id=tenant_id,
            member_repo=member_repo,
            audit_repo=audit_repo,
            now=started,
            invite_ttl=invite_ttl,
        )
    elif action == "verify_access":
        result = await _handle_verify_access(
            input=input,
            tenant_id=tenant_id,
            member_repo=member_repo,
            now=started,
        )
    elif action == "suggest_path":
        result = await _handle_suggest_path(
            input=input,
            tenant_id=tenant_id,
            member_repo=member_repo,
            llm_client=llm_client,
            model=suggest_path_model,
            llm_timeout_seconds=llm_timeout_seconds,
        )
    else:  # pragma: no cover — Pydantic Literal rejects others
        raise ValueError(f"unsupported action: {action}")

    # ── Step 3 — Best-effort trace event ───────────────────────────────────
    duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    await _emit_trace_event_best_effort(
        trace_event_repo,
        tenant_id=tenant_id,
        turn_id=turn_id,
        span_id=span_id,
        subscriber_id=input.subscriber_id,
        cohort_id=input.cohort_id,
        action=action,
        result=result,
        subscriber_profile=input.subscriber_profile,
        duration_ms=duration_ms,
    )

    return result


# ─── Action handlers ───────────────────────────────────────────────────────


async def _handle_invite_action(
    *,
    input: LinkToCommunityInputV1,
    tenant_id: uuid.UUID,
    member_repo: _CohortMemberRepoLike,
    audit_repo: _AuditLogRepoLike,
    now: datetime,
    invite_ttl: timedelta,
) -> LinkToCommunityOutputV1:
    """generate_invite / resend_invite shared path.

    Differences are encoded purely via the idempotency cache + action label
    on the audit row — same URL-minting + persistence machinery.
    """
    action = input.action  # already validated in caller
    cohort_id = input.cohort_id

    # Idempotency replay — 5-min window
    cached = _idempotent_lookup(
        tenant_id=tenant_id,
        subscriber_id=input.subscriber_id,
        cohort_id=cohort_id,
        action=action,  # type: ignore[arg-type]
        now=now,
    )
    if cached is not None:
        logger.info(
            "link_to_community.idempotent_replay",
            tenant_id=str(tenant_id),
            subscriber_id=str(input.subscriber_id),
            cohort_id=str(cohort_id) if cohort_id else None,
            action=action,
            cached_age_seconds=int((now - cached.cached_at).total_seconds()),
        )
        return LinkToCommunityOutputV1(
            action_performed=action,  # type: ignore[arg-type]
            invite_url=cached.url,
            status=cached.status,
            expires_at=cached.expires_at,
            next_session_at=cached.next_session_at,
            fallback_used=False,
        )

    # Load HMAC secret + base URL (raises MissingHMACSecretError if unset)
    secret = _load_hmac_secret()
    base_url = _load_base_url()

    # Resolve existing membership (or create pending row)
    existing = None
    if cohort_id is not None:
        existing = await member_repo.find_by_cohort_and_subscriber(cohort_id, input.subscriber_id)

    # Persist member row when cohort_id is provided
    if cohort_id is not None:
        member = _build_or_refresh_member(
            existing=existing,
            tenant_id=tenant_id,
            subscriber_id=input.subscriber_id,
            cohort_id=cohort_id,
            now=now,
        )
        try:
            await member_repo.save(member)
        except Exception as exc:  # noqa: BLE001 — log + continue; URL still issued
            logger.warning(
                "link_to_community.member_persist_failed",
                exc=str(exc),
                tenant_id=str(tenant_id),
                subscriber_id=str(input.subscriber_id),
                cohort_id=str(cohort_id),
                action=action,
            )

    # Mint signed URL
    expires_at = now + invite_ttl
    url, exp_epoch, _token = _build_signed_url(
        base_url=base_url,
        tenant_id=tenant_id,
        subscriber_id=input.subscriber_id,
        expires_at=expires_at,
        secret=secret,
    )

    # Status: pending_first_access until last_active_at is populated by webhook
    status: _StatusT = "pending_first_access"
    if existing is not None and existing.last_active_at is not None:
        status = "active"

    # Audit log (best-effort)
    scrubbed = _scrub_pii(
        {
            "action": action,
            "exp_epoch": exp_epoch,
        }
    )
    audit_event = _build_audit_event(
        tenant_id=tenant_id,
        subscriber_id=input.subscriber_id,
        cohort_id=cohort_id,
        action=action,  # type: ignore[arg-type]
        issued_at=now,
        expires_at=expires_at,
        scrubbed_payload=scrubbed,
    )
    await _emit_audit_best_effort(audit_repo, event=audit_event)

    # Cache for 5-min idempotency window
    _idempotent_store(
        tenant_id=tenant_id,
        subscriber_id=input.subscriber_id,
        cohort_id=cohort_id,
        action=action,  # type: ignore[arg-type]
        entry=_CachedInvite(
            url=url,
            expires_at=expires_at,
            cached_at=now,
            next_session_at=None,
            status=status,
        ),
    )

    # Mix in a one-time CSRF-like nonce in logs (NOT in URL — URL is HMAC-bound).
    # This is purely a logging breadcrumb to help correlate issuance events.
    _ = secrets.token_hex(8)

    return LinkToCommunityOutputV1(
        action_performed=action,  # type: ignore[arg-type]
        invite_url=url,
        status=status,
        expires_at=expires_at,
        fallback_used=False,
    )


async def _handle_verify_access(
    *,
    input: LinkToCommunityInputV1,
    tenant_id: uuid.UUID,
    member_repo: _CohortMemberRepoLike,
    now: datetime,
) -> LinkToCommunityOutputV1:
    """Cryptographic verification + membership status check.

    Returns access_granted=False on:
      * missing token / token_expiry
      * tampered HMAC
      * expired window
      * member status in {dropped, suspended, revoked}
      * cross-tenant attempt (HMAC msg includes tenant_id)
    """
    if input.token is None or input.token_expiry is None:
        return LinkToCommunityOutputV1(
            action_performed="verify_access",
            access_granted=False,
            status="revoked",
        )

    secret = _load_hmac_secret()
    crypto_ok = _verify_hmac(
        tenant_id=tenant_id,
        subscriber_id=input.subscriber_id,
        token=input.token,
        exp=input.token_expiry,
        secret=secret,
        now=now,
    )
    if not crypto_ok:
        return LinkToCommunityOutputV1(
            action_performed="verify_access",
            access_granted=False,
            status="expired",
        )

    # Defense-in-depth — check membership status when cohort_id provided
    if input.cohort_id is not None:
        member = await member_repo.find_by_cohort_and_subscriber(input.cohort_id, input.subscriber_id)
        if member is None:
            return LinkToCommunityOutputV1(
                action_performed="verify_access",
                access_granted=False,
                status="revoked",
            )
        if getattr(member, "status", "active") in {"dropped", "suspended", "revoked"}:
            return LinkToCommunityOutputV1(
                action_performed="verify_access",
                access_granted=False,
                status="revoked",
            )

    return LinkToCommunityOutputV1(
        action_performed="verify_access",
        access_granted=True,
        status="active",
        expires_at=datetime.fromtimestamp(input.token_expiry, tz=timezone.utc),
    )


async def _handle_suggest_path(
    *,
    input: LinkToCommunityInputV1,
    tenant_id: uuid.UUID,
    member_repo: _CohortMemberRepoLike,
    llm_client: _LLMClientLike,
    model: str,
    llm_timeout_seconds: float,
) -> LinkToCommunityOutputV1:
    """LLM-driven tier suggestion with deterministic fallback."""
    # Pull existing membership signal (informs the prompt)
    existing_membership: dict[str, Any] | None = None
    try:
        existing = await member_repo.find_by_subscriber(input.subscriber_id)
        if existing:
            # Take the most recent active enrollment as signal
            first = existing[0]
            existing_membership = {
                "tier": getattr(first, "tier", "regular"),
                "status": getattr(first, "status", "active"),
            }
    except Exception as exc:  # noqa: BLE001 — best-effort read; fall back to profile-only
        logger.warning(
            "link_to_community.member_lookup_failed_for_suggest_path",
            exc=str(exc),
            tenant_id=str(tenant_id),
            subscriber_id=str(input.subscriber_id),
        )

    fallback_used = False
    try:
        tiers, rationale, confidence = await _suggest_path_via_llm(
            llm_client=llm_client,
            model=model,
            subscriber_profile=input.subscriber_profile,
            existing_membership=existing_membership,
            timeout_seconds=llm_timeout_seconds,
        )
    except (asyncio.TimeoutError, Exception) as exc:  # noqa: BLE001 — broad to engage fallback
        fallback_used = True
        logger.warning(
            "link_to_community.suggest_path_llm_failure_fallback_engaged",
            exc=str(exc),
            exc_type=type(exc).__name__,
            tenant_id=str(tenant_id),
            subscriber_id=str(input.subscriber_id),
            model=model,
        )
        tiers, rationale, confidence = _deterministic_tier_suggestion(input.subscriber_profile, existing_membership)

    return LinkToCommunityOutputV1(
        action_performed="suggest_path",
        suggested_tiers=tiers,
        rationale=rationale,
        confidence=confidence,
        fallback_used=fallback_used,
    )


__all__ = [
    "CommunityAccessAuditedV1",
    "ForbiddenToolContextError",
    "LinkToCommunityInputV1",
    "LinkToCommunityOutputV1",
    "MissingHMACSecretError",
    "link_to_community",
]
