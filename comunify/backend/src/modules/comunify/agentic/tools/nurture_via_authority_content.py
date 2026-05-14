"""Comunify AGENTIC tool — `nurture_via_authority_content`.

R23: production_code=True AGENTIC tool. Opus 4.7 EXCLUSIVE.
Story 12 luana-comunify-bootstrap T-tools-3.

Spec sources:
  * 06-tickets.yaml::T-tools-3 acceptance criteria
  * 03-arch-agentic.md § 4.3 (nurture_via_authority_content spec — input/output)
  * 02-design-agentic.md § authority vault + nurture playbook
  * 03-arch-be.md § 9.6 (AuthorityVaultService) + § 4.x (ComunifyAuthorityVaultItemModel)
  * 05-guidelines.md § R23 agentic patterns
  * .claude/rules/tenant-isolation.md (tenant_id NEVER in input schema)
  * .claude/rules/anti-duplication.md (lift-to-shared at N≥2 cardinal)
  * .claude/rules/copilot-observability.md (best-effort writes — never break turn)
  * T-tools-2-result.md § "Forward-looking notes" (ForbiddenToolContextError N=3 lift required)

Semantics — surface relevant authority_vault content for a lead's intent:

  1. Forbidden-context guard (defense-in-depth — none currently per spec § 4.5,
     but exposed via shared `_exceptions.ForbiddenToolContextError` for symmetry
     + future-proofing).
  2. Idempotency: in-process 1h cache keyed by
     `(tenant_id, lead_id, intent_category, preferred_content_type)` → cached
     result, NO LLM call, NO DB read.
  3. Vault fetch: tenant-scoped `vault_repo.list_all()` (or `list_by_kind`
     for the preferred kind) → list[ComunifyAuthorityVaultItemModel].
  4. Pre-filter by `preferred_content_type` + by intent→kind heuristic:
       * pricing_guilt / imposter_syndrome / fear_first_client → case_studies
         (transformation proof) + press_mentions (third-party validation)
       * scaling_overload / burnout_concern → case_studies (peer outcomes)
         + press_mentions (recognition) + awards
       * general → all kinds blended (case_studies > press > awards > credentials)
  5. Empty after pre-filter → fallback to ALL items (general), top 3 by recency.
     Still empty (tenant has no vault content) → `fallback_used=True` +
     `confidence=0.0` + `content_url=[]` + `next_step="offer_call"`.
  6. LLM rank (Haiku) — items are sent as compact JSON (id + kind + title +
     url + short_content_excerpt). Haiku returns strict JSON with `selected_ids`
     (1-3) + `next_step` + `confidence` + short `rationale`. Cache-friendly
     prompt: system + intent slot are invariant; user message contains the
     volatile catalog. Timeout 15s + graceful fallback to deterministic
     scoring (kind-affinity + recency).
  7. Result: 1-3 content URLs + `next_step` enum + confidence float.
     NO side effects (NO mutation, NO audit log, NO event emission). Tool is
     pure READ-ONLY.
  8. Trace event with sanitized payload — best-effort (per
     copilot-observability.md).

Tenant isolation (security boundary):
  * tenant_id MUST NEVER appear in input schema — injected from ctx via
    sales_agent/copilot tool dispatcher.
  * Repos are tenant-scoped at construction (AuthorityVaultRepository).
  * Cross-tenant access returns "empty vault" (no info leak — same shape as
    no-results-found).

Observability (best-effort per copilot-observability.md):
  * Trace event wrapped in try/except + structlog warning. NEVER breaks turn.
  * PII sanitization at the boundary — defense-in-depth: tool scrubs known
    PII keys before sanitize_payload (which may fall back to a truncate-only
    stub when luana_core_observability is not on sys.path).

Cost (per 03-arch-agentic.md § 4.6):
  * 1 Haiku call ~$0.002 (180-260 input tok + 64 output tok).
  * Idempotent replay (1h window): $0 (short-circuit before LLM).
  * Deterministic fallback path: $0 (no LLM).
  * Latency budget: p50 800ms / p99 2s.

Anti-duplication audit (Step 0 GATE pre-write):
  * `find -name "nurture_via_authority_content.py"` → none.
  * `grep -rn "class NurtureViaAuthority"` → only spec docs.
  * No shared authority_vault matcher in `shared/agent_observability/` nor
    `luana_core_*` packages. Comunify-specific vertical surface (creator
    economy nurture playbook). N=1 inline OK.
  * `ForbiddenToolContextError` — N=3 trigger HONOURED. Imported from
    `_exceptions.py` (LIFTED in this same ticket per T-tools-2-result.md
    § "Forward-looking notes"). NO third inline copy.
  * `sanitize_payload` reused from `luana_core_observability` (lazy fallback)
    mirroring T-tools-1 / T-tools-2 siblings.
  * Tier-suggestion / intent-to-kind heuristic IS comunify-specific (creator
    economy authority vault categories). Not lifted.
"""

from __future__ import annotations

import asyncio
import json
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Protocol, runtime_checkable

import structlog
from pydantic import BaseModel, ConfigDict, Field

from src.modules.comunify.agentic.tools._exceptions import ForbiddenToolContextError

logger = structlog.get_logger(__name__)


# ─── Constants ─────────────────────────────────────────────────────────────


# 03-arch-agentic.md § 4.5 — currently NO forbidden contexts for this tool
# (read-only matcher, safe anywhere). Frozenset is exposed for symmetry so
# future-proofing additions are a one-line change.
_FORBIDDEN_CONTEXTS: frozenset[str] = frozenset()

# Idempotency replay window — per 06-tickets.yaml T-tools-3 Constraints test
# case "cached: same intent within 1h → cached response (no LLM call)".
# Note: 03-arch-agentic.md § 4.3 cites 5min in the @register_tool decorator
# `idempotent_via` lambda, but the ticket Constraints explicitly mandate 1h.
# Ticket Constraints win (more recent + more specific to this implementation).
_IDEMPOTENCY_WINDOW = timedelta(hours=1)

# Default LLM model — Haiku per § 4.6 cost budget ($0.002 per call).
_DEFAULT_RANK_MODEL = "anthropic/claude-haiku-4-5"

# Per-LLM-call timeout. 15s ample for Haiku JSON ranking.
_LLM_TIMEOUT_SECONDS = 15.0

# Cap selected items at 1-3 per 03-arch-agentic.md § 4.3.
_MAX_SELECTED_ITEMS = 3

# Cap pre-filter catalog at 20 items sent to LLM (token budget safeguard).
# Vault items beyond top-20 by recency are pruned before the ranking call —
# Haiku still has full freedom within the top-20 candidate set.
_LLM_CATALOG_CAP = 20

# Content excerpt length sent to LLM per item (token budget safeguard).
_LLM_EXCERPT_CHARS = 200

# PII keys scrubbed defensively at tool boundary BEFORE sanitize_payload runs.
# Mirrors qualify_for_cohort.py + link_to_community.py. Lift to shared at N=4.
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
# Phone: international `+`-prefixed OR a "phone-like" run of digits/spaces/dashes
# with a digit cluster of 7+ digits between word boundaries. The pattern is
# anchored with `(?<![\w-])` and `(?![\w-])` to avoid matching INSIDE
# alphanumeric tokens (e.g., UUID substrings like `48b3-8951-68964a91ac7f`
# which contain hex letters AND digits but are NOT phones).
#
# Examples MATCHED:
#   "+1-555-123-4567"   "+44 207 123 4567"   "555-123-4567"
#   "(555) 123-4567"    "5551234567"
# Examples NOT matched:
#   "48b3-8951-68964a91ac7f"  (UUID — letters break the run)
#   "abc1234567def"            (embedded in identifier-like token)
_PHONE_RE = re.compile(
    r"(?<![\w-])"
    r"(?:"
    r"\+\d[\d\s\-().]{6,}\d"  # international "+" prefixed (loose)
    r"|"
    r"\(?\d{2,4}\)?[\s\-]\d{2,4}[\s\-]\d{2,4}(?:[\s\-]\d{2,4})?"  # grouped (XXX) XXX-XXXX
    r"|"
    r"\d{7,15}"  # bare 7-15 digit run with no hex letters around
    r")"
    r"(?![\w-])"
)


# ─── Type aliases ──────────────────────────────────────────────────────────


_IntentCategory = Literal[
    "pricing_guilt",
    "imposter_syndrome",
    "scaling_overload",
    "burnout_concern",
    "fear_first_client",
    "general",
]

_PreferredContentType = Literal["case_study", "press_mention", "podcast_episode", "any"]

_NextStep = Literal["share_case_study", "share_press", "share_podcast", "offer_call", "offer_workshop"]

# Vault item kinds per ComunifyAuthorityVaultItemModel.
_VaultKind = Literal["credentials", "case_studies", "press_mentions", "awards"]


# ─── Intent → vault kind affinity map (comunify-specific heuristic) ────────


# Each intent maps to an ordered tuple of preferred kinds. The first kind in
# the tuple has highest affinity (deterministic-fallback score weight 1.0),
# subsequent kinds get diminishing weights (0.7, 0.5, 0.3).
#
# Rationale per 02-design-agentic.md authority vault scenarios:
#   * pricing_guilt: customer doubts their pricing → case_studies (proof of
#     other creators' successful pricing) > press_mentions (third-party
#     validation) > awards (industry recognition signal).
#   * imposter_syndrome: customer doubts their expertise → press_mentions
#     (external validation strongest signal) > case_studies (peer proof) >
#     awards.
#   * scaling_overload: customer overwhelmed by growth → case_studies
#     (peer outcomes scaling) > press_mentions > podcast (handled via
#     `preferred_content_type` filter, not stored as kind).
#   * burnout_concern: similar to scaling_overload but emotional axis.
#   * fear_first_client: case_studies (first-client wins) strongest.
#   * general: blend all kinds with case_studies first.
_INTENT_KIND_AFFINITY: dict[_IntentCategory, tuple[_VaultKind, ...]] = {
    "pricing_guilt": ("case_studies", "press_mentions", "awards"),
    "imposter_syndrome": ("press_mentions", "case_studies", "awards", "credentials"),
    "scaling_overload": ("case_studies", "press_mentions", "awards"),
    "burnout_concern": ("case_studies", "press_mentions"),
    "fear_first_client": ("case_studies", "press_mentions"),
    "general": ("case_studies", "press_mentions", "awards", "credentials"),
}

# Default next_step suggestion per intent (overridable by LLM).
_DEFAULT_NEXT_STEP_BY_INTENT: dict[_IntentCategory, _NextStep] = {
    "pricing_guilt": "share_case_study",
    "imposter_syndrome": "share_press",
    "scaling_overload": "offer_workshop",
    "burnout_concern": "offer_call",
    "fear_first_client": "share_case_study",
    "general": "offer_call",
}

# Map of preferred_content_type → kind subset (when caller pins a content type).
# `podcast_episode` is NOT a stored kind — it's a content_type label on the
# vault item content JSON. We treat it as a soft hint (filter post-fetch).
_PREFERRED_TYPE_TO_KINDS: dict[_PreferredContentType, tuple[_VaultKind, ...]] = {
    "case_study": ("case_studies",),
    "press_mention": ("press_mentions",),
    "podcast_episode": ("case_studies", "press_mentions"),  # podcasts often live as case studies/press
    "any": ("case_studies", "press_mentions", "awards", "credentials"),
}


# ─── Pydantic schemas (V1 — frozen, schema_version cement) ─────────────────


class NurtureViaAuthorityContentInputV1(BaseModel):
    """Input schema — tenant_id intentionally OMITTED (ctx injection).

    Per 03-arch-agentic.md § 4.3 + .claude/rules/tenant-isolation.md:
    > tenant_id NOT in schema — injected via tool dispatcher from ctx
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    schema_version: Literal[1] = Field(
        default=1,
        description="Schema version cement — bump triggers breaking-change review.",
    )
    lead_id: uuid.UUID = Field(
        ...,
        description="Lead UUID for whom we surface authority content. Used in idempotency cache key + trace event.",
    )
    intent_category: _IntentCategory = Field(
        ...,
        description=(
            "Lead's current intent surface. Drives the kind-affinity heuristic + "
            "the default next_step suggestion. pricing_guilt / imposter_syndrome / "
            "fear_first_client → case studies-first. scaling_overload / "
            "burnout_concern → case studies + press. general → blended."
        ),
    )
    preferred_content_type: _PreferredContentType = Field(
        default="any",
        description=(
            "Optional content-type pin. case_study / press_mention / podcast_episode "
            "narrow the vault query. `any` lets the kind-affinity heuristic decide."
        ),
    )


class NurtureMatchedItemV1(BaseModel):
    """One item surfaced by the matcher, with provenance for the caller."""

    model_config = ConfigDict(frozen=True)

    item_id: uuid.UUID = Field(..., description="ComunifyAuthorityVaultItemModel.id.")
    kind: _VaultKind = Field(..., description="Vault item kind (storage classification).")
    title: str = Field(..., description="Display title of the vault item.")
    url: str = Field(default="", description="Item URL (may be empty string if vault item has no URL).")


class NurtureViaAuthorityContentOutputV1(BaseModel):
    """Result of nurture_via_authority_content invocation.

    Per 03-arch-agentic.md § 4.3. `content_url` is `list[str]` (NOT HttpUrl)
    for testability + tolerance of vault items without URLs — same rationale
    as T-tools-2 deviation #1 (see T-tools-2-result.md § "Deviations from spec").
    """

    model_config = ConfigDict(frozen=True)

    schema_version: Literal[1] = Field(
        default=1,
        description="Schema version cement.",
    )
    content_url: list[str] = Field(
        default_factory=list,
        description=(
            "1-3 vault item URLs (empty strings filtered out). Empty list when "
            "tenant has no vault content matching the intent + preferred type."
        ),
    )
    matched_items: list[NurtureMatchedItemV1] = Field(
        default_factory=list,
        description=(
            "Provenance — 1-3 matched vault items with id + kind + title + url. "
            "Length == len(content_url) when all matched items have a URL; "
            "may exceed when some matched items lack a URL but still surface as "
            "talking points."
        ),
    )
    next_step: _NextStep = Field(
        default="offer_call",
        description=(
            "Recommended follow-up step. Defaults per intent: pricing_guilt → "
            "share_case_study, imposter_syndrome → share_press, "
            "scaling_overload → offer_workshop, etc. LLM may override."
        ),
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="LLM confidence in the match (0-1). 0.0 when fallback engaged with empty vault.",
    )
    rationale: str = Field(
        default="",
        description="Short LLM rationale for the match (≤500 chars, post-truncation).",
    )
    fallback_used: bool = Field(
        default=False,
        description=(
            "True iff LLM ranking failed (timeout/exception/empty response) and "
            "deterministic kind-affinity + recency fallback engaged (per "
            "tessl__graceful-degradation skill)."
        ),
    )
    cache_hit: bool = Field(
        default=False,
        description=(
            "True iff this result was returned from the 1h idempotency cache. "
            "Allows callers to distinguish cached vs fresh invocations in their "
            "trace events without inspecting the trace_event_repo directly."
        ),
    )


# ─── Protocols (DI — decouple from concrete repos / clients) ───────────────


@runtime_checkable
class _AuthorityVaultRepoLike(Protocol):
    """Minimal AuthorityVaultRepository surface consumed by this tool.

    Both methods are tenant-scoped at construction time (see
    `src.modules.comunify.infrastructure.repositories.authority_vault_repository`).
    The protocol intentionally exposes only the read methods this tool needs —
    the tool is READ-ONLY (no save / soft_delete).
    """

    async def list_all(self) -> list[Any]: ...

    async def list_by_kind(self, kind: str, *, limit: int = ..., offset: int = ...) -> list[Any]: ...


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
    """Minimal LiteLLM / Anthropic SDK surface for the Haiku ranking call.

    Caller injects concrete adapter (LiteLLM proxy, Anthropic SDK direct, etc.).
    Mirrors T-tools-1 + T-tools-2 sibling pattern. Lift to shared agentic
    abstractions at N≥4 (per anti-duplication.md cardinal).
    """

    async def acompletion(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        max_tokens: int = ...,
        timeout: float = ...,
    ) -> dict[str, Any]: ...


# ─── sanitize_payload — lazy with fallback (mirror sibling tools) ──────────


def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitize payload via luana_core_observability or truncate-only fallback.

    The fallback is intentionally minimal: PII removal is the caller's job
    via `_scrub_pii` BEFORE this fn (defense-in-depth). When
    `luana_core_observability` is on path, it adds proper PII redaction.
    """
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
        elif isinstance(v, list):
            out[k] = [_scrub_pii(item) if isinstance(item, dict) else item for item in v]
        else:
            out[k] = v
    return out


# ─── Idempotency cache (in-process, per-process) ───────────────────────────


@dataclass
class _CachedNurtureResult:
    """1h idempotency cache entry — keyed by (tenant_id, lead_id, intent, preferred_type)."""

    output: NurtureViaAuthorityContentOutputV1
    cached_at: datetime


# Module-level cache. Multi-worker deploy may emit different results within
# the 1h window across workers — acceptable for v1 (matches T-tools-2 pattern).
# Lift to Redis-backed shared cache when observed pain.
_NURTURE_CACHE: dict[tuple[uuid.UUID, uuid.UUID, _IntentCategory, _PreferredContentType], _CachedNurtureResult] = {}


def _cache_key(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    intent: _IntentCategory,
    preferred: _PreferredContentType,
) -> tuple[uuid.UUID, uuid.UUID, _IntentCategory, _PreferredContentType]:
    return (tenant_id, lead_id, intent, preferred)


def _idempotent_lookup(
    *,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    intent: _IntentCategory,
    preferred: _PreferredContentType,
    now: datetime,
) -> NurtureViaAuthorityContentOutputV1 | None:
    """Return cached output iff within 1h window, else None."""
    key = _cache_key(tenant_id, lead_id, intent, preferred)
    entry = _NURTURE_CACHE.get(key)
    if entry is None:
        return None
    if now - entry.cached_at >= _IDEMPOTENCY_WINDOW:
        _NURTURE_CACHE.pop(key, None)
        return None
    # Re-wrap with cache_hit=True (the cached entry was originally stored with
    # cache_hit=False — flip on read so callers can tell).
    cached = entry.output
    return cached.model_copy(update={"cache_hit": True})


def _idempotent_store(
    *,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    intent: _IntentCategory,
    preferred: _PreferredContentType,
    output: NurtureViaAuthorityContentOutputV1,
    now: datetime,
) -> None:
    _NURTURE_CACHE[_cache_key(tenant_id, lead_id, intent, preferred)] = _CachedNurtureResult(
        output=output,
        cached_at=now,
    )


# ─── Vault fetching + pre-filtering ─────────────────────────────────────────


async def _fetch_candidate_items(
    *,
    vault_repo: _AuthorityVaultRepoLike,
    intent: _IntentCategory,
    preferred: _PreferredContentType,
) -> list[Any]:
    """Fetch + pre-filter vault items.

    Strategy:
      1. If `preferred` pins a specific content type → query `list_by_kind` for
         the kinds in `_PREFERRED_TYPE_TO_KINDS[preferred]`.
      2. Else use `_INTENT_KIND_AFFINITY[intent]` to query each kind in order.
      3. Concatenate, dedupe by id, cap at `_LLM_CATALOG_CAP`.
      4. If still empty → fall back to `list_all()` (broader query, tenant-scoped).

    All queries are tenant-scoped at construction time (repo) — cross-tenant
    leak impossible by construction.
    """
    # Determine the kind universe to fetch
    if preferred != "any":
        kinds_to_fetch: tuple[_VaultKind, ...] = _PREFERRED_TYPE_TO_KINDS[preferred]
    else:
        kinds_to_fetch = _INTENT_KIND_AFFINITY[intent]

    seen_ids: set[uuid.UUID] = set()
    collected: list[Any] = []

    for kind in kinds_to_fetch:
        if len(collected) >= _LLM_CATALOG_CAP:
            break
        try:
            items = await vault_repo.list_by_kind(kind, limit=_LLM_CATALOG_CAP, offset=0)
        except Exception as exc:  # noqa: BLE001 — best-effort per-kind read
            logger.warning(
                "nurture_via_authority_content.vault_list_by_kind_failed",
                exc=str(exc),
                kind=kind,
                intent=intent,
            )
            continue
        for item in items:
            if len(collected) >= _LLM_CATALOG_CAP:
                break
            item_id = getattr(item, "id", None)
            if item_id is None or item_id in seen_ids:
                continue
            seen_ids.add(item_id)
            collected.append(item)

    # Fallback to list_all if pre-filter produced nothing (tenant may have only
    # awards/credentials when intent prefers case_studies — surface what we have)
    if not collected:
        try:
            collected = await vault_repo.list_all()
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "nurture_via_authority_content.vault_list_all_failed",
                exc=str(exc),
                intent=intent,
            )
            collected = []

    return collected[:_LLM_CATALOG_CAP]


def _item_to_excerpt(item: Any) -> dict[str, Any]:
    """Serialize a vault item to a compact dict suitable for the LLM prompt.

    Strips PII via `_scrub_pii` on the `content` JSONB before truncation.
    """
    raw_content = getattr(item, "content", {}) or {}
    if not isinstance(raw_content, dict):
        raw_content = {"value": str(raw_content)}
    scrubbed = _scrub_pii(raw_content)
    excerpt_text = json.dumps(scrubbed, sort_keys=True, default=str)
    if len(excerpt_text) > _LLM_EXCERPT_CHARS:
        excerpt_text = excerpt_text[:_LLM_EXCERPT_CHARS] + "..."

    return {
        "id": str(getattr(item, "id", "")),
        "kind": str(getattr(item, "kind", "")),
        "title": str(getattr(item, "title", "") or "")[:200],
        "url": str(getattr(item, "url", "") or ""),
        "excerpt": excerpt_text,
    }


# ─── LLM ranking + deterministic fallback ──────────────────────────────────


def _build_rank_messages(
    *,
    intent: _IntentCategory,
    preferred: _PreferredContentType,
    catalog: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Build Haiku messages for ranking.

    Cache-friendly: system message is invariant (no tenant_id, no timestamps,
    no PII). User message contains the volatile catalog + intent. Per
    sales-agent-brand-voice.md slot architecture, the system slot is the
    cache prefix candidate when the dispatcher batches calls per tenant.
    """
    system = (
        "You are an authority-content matcher. Given a lead's intent and a "
        "small catalog of vault items (case studies, press mentions, awards, "
        "credentials), pick 1-3 items most likely to alleviate the intent. "
        "Output STRICT JSON with keys: "
        '"selected_ids" (list of 1-3 strings from the input ids), '
        '"next_step" (one of '
        '["share_case_study","share_press","share_podcast","offer_call","offer_workshop"]), '
        '"rationale" (short string ≤200 chars), '
        '"confidence" (float 0-1). '
        "NO prose outside JSON."
    )

    user_payload: dict[str, Any] = {
        "intent_category": intent,
        "preferred_content_type": preferred,
        "catalog": catalog,
    }
    user = json.dumps(user_payload, sort_keys=True, default=str)

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _parse_rank_response(
    response: dict[str, Any],
    *,
    catalog_ids: set[str],
) -> tuple[list[str], _NextStep, str, float]:
    """Parse Haiku response → (selected_ids, next_step, rationale, confidence).

    Raises ValueError on invalid shape (caller falls back to deterministic ranking).
    """
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

    ids_raw = parsed.get("selected_ids", [])
    if not isinstance(ids_raw, list):
        raise ValueError("selected_ids is not a list")
    valid_ids: list[str] = []
    for sid in ids_raw:
        if isinstance(sid, str) and sid in catalog_ids:
            valid_ids.append(sid)
    if not valid_ids:
        raise ValueError("no valid selected_ids in response (none match catalog)")
    valid_ids = valid_ids[:_MAX_SELECTED_ITEMS]

    next_step_raw = parsed.get("next_step")
    allowed_steps: set[_NextStep] = {
        "share_case_study",
        "share_press",
        "share_podcast",
        "offer_call",
        "offer_workshop",
    }
    if not isinstance(next_step_raw, str) or next_step_raw not in allowed_steps:
        raise ValueError(f"next_step invalid: {next_step_raw!r}")
    next_step: _NextStep = next_step_raw  # type: ignore[assignment]

    rationale = str(parsed.get("rationale", ""))[:500]
    confidence = float(parsed.get("confidence", 0.0))
    confidence = max(0.0, min(1.0, confidence))
    return (valid_ids, next_step, rationale, confidence)


async def _rank_via_llm(
    *,
    llm_client: _LLMClientLike,
    model: str,
    intent: _IntentCategory,
    preferred: _PreferredContentType,
    catalog: list[dict[str, Any]],
    timeout_seconds: float = _LLM_TIMEOUT_SECONDS,
) -> tuple[list[str], _NextStep, str, float]:
    """LLM ranking call. Raises on any failure (caller falls back)."""
    messages = _build_rank_messages(intent=intent, preferred=preferred, catalog=catalog)
    catalog_ids = {entry["id"] for entry in catalog if entry.get("id")}
    response = await asyncio.wait_for(
        llm_client.acompletion(
            model=model,
            messages=messages,
            max_tokens=256,
            timeout=timeout_seconds,
        ),
        timeout=timeout_seconds,
    )
    return _parse_rank_response(response, catalog_ids=catalog_ids)


def _deterministic_rank(
    *,
    intent: _IntentCategory,
    catalog: list[Any],
) -> tuple[list[str], _NextStep, str, float]:
    """Heuristic fallback ranking when LLM fails.

    Strategy:
      1. Group items by kind.
      2. Score each item: kind-affinity weight (per `_INTENT_KIND_AFFINITY`)
         multiplied by recency factor (more recent → higher).
      3. Pick top-3.
      4. next_step = `_DEFAULT_NEXT_STEP_BY_INTENT[intent]`.
      5. confidence = 0.4 (low — deterministic heuristic, not LLM-judged).
    """
    if not catalog:
        return (
            [],
            _DEFAULT_NEXT_STEP_BY_INTENT[intent],
            "No vault content available for fallback ranking.",
            0.0,
        )

    affinity_order = _INTENT_KIND_AFFINITY[intent]
    # Weight: first kind=1.0, second=0.7, third=0.5, fourth=0.3, rest=0.1
    weights = {kind: max(0.1, 1.0 - (idx * 0.3)) for idx, kind in enumerate(affinity_order)}

    # Sort by (kind weight, recency-ish via created_at)
    def _score(item: Any) -> tuple[float, datetime]:
        kind = getattr(item, "kind", "")
        weight = weights.get(kind, 0.05)
        created = getattr(item, "created_at", datetime.min.replace(tzinfo=timezone.utc))
        if not isinstance(created, datetime):
            created = datetime.min.replace(tzinfo=timezone.utc)
        elif created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        return (weight, created)

    ranked = sorted(catalog, key=_score, reverse=True)
    selected = ranked[:_MAX_SELECTED_ITEMS]
    selected_ids = [str(getattr(item, "id", "")) for item in selected if getattr(item, "id", None) is not None]
    return (
        selected_ids,
        _DEFAULT_NEXT_STEP_BY_INTENT[intent],
        f"Deterministic kind-affinity + recency match for intent '{intent}'.",
        0.4,
    )


# ─── Best-effort observability helpers ─────────────────────────────────────


async def _emit_trace_event_best_effort(
    trace_event_repo: _TraceEventRepoLike | None,
    *,
    tenant_id: uuid.UUID,
    turn_id: uuid.UUID | None,
    span_id: uuid.UUID | None,
    lead_id: uuid.UUID,
    intent: _IntentCategory,
    preferred: _PreferredContentType,
    result: NurtureViaAuthorityContentOutputV1,
    duration_ms: int | None,
    cache_hit: bool,
) -> None:
    """Best-effort trace event — NEVER raises (copilot-observability.md)."""
    if trace_event_repo is None or turn_id is None or span_id is None:
        return
    try:
        scrubbed = _scrub_pii(
            {
                "lead_id": str(lead_id),
                "intent_category": intent,
                "preferred_content_type": preferred,
                "selected_item_ids": [str(it.item_id) for it in result.matched_items],
                "selected_kinds": [it.kind for it in result.matched_items],
                "next_step": result.next_step,
                "confidence": result.confidence,
                "fallback_used": result.fallback_used,
                "cache_hit": cache_hit,
                "n_returned": len(result.content_url),
            }
        )
        payload = _sanitize_payload(scrubbed)
        trace_event_repo.add(
            tenant_id=tenant_id,
            turn_id=turn_id,
            span_id=span_id,
            event_type="tool.nurture_via_authority_content",
            name="nurture_via_authority_content",
            data=payload,
            duration_ms=duration_ms,
            status="ok",
        )
    except Exception as exc:  # noqa: BLE001 — best-effort observability
        logger.warning(
            "nurture_via_authority_content.trace_event_persist_failed",
            exc=str(exc),
            lead_id=str(lead_id),
            tenant_id=str(tenant_id),
            intent=intent,
        )


# ─── Handler ────────────────────────────────────────────────────────────────


async def nurture_via_authority_content(
    input: NurtureViaAuthorityContentInputV1,
    *,
    tenant_id: uuid.UUID,
    vault_repo: _AuthorityVaultRepoLike,
    llm_client: _LLMClientLike,
    trace_event_repo: _TraceEventRepoLike | None = None,
    turn_id: uuid.UUID | None = None,
    span_id: uuid.UUID | None = None,
    context: str | None = None,
    rank_model: str = _DEFAULT_RANK_MODEL,
    llm_timeout_seconds: float = _LLM_TIMEOUT_SECONDS,
    _now: datetime | None = None,
) -> NurtureViaAuthorityContentOutputV1:
    """Surface 1-3 authority_vault items matching a lead's intent.

    See module docstring for full semantics + spec refs.

    Parameters
    ----------
    input
        Pydantic input. `tenant_id` NEVER here — security boundary.
    tenant_id
        Ctx-injected by sales_agent/copilot tool dispatcher.
    vault_repo
        Tenant-scoped AuthorityVaultRepository (read-only methods consumed).
    llm_client
        Pluggable LLM client (LiteLLM/Anthropic SDK adapter). Used for Haiku
        ranking. On failure → deterministic fallback engages.
    trace_event_repo
        Optional — when supplied, tool records one observability trace event.
    turn_id / span_id
        Correlation IDs required iff trace_event_repo is supplied.
    context
        Caller's runtime context label. Forbidden-context guard uses it
        (currently no forbidden contexts for this tool — exposed for symmetry).
    rank_model
        Wire model name for the Haiku ranking call. Defaults to
        `anthropic/claude-haiku-4-5`.
    llm_timeout_seconds
        Per-LLM-call timeout. Default 15s.
    _now
        Test-only injection point for the "current" datetime — production
        callers pass nothing and the tool uses `datetime.now(timezone.utc)`.

    Returns
    -------
    NurtureViaAuthorityContentOutputV1 — see schema docstring.

    Raises
    ------
    ForbiddenToolContextError
        If context is in `_FORBIDDEN_CONTEXTS` — defense-in-depth.
        (None currently — function exposed for future-proofing.)
    """
    started = _now or datetime.now(timezone.utc)

    # ── Step 1 — Forbidden-context guard (currently no-op; future-proof) ──
    if context is not None and context in _FORBIDDEN_CONTEXTS:
        raise ForbiddenToolContextError(context, tool_name="nurture_via_authority_content")

    intent = input.intent_category
    preferred = input.preferred_content_type

    # ── Step 2 — Idempotency replay (1h window) ────────────────────────────
    cached = _idempotent_lookup(
        tenant_id=tenant_id,
        lead_id=input.lead_id,
        intent=intent,
        preferred=preferred,
        now=started,
    )
    if cached is not None:
        logger.info(
            "nurture_via_authority_content.idempotent_replay",
            tenant_id=str(tenant_id),
            lead_id=str(input.lead_id),
            intent=intent,
            preferred=preferred,
        )
        duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
        await _emit_trace_event_best_effort(
            trace_event_repo,
            tenant_id=tenant_id,
            turn_id=turn_id,
            span_id=span_id,
            lead_id=input.lead_id,
            intent=intent,
            preferred=preferred,
            result=cached,
            duration_ms=duration_ms,
            cache_hit=True,
        )
        return cached

    # ── Step 3 — Fetch + pre-filter vault items ────────────────────────────
    catalog_items = await _fetch_candidate_items(
        vault_repo=vault_repo,
        intent=intent,
        preferred=preferred,
    )

    # Empty vault — terminal fallback (no LLM, confidence 0.0)
    if not catalog_items:
        result = NurtureViaAuthorityContentOutputV1(
            content_url=[],
            matched_items=[],
            next_step=_DEFAULT_NEXT_STEP_BY_INTENT[intent],
            confidence=0.0,
            rationale="Tenant has no authority_vault content matching intent + preferred type.",
            fallback_used=True,
            cache_hit=False,
        )
        # Do NOT cache empty-vault result (cheap to re-evaluate; vault may fill).
        duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
        await _emit_trace_event_best_effort(
            trace_event_repo,
            tenant_id=tenant_id,
            turn_id=turn_id,
            span_id=span_id,
            lead_id=input.lead_id,
            intent=intent,
            preferred=preferred,
            result=result,
            duration_ms=duration_ms,
            cache_hit=False,
        )
        return result

    # ── Step 4 — LLM ranking with deterministic fallback ───────────────────
    catalog_excerpts = [_item_to_excerpt(it) for it in catalog_items]
    by_id: dict[str, Any] = {str(getattr(it, "id", "")): it for it in catalog_items}

    fallback_used = False
    try:
        selected_ids, next_step, rationale, confidence = await _rank_via_llm(
            llm_client=llm_client,
            model=rank_model,
            intent=intent,
            preferred=preferred,
            catalog=catalog_excerpts,
            timeout_seconds=llm_timeout_seconds,
        )
    except (asyncio.TimeoutError, Exception) as exc:  # noqa: BLE001 — broad to engage fallback
        fallback_used = True
        logger.warning(
            "nurture_via_authority_content.llm_ranking_failed_fallback_engaged",
            exc=str(exc),
            exc_type=type(exc).__name__,
            tenant_id=str(tenant_id),
            lead_id=str(input.lead_id),
            model=rank_model,
            intent=intent,
        )
        selected_ids, next_step, rationale, confidence = _deterministic_rank(
            intent=intent,
            catalog=catalog_items,
        )

    # ── Step 5 — Materialize matched items + URL list ──────────────────────
    matched: list[NurtureMatchedItemV1] = []
    urls: list[str] = []
    for sid in selected_ids:
        item = by_id.get(sid)
        if item is None:
            continue
        item_id = getattr(item, "id", None)
        if item_id is None:
            continue
        url_value = str(getattr(item, "url", "") or "")
        matched.append(
            NurtureMatchedItemV1(
                item_id=item_id,
                kind=getattr(item, "kind", "case_studies"),  # type: ignore[arg-type]
                title=str(getattr(item, "title", "") or "")[:200],
                url=url_value,
            )
        )
        if url_value:
            urls.append(url_value)

    result = NurtureViaAuthorityContentOutputV1(
        content_url=urls,
        matched_items=matched,
        next_step=next_step,
        confidence=confidence,
        rationale=rationale,
        fallback_used=fallback_used,
        cache_hit=False,
    )

    # ── Step 6 — Cache (1h idempotency) ────────────────────────────────────
    # Only cache successful results (avoid pinning empty-vault state).
    _idempotent_store(
        tenant_id=tenant_id,
        lead_id=input.lead_id,
        intent=intent,
        preferred=preferred,
        output=result,
        now=started,
    )

    # ── Step 7 — Best-effort trace event ───────────────────────────────────
    duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    await _emit_trace_event_best_effort(
        trace_event_repo,
        tenant_id=tenant_id,
        turn_id=turn_id,
        span_id=span_id,
        lead_id=input.lead_id,
        intent=intent,
        preferred=preferred,
        result=result,
        duration_ms=duration_ms,
        cache_hit=False,
    )

    return result


__all__ = [
    "ForbiddenToolContextError",
    "NurtureMatchedItemV1",
    "NurtureViaAuthorityContentInputV1",
    "NurtureViaAuthorityContentOutputV1",
    "nurture_via_authority_content",
]
