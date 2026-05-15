"""Seed the creator_economy_kb_v1 Qdrant collection.

Created by T-kb-1 (R23 Opus 4.7 production AGENTIC code).

Per ``03-arch-agentic.md`` § 7.5 + ``05-guidelines.md``:

* **Idempotent** — re-running upserts chunks with deterministic UUIDv5 ids.
  Re-seed = no duplicates. Stable across CI runs.
* **Stubbed Qdrant client** — qdrant-client NOT installed in comunify venv
  (HS1). This script imports qdrant lazily so unit tests + linters don't
  break. Real Qdrant connection lands at T-deploy-1 or post-deploy.
* **Embedding model** — ``text-embedding-3-large`` with ``dimensions=3072``
  (default — D17 cement). Real embedder injected via
  ``ComunifyCreatorEconomyKbStore(embedder=...)`` at runtime.
* **Forced retrieval** — ``vulnerable_disclosure_playbook`` chunk seeded
  with ``forced_retrieval=True`` + ``triggers="vulnerability_keywords"``
  payload. Search-time logic in ``_kb_seed_loader.search()``.

Usage (when qdrant-client + openai are installed — POST T-deploy-1):

    cd /home/chris/luana-platform/comunify/backend
    .venv/bin/python -m scripts.seed_creator_economy_kb

This will fail today with a friendly error message until T-deploy-1 wires
``qdrant-client`` + OpenAI embedder. Until then, the script is exercised
via unit tests with injected fakes (see
``tests/agentic_evals/kb_pack/test_seed_idempotent.py``).
"""

from __future__ import annotations

import sys
from typing import Any

from src.modules.comunify.copilot.extractors._kb_seed_loader import (
    ComunifyCreatorEconomyKbStore,
    KbChunkRecord,
    load_chunks_from_pack,
)
from src.modules.comunify.copilot.kb.creator_economy_kb_v1.manifest import (
    Manifest,
    get_manifest,
)

# ─── Seeding orchestration ──────────────────────────────────────────────────


def seed_collection(
    store: ComunifyCreatorEconomyKbStore,
    chunks: list[KbChunkRecord],
) -> int:
    """Idempotent seed of the collection. Returns chunks upserted count.

    1. Ensure Qdrant collection exists (no-op if already created)
    2. Embed chunk texts + upsert points

    Idempotency property comes from deterministic UUIDv5 point ids — re-upsert
    with same id = update payload + vector, no duplicate row.
    """
    store.ensure_collection()
    return store.upsert_chunks(chunks)


def seed_all(
    *,
    embedder: Any,
    client: Any | None = None,
    manifest: Manifest | None = None,
) -> dict[str, int]:
    """Seed the single creator_economy_kb_v1 pack.

    Args:
        embedder: Production embedder (must produce 3072-dim vectors for
            ``text-embedding-3-large``).
        client: Optional Qdrant client instance. If None, ``ensure_collection``
            and ``upsert_chunks`` will raise (deferred per HS1; production
            wires at T-deploy-1).
        manifest: Override manifest (test hook). Defaults to ``get_manifest()``.

    Returns: ``{pack_id: chunks_upserted}``.
    """
    import structlog

    logger = structlog.get_logger()
    manifest = manifest or get_manifest()

    store = ComunifyCreatorEconomyKbStore(
        client=client,
        embedder=embedder,
        manifest=manifest,
    )

    try:
        chunks = load_chunks_from_pack(manifest=manifest)
        count = seed_collection(store, chunks)
        logger.info(
            "creator_economy_kb_seeded",
            pack_id=manifest.pack_id,
            count=count,
            qdrant_collection=manifest.qdrant_collection,
            embedding_dim=manifest.embedding_dim,
        )
        return {manifest.pack_id: count}
    except Exception as exc:  # noqa: BLE001 — best-effort, log + re-raise
        logger.warning(
            "creator_economy_kb_seed_failed",
            pack_id=manifest.pack_id,
            error=str(exc),
        )
        raise


# ─── CLI entrypoint ─────────────────────────────────────────────────────────


def main() -> None:  # pragma: no cover — CLI path, exercised post-T-deploy-1
    """CLI entry: ``python -m scripts.seed_creator_economy_kb``.

    Wires real Qdrant client + OpenAI embedder when those deps are installed
    (T-deploy-1). Tests NEVER hit this path — they call ``seed_collection``
    directly with injected fakes.
    """
    import structlog

    logger = structlog.get_logger()

    # qdrant-client + openai are NOT in comunify venv at T-kb-1 ship time.
    # We import here so module-level import-time doesn't blow up. Once
    # T-deploy-1 adds them to pyproject.toml + sync, this path works.
    try:
        from qdrant_client import QdrantClient  # type: ignore[import-not-found]
    except ImportError:
        logger.error(
            "qdrant_client_unavailable",
            hint=(
                "Install qdrant-client (T-deploy-1 task). For tests, inject a "
                "fake client via ComunifyCreatorEconomyKbStore(client=fake)."
            ),
        )
        sys.exit(2)

    try:
        from langchain_openai import OpenAIEmbeddings  # type: ignore[import-not-found]
    except ImportError:
        logger.error(
            "langchain_openai_unavailable",
            hint=(
                "Install langchain-openai for production embedder. For tests, "
                "inject a fake embedder via ComunifyCreatorEconomyKbStore(embedder=fake)."
            ),
        )
        sys.exit(2)

    # Real wiring (T-deploy-1)
    embedder = OpenAIEmbeddings(
        model="text-embedding-3-large",
        dimensions=3072,
    )
    client = QdrantClient(host="localhost", port=6333)
    counts = seed_all(embedder=embedder, client=client)
    logger.info("creator_economy_kb_seed_complete", counts=counts)


if __name__ == "__main__":  # pragma: no cover
    main()
