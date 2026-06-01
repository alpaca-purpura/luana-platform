# cap: clinics.lisa.doctores
"""Public doctor serializer — explicit allow-list channel guard.

HIPAA-lite channel guard (hipaa-lite.md § Channel guards):
  - Constructs PublicDoctorDTO from Doctor domain entity using an
    EXPLICIT ALLOW-LIST of exactly 7 fields.
  - PHI fields (dni, email, phone, credential) are NEVER serialized.
  - Internal fields (tenant_id, clinic_id, active, visible_en_landing) are omitted.
  - The allow-list is the SECURITY BOUNDARY: adding PHI to the Doctor model
    does NOT leak it — only the 7 named fields are ever emitted.

Arch test: tests/architecture/test_public_doctors_allowlist.py (V-ARCH-7).
Functional test: tests/modules/vitalia/clinics/test_public_doctors_endpoint.py (V-FN-11).

Per 03-arch-be.md § 6:
  'Allow-list mapper (channel guard). Resolves avatar_url from avatar_key.
   credential_label optional ("CMP 12345" or "Colegiado/a" per clinic config).'
"""

from __future__ import annotations

from src.modules.vitalia.clinics.api.dtos import BioPublicDTO, PublicDoctorDTO
from src.modules.vitalia.clinics.domain.doctor import Doctor


def to_public_dto(
    doctor: Doctor,
    *,
    credential_label: str | None = None,
) -> PublicDoctorDTO:
    """Map a Doctor domain entity to a PublicDoctorDTO using the allow-list.

    This function is the ONLY sanctioned way to serialize a Doctor for public
    endpoints. It physically cannot emit PHI because it only reads the 7
    allow-listed fields — all other Doctor fields are ignored.

    Security invariant: even if PHI fields are added to Doctor in the future,
    this serializer will NOT include them (allow-list, not deny-list).

    Args:
        doctor: Domain entity with decrypted PII (used only for allow-listed fields).
        credential_label: Optional display label like "CMP 12345" or "Colegiado/a".
            Clinic admin decides whether to show the credential number publicly.
            Defaults to None (not shown).

    Returns:
        PublicDoctorDTO with exactly 7 allow-listed fields.
        PHI fields (dni, email, phone, credential) are NEVER included.

    Allowed fields (per 03-arch-be.md § 3 and 01-spec.md § Endpoint público):
        1. display_name       — derived from first_name + last_name (not PHI)
        2. specialty          — public specialty (not PHI)
        3. avatar_key         — R2 object key for public avatar (not PHI)
        4. years_experience   — signal of authority (not PHI)
        5. languages          — languages the doctor works in (not PHI)
        6. bio_public         — generated public bio in 3 sections (not PHI)
        7. credential_label   — optional display string (not the raw credential number)
    """
    # Build bio_public DTO from domain BioPublic dataclass
    bio_dto: BioPublicDTO | None = None
    if doctor.bio_public is not None and not doctor.bio_public.is_empty():
        bio_dto = BioPublicDTO(
            resumen=doctor.bio_public.resumen,
            formacion=doctor.bio_public.formacion,
            enfoque=doctor.bio_public.enfoque,
        )

    # Construct PublicDoctorDTO using ONLY the 7 allow-listed fields.
    # NEVER access doctor.dni, doctor.email, doctor.phone, doctor.credential here.
    # The constructor signature of PublicDoctorDTO enforces the allow-list at the
    # type level — Pydantic will reject any unknown fields.
    return PublicDoctorDTO(
        display_name=doctor.display_name,  # 1. derived property, not PHI
        specialty=doctor.specialty,  # 2. professional specialty
        avatar_key=doctor.avatar_key,  # 3. R2 key for public avatar
        years_experience=doctor.years_experience,  # 4. authority signal
        languages=doctor.languages,  # 5. languages list
        bio_public=bio_dto,  # 6. generated public bio
        credential_label=credential_label,  # 7. optional display string
    )
