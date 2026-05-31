# cap: clinics.lisa.doctores
"""Public doctors router — unauthenticated endpoint for clinic landing pages.

Route:
  GET /{tenant_slug}/doctors — public, no auth

Architecture rules (03-arch-be.md § 4 + hipaa-lite.md):
  - NO auth required (this endpoint is intentionally public)
  - response_model= MANDATORY (arch test V-ARCH-7 enforces)
  - response_model = PublicDoctorsResponse (wraps list[PublicDoctorDTO])
  - Channel guard: only doctors with visible_en_landing=True AND active=True
  - PublicDoctorDTO is constructed EXCLUSIVELY via to_public_dto() allow-list serializer
  - PHI fields (dni/email/phone/credential) are NEVER serialized
  - No X-Tenant-ID header (public endpoint — tenant resolved from clinic slug)
  - redirect_slashes=False enforced at app level in main.py

Wiring (03-arch-be.md § 8):
  app.include_router(public_doctors_router, prefix="/api/public/clinic", tags=["public"])
  Resulting route: GET /api/public/clinic/{tenant_slug}/doctors

Business rules enforced:
  - visible-en-landing-requires-active (01-spec.md § Business rules)
  - public-endpoint-phi-allowlist (01-spec.md § Business rules)

Integration:
  - Consumer: vitalia-fase2-lisa-landing-public (future story FE landing page)
  - Consumer: any unauthenticated HTTP client (marketing landing, SEO bots)
  - Registered in: vitalia/backend/src/main.py (T-BE-5)
"""

from __future__ import annotations

from typing import AsyncGenerator

import structlog
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia.clinics.api.dtos import PublicDoctorsResponse
from src.modules.vitalia.clinics.application.public_doctor_serializer import to_public_dto
from src.modules.vitalia.clinics.infrastructure.repositories.clinic_repository import (
    ClinicRepository,
)
from src.modules.vitalia.clinics.infrastructure.repositories.doctor_repository import (
    DoctorRepository,
)

logger = structlog.get_logger()

router = APIRouter(tags=["public"])


async def _get_db() -> AsyncGenerator[AsyncSession, None]:
    """Async DB session dependency — shared with other routers."""
    from luana_core_platform.core.database import get_db  # noqa: PLC0415

    async for session in get_db():
        yield session


@router.get(
    "/{tenant_slug}/doctors",
    response_model=PublicDoctorsResponse,
    summary="Lista pública de doctores de una clínica",
    description=(
        "Endpoint público (sin autenticación) que devuelve el equipo médico visible "
        "de una clínica para su landing pública. Solo incluye doctores con "
        "visible_en_landing=true y active=true. PHI (DNI/email/teléfono/credencial) "
        "nunca se incluye — solo 7 campos permitidos por la lista explícita."
    ),
    responses={
        200: {"description": "Lista de doctores visibles en landing"},
        404: {"description": "Clínica no encontrada o inactiva"},
    },
)
async def list_public_doctors(
    tenant_slug: str = Path(
        ...,
        description="Slug público de la clínica (identificador URL-safe)",
        min_length=2,
        max_length=100,
    ),
    db: AsyncSession = Depends(_get_db),
) -> PublicDoctorsResponse:
    """List publicly-visible doctors for a clinic's landing page.

    Channel guard: returns ONLY doctors with visible_en_landing=True AND active=True.
    PHI fields are NEVER serialized — PublicDoctorDTO allow-list enforced by
    public_doctor_serializer.to_public_dto().

    Args:
        tenant_slug: URL-safe clinic slug from path parameter.
        db: Async database session (injected via Depends).

    Returns:
        PublicDoctorsResponse with list of PublicDoctorDTO (7 fields each).

    Raises:
        404: Clinic not found or not active (generic — no information leak).

    Business rules enforced:
        - visible-en-landing-requires-active: only visible+active doctors returned
        - public-endpoint-phi-allowlist: only 7 allow-listed fields in response
    """
    # Resolve clinic by public slug (no tenant_id required for public lookup)
    clinic_repo = ClinicRepository(db)
    clinic = await clinic_repo.get_by_slug_public(tenant_slug)

    if clinic is None:
        logger.info(
            "public_doctors_clinic_not_found",
            tenant_slug=tenant_slug,
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clínica no encontrada",
        )

    # Fetch publicly-visible doctors (visible_en_landing AND active filter)
    # DoctorRepository.list_public() applies both filters at the SQL level
    doctor_repo = DoctorRepository(db)
    doctors = await doctor_repo.list_public(
        tenant_id=clinic.tenant_id,
        clinic_id=clinic.id,
    )

    # Channel guard: serialize via allow-list serializer ONLY
    # to_public_dto() physically cannot emit PHI — explicit allow-list
    public_dtos = [to_public_dto(doctor) for doctor in doctors]

    logger.info(
        "public_doctors_listed",
        tenant_slug=tenant_slug,
        clinic_id=str(clinic.id),
        doctor_count=len(public_dtos),
    )

    return PublicDoctorsResponse(doctors=public_dtos)
