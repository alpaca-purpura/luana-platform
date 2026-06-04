# T-BE-2 Result — DTOs + Services + Telemetry + Router

**Ticket:** T-BE-2 (DTOs + services + telemetry + router)
**Story:** nicolify-r1-abel-icp-buyer
**State:** tests-passing

## Files Touched

### Source (application + api)
- No changes needed to existing service/DTO/router/emitter code — logic was correct
- `nicolify/backend/src/main.py` — router already registered (include_router abel_router prefix=/api/v1/abel)

### Tests — NEW (application layer was missing entirely)
- `nicolify/backend/tests/modules/nicolify/abel/application/test_icp_service.py` — **NEW** 12 tests written (TDD — assert existing service behavior)
  - `TestIcpServiceMarkReady` (4 tests): mark_ready returns IcpMarkReadyResponse NOT raises; missing[] for incomplete; success path; not-found → None
  - `TestIcpServiceLabelConflict` (3 tests): create dup label; patch same label idempotent; patch to other ICP's label raises
  - `TestBuyerServiceSetPrimary` (2 tests): set_primary demotes all in ICP; not-found → None
  - `TestBuyerServiceCreate` (3 tests): raises BuyerNotInIcp; success; cross-tenant ICP raises

### Tests — FIXED (api layer)
- `nicolify/backend/tests/modules/nicolify/abel/api/test_icp_api.py` — fixed F841 (unused icp_id); refactored `test_get_icp_cross_tenant_returns_404` to properly override `_get_icp_service` dep and make HTTP call asserting 404

## Validators Satisfied

| Validator | Status | Notes |
|---|---|---|
| NF-sec-pii | PASS | test_growth_studio_event_no_pii.py (5/5 arch tests) |
| RN-8 | PASS | mark_ready returns IcpMarkReadyResponse(missing=[...]) — does NOT raise; 4 test scenarios |
| RN-11 | PASS | avg_ticket_currency preserved in domain entity test (no hardcoded USD) |
| test_response_model_required | PASS | arch test + unit test test_all_routes_have_response_model |
| test_growth_studio_event_no_pii | PASS | 5/5 arch tests |
| SC-adversarial-tenant | PASS | cross-tenant GET → 404 via real HTTP call with mocked service |
| SC-race-unique | PASS | duplicate label → IcpLabelConflict shape verified |
| RN-6 set_primary | PASS | application layer test verifies demote before promote |
| RN-7 idempotent | PASS | PATCH self-label → no conflict; PATCH other ICP label → conflict |

## Test Counts

| Layer | Tests |
|---|---|
| domain | 19 |
| infrastructure | 14 |
| application (NEW) | 12 |
| api | 7 |
| **Total** | **52/52 PASS** |

## Gate Summary

| Gate | Result |
|---|---|
| ruff check (0 errors) | PASS |
| ruff format --check (0 files to reformat) | PASS |
| mypy | SKIP (not in workspace venv) |
| pytest tests/modules/nicolify/abel/ | 52/52 PASS |
| pytest tests/architecture/ | 20/20 PASS (incl. test_growth_studio_event_no_pii, test_response_model_required, test_no_cross_brand_imports, test_main_app_config, test_migrations_idempotent, test_no_secret_leak) |

## Router Registration (CONN)

- `include_router(abel_router, prefix="/api/v1/abel", tags=["abel"])` in `src/main.py` — verified
- `redirect_slashes=False` at app level — confirmed via arch test

## Residual Notes for Auditor / Downstream

- Integration tests (DB marker) and migration clone test require postgres up — SKIP expected if DB unavailable
- T-AG-1 (agentic extraction): `abel/extraction/__init__.py` left untouched as specified; extraction stubs in router are T-AG-1 scope
- mark_ready router currently returns 422 via HTTPException when missing[] — this means the IcpMarkReadyResponse model is on the 200 path only; auditor should verify if FE requires the 422 body to match IcpMarkReadyResponse shape (current implementation uses plain dict in detail)
