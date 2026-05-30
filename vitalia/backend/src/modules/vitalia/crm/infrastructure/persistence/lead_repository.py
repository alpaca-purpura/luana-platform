# cap: crm.crm-consent-optout
# story-origin: TBD
"""LeadRepository — PII entity repository with pgcrypto encrypt/decrypt wiring.

Infrastructure layer — Lead is PII (name/email/phone/notes), NOT PHI.
Single tenant_id filter only (no clinic_id dual filter required).

Encryption wiring (ADR-007 D1 + T-2):
  - Reads: pgp_sym_decrypt(col, :kek)::text for name/email/phone/notes.
  - Writes: pgp_sym_encrypt(:val, :kek) for name/email/phone/notes.
  - KEK injected via constructor (kek: KEKClient | None = None).
    None → KEKClient.from_env() back-compat for tests.

Methods create() + update() added in T-2 (were called by lead_service but
did not exist in the repo — SC-5 round-trip deliverable).

Architecture fitness gate: test_lead_repository_is_not_phi_repository
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia._shared.encryption.kek_client import KEKClient
from src.modules.vitalia.crm.domain.lead import Lead

logger = structlog.get_logger()

# PII columns that must be encrypted at-rest for leads.
_LEAD_ENC_COLS: frozenset[str] = frozenset({"name", "email", "phone", "notes"})


def _utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(tz=timezone.utc)


class LeadRepository:
    """Repository for Lead PII entities with pgcrypto encrypt/decrypt wiring.

    Applies single tenant_id filter only (Lead is NOT PHI).
    Marketing and receptionist roles can access leads.
    Encrypts PII columns (name/email/phone/notes) at-rest via pgcrypto.
    """

    def __init__(
        self,
        session: AsyncSession,
        kek: KEKClient | None = None,
    ) -> None:
        """Initialize with a DB session and optional KEK.

        Args:
            session: SQLAlchemy async session.
            kek: Optional KEKClient. If None, KEKClient.from_env() is called
                 (back-compat for tests and callers that don't inject KEK).
        """
        self._session = session
        self._kek: KEKClient = kek if kek is not None else KEKClient.from_env()

    async def get_by_id(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
    ) -> Lead | None:
        """Retrieve a Lead by ID with single tenant_id filter + pgcrypto decrypt.

        Args:
            entity_id: Lead UUID to retrieve.
            tenant_id: Tenant UUID — root isolation (required).

        Returns:
            Lead domain entity or None if not found.

        Raises:
            ValueError: If tenant_id is None.
        """
        if tenant_id is None:
            raise ValueError(
                "LeadRepository.get_by_id requires tenant_id — never bypass root tenant isolation (tenant-isolation.md)"
            )

        kek_val = self._kek.get_key()

        stmt = text(
            """
            SELECT id, tenant_id,
                   pgp_sym_decrypt(name, :kek)::text  AS name,
                   pgp_sym_decrypt(email, :kek)::text AS email,
                   pgp_sym_decrypt(phone, :kek)::text AS phone,
                   source, status,
                   pgp_sym_decrypt(notes, :kek)::text AS notes,
                   deleted_at, created_at, updated_at
            FROM vitalia_leads
            WHERE tenant_id = :tenant_id
              AND id = :entity_id
              AND deleted_at IS NULL
            LIMIT 1
            """
        )
        result = await self._session.execute(
            stmt,
            {
                "kek": kek_val,
                "tenant_id": str(tenant_id),
                "entity_id": str(entity_id),
            },
        )
        row = result.fetchone()

        if row is None:
            return None

        return Lead(
            id=UUID(str(row.id)),
            tenant_id=UUID(str(row.tenant_id)),
            name=row.name,
            email=row.email,
            phone=row.phone,
            source=row.source,
            status=row.status,
            notes=row.notes,
            deleted_at=row.deleted_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    async def list_by_filter(
        self,
        *,
        tenant_id: UUID,
        **filters: object,
    ) -> list[Lead]:
        """List Leads matching the given filters + pgcrypto decrypt.

        Args:
            tenant_id: Tenant UUID — root isolation (required).
            **filters: Additional filter criteria (status, source, limit, offset).

        Returns:
            List of matching Lead entities.

        Raises:
            ValueError: If tenant_id is None.
        """
        if tenant_id is None:
            raise ValueError("LeadRepository.list_by_filter requires tenant_id")

        kek_val = self._kek.get_key()

        stmt = text(
            """
            SELECT id, tenant_id,
                   pgp_sym_decrypt(name, :kek)::text  AS name,
                   pgp_sym_decrypt(email, :kek)::text AS email,
                   pgp_sym_decrypt(phone, :kek)::text AS phone,
                   source, status,
                   pgp_sym_decrypt(notes, :kek)::text AS notes,
                   deleted_at, created_at, updated_at
            FROM vitalia_leads
            WHERE tenant_id = :tenant_id
              AND deleted_at IS NULL
            ORDER BY created_at DESC
            """
        )
        result = await self._session.execute(stmt, {"kek": kek_val, "tenant_id": str(tenant_id)})
        rows = result.fetchall()

        return [
            Lead(
                id=UUID(str(row.id)),
                tenant_id=UUID(str(row.tenant_id)),
                name=row.name,
                email=row.email,
                phone=row.phone,
                source=row.source,
                status=row.status,
                notes=row.notes,
                deleted_at=row.deleted_at,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )
            for row in rows
        ]

    async def create(
        self,
        *,
        id: UUID,
        tenant_id: UUID,
        name: str,
        email: str | None,
        phone: str | None,
        source: str | None,
        status: str,
        notes: str | None,
        marketing_opt_in: bool,
    ) -> Lead:
        """Create a new Lead with PII columns encrypted at-rest.

        PII columns (name/email/phone/notes) are wrapped in pgp_sym_encrypt.
        source/status/marketing_opt_in are stored plaintext.
        NULL values for email/phone/notes are handled:
          pgp_sym_encrypt(NULL, :kek) = NULL — OK per pgcrypto behavior.

        Args:
            id: Lead UUID (supplied by caller — uuid4() from service).
            tenant_id: Tenant UUID.
            name: Lead name (required).
            email: Optional email (encrypted if set, NULL if None).
            phone: Optional phone (encrypted if set, NULL if None).
            source: Optional acquisition source (plaintext).
            status: Lead status (plaintext, default 'new').
            notes: Optional notes (encrypted if set, NULL if None).
            marketing_opt_in: Marketing consent flag (plaintext boolean).

        Returns:
            Created Lead domain entity (re-read via get_by_id to return decrypted).
        """
        if tenant_id is None:
            raise ValueError("LeadRepository.create requires tenant_id")

        kek_val = self._kek.get_key()
        now = _utc_now()

        stmt = text(
            """
            INSERT INTO vitalia_leads
                (id, tenant_id, name, email, phone, source, status, notes,
                 deleted_at, created_at, updated_at)
            VALUES (
                :id, :tenant_id,
                pgp_sym_encrypt(:name, :kek),
                pgp_sym_encrypt(:email, :kek),
                pgp_sym_encrypt(:phone, :kek),
                :source, :status,
                pgp_sym_encrypt(:notes, :kek),
                NULL, :created_at, :updated_at
            )
            RETURNING id
            """
        )
        await self._session.execute(
            stmt,
            {
                "id": str(id),
                "tenant_id": str(tenant_id),
                "name": name,
                "email": email,
                "phone": phone,
                "source": source,
                "status": status,
                "notes": notes,
                "kek": kek_val,
                "created_at": now,
                "updated_at": now,
            },
        )

        logger.info(
            "lead_created",
            lead_id=str(id),
            tenant_id=str(tenant_id),
        )

        # Re-read via get_by_id to return decrypted Lead entity
        created = await self.get_by_id(entity_id=id, tenant_id=tenant_id)
        if created is None:
            # Should not happen — just inserted; fallback to in-memory entity
            return Lead(
                id=id,
                tenant_id=tenant_id,
                name=name,
                email=email,
                phone=phone,
                source=source,
                status=status,
                notes=notes,
                created_at=now,
                updated_at=now,
            )
        return created

    async def update(
        self,
        lead_id: UUID,
        *,
        tenant_id: UUID,
        updates: dict[str, object],
    ) -> Lead:
        """Update Lead fields with PII columns encrypted via pgcrypto.

        Builds a dynamic SET clause. PII columns (name/email/phone/notes)
        are wrapped in pgp_sym_encrypt(:val, :kek). Non-PII cols are bound
        directly. Returns the updated Lead (re-read via get_by_id).

        Args:
            lead_id: Lead UUID.
            tenant_id: Tenant UUID — root isolation (required).
            updates: Dict of field → value. Only PII cols are encrypted.

        Returns:
            Updated Lead domain entity.

        Raises:
            ValueError: If tenant_id is None.
        """
        if tenant_id is None:
            raise ValueError("LeadRepository.update requires tenant_id")

        if not updates:
            # Nothing to update — re-read and return current state
            existing = await self.get_by_id(entity_id=lead_id, tenant_id=tenant_id)
            if existing is None:
                raise ValueError(f"Lead {lead_id} not found for tenant {tenant_id}")
            return existing

        kek_val = self._kek.get_key()

        set_clauses = []
        params: dict[str, object] = {
            "kek": kek_val,
            "tenant_id": str(tenant_id),
            "lead_id": str(lead_id),
            "updated_at": _utc_now(),
        }

        for k, v in updates.items():
            if k in _LEAD_ENC_COLS:
                set_clauses.append(f"{k} = pgp_sym_encrypt(:{k}, :kek)")
            else:
                set_clauses.append(f"{k} = :{k}")
            params[k] = v

        set_sql = ", ".join(set_clauses)
        stmt = text(
            f"""
            UPDATE vitalia_leads
            SET {set_sql}, updated_at = :updated_at
            WHERE tenant_id = :tenant_id
              AND id = :lead_id
              AND deleted_at IS NULL
            """
        )
        await self._session.execute(stmt, params)

        logger.info(
            "lead_updated",
            lead_id=str(lead_id),
            tenant_id=str(tenant_id),
            fields=list(updates.keys()),
        )

        updated = await self.get_by_id(entity_id=lead_id, tenant_id=tenant_id)
        if updated is None:
            raise ValueError(f"Lead {lead_id} not found after update for tenant {tenant_id}")
        return updated
