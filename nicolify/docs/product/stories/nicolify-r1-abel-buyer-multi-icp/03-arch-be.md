# 03-arch-be · Abel → Buyer multi-ICP (Business backend)

> Surface: `nicolify/backend/src/modules/nicolify/abel/` (EXTEND — schema rewrite of the shipped `abel/icp-buyer` cap). Owner builder: **`builder-backend`** (workhorse). Auditor: **`auditor-backend`** (flagship). Async-first (`AsyncSession`). Consolidado: `03-arch.md`.
>
> **NO toca `core/luana-core-*/src/`.** Consume engine por referencia (esquema `BuyerPersona`) + import (`Base`, `BaseEntity`). 100% brand-extension.
>
> **story_type: bugfix (extend).** Extiende el cap `abel/icp-buyer` (parent `nicolify-r1-abel-icp-buyer` YA `done`/mergeado — migración 002 shipped, filas reales posibles). Este arch reescribe la relación buyer↔ICP de FK 1:1 dura a many-to-many join table.

---

## 0. Prior art audit (NO-NEW-LAYER · Path B self-run 2026-07-15)

Sin `CONTEXT-BRIEF.md` (prompt entregó paths directo) → self-run contra código real:

| Sistema candidato | Path real | Decisión |
|---|---|---|
| `abel` module (cap `abel/icp-buyer`) | `nicolify/backend/src/modules/nicolify/abel/` | **EXTEND** — es el hogar del cap. La join table + join repo son tablas/repos de dominio DENTRO del módulo, NO una capa de infra nueva. |
| Engine `BuyerPersona` | `core/luana-core-brand-studio` | **CONSUME por referencia** (sin cambio) — el parent ya lo consume (field-contract compatible). Esta story NO toca el engine. |
| Composite-PK join table pattern | `nicolify/backend/alembic/versions/001_nicolify_iam_baseline.py::user_tenants` (+ espejos vitalia/comunify) | **PATRÓN DE LA CASA** — precedente N:M con PK compuesta. `abel_icp_buyers` lo sigue. No existe abstracción genérica "association table" en `core/` que debiera heredarse (los campos de relación `is_primary`/`attached_at` son domain-specific). |
| Cross-brand mirror | `grep buyer\|icp_ vitalia/ comunify/` → 0 hits | **NO mirror** — buyer/ICP es exclusivo nicolify/abel B2B. Sin lift candidate. |

**Veredicto:** EXTEND el módulo `abel` brand-local. Cero engine change, cero mirror cross-brand, cero capa nueva. Coincide con `checkpoint.md § Prior art scan` + `01-spec.md § Prior art applied`.

---

## 1. Schema rewrite — de FK 1:1 dura a join table

### Estado ACTUAL (shipped · migración 002)
- `abel_buyers` tiene `icp_id UUID NOT NULL` + `is_primary BOOLEAN` (propiedad del buyer).
- `ix_abel_buyers_tenant_icp` (tenant_id, icp_id) · `uq_abel_buyers_icp_primary` partial unique (icp_id) WHERE is_primary AND deleted_at IS NULL.

### Estado TARGET
- Nueva `abel_icp_buyers` (join): `is_primary`/`attached_at` son propiedad del **par** (icp, buyer).
- `abel_buyers` PIERDE `icp_id` + `is_primary` (queda buyer ICP-agnóstico).

### Migración `003_abel_buyer_multi_icp.py` (raw SQL idempotente · backfill ANTES de drop)

```python
"""003_abel_buyer_multi_icp — abel_icp_buyers join table + drop 1:1 columns.

Idempotent raw SQL (op.execute only — arch gate test_migrations_idempotent).
Backfill BEFORE drop; guarded by column-existence so a 2nd run is a no-op.

Revision ID: 003_abel_multi_icp
Revises: 002_abel
Story: nicolify-r1-abel-buyer-multi-icp
Cap: abel/icp-buyer
"""
from __future__ import annotations
from alembic import op

revision = "003_abel_multi_icp"
down_revision = "002_abel"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1 · join table (composite PK, tenant_id denormalizado → RN-1 sin join extra)
    op.execute("""
        CREATE TABLE IF NOT EXISTS abel_icp_buyers (
            icp_id      UUID NOT NULL,
            buyer_id    UUID NOT NULL,
            tenant_id   UUID NOT NULL,
            is_primary  BOOLEAN NOT NULL DEFAULT false,
            attached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (icp_id, buyer_id)
        )
    """)
    # reverse lookup (ICPs de un buyer) + scope tenant para el directory GET /buyers
    op.execute("CREATE INDEX IF NOT EXISTS ix_abel_icp_buyers_buyer ON abel_icp_buyers (tenant_id, buyer_id)")
    # RN-6 · ≤1 primary por ICP (vive en la relación ahora)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_abel_icp_buyers_primary ON abel_icp_buyers (icp_id) WHERE is_primary")

    # 2 · backfill 1:1 → primer attach. Idempotente: el guard de columna hace
    #     que un 2º run (con las columnas ya dropeadas) sea no-op.
    #     El viejo uq_abel_buyers_icp_primary garantiza ≤1 primary/icp entre vivos
    #     → el backfill nunca viola ux_abel_icp_buyers_primary.
    #
    #     ★ v2 (RN-10/RN-11): SOLO pares con ICP VIVO. El delete de ICP pre-v2 no
    #     cascadeaba → pueden existir buyers vivos apuntando a un ICP soft-deleted
    #     (legacy). Backfillearlos crearía joins fantasma (el mismo bug que RN-11
    #     cierra hacia adelante). Tras el backfill, todo buyer vivo que quedó en
    #     0 attachments (su único ICP estaba muerto) se soft-deletea en el MISMO
    #     bloque (zombie cerrado — RN-5). Ambos pasos dentro del guard de columna
    #     → 2º run no-op, no re-borra.
    op.execute("""
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'abel_buyers' AND column_name = 'icp_id'
          ) THEN
            INSERT INTO abel_icp_buyers (icp_id, buyer_id, tenant_id, is_primary, attached_at)
            SELECT b.icp_id, b.id, b.tenant_id, b.is_primary, b.created_at
            FROM abel_buyers b
            JOIN abel_icps i ON i.id = b.icp_id AND i.deleted_at IS NULL
            WHERE b.icp_id IS NOT NULL AND b.deleted_at IS NULL
            ON CONFLICT (icp_id, buyer_id) DO NOTHING;

            -- zombies legacy: buyer vivo cuyo único ICP estaba soft-deleted → 0 joins → cerrar (RN-5)
            UPDATE abel_buyers b
            SET deleted_at = now()
            WHERE b.deleted_at IS NULL
              AND NOT EXISTS (SELECT 1 FROM abel_icp_buyers j WHERE j.buyer_id = b.id);
          END IF;
        END $$;
    """)

    # 3 · índice tenant-only para el directory (GET /buyers filtra tenant_id ∧ deleted_at)
    op.execute("CREATE INDEX IF NOT EXISTS ix_abel_buyers_tenant ON abel_buyers (tenant_id)")

    # 4 · drop columnas viejas + índices dependientes (idempotente).
    #     DROP COLUMN cascadea ix_abel_buyers_tenant_icp + uq_abel_buyers_icp_primary;
    #     el DROP INDEX IF EXISTS explícito queda por claridad/idempotencia.
    op.execute("DROP INDEX IF EXISTS uq_abel_buyers_icp_primary")
    op.execute("DROP INDEX IF EXISTS ix_abel_buyers_tenant_icp")
    op.execute("ALTER TABLE abel_buyers DROP COLUMN IF EXISTS is_primary")
    op.execute("ALTER TABLE abel_buyers DROP COLUMN IF EXISTS icp_id")


def downgrade() -> None:
    # best-effort: re-agrega columnas (reconstrucción de datos = primer attach por buyer, no exacta)
    op.execute("ALTER TABLE abel_buyers ADD COLUMN IF NOT EXISTS icp_id UUID")
    op.execute("ALTER TABLE abel_buyers ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false")
    op.execute("DROP TABLE IF EXISTS abel_icp_buyers")
```

**Por qué join table y no array/JSON:** `is_primary` es propiedad del par (icp, buyer) — el mismo buyer puede ser primary en un ICP y no-primary en otro. Solo una join la modela limpio.

**Prod-clone test (SC-8 · el gate de mayor riesgo):**
```bash
WS=$(git rev-parse --show-toplevel)
createdb migration_test && pg_dump --schema-only $PROD_DB | psql migration_test
# sembrar ANTES de migrar (v2 — 3 clases de filas):
#   N buyers vivos con ICP vivo (algunas is_primary=true)
#   M buyers vivos con ICP soft-deleted (legacy zombie)
#   K buyers ya soft-deleted (no deben backfillearse)
${WS}/.venv/bin/alembic -c nicolify/backend/alembic.ini stamp 002_abel
${WS}/.venv/bin/alembic -c nicolify/backend/alembic.ini upgrade head
# asserts (v2):
#   count(abel_icp_buyers) == N                      (solo pares sanos)
#   0 joins hacia ICPs con deleted_at NOT NULL       (cero fantasma)
#   los M zombies quedaron deleted_at NOT NULL       (cerrados)
#   is_primary original preservado en los N
${WS}/.venv/bin/alembic -c nicolify/backend/alembic.ini upgrade head   # 2º run = no-op (idempotencia, no re-borra)
dropdb migration_test
```

---

## 2. SQLAlchemy 2.0 Models

### `buyer_model.py` — DIFF (drop 2 columnas + índice)
```python
class BuyerModel(Base):
    __tablename__ = "abel_buyers"
    # id, tenant_id (index), name, role, decision_power → SIN CAMBIO
    # ── ELIMINADOS ──
    #   icp_id       (pasa a abel_icp_buyers)
    #   is_primary   (pasa a abel_icp_buyers — propiedad del par)
    # JSONB (demographics/psychographics/pain_points/desires/objections/
    #        buyer_journey/purchase_triggers/preferred_channels) → SIN CAMBIO
    # created_at/updated_at/deleted_at → SIN CAMBIO
    __table_args__ = (Index("ix_abel_buyers_tenant", "tenant_id"),)   # era (tenant_id, icp_id)
```

### `icp_buyer_model.py` — NUEVO
```python
from datetime import datetime
from uuid import UUID
from luana_core_platform.domain.base_entity import Base
from sqlalchemy import Boolean, DateTime, Index, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column


class IcpBuyerModel(Base):
    """Join abel_icp_buyers — relación N:M ICP↔Buyer. is_primary/attached_at por par."""
    __tablename__ = "abel_icp_buyers"
    icp_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    buyer_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)  # RN-1 denorm
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    attached_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    __table_args__ = (Index("ix_abel_icp_buyers_buyer", "tenant_id", "buyer_id"),)
    # ux_abel_icp_buyers_primary (partial unique WHERE is_primary) → declarado en la migración (raw SQL)
```

Registrar `IcpBuyerModel` en el `conftest.py::db_engine` de tests (metadata create).

---

## 3. Domain Entities

### `domain/buyer.py` — DIFF
```python
class Buyer(BaseEntity):
    id: UUID
    tenant_id: UUID                      # RN-1
    # ── ELIMINADO: icp_id (el buyer ya no cuelga de UN icp) ──
    name: str
    role: str | None = None
    decision_power: DecisionPower | None = None
    is_primary: bool = False             # ← CONTEXTUAL (no persistido en abel_buyers).
                                         #   Lo POBLA list_by_icp desde la fila join para ESE icp.
                                         #   En get_by_id (sin contexto ICP) queda False (no se expone).
    # JSONB fields → SIN CAMBIO
    created_at / updated_at / deleted_at → SIN CAMBIO
```
> Decisión (ponytail · menor churn): mantener `is_primary` en el domain entity como valor **contextual** poblado por `list_by_icp` desde el join → `IcpService.buyer_count` (`len(buyers)`) + `mark_ready` (`b.role`) siguen funcionando SIN cambio. Eliminarlo obligaría a tuplas y a tocar `icp_service`. Se documenta que NO es persistido.

### `domain/icp_buyer.py` — NUEVO (opcional, ligero)
```python
class IcpBuyerLink(BaseEntity):
    icp_id: UUID
    buyer_id: UUID
    tenant_id: UUID
    is_primary: bool = False
    attached_at: datetime | None = None

class AttachedIcpRef(BaseEntity):     # para BuyerResponse.attached_icps
    icp_id: UUID
    label: str
    is_primary: bool
```

### `domain/exceptions.py` — agregar
```python
class BuyerAlreadyAttached(Exception):   # Bif-1 / SC-2 → 409
    def __init__(self, icp_id: UUID, buyer_id: UUID): ...
class BuyerNotAttached(Exception):       # detach de par inexistente → 404
    ...
```
(`BuyerNotInIcp` existente se reusa para attach cross-tenant → 404.)

---

## 4. Pydantic v2 DTOs (`ConfigDict(from_attributes=True)`)

### `buyer_dtos.py` — DIFF
```python
class BuyerCreate(BaseModel):            # SIN CAMBIO de shape (name + role + JSONB…)
    ...                                  # is_primary lo decide el server (primer buyer del ICP)

class BuyerPatch(BaseModel):             # SIN CAMBIO (autosave, todos opcionales)
    ...

class AttachedIcpRef(BaseModel):         # NUEVO
    model_config = ConfigDict(from_attributes=True)
    icp_id: UUID
    label: str
    is_primary: bool

class BuyerResponse(BaseModel):          # DIFF — detalle ICP-agnóstico
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    # ── ELIMINADOS: icp_id (escalar), is_primary (escalar) ──
    name: str
    role: str | None
    decision_power: DecisionPower | None
    demographics / psychographics / pain_points / desires / objections / \
        buyer_journey / purchase_triggers / preferred_channels   # SIN CAMBIO
    attached_icps: list[AttachedIcpRef]  # ← NUEVO (SSoT de "en qué ICPs vive + primary por ICP")
    created_at: datetime | None
    updated_at: datetime | None

class BuyerListItemResponse(BaseModel):  # NUEVO — item liviano por-ICP (GET /icp/{id}/buyers)
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    role: str | None
    decision_power: DecisionPower | None
    is_primary: bool                     # ← is_primary PARA ESE ICP (fila join)

class BuyerAttachRequest(BaseModel):     # cuerpo vacío OK (icp_id + buyer_id del path). Reservado.
    model_config = ConfigDict(from_attributes=True)

class SetPrimaryRequest(BaseModel):      # NUEVO — set-primary requiere icp_id
    model_config = ConfigDict(from_attributes=True)
    icp_id: UUID
```

> **Contrato FE↔BE explícito (anti-imagined-contract):** `BuyerResponse.attached_icps` reemplaza `icp_id`+`is_primary` escalares → el FE (`types/buyer.ts` + `mapBuyer`) DEBE alinearse (T-FE-1). `GET /icp/{id}/buyers` pasa a `list[BuyerListItemResponse]` (shape `{id,name,role,decision_power,is_primary}`) = subconjunto que el FE `mapBuyerListItem` YA consume → mapper FE del list SIN cambio.

---

## 5. API Routes (`/api/v1/abel` · Bearer + `X-Tenant-ID` · `response_model=` en cada una)

| Method | Path | response_model | Cambio | Scenario |
|---|---|---|---|---|
| GET | `/icp/{icp_id}/buyers` | `list[BuyerListItemResponse]` | query pasa a JOIN `abel_icp_buyers`; `is_primary` de la fila join | SC-1 |
| POST | `/icp/{icp_id}/buyers` | `BuyerResponse` | crea buyer (sin icp_id) **+ attach** en una op; `is_primary`=primer buyer del ICP | (create-new) |
| POST | `/icp/{icp_id}/buyers/{buyer_id}/attach` | `BuyerResponse` | **NUEVO** — attach de buyer existente. 409 si ya attached (`BuyerAlreadyAttached`), 404 cross-tenant | SC-1, SC-2, SC-5, SC-6 |
| DELETE | `/icp/{icp_id}/buyers/{buyer_id}` | `None` (204) | **NUEVO** — detach. Borra fila join; si buyer queda en 0 ICPs → soft-delete real (RN-5) | SC-3, SC-3b |
| GET | `/buyer/{buyer_id}` | `BuyerResponse` | ahora con `attached_icps[]` | — |
| PATCH | `/buyer/{buyer_id}` | `BuyerResponse` | firma igual; efecto RN-9 automático (misma fila) | SC-4 |
| POST | `/buyer/{buyer_id}/set-primary` | `BuyerResponse` | **cambia firma** — body `SetPrimaryRequest{icp_id}`; escribe la fila join | SC-7 |
| GET | `/buyers` | `list[BuyerResponse]` | **NUEVO** — directory tenant-scoped; cada item con `attached_icps[]` | SC-5, SC-9, SC-10 |
| DELETE | `/buyer/{buyer_id}` | — | **RETIRADO** — reemplazado por detach. Grep callers: `buyer-api.ts::delete` + `use-buyer-mutations::useDeleteBuyer` (SIN consumidor UI — verificado, solo hook+api+tests) → T-FE los migra a detach | — |
| DELETE | `/icp/{icp_id}` | `None` (204) | firma SIN cambio — **semántica cambia (v2, RN-11):** `IcpService.soft_delete` ahora cascadea (detach all + soft-delete buyers en 0) — ver §7 | SC-12 |

- `redirect_slashes=False` ya app-level. Auth deps existentes (`_get_tenant_id` + engine `get_current_user`). Router ya montado en `main.py` (`include_router` prefix `/api/v1/abel`) — CONN notarized SIN cambio (mismo router).
- **Idempotency attach:** natural key = PK compuesta `(icp_id, buyer_id)` → la carrera la resuelve la DB (SC-6: 1 gana 201, otro `IntegrityError` → 409). El service captura `IntegrityError` → `BuyerAlreadyAttached`.
- **Idempotency set-primary:** `clear_primary(icp_id)` + set en una transacción; `ux_abel_icp_buyers_primary` es el gate DB (SC-7).

---

## 6. Repository Interfaces (async ABC · todo método con `tenant_id` · RN-1)

### `IcpBuyerRepository` — NUEVO (dueño de la join table)
```python
class IcpBuyerRepository(ABC):
    async def attach(self, tenant_id, icp_id, buyer_id, is_primary: bool = False) -> None      # IntegrityError → caller decide (§7 helper)
    async def detach(self, tenant_id, icp_id, buyer_id) -> bool                                 # False si el par no existe
    async def is_attached(self, tenant_id, icp_id, buyer_id) -> bool
    async def list_buyer_links_for_icp(self, tenant_id, icp_id) -> list[IcpBuyerLink]           # (buyer_id, is_primary) por ICP — también insumo del cascade RN-11
    async def list_attached_icps_for_buyer(self, tenant_id, buyer_id) -> list[AttachedIcpRef]   # JOIN abel_icps p/ label
    async def count_attachments(self, tenant_id, buyer_id) -> int                               # RN-5 detach→0
    async def count_buyers_in_icp(self, tenant_id, icp_id) -> int                               # NUEVO v2 — RN-12 (¿primer buyer?), lo usan create Y attach
    async def clear_primary(self, tenant_id, icp_id) -> None                                    # RN-6
    async def set_primary(self, tenant_id, icp_id, buyer_id) -> bool                            # False si el par no existe
```
Impl: `select/insert/delete/update` SQLA 2.0 async. `attach` inserta y deja subir `IntegrityError` al service — que la DESAMBIGUA sin parsear constraint names (ver §7 `_attach_link`). `clear_primary`+`set_primary` en la misma transacción que el service.

### `BuyerRepository` — DIFF
```python
class BuyerRepository(ABC):
    async def create(self, tenant_id, buyer: Buyer) -> Buyer          # ya NO setea icp_id/is_primary
    async def get_by_id(self, tenant_id, buyer_id) -> Buyer | None    # SIN CAMBIO
    async def list_by_icp(self, tenant_id, icp_id) -> list[Buyer]     # IMPL: JOIN abel_icp_buyers;
                                                                      #   puebla Buyer.is_primary (contextual) desde la fila join
    async def list_all_by_tenant(self, tenant_id) -> list[Buyer]      # NUEVO — directory (deleted_at IS NULL)
    async def update(self, tenant_id, buyer_id, patch) -> Buyer | None  # SIN CAMBIO
    async def soft_delete(self, tenant_id, buyer_id) -> bool          # SIN CAMBIO (lo llama detach→0)
    # ── ELIMINADO: clear_primary (se movió a IcpBuyerRepository) ──
```
`list_by_icp` query: `select(BuyerModel, IcpBuyerModel.is_primary).join(IcpBuyerModel, IcpBuyerModel.buyer_id == BuyerModel.id).where(IcpBuyerModel.icp_id == icp_id, BuyerModel.tenant_id == tenant_id, BuyerModel.deleted_at.is_(None))`. Mapear `is_primary` de la fila join sobre el `Buyer` contextual.

---

## 7. Application Services (async · transaction boundaries)

### `BuyerService` — DIFF (agrega `IcpBuyerRepository`)
```python
class BuyerService:
    def __init__(self, session):
        self._buyer_repo = SqlAlchemyBuyerRepository(session)
        self._icp_repo = SqlAlchemyIcpRepository(session)
        self._link_repo = SqlAlchemyIcpBuyerRepository(session)      # NUEVO
        self._emitter = GrowthStudioEmitter(session)

    async def list_by_icp(tenant_id, icp_id) -> list[BuyerListItemResponse]:
        # buyers con is_primary contextual (join)
    async def get(tenant_id, buyer_id) -> BuyerResponse | None:
        # buyer + attached_icps (list_attached_icps_for_buyer) → BuyerResponse
    async def create(tenant_id, icp_id, dto) -> BuyerResponse:
        # RN-5 verify ICP; create buyer (sin icp_id); _attach_link(icp_id, buyer_id)  ← MISMA helper que attach (RN-12 simetría); commit; emit abel_buyer_added
    async def attach(tenant_id, icp_id, buyer_id) -> BuyerResponse:            # NUEVO
        # RN-5 verify ICP del tenant + buyer del tenant (get_by_id → None ⇒ BuyerNotInIcp/404, SC-5 sin leak);
        # _attach_link(icp_id, buyer_id); commit; return get(buyer_id)
    async def detach(tenant_id, icp_id, buyer_id) -> bool:                     # NUEVO
        # link_repo.detach (False si par no existe → 404); si count_attachments == 0 ⇒ buyer_repo.soft_delete (RN-5, SC-3b); commit
        # NO re-promociona primary (RN-6 nota — test_detach_primary_does_not_repromote lo fija)
    async def set_primary(tenant_id, buyer_id, icp_id) -> BuyerResponse | None:  # firma con icp_id
        # verify par (icp,buyer) del tenant; link_repo.clear_primary(icp_id) + set_primary(icp_id,buyer_id); commit
    async def list_all(tenant_id) -> list[BuyerResponse]:                      # NUEVO directory
        # list_all_by_tenant + attached_icps por buyer (single grouped query preferido; N+1 aceptable <50 buyers)
    async def patch(...)   # SIN CAMBIO
```

### `_attach_link` — helper interno compartido create+attach (RN-12 · SC-2/SC-6/SC-13)

Una sola pieza decide `is_primary` y desambigua el `IntegrityError` **sin parsear constraint names** (frágil cross-driver). Pseudocódigo exacto para el builder:

```python
async def _attach_link(self, tenant_id, icp_id, buyer_id) -> None:
    """Attach con auto-primary del primer buyer (RN-12) + carrera resuelta por DB.

    2 constraints pueden rechazar el INSERT:
      - PK (icp_id, buyer_id)          → par duplicado (SC-2/SC-6) ⇒ 409
      - ux_abel_icp_buyers_primary     → 2 "primeros" concurrentes (SC-13) ⇒ retry sin primary
    Desambiguación por estado, no por nombre de constraint: tras rollback,
    is_attached == True ⇔ perdimos la carrera del PAR (dup) ⇒ BuyerAlreadyAttached.
    is_attached == False ⇔ perdimos la carrera del PRIMARY ⇒ reintentar is_primary=False
    (el retry solo puede fallar por PK dup ⇒ BuyerAlreadyAttached).
    """
    is_first = (await self._link_repo.count_buyers_in_icp(tenant_id, icp_id)) == 0
    try:
        await self._link_repo.attach(tenant_id, icp_id, buyer_id, is_primary=is_first)
    except IntegrityError:
        await self._session.rollback()
        if await self._link_repo.is_attached(tenant_id, icp_id, buyer_id):
            raise BuyerAlreadyAttached(icp_id, buyer_id)          # 409 — SC-2/SC-6
        try:
            await self._link_repo.attach(tenant_id, icp_id, buyer_id, is_primary=False)  # SC-13 loser
        except IntegrityError:
            await self._session.rollback()
            raise BuyerAlreadyAttached(icp_id, buyer_id)
```

> ⚠️ El `rollback()` deshace también el buyer recién creado si venimos de `create` — por eso en `create` el orden es: create buyer → flush → `_attach_link` → si `BuyerAlreadyAttached` es IMPOSIBLE (buyer nuevo, par no puede existir) el único IntegrityError posible es el del primary → el retry interno lo resuelve sin perder el buyer. El builder DEBE re-crear/re-flush el buyer tras un rollback del primary-race en create (o hacer el create en un savepoint `begin_nested()` — opción preferida, 1 línea).

### `IcpService.soft_delete` — DIFF (cascade RN-11 · SC-12)

```python
async def soft_delete(self, tenant_id: UUID, icp_id: UUID) -> bool:
    """Soft delete ICP + cascade (RN-11): detach de todos sus buyers;
    buyer que queda en 0 attachments → soft-delete (RN-5).
    TODO en la misma transacción — un solo commit al final (falla ⇒ rollback total, cero estado parcial).
    """
    result = await self._icp_repo.soft_delete(tenant_id, icp_id)
    if not result:
        return False                                              # 404 — sin cambios
    links = await self._link_repo.list_buyer_links_for_icp(tenant_id, icp_id)
    for link in links:
        await self._link_repo.detach(tenant_id, icp_id, link.buyer_id)
        if await self._link_repo.count_attachments(tenant_id, link.buyer_id) == 0:
            await self._buyer_repo.soft_delete(tenant_id, link.buyer_id)
    await self._session.commit()
    return result
```

`IcpService.__init__` gana `self._link_repo = SqlAlchemyIcpBuyerRepository(session)` (ya tiene `_buyer_repo`). Loop N chico (<50 buyers/tenant) — no optimizar a bulk salvo que el auditor lo pida con números.

> `IcpService.buyer_count` + `mark_ready` — **SIN CAMBIO** porque `list_by_icp` conserva su firma (`list[Buyer]`) y devuelve `is_primary` contextual + `role`. PERO `test_icp_service.py` YA NO es puro regression-guard: `soft_delete` cambia (cascade) → el test file se ACTUALIZA (v2, ver 04-validators `coverage_update`).

---

## 8. Registration (CONN · notarized)

Router `abel` YA montado en `main.py` (`app.include_router(abel_router, prefix="/api/v1/abel")`). Las 2 rutas nuevas (attach, directory) + detach + set-primary(icp_id) cuelgan del mismo router → notarizadas por el `include_router` existente. **Cero cambio de wiring BE.**

---

## 9. Tests (TDD RED-first · ver 04-validators §test_construction_plan)

`nicolify/backend/tests/modules/nicolify/abel/`:
- `domain/` — `Buyer` sin `icp_id`; `IcpBuyerLink` invariants.
- `infrastructure/test_icp_buyer_repository.py` — NUEVO: attach/detach/is_attached/clear+set_primary/`count_buyers_in_icp` tenant-scoped; `attach` dup → `IntegrityError`; **race real-DB (v2):** `test_concurrent_attach_only_one_wins` (SC-6) + `test_concurrent_set_primary_only_one_wins` (SC-7) + `test_concurrent_first_attach_two_buyers_exactly_one_primary` (SC-13 — 2 buyers distintos, ICP vacío, `asyncio.gather`: ambos attached, exactamente 1 primary).
- `infrastructure/test_buyer_repository.py` — `list_by_icp` join + `is_primary` contextual; `list_all_by_tenant`.
- `application/test_buyer_service.py` — attach (SC-1), attach-dup 409 (SC-2), detach mantiene vivo (SC-3), detach→0 soft-delete (SC-3b), attach cross-tenant 404 sin leak (SC-5), set_primary(icp_id) (SC-7); **v2 (RN-12/RN-6):** `test_attach_first_buyer_becomes_primary`, `test_attach_second_buyer_not_primary`, `test_create_first_buyer_becomes_primary` (simetría — misma helper), `test_detach_primary_does_not_repromote` (fija el contrato no-re-promoción).
- `application/test_icp_service.py` — **ACTUALIZA (v2, RN-11/SC-12):** `test_delete_icp_cascades_detach_and_soft_deletes_orphans` (buyer compartido sobrevive + buyer exclusivo soft-deleted + 0 joins al ICP muerto + 1 sola transacción), `test_delete_icp_not_found_no_cascade` (404 → cero side-effects). buyer_count/mark_ready existentes siguen verdes.
- `api/test_buyer_multi_icp_api.py` — response_model shape, Bearer/X-Tenant-ID, attach 201/409/404, detach 204, directory `attached_icps[]`, set-primary body `{icp_id}`; **v2:** create SIN `is_primary` en body (server decide — payload extra ignorado, no 422).
- `tests/integration/test_abel_icp_buyer_migration_backfill.py` — NUEVO (SC-8): migración real sobre DB sembrada con 3 clases de filas (N con ICP vivo · M con ICP soft-deleted legacy · K buyers ya soft-deleted) → count == N + cero join fantasma + M zombies cerrados + is_primary preservado + idempotente (2º run no-op, no re-borra).

Comando: `cd nicolify/backend && ${WS}/.venv/bin/pytest tests/modules/nicolify/abel/ tests/integration/ tests/architecture/ -v`

---

## 10. Cross-cutting
- **Tenant isolation (RN-1):** cada query de `abel_icp_buyers` filtra `tenant_id` (denormalizado). attach/detach/set-primary/directory → 404 cross-tenant sin leak (SC-5).
- **Soft delete:** el buyer sigue soft-delete (`deleted_at`). El detach = **hard DELETE de la fila join** (la relación es pura; el historial lo preserva el `deleted_at` del buyer).
- **PII:** `BuyerResponse`/`BuyerListItemResponse` sin `tenant_id`. `attached_icps` solo expone `{icp_id, label, is_primary}` (label del ICP, no PII).
- **Sin eventos nuevos** (`nicolify_growth_studio_event` sin cambio → `test_growth_studio_event_no_pii.py` intacto).
- **Master-data/currency:** N/A (sin campos monetarios/fecha nuevos user-facing; `attached_at` server-side).
- **Native-first:** `${WS}/.venv/bin/{ruff,pytest}`, nunca docker exec.

## 11. Architecture Fitness Impact
- `test_migrations_idempotent.py` — pasa: 003 usa solo `op.execute` (sin `op.create_table/add_column/create_index`).
- `test_response_model_required.py` — pasa: attach→`BuyerResponse`, directory→`list[BuyerResponse]`, detach→`None`, set-primary→`BuyerResponse`. Allowlist SIN cambio (queda vacío).
- `test_no_cross_brand_imports.py` — pasa: cero import cross-brand / cero `core/` edit.
- Allowlists: sin crecimiento.
