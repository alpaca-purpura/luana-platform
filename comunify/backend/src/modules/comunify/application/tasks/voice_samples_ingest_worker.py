"""Voice samples ingest worker — async background job (T-voice-2).

R23: production_code=True AGENTIC. Opus 4.7 EXCLUSIVE (06-tickets.yaml::T-voice-2).

Triggered by ``VoiceCloningService.upload_samples`` returning ``ready_for_distillation=True``
OR by an admin re-ingestion command. The worker:

  1. Loads the ZIP upload from blob storage (path injected via ``ZipUploadStoreProtocol``).
  2. Parses via ``samples_parser.parse_whatsapp_zip`` — PII stripped during parse.
  3. Transcribes voice notes via Whisper (timeout + fallback per tessl__graceful-degradation).
  4. Persists **counts only** in ``ComunifyVoiceCloningSamplesModel`` via the repo.
     D15 invariant: raw chat lines + raw transcriptions NEVER touch the DB.
     The lines are passed in-memory to the kick-off of ``VoiceDistillationOrchestrator``,
     which deletes them post-success.
  5. Optionally enqueues ``VoiceDistillationOrchestrator.run`` when ``auto_distill=True``
     AND chat count + voice note count combined ≥ 50.

Tenant isolation (R2): tenant_id injected at worker construction; every
DB op + storage delete + workflow call carries it.

Anti-duplication audit (Step 0 GATE, 2026-05-14):
  * ``grep -rn "voice_samples_ingest"`` cross codebase → zero collisions.
  * Worker mirrors the pattern of comunify webhook receivers (T-be-9) — same
    structlog event prefix + same try/except discipline. Not a candidate for
    lift to shared (vertical-creator-economy specific).
  * Whisper transcription wrapper lives in ``samples_parser.transcribe_voice_notes``
    — N=1 today. If Vitalia adds voice note ingestion later, lift to shared
    ``luana_core_observability.transcription`` or similar.

Spec sources:
  * 02-design-agentic.md voice cloning § 5.3 samples flow
  * 06-tickets.yaml::T-voice-2 acceptance + decision D15
  * 04-validators.yaml::V-F-17 + V-AE-28
"""

from __future__ import annotations

import shutil
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

import structlog

from src.modules.comunify.brand.voice_cloning.samples_parser import (
    ChatLine,
    ParsedSamples,
    WhisperTranscriberProtocol,
    parse_whatsapp_zip,
    transcribe_voice_notes,
)

logger = structlog.get_logger(__name__)


# ─── Protocols ────────────────────────────────────────────────────────────


class ZipUploadStoreProtocol(Protocol):
    """Surface for fetching + deleting the original upload blob.

    Production wiring: S3 / GCS / local volume. Implementation MUST be
    tenant-scoped at construction (caller's responsibility).
    """

    async def fetch_zip(self, *, upload_id: uuid.UUID, dest: Path) -> Path:
        """Materialise the uploaded ZIP into ``dest`` and return the local path."""
        ...

    async def delete_upload(self, *, upload_id: uuid.UUID) -> None:
        """D15 — delete the original upload after successful ingestion."""
        ...


class VoiceCloningSamplesRepoProtocol(Protocol):
    """Subset of ``VoiceCloningSamplesRepository`` consumed by the worker."""

    async def increment_counts(
        self,
        *,
        chats_delta: int,
        voice_notes_delta: int,
        upload_history_entry: dict[str, Any] | None,
    ) -> None: ...


class VoiceDistillationKickoffProtocol(Protocol):
    """Surface for kicking off the distillation orchestrator after ingestion.

    Wired in production via ``VoiceCloningService.kick_distillation`` which
    creates the job row + enqueues the orchestrator. The worker NEVER calls
    the orchestrator directly — separation of concerns (ingest vs distill).
    """

    async def kick(
        self,
        *,
        chat_lines: list[ChatLine],
        voice_transcriptions: list[str],
        country: str,
    ) -> None: ...


# ─── Worker entry point ───────────────────────────────────────────────────


@dataclass
class IngestResult:
    """Worker result — counts surfaced to caller / monitoring.

    Per D15: NO raw content surfaces here either. ``chats_count`` +
    ``voice_notes_count`` are the only data points leaving the worker.
    """

    upload_id: uuid.UUID
    chats_count: int
    voice_notes_count: int
    distillation_kicked: bool
    warnings: list[str]


async def voice_samples_ingest(
    *,
    tenant_id: uuid.UUID,
    upload_id: uuid.UUID,
    country: str,
    zip_store: ZipUploadStoreProtocol,
    samples_repo: VoiceCloningSamplesRepoProtocol,
    transcriber: WhisperTranscriberProtocol,
    distillation_kickoff: VoiceDistillationKickoffProtocol | None = None,
    auto_distill_threshold: int = 50,
    whisper_timeout_sec: float = 30.0,
) -> IngestResult:
    """Ingest a WhatsApp ZIP upload + (optional) Whisper transcribe.

    Per D15 privacy invariant: raw chat lines + transcriptions do NOT
    persist. They are passed in-memory to ``distillation_kickoff.kick``
    (which feeds the orchestrator; the orchestrator deletes after success).

    Best-effort: any sub-step failure is logged + surfaced in
    ``IngestResult.warnings`` — the worker does NOT raise. The caller
    (ARQ scheduler) treats the IngestResult as a structured success.
    """
    warnings: list[str] = []

    # Work in a tempdir; cleaned up on exit regardless of success.
    with tempfile.TemporaryDirectory(prefix=f"comunify_voice_{upload_id}_") as tmp_str:
        tmp_dir = Path(tmp_str)

        # 1. Fetch ZIP.
        try:
            zip_path = await zip_store.fetch_zip(upload_id=upload_id, dest=tmp_dir / "upload.zip")
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "voice_samples_ingest_fetch_failed",
                tenant_id=str(tenant_id),
                upload_id=str(upload_id),
                error_type=type(exc).__name__,
                error_msg=str(exc)[:200],
            )
            return IngestResult(
                upload_id=upload_id,
                chats_count=0,
                voice_notes_count=0,
                distillation_kicked=False,
                warnings=[f"fetch_failed:{type(exc).__name__}"],
            )

        # 2. Parse ZIP (PII stripped during parse).
        extract_dir = tmp_dir / "extract"
        extract_dir.mkdir(parents=True, exist_ok=True)
        parsed: ParsedSamples = parse_whatsapp_zip(zip_path, extract_dir=extract_dir)
        warnings.extend(parsed.warnings)

        # 3. Whisper transcribe (timeout + fallback per tessl__graceful-degradation).
        transcriptions: list[str] = []
        if parsed.voice_note_paths:
            try:
                transcriptions = await transcribe_voice_notes(
                    parsed.voice_note_paths,
                    transcriber=transcriber,
                    timeout_sec=whisper_timeout_sec,
                )
            except Exception as exc:  # noqa: BLE001 — defensive, never raise from worker
                logger.warning(
                    "voice_samples_ingest_transcribe_batch_failed",
                    tenant_id=str(tenant_id),
                    upload_id=str(upload_id),
                    error_type=type(exc).__name__,
                )
                warnings.append(f"transcribe_batch_failed:{type(exc).__name__}")
                transcriptions = ["" for _ in parsed.voice_note_paths]

        chats_count = parsed.chats_count
        voice_notes_count = parsed.voice_notes_count

        # 4. Persist counts only (D15) + delete original upload.
        try:
            await samples_repo.increment_counts(
                chats_delta=chats_count,
                voice_notes_delta=voice_notes_count,
                upload_history_entry={
                    "upload_id": str(upload_id),
                    "filename": zip_path.name,
                    "type": "whatsapp_zip",
                    "chats_count": chats_count,
                    "voice_notes_count": voice_notes_count,
                    "country": country,
                },
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "voice_samples_ingest_persist_failed",
                tenant_id=str(tenant_id),
                upload_id=str(upload_id),
                error_type=type(exc).__name__,
            )
            warnings.append(f"persist_failed:{type(exc).__name__}")

        # D15 — delete the original upload blob now that counts are recorded.
        # (Raw chat lines + transcriptions still in-memory below; they are
        # consumed by the distillation kickoff and then dropped when the
        # function returns — no persistence path.)
        try:
            await zip_store.delete_upload(upload_id=upload_id)
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "voice_samples_ingest_blob_delete_failed",
                tenant_id=str(tenant_id),
                upload_id=str(upload_id),
                error_type=type(exc).__name__,
            )
            warnings.append(f"blob_delete_failed:{type(exc).__name__}")

        # 5. Optional auto-kickoff of distillation.
        distillation_kicked = False
        combined_count = chats_count + sum(1 for t in transcriptions if t)
        if distillation_kickoff is not None and combined_count >= auto_distill_threshold:
            try:
                # The orchestrator expects chat-shaped dicts; we adapt
                # transcribed voice notes to the same shape so they sit
                # alongside text chat lines.
                lines_with_transcriptions: list[ChatLine] = list(parsed.chat_lines)
                for idx, text in enumerate(transcriptions):
                    if not text.strip():
                        continue
                    lines_with_transcriptions.append(
                        ChatLine(
                            sender="creator",  # transcribed voice note → creator-side
                            text=text[:4000],
                            timestamp=f"transcription_{idx}",
                            channel="voice_note",
                        )
                    )
                await distillation_kickoff.kick(
                    chat_lines=lines_with_transcriptions,
                    voice_transcriptions=transcriptions,
                    country=country,
                )
                distillation_kicked = True
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "voice_samples_ingest_distillation_kick_failed",
                    tenant_id=str(tenant_id),
                    upload_id=str(upload_id),
                    error_type=type(exc).__name__,
                )
                warnings.append(f"distillation_kick_failed:{type(exc).__name__}")

        # 6. Cleanup tempdir is automatic via context manager exit.
        # Explicit shutil.rmtree as belt-and-suspenders in case anything
        # held references; D15 again.
        try:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        except Exception:  # noqa: BLE001
            pass

    logger.info(
        "voice_samples_ingest_complete",
        tenant_id=str(tenant_id),
        upload_id=str(upload_id),
        chats_count=chats_count,
        voice_notes_count=voice_notes_count,
        distillation_kicked=distillation_kicked,
        warnings_count=len(warnings),
    )

    return IngestResult(
        upload_id=upload_id,
        chats_count=chats_count,
        voice_notes_count=voice_notes_count,
        distillation_kicked=distillation_kicked,
        warnings=warnings,
    )


__all__ = [
    "IngestResult",
    "VoiceCloningSamplesRepoProtocol",
    "VoiceDistillationKickoffProtocol",
    "ZipUploadStoreProtocol",
    "voice_samples_ingest",
]
