"""V-AE-12 — Tenant filter at query time.

Story 12 T-kb-1 (R23 Opus 4.7).

Per 03-arch-agentic.md § 7.4:

    base_filter = qdrant.Filter(must=[
        FieldCondition(key="kb_pack", match=MatchValue(value="creator_economy_kb_v1")),
        FieldCondition(key="tenant_id", match=MatchAny(any=[None, str(ctx.tenant_id)])),
    ])

Acceptance coverage:

* **Generic chunks visible to all tenants** — when querying tenant_id=A, the
  generic chunks (tenant_id=None payload) are returned.
* **Per-tenant override chunks isolated** — when tenant_id=B has its own
  override chunk in the collection, tenant_id=A does NOT see it (and vice versa).
* **Null tenant query returns ONLY generic chunks** — bypass per-tenant data.
* **Cross-tenant isolation enforced** — the filter is checked at every query.
* **Citation contract** — every returned chunk's payload has ``chunk_id``.

Tests use in-memory fake Qdrant client that respects the filter semantic.
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest

# ─── Fake Qdrant client that respects tenant_id filter ──────────────────────


class _FakeEmbedder:
    DIM = 3072

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[0.5] * self.DIM for _ in texts]

    def embed_query(self, text: str) -> list[float]:
        return [0.5] * self.DIM


class _FakeTenantAwareQdrantClient:
    """Fake Qdrant that respects the tenant_id payload filter.

    Filter shapes supported (matches the ones emitted by
    ``ComunifyCreatorEconomyKbStore.search``):

      A) ``{"must": [{"key": "tenant_id", "match": {"any": [None, "..."]}}]}``
         → return points where payload.tenant_id IS NULL OR == "..."
      B) ``{"must": [{"is_null": {"key": "tenant_id"}}]}``
         → return points where payload.tenant_id IS NULL only
      C) ``{"must": [{"key": "forced_retrieval", "match": {"value": True}}]}``
         → for scroll() — forced retrieval chunks only
    """

    def __init__(self) -> None:
        self.collections: set[str] = set()
        self.points: dict[str, dict[str, Any]] = {}

    def get_collections(self) -> dict[str, list[dict[str, str]]]:
        return {"collections": [{"name": n} for n in sorted(self.collections)]}

    def create_collection(self, **kwargs: Any) -> None:
        self.collections.add(kwargs["collection_name"])

    def upsert(self, **kwargs: Any) -> None:
        for p in kwargs["points"]:
            self.points[str(p["id"])] = {
                "id": str(p["id"]),
                "vector": p["vector"],
                "payload": dict(p["payload"]),
            }

    def query_points(self, **kwargs: Any) -> dict[str, list[dict[str, Any]]]:
        q_filter = kwargs.get("query_filter")
        limit = kwargs.get("limit", 5)
        candidates = list(self.points.values())

        # Filter routine results: exclude forced chunks (those come via scroll).
        candidates = [p for p in candidates if not p["payload"].get("forced_retrieval")]

        # Apply tenant_id filter
        filtered = self._apply_filter(candidates, q_filter)

        return {"points": [{"id": p["id"], "score": 0.7, "payload": p["payload"]} for p in filtered[:limit]]}

    def scroll(self, **kwargs: Any) -> tuple[list[dict[str, Any]], None]:
        candidates = list(self.points.values())
        q_filter = kwargs.get("scroll_filter")
        filtered = self._apply_filter(candidates, q_filter)
        out = [{"id": p["id"], "payload": p["payload"]} for p in filtered]
        return (out, None)

    def retrieve(self, **kwargs: Any) -> list[dict[str, Any]]:
        ids = kwargs.get("ids", [])
        return [{"id": pid, "payload": self.points[str(pid)]["payload"]} for pid in ids if str(pid) in self.points]

    @staticmethod
    def _apply_filter(
        candidates: list[dict[str, Any]],
        q_filter: dict[str, Any] | None,
    ) -> list[dict[str, Any]]:
        if not q_filter:
            return candidates
        must_clauses = q_filter.get("must", [])
        out = []
        for p in candidates:
            payload = p["payload"]
            if all(_clause_matches(payload, c) for c in must_clauses):
                out.append(p)
        return out


def _clause_matches(payload: dict[str, Any], clause: dict[str, Any]) -> bool:
    # is_null shape: {"is_null": {"key": "tenant_id"}}
    if "is_null" in clause:
        key = clause["is_null"]["key"]
        return payload.get(key) is None
    # key + match shape
    key = clause.get("key")
    match = clause.get("match", {})
    if "any" in match:
        candidates = match["any"]
        return payload.get(key) in candidates
    if "value" in match:
        return payload.get(key) == match["value"]
    return True


# ─── Test fixture — seed generic + per-tenant override chunks ───────────────


_TENANT_A = str(uuid.uuid4())
_TENANT_B = str(uuid.uuid4())


@pytest.fixture
def multi_tenant_store() -> tuple[Any, Any]:
    """Seed generic chunks + 1 override chunk for TENANT_A + 1 for TENANT_B."""
    from scripts.seed_creator_economy_kb import seed_collection
    from src.modules.comunify.copilot.extractors._kb_seed_loader import (
        ComunifyCreatorEconomyKbStore,
        KbChunkRecord,
        _stable_point_id,
        load_chunks_from_pack,
    )

    client = _FakeTenantAwareQdrantClient()
    embedder = _FakeEmbedder()
    store = ComunifyCreatorEconomyKbStore(client=client, embedder=embedder)

    # 1. Seed all generic chunks
    chunks = load_chunks_from_pack()
    seed_collection(store, chunks)

    # 2. Inject 2 tenant-specific override chunks (NOT from .md — synthetic)
    override_a = KbChunkRecord(
        chunk_id="tenant_specific_override_a",
        pack_id="creator_economy_kb_v1",
        source_doc="<synthetic_tenant_a>",
        text="Tenant A specific chunk for cohort B2B-AR-2026.",
        point_id=_stable_point_id("creator_economy_kb_v1", "synthetic", "tenant_a_override"),
        topic_tags=("override",),
        forced_retrieval=False,
        triggers="",
        tenant_id=_TENANT_A,
    )
    override_b = KbChunkRecord(
        chunk_id="tenant_specific_override_b",
        pack_id="creator_economy_kb_v1",
        source_doc="<synthetic_tenant_b>",
        text="Tenant B specific chunk for cohort coaching-MX-2026.",
        point_id=_stable_point_id("creator_economy_kb_v1", "synthetic", "tenant_b_override"),
        topic_tags=("override",),
        forced_retrieval=False,
        triggers="",
        tenant_id=_TENANT_B,
    )
    store.upsert_chunks([override_a, override_b])

    return store, client


# ─── Tests ──────────────────────────────────────────────────────────────────


class TestTenantFilterAtQuery:
    """tenant_id filter MUST match null=generic OR tenant_id=requested."""

    def test_no_tenant_id_returns_only_generic(self, multi_tenant_store: tuple[Any, Any]) -> None:
        """Query with tenant_id=None: only generic chunks (no overrides)."""
        store, _ = multi_tenant_store
        results = store.search(query="cohort design", tenant_id=None, limit=100)
        chunk_ids = [r["payload"]["chunk_id"] for r in results]
        # No tenant overrides leak when no tenant_id provided
        assert "tenant_specific_override_a" not in chunk_ids
        assert "tenant_specific_override_b" not in chunk_ids
        # Generic chunks are returned
        assert len(chunk_ids) > 0
        # All returned chunks must have tenant_id=None in payload
        for r in results:
            assert r["payload"]["tenant_id"] is None, (
                f"Chunk {r['payload']['chunk_id']} leaked through tenant=None filter despite having tenant_id set"
            )

    def test_tenant_a_sees_generic_plus_own_override(self, multi_tenant_store: tuple[Any, Any]) -> None:
        """tenant_id=A: generic + override_a. NOT override_b."""
        store, _ = multi_tenant_store
        results = store.search(query="cohort", tenant_id=_TENANT_A, limit=100)
        chunk_ids = {r["payload"]["chunk_id"] for r in results}

        # Tenant A's override IS visible
        assert "tenant_specific_override_a" in chunk_ids
        # Tenant B's override is NOT visible (cross-tenant isolation)
        assert "tenant_specific_override_b" not in chunk_ids
        # Generic chunks (tenant_id=None) ARE visible
        # (we don't assert exact count — depends on .md content drift, but
        # there should be at LEAST a few generic chunks)
        generic_chunks = [r for r in results if r["payload"]["tenant_id"] is None]
        assert len(generic_chunks) >= 3

    def test_tenant_b_sees_generic_plus_own_override(self, multi_tenant_store: tuple[Any, Any]) -> None:
        """tenant_id=B: generic + override_b. NOT override_a."""
        store, _ = multi_tenant_store
        results = store.search(query="cohort", tenant_id=_TENANT_B, limit=100)
        chunk_ids = {r["payload"]["chunk_id"] for r in results}

        assert "tenant_specific_override_b" in chunk_ids
        assert "tenant_specific_override_a" not in chunk_ids

    def test_cross_tenant_payload_never_leaks(self, multi_tenant_store: tuple[Any, Any]) -> None:
        """For every result returned to tenant A, payload.tenant_id is
        None OR == TENANT_A. NEVER TENANT_B (cross-tenant leak).
        """
        store, _ = multi_tenant_store
        results = store.search(query="cohort", tenant_id=_TENANT_A, limit=100)
        for r in results:
            tid = r["payload"]["tenant_id"]
            assert tid is None or tid == _TENANT_A, (
                f"Cross-tenant leak detected: payload tenant_id={tid!r} returned for tenant_id={_TENANT_A!r}"
            )

    def test_payload_carries_citation_chunk_id(self, multi_tenant_store: tuple[Any, Any]) -> None:
        """Citation contract MUST work for both generic + per-tenant chunks."""
        store, _ = multi_tenant_store
        results = store.search(query="cohort", tenant_id=_TENANT_A, limit=100)
        for r in results:
            assert "chunk_id" in r["payload"]
            assert r["payload"]["chunk_id"]


class TestVulnerabilityForcedRetrievalRespectsTenant:
    """Forced retrieval works regardless of tenant_id (boundary chunk is global)."""

    def test_tenant_a_vulnerability_query_gets_playbook_top_1(self, multi_tenant_store: tuple[Any, Any]) -> None:
        store, _ = multi_tenant_store
        results = store.search(
            query="estoy quemado y no aguanto más",
            tenant_id=_TENANT_A,
        )
        assert len(results) >= 1
        assert results[0]["payload"]["chunk_id"] == "vulnerable_disclosure_playbook", (
            "Vulnerability forced retrieval should bypass tenant filter — "
            "playbook is brand-scope content valid for all tenants"
        )

    def test_tenant_b_vulnerability_query_also_gets_playbook(self, multi_tenant_store: tuple[Any, Any]) -> None:
        store, _ = multi_tenant_store
        results = store.search(query="me cancelaron", tenant_id=_TENANT_B)
        assert len(results) >= 1
        assert results[0]["payload"]["chunk_id"] == "vulnerable_disclosure_playbook"
