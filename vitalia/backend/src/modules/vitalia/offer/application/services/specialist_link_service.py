# cap: lisa.servicios
"""SpecialistLinkService — link/unlink doctors to a service (T-2 § 6).

Linking verifies the doctor exists in the roster through :class:`DoctorRosterPort`
(cross-module access to ``clinics`` ONLY via the port). It NEVER creates a doctor.
The roster read is dual-scoped (tenant_id + clinic_id); the link itself is
tenant-scoped (the catalog is NOT PHI). Unlink is idempotent.
"""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from src.modules.vitalia.offer.application.ports.doctor_roster_port import DoctorRosterPort
from src.modules.vitalia.offer.domain.specialist_link import ServiceSpecialistLink


class DoctorNotInRosterError(Exception):
    """Raised when linking a doctor that is not in the tenant/clinic roster."""

    def __init__(self, doctor_id: UUID) -> None:
        super().__init__(f"Doctor {doctor_id} is not in the clinic roster.")
        self.doctor_id = doctor_id


class _LinkRepo(Protocol):
    async def link(self, link: ServiceSpecialistLink) -> ServiceSpecialistLink: ...
    async def list_by_offer(self, offer_id: UUID, *, tenant_id: UUID) -> list[ServiceSpecialistLink]: ...
    async def unlink(self, offer_id: UUID, doctor_id: UUID, *, tenant_id: UUID) -> None: ...


class SpecialistLinkService:
    """Manages the (offer ↔ doctor) links, gated by roster membership."""

    def __init__(self, *, roster: DoctorRosterPort, link_repo: _LinkRepo) -> None:
        self._roster = roster
        self._links = link_repo

    async def link(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        offer_id: UUID,
        doctor_id: UUID,
    ) -> ServiceSpecialistLink:
        doctor = await self._roster.get_doctor(tenant_id=tenant_id, clinic_id=clinic_id, doctor_id=doctor_id)
        if doctor is None:
            raise DoctorNotInRosterError(doctor_id)
        link = ServiceSpecialistLink(tenant_id=tenant_id, offer_id=offer_id, doctor_id=doctor_id)
        return await self._links.link(link)

    async def list_for_offer(self, *, tenant_id: UUID, offer_id: UUID) -> list[ServiceSpecialistLink]:
        return await self._links.list_by_offer(offer_id, tenant_id=tenant_id)

    async def unlink(self, *, tenant_id: UUID, offer_id: UUID, doctor_id: UUID) -> None:
        await self._links.unlink(offer_id, doctor_id, tenant_id=tenant_id)
