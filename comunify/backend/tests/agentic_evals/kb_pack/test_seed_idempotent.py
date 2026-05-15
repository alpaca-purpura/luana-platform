"""V-AE-12 — Idempotent seeding of creator_economy_kb_v1.

Story 12 T-kb-1 (R23 Opus 4.7).

Acceptance coverage:

* **Pack artifacts on disk** — manifest.py importable + ≥4 .md source files
* **Manifest schema** — all required keys + correct values per 03-arch § 7.1
* **Chunk count baseline** — ≥40 chunks (ticket constraint "~40-60 representative")
* **UUIDv5 stable across runs** — chunk_id list + point_id list identical run 1 vs run 2
* **Point id parseable** — every point_id is a valid UUID (Qdrant requirement)
* **Upsert idempotency end-to-end** — fake client + fake embedder, second
  ``seed_collection`` does NOT duplicate rows (same point_id = upsert overwrite)

Tests use deterministic in-memory fake Qdrant client + deterministic fake
embedder. No real Qdrant or OpenAI calls. Pure data.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any
from uuid import UUID

import pytest

# ─── Paths under test ────────────────────────────────────────────────────────

_THIS_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _THIS_DIR.parents[2]  # tests/agentic_evals/kb_pack/ → comunify/backend/
_PACK_DIR = _REPO_ROOT / "src" / "modules" / "comunify" / "copilot" / "kb" / "creator_economy_kb_v1"


# ─── Fakes ──────────────────────────────────────────────────────────────────


class _FakeEmbedder:
    """Deterministic in-memory embedder (3072-dim per D17 cement).

    Returns a vector that depends on simple keyword presence so cosine
    similarity is predictable across tests. Real ``text-embedding-3-large``
    is never invoked.
    """

    DIM = 3072

    def __init__(self) -> None:
        self.embed_documents_calls: list[list[str]] = []
        self.embed_query_calls: list[str] = []

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        self.embed_documents_calls.append(texts)
        return [self._vector_for(t) for t in texts]

    def embed_query(self, text: str) -> list[float]:
        self.embed_query_calls.append(text)
        return self._vector_for(text)

    def _vector_for(self, text: str) -> list[float]:
        vec = [0.001] * self.DIM
        text_low = text.lower()
        keywords = {
            "cohort": 0,
            "framework": 1,
            "lead magnet": 2,
            "burnout": 3,
            "vulnerable": 4,
            "voice": 5,
            "authority": 6,
            "community": 7,
            "tripwire": 8,
            "mastermind": 9,
        }
        for kw, idx in keywords.items():
            if kw in text_low:
                vec[idx] = 0.95
        return vec


class _FakeQdrantClient:
    """Minimal in-memory Qdrant fake.

    Stores upserted points in ``self.points`` keyed by id. Idempotency property:
    re-upserting with the same id overwrites (no duplicate row), mirroring
    real Qdrant behavior.
    """

    def __init__(self) -> None:
        self.collections: set[str] = set()
        self.points: dict[str, dict[str, Any]] = {}  # id → {id, vector, payload}
        self.upsert_call_count = 0

    def get_collections(self) -> dict[str, list[dict[str, str]]]:
        return {"collections": [{"name": n} for n in sorted(self.collections)]}

    def create_collection(self, **kwargs: Any) -> None:
        self.collections.add(kwargs["collection_name"])

    def upsert(self, **kwargs: Any) -> None:
        self.upsert_call_count += 1
        for p in kwargs["points"]:
            self.points[str(p["id"])] = {
                "id": str(p["id"]),
                "vector": p["vector"],
                "payload": dict(p["payload"]),
            }

    def query_points(self, **kwargs: Any) -> dict[str, list[dict[str, Any]]]:
        # Trivial: return all points (no real cosine math in fake)
        all_points = list(self.points.values())
        return {
            "points": [
                {"id": p["id"], "score": 0.5, "payload": p["payload"]} for p in all_points[: kwargs.get("limit", 5)]
            ]
        }

    def scroll(self, **kwargs: Any) -> tuple[list[dict[str, Any]], None]:
        # Return all points matching forced_retrieval (no filter logic in fake)
        out = [
            {"id": p["id"], "payload": p["payload"]}
            for p in self.points.values()
            if p["payload"].get("forced_retrieval")
        ]
        return (out, None)

    def retrieve(self, **kwargs: Any) -> list[dict[str, Any]]:
        ids = kwargs.get("ids", [])
        return [{"id": pid, "payload": self.points[str(pid)]["payload"]} for pid in ids if str(pid) in self.points]


# ─── Tests: artifacts present ───────────────────────────────────────────────


class TestPackArtifactsPresent:
    """Sanity: KB pack files exist on disk."""

    def test_manifest_module_importable(self) -> None:
        from src.modules.comunify.copilot.kb.creator_economy_kb_v1 import (
            get_manifest,
        )

        m = get_manifest()
        assert m.pack_id == "creator_economy_kb_v1"

    def test_pack_dir_has_markdown_files(self) -> None:
        md_files = list(_PACK_DIR.glob("*.md"))
        assert len(md_files) >= 4, (
            f"Pack has only {len(md_files)} .md files; expected ≥4 representative source files per T-kb-1"
        )

    def test_vulnerable_disclosure_md_present(self) -> None:
        path = _PACK_DIR / "vulnerable_disclosure_playbook.md"
        assert path.exists(), f"vulnerable_disclosure_playbook.md missing at {path}"


# ─── Tests: manifest schema ─────────────────────────────────────────────────


class TestManifestSchema:
    """manifest.py declares pack metadata + boundary chunks + vulnerability keywords."""

    def test_manifest_metadata(self) -> None:
        from src.modules.comunify.copilot.kb.creator_economy_kb_v1 import get_manifest

        m = get_manifest()
        assert m.pack_id == "creator_economy_kb_v1"
        assert m.qdrant_collection == "comunify_creator_economy_kb_v1"
        assert m.embedding_model == "text-embedding-3-large"
        assert m.embedding_dim == 3072  # D17 cement
        assert m.tenant_scope == "brand"
        assert m.compliance_level == "creator_economy"  # D7
        assert 0 < m.similarity_threshold < 1
        assert m.top_k >= 1
        assert m.schema_version == 1

    def test_manifest_declares_vulnerability_keywords(self) -> None:
        from src.modules.comunify.copilot.kb.creator_economy_kb_v1 import get_manifest

        m = get_manifest()
        # Must cover the 7 vulnerability categories per ticket
        # (burnout / financial / public_shaming / comparison / impostor /
        # overwhelm / loneliness)
        kws_lower = {kw.lower() for kw in m.vulnerability_keywords}
        for required_kw in [
            "burnout",
            "no tengo plata",  # financial
            "me cancelaron",  # public shaming
            "no soy suficiente",  # comparison
            "soy un fraude",  # impostor
            "estoy abrumado",  # overwhelm
            "estoy solo",  # loneliness
        ]:
            assert required_kw in kws_lower, (
                f"vulnerability_keyword {required_kw!r} missing from manifest (covers one of the 7 required categories)"
            )

    def test_manifest_declares_vulnerable_disclosure_playbook(self) -> None:
        from src.modules.comunify.copilot.kb.creator_economy_kb_v1 import get_manifest

        m = get_manifest()
        ids = {b.chunk_id for b in m.boundary_chunks}
        assert "vulnerable_disclosure_playbook" in ids, (
            "Boundary chunk vulnerable_disclosure_playbook MUST be declared "
            "per ticket T-kb-1 acceptance (forced retrieval REQUIRED)."
        )
        # The single boundary chunk must use vulnerability_keywords trigger
        playbook = next(b for b in m.boundary_chunks if b.chunk_id == "vulnerable_disclosure_playbook")
        assert playbook.forced_retrieval is True
        assert playbook.triggers == "vulnerability_keywords"

    def test_vulnerable_disclosure_playbook_chunk_id_constant(self) -> None:
        from src.modules.comunify.copilot.kb.creator_economy_kb_v1.manifest import (
            VULNERABLE_DISCLOSURE_PLAYBOOK_CHUNK_ID,
        )

        # Stable constant per T-kb-1 spec (ticket body line 23).
        assert VULNERABLE_DISCLOSURE_PLAYBOOK_CHUNK_ID == "vulnerable_disclosure_playbook"


# ─── Tests: chunk count baseline ────────────────────────────────────────────


class TestChunkCountBaseline:
    """V-AE-12 acceptance — pack has ≥40 chunks (ticket ~40-60 representative)."""

    def test_chunk_count_meets_baseline(self) -> None:
        from src.modules.comunify.copilot.extractors._kb_seed_loader import (
            chunk_count,
        )

        n = chunk_count()
        assert n >= 40, (
            f"Pack has only {n} chunks; T-kb-1 ticket targets ~40-60 "
            "representative chunks. Add more H2 anchors to source .md files."
        )
        assert n <= 80, (
            f"Pack has {n} chunks — ticket ceiling is 60 representative + "
            "tolerance to 80. Above that, consider splitting into v2."
        )


# ─── Tests: idempotent load ─────────────────────────────────────────────────


class TestLoadIdempotent:
    """Re-running ``load_chunks_from_pack`` produces deterministic outputs."""

    def test_chunk_ids_stable_across_runs(self) -> None:
        from src.modules.comunify.copilot.extractors._kb_seed_loader import (
            assert_idempotent_chunk_ids,
        )

        ids_1, ids_2 = assert_idempotent_chunk_ids()
        assert ids_1 == ids_2, "Chunk ids must be deterministic across loads"

    def test_point_ids_uuid_parseable(self) -> None:
        from src.modules.comunify.copilot.extractors._kb_seed_loader import (
            load_chunks_from_pack,
        )

        chunks = load_chunks_from_pack()
        assert len(chunks) > 0
        for c in chunks:
            # Must parse as UUID (Qdrant point id contract).
            UUID(c.point_id)

    def test_point_ids_unique(self) -> None:
        from src.modules.comunify.copilot.extractors._kb_seed_loader import (
            load_chunks_from_pack,
        )

        chunks = load_chunks_from_pack()
        point_ids = [c.point_id for c in chunks]
        assert len(point_ids) == len(set(point_ids)), (
            "Duplicate point_id detected — chunk ids must be globally unique "
            "across all source .md files (idempotent re-seed contract)."
        )


# ─── Tests: idempotent upsert end-to-end ────────────────────────────────────


class TestUpsertIdempotency:
    """Seed twice → second seed re-upserts (same count) but `points` dict
    has same size after both seeds (no duplicates).
    """

    @pytest.fixture
    def fake_store(self) -> tuple[Any, Any, Any]:
        from src.modules.comunify.copilot.extractors._kb_seed_loader import (
            ComunifyCreatorEconomyKbStore,
        )

        client = _FakeQdrantClient()
        embedder = _FakeEmbedder()
        store = ComunifyCreatorEconomyKbStore(client=client, embedder=embedder)
        return store, client, embedder

    def test_first_seed_creates_collection(self, fake_store: tuple[Any, Any, Any]) -> None:
        from scripts.seed_creator_economy_kb import seed_collection
        from src.modules.comunify.copilot.extractors._kb_seed_loader import (
            load_chunks_from_pack,
        )

        store, client, _ = fake_store
        chunks = load_chunks_from_pack()
        count = seed_collection(store, chunks)

        assert count == len(chunks)
        assert "comunify_creator_economy_kb_v1" in client.collections
        assert len(client.points) == len(chunks)

    def test_second_seed_no_duplicates(self, fake_store: tuple[Any, Any, Any]) -> None:
        from scripts.seed_creator_economy_kb import seed_collection
        from src.modules.comunify.copilot.extractors._kb_seed_loader import (
            load_chunks_from_pack,
        )

        store, client, _ = fake_store
        chunks = load_chunks_from_pack()

        # First seed
        count_1 = seed_collection(store, chunks)
        points_after_first = dict(client.points)  # snapshot

        # Second seed (re-run)
        count_2 = seed_collection(store, chunks)
        points_after_second = client.points

        assert count_1 == count_2  # same chunk count
        # Idempotent property: same point_ids, no new keys added
        assert set(points_after_first.keys()) == set(points_after_second.keys())
        assert len(points_after_second) == len(chunks)
        # Upsert was called twice but rows didn't multiply
        assert client.upsert_call_count == 2

    def test_payload_contains_citation_chunk_id(self, fake_store: tuple[Any, Any, Any]) -> None:
        """Citation contract: every chunk's payload must carry ``chunk_id`` so
        the agent can cite it in ``copilot_trace_event.context_used``.
        """
        from scripts.seed_creator_economy_kb import seed_collection
        from src.modules.comunify.copilot.extractors._kb_seed_loader import (
            load_chunks_from_pack,
        )

        store, client, _ = fake_store
        chunks = load_chunks_from_pack()
        seed_collection(store, chunks)

        for point_id, point in client.points.items():
            assert "chunk_id" in point["payload"], (
                f"Point {point_id} missing chunk_id in payload — citation "
                "contract violated (copilot_trace_event.context_used requires chunk_id)."
            )
            assert point["payload"]["chunk_id"], "chunk_id must be non-empty"


# ─── Tests: seed_all CLI wiring ─────────────────────────────────────────────


class TestSeedAllWiring:
    """``seed_all()`` returns ``{pack_id: count}`` with injected fakes."""

    def test_seed_all_with_injected_fakes(self) -> None:
        from scripts.seed_creator_economy_kb import seed_all

        embedder = _FakeEmbedder()
        client = _FakeQdrantClient()
        counts = seed_all(embedder=embedder, client=client)

        assert counts == {"creator_economy_kb_v1": pytest.approx(len(client.points))}
        assert counts["creator_economy_kb_v1"] >= 40
