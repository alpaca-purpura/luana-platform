# cap: lisa.servicios
"""RED-first unit tests for SalesBriefService (T-2 § 6).

CRUD + idempotent autosave on the brand-local SalesBrief (1:1 per offer, NOT
PHI). D-2: the sales brief fields are vitalia-specific (faq/objections/keywords/
contraindications) with no direct engine Offer home, so the write-through is a
no-op today (documented) — the service owns the brand table and stays the SSoT.
First save creates; subsequent saves update the same row (no duplicates).
"""

from __future__ import annotations

from uuid import UUID

import pytest

from src.modules.vitalia.offer.application.services.sales_brief_service import SalesBriefService
from src.modules.vitalia.offer.domain.sales_brief import SalesBrief

TENANT = UUID("11111111-1111-1111-1111-111111111111")
OFFER = UUID("44444444-4444-4444-4444-444444444444")


class _FakeBriefRepo:
    def __init__(self) -> None:
        self.rows: list[SalesBrief] = []

    async def get_by_offer(self, offer_id, *, tenant_id):
        for b in self.rows:
            if b.offer_id == offer_id and b.tenant_id == tenant_id:
                return b
        return None

    async def create(self, brief: SalesBrief) -> SalesBrief:
        self.rows.append(brief)
        return brief

    async def update(self, brief: SalesBrief) -> SalesBrief:
        for i, b in enumerate(self.rows):
            if b.id == brief.id and b.tenant_id == brief.tenant_id:
                self.rows[i] = brief
                return brief
        raise AssertionError("update on missing row")


def _svc() -> tuple[SalesBriefService, _FakeBriefRepo]:
    repo = _FakeBriefRepo()
    return SalesBriefService(brief_repo=repo), repo


@pytest.mark.asyncio
async def test_get_returns_none_when_absent():
    svc, _ = _svc()
    assert await svc.get(tenant_id=TENANT, offer_id=OFFER) is None


@pytest.mark.asyncio
async def test_first_save_creates_row():
    svc, repo = _svc()
    saved = await svc.save(
        tenant_id=TENANT,
        offer_id=OFFER,
        fields={"candidate_ideal": "Pacientes 30-45 buscando estética facial"},
    )
    assert saved.candidate_ideal == "Pacientes 30-45 buscando estética facial"
    assert len(repo.rows) == 1


@pytest.mark.asyncio
async def test_autosave_is_idempotent_no_duplicate_row():
    svc, repo = _svc()
    await svc.save(tenant_id=TENANT, offer_id=OFFER, fields={"candidate_ideal": "v1"})
    again = await svc.save(tenant_id=TENANT, offer_id=OFFER, fields={"candidate_ideal": "v2"})
    assert again.candidate_ideal == "v2"
    assert len(repo.rows) == 1  # same row, updated in place


@pytest.mark.asyncio
async def test_save_persists_keywords_and_requires_evaluation():
    svc, repo = _svc()
    saved = await svc.save(
        tenant_id=TENANT,
        offer_id=OFFER,
        fields={"keywords": ["botox", "arrugas"], "requires_evaluation": True},
    )
    assert saved.keywords == ["botox", "arrugas"]
    assert saved.requires_evaluation is True


@pytest.mark.asyncio
async def test_save_ignores_unknown_fields():
    svc, _ = _svc()
    saved = await svc.save(
        tenant_id=TENANT,
        offer_id=OFFER,
        fields={"candidate_ideal": "ok", "not_a_field": "drop me"},
    )
    assert saved.candidate_ideal == "ok"
    assert not hasattr(saved, "not_a_field")


@pytest.mark.asyncio
async def test_get_after_save_returns_persisted():
    svc, _ = _svc()
    await svc.save(tenant_id=TENANT, offer_id=OFFER, fields={"promos": "2x1 marzo"})
    got = await svc.get(tenant_id=TENANT, offer_id=OFFER)
    assert got is not None
    assert got.promos == "2x1 marzo"
