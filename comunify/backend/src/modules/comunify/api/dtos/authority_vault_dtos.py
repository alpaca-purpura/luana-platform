"""Authority Vault API DTOs — Pydantic v2.

Per 03-arch-be.md § 7 + § 6.3 + Tessl pii-sanitisation.md.
Kinds: credentials | case_studies | press_mentions | awards.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VaultItemResponse(BaseModel):
    """Single authority vault item — base response shape."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str
    title: str
    content: dict
    url_status: str | None = None  # validated | unvalidated | unreachable
    created_at: datetime
    updated_at: datetime


class AuthorityVaultResponse(BaseModel):
    """GET /authority-vault — all subsections for tenant."""

    model_config = ConfigDict(from_attributes=True)

    credentials: list[VaultItemResponse] = Field(default_factory=list)
    case_studies: list[VaultItemResponse] = Field(default_factory=list)
    press_mentions: list[VaultItemResponse] = Field(default_factory=list)
    awards: list[VaultItemResponse] = Field(default_factory=list)


# ── Credentials ───────────────────────────────────────────────────────────────


class AddCredentialRequest(BaseModel):
    """POST /authority-vault/credentials — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    title: str = Field(..., min_length=1, max_length=200)
    content: dict = Field(default_factory=dict, description="Credential details JSONB")
    url: str | None = Field(None, description="Optional credential URL for validation")


class CredentialResponse(BaseModel):
    """POST /authority-vault/credentials — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str = "credentials"
    title: str
    url_status: str | None = None
    created_at: datetime


# ── Case studies ──────────────────────────────────────────────────────────────


class AddCaseStudyRequest(BaseModel):
    """POST /authority-vault/case-studies — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    title: str = Field(..., min_length=1, max_length=200)
    content: dict = Field(default_factory=dict)
    url: str | None = None


class CaseStudyResponse(BaseModel):
    """POST /authority-vault/case-studies — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str = "case_studies"
    title: str
    url_status: str | None = None
    created_at: datetime


# ── Press mentions ────────────────────────────────────────────────────────────


class AddPressMentionRequest(BaseModel):
    """POST /authority-vault/press-mentions — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    title: str = Field(..., min_length=1, max_length=200)
    content: dict = Field(default_factory=dict)
    url: str | None = None


class PressMentionResponse(BaseModel):
    """POST /authority-vault/press-mentions — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str = "press_mentions"
    title: str
    url_status: str | None = None
    created_at: datetime


# ── Awards ────────────────────────────────────────────────────────────────────


class AddAwardRequest(BaseModel):
    """POST /authority-vault/awards — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    title: str = Field(..., min_length=1, max_length=200)
    content: dict = Field(default_factory=dict)
    url: str | None = None


class AwardResponse(BaseModel):
    """POST /authority-vault/awards — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str = "awards"
    title: str
    url_status: str | None = None
    created_at: datetime


# ── URL validation ────────────────────────────────────────────────────────────


class ValidateUrlRequest(BaseModel):
    """POST /authority-vault/validate-url — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    url: str = Field(..., min_length=1, description="URL to validate reachability")


class ValidateUrlResponse(BaseModel):
    """POST /authority-vault/validate-url — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    url: str
    reachable: bool
    status: str  # validated | unreachable | timeout
