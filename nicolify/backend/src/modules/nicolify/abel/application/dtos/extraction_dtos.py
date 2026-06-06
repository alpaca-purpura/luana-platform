# cap: abel/icp-buyer  # noqa: ERA001
"""Extraction DTOs — shared between T-BE-2 (router) and T-AG-1 (extraction service).

job_id: UUID único del job de extracción (idempotency best-effort).
status: analizando → done / failed (poll pattern FE).
icp_id: UUID del ICP creado (solo en status=done).
"""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IcpExtractRequest(BaseModel):
    """Solicitud de extracción draft-first (POST /abel/icp/extract).

    seed_type: tipo de semilla (URL / texto / referencia de archivo subido).
    payload: contenido de la semilla (URL string, texto, o None si file_ref).
    file_ref: referencia a archivo subido (UUID de objeto en storage, usado para file type).
    """

    model_config = ConfigDict(from_attributes=True)

    seed_type: Literal["url", "file", "text"]
    payload: str | None = None  # URL o texto; None si file_ref
    file_ref: str | None = None  # referencia a archivo subido


class IcpExtractJobResponse(BaseModel):
    """Estado del job de extracción (poll response).

    analizando: job en progreso.
    done: extracción completada → icp_id disponible.
    failed: extracción falló → FE muestra reintento + fallback manual.
    """

    model_config = ConfigDict(from_attributes=True)

    job_id: UUID
    status: Literal["analizando", "done", "failed"]
    icp_id: UUID | None = None  # solo cuando status=done
