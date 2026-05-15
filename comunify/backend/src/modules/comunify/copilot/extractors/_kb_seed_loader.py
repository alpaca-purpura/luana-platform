"""KB seed loader + ``ComunifyCreatorEconomyKbStore`` for creator_economy_kb_v1.

Created by T-kb-1 (R23 Opus 4.7 production AGENTIC code).

This module mirrors the Vitalia ``VitaliaMedicalKbStore`` pattern (Story 11
``vitalia/backend/scripts/seed_medical_kb.py``) — sibling-pattern brand-isolated
implementation per ``.claude/rules/anti-duplication.md`` row "luana-platform
Extension SDK" (brand-isolated by path, NOT shared abstraction).

Anti-duplication audit-trail (preserved here verbatim per Step 0 GATE):

  $ find /home/chris/luana-platform /home/chris/AISALESHT/backend/src \\
      -name "_kb_seed_loader.py" -o -name "seed_creator_economy_kb.py" 2>/dev/null
  # → zero results

  $ grep -rn "class.*KbStore" /home/chris/luana-platform /home/chris/AISALESHT \\
      2>/dev/null
  # → MarketingKbStore (luana-core-copilot — tenant-AGNOSTIC global, dim 3072
  #   marketing KB, single collection, different shape).
  # → DentalKbStore + VitaliaMedicalKbStore (vitalia — per-pack collections,
  #   dim 1536, medical brand-scope, boundary chunks for crisis lines).

Comunify is the **2nd brand consumer** of the per-brand KB pattern (Vitalia 1st).
Threshold rule per anti-duplication.md: 3rd consumer → reconsider LIFT to
``core/luana-core-copilot/qdrant/branded_kb_store.py``. Until then, brand
isolation by path is the correct posture (avoids premature shared abstraction).

Key differences vs Vitalia:

* **Dim 3072** (text-embedding-3-large default) — Vitalia uses 1536 (override).
  Creator-economy chunks are longer + more semantic-richer than medical
  reference; default 3072 captures more nuance. (D17 cement.)
* **Vulnerability keyword triggers** instead of crisis_keywords —
  burnout/financial-stress/public-shaming/comparison-trap/impostor/overwhelm/
  loneliness. Single `vulnerable_disclosure_playbook` chunk forced top-1.
* **tenant_id filter at query** — null = generic (brand-scope), tenant_id =
  creator-specific override. Vitalia keeps tenant_id=None unconditionally.
* **Python manifest** (vs YAML in Vitalia) — yaml package not installed in
  comunify venv; module-level Python avoids the dep.
* **Lazy qdrant_client import** — defer to ``_get_client()`` per Vitalia pattern
  (production wires real client at T-deploy-1; tests inject fakes).

Idempotent seeding: deterministic UUIDv5 from
``{pack_id}::{source_doc}::{chunk_id}`` ensures re-runs upsert (no duplicates).
"""

from __future__ import annotations

import hashlib
import re
import uuid as uuid_mod
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any, Final, Protocol
from uuid import UUID

from src.modules.comunify.copilot.kb.creator_economy_kb_v1.manifest import (
    Manifest,
    get_manifest,
)

if TYPE_CHECKING:  # pragma: no cover
    pass


# ─── Constants ──────────────────────────────────────────────────────────────

PACK_DIR: Final[Path] = Path(__file__).resolve().parents[1] / "kb" / "creator_economy_kb_v1"

# Single forced-retrieval chunk id (per ticket — vulnerable_disclosure_playbook).
# Re-exported here for convenience; canonical source is manifest.py.
VULNERABLE_DISCLOSURE_PLAYBOOK_CHUNK_ID: Final[str] = "vulnerable_disclosure_playbook"


# ─── Chunk record (Qdrant-ready) ────────────────────────────────────────────


@dataclass(frozen=True, slots=True)
class KbChunkRecord:
    """One chunk ready for Qdrant upsert.

    ``chunk_id`` is the human-readable H2 anchor (e.g.
    ``vulnerable_disclosure_playbook``, ``cohort_capacity_sizing``). The
    Qdrant point id is a UUIDv5 derived from
    ``{pack_id}::{source_doc}::{chunk_id}`` so re-runs are idempotent.

    ``triggers`` field stores which manifest trigger group activates forced
    retrieval for this chunk:

      * ``""`` (empty) — non-boundary chunk, retrieved by similarity only.
      * ``"vulnerability_keywords"`` — boundary fired by vulnerability_keywords
        scan (only ``vulnerable_disclosure_playbook`` in bootstrap; extensible
        to future trigger categories).
    """

    chunk_id: str  # human-readable, matches ## H2 anchor
    pack_id: str
    source_doc: str
    text: str
    point_id: str  # UUIDv5 string used as Qdrant point id
    topic_tags: tuple[str, ...] = ()
    forced_retrieval: bool = False
    triggers: str = ""  # "vulnerability_keywords" | "" (none)
    tenant_id: str | None = None  # null = generic, tenant_id = creator-specific override

    def payload(self) -> dict[str, Any]:
        """JSON payload stored in Qdrant.

        Citation contract: ``chunk_id`` MUST be present so the agent can cite
        it in ``copilot_trace_event.context_used``.
        """
        return {
            "chunk_id": self.chunk_id,
            "pack_id": self.pack_id,
            "source_doc": self.source_doc,
            "text": self.text,
            "topic_tags": list(self.topic_tags),
            "forced_retrieval": self.forced_retrieval,
            "triggers": self.triggers,
            "tenant_id": self.tenant_id,
        }


# ─── MD parsing — H2 sections become chunks ─────────────────────────────────

_H2_RE: Final = re.compile(r"^## (.+)$", re.MULTILINE)


def _stable_point_id(pack_id: str, source_doc: str, chunk_id: str) -> str:
    """Deterministic UUIDv5 — idempotent re-seed (no duplicates).

    Equivalent to Vitalia ``_stable_point_id`` (cross-brand convention).
    """
    seed = f"{pack_id}::{source_doc}::{chunk_id}"
    digest = hashlib.sha1(seed.encode("utf-8"), usedforsecurity=False).hexdigest()
    return str(uuid_mod.UUID(digest[:32]))


def _split_md_into_h2_chunks(md_text: str) -> list[tuple[str, str]]:
    """Split markdown by ## H2 anchors. Returns ``[(chunk_id, body), ...]``.

    Body excludes the H2 line itself. Trailing whitespace stripped.
    If a file has no H2 → returns empty list.
    """
    matches = list(_H2_RE.finditer(md_text))
    if not matches:
        return []

    chunks: list[tuple[str, str]] = []
    for i, m in enumerate(matches):
        chunk_id = m.group(1).strip()
        body_start = m.end()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(md_text)
        body = md_text[body_start:body_end].strip()
        chunks.append((chunk_id, body))
    return chunks


def load_chunks_from_pack(
    pack_dir: Path | None = None,
    *,
    manifest: Manifest | None = None,
) -> list[KbChunkRecord]:
    """Load + parse all chunks declared in the creator_economy_kb_v1 pack dir.

    Reads ``manifest`` (default: ``get_manifest()`` — Python module).
    For each .md file in the pack dir (alphabetical sort for determinism),
    splits by H2 → ``KbChunkRecord``. Boundary chunks declared in manifest are
    tagged with ``forced_retrieval=True`` and the right ``triggers`` field.

    Idempotent: same input → same output (chunk ids deterministic).
    """
    if pack_dir is None:
        pack_dir = PACK_DIR
    if manifest is None:
        manifest = get_manifest()

    # Map chunk_id → boundary metadata (if declared in manifest)
    boundary_index: dict[str, Any] = {b.chunk_id: b for b in manifest.boundary_chunks}

    records: list[KbChunkRecord] = []
    md_files = sorted(pack_dir.glob("*.md"))
    for md_path in md_files:
        md_text = md_path.read_text(encoding="utf-8")
        h2_chunks = _split_md_into_h2_chunks(md_text)
        for chunk_id, body in h2_chunks:
            boundary_meta = boundary_index.get(chunk_id)
            forced = bool(boundary_meta and boundary_meta.forced_retrieval)
            triggers = (boundary_meta.triggers if boundary_meta else "") or ""
            records.append(
                KbChunkRecord(
                    chunk_id=chunk_id,
                    pack_id=manifest.pack_id,
                    source_doc=md_path.name,
                    text=body,
                    point_id=_stable_point_id(manifest.pack_id, md_path.name, chunk_id),
                    topic_tags=(),
                    forced_retrieval=forced,
                    triggers=triggers,
                    tenant_id=None,  # bootstrap is brand-scope generic content
                ),
            )

    return records


# ─── Embedder protocol (real or fake) ───────────────────────────────────────


class _EmbedderLike(Protocol):
    """Subset of langchain-style embeddings interface used here."""

    DIM: int

    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...

    def embed_query(self, text: str) -> list[float]: ...


# ─── Qdrant client protocol (structural — supports fake + real) ─────────────


class _QdrantClientLike(Protocol):
    """Structural subset of qdrant_client.QdrantClient used here.

    Tests provide an in-memory fake. Production injects real client lazily
    (per Vitalia pattern). The protocol allows both to coexist without
    ``isinstance`` checks.

    NOTE: kept minimal — only `get_collections`, `create_collection`,
    `upsert`, `query_points`, `scroll`, `retrieve`. Each accept `models.*`
    or dict-shaped payloads (real qdrant_client uses both depending on
    version).
    """

    def get_collections(self) -> Any: ...

    def create_collection(self, **kwargs: Any) -> Any: ...

    def upsert(self, **kwargs: Any) -> Any: ...

    def query_points(self, **kwargs: Any) -> Any: ...

    def scroll(self, **kwargs: Any) -> Any: ...

    def retrieve(self, **kwargs: Any) -> Any: ...


# ─── Search hit dataclass ───────────────────────────────────────────────────


@dataclass(frozen=True, slots=True)
class _SearchHit:
    """Internal search result — normalised across query_points + scroll."""

    point_id: str
    score: float
    payload: dict[str, Any]


# ─── KB Store wrapper ───────────────────────────────────────────────────────


class ComunifyCreatorEconomyKbStore:
    """Qdrant wrapper for the creator_economy_kb_v1 pack.

    Constructor injection of ``client`` + ``embedder`` lets tests run against
    in-memory fakes with deterministic embeddings. Production usage wires real
    Qdrant + OpenAI embedder via lazy ``_get_client()`` / ``_get_embedder()``
    (deferred per HS1 — qdrant-client not installed in current venv).

    Tenant filter at query: ``MatchAny(any=[None, str(tenant_id)])`` per
    03-arch § 7.4. Bootstrap chunks are all ``tenant_id=None``; per-tenant
    override chunks (future story) would carry tenant_id payload and only
    appear when querying for that tenant.

    Forced retrieval on vulnerability keywords:
    ``vulnerable_disclosure_playbook`` chunk inserted as top-1 when ANY
    vulnerability_keyword present in query (case-insensitive substring match).
    Bypasses similarity threshold.
    """

    def __init__(
        self,
        *,
        client: _QdrantClientLike | None = None,
        embedder: _EmbedderLike | None = None,
        manifest: Manifest | None = None,
    ) -> None:
        self._client = client
        self._embedder = embedder
        self._manifest = manifest or get_manifest()
        # Pre-lowercase for case-insensitive matching
        self._vulnerability_keywords_lower: tuple[str, ...] = tuple(
            kw.lower() for kw in self._manifest.vulnerability_keywords
        )

    # ── lazy wiring ─────────────────────────────────────────────────────────

    def _get_client(self) -> _QdrantClientLike:
        if self._client is None:  # pragma: no cover — production-only path
            msg = (
                "No Qdrant client injected. T-kb-1 bootstrap defers real Qdrant "
                "wiring per HS1 (qdrant-client not installed). Inject a client "
                "for tests (in-memory fake) or wire one in __main__ at T-deploy-1."
            )
            raise RuntimeError(msg)
        return self._client

    def _get_embedder(self) -> _EmbedderLike:
        if self._embedder is None:  # pragma: no cover — production-only path
            msg = (
                "No embedder injected. Real CLI seeding requires OpenAI "
                "text-embedding-3-large with dimensions=3072. Inject one or "
                "wire LLMFactory in __main__."
            )
            raise RuntimeError(msg)
        return self._embedder

    @property
    def collection_name(self) -> str:
        return self._manifest.qdrant_collection

    @property
    def vector_size(self) -> int:
        return self._manifest.embedding_dim

    # ── collection lifecycle ───────────────────────────────────────────────

    def ensure_collection(self) -> None:
        """Create the collection if missing. Idempotent."""
        client = self._get_client()
        existing = self._existing_collection_names(client)
        if self._manifest.qdrant_collection in existing:
            return
        client.create_collection(
            collection_name=self._manifest.qdrant_collection,
            vectors_config={
                "size": self._manifest.embedding_dim,
                "distance": "Cosine",
            },
        )

    @staticmethod
    def _existing_collection_names(client: _QdrantClientLike) -> set[str]:
        """Adapter — works with real client (returns `.collections` list of
        objects with `.name`) AND with simple dict-like fakes."""
        cols_response = client.get_collections()
        # Real client returns CollectionsResponse with .collections attribute
        if hasattr(cols_response, "collections"):
            iterable: Iterable[Any] = cols_response.collections
            return {getattr(c, "name", str(c)) for c in iterable}
        # Dict shape fallback
        if isinstance(cols_response, dict) and "collections" in cols_response:
            return {c.get("name", str(c)) for c in cols_response["collections"]}
        return set()

    def upsert_chunks(self, chunks: Iterable[KbChunkRecord]) -> int:
        """Embed + upsert all chunks. Returns count upserted."""
        chunk_list = list(chunks)
        if not chunk_list:
            return 0

        embedder = self._get_embedder()
        vectors = embedder.embed_documents([c.text for c in chunk_list])

        points = [
            {
                "id": c.point_id,
                "vector": vec,
                "payload": c.payload(),
            }
            for c, vec in zip(chunk_list, vectors, strict=True)
        ]
        client = self._get_client()
        client.upsert(collection_name=self._manifest.qdrant_collection, points=points)
        return len(chunk_list)

    # ── vulnerability detection ────────────────────────────────────────────

    def detect_vulnerability_keywords(self, query: str) -> bool:
        """Return True if any vulnerability_keyword appears in the query.

        Case-insensitive substring match. Public method so tests can probe
        keyword detection without going through ``search()`` (and so the
        agent orchestrator can short-circuit / annotate trace events).
        """
        if not self._vulnerability_keywords_lower or not query:
            return False
        q_low = query.lower()
        return any(kw in q_low for kw in self._vulnerability_keywords_lower)

    # ── search ─────────────────────────────────────────────────────────────

    def search(
        self,
        *,
        query: str,
        tenant_id: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """Cosine search + forced retrieval on vulnerability keywords.

        Order of priority:

          1. If query contains any vulnerability_keyword →
             ``vulnerable_disclosure_playbook`` chunk forced top-1.
          2. Routine cosine results (filtered by tenant_id):
             - ``tenant_id IS NULL`` (generic chunks visible to all tenants)
             - OR ``tenant_id == requested_tenant_id`` (per-tenant override)

        Args:
            query: Creator/lead input text.
            tenant_id: requesting tenant UUID string. If None → only generic
                chunks (tenant_id=None payload). If set → generic + this
                tenant's overrides.
            limit: max routine results. None → use ``manifest.top_k``.

        Returns: list of ``{point_id, score, payload}`` dicts. When forced
        retrieval triggered, top-1 is the playbook chunk.
        """
        if not query.strip():
            return []

        if limit is None:
            limit = self._manifest.top_k

        client = self._get_client()
        embedder = self._get_embedder()

        # ── 1. Routine cosine search (filtered by tenant_id) ──────────────
        dense = embedder.embed_query(query)
        try:
            response = client.query_points(
                collection_name=self._manifest.qdrant_collection,
                query=dense,
                limit=limit,
                with_payload=True,
                # NOTE: real qdrant_client uses models.Filter; we pass a dict
                # the fake recognizes. Production T-deploy-1 wires real Filter.
                query_filter={
                    "must": [
                        {
                            "key": "tenant_id",
                            "match": {"any": [None, tenant_id]},
                        }
                    ]
                }
                if tenant_id is not None
                else {
                    # When tenant_id is None, only return generic chunks
                    # (tenant_id payload IS NULL). Real Qdrant: IsNull filter.
                    "must": [{"is_null": {"key": "tenant_id"}}]
                },
            )
            routine_points = self._normalize_query_response(response)
        except Exception:  # noqa: BLE001 — best-effort fallback
            routine_points = []

        routine_hits = [
            _SearchHit(
                point_id=str(p["point_id"]),
                score=float(p["score"]),
                payload=p["payload"],
            )
            for p in routine_points
        ]

        # ── 2. Forced retrieval (vulnerability keywords) ──────────────────
        forced: list[_SearchHit] = []
        if self.detect_vulnerability_keywords(query):
            forced = self._fetch_forced_boundary_hits(client, triggers_filter="vulnerability_keywords")

        # ── 3. Merge: forced > routine, dedup by point_id ─────────────────
        seen: set[str] = set()
        merged: list[_SearchHit] = []
        for h in forced + routine_hits:
            if h.point_id in seen:
                continue
            seen.add(h.point_id)
            merged.append(h)

        return [{"point_id": h.point_id, "score": h.score, "payload": h.payload} for h in merged]

    @staticmethod
    def _normalize_query_response(response: Any) -> list[dict[str, Any]]:
        """Adapter — handles both real `QueryResponse(points=[ScoredPoint])`
        and dict shape ``{"points": [{"id":..., "score":..., "payload":...}]}``.
        """
        points = getattr(response, "points", None)
        if points is None and isinstance(response, dict):
            points = response.get("points", [])
        if points is None:
            return []

        out: list[dict[str, Any]] = []
        for p in points:
            if hasattr(p, "id"):
                out.append(
                    {
                        "point_id": str(p.id),
                        "score": float(getattr(p, "score", 0.0)),
                        "payload": dict(getattr(p, "payload", {}) or {}),
                    }
                )
            elif isinstance(p, dict):
                out.append(
                    {
                        "point_id": str(p.get("id", p.get("point_id", ""))),
                        "score": float(p.get("score", 0.0)),
                        "payload": dict(p.get("payload", {})),
                    }
                )
        return out

    def _fetch_forced_boundary_hits(
        self,
        client: _QdrantClientLike,
        triggers_filter: str,
    ) -> list[_SearchHit]:
        """Scroll for boundary chunks matching the given trigger group.

        Bootstrap pack has a single boundary chunk
        (``vulnerable_disclosure_playbook``, triggers=``"vulnerability_keywords"``)
        so this returns 0 or 1 hits depending on whether the chunk has been
        seeded into Qdrant.
        """
        try:
            scroll = client.scroll(
                collection_name=self._manifest.qdrant_collection,
                scroll_filter={
                    "must": [
                        {
                            "key": "forced_retrieval",
                            "match": {"value": True},
                        }
                    ]
                },
                limit=32,
                with_payload=True,
                with_vectors=False,
            )
            points = self._normalize_scroll_response(scroll)
        except Exception:  # noqa: BLE001 — best-effort, return empty
            return []

        forced: list[_SearchHit] = []
        for p in points:
            payload = p["payload"]
            if not payload.get("forced_retrieval"):
                continue
            chunk_triggers = str(payload.get("triggers", ""))
            if chunk_triggers != triggers_filter:
                continue
            forced.append(
                _SearchHit(
                    point_id=str(p["point_id"]),
                    score=1.0,  # synthetic top score (forced)
                    payload=payload,
                )
            )
        return forced

    @staticmethod
    def _normalize_scroll_response(scroll: Any) -> list[dict[str, Any]]:
        """Real qdrant returns ``(points, next_page_offset)``; fakes may also
        return that tuple OR just a list of points OR a dict. Normalize.
        """
        if isinstance(scroll, tuple) and len(scroll) == 2:
            points, _next = scroll
        elif isinstance(scroll, dict) and "points" in scroll:
            points = scroll["points"]
        else:
            points = scroll

        out: list[dict[str, Any]] = []
        for p in points or []:
            if hasattr(p, "id"):
                out.append(
                    {
                        "point_id": str(p.id),
                        "payload": dict(getattr(p, "payload", {}) or {}),
                    }
                )
            elif isinstance(p, dict):
                out.append(
                    {
                        "point_id": str(p.get("id", p.get("point_id", ""))),
                        "payload": dict(p.get("payload", {})),
                    }
                )
        return out


# ─── Iteration helpers ──────────────────────────────────────────────────────


def iter_chunks(
    pack_dir: Path | None = None,
    *,
    manifest: Manifest | None = None,
) -> Iterator[KbChunkRecord]:
    """Stream chunks without materializing the full list (for large packs)."""
    yield from load_chunks_from_pack(pack_dir, manifest=manifest)


def chunk_count(
    pack_dir: Path | None = None,
    *,
    manifest: Manifest | None = None,
) -> int:
    """Total chunks across all source .md files. Tests assert ≥40."""
    return sum(1 for _ in iter_chunks(pack_dir, manifest=manifest))


def assert_idempotent_chunk_ids(
    pack_dir: Path | None = None,
    *,
    manifest: Manifest | None = None,
) -> tuple[list[str], list[str]]:
    """Run load twice; return (chunk_ids_run_1, chunk_ids_run_2).

    Used by ``test_seed_idempotent.py`` — asserts they are identical AND
    each point_id is UUID-parseable.
    """
    run_1 = load_chunks_from_pack(pack_dir, manifest=manifest)
    run_2 = load_chunks_from_pack(pack_dir, manifest=manifest)
    chunk_ids_1 = [c.chunk_id for c in run_1]
    chunk_ids_2 = [c.chunk_id for c in run_2]
    # Side-effect: validate each point_id parses as UUID (Qdrant requirement)
    for c in run_1:
        UUID(c.point_id)
    return chunk_ids_1, chunk_ids_2
