"""V-AE-12 — Vulnerable disclosure forced retrieval.

Story 12 T-kb-1 (R23 Opus 4.7).

Acceptance coverage:

* **Vulnerability detection** — ``ComunifyCreatorEconomyKbStore
  .detect_vulnerability_keywords()`` returns True for each of the 7 categories
  (burnout / financial / public_shaming / comparison / impostor / overwhelm /
  loneliness) AND False for benign inputs.
* **Forced retrieval top-1** — when ANY vulnerability_keyword present in
  query, the ``vulnerable_disclosure_playbook`` chunk is returned as top-1
  (priority over routine cosine results).
* **Non-vulnerability inputs** — no forced retrieval; routine search only.
* **Case insensitivity** — vulnerability detection works regardless of
  capitalization.

Tests use in-memory fake Qdrant client + deterministic fake embedder.
"""

from __future__ import annotations

from typing import Any

import pytest

# ─── Fakes (shared shape with test_seed_idempotent.py) ──────────────────────


class _FakeEmbedder:
    DIM = 3072

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._vec(t) for t in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._vec(text)

    def _vec(self, text: str) -> list[float]:
        return [0.5] * self.DIM


class _FakeQdrantClient:
    """In-memory fake — supports seed + scroll(forced_retrieval) + query_points."""

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
        # Fake: return all GENERIC chunks (tenant_id=None) with deterministic score
        # → does NOT include forced chunk
        all_generic = [
            {"id": p["id"], "score": 0.7, "payload": p["payload"]}
            for p in self.points.values()
            if p["payload"].get("tenant_id") is None and not p["payload"].get("forced_retrieval")
        ]
        return {"points": all_generic[: kwargs.get("limit", 5)]}

    def scroll(self, **kwargs: Any) -> tuple[list[dict[str, Any]], None]:
        # Return forced chunks only (mimics filter on forced_retrieval=True)
        out = [
            {"id": p["id"], "payload": p["payload"]}
            for p in self.points.values()
            if p["payload"].get("forced_retrieval")
        ]
        return (out, None)

    def retrieve(self, **kwargs: Any) -> list[dict[str, Any]]:
        ids = kwargs.get("ids", [])
        return [{"id": pid, "payload": self.points[str(pid)]["payload"]} for pid in ids if str(pid) in self.points]


# ─── Fixture: seeded store ──────────────────────────────────────────────────


@pytest.fixture
def seeded_store() -> Any:
    """Store with all bootstrap chunks seeded (incl. vulnerable_disclosure_playbook)."""
    from scripts.seed_creator_economy_kb import seed_collection
    from src.modules.comunify.copilot.extractors._kb_seed_loader import (
        ComunifyCreatorEconomyKbStore,
        load_chunks_from_pack,
    )

    client = _FakeQdrantClient()
    embedder = _FakeEmbedder()
    store = ComunifyCreatorEconomyKbStore(client=client, embedder=embedder)

    chunks = load_chunks_from_pack()
    seed_collection(store, chunks)
    return store


# ─── Tests: vulnerability detection ─────────────────────────────────────────


class TestDetectVulnerabilityKeywords:
    """``detect_vulnerability_keywords`` covers all 7 categories."""

    @pytest.fixture
    def store_with_no_data(self) -> Any:
        """Store with embedder + manifest but no Qdrant interaction needed.

        Detection is a pure-Python keyword scan — doesn't need seeded data.
        """
        from src.modules.comunify.copilot.extractors._kb_seed_loader import (
            ComunifyCreatorEconomyKbStore,
        )

        # client + embedder optional for detection path
        return ComunifyCreatorEconomyKbStore(
            client=_FakeQdrantClient(),
            embedder=_FakeEmbedder(),
        )

    @pytest.mark.parametrize(
        ("query", "expected", "category"),
        [
            # Burnout
            ("Estoy quemado y no doy más", True, "burnout"),
            ("estoy agotado totalmente", True, "burnout"),
            # Financial stress
            ("no tengo plata para inscribirme", True, "financial"),
            ("estoy quebrado este mes", True, "financial"),
            ("no llego a fin de mes", True, "financial"),
            # Public shaming
            ("me cancelaron en Twitter", True, "public_shaming"),
            ("me están bardeando los seguidores", True, "public_shaming"),
            # Comparison trap
            ("todos son mejores que yo", True, "comparison"),
            ("no soy suficiente para esto", True, "comparison"),
            # Impostor syndrome
            ("soy un fraude", True, "impostor"),
            ("me van a descubrir que no sé nada", True, "impostor"),
            # Overwhelm
            ("estoy abrumado con tantas tareas", True, "overwhelm"),
            ("es demasiado para mí", True, "overwhelm"),
            # Loneliness
            ("estoy solo en este camino", True, "loneliness"),
            ("nadie me entiende lo que hago", True, "loneliness"),
            # Benign — no vulnerability
            ("Hola, quería saber cuánto cuesta el cohort", False, "benign_pricing"),
            ("¿En qué fecha empieza la próxima cohort?", False, "benign_date"),
            ("Me interesa la membresía", False, "benign_signup"),
            ("Gracias por la info!", False, "benign_thanks"),
            ("", False, "empty_string"),
        ],
    )
    def test_detection_per_category(
        self,
        store_with_no_data: Any,
        query: str,
        expected: bool,
        category: str,
    ) -> None:
        actual = store_with_no_data.detect_vulnerability_keywords(query)
        assert actual is expected, f"category={category} query={query!r} expected={expected} got={actual}"

    def test_detection_case_insensitive(self, store_with_no_data: Any) -> None:
        """Detection must be case-insensitive (creators type in mixed case)."""
        # All caps
        assert store_with_no_data.detect_vulnerability_keywords("ESTOY QUEMADO")
        # Mixed case
        assert store_with_no_data.detect_vulnerability_keywords("Estoy Quemado")
        # First letter cap
        assert store_with_no_data.detect_vulnerability_keywords("No tengo plata")


# ─── Tests: forced retrieval at search time ─────────────────────────────────


class TestForcedRetrievalOnVulnerability:
    """When query contains vulnerability keyword → playbook chunk is top-1."""

    def test_vulnerability_query_returns_playbook_top_1(self, seeded_store: Any) -> None:
        results = seeded_store.search(query="Estoy quemado, no doy más con esto del lanzamiento")
        assert len(results) >= 1
        top_chunk_id = results[0]["payload"]["chunk_id"]
        assert top_chunk_id == "vulnerable_disclosure_playbook", (
            f"Top result must be vulnerable_disclosure_playbook but got "
            f"{top_chunk_id}. Forced retrieval not firing or merge order wrong."
        )

    def test_vulnerability_query_marks_playbook_with_forced_score(self, seeded_store: Any) -> None:
        """Synthetic forced score = 1.0 (highest)."""
        results = seeded_store.search(query="me cancelaron")
        playbook_hits = [r for r in results if r["payload"]["chunk_id"] == "vulnerable_disclosure_playbook"]
        assert len(playbook_hits) == 1
        assert playbook_hits[0]["score"] == 1.0

    def test_benign_query_no_forced_retrieval(self, seeded_store: Any) -> None:
        """Without vulnerability keyword → playbook NOT in results."""
        results = seeded_store.search(query="quería saber cuánto sale la cohort de copywriting")
        chunk_ids = [r["payload"]["chunk_id"] for r in results]
        assert "vulnerable_disclosure_playbook" not in chunk_ids, (
            "Benign query MUST NOT pull the vulnerable_disclosure_playbook. "
            "Forced retrieval should ONLY fire on vulnerability_keywords match."
        )

    def test_forced_chunk_dedupes_in_results(self, seeded_store: Any) -> None:
        """If routine search ALSO returned the playbook (in some edge case),
        merge dedupes by point_id so there's exactly one playbook entry.
        """
        results = seeded_store.search(query="estoy abrumado")
        playbook_count = sum(1 for r in results if r["payload"]["chunk_id"] == "vulnerable_disclosure_playbook")
        assert playbook_count == 1, (
            f"vulnerable_disclosure_playbook appeared {playbook_count} times in results — merge dedup logic broken"
        )

    def test_forced_chunk_payload_carries_required_fields(self, seeded_store: Any) -> None:
        """The forced chunk MUST carry the citation contract fields."""
        results = seeded_store.search(query="estoy agotado")
        playbook_hits = [r for r in results if r["payload"]["chunk_id"] == "vulnerable_disclosure_playbook"]
        assert len(playbook_hits) == 1
        payload = playbook_hits[0]["payload"]
        # Citation contract
        assert payload["chunk_id"] == "vulnerable_disclosure_playbook"
        assert payload["pack_id"] == "creator_economy_kb_v1"
        assert payload["forced_retrieval"] is True
        assert payload["triggers"] == "vulnerability_keywords"
        assert payload["source_doc"] == "vulnerable_disclosure_playbook.md"
        # Text body must contain actionable handoff instructions (acknowledge +
        # boundary + recurso). Check sentinel keywords from the playbook body.
        text_low = payload["text"].lower()
        for sentinel in ["acknowledge", "boundary", "recurso", "creador humano"]:
            assert sentinel in text_low, (
                f"vulnerable_disclosure_playbook body missing sentinel {sentinel!r}. "
                "Playbook chunk must include acknowledge + boundary + escalation."
            )


# ─── Tests: empty query handling ────────────────────────────────────────────


class TestEmptyQueryHandling:
    """Empty / whitespace query returns empty results (no crash)."""

    def test_empty_string_returns_empty(self, seeded_store: Any) -> None:
        assert seeded_store.search(query="") == []

    def test_whitespace_only_returns_empty(self, seeded_store: Any) -> None:
        assert seeded_store.search(query="   \n\t  ") == []
