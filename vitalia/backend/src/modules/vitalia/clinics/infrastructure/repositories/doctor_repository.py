# cap: clinics.lisa.doctores
"""DoctorRepository — pgcrypto dual-filter implementation.

HIPAA-lite compliance (vitalia/.claude/rules/hipaa-lite.md):
  - Inherits CompoundScopeRepositoryBase (engine — post lift 2026-05-20)
    with scope_field="clinic_id" for HIPAA-lite dual filter
  - PII columns (dni/email/phone/credential) encrypted via pgp_sym_encrypt/decrypt
  - KEK injected via constructor (KEKClient)
  - All queries: deleted_at IS NULL, tenant_id, clinic_id

pgcrypto pattern adapted from crm/infrastructure/persistence/lead_repository.py
and patient_repository.py (existing verified pattern in codebase).

Engine base: luana_core_platform.repositories.compound_scope_repository.CompoundScopeRepositoryBase
Arch gate: test_compound_scope_repository_used.py (new PHI repos must use engine base)
"""

from __future__ import annotations

import hashlib
import hmac
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import structlog
from luana_core_platform.repositories.compound_scope_repository import (
    CompoundScopeRepositoryBase,
)
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia._shared.encryption.kek_client import KEKClient
from src.modules.vitalia.clinics.domain.bio import BioPublic
from src.modules.vitalia.clinics.domain.doctor import Doctor
from src.modules.vitalia.clinics.infrastructure.models.doctor_model import VitaliaDoctorModel

logger = structlog.get_logger()

# PHI columns that require pgcrypto encryption
_PHI_ENC_COLS: frozenset[str] = frozenset({"dni", "email", "phone", "credential"})


def compute_dni_hash(dni: str, kek: str) -> str:
    """Compute HMAC-SHA256 of DNI with KEK for unique constraint.

    Uses HMAC rather than plain hash to prevent rainbow-table attacks.
    Deterministic: same (dni, kek) → same hash always.

    Args:
        dni: Raw DNI string.
        kek: KEK hex string used as HMAC key.

    Returns:
        64-character hex digest (SHA-256).
    """
    # Use KEK as HMAC key (hex → bytes)
    key_bytes = bytes.fromhex(kek[:64]) if len(kek) >= 64 else kek.encode("utf-8")
    return hmac.new(key_bytes, dni.strip().encode("utf-8"), hashlib.sha256).hexdigest()


def _utc_now() -> datetime:
    """Return timezone-aware UTC datetime."""
    return datetime.now(tz=timezone.utc)


class DoctorRepository(CompoundScopeRepositoryBase[VitaliaDoctorModel, UUID]):
    """Async repository for Doctor entities.

    Enforces:
      - HIPAA dual filter (tenant_id + clinic_id) via CompoundScopeRepositoryBase
        (scope_field="clinic_id")
      - pgcrypto encrypt/decrypt for PII columns
      - SQLA 2.0 text() queries for pgcrypto ops (ORM can't inline SQL functions)
      - deleted_at IS NULL on all reads (soft-delete only)
    """

    MODEL = VitaliaDoctorModel

    def __init__(
        self,
        session: AsyncSession,
        kek: KEKClient | None = None,
    ) -> None:
        """Initialize with async session and optional KEK.

        Args:
            session: SQLAlchemy async session.
            kek: KEKClient for PHI encryption. Defaults to KEKClient.from_env().
        """
        super().__init__(session=session, scope_field="clinic_id")
        self._kek = kek if kek is not None else KEKClient.from_env()

    def validate_dual_filter(
        self,
        *,
        tenant_id: UUID | None,
        clinic_id: UUID | None,
    ) -> None:
        """Validate dual filter (tenant_id + clinic_id) — engine-compatible shim.

        Delegates to the brand-local PhiRepositoryBase.validate_dual_filter
        pattern to maintain consistency with existing callers while using
        the engine CompoundScopeRepositoryBase as the inheritance base.
        """
        from src.modules.vitalia._shared.repositories.phi_repository import (  # noqa: PLC0415
            MissingClinicFilterError,
        )

        if tenant_id is None:
            raise ValueError("PHI repository requires tenant_id — never bypass root tenant isolation")
        if clinic_id is None:
            logger.warning(
                "phi_dual_filter_violation",
                repository=self.__class__.__name__,
                reason="clinic_id missing from PHI query",
            )
            raise MissingClinicFilterError()

    # ── Abstract method implementations ─────────────────────────────────────

    async def get_by_id(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> Doctor | None:
        """Retrieve a Doctor by ID with dual-filter + pgcrypto decrypt.

        Returns None if not found or belongs to different tenant/clinic.
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)
        kek_val = self._kek.get_key()

        stmt = text(
            """
            SELECT id, tenant_id, clinic_id,
                   first_name, last_name,
                   pgp_sym_decrypt(dni_encrypted, :kek)::text         AS dni,
                   pgp_sym_decrypt(email_encrypted, :kek)::text       AS email,
                   CASE WHEN phone_encrypted IS NOT NULL
                        THEN pgp_sym_decrypt(phone_encrypted, :kek)::text
                   END                                                AS phone,
                   pgp_sym_decrypt(credential_encrypted, :kek)::text  AS credential,
                   credential_country, specialty, years_experience,
                   languages, bio_inputs_notes, bio_links, bio_public,
                   avatar_key, visible_en_landing, active,
                   created_at, updated_at, deleted_at
            FROM vitalia_doctors
            WHERE id = :entity_id
              AND tenant_id = :tenant_id
              AND clinic_id = :clinic_id
              AND deleted_at IS NULL
            """
        )
        result = await self._session.execute(
            stmt,
            {
                "entity_id": str(entity_id),
                "tenant_id": str(tenant_id),
                "clinic_id": str(clinic_id),
                "kek": kek_val,
            },
        )
        row = result.mappings().first()
        return _row_to_doctor(row) if row else None

    async def list_by_filter(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        q: str | None = None,
        specialty: str | None = None,
        active: bool | None = None,
        page: int = 1,
        page_size: int = 24,
        **filters: Any,
    ) -> list[Doctor]:
        """List Doctors with optional filters, server-side pagination.

        Returns masked-safe domain entities (PII decrypted for admin only).
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)
        kek_val = self._kek.get_key()

        where_clauses = [
            "tenant_id = :tenant_id",
            "clinic_id = :clinic_id",
            "deleted_at IS NULL",
        ]
        params: dict[str, Any] = {
            "tenant_id": str(tenant_id),
            "clinic_id": str(clinic_id),
            "kek": kek_val,
        }

        if active is not None:
            where_clauses.append("active = :active")
            params["active"] = active

        if specialty:
            where_clauses.append("specialty ILIKE :specialty")
            params["specialty"] = f"%{specialty}%"

        where_sql = " AND ".join(where_clauses)
        offset = (page - 1) * page_size

        stmt = text(
            f"""
            SELECT id, tenant_id, clinic_id,
                   first_name, last_name,
                   pgp_sym_decrypt(dni_encrypted, :kek)::text         AS dni,
                   pgp_sym_decrypt(email_encrypted, :kek)::text       AS email,
                   CASE WHEN phone_encrypted IS NOT NULL
                        THEN pgp_sym_decrypt(phone_encrypted, :kek)::text
                   END                                                AS phone,
                   pgp_sym_decrypt(credential_encrypted, :kek)::text  AS credential,
                   credential_country, specialty, years_experience,
                   languages, bio_inputs_notes, bio_links, bio_public,
                   avatar_key, visible_en_landing, active,
                   created_at, updated_at, deleted_at
            FROM vitalia_doctors
            WHERE {where_sql}
            ORDER BY last_name, first_name
            LIMIT :page_size OFFSET :offset
            """
        )
        params["page_size"] = page_size
        params["offset"] = offset

        result = await self._session.execute(stmt, params)
        rows = result.mappings().all()
        return [_row_to_doctor(row) for row in rows]

    async def count_by_filter(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        active: bool | None = None,
        specialty: str | None = None,
    ) -> int:
        """Count doctors matching the filter (for pagination total)."""
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)

        where_clauses = [
            "tenant_id = :tenant_id",
            "clinic_id = :clinic_id",
            "deleted_at IS NULL",
        ]
        params: dict[str, Any] = {
            "tenant_id": str(tenant_id),
            "clinic_id": str(clinic_id),
        }

        if active is not None:
            where_clauses.append("active = :active")
            params["active"] = active

        if specialty:
            where_clauses.append("specialty ILIKE :specialty")
            params["specialty"] = f"%{specialty}%"

        where_sql = " AND ".join(where_clauses)
        stmt = text(f"SELECT COUNT(*) FROM vitalia_doctors WHERE {where_sql}")
        result = await self._session.execute(stmt, params)
        count = result.scalar()
        return int(count or 0)

    async def get_by_dni_hash(
        self,
        dni_hash: str,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> Doctor | None:
        """Retrieve a Doctor by deterministic DNI hash (for duplicate check).

        Used by DoctorService.create_doctor to detect SC-5 race condition.
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)
        kek_val = self._kek.get_key()

        stmt = text(
            """
            SELECT id, tenant_id, clinic_id,
                   first_name, last_name,
                   pgp_sym_decrypt(dni_encrypted, :kek)::text         AS dni,
                   pgp_sym_decrypt(email_encrypted, :kek)::text       AS email,
                   CASE WHEN phone_encrypted IS NOT NULL
                        THEN pgp_sym_decrypt(phone_encrypted, :kek)::text
                   END                                                AS phone,
                   pgp_sym_decrypt(credential_encrypted, :kek)::text  AS credential,
                   credential_country, specialty, years_experience,
                   languages, bio_inputs_notes, bio_links, bio_public,
                   avatar_key, visible_en_landing, active,
                   created_at, updated_at, deleted_at
            FROM vitalia_doctors
            WHERE dni_hash = :dni_hash
              AND tenant_id = :tenant_id
              AND deleted_at IS NULL
            LIMIT 1
            """
        )
        result = await self._session.execute(
            stmt,
            {
                "dni_hash": dni_hash,
                "tenant_id": str(tenant_id),
                "kek": kek_val,
            },
        )
        row = result.mappings().first()
        return _row_to_doctor(row) if row else None

    async def create(
        self,
        doctor: Doctor,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> Doctor:
        """Persist a new Doctor with pgcrypto-encrypted PII.

        Args:
            doctor: Domain entity with plain-text PII.
            tenant_id: Tenant UUID.
            clinic_id: Clinic UUID.

        Returns:
            Persisted Doctor with DB-generated timestamps.

        Raises:
            IntegrityError: If (tenant_id, dni_hash) unique constraint violated.
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)
        kek_val = self._kek.get_key()
        dni_hash = compute_dni_hash(doctor.dni, kek_val)
        bio_json = doctor.bio_public.to_dict() if doctor.bio_public else None

        stmt = text(
            """
            INSERT INTO vitalia_doctors (
              id, tenant_id, clinic_id,
              first_name, last_name,
              dni_encrypted, email_encrypted, phone_encrypted, credential_encrypted,
              dni_hash,
              specialty, credential_country, years_experience,
              languages, bio_inputs_notes, bio_links, bio_public,
              avatar_key, visible_en_landing, active,
              created_at, updated_at
            ) VALUES (
              :id, :tenant_id, :clinic_id,
              :first_name, :last_name,
              pgp_sym_encrypt(:dni, :kek),
              pgp_sym_encrypt(:email, :kek),
              CASE WHEN :phone IS NOT NULL THEN pgp_sym_encrypt(:phone, :kek) ELSE NULL END,
              pgp_sym_encrypt(:credential, :kek),
              :dni_hash,
              :specialty, :credential_country, :years_experience,
              CAST(:languages AS jsonb), :bio_inputs_notes, CAST(:bio_links AS jsonb),
              CAST(:bio_public AS jsonb),
              :avatar_key, :visible_en_landing, :active,
              NOW(), NOW()
            )
            RETURNING id, created_at, updated_at
            """
        )
        import json  # noqa: PLC0415

        await self._session.execute(
            stmt,
            {
                "id": str(doctor.id),
                "tenant_id": str(tenant_id),
                "clinic_id": str(clinic_id),
                "first_name": doctor.first_name,
                "last_name": doctor.last_name,
                "dni": doctor.dni,
                "email": doctor.email,
                "phone": doctor.phone,
                "credential": doctor.credential,
                "dni_hash": dni_hash,
                "kek": kek_val,
                "specialty": doctor.specialty,
                "credential_country": doctor.credential_country,
                "years_experience": doctor.years_experience,
                "languages": json.dumps(doctor.languages),
                "bio_inputs_notes": doctor.bio_inputs_notes,
                "bio_links": json.dumps(doctor.bio_links),
                "bio_public": json.dumps(bio_json) if bio_json is not None else None,
                "avatar_key": doctor.avatar_key,
                "visible_en_landing": doctor.visible_en_landing,
                "active": doctor.active,
            },
        )
        await self._session.flush()
        logger.info(
            "doctor_created",
            doctor_id=str(doctor.id),
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
        )
        # Return the doctor with updated timestamps from the INSERT RETURNING clause
        return doctor

    async def update(
        self,
        doctor: Doctor,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> Doctor:
        """Update doctor fields. PII fields re-encrypted on write.

        Supports partial updates: only non-None patch fields are written.
        Returns updated Doctor entity.
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)
        import json  # noqa: PLC0415

        bio_json = doctor.bio_public.to_dict() if doctor.bio_public else None

        stmt = text(
            """
            UPDATE vitalia_doctors SET
              first_name = :first_name,
              last_name = :last_name,
              specialty = :specialty,
              credential_country = :credential_country,
              years_experience = :years_experience,
              languages = CAST(:languages AS jsonb),
              bio_inputs_notes = :bio_inputs_notes,
              bio_links = CAST(:bio_links AS jsonb),
              bio_public = CAST(:bio_public AS jsonb),
              avatar_key = :avatar_key,
              visible_en_landing = :visible_en_landing,
              active = :active,
              updated_at = NOW()
            WHERE id = :doctor_id
              AND tenant_id = :tenant_id
              AND clinic_id = :clinic_id
              AND deleted_at IS NULL
            """
        )
        await self._session.execute(
            stmt,
            {
                "doctor_id": str(doctor.id),
                "tenant_id": str(tenant_id),
                "clinic_id": str(clinic_id),
                "first_name": doctor.first_name,
                "last_name": doctor.last_name,
                "specialty": doctor.specialty,
                "credential_country": doctor.credential_country,
                "years_experience": doctor.years_experience,
                "languages": json.dumps(doctor.languages),
                "bio_inputs_notes": doctor.bio_inputs_notes,
                "bio_links": json.dumps(doctor.bio_links),
                "bio_public": json.dumps(bio_json) if bio_json is not None else None,
                "avatar_key": doctor.avatar_key,
                "visible_en_landing": doctor.visible_en_landing,
                "active": doctor.active,
            },
        )
        await self._session.flush()
        return doctor

    async def soft_deactivate(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> None:
        """Soft-deactivate a doctor (sets active=False).

        Does NOT set deleted_at — deactivation is reversible.
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)

        stmt = text(
            """
            UPDATE vitalia_doctors SET
              active = FALSE,
              updated_at = NOW()
            WHERE id = :entity_id
              AND tenant_id = :tenant_id
              AND clinic_id = :clinic_id
              AND deleted_at IS NULL
            """
        )
        await self._session.execute(
            stmt,
            {
                "entity_id": str(entity_id),
                "tenant_id": str(tenant_id),
                "clinic_id": str(clinic_id),
            },
        )
        await self._session.flush()

    async def list_public(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> list[Doctor]:
        """List doctors visible on the public landing page.

        Returns only active + visible_en_landing=True doctors.
        PII is decrypted for serialization into allow-listed PublicDoctorDTO.
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)
        kek_val = self._kek.get_key()

        stmt = text(
            """
            SELECT id, tenant_id, clinic_id,
                   first_name, last_name,
                   pgp_sym_decrypt(dni_encrypted, :kek)::text         AS dni,
                   pgp_sym_decrypt(email_encrypted, :kek)::text       AS email,
                   CASE WHEN phone_encrypted IS NOT NULL
                        THEN pgp_sym_decrypt(phone_encrypted, :kek)::text
                   END                                                AS phone,
                   pgp_sym_decrypt(credential_encrypted, :kek)::text  AS credential,
                   credential_country, specialty, years_experience,
                   languages, bio_inputs_notes, bio_links, bio_public,
                   avatar_key, visible_en_landing, active,
                   created_at, updated_at, deleted_at
            FROM vitalia_doctors
            WHERE tenant_id = :tenant_id
              AND clinic_id = :clinic_id
              AND visible_en_landing = TRUE
              AND active = TRUE
              AND deleted_at IS NULL
            ORDER BY last_name, first_name
            """
        )
        result = await self._session.execute(
            stmt,
            {
                "tenant_id": str(tenant_id),
                "clinic_id": str(clinic_id),
                "kek": kek_val,
            },
        )
        rows = result.mappings().all()
        return [_row_to_doctor(row) for row in rows]


def _row_to_doctor(row: Any) -> Doctor:
    """Map a DB row mapping to a Doctor domain entity.

    Handles JSON deserialization and BioPublic reconstruction.
    """
    import json as _json  # noqa: PLC0415

    languages = row["languages"] if row["languages"] is not None else []
    if isinstance(languages, str):
        languages = _json.loads(languages)

    bio_links = row["bio_links"] if row["bio_links"] is not None else []
    if isinstance(bio_links, str):
        bio_links = _json.loads(bio_links)

    bio_dict = row["bio_public"]
    if isinstance(bio_dict, str):
        bio_dict = _json.loads(bio_dict)
    bio_public = BioPublic.from_dict(bio_dict)

    return Doctor(
        id=UUID(str(row["id"])),
        tenant_id=UUID(str(row["tenant_id"])),
        clinic_id=UUID(str(row["clinic_id"])),
        first_name=row["first_name"],
        last_name=row["last_name"],
        dni=row["dni"] or "",
        email=row["email"] or "",
        phone=row["phone"],
        credential=row["credential"] or "",
        credential_country=row["credential_country"],
        specialty=row["specialty"],
        years_experience=row["years_experience"],
        languages=languages,
        bio_inputs_notes=row["bio_inputs_notes"],
        bio_links=bio_links,
        bio_public=bio_public,
        avatar_key=row["avatar_key"],
        visible_en_landing=bool(row["visible_en_landing"]),
        active=bool(row["active"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        deleted_at=row["deleted_at"],
    )
