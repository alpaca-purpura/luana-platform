"""Voice compiler integration bridge — CompiledVoice → PersonalityCompiler v2
(T-voice-3, R23 Opus 4.7 production code).

Bridges the comunify voice cloning pipeline output (``CompiledVoice`` 6 bloques
v2) to the shared ``luana_core_brand_studio`` voice compiler engine. The
canonical ``PersonalityCompiler.compile(...)`` is in
``luana_core_brand_studio.domain.personality`` (Story 5 SSoT) — this bridge
NEVER re-implements compilation logic (R10 anti-duplication.md).

Pipeline (per 02-design-agentic.md § 5.3 + 06-tickets.yaml::T-voice-3):

    CompiledVoice (6 bloques)
            │
            ▼
    map_to_dimensions_patterns_exchanges()      ← THIS bridge
            │
            ▼  PersonalityDimensions + LinguisticPatterns + [SampleExchange]
            │
            ▼
    PersonalityCompiler.compile(...)            ← luana-core-brand-studio SSoT
            │
            ▼  system_instruction string (5-block compiled v2)
            │
            ▼
    personality_profile_writer.update_voice(...) ← Persists + emits VoiceRatifiedV1
            │
            ▼  VoiceRatifiedV1 event
            │
            ▼
    voice_ratified_handler                        ← T-voice-3 separate handler module
            │
            ▼  Slot 5 BRAND_VOICE cache invalidate

Bridge invariants:
  * NEVER re-implements ``PersonalityCompiler.compile()`` — direct delegation.
  * NEVER bypasses PII sanitization in the input CompiledVoice (D15 trust:
    ``CompiledVoice.vocabulario`` + ``asi_no`` are PATTERN-only by extractor
    contract — see ``_schemas.py`` docstring).
  * NEVER mutates the CompiledVoice — pure function from input → output.
  * NEVER calls the LLM (compilation is pure string assembly per
    ``PersonalityCompiler`` design).

Mapping logic:
  6 bloques (CompiledVoice) → 5 blocks (PersonalityCompiler.compile):
    Bloque 1 identidad     → ANCHOR string (passed via SampleExchange[0].context)
    Bloque 2 dialecto      → LinguisticPatterns.greeting hint + Block 2 raw
    Bloque 3 vocabulario   → LinguisticPatterns.unique_vocabulary + filler_phrases
    Bloque 4 registro      → DimensionsProfile (energy/warmth/humor/expr/verb)
                              mapped via heuristics (e.g. "cercano informal" → warmth=0.7)
    Bloque 5 asi_no        → DimensionsProfile dips + NUNCA constraints surface
                              automatically via PersonalityCompiler Block 3
    Bloque 6 anclajes      → Block 5 ANCLA DE IDENTIDAD (suffix)

Note: PersonalityCompiler has its own 5-block output convention; this bridge
maps the comunify 6-bloque vocabulary onto that 5-block surface. The final
``system_instruction`` string carries ALL the comunify semantics, just
through PersonalityCompiler's compiled output structure.

Anti-duplication audit (Step 0 GATE, 2026-05-14):
  * ``grep -rn "class.*VoiceCompiler\\|compiler_integration"`` cross
    luana-platform → zero collisions.
  * PersonalityCompiler imported DIRECTLY from luana_core_brand_studio.
    The arch test ``test_sales_agent_uses_voice_port_no_direct_compiler_import.py``
    restricts ONLY ``luana-core-sales-agent`` from direct import — comunify
    (brand consumer in same dependency tier as brand-studio) is allowed.
    If a future gate restricts comunify too, switch to ``BrandVoicePort``
    consumption pattern (already-defined Protocol surface).
  * Mapping heuristics are vertical-creator-economy specific; not lifted.

Spec sources:
  * 02-design-agentic.md voice cloning flow + slot invalidation
  * 03-arch-agentic.md § 5.3 — VoiceDistillationOrchestrator → bridge
  * 06-tickets.yaml::T-voice-3 acceptance + decision D8
  * 04-validators.yaml::V-AE-29
  * .claude/rules/sales-agent-brand-voice.md (Slot 5 BRAND_VOICE SSoT)
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any, Protocol

import structlog

# Direct import per anti-duplication note in module docstring.
from luana_core_brand_studio.domain.personality import (  # type: ignore[import-not-found]
    LinguisticPatterns,
    PersonalityCompiler,
    PersonalityDimensions,
    SampleExchange,
)

from src.modules.comunify.brand.voice_cloning._schemas import CompiledVoice

logger = structlog.get_logger(__name__)


# ─── Heuristic mappings ──────────────────────────────────────────────────


# Map CompiledVoice.registro keywords → PersonalityDimensions (0.0-1.0 each).
# Conservative defaults sit in 0.5 (neutral) for unknown registros; matched
# keywords push specific dimensions up or down. The mapping is intentionally
# small + transparent — a creator can always edit the PersonalityProfile
# downstream in Brand Studio if heuristic disagrees.

# Keyword → (dimension, delta). Multiple keywords accumulate; final clamped [0, 1].
_REGISTRO_KEYWORD_DELTAS: dict[str, list[tuple[str, float]]] = {
    "informal": [("warmth", 0.2), ("verbosity", -0.1)],
    "formal": [("warmth", -0.2), ("verbosity", 0.1)],
    "cercano": [("warmth", 0.3)],
    "cercana": [("warmth", 0.3)],
    "distante": [("warmth", -0.3)],
    "íntimo": [("warmth", 0.4)],
    "intimo": [("warmth", 0.4)],
    "íntima": [("warmth", 0.4)],
    "intima": [("warmth", 0.4)],
    "humor": [("humor", 0.3)],
    "cálido": [("warmth", 0.2), ("humor", 0.1)],
    "calido": [("warmth", 0.2), ("humor", 0.1)],
    "energético": [("energy", 0.3)],
    "energetico": [("energy", 0.3)],
    "calmo": [("energy", -0.2)],
    "calma": [("energy", -0.2)],
    "sereno": [("energy", -0.2)],
    "playful": [("humor", 0.3), ("energy", 0.1)],
    "jugueton": [("humor", 0.3), ("energy", 0.1)],
    "juguetón": [("humor", 0.3), ("energy", 0.1)],
    "serio": [("humor", -0.3)],
    "minimalista": [("expressiveness", -0.3), ("verbosity", -0.2)],
    "maximalista": [("expressiveness", 0.3), ("verbosity", 0.3)],
    "elaborado": [("verbosity", 0.2)],
    "telegráfico": [("verbosity", -0.3)],
    "telegrafico": [("verbosity", -0.3)],
    "narrativo": [("narrative", 0.3)],
    "factual": [("narrative", -0.2)],
}


# Dialect → greeting/farewell template hints for LinguisticPatterns.
# es-AR voseo: "Hola che, ¿cómo andás?"
# es-CL tuteo chileno: "Hola, ¿cómo estay?"
# es-MX neutro: "Hola, ¿cómo estás?"
_DIALECT_GREETINGS: dict[str, tuple[str, str]] = {
    "es-AR": ("¡Hola che!", "¡Dale, hablamos!"),
    "es-CL": ("¡Hola po!", "¡Cuídate harto!"),
    "es-MX": ("¡Qué onda!", "¡Échale ganas!"),
    "es-PE": ("¡Hola!", "¡Cuídate!"),
    "es-CO": ("¡Hola!", "¡Que estés bien!"),
    "default": ("¡Hola!", "¡Cuídate!"),
}


# ─── Mapping function ────────────────────────────────────────────────────


def map_to_dimensions_patterns(
    compiled: CompiledVoice,
) -> tuple[PersonalityDimensions, LinguisticPatterns, list[SampleExchange]]:
    """Map ``CompiledVoice`` 6 bloques → PersonalityCompiler inputs.

    Pure function — no side effects, no I/O, deterministic.

    Args:
        compiled: ``CompiledVoice`` from VoiceDistillationOrchestrator.

    Returns:
        Tuple of (PersonalityDimensions, LinguisticPatterns, list[SampleExchange])
        suitable for passing into ``PersonalityCompiler.compile(...)``.
    """
    # ── PersonalityDimensions: from registro + asi_no heuristics ──────────
    dims: dict[str, float] = {
        "energy": 0.5,
        "warmth": 0.5,
        "humor": 0.5,
        "expressiveness": 0.5,
        "narrative": 0.5,
        "verbosity": 0.5,
    }

    registro_lower = compiled.registro.lower()
    for keyword, deltas in _REGISTRO_KEYWORD_DELTAS.items():
        if keyword in registro_lower:
            for dim_name, delta in deltas:
                dims[dim_name] = max(0.0, min(1.0, dims[dim_name] + delta))

    # asi_no entries hinting at "NUNCA uses humor" etc. also push dimensions.
    asi_no_text = " ".join(compiled.asi_no).lower()
    if "nunca chistes" in asi_no_text or "nunca humor" in asi_no_text:
        dims["humor"] = max(0.0, dims["humor"] - 0.3)
    if "nunca formal" in asi_no_text or "nunca usted" in asi_no_text:
        dims["warmth"] = min(1.0, dims["warmth"] + 0.2)
    if "nunca exclamaciones" in asi_no_text or "nunca mayúsculas" in asi_no_text:
        dims["energy"] = max(0.0, dims["energy"] - 0.2)

    personality_dims = PersonalityDimensions(
        energy=dims["energy"],
        warmth=dims["warmth"],
        humor=dims["humor"],
        expressiveness=dims["expressiveness"],
        narrative=dims["narrative"],
        verbosity=dims["verbosity"],
    )

    # ── LinguisticPatterns: from vocabulario + dialecto ───────────────────
    # Dialecto string is shape "es-AR voseo natural" — extract the first 5 chars.
    dialecto_prefix = compiled.dialecto[:5] if compiled.dialecto else "default"
    greeting, farewell = _DIALECT_GREETINGS.get(dialecto_prefix, _DIALECT_GREETINGS["default"])

    # Heuristic emoji_style: based on registro
    if "energético" in registro_lower or "energetico" in registro_lower or "alta" in registro_lower:
        emoji_style = "moderate"
    elif "calmo" in registro_lower or "sereno" in registro_lower or "distante" in registro_lower:
        emoji_style = "minimal"
    else:
        emoji_style = "moderate"

    if "humor" in registro_lower or "playful" in registro_lower or "juguetón" in registro_lower:
        humor_type = "playful"
    elif "serio" in registro_lower:
        humor_type = "none"
    elif "sarcas" in registro_lower:
        humor_type = "sarcastic"
    elif "seco" in registro_lower:
        humor_type = "dry"
    else:
        humor_type = "playful"

    # Take first N items as filler_phrases vs unique_vocabulary. Bound list
    # lengths to avoid prompt-bloat for the compiler.
    fillers = [v for v in compiled.vocabulario[:10] if len(v) < 30]
    unique_vocab = [v for v in compiled.vocabulario[:15] if len(v) >= 5]

    avg_message_length = "medium"
    if "telegráfico" in registro_lower or "telegrafico" in registro_lower or "corto" in registro_lower:
        avg_message_length = "short"
    elif "elaborado" in registro_lower or "maximalista" in registro_lower or "verboso" in registro_lower:
        avg_message_length = "long"

    punctuation_style = "standard"
    if "minimalista" in registro_lower:
        punctuation_style = "minimal"
    elif "expresivo" in registro_lower or "maximalista" in registro_lower:
        punctuation_style = "expressive"

    patterns = LinguisticPatterns(
        emoji_style=emoji_style,
        favorite_emojis=[],  # VoiceDistillationOrchestrator could surface; v1 leaves empty
        greeting=greeting,
        farewell=farewell,
        filler_phrases=fillers,
        avg_message_length=avg_message_length,
        punctuation_style=punctuation_style,
        humor_type=humor_type,
        unique_vocabulary=unique_vocab,
    )

    # ── SampleExchanges: identidad + anclajes as anchor frames ───────────
    # We synthesise minimal exchanges so PersonalityCompiler's Block 4 has
    # content. Real exchanges live in the creator's brand studio later.
    exchanges: list[SampleExchange] = [
        SampleExchange(
            context="identity_anchor",
            other_message="¿Quién sos y a quién ayudás?",
            author_response=compiled.identidad or "Coach. Acompaño cambios reales.",
        ),
    ]
    for idx, anchor in enumerate(compiled.anclajes[:3]):
        exchanges.append(
            SampleExchange(
                context=f"anchor_{idx}",
                other_message="¿Y cómo ves tu rol?",
                author_response=anchor,
            )
        )

    return personality_dims, patterns, exchanges


def compile_voice_to_system_instruction(compiled: CompiledVoice) -> str:
    """Map ``CompiledVoice`` → system_instruction string via PersonalityCompiler.

    Bridge entry point. Delegates compilation to the shared
    ``PersonalityCompiler.compile(...)`` SSoT — NEVER re-implements.

    Args:
        compiled: ``CompiledVoice`` from VoiceDistillationOrchestrator.

    Returns:
        The 5-block compiled system_instruction string ready for
        ``personality_profiles.system_instruction`` UPDATE.

    Raises:
        Nothing — caller's responsibility to handle empty / low-confidence
        CompiledVoice (still returns a valid compiled string with defaults).
    """
    dims, patterns, exchanges = map_to_dimensions_patterns(compiled)
    return PersonalityCompiler.compile(dims, patterns, exchanges)


# ─── Personality profile writer protocol + bridge service ────────────────


class PersonalityProfileWriterProtocol(Protocol):
    """Surface for persisting the compiled voice into ``personality_profiles``.

    Tenant-scoped at construction (caller's responsibility). UPDATE the
    canonical row + bump ``personality_profile_version`` so Slot 5 cache
    keys invalidate downstream.
    """

    async def update_voice(
        self,
        *,
        tenant_id: uuid.UUID,
        system_instruction: str,
        compiled_voice_metadata: dict[str, Any],
    ) -> int:
        """Persist + bump version. Returns the new version int."""
        ...


class VoiceRatifiedEventBusProtocol(Protocol):
    """Surface for emitting ``VoiceRatifiedV1`` domain events."""

    async def publish(
        self,
        *,
        event_type: str,
        tenant_id: uuid.UUID,
        payload: dict[str, Any],
    ) -> None: ...


@dataclass(frozen=True, slots=True)
class BridgeResult:
    """Result of a successful bridge call."""

    system_instruction: str
    personality_profile_version: int
    confidence_score: float


async def bridge_compiled_voice_to_personality_profile(
    *,
    tenant_id: uuid.UUID,
    job_id: uuid.UUID,
    compiled: CompiledVoice,
    profile_writer: PersonalityProfileWriterProtocol,
    event_bus: VoiceRatifiedEventBusProtocol | None = None,
) -> BridgeResult:
    """End-to-end bridge: CompiledVoice → system_instruction → persist → event.

    Steps:
      1. Map CompiledVoice → PersonalityCompiler inputs (pure function).
      2. Compile to system_instruction string via SSoT.
      3. UPDATE personality_profiles + bump version.
      4. Emit VoiceRatifiedV1 event (best-effort).

    Tenant isolation (R2): ``tenant_id`` forwarded to every collaborator.

    Best-effort event emission: failure does NOT raise.

    Args:
        tenant_id: Tenant scope.
        job_id: Source distillation job ID (audit trail).
        compiled: VoiceDistillationOrchestrator output.
        profile_writer: Persists system_instruction + bumps version.
        event_bus: Optional outbox / event bus for VoiceRatifiedV1 emission.

    Returns:
        BridgeResult with the compiled system_instruction + new version.
    """
    # 1+2. Map + compile.
    system_instruction = compile_voice_to_system_instruction(compiled)

    # 3. Persist + bump version.
    metadata = {
        "source_job_id": str(job_id),
        "confidence_score": compiled.confidence_score,
        "dialecto": compiled.dialecto,
        "samples_used": compiled.samples_used,
        "compiled_schema_version": compiled.schema_version,
    }
    new_version = await profile_writer.update_voice(
        tenant_id=tenant_id,
        system_instruction=system_instruction,
        compiled_voice_metadata=metadata,
    )

    # 4. Emit VoiceRatifiedV1 (best-effort).
    if event_bus is not None:
        try:
            await event_bus.publish(
                event_type="VoiceRatifiedV1",
                tenant_id=tenant_id,
                payload={
                    "tenant_id": str(tenant_id),
                    "source_job_id": str(job_id),
                    "personality_profile_version": new_version,
                    "confidence_score": compiled.confidence_score,
                    "dialecto": compiled.dialecto,
                    "samples_used": compiled.samples_used,
                    # NO raw text — only metadata.
                },
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "voice_ratified_event_publish_failed",
                tenant_id=str(tenant_id),
                job_id=str(job_id),
                error_type=type(exc).__name__,
                error_msg=str(exc)[:200],
            )

    logger.info(
        "voice_compiler_integration_bridged",
        tenant_id=str(tenant_id),
        job_id=str(job_id),
        new_version=new_version,
        system_instruction_chars=len(system_instruction),
        confidence_score=compiled.confidence_score,
        dialecto=compiled.dialecto,
    )

    return BridgeResult(
        system_instruction=system_instruction,
        personality_profile_version=new_version,
        confidence_score=compiled.confidence_score,
    )


__all__ = [
    "BridgeResult",
    "PersonalityProfileWriterProtocol",
    "VoiceRatifiedEventBusProtocol",
    "bridge_compiled_voice_to_personality_profile",
    "compile_voice_to_system_instruction",
    "map_to_dimensions_patterns",
]
