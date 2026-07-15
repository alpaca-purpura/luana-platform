# 03-arch-be · Abel → ICP & buyer (Business backend)

> Surface: `nicolify/backend/src/modules/nicolify/abel/` (NET-NEW brand-extension). Owner builder: **`builder-backend`** (Sonnet). Auditor: **`auditor-backend`** (Opus). Async-first (`AsyncSession`). Consolidado: `03-arch.md`.
>
> **NO toca `core/luana-core-*/src/`.** Consume engine por referencia (esquema BuyerPersona) + import (`sanitize_payload`, `utc_now`, `BaseEntity`, `TenantLocale`).

## 0. Module layout (Inside-Out DDD · ADR-nicolify-001 §6)

```
nicolify/backend/src/modules/nicolify/abel/
├── __init__.py
├── domain/
│   ├── icp.py                 # Icp(BaseEntity) + enums IcpStatus, IcpOrigin
│   ├── buyer.py              # Buyer(BaseEntity) + enum DecisionPower
│   └── exceptions.py        # IcpLabelConflict, IcpMinimumNotMet, BuyerNotInIcp
├── infrastructure/
│   ├── models/
│   │   ├── icp_model.py
│   │   ├── buyer_model.py
│   │   └── growth_studio_event_model.py
│   └── repositories/
│       ├── icp_repository.py        # IcpRepository(ABC) + SqlAlchemyIcpRepository (async)
│       └── buyer_repository.py
├── application/
│   ├── dtos/
│   │   ├── icp_dtos.py
│   │   ├── buyer_dtos.py
│   │   └── extraction_dtos.py
│   ├── services/
│   │   ├── icp_service.py
│   │   ├── buyer_service.py
│   │   └── icp_extraction_service.py   # orquesta extraction/ (ver 03-arch-agentic.md)
│   └── telemetry/
│       └── growth_studio_emitter.py    # nicolify_growth_studio_event (best-effort)
├── extraction/                 # ← AGENTIC surface (03-arch-agentic.md · builder-agentic)
└── api/
    └── router.py              # /api/v1/abel
```

`migrations` (alembic): `nicolify/backend/alembic/versions/002_abel_icp_buyer.py`.

## 1. Domain Entities

```python
# domain/icp.py
from enum import StrEnum
from decimal import Decimal
from datetime import datetime
from uuid import UUID
from luana_core_platform.domain.base_entity import BaseEntity  # ConfigDict(from_attributes=True)
from pydantic import Field

class IcpStatus(StrEnum):
    BORRADOR = "borrador"
    LISTO = "listo"

class IcpOrigin(StrEnum):
    MANUAL = "manual"
    DRAFT = "draft"        # extraído por Abel (draft-first)

class Icp(BaseEntity):
    id: UUID
    tenant_id: UUID                      # RN-1 mandatorio
    label: str                           # RN-7 único por tenant
    description: str | None = None
    vertical: str | None = None
    company_size: str | None = None
    geo: str | None = None
    business_model: str | None = None
    avg_ticket: Decimal | None = None    # RN-11 — no convertir on-write
    avg_ticket_currency: str | None = None
    sales_cycle: str | None = None
    main_pain: str | None = None         # consumer: brenda + christian
    sales_angle: str | None = None       # consumer: brenda + christian (absorbe "ángulos")
    signals: list[str] = Field(default_factory=list)      # consumer: christian
    anti_pattern: str | None = None      # consumer: christian
    status: IcpStatus = IcpStatus.BORRADOR
    origin: IcpOrigin = IcpOrigin.MANUAL
    created_at: datetime | None = None
    updated_at: datetime | None = None
    deleted_at: datetime | None = None   # soft delete mandatorio
```

```python
# domain/buyer.py
class DecisionPower(StrEnum):
    DECISOR_ECONOMICO = "decisor_economico"
    CHAMPION = "champion"
    INFLUENCER_TECNICO = "influencer_tecnico"
    APROBADOR = "aprobador"
    USUARIO = "usuario"
    BLOQUEADOR = "bloqueador"

class Buyer(BaseEntity):
    id: UUID
    tenant_id: UUID                      # RN-1
    icp_id: UUID                         # RN-5 FK → Icp (no huérfanos)
    name: str
    role: str | None = None
    decision_power: DecisionPower | None = None
    is_primary: bool = False             # RN-6 ≤1 true por icp_id
    # JSONB — mismos slugs que el field-contract engine BuyerPersona (consume-by-reference)
    demographics: dict = Field(default_factory=dict)      # age_range, location, occupation, income
    psychographics: dict = Field(default_factory=dict)    # values, aspirations, lifestyle, success_metric
    pain_points: list[dict] = Field(default_factory=list)
    desires: list[dict] = Field(default_factory=list)
    objections: list[dict] = Field(default_factory=list)
    buyer_journey: dict = Field(default_factory=dict)     # awareness, consideration, decision
    purchase_triggers: list[str] = Field(default_factory=list)
    preferred_channels: list[dict] = Field(default_factory=list)  # extiende engine (B2B)
    created_at: datetime | None = None
    updated_at: datetime | None = None
    deleted_at: datetime | None = None
```

## 2. SQLAlchemy 2.0 Models

```python
# infrastructure/models/icp_model.py  (SQLA 2.0 mapped_column · tabla abel_icps)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, Numeric, DateTime, Index, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID, JSONB
# Base = el declarative Base de nicolify (src.db / modules base)

class IcpModel(Base):
    __tablename__ = "abel_icps"
    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    vertical: Mapped[str | None] = mapped_column(String(120))
    company_size: Mapped[str | None] = mapped_column(String(120))
    geo: Mapped[str | None] = mapped_column(String(160))
    business_model: Mapped[str | None] = mapped_column(String(200))
    avg_ticket: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    avg_ticket_currency: Mapped[str | None] = mapped_column(String(3))
    sales_cycle: Mapped[str | None] = mapped_column(String(120))
    main_pain: Mapped[str | None] = mapped_column(Text)
    sales_angle: Mapped[str | None] = mapped_column(Text)
    signals: Mapped[list] = mapped_column(JSONB, default=list, server_default=text("'[]'::jsonb"))
    anti_pattern: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default=text("'borrador'"))
    origin: Mapped[str] = mapped_column(String(16), nullable=False, server_default=text("'manual'"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    __table_args__ = (
        Index("ix_abel_icps_tenant", "tenant_id"),
        # RN-7 unique label per tenant (case-insensitive, soft-delete aware) → migración raw SQL
    )

# abel_buyers: id, tenant_id (idx), icp_id (idx FK), name, role, decision_power, is_primary,
#   demographics/psychographics/pain_points/desires/objections/buyer_journey/purchase_triggers/preferred_channels (JSONB),
#   timestamps + deleted_at. Index (tenant_id, icp_id).
# nicolify_growth_studio_event: id, tenant_id (idx), account_id (idx, nullable), user_id (nullable),
#   event_name, props JSONB, occurred_at. (account_id NO clinic_id — ADR-nicolify-001 §8)
```

## 3. Pydantic v2 DTOs (todos `ConfigDict(from_attributes=True)`)

```python
# application/dtos/icp_dtos.py
class IcpCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    label: str
    description: str | None = None
    vertical: str | None = None
    # ... (todos opcionales salvo label · origin se setea server-side)

class IcpPatch(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    label: str | None = None
    # ... todos opcionales (autosave por campo · RN-8 guardar nunca bloquea)
    avg_ticket: Decimal | None = None
    avg_ticket_currency: str | None = None

class IcpResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    label: str
    description: str | None
    vertical: str | None
    company_size: str | None
    geo: str | None
    business_model: str | None
    avg_ticket: Decimal | None
    avg_ticket_currency: str | None      # RN-11 — moneda capturada, sin convertir
    sales_cycle: str | None
    main_pain: str | None
    sales_angle: str | None
    signals: list[str]
    anti_pattern: str | None
    status: IcpStatus
    origin: IcpOrigin
    buyer_count: int                     # derivado (count buyers no-deleted)
    created_at: datetime | None
    updated_at: datetime | None
    # NOTA PII: no expone tenant_id ni la semilla cruda del intake.

class IcpListItem(BaseModel):            # card de la lista (master)
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    label: str
    vertical: str | None
    status: IcpStatus
    buyer_count: int

class IcpMarkReadyResponse(BaseModel):   # 200 ok | 422 con missing[]
    model_config = ConfigDict(from_attributes=True)
    status: IcpStatus
    missing: list[str] = Field(default_factory=list)  # RN-8 qué falta

# buyer_dtos.py: BuyerCreate(name, role?, decision_power?), BuyerPatch(...todos opcionales...),
#   BuyerResponse(id, icp_id, name, role, decision_power, is_primary, demographics, psychographics,
#   pain_points, desires, objections, buyer_journey, purchase_triggers, preferred_channels, timestamps)
# extraction_dtos.py: IcpExtractRequest(seed_type: Literal["url","file","text"], payload: str | None, file_ref?),
#   IcpExtractJobResponse(job_id: UUID, status: Literal["analizando","done","failed"], icp_id: UUID | None)
```

> Sin `Any` salvo en JSONB flexibles (`dict[str, Any]` / `list[dict[str, Any]]`), idéntico al engine BuyerPersona DTO (precedente aceptado).

## 4. API Routes (prefijo `/api/v1/abel` · Bearer + `X-Tenant-ID` · `response_model=` en cada una)

| Method | Path | response_model | Description |
|---|---|---|---|
| GET | `/icp` | `list[IcpListItem]` | lista de ICPs del tenant (master) |
| POST | `/icp` | `IcpResponse` | crear ICP (manual). 409 si label dup (RN-7) |
| GET | `/icp/{icp_id}` | `IcpResponse` | detalle ICP. 404 cross-tenant (RN-1) |
| PATCH | `/icp/{icp_id}` | `IcpResponse` | autosave por campo (RN-8 nunca bloquea) |
| POST | `/icp/{icp_id}/mark-ready` | `IcpMarkReadyResponse` | RN-8 valida mínimo → 200 listo / 422 missing[] |
| DELETE | `/icp/{icp_id}` | — (204) | soft delete |
| GET | `/icp/{icp_id}/buyers` | `list[BuyerResponse]` | buyers del ICP (scoped icp_id ∧ tenant_id) |
| POST | `/icp/{icp_id}/buyers` | `BuyerResponse` | + buyer (RN-5 cuelga del ICP) |
| GET | `/buyer/{buyer_id}` | `BuyerResponse` | detalle buyer. 404 cross-tenant |
| PATCH | `/buyer/{buyer_id}` | `BuyerResponse` | autosave buyer |
| POST | `/buyer/{buyer_id}/set-primary` | `BuyerResponse` | RN-6 demota el anterior (1 primary/ICP) |
| DELETE | `/buyer/{buyer_id}` | — (204) | soft delete |
| POST | `/icp/extract` | `IcpExtractJobResponse` | draft-first async (ver 03-arch-agentic.md) |
| GET | `/icp/extract/{job_id}` | `IcpExtractJobResponse` | poll del job ("analizando"→"done"/"failed") |

- `redirect_slashes=False` ya está app-level (`test_main_app_config`). Dual `@router.get("")` / `@router.get("/", include_in_schema=False)` igual que el engine pattern.
- Auth: `Depends(get_current_user)` + `Depends(get_tenant_id)` (los providers async de nicolify, Clerk JWT). NO el `get_current_user` engine (boundary).
- **Idempotency POST `/icp`:** natural key `(tenant_id, lower(label))` → unique index maneja la carrera (SC-race-unique: 1 crea, otro 409). POST `/icp/extract`: `job_id` dedup (best-effort).

## 5. Repository Interfaces (async ABC · todo método con `tenant_id` · RN-1)

```python
class IcpRepository(ABC):
    @abstractmethod
    async def create(self, tenant_id: UUID, icp: Icp) -> Icp: ...
    @abstractmethod
    async def get_by_id(self, tenant_id: UUID, icp_id: UUID) -> Icp | None: ...
    @abstractmethod
    async def list_by_tenant(self, tenant_id: UUID) -> list[Icp]: ...
    @abstractmethod
    async def update(self, tenant_id: UUID, icp_id: UUID, patch: dict) -> Icp | None: ...
    @abstractmethod
    async def soft_delete(self, tenant_id: UUID, icp_id: UUID) -> bool: ...
    @abstractmethod
    async def label_exists(self, tenant_id: UUID, label: str, exclude_id: UUID | None = None) -> bool: ...

class BuyerRepository(ABC):
    async def create(self, tenant_id: UUID, buyer: Buyer) -> Buyer
    async def get_by_id(self, tenant_id: UUID, buyer_id: UUID) -> Buyer | None    # filtra tenant_id
    async def list_by_icp(self, tenant_id: UUID, icp_id: UUID) -> list[Buyer]     # filtra tenant_id ∧ icp_id
    async def update(self, tenant_id: UUID, buyer_id: UUID, patch: dict) -> Buyer | None
    async def soft_delete(self, tenant_id: UUID, buyer_id: UUID) -> bool
    async def clear_primary(self, tenant_id: UUID, icp_id: UUID) -> None          # RN-6
```

Implementación `select(Model).where(Model.tenant_id == tenant_id, Model.deleted_at.is_(None))`. SQLA 2.0 async (`await session.execute(...)`). NUNCA `session.query()`.

## 6. Application Services (async · transaction boundaries · eventos)

- **`IcpService`**:
  - `create(tenant_id, dto)` → si `label_exists` → raise `IcpLabelConflict` (→ 409). origin=manual.
  - `patch(tenant_id, icp_id, dto)` → autosave; si toca `label` re-chequea unicidad.
  - `mark_ready(tenant_id, icp_id)` → **RN-8** valida mínimo: `vertical ∧ main_pain ∧ sales_angle ∧ ≥1 buyer con role`. Falta algo → `IcpMarkReadyResponse(status=borrador, missing=[...])` (NO raise — devuelve 422-shaped). Cumple → `status=listo` + emite telemetría `abel_icp_marked_ready` (icp_id hasheado).
  - `delete` → soft.
- **`BuyerService`**:
  - `create(tenant_id, icp_id, dto)` → verifica que el ICP existe y es del tenant (RN-5). emite `abel_buyer_added`.
  - `set_primary(tenant_id, buyer_id)` → `clear_primary(icp_id)` + set (RN-6, una transacción).
- **`IcpExtractionService`** (orquesta `extraction/` · ver 03-arch-agentic.md):
  - `start(tenant_id, dto)` → sanitiza la semilla (`sanitize_payload` + delimiter wrap RN-9) → lanza job async → devuelve `job_id` + `status=analizando`. Telemetría `abel_icp_intake_started(seed_type)`.
  - on success → persiste ICP(s)+buyer(s) brand-local `origin=draft, status=borrador` (RN-3) + **audit row** `(tenant_id, agent=abel, action=propose_icp_draft, ...)` (RN-10) + telemetría `abel_icp_draft_proposed(icp_count, buyer_count)`. Invalida React Query key client-side via job poll.
  - timeout/5xx → `status=failed` (SC-network: FE muestra reintento + fallback manual).
- **Telemetría** (`growth_studio_emitter`): patrón vitalia `GrowthStudioEmitter.emit_event` re-temizado a nicolify (`account_id` no `clinic_id`). best-effort `try/except + structlog` (no rompe la respuesta primaria). props sin PII (montos bucketeados, ids hasheados).

## 7. Migration (002_abel_icp_buyer.py · raw SQL idempotente)

```python
def upgrade():
    op.execute("CREATE TABLE IF NOT EXISTS abel_icps (id UUID PRIMARY KEY, tenant_id UUID NOT NULL, label VARCHAR(160) NOT NULL, ... status VARCHAR(16) NOT NULL DEFAULT 'borrador', origin VARCHAR(16) NOT NULL DEFAULT 'manual', signals JSONB NOT NULL DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_abel_icps_tenant ON abel_icps (tenant_id)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_abel_icps_tenant_label ON abel_icps (tenant_id, lower(label)) WHERE deleted_at IS NULL")  # RN-7
    op.execute("CREATE TABLE IF NOT EXISTS abel_buyers (id UUID PRIMARY KEY, tenant_id UUID NOT NULL, icp_id UUID NOT NULL, name VARCHAR(200) NOT NULL, role VARCHAR(160), decision_power VARCHAR(32), is_primary BOOLEAN NOT NULL DEFAULT false, demographics JSONB NOT NULL DEFAULT '{}'::jsonb, ... created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_abel_buyers_tenant_icp ON abel_buyers (tenant_id, icp_id)")
    # partial unique 1-primary/icp opcional: CREATE UNIQUE INDEX ... ON abel_buyers (icp_id) WHERE is_primary AND deleted_at IS NULL  (RN-6 a nivel DB; o enforce en service)
    op.execute("CREATE TABLE IF NOT EXISTS nicolify_growth_studio_event (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL, account_id UUID, user_id UUID, event_name VARCHAR(80) NOT NULL, props JSONB NOT NULL DEFAULT '{}'::jsonb, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now())")
    op.execute("CREATE INDEX IF NOT EXISTS ix_nicolify_gse_tenant ON nicolify_growth_studio_event (tenant_id, occurred_at)")
```

**Prod-clone test:**
```bash
WS=$(git rev-parse --show-toplevel)
createdb migration_test && pg_dump --schema-only $PROD_DB | psql migration_test
${WS}/.venv/bin/alembic -c nicolify/backend/alembic.ini stamp 001_nicolify_iam_baseline
${WS}/.venv/bin/alembic -c nicolify/backend/alembic.ini upgrade head
dropdb migration_test
```

## 8. Registration (CONN · notarized)

`nicolify/backend/src/main.py`:
```python
from src.modules.nicolify.abel.api.router import router as abel_router
app.include_router(abel_router, prefix="/api/v1/abel", tags=["abel"])
```

## 9. Tests (TDD RED-first · ver 04-validators §test_construction_plan)

`nicolify/backend/tests/modules/nicolify/abel/`:
- `domain/` — `Icp`/`Buyer` invariants (status default borrador; FK icp_id required).
- `infrastructure/` — repos tenant-scoped (cross-tenant get → None), unique label, clear_primary.
- `application/` — `mark_ready` missing[] (RN-8), `set_primary` (RN-6), label conflict (RN-7), extraction audit row (RN-10).
- `api/` — response_model shape, Bearer/X-Tenant-ID required, cross-tenant 404 (SC-adversarial-tenant), dup label 409 (SC-race-unique), concurrent patch (SC-edge-concurrent — last-write o merge por campo).
- `architecture/` — NEW `test_growth_studio_event_no_pii.py` (props sin email/phone/nombre real; montos bucketeados).

Comando: `cd nicolify/backend && ${WS}/.venv/bin/pytest tests/modules/nicolify/abel/ tests/architecture/ -v`
