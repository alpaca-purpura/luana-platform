"""creator_economy_kb_v1 manifest (Python module — vs Vitalia's YAML).

Created by T-kb-1 (R23 Opus 4.7 production AGENTIC code).

Why Python module instead of YAML?
  - ``yaml`` is NOT installed in the comunify backend venv (verified
    2026-05-14: ``.venv/bin/python3 -c "import yaml"`` → ModuleNotFoundError).
  - Adding a runtime dep for declarative manifest is overkill for the
    bootstrap (ticket constraint: stub qdrant; defer real ingestion per HS1).
  - Python module is import-safe + zero runtime deps + IDE-introspectable.
  - The shape is identical to Vitalia's manifest.yaml — only the format
    differs. A future story can lift to a shared loader if a 3rd brand
    needs the same shape.

Per 03-arch-agentic.md § 7.

Anti-duplication audit-trail: Vitalia uses YAML manifest (Story 11 T-kb-2);
comunify uses Python module (Story 12 T-kb-1). Both are brand-isolated per
``.claude/rules/anti-duplication.md`` row "luana-platform Extension SDK"
(brand-isolated by path, NOT shared abstraction).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Final

# ─── Pack metadata ──────────────────────────────────────────────────────────

PACK_ID: Final[str] = "creator_economy_kb_v1"
QDRANT_COLLECTION: Final[str] = "comunify_creator_economy_kb_v1"
EMBEDDING_MODEL: Final[str] = "text-embedding-3-large"
EMBEDDING_DIM: Final[int] = 3072  # text-embedding-3-large default 3072-dim (vs Vitalia 1536)
SIMILARITY_THRESHOLD: Final[float] = 0.72  # RAG retrieval contract (03-arch § 7.6)
TOP_K: Final[int] = 5  # RAG retrieval contract (03-arch § 7.6)
SCHEMA_VERSION: Final[int] = 1
COMPLIANCE_LEVEL: Final[str] = "creator_economy"  # D7 — NOT hipaa_lite
TENANT_SCOPE: Final[str] = "brand"  # cross-tenant share

# Stable constant per T-kb-1 spec (used as forced-retrieval chunk_id).
VULNERABLE_DISCLOSURE_PLAYBOOK_CHUNK_ID: Final[str] = "vulnerable_disclosure_playbook"


# ─── Chunk source files ─────────────────────────────────────────────────────
# Alphabetical to keep parallel-session merges predictable.
# Each .md file is split by ## H2 anchors into N chunks.

CHUNK_SOURCES: Final[tuple[str, ...]] = (
    "authority_vault.md",
    "cohort_design.md",
    "common_questions.md",
    "community_engagement.md",
    "frameworks.md",
    "terminology.md",
    "voice_cloning_tips.md",
    "vulnerable_disclosure_playbook.md",
)


# ─── Vulnerability keyword detection ────────────────────────────────────────
# Patient/creator INPUT detection — forced retrieval triggered when ANY of these
# keywords appears in the query. Spanish neutro + voseo coverage (per `.claude/
# rules/spanish-text.md` exception — agent OUTPUT respects per-tenant voice,
# INPUT detection MUST accept voseo so AR creators still trigger boundary).
#
# Categories (per ticket T-kb-1 line 6 "vulnerability keywords"):
#   - Burnout signals
#   - Financial stress / vulnerability
#   - Public shaming / cancel-culture
#   - Comparison trap
#   - Impostor syndrome
#   - Overwhelm / overload
#   - Loneliness in creator path

VULNERABILITY_KEYWORDS: Final[tuple[str, ...]] = (
    # Burnout
    "burnout",
    "estoy quemado",
    "estoy quemada",
    "estoy agotado",
    "estoy agotada",
    "no doy más",
    "no aguanto más",
    "ya no puedo",
    "ya no quiero seguir",
    "exhausto",
    "exhausta",
    "agotamiento",
    # Financial stress / vulnerability
    "no tengo plata",
    "no me llega",
    "no llego a fin de mes",
    "no me alcanza",
    "estoy quebrado",
    "estoy quebrada",
    "estoy en cero",
    "no tengo ingresos",
    "necesito plata urgente",
    "necesito dinero urgente",
    "estoy desesperado",
    "estoy desesperada",
    # Public shaming / cancel-culture
    "me cancelaron",
    "me funaron",
    "me están atacando",
    "me están bardeando",
    "todos me odian",
    "me están escrachando",
    "están hablando mal de mí",
    # Comparison trap
    "todos son mejores que yo",
    "no soy suficiente",
    "no valgo nada",
    "no sirvo para esto",
    "todos crecen menos yo",
    "los demás la rompen",
    # Impostor syndrome
    "soy un fraude",
    "soy una fraude",
    "me van a descubrir",
    "no merezco esto",
    "no soy experto",
    "no soy experta",
    # Overwhelm / overload
    "estoy abrumado",
    "estoy abrumada",
    "estoy desbordado",
    "estoy desbordada",
    "no puedo con todo",
    "es demasiado",
    # Loneliness in creator path
    "estoy solo",
    "estoy sola",
    "nadie me entiende",
    "no tengo a nadie",
)


# ─── Boundary chunks (forced retrieval bypasses similarity threshold) ───────


@dataclass(frozen=True, slots=True)
class BoundaryChunkDecl:
    """One boundary chunk declaration — forced retrieval entry."""

    chunk_id: str
    source: str
    forced_retrieval: bool
    triggers: str  # "vulnerability_keywords" — extensible to future categories
    priority: int
    # applies_to: empty tuple = always. (creator-economy is global; per-country
    # routing not in scope for bootstrap. Future story may add applies_to_countries.)
    applies_to_countries: tuple[str, ...] = field(default_factory=tuple)


BOUNDARY_CHUNKS: Final[tuple[BoundaryChunkDecl, ...]] = (
    BoundaryChunkDecl(
        chunk_id=VULNERABLE_DISCLOSURE_PLAYBOOK_CHUNK_ID,
        source="vulnerable_disclosure_playbook.md",
        forced_retrieval=True,
        triggers="vulnerability_keywords",
        priority=1,
        applies_to_countries=(),  # always
    ),
)


# ─── Topic tag taxonomy (chunk metadata) ────────────────────────────────────

TOPIC_TAGS: Final[tuple[str, ...]] = (
    "framework",
    "terminology",
    "cohort_design",
    "community_engagement",
    "voice_cloning",
    "authority_vault",
    "vulnerable_disclosure",
    "common_question",
)


# ─── Manifest accessor (mirrors Vitalia's YAML loader return-shape) ─────────


@dataclass(frozen=True, slots=True)
class Manifest:
    """Aggregated manifest — returned by ``get_manifest()``.

    Mirrors the shape that ``yaml.safe_load(manifest.yaml)`` returns in Vitalia,
    so test code + seed script can stay symmetric across brands.
    """

    pack_id: str
    qdrant_collection: str
    embedding_model: str
    embedding_dim: int
    similarity_threshold: float
    top_k: int
    schema_version: int
    compliance_level: str
    tenant_scope: str
    chunk_sources: tuple[str, ...]
    vulnerability_keywords: tuple[str, ...]
    boundary_chunks: tuple[BoundaryChunkDecl, ...]
    topic_tags: tuple[str, ...]
    vulnerable_disclosure_playbook_chunk_id: str


def get_manifest() -> Manifest:
    """Return the immutable manifest aggregate.

    Pure Python — zero IO. Re-callable cheaply.
    """
    return Manifest(
        pack_id=PACK_ID,
        qdrant_collection=QDRANT_COLLECTION,
        embedding_model=EMBEDDING_MODEL,
        embedding_dim=EMBEDDING_DIM,
        similarity_threshold=SIMILARITY_THRESHOLD,
        top_k=TOP_K,
        schema_version=SCHEMA_VERSION,
        compliance_level=COMPLIANCE_LEVEL,
        tenant_scope=TENANT_SCOPE,
        chunk_sources=CHUNK_SOURCES,
        vulnerability_keywords=VULNERABILITY_KEYWORDS,
        boundary_chunks=BOUNDARY_CHUNKS,
        topic_tags=TOPIC_TAGS,
        vulnerable_disclosure_playbook_chunk_id=VULNERABLE_DISCLOSURE_PLAYBOOK_CHUNK_ID,
    )
