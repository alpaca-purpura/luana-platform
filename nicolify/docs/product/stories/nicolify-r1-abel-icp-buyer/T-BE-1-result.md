# T-BE-1 Result — Domain + Models + Migration + Repos

**Ticket:** T-BE-1 (ICP domain + models + migration + repositories)
**Story:** nicolify-r1-abel-icp-buyer
**State:** tests-passing

## Files Touched

### Source (domain + infrastructure)
- `nicolify/backend/src/modules/nicolify/abel/domain/icp.py` — fixed TYPE_CHECKING → runtime imports (UUID/Decimal/datetime) for Pydantic
- `nicolify/backend/src/modules/nicolify/abel/domain/buyer.py` — same fix
- `nicolify/backend/src/modules/nicolify/abel/infrastructure/models/icp_model.py` — same fix for SQLA Mapped[] annotations
- `nicolify/backend/src/modules/nicolify/abel/infrastructure/models/buyer_model.py` — same fix
- `nicolify/backend/src/modules/nicolify/abel/infrastructure/models/growth_studio_event_model.py` — same fix
- `nicolify/backend/pyproject.toml` — added `luana_core_platform.domain.base_entity.{BaseEntity,Base}` to `runtime-evaluated-base-classes`; added per-file-ignores TC001/TC002/TC003 for `src/modules/nicolify/abel/**/*.py`

### Tests
- `nicolify/backend/tests/modules/nicolify/abel/domain/test_icp_domain.py` — 19 tests (all pass)
- `nicolify/backend/tests/modules/nicolify/abel/infrastructure/test_icp_repository.py` — fixed SIM102 nested-if; 14 tests (all pass)

### Migration
- `nicolify/backend/alembic/versions/002_abel_icp_buyer.py` — unchanged (was already idempotent raw SQL IF NOT EXISTS)

## Validators Satisfied

| Validator | Status | Notes |
|---|---|---|
| NF-sec-tenant (RN-1) | PASS | All repo methods filter tenant_id; cross-tenant returns None |
| RN-5 | PASS | Buyer.icp_id is required FK; BuyerRepository scoped by tenant+icp_id |
| RN-6 | PASS | clear_primary() in InMemoryBuyerRepository verified; BuyerService.set_primary tested |
| RN-7 | PASS | label_exists() case-insensitive, exclude_id, soft-delete-aware — 5 test scenarios |
| test_no_cross_brand_imports | PASS | arch test |
| test_main_app_config (redirect_slashes=False) | PASS | arch test |
| test_migrations_idempotent | PASS | arch test |
| test_no_secret_leak | PASS | arch test |

## Test Counts

- domain: 19/19 PASS
- infrastructure: 14/14 PASS
- **Total T-BE-1 scope: 33 tests PASS**

## Root Cause Fixed

Prior builder used `from __future__ import annotations` + `TYPE_CHECKING` for `UUID`, `datetime`, `Decimal`. With `from __future__ import annotations`, all annotations become strings at parse time — but Pydantic v2 and SQLAlchemy 2.0 `Mapped[]` evaluate them at runtime via `get_type_hints()` / `model_rebuild()`. This caused `PydanticUserError: X is not fully defined` and `MappedAnnotationError`. Fix: import types at module level + add `runtime-evaluated-base-classes` for luana_core_platform base classes.

## Residual Notes for Auditor

- mypy not available in workspace venv — skipped (not installed in luana-platform venv)
- Integration tests (DB marker) require postgres up — SKIP expected if postgres down
- Migration idempotency clone test requires postgres — SKIP expected if postgres down
