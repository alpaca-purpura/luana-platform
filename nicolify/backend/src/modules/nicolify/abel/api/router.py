# cap: abel/icp-buyer  # noqa: ERA001
"""Abel API router — ICP + Buyer CRUD + mark-ready + draft-first extraction.

FastAPI thin pattern: validate DTO → call service → map domain exception → HTTPException.
NO business logic in routes.

response_model= MANDATORY on every route (PII gate · arch test enforces).
X-Tenant-ID Header (Annotated) + Authorization (from engine auth dep).

Extraction routes (POST /icp/extract, GET /icp/extract/{job_id}):
Real draft-first extractor (T-AG-1 · IcpExtractionService, process-singleton job store).

redirect_slashes=False set at app level (main.py — arch test test_main_app_config).
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_async_session
from src.modules.nicolify.abel.application.dtos.buyer_dtos import (
    BuyerCreate,
    BuyerPatch,
    BuyerResponse,
)
from src.modules.nicolify.abel.application.dtos.extraction_dtos import (
    IcpExtractJobResponse,
    IcpExtractRequest,
)
from src.modules.nicolify.abel.application.dtos.icp_dtos import (
    IcpCreate,
    IcpListItem,
    IcpMarkReadyResponse,
    IcpPatch,
    IcpResponse,
)
from src.modules.nicolify.abel.application.services.buyer_service import BuyerService
from src.modules.nicolify.abel.application.services.extraction_service_holder import (
    get_extraction_service,
)
from src.modules.nicolify.abel.application.services.icp_extraction_service import (
    IcpExtractionService,
)
from src.modules.nicolify.abel.application.services.icp_service import IcpService
from src.modules.nicolify.abel.domain.exceptions import (
    BuyerNotInIcp,
    IcpLabelConflict,
)

logger = structlog.get_logger()

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Dependency helpers
# ─────────────────────────────────────────────────────────────────────────────


async def _get_tenant_id(
    x_tenant_id: Annotated[str, Header(alias="X-Tenant-ID")],
) -> UUID:
    """Extract and validate X-Tenant-ID header → UUID.

    Engine auth (get_current_user) validates the tenant membership.
    This dep converts the string header to UUID (422 on malformed).
    """
    try:
        return UUID(x_tenant_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="X-Tenant-ID debe ser un UUID válido.",
        ) from exc


def _get_icp_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> IcpService:
    """Provide IcpService DI."""
    return IcpService(session)


def _get_buyer_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> BuyerService:
    """Provide BuyerService DI."""
    return BuyerService(session)


# ─────────────────────────────────────────────────────────────────────────────
# ICP routes
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/icp", response_model=list[IcpListItem])
async def list_icps(
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[IcpService, Depends(_get_icp_service)],
) -> list[IcpListItem]:
    """List all active ICPs for the tenant (master view)."""
    return await service.list(tenant_id)


@router.post("/icp", response_model=IcpResponse, status_code=status.HTTP_201_CREATED)
async def create_icp(
    request: IcpCreate,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[IcpService, Depends(_get_icp_service)],
) -> IcpResponse:
    """Create ICP (manual). 409 if label duplicated (RN-7).

    Draft-first: ICP nace siempre en status=borrador (RN-2).
    """
    try:
        return await service.create(tenant_id, request)
    except IcpLabelConflict as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un ICP con la etiqueta '{exc.label}'.",
        ) from exc


@router.get("/icp/{icp_id}", response_model=IcpResponse)
async def get_icp(
    icp_id: UUID,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[IcpService, Depends(_get_icp_service)],
) -> IcpResponse:
    """Get ICP detail. 404 for cross-tenant or not found (SC-adversarial-tenant · RN-1)."""
    result = await service.get(tenant_id, icp_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ICP no encontrado.")
    return result


@router.patch("/icp/{icp_id}", response_model=IcpResponse)
async def patch_icp(
    icp_id: UUID,
    request: IcpPatch,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[IcpService, Depends(_get_icp_service)],
) -> IcpResponse:
    """Autosave PATCH (RN-8: nunca bloquea guardar). 409 si label duplicado (RN-7)."""
    try:
        result = await service.patch(tenant_id, icp_id, request)
    except IcpLabelConflict as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un ICP con la etiqueta '{exc.label}'.",
        ) from exc
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ICP no encontrado.")
    return result


@router.post("/icp/{icp_id}/mark-ready", response_model=IcpMarkReadyResponse)
async def mark_icp_ready(
    icp_id: UUID,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[IcpService, Depends(_get_icp_service)],
) -> IcpMarkReadyResponse:
    """RN-8: mark ICP ready. 200 listo / 422 con missing[].

    NO bloquea guardar — solo valida en mark-ready.
    missing[] muestra qué falta al owner (no raise HTTP 400 — spec manda).
    """
    result = await service.mark_ready(tenant_id, icp_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ICP no encontrado.")
    if result.missing:
        # Return 422 shape but with missing[] (FE muestra inline)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"status": result.status, "missing": result.missing},
        )
    return result


@router.delete("/icp/{icp_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_icp(
    icp_id: UUID,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[IcpService, Depends(_get_icp_service)],
) -> None:
    """Soft delete ICP. 404 si no existe o cross-tenant."""
    result = await service.soft_delete(tenant_id, icp_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ICP no encontrado.")


# ─────────────────────────────────────────────────────────────────────────────
# Buyer routes (scoped under ICP)
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/icp/{icp_id}/buyers", response_model=list[BuyerResponse])
async def list_buyers(
    icp_id: UUID,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[BuyerService, Depends(_get_buyer_service)],
) -> list[BuyerResponse]:
    """List buyers for an ICP (scoped tenant_id ∧ icp_id · RN-5)."""
    return await service.list_by_icp(tenant_id, icp_id)


@router.post(
    "/icp/{icp_id}/buyers",
    response_model=BuyerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_buyer(
    icp_id: UUID,
    request: BuyerCreate,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[BuyerService, Depends(_get_buyer_service)],
) -> BuyerResponse:
    """Create Buyer under an ICP. 404 if ICP not found or cross-tenant (RN-5)."""
    try:
        return await service.create(tenant_id, icp_id, request)
    except BuyerNotInIcp as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ICP no encontrado.") from exc


@router.get("/buyer/{buyer_id}", response_model=BuyerResponse)
async def get_buyer(
    buyer_id: UUID,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[BuyerService, Depends(_get_buyer_service)],
) -> BuyerResponse:
    """Get Buyer detail. 404 for cross-tenant or not found (RN-1)."""
    result = await service.get(tenant_id, buyer_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyer no encontrado.")
    return result


@router.patch("/buyer/{buyer_id}", response_model=BuyerResponse)
async def patch_buyer(
    buyer_id: UUID,
    request: BuyerPatch,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[BuyerService, Depends(_get_buyer_service)],
) -> BuyerResponse:
    """Autosave PATCH Buyer."""
    result = await service.patch(tenant_id, buyer_id, request)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyer no encontrado.")
    return result


@router.post("/buyer/{buyer_id}/set-primary", response_model=BuyerResponse)
async def set_buyer_primary(
    buyer_id: UUID,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[BuyerService, Depends(_get_buyer_service)],
) -> BuyerResponse:
    """RN-6: Set buyer as primary, demoting all others in same ICP (one transaction)."""
    result = await service.set_primary(tenant_id, buyer_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyer no encontrado.")
    return result


@router.delete("/buyer/{buyer_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_buyer(
    buyer_id: UUID,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[BuyerService, Depends(_get_buyer_service)],
) -> None:
    """Soft delete Buyer."""
    result = await service.soft_delete(tenant_id, buyer_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyer no encontrado.")


# ─────────────────────────────────────────────────────────────────────────────
# Extraction routes — draft-first extractor (T-AG-1 · IcpExtractionService)
# ─────────────────────────────────────────────────────────────────────────────


def _get_extraction_service() -> IcpExtractionService:
    """Provide the process-singleton IcpExtractionService (job store survives requests).

    DI seam: tests override this dependency with a hermetic service.
    """
    return get_extraction_service()


@router.post("/icp/extract", response_model=IcpExtractJobResponse)
async def extract_icp(
    request: IcpExtractRequest,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[IcpExtractionService, Depends(_get_extraction_service)],
) -> IcpExtractJobResponse:
    """Draft-first extraction: start async job → return {job_id, status=analizando} (RN-1/RN-3).

    Least-privilege: the extractor only PROPOSES a borrador (RN-3). The seed is treated
    as untrusted data (RN-9 — wrapped + sanitized in the orchestrator).
    """
    return await service.start(tenant_id, request)


@router.get("/icp/extract/{job_id}", response_model=IcpExtractJobResponse)
async def get_extract_job(
    job_id: UUID,
    tenant_id: Annotated[UUID, Depends(_get_tenant_id)],
    service: Annotated[IcpExtractionService, Depends(_get_extraction_service)],
) -> IcpExtractJobResponse:
    """Poll extraction job status (analizando|done|failed). 404 if not the owning tenant (RN-1)."""
    result = await service.get_job(tenant_id, job_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job de extracción no encontrado.")
    return result
