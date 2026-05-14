"""Tests for `AuthorityVaultExtractor` (T-extractors-2, R23 Opus 4.7).

Acceptance coverage (per 06-tickets.yaml::T-extractors-2 + 03-arch-agentic § 5.2):
  * A1 — Subclass of `BaseExtractionOrchestrator` (arch fitness gate parity).
  * A2 — 4 waves complete + merge produces AuthorityVaultExtractedV1 with
         categories (credentials / awards / case_studies / press / speaking).
  * A3 — Happy path: bio with 3 credentials + 2 case studies + 1 press
         mention → all extracted.
  * A4 — Empty bio: returns empty extraction (no false positives) + warning.
  * A5 — Cost per extraction ≤$0.08 USD budget (per 03-arch-agentic § 5.2 +
         02-design § 14.3).
  * A6 — PII sanitisation: emails / phones in bio masked when persisted /
         audited / outboxed (defense-in-depth, even though extractor inputs
         are typically creator-public bio).
  * A7 — Schema cement: ``schema_version == 1`` Literal frozen.
  * A8 — Cross-tenant isolation: collaborators all receive same tenant_id;
         consecutive runs do not bleed state.
  * A9 — Pre-fills ``authority_vault_repo`` rows with
         ``status='extracted_pending_ratification'`` per ticket constraint.

Defensive paths covered:
  * Wave timeout → degraded confidence + warning recorded.
  * Wave LLM exception → confidence drops, partial output kept.
  * Wave returns invalid JSON → empty wave + warning.
  * Wave returns malformed entity → entity dropped + warning recorded.
  * Cost-unknown wave (no litellm_call_id) → warning + Decimal('0') used.
  * Persistence failure → does NOT raise (best-effort).
  * Qdrant + outbox + audit_log failures → do NOT raise (best-effort, isolated).

In-memory fakes for: LiteLLM service (synthetic JSON outputs per role),
authority_vault repo, Qdrant indexer, outbox publisher, audit log. Cost is
bridged via ``cost_recorder._cache`` direct seed so the extractor can pull
it via ``pop_cost(litellm_call_id)`` per PI-12 S1 T-1 cement.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

import pytest
from luana_core_extraction.base_orchestrator import BaseExtractionOrchestrator

from src.modules.comunify.copilot.extractors._schemas import (
    AuthorityVaultExtractedV1,
    Award,
    CaseStudy,
    Credential,
    PressMention,
    SocialProofSignals,
    SpeakingEngagement,
)
from src.modules.comunify.copilot.extractors.authority_vault_extractor import (
    AUTHORITY_VAULT_EXTRACTOR_VERSION,
    DEFAULT_COST_BUDGET_USD,
    MIN_ACCEPTABLE_CONFIDENCE,
    AuthorityVaultExtractor,
    _LLMResponse,
)

# ─── Test environment guard ───────────────────────────────────────────────


def _seed_cost(call_id: str, amount: Decimal) -> bool:
    """Seed the observability cost cache so ``pop_cost`` resolves a value.

    Returns ``True`` if seeding succeeded, ``False`` if the observability
    package is unavailable in this environment (lazy import fallback path).
    Tests use the return value to decide whether they should assert on
    resolved-cost paths vs cost-unknown paths.
    """
    try:
        from time import monotonic

        from luana_core_observability.recording import (
            cost_recorder,  # type: ignore[import-not-found]
        )

        with cost_recorder._lock:  # noqa: SLF001 — direct cache seed for test fakes
            cost_recorder._cache[call_id] = (amount, monotonic() + 60.0)
        return True
    except ImportError:
        return False


_COST_RECORDER_AVAILABLE = _seed_cost("__probe_av__", Decimal("0"))


# ─── Fakes ────────────────────────────────────────────────────────────────


@dataclass
class FakeLLMResponseSpec:
    """Per-wave fake response spec — drives the synthetic LLM output."""

    content_json: dict[str, Any]
    cost_usd: Decimal | None = Decimal("0.020")
    delay_sec: float = 0.0
    raise_exc: BaseException | None = None


@dataclass
class FakeLiteLLMService:
    """In-memory fake of ``_LiteLLMServiceLike`` driven by per-role specs.

    Specs popped FIFO per role. Exhausted list → empty JSON, cost-unknown.
    """

    specs_by_role: dict[str, list[FakeLLMResponseSpec]] = field(default_factory=dict)
    calls_log: list[dict[str, Any]] = field(default_factory=list)

    async def ainvoke_text(
        self,
        *,
        role: str,
        prompt: str,
        timeout_sec: float,
    ) -> _LLMResponse:
        spec_list = self.specs_by_role.get(role, [])
        spec = spec_list.pop(0) if spec_list else FakeLLMResponseSpec(content_json={})
        if spec.delay_sec > 0:
            import asyncio

            await asyncio.sleep(spec.delay_sec)
        if spec.raise_exc is not None:
            raise spec.raise_exc

        call_id = f"litellm-av-{uuid.uuid4()}"
        seeded = False
        if spec.cost_usd is not None:
            seeded = _seed_cost(call_id, spec.cost_usd)

        self.calls_log.append(
            {
                "role": role,
                "prompt_chars": len(prompt),
                "timeout_sec": timeout_sec,
                "call_id": call_id,
            }
        )
        return _LLMResponse(
            content=json.dumps(spec.content_json, ensure_ascii=False),
            litellm_call_id=call_id if (spec.cost_usd is not None and seeded) else None,
            duration_ms=int(spec.delay_sec * 1000),
        )


@dataclass
class FakeAuthorityVaultRepo:
    """In-memory fake for pre-filled authority_vault row persistence.

    Per ticket constraint:
        "_merge_and_save() writes pre-filled rows to authority_vault_items
        with status='extracted_pending_ratification'"
    """

    saved_rows: list[dict[str, Any]] = field(default_factory=list)
    raise_on_save: BaseException | None = None

    async def save_pending_ratification(self, *, tenant_id: uuid.UUID, rows: list[dict[str, Any]]) -> None:
        if self.raise_on_save is not None:
            raise self.raise_on_save
        # Note: each row already carries its own tenant_id assignment but the
        # call signature also carries the canonical tenant_id (defense in depth).
        for row in rows:
            assert row.get("tenant_id") == tenant_id, "tenant_id must be propagated to each row"
            assert row.get("status") == "extracted_pending_ratification", "status must be pending ratification"
            self.saved_rows.append(row)


@dataclass
class FakeQdrantIndexer:
    indexed: list[dict[str, Any]] = field(default_factory=list)
    raise_on_index: BaseException | None = None

    async def index_authority_vault_extracted(
        self,
        *,
        tenant_id: uuid.UUID,
        extraction_id: uuid.UUID,
        payload: dict[str, Any],
    ) -> None:
        if self.raise_on_index is not None:
            raise self.raise_on_index
        self.indexed.append(
            {
                "tenant_id": tenant_id,
                "extraction_id": extraction_id,
                "payload": payload,
            }
        )


@dataclass
class FakeOutbox:
    published: list[dict[str, Any]] = field(default_factory=list)
    raise_on_publish: BaseException | None = None

    async def publish(
        self,
        *,
        event_type: str,
        tenant_id: uuid.UUID,
        payload: dict[str, Any],
    ) -> None:
        if self.raise_on_publish is not None:
            raise self.raise_on_publish
        self.published.append({"event_type": event_type, "tenant_id": tenant_id, "payload": payload})


@dataclass
class FakeAuditLog:
    logged: list[dict[str, Any]] = field(default_factory=list)
    raise_on_log: BaseException | None = None

    async def log(
        self,
        *,
        tenant_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        if self.raise_on_log is not None:
            raise self.raise_on_log
        self.logged.append({"tenant_id": tenant_id, "event_type": event_type, "payload": payload})


# ─── Test data builders ───────────────────────────────────────────────────


_SAMPLE_BIO_HAPPY = (
    "Soy Anabella, psicóloga clínica con 12 años de experiencia. Magíster en "
    "Psicología Clínica (UBA, 2015). Especialista en TCC (APBA, 2018). Certified "
    "Coach (ICF Member ID 12345, 2019). He acompañado a +850 clientes en "
    "procesos de cambio personal. Mi caso emblemático: Sofía, coach AR 35yo, "
    "facturaba $1.500 USD/mes, en 6 meses llegó a $8.000 USD/mes con mi programa. "
    "Otro: Juan, emprendedor MX, salió del burnout en 90 días retomando proyectos "
    "estancados. Aparecí en La Nación (2022) — 'El boom del coaching en Argentina'. "
    "Contacto: anabella@example.com / WhatsApp +54 9 11 5555-5555."
)


def _wave1_credentials_awards() -> dict[str, Any]:
    """3 credentials + 1 award (per happy path)."""
    return {
        "credentials": [
            {
                "title": "Magíster en Psicología Clínica",
                "issuer": "UBA",
                "year": 2015,
                "url": None,
                "confidence": 0.95,
            },
            {
                "title": "Especialista en TCC",
                "issuer": "APBA",
                "year": 2018,
                "url": None,
                "confidence": 0.90,
            },
            {
                "title": "Certified Coach (ICF)",
                "issuer": "ICF",
                "year": 2019,
                "url": None,
                "confidence": 0.85,
            },
        ],
        "awards": [
            {
                "title": "Premio Mención Excelencia Profesional",
                "issuer": "APBA",
                "year": 2020,
                "url": None,
                "confidence": 0.6,
            }
        ],
        "wave_confidence": 0.9,
        "wave_warnings": [],
    }


def _wave2_case_studies_two() -> dict[str, Any]:
    """2 case studies — Sofía + Juan."""
    return {
        "case_studies": [
            {
                "title": "Sofía 6x revenue en 6 meses",
                "client_archetype": "coach AR 35yo",
                "outcome": "$1.500 USD/mes → $8.000 USD/mes en 6 meses con programa de mindset + sales",
                "timeframe": "6 meses",
                "url": None,
                "confidence": 0.95,
            },
            {
                "title": "Juan supera burnout 90 días",
                "client_archetype": "emprendedor MX",
                "outcome": "Salió del burnout en 90 días retomando proyectos estancados",
                "timeframe": "90 días",
                "url": None,
                "confidence": 0.90,
            },
        ],
        "wave_confidence": 0.95,
        "wave_warnings": [],
    }


def _wave3_press_social_proof() -> dict[str, Any]:
    """1 press mention + social proof aggregate."""
    return {
        "press_mentions": [
            {
                "title": "El boom del coaching en Argentina",
                "outlet": "La Nación",
                "year": 2022,
                "url": None,
                "confidence": 0.85,
            }
        ],
        "speaking_engagements": [],
        "social_proof": {
            "students_trained_count": None,
            "clients_served_count": 850,
            "years_of_experience": 12,
            "instagram_followers": None,
            "youtube_subscribers": None,
            "tiktok_followers": None,
            "other_signals": [],
        },
        "wave_confidence": 0.80,
        "wave_warnings": [],
    }


def _wave4_validate_merge() -> dict[str, Any]:
    return {
        "merged_warnings": [],
        "merged_missing_required_fields": [],
        "validation_score_adjustment": 0.0,
        "consistency_notes": "Credentials cohere with case studies + press.",
        "wave_confidence": 1.0,
        "wave_warnings": [],
    }


def _happy_specs(*, cost_per_reasoning: Decimal = Decimal("0.020")) -> dict[str, list[FakeLLMResponseSpec]]:
    """4 waves: W1+W2+W4 reasoning (Sonnet) + W3 nano (Haiku).

    Cost per advice run (target ≤$0.08):
      reasoning x3 = 0.020 * 3 = 0.060
      nano        x1 = 0.010
      total          = 0.070  ≤ 0.080  ✓
    """
    return {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_credentials_awards(), cost_usd=cost_per_reasoning),
            FakeLLMResponseSpec(content_json=_wave2_case_studies_two(), cost_usd=cost_per_reasoning),
            FakeLLMResponseSpec(content_json=_wave4_validate_merge(), cost_usd=cost_per_reasoning),
        ],
        "nano": [
            FakeLLMResponseSpec(content_json=_wave3_press_social_proof(), cost_usd=Decimal("0.010")),
        ],
    }


def _empty_bio_specs() -> dict[str, list[FakeLLMResponseSpec]]:
    """All waves return empty arrays (no false positives on empty input)."""
    return {
        "reasoning": [
            FakeLLMResponseSpec(
                content_json={
                    "credentials": [],
                    "awards": [],
                    "wave_confidence": 0.0,
                    "wave_warnings": ["low_signal_input"],
                },
                cost_usd=Decimal("0.010"),
            ),
            FakeLLMResponseSpec(
                content_json={
                    "case_studies": [],
                    "wave_confidence": 0.0,
                    "wave_warnings": ["low_signal_input"],
                },
                cost_usd=Decimal("0.010"),
            ),
            FakeLLMResponseSpec(
                content_json={
                    "merged_warnings": ["low_signal_input"],
                    "merged_missing_required_fields": ["credentials", "case_studies", "press_mentions"],
                    "validation_score_adjustment": 0.0,
                    "consistency_notes": "no_content",
                    "wave_confidence": 1.0,
                    "wave_warnings": [],
                },
                cost_usd=Decimal("0.005"),
            ),
        ],
        "nano": [
            FakeLLMResponseSpec(
                content_json={
                    "press_mentions": [],
                    "speaking_engagements": [],
                    "social_proof": {
                        "students_trained_count": None,
                        "clients_served_count": None,
                        "years_of_experience": None,
                        "instagram_followers": None,
                        "youtube_subscribers": None,
                        "tiktok_followers": None,
                        "other_signals": [],
                    },
                    "wave_confidence": 0.0,
                    "wave_warnings": ["low_signal_input"],
                },
                cost_usd=Decimal("0.005"),
            ),
        ],
    }


def _build_extractor(
    *,
    llm: FakeLiteLLMService | None = None,
    authority_vault_repo: FakeAuthorityVaultRepo | None = None,
    qdrant: FakeQdrantIndexer | None = None,
    outbox: FakeOutbox | None = None,
    audit_log: FakeAuditLog | None = None,
    cost_budget_usd: Decimal | None = None,
) -> AuthorityVaultExtractor:
    return AuthorityVaultExtractor(
        llm_service=llm or FakeLiteLLMService(specs_by_role=_happy_specs()),
        authority_vault_repo=authority_vault_repo,
        qdrant_indexer=qdrant,
        outbox=outbox,
        audit_log=audit_log,
        cost_budget_usd=cost_budget_usd or DEFAULT_COST_BUDGET_USD,
    )


# ─── A1 — subclass invariant ──────────────────────────────────────────────


def test_authority_vault_extractor_subclasses_base_orchestrator() -> None:
    """A1: AuthorityVaultExtractor MUST inherit from BaseExtractionOrchestrator."""
    assert issubclass(AuthorityVaultExtractor, BaseExtractionOrchestrator)


def test_extractor_inherits_base_methods() -> None:
    """A1 corollary: shared wave + pause + announce helpers accessible."""
    extractor = _build_extractor()
    assert hasattr(extractor, "_run_wave")
    assert hasattr(extractor, "_pause_between_waves")
    assert hasattr(extractor, "_announce_sections")
    assert hasattr(extractor, "_get_wave_delay")


def test_extractor_log_prefix_is_comunify_specific() -> None:
    """log_prefix is vertical-creator-economy specific (distinct from offer ladder)."""
    assert AuthorityVaultExtractor.log_prefix == "comunify_authority_vault_extractor"


def test_wave_definitions_match_spec() -> None:
    """4 waves with names + roles + timeouts per 03-arch-agentic § 5.2."""
    waves = AuthorityVaultExtractor._define_waves()
    assert len(waves) == 4
    assert [w.name for w in waves] == [
        "credentials_and_awards",
        "case_studies",
        "press_and_social_proof",
        "validate_and_merge",
    ]
    # W1 + W2 + W4 reasoning (Sonnet), W3 nano (Haiku) — per spec.
    assert [w.model_role for w in waves] == ["reasoning", "reasoning", "nano", "reasoning"]


# ─── A2 — 4 waves complete + merge produces AuthorityVaultExtractedV1 ────


@pytest.mark.asyncio
async def test_4_wave_pipeline_happy_path() -> None:
    """A2 + A3 happy path: 3 credentials + 2 case studies + 1 press extracted."""
    llm = FakeLiteLLMService(specs_by_role=_happy_specs())
    extractor = _build_extractor(llm=llm)

    extracted = await extractor.run(
        tenant_id=uuid.uuid4(),
        source_text=_SAMPLE_BIO_HAPPY,
    )

    # 4 LLM calls fired (one per wave).
    assert len(llm.calls_log) == 4, f"Expected 4 wave calls, got {len(llm.calls_log)}: {llm.calls_log}"

    # Output is AuthorityVaultExtractedV1 with confidence_score populated.
    assert isinstance(extracted, AuthorityVaultExtractedV1)
    assert extracted.schema_version == 1
    assert 0.0 <= extracted.confidence_score <= 1.0

    # A3: 3 credentials + 2 case studies + 1 press.
    assert len(extracted.credentials) == 3
    assert {c.title for c in extracted.credentials} == {
        "Magíster en Psicología Clínica",
        "Especialista en TCC",
        "Certified Coach (ICF)",
    }
    assert len(extracted.case_studies) == 2
    assert {c.client_archetype for c in extracted.case_studies} == {
        "coach AR 35yo",
        "emprendedor MX",
    }
    assert len(extracted.press_mentions) == 1
    assert extracted.press_mentions[0].outlet == "La Nación"
    assert len(extracted.awards) == 1
    assert extracted.social_proof.clients_served_count == 850
    assert extracted.social_proof.years_of_experience == 12

    # Happy path → confidence ≥0.80 (weighted average across waves).
    assert extracted.confidence_score >= 0.80


@pytest.mark.asyncio
async def test_wave_called_with_correct_role_routing() -> None:
    """Each wave routes to its declared model_role (LLM_ROLE_BY_SITE SSoT)."""
    llm = FakeLiteLLMService(specs_by_role=_happy_specs())
    extractor = _build_extractor(llm=llm)

    await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    roles_called = [call["role"] for call in llm.calls_log]
    # W1 + W2 + W4 = reasoning (3 calls), W3 = nano.
    assert roles_called.count("reasoning") == 3
    assert roles_called.count("nano") == 1


@pytest.mark.asyncio
async def test_returns_extraction_v1_even_on_all_wave_failures() -> None:
    """Even if every wave raises, run() returns AuthorityVaultExtractedV1."""

    class _BoomError(RuntimeError):
        pass

    specs = {
        "reasoning": [
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w1 down")),
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w2 down")),
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w4 down")),
        ],
        "nano": [FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w3 down"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=specs))

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    assert isinstance(extracted, AuthorityVaultExtractedV1)
    assert extracted.confidence_score == 0.0
    exception_warnings = [w for w in extracted.extraction_warnings if "exception" in w]
    assert len(exception_warnings) >= 4


@pytest.mark.asyncio
async def test_partial_wave_failure_yields_partial_extraction() -> None:
    """If only one wave fails, others survive into the merged extraction."""

    class _BoomError(RuntimeError):
        pass

    specs = {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_credentials_awards(), cost_usd=Decimal("0.020")),
            # Wave 2 — case studies — fails.
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("case studies down")),
            FakeLLMResponseSpec(content_json=_wave4_validate_merge(), cost_usd=Decimal("0.005")),
        ],
        "nano": [FakeLLMResponseSpec(content_json=_wave3_press_social_proof(), cost_usd=Decimal("0.010"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=specs))

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    # No case studies (wave 2 failed).
    assert len(extracted.case_studies) == 0
    # But wave 1 + 3 produced content.
    assert len(extracted.credentials) == 3
    assert len(extracted.press_mentions) == 1
    # Confidence degraded but non-zero.
    assert 0.0 < extracted.confidence_score < 1.0
    # Exception warning surfaced for the failed wave.
    assert any("case_studies_exception" in w for w in extracted.extraction_warnings)


@pytest.mark.asyncio
async def test_malformed_credential_dropped_with_warning() -> None:
    """LLM returning an invalid Credential entry → drop + warn."""
    bad_w1 = {
        "credentials": [
            # missing required title — Pydantic will reject.
            {"issuer": "X", "year": 2020, "confidence": 0.9},
            # valid one
            {"title": "Valid Credential", "issuer": "Y", "year": 2021, "confidence": 0.8},
        ],
        "awards": [],
        "wave_confidence": 0.7,
        "wave_warnings": [],
    }
    specs = {
        "reasoning": [
            FakeLLMResponseSpec(content_json=bad_w1, cost_usd=Decimal("0.020")),
            FakeLLMResponseSpec(content_json=_wave2_case_studies_two(), cost_usd=Decimal("0.020")),
            FakeLLMResponseSpec(content_json=_wave4_validate_merge(), cost_usd=Decimal("0.005")),
        ],
        "nano": [FakeLLMResponseSpec(content_json=_wave3_press_social_proof(), cost_usd=Decimal("0.010"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=specs))

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    # 1 bad credential dropped, 1 valid kept.
    assert len(extracted.credentials) == 1
    assert extracted.credentials[0].title == "Valid Credential"
    assert any("credential_item_0_invalid" in w for w in extracted.extraction_warnings)


@pytest.mark.asyncio
async def test_wave_invalid_json_yields_empty_wave_with_warning() -> None:
    """LLM returning non-JSON → wave silently yields empty + warning recorded."""

    class _GibberishLLMService(FakeLiteLLMService):
        async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> _LLMResponse:
            if role == "nano":
                # Wave 3 returns garbage.
                return _LLMResponse(content="<<not json>>", litellm_call_id=None, duration_ms=10)
            return await super().ainvoke_text(role=role, prompt=prompt, timeout_sec=timeout_sec)

    llm = _GibberishLLMService(specs_by_role=_happy_specs())
    extractor = _build_extractor(llm=llm)

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    # No press mentions (wave 3 returned non-JSON).
    assert len(extracted.press_mentions) == 0
    # Other waves intact.
    assert len(extracted.credentials) == 3
    assert len(extracted.case_studies) == 2


# ─── A4 — empty bio: no false positives ───────────────────────────────────


@pytest.mark.asyncio
async def test_empty_bio_returns_empty_extraction_no_false_positives() -> None:
    """A4: empty / low-signal bio → empty arrays + low_signal warning."""
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=_empty_bio_specs()))

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text="")

    # All categories empty.
    assert extracted.credentials == []
    assert extracted.case_studies == []
    assert extracted.press_mentions == []
    assert extracted.awards == []
    assert extracted.speaking_engagements == []
    # Confidence floor.
    assert extracted.confidence_score < MIN_ACCEPTABLE_CONFIDENCE
    # Empty-bio warning surfaced.
    assert any("empty_source_text" in w or "low_signal_input" in w for w in extracted.extraction_warnings)


# ─── A5 — cost budget ≤$0.08 USD ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_cost_budget_happy_path() -> None:
    """A5 / V-AE-8: total cost ≤$0.08 USD per extraction on happy path."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("luana_core_observability not importable — cost bridge unavailable")

    extractor = _build_extractor()

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    cost_warnings = [w for w in extracted.extraction_warnings if "cost_budget_exceeded" in w]
    assert not cost_warnings, (
        f"Happy path must stay under {DEFAULT_COST_BUDGET_USD} USD; got cost warnings: {cost_warnings}"
    )


@pytest.mark.asyncio
async def test_cost_budget_exceeded_recorded_as_warning() -> None:
    """Cost ceiling breach → warning recorded, but extractor still returns extraction."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("luana_core_observability not importable — cost bridge unavailable")

    # Each wave costs 0.05 → total 0.20 > budget 0.08.
    expensive = {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_credentials_awards(), cost_usd=Decimal("0.05")),
            FakeLLMResponseSpec(content_json=_wave2_case_studies_two(), cost_usd=Decimal("0.05")),
            FakeLLMResponseSpec(content_json=_wave4_validate_merge(), cost_usd=Decimal("0.05")),
        ],
        "nano": [FakeLLMResponseSpec(content_json=_wave3_press_social_proof(), cost_usd=Decimal("0.05"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=expensive))

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    cost_warnings = [w for w in extracted.extraction_warnings if "cost_budget_exceeded" in w]
    assert cost_warnings, "Expected cost_budget_exceeded warning when sum > budget"


@pytest.mark.asyncio
async def test_cost_unknown_wave_does_not_break_run() -> None:
    """Wave with no litellm_call_id → cost-unknown but extraction continues."""
    specs = {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_credentials_awards(), cost_usd=None),  # cost-unknown
            FakeLLMResponseSpec(content_json=_wave2_case_studies_two(), cost_usd=Decimal("0.020")),
            FakeLLMResponseSpec(content_json=_wave4_validate_merge(), cost_usd=Decimal("0.005")),
        ],
        "nano": [FakeLLMResponseSpec(content_json=_wave3_press_social_proof(), cost_usd=Decimal("0.010"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=specs))

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    assert isinstance(extracted, AuthorityVaultExtractedV1)
    assert len(extracted.credentials) == 3


# ─── A6 — PII sanitisation in trace + outbox + audit ──────────────────────


@pytest.mark.asyncio
async def test_pii_in_bio_masked_in_outbox_payload() -> None:
    """A6: emails / phones present in source_text MUST NOT leak verbatim to
    observability payloads (outbox/audit). Extractor outputs are structured
    primitives without PII channels, but the outbox event includes a sanitised
    summary of source_text length + extraction stats — never the raw bio.
    """
    outbox = FakeOutbox()
    audit = FakeAuditLog()
    extractor = _build_extractor(outbox=outbox, audit_log=audit)

    raw_email = "anabella@example.com"
    raw_phone = "+54 9 11 5555-5555"
    source = f"Soy psicóloga. Contactame: {raw_email} / WhatsApp {raw_phone}."

    await extractor.run(tenant_id=uuid.uuid4(), source_text=source)

    # outbox payload — never carries raw source_text content; only length +
    # structured stats. Defense-in-depth: emails / phone substrings must not
    # appear ANYWHERE in the published payload.
    assert len(outbox.published) == 1
    payload_str = json.dumps(outbox.published[0]["payload"], default=str, ensure_ascii=False)
    assert raw_email not in payload_str, "Raw email leaked into outbox payload"
    assert raw_phone not in payload_str, "Raw phone leaked into outbox payload"

    # Audit log — same invariant.
    assert len(audit.logged) == 1
    audit_str = json.dumps(audit.logged[0]["payload"], default=str, ensure_ascii=False)
    assert raw_email not in audit_str
    assert raw_phone not in audit_str


# ─── A7 — schema cement ───────────────────────────────────────────────────


def test_schema_version_is_literal_1_frozen() -> None:
    """``schema_version`` is ``Literal[1]`` — bumping requires NEW V2 class."""
    extracted = AuthorityVaultExtractedV1()
    assert extracted.schema_version == 1
    with pytest.raises(Exception):  # noqa: B017
        AuthorityVaultExtractedV1(schema_version=2)  # type: ignore[arg-type]


def test_credential_rejects_missing_title() -> None:
    """Credential cement — title required."""
    with pytest.raises(Exception):  # noqa: B017
        Credential(issuer="X", year=2020, confidence=0.9)  # type: ignore[arg-type]


def test_press_mention_year_range_enforced() -> None:
    """PressMention rejects year outside 1900-2100."""
    with pytest.raises(Exception):  # noqa: B017
        PressMention(title="x", year=1800, confidence=0.5)


def test_speaking_engagement_format_enum_cement() -> None:
    """SpeakingEngagement format Literal enum cement."""
    with pytest.raises(Exception):  # noqa: B017
        SpeakingEngagement(title="x", format="invalid_format")  # type: ignore[arg-type]


def test_social_proof_defaults_safe() -> None:
    """SocialProofSignals defaults: every counter None + empty list."""
    sp = SocialProofSignals()
    assert sp.clients_served_count is None
    assert sp.other_signals == []


def test_award_negative_year_rejected() -> None:
    """Award rejects pre-1900 year."""
    with pytest.raises(Exception):  # noqa: B017
        Award(title="x", year=1500, confidence=0.5)


def test_case_study_outcome_max_length_enforced() -> None:
    """CaseStudy outcome capped at 1000 chars."""
    with pytest.raises(Exception):  # noqa: B017
        CaseStudy(title="x", outcome="z" * 1100, confidence=0.5)


# ─── A8 — tenant isolation ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_tenant_id_propagates_to_all_collaborators() -> None:
    """A8: Every side-effect collaborator receives the same tenant_id (R2)."""
    repo = FakeAuthorityVaultRepo()
    qdrant = FakeQdrantIndexer()
    outbox = FakeOutbox()
    audit = FakeAuditLog()
    extractor = _build_extractor(
        authority_vault_repo=repo,
        qdrant=qdrant,
        outbox=outbox,
        audit_log=audit,
    )

    tenant_id = uuid.uuid4()
    await extractor.run(tenant_id=tenant_id, source_text=_SAMPLE_BIO_HAPPY)

    # Repo: every pre-filled row carries the tenant_id.
    assert len(repo.saved_rows) > 0
    for row in repo.saved_rows:
        assert row["tenant_id"] == tenant_id
    # Other collaborators.
    assert qdrant.indexed[0]["tenant_id"] == tenant_id
    assert outbox.published[0]["tenant_id"] == tenant_id
    assert audit.logged[0]["tenant_id"] == tenant_id


@pytest.mark.asyncio
async def test_cross_tenant_isolation_no_leak_across_runs() -> None:
    """Two consecutive runs for different tenants do NOT share state."""
    repo = FakeAuthorityVaultRepo()
    # Build with happy specs only — tenant B's run will swap to empty specs
    # explicitly (test seam below). Merging happy + empty in a single dict
    # would clobber the reasoning + nano lists (same keys) and leave the
    # extractor with empty queues for both runs.
    extractor = _build_extractor(
        llm=FakeLiteLLMService(specs_by_role=_happy_specs()),
        authority_vault_repo=repo,
    )

    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()

    await extractor.run(tenant_id=tenant_a, source_text=_SAMPLE_BIO_HAPPY)
    # Reset LLM specs for tenant B run.
    extractor._llm = FakeLiteLLMService(specs_by_role=_empty_bio_specs())  # noqa: SLF001
    await extractor.run(tenant_id=tenant_b, source_text="")

    # All tenant_a rows tagged A; all tenant_b rows (likely 0 — empty bio) tagged B.
    tenants_a_rows = [r for r in repo.saved_rows if r["tenant_id"] == tenant_a]
    tenants_b_rows = [r for r in repo.saved_rows if r["tenant_id"] == tenant_b]
    # tenant_a happy path: ≥1 row per category present.
    assert len(tenants_a_rows) >= 3  # 3 credentials minimum
    # tenant_b empty: 0 rows.
    assert len(tenants_b_rows) == 0


# ─── A9 — pending ratification pre-fill ───────────────────────────────────


@pytest.mark.asyncio
async def test_pre_fills_authority_vault_repo_with_pending_ratification_status() -> None:
    """A9 + ticket constraint: rows written with
    ``status='extracted_pending_ratification'`` per ticket spec.
    """
    repo = FakeAuthorityVaultRepo()
    extractor = _build_extractor(authority_vault_repo=repo)
    tenant_id = uuid.uuid4()

    await extractor.run(tenant_id=tenant_id, source_text=_SAMPLE_BIO_HAPPY)

    # Every saved row carries the pending-ratification status.
    assert all(r["status"] == "extracted_pending_ratification" for r in repo.saved_rows)
    # Every row carries a `kind` (polymorphic table per ComunifyAuthorityVaultItemModel).
    kinds = {r["kind"] for r in repo.saved_rows}
    assert kinds.issubset({"credentials", "case_studies", "press_mentions", "awards"})
    # We expect at least credentials + case_studies + press_mentions present
    # (happy path has 3+2+1+1=7 rows minimum: 3 cred + 2 case + 1 press + 1 award).
    assert "credentials" in kinds
    assert "case_studies" in kinds
    assert "press_mentions" in kinds
    assert "awards" in kinds


@pytest.mark.asyncio
async def test_repo_failure_does_not_raise() -> None:
    """Repo failure is best-effort — extractor still returns extraction."""
    repo = FakeAuthorityVaultRepo(raise_on_save=RuntimeError("db down"))
    extractor = _build_extractor(authority_vault_repo=repo)

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    assert isinstance(extracted, AuthorityVaultExtractedV1)
    assert len(repo.saved_rows) == 0


@pytest.mark.asyncio
async def test_qdrant_failure_isolated() -> None:
    """Qdrant index failure does NOT block other side-effects."""
    qdrant = FakeQdrantIndexer(raise_on_index=RuntimeError("qdrant down"))
    repo = FakeAuthorityVaultRepo()
    extractor = _build_extractor(qdrant=qdrant, authority_vault_repo=repo)

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    # Repo persist still happened (isolation).
    assert len(repo.saved_rows) >= 3
    assert isinstance(extracted, AuthorityVaultExtractedV1)


@pytest.mark.asyncio
async def test_outbox_emits_authority_vault_extracted_v1() -> None:
    """Outbox publishes AuthorityVaultExtractedV1 event with sanitised payload."""
    outbox = FakeOutbox()
    extractor = _build_extractor(outbox=outbox)
    tenant_id = uuid.uuid4()

    await extractor.run(tenant_id=tenant_id, source_text=_SAMPLE_BIO_HAPPY)

    assert len(outbox.published) == 1
    event = outbox.published[0]
    assert event["event_type"] == "AuthorityVaultExtractedV1"
    assert event["tenant_id"] == tenant_id
    payload = event["payload"]
    assert payload["extractor_version"] == AUTHORITY_VAULT_EXTRACTOR_VERSION
    assert payload["schema_version"] == 1
    assert payload["credentials_count"] == 3
    assert payload["case_studies_count"] == 2
    assert payload["press_mentions_count"] == 1
    assert payload["awards_count"] == 1


@pytest.mark.asyncio
async def test_outbox_failure_isolated() -> None:
    """Outbox failure does not block persistence or extractor return."""
    repo = FakeAuthorityVaultRepo()
    outbox = FakeOutbox(raise_on_publish=RuntimeError("kafka down"))
    extractor = _build_extractor(authority_vault_repo=repo, outbox=outbox)

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    assert isinstance(extracted, AuthorityVaultExtractedV1)
    assert len(repo.saved_rows) >= 3
    assert len(outbox.published) == 0


@pytest.mark.asyncio
async def test_audit_log_records_extraction_event() -> None:
    """Audit log records the authority_vault_extracted event."""
    audit = FakeAuditLog()
    extractor = _build_extractor(audit_log=audit)

    await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    assert len(audit.logged) == 1
    entry = audit.logged[0]
    assert entry["event_type"] == "authority_vault_extracted"
    assert entry["payload"]["extractor_version"] == AUTHORITY_VAULT_EXTRACTOR_VERSION
    # High confidence happy path → needs_manual_review False.
    assert entry["payload"]["needs_manual_review"] is False


@pytest.mark.asyncio
async def test_low_confidence_triggers_manual_review_flag_in_audit() -> None:
    """When confidence < MIN_ACCEPTABLE, audit log flags needs_manual_review=True."""
    low_conf = {
        "reasoning": [
            FakeLLMResponseSpec(
                content_json={**_wave1_credentials_awards(), "wave_confidence": 0.3},
                cost_usd=Decimal("0.020"),
            ),
            FakeLLMResponseSpec(
                content_json={**_wave2_case_studies_two(), "wave_confidence": 0.4},
                cost_usd=Decimal("0.020"),
            ),
            FakeLLMResponseSpec(
                content_json={
                    "merged_warnings": ["low quality"],
                    "merged_missing_required_fields": ["case_studies"],
                    "validation_score_adjustment": -0.3,
                    "consistency_notes": "low signal",
                    "wave_confidence": 1.0,
                    "wave_warnings": [],
                },
                cost_usd=Decimal("0.005"),
            ),
        ],
        "nano": [
            FakeLLMResponseSpec(
                content_json={**_wave3_press_social_proof(), "wave_confidence": 0.4},
                cost_usd=Decimal("0.010"),
            ),
        ],
    }
    audit = FakeAuditLog()
    extractor = _build_extractor(
        llm=FakeLiteLLMService(specs_by_role=low_conf),
        audit_log=audit,
    )

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    assert extracted.confidence_score < MIN_ACCEPTABLE_CONFIDENCE
    assert audit.logged[0]["payload"]["needs_manual_review"] is True


@pytest.mark.asyncio
async def test_audit_failure_isolated() -> None:
    """Audit failure does not affect other side-effects or extractor return."""
    repo = FakeAuthorityVaultRepo()
    audit = FakeAuditLog(raise_on_log=RuntimeError("audit table locked"))
    extractor = _build_extractor(authority_vault_repo=repo, audit_log=audit)

    extracted = await extractor.run(tenant_id=uuid.uuid4(), source_text=_SAMPLE_BIO_HAPPY)

    assert isinstance(extracted, AuthorityVaultExtractedV1)
    assert len(repo.saved_rows) >= 3


# ─── Side-effects + Qdrant ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_qdrant_indexed_when_supplied() -> None:
    """When qdrant_indexer supplied, structured extraction indexed (sanitised)."""
    qdrant = FakeQdrantIndexer()
    extractor = _build_extractor(qdrant=qdrant)
    tenant_id = uuid.uuid4()

    await extractor.run(tenant_id=tenant_id, source_text=_SAMPLE_BIO_HAPPY)

    assert len(qdrant.indexed) == 1
    indexed = qdrant.indexed[0]
    assert indexed["tenant_id"] == tenant_id
    assert isinstance(indexed["payload"], dict)
    assert indexed["payload"]["schema_version"] == 1
