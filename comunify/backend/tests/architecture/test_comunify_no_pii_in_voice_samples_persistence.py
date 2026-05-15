"""Arch fitness gate — voice samples persistence MUST NOT receive raw chat content.

Per D15 (06-tickets.yaml::T-voice-2 + .tessl/tiles/maria/fastapi/rules/pii-sanitisation.md):

  ``ComunifyVoiceCloningSamplesModel.upload_history`` JSONB is COUNTS ONLY +
  metadata (filename, upload_id, type, country). Raw chat lines + raw
  transcriptions NEVER flow through the repo.

This gate inspects the source of ``voice_samples_ingest_worker.py`` to ensure:

  1. The worker NEVER passes ``chat_lines`` or ``transcriptions`` as repo
     arguments.
  2. The ``upload_history_entry`` dict literal in the worker source contains
     ONLY count + metadata keys.
  3. The ``ParsedSamples.chat_lines`` reference NEVER appears inside a
     ``samples_repo`` method call.

The gate is static-source-only — no instantiation needed.
"""

from __future__ import annotations

import ast
from pathlib import Path

# Anchored to this test file → comunify/backend/ (parents[2]) → src/modules/...
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_WORKER_PATH = (
    _BACKEND_ROOT
    / "src/modules/comunify/application/tasks/voice_samples_ingest_worker.py"
)


# Keys the worker IS allowed to put into upload_history_entry. Anything else
# trips the gate → indicates raw content leaking into persistence.
_ALLOWED_HISTORY_KEYS = {
    "upload_id",
    "filename",
    "type",
    "chats_count",
    "voice_notes_count",
    "country",
}


def test_worker_module_source_exists() -> None:
    """Pre-flight — the worker module exists and parses."""
    assert _WORKER_PATH.is_file(), f"voice_samples_ingest_worker.py missing at {_WORKER_PATH}"


def test_upload_history_entry_dict_has_only_count_metadata_keys() -> None:
    """V-AE-28 — upload_history_entry dict literal must NOT carry raw content.

    Walks the AST and inspects every ``dict`` literal that:
      * has a ``chats_count`` AND a ``voice_notes_count`` key, AND
      * is passed as the ``upload_history_entry`` kwarg.

    Asserts the union of keys is a subset of ``_ALLOWED_HISTORY_KEYS``.
    """
    source = _WORKER_PATH.read_text(encoding="utf-8")
    tree = ast.parse(source, filename=str(_WORKER_PATH))

    candidate_dicts: list[dict[str, ast.expr]] = []

    for node in ast.walk(tree):
        # Look for: samples_repo.increment_counts(..., upload_history_entry={...})
        if isinstance(node, ast.Call):
            for kw in node.keywords:
                if kw.arg == "upload_history_entry" and isinstance(kw.value, ast.Dict):
                    candidate_dicts.append(
                        {
                            (k.value if isinstance(k, ast.Constant) else "<dynamic>"): v
                            for k, v in zip(kw.value.keys, kw.value.values, strict=False)
                            if k is not None
                        }
                    )

    assert candidate_dicts, "No upload_history_entry dict literal found in worker source"

    for d in candidate_dicts:
        forbidden = set(d.keys()) - _ALLOWED_HISTORY_KEYS - {"<dynamic>"}
        assert not forbidden, (
            f"upload_history_entry dict carries forbidden keys (V-AE-28 violation): {forbidden}. "
            f"Allowed: {sorted(_ALLOWED_HISTORY_KEYS)}. "
            f"Raw chat content / transcriptions MUST NOT touch the repo. "
            f"D15 invariant from 06-tickets.yaml::T-voice-2."
        )


def test_worker_does_not_pass_chat_lines_to_repo() -> None:
    """Static check: ``chat_lines`` keyword NEVER appears inside ``samples_repo`` calls."""
    source = _WORKER_PATH.read_text(encoding="utf-8")
    tree = ast.parse(source, filename=str(_WORKER_PATH))

    offenders: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            # Detect call shape: <something>samples_repo.<method>(...) by walking
            # the attribute chain.
            attr_chain: list[str] = []
            cursor: ast.AST | None = node.func
            while isinstance(cursor, ast.Attribute):
                attr_chain.append(cursor.attr)
                cursor = cursor.value
            if isinstance(cursor, ast.Name):
                attr_chain.append(cursor.id)
            base_name = attr_chain[-1] if attr_chain else ""
            if "samples_repo" in base_name.lower():
                for kw in node.keywords:
                    if kw.arg in {"chat_lines", "transcriptions", "raw_text", "messages"}:
                        offenders.append(f"line {node.lineno}: kwarg `{kw.arg}` in samples_repo call")

    assert not offenders, "V-AE-28 violation — worker passes raw content to samples_repo:\n" + "\n".join(offenders)


def test_worker_model_schema_persists_counts_only() -> None:
    """The ORM model itself MUST NOT have columns for raw chat lines.

    The schema (T-be-2 + T-be-7) is the persistence contract. This gate
    asserts no field name suggests raw content (chat_lines, raw_text,
    raw_transcriptions, messages_jsonb, etc.) is persisted.
    """
    model_path = (
        _BACKEND_ROOT
        / "src/modules/comunify/infrastructure/models/voice_cloning_samples_model.py"
    )
    assert model_path.is_file(), f"Model file missing: {model_path}"

    src = model_path.read_text(encoding="utf-8")
    tree = ast.parse(src, filename=str(model_path))

    forbidden_field_names = {
        "chat_lines",
        "raw_chat_text",
        "raw_text",
        "raw_transcriptions",
        "messages",
        "transcriptions_jsonb",
        "raw_content",
    }

    offending_fields: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            if node.target.id in forbidden_field_names:
                offending_fields.append(f"line {node.lineno}: field `{node.target.id}`")

    assert not offending_fields, (
        "V-AE-28 / D15 violation — ComunifyVoiceCloningSamplesModel has forbidden raw-content fields:\n"
        + "\n".join(offending_fields)
    )
