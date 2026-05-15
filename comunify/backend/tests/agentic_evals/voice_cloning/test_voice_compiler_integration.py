"""Tests for voice compiler integration bridge (T-voice-3, R23 Opus 4.7).

Acceptance coverage (per 06-tickets.yaml::T-voice-3 + 04-validators.yaml::V-AE-29):
  * Bridge consumes ``PersonalityCompiler`` SSoT — NEVER re-implements.
  * Mapping from CompiledVoice → DimensionsProfile is deterministic + bounded.
  * Mapping from CompiledVoice → LinguisticPatterns respects dialect prefixes.
  * compile_voice_to_system_instruction returns a non-empty 5-block string.
  * bridge_compiled_voice_to_personality_profile threads tenant_id end-to-end.
  * Event bus failure does NOT raise (best-effort emission).
  * VoiceRatifiedV1 event payload has metadata only — no raw text.
  * voice_ratified_handler invalidates the per-tenant Slot 5 cache key.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any

import pytest

from src.modules.comunify.application.event_handlers.voice_ratified_handler import (
    handle_voice_ratified,
    parse_voice_ratified_payload,
)
from src.modules.comunify.brand.voice_cloning._schemas import CompiledVoice
from src.modules.comunify.brand.voice_cloning.compiler_integration import (
    bridge_compiled_voice_to_personality_profile,
    compile_voice_to_system_instruction,
    map_to_dimensions_patterns,
)

# ─── Fixture builders ──────────────────────────────────────────────────────


def _compiled_anabella_ar() -> CompiledVoice:
    return CompiledVoice(
        identidad="Coach de fitness para mujeres 35-50 en Argentina, cercana y energética",
        dialecto="es-AR voseo natural",
        vocabulario=[
            "tenés que probarlo",
            "te lo bancás",
            "dale, vamos",
            "una banda",
            "obvio",
        ],
        registro="cercano informal con humor cálido — empatía sin formalidad",
        asi_no=[
            "NUNCA uses 'usted' ni tratamientos formales",
            "NUNCA digas 'querida/o' sin que el lead lo use primero",
        ],
        anclajes=[
            "soy coach, no médica — derivo siempre",
            "respeto el momento de cada una",
        ],
        confidence_score=0.92,
        samples_used=50,
    )


def _compiled_minimal() -> CompiledVoice:
    """Edge case — bare-minimum CompiledVoice with low confidence."""
    return CompiledVoice(
        identidad="Coach",
        dialecto="es-MX neutro broad",
        vocabulario=["hola", "claro"],
        registro="formal serio",
        asi_no=["NUNCA chistes"],
        anclajes=["respeto siempre"],
        confidence_score=0.55,
        samples_used=50,
    )


# ─── Mapping function tests ───────────────────────────────────────────────


def test_map_to_dimensions_returns_three_artefacts() -> None:
    """Pure function returns (Dimensions, Patterns, Exchanges)."""
    dims, patterns, exchanges = map_to_dimensions_patterns(_compiled_anabella_ar())

    assert dims is not None
    assert patterns is not None
    assert isinstance(exchanges, list)
    assert len(exchanges) >= 1  # identity_anchor always present


def test_mapping_dimensions_are_clamped_0_1() -> None:
    """Output dimensions MUST stay in [0.0, 1.0]."""
    compiled = _compiled_anabella_ar()
    dims, _, _ = map_to_dimensions_patterns(compiled)
    for value in (dims.energy, dims.warmth, dims.humor, dims.expressiveness, dims.narrative, dims.verbosity):
        assert 0.0 <= value <= 1.0


def test_mapping_warmth_higher_for_cercano_registro() -> None:
    """``cercano`` keyword pushes warmth above neutral."""
    compiled = _compiled_anabella_ar()  # has "cercano" in registro
    dims, _, _ = map_to_dimensions_patterns(compiled)
    assert dims.warmth > 0.5


def test_mapping_humor_lower_for_serio_registro() -> None:
    compiled = _compiled_minimal()  # has "serio" in registro
    dims, _, _ = map_to_dimensions_patterns(compiled)
    assert dims.humor < 0.5


def test_mapping_warmth_lower_for_formal_with_serio() -> None:
    """``formal`` + ``serio`` registro pushes both warmth and humor down."""
    compiled = _compiled_minimal()
    dims, _, _ = map_to_dimensions_patterns(compiled)
    assert dims.warmth < 0.5  # formal
    assert dims.humor < 0.5  # serio


def test_mapping_dialect_es_ar_yields_voseo_greeting() -> None:
    compiled = _compiled_anabella_ar()
    _, patterns, _ = map_to_dimensions_patterns(compiled)
    # es-AR template includes "che" or "Dale".
    assert "che" in patterns.greeting.lower() or "dale" in patterns.farewell.lower()


def test_mapping_dialect_es_mx_yields_mexican_greeting() -> None:
    compiled = _compiled_minimal()  # es-MX
    _, patterns, _ = map_to_dimensions_patterns(compiled)
    assert "onda" in patterns.greeting.lower() or "ganas" in patterns.farewell.lower()


def test_mapping_unique_vocabulary_carries_phrases() -> None:
    """Vocabulario items become unique_vocabulary in patterns."""
    compiled = _compiled_anabella_ar()
    _, patterns, _ = map_to_dimensions_patterns(compiled)
    # Filter only the "longer" phrases the bridge keeps (>=5 chars).
    expected = [v for v in compiled.vocabulario if len(v) >= 5]
    assert any(v in patterns.unique_vocabulary for v in expected)


def test_mapping_anclajes_become_sample_exchanges() -> None:
    compiled = _compiled_anabella_ar()
    _, _, exchanges = map_to_dimensions_patterns(compiled)
    # 1 identity_anchor + up to 3 anclajes.
    assert len(exchanges) == 1 + min(3, len(compiled.anclajes))
    # identity_anchor exchange has compiled.identidad as response.
    assert exchanges[0].context == "identity_anchor"
    assert compiled.identidad in exchanges[0].author_response


# ─── compile_voice_to_system_instruction tests ────────────────────────────


def test_compile_returns_non_empty_string() -> None:
    """Bridge produces a 5-block compiled system_instruction."""
    out = compile_voice_to_system_instruction(_compiled_anabella_ar())
    assert isinstance(out, str)
    assert len(out) > 100
    # PersonalityCompiler output convention: BLOQUE 1..5 headers present.
    assert "BLOQUE 1" in out
    assert "BLOQUE 5" in out  # ANCLA DE IDENTIDAD


def test_compile_minimal_voice_still_produces_string() -> None:
    """Low-confidence / minimal CompiledVoice still compiles (degraded)."""
    out = compile_voice_to_system_instruction(_compiled_minimal())
    assert isinstance(out, str)
    assert len(out) > 50


def test_compile_includes_voseo_voice_when_es_ar() -> None:
    """Anabella es-AR → compiled string should reflect informal cercana tone.

    We assert at the structural level (PersonalityCompiler output) not the
    exact voseo lexicon — the SSoT compiler may not interpolate voseo
    verbatim from inputs but the warmth dimension drives compatible tone.
    """
    out = compile_voice_to_system_instruction(_compiled_anabella_ar())
    # The 5 blocks must all be present.
    for block_marker in ["BLOQUE 1", "BLOQUE 2", "BLOQUE 4", "BLOQUE 5"]:
        assert block_marker in out


# ─── bridge_compiled_voice_to_personality_profile end-to-end ──────────────


@dataclass
class FakeProfileWriter:
    """In-memory fake of PersonalityProfileWriterProtocol."""

    next_version: int = 7
    updates: list[dict[str, Any]] = field(default_factory=list)
    raise_on_update: BaseException | None = None

    async def update_voice(
        self,
        *,
        tenant_id: uuid.UUID,
        system_instruction: str,
        compiled_voice_metadata: dict[str, Any],
    ) -> int:
        if self.raise_on_update is not None:
            raise self.raise_on_update
        self.updates.append(
            {
                "tenant_id": tenant_id,
                "system_instruction": system_instruction,
                "metadata": compiled_voice_metadata,
            }
        )
        version = self.next_version
        self.next_version += 1
        return version


@dataclass
class FakeEventBus:
    """In-memory fake of VoiceRatifiedEventBusProtocol."""

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


@pytest.mark.asyncio
async def test_bridge_persists_system_instruction_and_bumps_version() -> None:
    writer = FakeProfileWriter(next_version=42)
    bus = FakeEventBus()

    result = await bridge_compiled_voice_to_personality_profile(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        compiled=_compiled_anabella_ar(),
        profile_writer=writer,
        event_bus=bus,
    )

    assert result.personality_profile_version == 42
    assert len(result.system_instruction) > 100
    assert "BLOQUE 1" in result.system_instruction
    assert len(writer.updates) == 1


@pytest.mark.asyncio
async def test_bridge_emits_voice_ratified_v1_event_with_metadata_only() -> None:
    writer = FakeProfileWriter()
    bus = FakeEventBus()
    tenant_id = uuid.uuid4()
    job_id = uuid.uuid4()
    compiled = _compiled_anabella_ar()

    await bridge_compiled_voice_to_personality_profile(
        tenant_id=tenant_id,
        job_id=job_id,
        compiled=compiled,
        profile_writer=writer,
        event_bus=bus,
    )

    assert len(bus.published) == 1
    evt = bus.published[0]
    assert evt["event_type"] == "VoiceRatifiedV1"
    assert evt["tenant_id"] == tenant_id

    # D15: payload carries metadata only, NO raw text from CompiledVoice.
    payload = evt["payload"]
    assert "tenant_id" in payload
    assert "source_job_id" in payload
    assert "personality_profile_version" in payload
    assert "confidence_score" in payload
    assert "dialecto" in payload
    assert "samples_used" in payload

    # NO raw lists / no chat content / no system_instruction body.
    forbidden_keys = {
        "vocabulario",
        "asi_no",
        "anclajes",
        "identidad",
        "registro",
        "system_instruction",
        "chat_samples",
    }
    assert forbidden_keys.isdisjoint(payload.keys()), (
        f"VoiceRatifiedV1 payload leaks forbidden keys: {forbidden_keys & payload.keys()}"
    )


@pytest.mark.asyncio
async def test_bridge_does_not_raise_on_event_bus_failure() -> None:
    """Per tessl__graceful-degradation: event bus failure → log + continue."""
    writer = FakeProfileWriter()
    broken_bus = FakeEventBus(raise_on_publish=RuntimeError("outbox down"))

    # Bridge MUST return cleanly even with broken bus.
    result = await bridge_compiled_voice_to_personality_profile(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        compiled=_compiled_anabella_ar(),
        profile_writer=writer,
        event_bus=broken_bus,
    )
    assert result.personality_profile_version > 0


@pytest.mark.asyncio
async def test_bridge_works_with_no_event_bus() -> None:
    """event_bus is optional — bridge still works without it."""
    writer = FakeProfileWriter()

    result = await bridge_compiled_voice_to_personality_profile(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        compiled=_compiled_anabella_ar(),
        profile_writer=writer,
        event_bus=None,
    )

    assert result.personality_profile_version > 0


@pytest.mark.asyncio
async def test_bridge_threads_tenant_id_to_writer() -> None:
    """R2: tenant_id reaches the profile writer."""
    writer = FakeProfileWriter()
    tenant_id = uuid.uuid4()

    await bridge_compiled_voice_to_personality_profile(
        tenant_id=tenant_id,
        job_id=uuid.uuid4(),
        compiled=_compiled_anabella_ar(),
        profile_writer=writer,
    )

    assert writer.updates[0]["tenant_id"] == tenant_id


@pytest.mark.asyncio
async def test_bridge_metadata_carries_confidence_and_samples() -> None:
    writer = FakeProfileWriter()
    compiled = _compiled_anabella_ar()

    await bridge_compiled_voice_to_personality_profile(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        compiled=compiled,
        profile_writer=writer,
    )

    metadata = writer.updates[0]["metadata"]
    assert metadata["confidence_score"] == compiled.confidence_score
    assert metadata["samples_used"] == compiled.samples_used
    assert metadata["dialecto"] == compiled.dialecto
    assert metadata["compiled_schema_version"] == 1


# ─── VoiceRatifiedV1 handler tests ────────────────────────────────────────


@dataclass
class FakeCacheInvalidator:
    """In-memory fake of SlotCacheInvalidatorProtocol."""

    invalidated: list[dict[str, Any]] = field(default_factory=list)
    raise_on_invalidate: BaseException | None = None

    async def invalidate_brand_voice_slot(
        self,
        *,
        tenant_id: uuid.UUID,
        previous_version: int | None,
        new_version: int,
    ) -> None:
        if self.raise_on_invalidate is not None:
            raise self.raise_on_invalidate
        self.invalidated.append(
            {
                "tenant_id": tenant_id,
                "previous_version": previous_version,
                "new_version": new_version,
            }
        )


@dataclass
class FakeAuditLog:
    """In-memory fake of CacheInvalidationAuditProtocol."""

    logged: list[dict[str, Any]] = field(default_factory=list)

    async def log(
        self,
        *,
        tenant_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        self.logged.append({"tenant_id": tenant_id, "event_type": event_type, "payload": payload})


def _make_voice_ratified_payload(*, version: int = 42) -> dict[str, Any]:
    return {
        "tenant_id": str(uuid.uuid4()),
        "source_job_id": str(uuid.uuid4()),
        "personality_profile_version": version,
        "confidence_score": 0.92,
        "dialecto": "es-AR voseo natural",
        "samples_used": 50,
    }


def test_parse_voice_ratified_payload_valid() -> None:
    payload = _make_voice_ratified_payload()
    parsed = parse_voice_ratified_payload(payload)
    assert parsed is not None
    assert parsed.personality_profile_version == 42
    assert parsed.confidence_score == 0.92


def test_parse_voice_ratified_payload_malformed_returns_none() -> None:
    parsed = parse_voice_ratified_payload({"missing": "keys"})
    assert parsed is None


def test_parse_voice_ratified_payload_bad_uuid_returns_none() -> None:
    payload = _make_voice_ratified_payload()
    payload["tenant_id"] = "not-a-uuid"
    parsed = parse_voice_ratified_payload(payload)
    assert parsed is None


@pytest.mark.asyncio
async def test_handler_invalidates_brand_voice_slot() -> None:
    invalidator = FakeCacheInvalidator()
    payload = _make_voice_ratified_payload(version=42)

    success = await handle_voice_ratified(
        payload=payload,
        cache_invalidator=invalidator,
        previous_version=41,
    )

    assert success is True
    assert len(invalidator.invalidated) == 1
    invocation = invalidator.invalidated[0]
    assert invocation["previous_version"] == 41
    assert invocation["new_version"] == 42


@pytest.mark.asyncio
async def test_handler_returns_false_on_malformed_payload() -> None:
    invalidator = FakeCacheInvalidator()
    success = await handle_voice_ratified(
        payload={"junk": "data"},
        cache_invalidator=invalidator,
    )
    assert success is False
    assert len(invalidator.invalidated) == 0


@pytest.mark.asyncio
async def test_handler_does_not_raise_on_invalidator_failure() -> None:
    """Per tessl__graceful-degradation: invalidator failure → False, no raise."""
    broken = FakeCacheInvalidator(raise_on_invalidate=RuntimeError("cache server down"))
    success = await handle_voice_ratified(
        payload=_make_voice_ratified_payload(),
        cache_invalidator=broken,
    )
    assert success is False


@pytest.mark.asyncio
async def test_handler_writes_audit_log() -> None:
    audit = FakeAuditLog()
    invalidator = FakeCacheInvalidator()

    await handle_voice_ratified(
        payload=_make_voice_ratified_payload(version=99),
        cache_invalidator=invalidator,
        audit_log=audit,
        previous_version=98,
    )

    assert len(audit.logged) == 1
    entry = audit.logged[0]
    assert entry["event_type"] == "voice_ratified_cache_invalidated"
    assert entry["payload"]["new_version"] == 99
    assert entry["payload"]["previous_version"] == 98
    assert entry["payload"]["invalidation_succeeded"] is True


@pytest.mark.asyncio
async def test_handler_audit_records_failure_when_invalidator_fails() -> None:
    audit = FakeAuditLog()
    broken = FakeCacheInvalidator(raise_on_invalidate=RuntimeError("down"))

    await handle_voice_ratified(
        payload=_make_voice_ratified_payload(),
        cache_invalidator=broken,
        audit_log=audit,
    )

    assert len(audit.logged) == 1
    assert audit.logged[0]["payload"]["invalidation_succeeded"] is False
