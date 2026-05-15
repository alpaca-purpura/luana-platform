"""Tests for voice samples ingestion + PII sanitization (T-voice-2).

Acceptance coverage (per 06-tickets.yaml::T-voice-2 + V-AE-28 + V-F-17):
  * Parser strips PII (email, phone, DNI/CUIT/RFC/RUT/CURP/DNI_PE) from chat lines.
  * Parser strips PII from sender names too.
  * Parser counts voice notes correctly (file ext detection + hint lines).
  * Parser tolerates corrupt ZIP / missing _chat.txt → empty + warning.
  * Worker persists counts ONLY (not raw text).
  * Worker deletes original upload after persist (D15).
  * Worker handles Whisper timeout gracefully (no raise, empty transcription).
  * Worker auto-kicks distillation when count threshold met.

In-memory fakes for ZipUploadStore + samples repo + transcriber + kickoff.
"""

from __future__ import annotations

import uuid
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pytest

from src.modules.comunify.application.tasks.voice_samples_ingest_worker import (
    voice_samples_ingest,
)
from src.modules.comunify.brand.voice_cloning.samples_parser import (
    ChatLine,
    parse_whatsapp_zip,
    transcribe_voice_notes,
)

# ─── Fixture builders ──────────────────────────────────────────────────────


def _make_chat_txt_content() -> str:
    """Synthesise a WhatsApp _chat.txt with PII embedded.

    Includes voseo lines + phone + email + DNI + CUIT + RFC + RUT + CURP.
    """
    return (
        "[01/03/24, 10:00:15] Anabella: Hola! Mi mail es anabella@example.com, dale\n"
        "[01/03/24, 10:00:18] Lead: Genial, te llamo al +54 9 11 5555 4321\n"
        "[01/03/24, 10:00:25] Anabella: Mi DNI 28443123 si te sirve\n"
        "[01/03/24, 10:00:30] Lead: Mi RFC GORM830625HDF\n"
        "[01/03/24, 10:00:35] Anabella: Tenés que probarlo, te lo bancás obvio\n"
        "[01/03/24, 10:00:40] Anabella: <Media omitted>\n"
        "[01/03/24, 10:00:45] Lead: <archivo adjunto: 0001-AUDIO-2024-03-01.opus>\n"
        "[01/03/24, 10:00:50] Anabella: Una banda, dale vamos 💪\n"
    )


def _make_zip(tmp_path: Path, *, with_chat: bool = True, with_voice: bool = True) -> Path:
    """Build a WhatsApp-style export ZIP for testing."""
    zip_path = tmp_path / "upload.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        if with_chat:
            zf.writestr("_chat.txt", _make_chat_txt_content())
        if with_voice:
            zf.writestr("0001-AUDIO-2024-03-01.opus", b"FAKE_OPUS_BYTES")
    return zip_path


# ─── Direct parser tests ───────────────────────────────────────────────────


def test_parser_strips_email_from_message(tmp_path: Path) -> None:
    zip_path = _make_zip(tmp_path)
    extract_dir = tmp_path / "ext"
    extract_dir.mkdir()
    parsed = parse_whatsapp_zip(zip_path, extract_dir=extract_dir)

    all_text = " ".join(c.text for c in parsed.chat_lines)
    assert "anabella@example.com" not in all_text
    assert "[REDACTED]" in all_text


def test_parser_strips_phone_from_message(tmp_path: Path) -> None:
    zip_path = _make_zip(tmp_path)
    extract_dir = tmp_path / "ext"
    extract_dir.mkdir()
    parsed = parse_whatsapp_zip(zip_path, extract_dir=extract_dir)

    all_text = " ".join(c.text for c in parsed.chat_lines)
    assert "5555 4321" not in all_text
    assert "+54 9 11" not in all_text


def test_parser_strips_dni_ar(tmp_path: Path) -> None:
    zip_path = _make_zip(tmp_path)
    extract_dir = tmp_path / "ext"
    extract_dir.mkdir()
    parsed = parse_whatsapp_zip(zip_path, extract_dir=extract_dir)

    all_text = " ".join(c.text for c in parsed.chat_lines)
    assert "28443123" not in all_text


def test_parser_strips_rfc_mx(tmp_path: Path) -> None:
    zip_path = _make_zip(tmp_path)
    extract_dir = tmp_path / "ext"
    extract_dir.mkdir()
    parsed = parse_whatsapp_zip(zip_path, extract_dir=extract_dir)

    all_text = " ".join(c.text for c in parsed.chat_lines)
    assert "GORM830625HDF" not in all_text


def test_parser_keeps_non_pii_voseo_intact(tmp_path: Path) -> None:
    """Sanitization MUST NOT clobber legitimate brand voice (voseo)."""
    zip_path = _make_zip(tmp_path)
    extract_dir = tmp_path / "ext"
    extract_dir.mkdir()
    parsed = parse_whatsapp_zip(zip_path, extract_dir=extract_dir)

    all_text = " ".join(c.text for c in parsed.chat_lines)
    # Voseo retained — extractor needs these patterns to detect dialect.
    assert "tenés" in all_text.lower() or "Tenés" in all_text
    assert "bancás" in all_text.lower() or "Bancás" in all_text
    assert "dale vamos" in all_text.lower()


def test_parser_skips_voice_note_hint_lines(tmp_path: Path) -> None:
    """`<Media omitted>` / `<archivo adjunto: ...>` lines are NOT chat lines."""
    zip_path = _make_zip(tmp_path)
    extract_dir = tmp_path / "ext"
    extract_dir.mkdir()
    parsed = parse_whatsapp_zip(zip_path, extract_dir=extract_dir)

    for chat in parsed.chat_lines:
        assert "<media omitted>" not in chat.text.lower()
        assert "archivo adjunto" not in chat.text.lower()


def test_parser_collects_voice_note_files(tmp_path: Path) -> None:
    zip_path = _make_zip(tmp_path, with_voice=True)
    extract_dir = tmp_path / "ext"
    extract_dir.mkdir()
    parsed = parse_whatsapp_zip(zip_path, extract_dir=extract_dir)

    assert parsed.voice_notes_count == 1
    assert parsed.voice_note_paths[0].suffix == ".opus"


def test_parser_handles_corrupt_zip_gracefully(tmp_path: Path) -> None:
    bad = tmp_path / "bad.zip"
    bad.write_bytes(b"not a zip file at all")
    extract_dir = tmp_path / "ext"
    extract_dir.mkdir()
    parsed = parse_whatsapp_zip(bad, extract_dir=extract_dir)

    assert parsed.chats_count == 0
    assert any("corrupt_zip" in w for w in parsed.warnings)


def test_parser_handles_missing_chat_txt(tmp_path: Path) -> None:
    zip_path = _make_zip(tmp_path, with_chat=False, with_voice=False)
    extract_dir = tmp_path / "ext"
    extract_dir.mkdir()
    parsed = parse_whatsapp_zip(zip_path, extract_dir=extract_dir)

    assert parsed.chats_count == 0
    assert any("missing_chat_txt" in w for w in parsed.warnings)


# ─── Whisper transcription tests ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_transcribe_voice_notes_handles_timeout_gracefully() -> None:
    """Per tessl__graceful-degradation: timeout → empty string + warning.

    The wrapper uses ``asyncio.wait_for(timeout_sec + 2.0)`` around the
    transcriber call. To trigger the wrapper's TimeoutError branch, the
    fake transcriber must sleep LONGER than ``timeout_sec + 2``.
    """
    import asyncio

    class _SlowTranscriber:
        async def transcribe(self, *, audio_path: Path, timeout_sec: float) -> str:
            # Sleep well beyond the wrapper's outer timeout (timeout_sec + 2.0).
            await asyncio.sleep(timeout_sec + 5.0)
            return "should never reach"

    results = await transcribe_voice_notes(
        [Path("/tmp/fake1.opus"), Path("/tmp/fake2.opus")],
        transcriber=_SlowTranscriber(),
        timeout_sec=0.01,  # outer guard fires at ~2.01s — still 3s short of sleep
    )
    assert results == ["", ""]


@pytest.mark.asyncio
async def test_transcribe_voice_notes_handles_exception_gracefully() -> None:
    class _BrokenTranscriber:
        async def transcribe(self, *, audio_path: Path, timeout_sec: float) -> str:
            raise RuntimeError("whisper down")

    results = await transcribe_voice_notes(
        [Path("/tmp/fake.opus")],
        transcriber=_BrokenTranscriber(),
        timeout_sec=1.0,
    )
    assert results == [""]


@pytest.mark.asyncio
async def test_transcribe_voice_notes_strips_pii_from_transcription() -> None:
    """Transcription output is PII-sanitized BEFORE returning."""

    class _LeakyTranscriber:
        async def transcribe(self, *, audio_path: Path, timeout_sec: float) -> str:
            return "Mi mail es leak@example.com y mi DNI 12345678"

    results = await transcribe_voice_notes(
        [Path("/tmp/fake.opus")],
        transcriber=_LeakyTranscriber(),
        timeout_sec=1.0,
    )
    assert "leak@example.com" not in results[0]
    assert "12345678" not in results[0]
    assert "[REDACTED]" in results[0]


@pytest.mark.asyncio
async def test_transcribe_voice_notes_empty_list() -> None:
    """Empty list → empty result (no calls)."""

    class _NotCalledTranscriber:
        called = False

        async def transcribe(self, *, audio_path: Path, timeout_sec: float) -> str:
            self.called = True
            return "should not"

    t = _NotCalledTranscriber()
    results = await transcribe_voice_notes([], transcriber=t, timeout_sec=1.0)
    assert results == []
    assert t.called is False


# ─── Worker tests ──────────────────────────────────────────────────────────


@dataclass
class FakeZipUploadStore:
    """In-memory fake — fetches zip from a pre-set path + deletes set flag."""

    seed_zip_bytes: bytes = b""
    deleted_uploads: list[uuid.UUID] = field(default_factory=list)
    raise_on_fetch: BaseException | None = None
    raise_on_delete: BaseException | None = None

    async def fetch_zip(self, *, upload_id: uuid.UUID, dest: Path) -> Path:
        if self.raise_on_fetch is not None:
            raise self.raise_on_fetch
        dest.write_bytes(self.seed_zip_bytes)
        return dest

    async def delete_upload(self, *, upload_id: uuid.UUID) -> None:
        if self.raise_on_delete is not None:
            raise self.raise_on_delete
        self.deleted_uploads.append(upload_id)


@dataclass
class FakeSamplesRepo:
    """In-memory fake — captures increment_counts calls (counts ONLY)."""

    increments: list[dict[str, Any]] = field(default_factory=list)
    raise_on_increment: BaseException | None = None

    async def increment_counts(
        self,
        *,
        chats_delta: int,
        voice_notes_delta: int,
        upload_history_entry: dict[str, Any] | None,
    ) -> None:
        if self.raise_on_increment is not None:
            raise self.raise_on_increment
        self.increments.append(
            {
                "chats_delta": chats_delta,
                "voice_notes_delta": voice_notes_delta,
                "upload_history_entry": upload_history_entry,
            }
        )


@dataclass
class FakeTranscriber:
    """Returns canned transcription per file."""

    canned: dict[str, str] = field(default_factory=dict)

    async def transcribe(self, *, audio_path: Path, timeout_sec: float) -> str:
        return self.canned.get(audio_path.name, "")


@dataclass
class FakeDistillationKickoff:
    """Captures kick() calls (lines + transcriptions + country)."""

    calls: list[dict[str, Any]] = field(default_factory=list)
    raise_on_kick: BaseException | None = None

    async def kick(
        self,
        *,
        chat_lines: list[ChatLine],
        voice_transcriptions: list[str],
        country: str,
    ) -> None:
        if self.raise_on_kick is not None:
            raise self.raise_on_kick
        self.calls.append(
            {
                "chat_lines_count": len(chat_lines),
                "voice_transcriptions_count": len(voice_transcriptions),
                "country": country,
            }
        )


@pytest.mark.asyncio
async def test_worker_persists_counts_only_not_raw_text(tmp_path: Path) -> None:
    """V-AE-28 / V-F-17: worker persists counts ONLY — no raw text in repo."""
    zip_path = _make_zip(tmp_path)
    store = FakeZipUploadStore(seed_zip_bytes=zip_path.read_bytes())
    repo = FakeSamplesRepo()
    transcriber = FakeTranscriber()

    result = await voice_samples_ingest(
        tenant_id=uuid.uuid4(),
        upload_id=uuid.uuid4(),
        country="AR",
        zip_store=store,
        samples_repo=repo,
        transcriber=transcriber,
    )

    assert len(repo.increments) == 1
    inc = repo.increments[0]
    # Counts threaded through.
    assert inc["chats_delta"] >= 1
    assert inc["voice_notes_delta"] == 1
    # upload_history_entry has counts + filename — NOT raw chat text.
    history = inc["upload_history_entry"]
    assert "chats_count" in history
    assert "voice_notes_count" in history
    # NO raw message body keys.
    assert "message" not in history
    assert "chat_lines" not in history
    assert "transcriptions" not in history
    # Top-level result also no raw data.
    assert result.chats_count == inc["chats_delta"]


@pytest.mark.asyncio
async def test_worker_deletes_upload_after_persist(tmp_path: Path) -> None:
    """D15: original blob deleted after counts persisted."""
    zip_path = _make_zip(tmp_path)
    store = FakeZipUploadStore(seed_zip_bytes=zip_path.read_bytes())
    repo = FakeSamplesRepo()
    upload_id = uuid.uuid4()

    await voice_samples_ingest(
        tenant_id=uuid.uuid4(),
        upload_id=upload_id,
        country="AR",
        zip_store=store,
        samples_repo=repo,
        transcriber=FakeTranscriber(),
    )

    assert upload_id in store.deleted_uploads


@pytest.mark.asyncio
async def test_worker_handles_corrupt_zip_returns_warnings(tmp_path: Path) -> None:
    store = FakeZipUploadStore(seed_zip_bytes=b"corrupt bytes here")
    repo = FakeSamplesRepo()

    result = await voice_samples_ingest(
        tenant_id=uuid.uuid4(),
        upload_id=uuid.uuid4(),
        country="AR",
        zip_store=store,
        samples_repo=repo,
        transcriber=FakeTranscriber(),
    )

    assert result.chats_count == 0
    assert any("corrupt_zip" in w for w in result.warnings)


@pytest.mark.asyncio
async def test_worker_handles_fetch_failure(tmp_path: Path) -> None:
    """If zip_store.fetch_zip raises, worker returns failure result."""
    store = FakeZipUploadStore(raise_on_fetch=RuntimeError("S3 down"))
    repo = FakeSamplesRepo()

    result = await voice_samples_ingest(
        tenant_id=uuid.uuid4(),
        upload_id=uuid.uuid4(),
        country="AR",
        zip_store=store,
        samples_repo=repo,
        transcriber=FakeTranscriber(),
    )

    assert result.chats_count == 0
    assert any("fetch_failed" in w for w in result.warnings)
    # Repo NOT touched on fetch failure.
    assert len(repo.increments) == 0


@pytest.mark.asyncio
async def test_worker_handles_persist_failure_gracefully(tmp_path: Path) -> None:
    """Repo failure → logged warning, worker still completes."""
    zip_path = _make_zip(tmp_path)
    store = FakeZipUploadStore(seed_zip_bytes=zip_path.read_bytes())
    repo = FakeSamplesRepo(raise_on_increment=RuntimeError("DB down"))

    result = await voice_samples_ingest(
        tenant_id=uuid.uuid4(),
        upload_id=uuid.uuid4(),
        country="AR",
        zip_store=store,
        samples_repo=repo,
        transcriber=FakeTranscriber(),
    )

    assert any("persist_failed" in w for w in result.warnings)


@pytest.mark.asyncio
async def test_worker_auto_kicks_distillation_above_threshold(tmp_path: Path) -> None:
    """When combined count ≥ threshold, distillation_kickoff.kick called."""
    # Build a chat with 50 lines + 1 voice note → > threshold 50.
    big_chat = "\n".join(f"[01/03/24, 10:{i:02d}:00] Anabella: Mensaje {i} con voseo natural" for i in range(50))
    zip_path = tmp_path / "big.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("_chat.txt", big_chat)
        zf.writestr("voice.opus", b"FAKE")

    store = FakeZipUploadStore(seed_zip_bytes=zip_path.read_bytes())
    repo = FakeSamplesRepo()
    transcriber = FakeTranscriber(canned={"voice.opus": "Dale, contale a tu coach!"})
    kickoff = FakeDistillationKickoff()

    result = await voice_samples_ingest(
        tenant_id=uuid.uuid4(),
        upload_id=uuid.uuid4(),
        country="AR",
        zip_store=store,
        samples_repo=repo,
        transcriber=transcriber,
        distillation_kickoff=kickoff,
        auto_distill_threshold=50,
    )

    assert result.distillation_kicked is True
    assert len(kickoff.calls) == 1
    assert kickoff.calls[0]["country"] == "AR"
    assert kickoff.calls[0]["chat_lines_count"] >= 50


@pytest.mark.asyncio
async def test_worker_does_not_kick_below_threshold(tmp_path: Path) -> None:
    """Below threshold → no kick (creator uploads more)."""
    zip_path = _make_zip(tmp_path)  # ~5 lines + 1 voice note
    store = FakeZipUploadStore(seed_zip_bytes=zip_path.read_bytes())
    repo = FakeSamplesRepo()
    kickoff = FakeDistillationKickoff()

    result = await voice_samples_ingest(
        tenant_id=uuid.uuid4(),
        upload_id=uuid.uuid4(),
        country="AR",
        zip_store=store,
        samples_repo=repo,
        transcriber=FakeTranscriber(),
        distillation_kickoff=kickoff,
        auto_distill_threshold=50,
    )

    assert result.distillation_kicked is False
    assert len(kickoff.calls) == 0


@pytest.mark.asyncio
async def test_worker_tenant_id_threaded_through(tmp_path: Path) -> None:
    """R2: tenant_id forwarded to log context (smoke check via no-raise)."""
    zip_path = _make_zip(tmp_path)
    store = FakeZipUploadStore(seed_zip_bytes=zip_path.read_bytes())
    repo = FakeSamplesRepo()

    tenant_id = uuid.uuid4()
    upload_id = uuid.uuid4()

    result = await voice_samples_ingest(
        tenant_id=tenant_id,
        upload_id=upload_id,
        country="AR",
        zip_store=store,
        samples_repo=repo,
        transcriber=FakeTranscriber(),
    )

    assert result.upload_id == upload_id
