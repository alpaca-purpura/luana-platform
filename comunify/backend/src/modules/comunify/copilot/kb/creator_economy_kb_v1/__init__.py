"""creator_economy_kb_v1 — Comunify vertical-creator-economy KB pack.

Created by T-kb-1 (R23 Opus 4.7 production AGENTIC code).

Per ``03-arch-agentic.md`` § 7:

* Qdrant collection: ``comunify_creator_economy_kb_v1``
* Embedding model: ``text-embedding-3-large`` with ``dimensions=3072``
* tenant_scope: ``brand`` (cross-tenant share — creator-economy reference content)
* compliance_level: ``creator_economy`` (D7 — NOT ``hipaa_lite`` vs Vitalia D7)
* Forced retrieval: ``vulnerable_disclosure_playbook`` top-1 on vulnerability keywords
* Citation contract: ``chunk_id`` MUST surface in ``copilot_trace_event.context_used``

Content categories (per ``03-arch-agentic.md`` § 7.3):

* **Frameworks** — StoryBrand 7 elementos, value ladder Russell Brunson,
  jobs-to-be-done, cohort-based course playbook, Jung archetypes for creators
* **Terminology** — lead magnet, tripwire, core offer, premium, cohort design,
  community-based learning, mastermind, MRR/ARR, churn
* **Cohort design** — capacity sizing, duration, live vs async, moderation
  playbooks, onboarding rituals
* **Community engagement** — drift detection signals, re-engagement playbooks,
  healthy boundaries, moderation queue
* **Voice-cloning tips** — good chat samples, when to re-distill, dialect coverage
* **Authority vault** — credentials hierarchy, PR/media, testimonial weighting
* **Vulnerable disclosure** — single playbook chunk (forced retrieval — burnout /
  financial-stress / public-shaming / comparison-trap)

Chunk count target: ~45-55 (representative coverage per ticket T-kb-1 constraint
"NOT 250 literal; representative coverage for eval gates per architect intent").
"""

from src.modules.comunify.copilot.kb.creator_economy_kb_v1.manifest import (
    BOUNDARY_CHUNKS,
    CHUNK_SOURCES,
    COMPLIANCE_LEVEL,
    EMBEDDING_DIM,
    EMBEDDING_MODEL,
    PACK_ID,
    QDRANT_COLLECTION,
    SCHEMA_VERSION,
    SIMILARITY_THRESHOLD,
    TENANT_SCOPE,
    TOP_K,
    TOPIC_TAGS,
    VULNERABILITY_KEYWORDS,
    VULNERABLE_DISCLOSURE_PLAYBOOK_CHUNK_ID,
    BoundaryChunkDecl,
    Manifest,
    get_manifest,
)

__all__ = [
    "BOUNDARY_CHUNKS",
    "CHUNK_SOURCES",
    "COMPLIANCE_LEVEL",
    "EMBEDDING_DIM",
    "EMBEDDING_MODEL",
    "PACK_ID",
    "QDRANT_COLLECTION",
    "SCHEMA_VERSION",
    "SIMILARITY_THRESHOLD",
    "TENANT_SCOPE",
    "TOP_K",
    "TOPIC_TAGS",
    "VULNERABILITY_KEYWORDS",
    "VULNERABLE_DISCLOSURE_PLAYBOOK_CHUNK_ID",
    "BoundaryChunkDecl",
    "Manifest",
    "get_manifest",
]
