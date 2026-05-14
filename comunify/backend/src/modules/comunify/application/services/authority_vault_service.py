"""AuthorityVaultService — CRUD subsections + async URL validation best-effort.

Per 03-arch-be.md § 9.6 + D1/D19:

  add_item(request) → VaultItemResponse
    1. Persist ComunifyAuthorityVaultItemModel with kind + title + content.
    2. If URL present: async HTTP HEAD via injected UrlValidatorProtocol (timeout 5s).
    3. On URL validation failure: log warning + set url_status='unvalidated' — NEVER raise.

  list_all() → list[VaultItemResponse]
    Returns all vault items (all kinds) for this tenant.

  delete_item(item_id) → None
    Soft-deletes the item. Raises AuthorityVaultItemNotFoundError if not found.

Kinds: credentials | case_studies | press_mentions | awards

D1: AuthorityVaultService receives vault_repo + url_validator via DI.
D19: URL validation async best-effort — timeout 5s, fallback url_status='unvalidated'.

Anti-duplication (anti-duplication.md):
  grep cross-codebase found no existing AuthorityVaultService — NEW.

References:
  - 03-arch-be.md § 9.6
  - 01-spec.md § 3.8 (authority vault)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Protocol

import structlog
from pydantic import BaseModel, ConfigDict, Field

from src.modules.comunify.infrastructure.models.authority_vault_item_model import (
    ComunifyAuthorityVaultItemModel,
)

logger = structlog.get_logger()

_VALID_KINDS = frozenset({"credentials", "case_studies", "press_mentions", "awards"})


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


# ── Exceptions ─────────────────────────────────────────────────────────────


class AuthorityVaultItemNotFoundError(Exception):
    """Raised when an authority vault item is not found for this tenant."""

    def __init__(self, item_id: uuid.UUID) -> None:
        self.item_id = item_id
        super().__init__(f"Authority vault item {item_id} not found for this tenant")


# ── Protocol (URL validator — injected, best-effort) ──────────────────────


class UrlValidatorProtocol(Protocol):
    """Injected async URL validator — performs HTTP HEAD request.

    Callers inject a real httpx-based implementation in production.
    In tests: AsyncMock returning True/False or raising Exception.

    D19: timeout 5s, graceful degradation per tessl__graceful-degradation.
    """

    async def check_reachable(self, url: str) -> bool:
        """Check if URL is reachable via HTTP HEAD. Returns True if 2xx/3xx."""
        ...


# ── DTOs ───────────────────────────────────────────────────────────────────


class AddVaultItemRequest(BaseModel):
    """Input DTO for add_item."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    kind: str = Field(..., description="credentials | case_studies | press_mentions | awards")
    title: str = Field(..., min_length=1, max_length=255)
    content: dict = Field(default_factory=dict)
    url: str | None = None
    display_order: int = 0


class VaultItemResponse(BaseModel):
    """Output DTO for vault item operations.

    PII allowlist: no phone/email/tax_id exposed.
    """

    model_config = ConfigDict(from_attributes=True)

    item_id: uuid.UUID
    kind: str
    title: str
    url: str | None = None
    url_status: str = "not_applicable"  # not_applicable | validated | unvalidated
    display_order: int = 0
    created_at: datetime


# ── Service ────────────────────────────────────────────────────────────────


class AuthorityVaultService:
    """Authority vault CRUD — credentials / case_studies / press_mentions / awards.

    URL validation is async best-effort: validator exceptions are caught,
    logged with structlog warning, and item is saved with url_status='unvalidated'.

    Usage (D1 — receive deps via DI):
        svc = AuthorityVaultService(
            vault_repo=AuthorityVaultRepository(session=db, tenant_id=tid),
            url_validator=url_validator_instance,
            tenant_id=tid,
        )
    """

    def __init__(
        self,
        *,
        vault_repo: Any,
        url_validator: UrlValidatorProtocol,
        tenant_id: uuid.UUID,
    ) -> None:
        self._vault_repo = vault_repo
        self._url_validator = url_validator
        self._tenant_id = tenant_id

    async def add_item(self, request: AddVaultItemRequest) -> VaultItemResponse:
        """Add a new authority vault item with async best-effort URL validation.

        Algorithm (per 03-arch-be.md § 9.6):
        1. Persist ComunifyAuthorityVaultItemModel.
        2. If URL present: call url_validator.check_reachable() (timeout 5s).
        3. On validator exception: log warning + url_status='unvalidated' (never raise).
        4. On validator success: url_status='validated' if reachable, else 'unvalidated'.

        Args:
            request: AddVaultItemRequest with kind + title + content + optional URL.

        Returns:
            VaultItemResponse with item_id + url_status.
        """
        now = _utc_now()
        item_id = uuid.uuid4()

        item_model = ComunifyAuthorityVaultItemModel(
            id=item_id,
            tenant_id=self._tenant_id,
            kind=request.kind,
            title=request.title,
            content=request.content,
            url=request.url,
            display_order=request.display_order,
            created_at=now,
            updated_at=now,
        )
        await self._vault_repo.save(item_model)

        logger.info(
            "authority_vault_item_added",
            tenant_id=str(self._tenant_id),
            item_id=str(item_id),
            kind=request.kind,
            has_url=request.url is not None,
        )

        # ── Async best-effort URL validation ──────────────────────────────
        url_status = "not_applicable"
        if request.url:
            url_status = await self._validate_url_best_effort(request.url)

        return VaultItemResponse(
            item_id=item_id,
            kind=request.kind,
            title=request.title,
            url=request.url,
            url_status=url_status,
            display_order=request.display_order,
            created_at=now,
        )

    async def _validate_url_best_effort(self, url: str) -> str:
        """Perform async URL validation — best-effort, NEVER raises.

        D19: timeout handled in UrlValidatorProtocol implementation (5s default).

        Returns:
            'validated' if reachable, 'unvalidated' if validation fails for any reason.
        """
        try:
            is_reachable = await self._url_validator.check_reachable(url)
            status = "validated" if is_reachable else "unvalidated"
            logger.info(
                "authority_vault_url_validation_result",
                tenant_id=str(self._tenant_id),
                url=url,
                status=status,
            )
            return status
        except Exception as exc:
            logger.warning(
                "authority_vault_url_validation_failed",
                tenant_id=str(self._tenant_id),
                url=url,
                error=str(exc),
            )
            return "unvalidated"

    async def list_all(self) -> list[VaultItemResponse]:
        """Return all authority vault items for this tenant (across all kinds).

        Returns:
            List of VaultItemResponse ordered by kind + display_order.
        """
        items = await self._vault_repo.list_all()
        return [
            VaultItemResponse(
                item_id=item.id,
                kind=item.kind,
                title=item.title,
                url=item.url,
                url_status="not_applicable" if not item.url else "unvalidated",
                display_order=item.display_order,
                created_at=item.created_at,
            )
            for item in items
        ]

    async def list_by_kind(self, kind: str) -> list[VaultItemResponse]:
        """Return vault items filtered by kind for this tenant.

        Args:
            kind: One of credentials | case_studies | press_mentions | awards.

        Returns:
            List of VaultItemResponse for the specified kind.
        """
        items = await self._vault_repo.list_by_kind(kind)
        return [
            VaultItemResponse(
                item_id=item.id,
                kind=item.kind,
                title=item.title,
                url=item.url,
                url_status="not_applicable" if not item.url else "unvalidated",
                display_order=item.display_order,
                created_at=item.created_at,
            )
            for item in items
        ]

    async def delete_item(self, item_id: uuid.UUID) -> None:
        """Soft-delete an authority vault item.

        Args:
            item_id: UUID of the item to delete.

        Raises:
            AuthorityVaultItemNotFoundError: If item not found for this tenant.
        """
        existing = await self._vault_repo.get_by_id(item_id)
        if existing is None:
            raise AuthorityVaultItemNotFoundError(item_id)

        await self._vault_repo.soft_delete(item_id)

        logger.info(
            "authority_vault_item_deleted",
            tenant_id=str(self._tenant_id),
            item_id=str(item_id),
            kind=existing.kind,
        )
