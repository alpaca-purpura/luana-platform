<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# Backend Audit Summary — vitalia-slice-1-inbox

**Date:** 2026-05-20
**Brand:** vitalia
**Story:** vitalia-slice-1-inbox
**Branch:** wip/vitalia @ 5aa590c
**Auditor:** auditor-backend (mode: AUTO_HANDOFF_FROM_DEV_TEAM)
**Scope:** BE business modules (T-inbox-be-1..6) + T-inbox-integ-2 BE portion

**Verdict:** CHANGES_REQUESTED

## Per-ticket verdicts

| Ticket | Verdict | Severity |
|---|---|---|
| T-inbox-be-1 — Domain entities + events | PASS | — |
| T-inbox-be-2 — Infrastructure repos + models + migration | **CHANGES_REQUESTED** | HIGH (missing repo methods) |
| T-inbox-be-3 — Inbox application services | **CHANGES_REQUESTED** | HIGH (ActionReceipt + handler_mode flip gaps) |
| T-inbox-be-4 — Whisper + retract adapters | PASS | — |
| T-inbox-be-5 — 8 inbox + 4 CRM API endpoints | **CHANGES_REQUESTED** | HIGH (AsyncMock factories in src/) |
| T-inbox-be-6 — extensions.py register tool | PASS | — |
| T-inbox-integ-2 — BE integration tests | WARN | Non-blocking (test coverage gap) |

## Gate Status

| Gate | Result | Note |
|---|---|---|
| arch fitness | ✅ 268/268 PASS (verified locally) | — |
| unit tests (inbox + crm) | ✅ 287 PASS (verified locally) | AsyncMock-based |
| integration tests | ⏭ 15 skipped (Postgres down — expected) | Auto-skip per `pytest.mark.integration` |
| ruff check (inbox scope) | ✅ All checks passed | — |
| ruff format (inbox scope) | ✅ 27 files already formatted | — |

## Critical findings (must fix before merge)

### 1. SendMessageService never creates ActionReceipt
**Location:** `vitalia/backend/src/modules/vitalia/inbox/application/services/send_message_service.py:226, 321`

Per spec § 9 + arch § 6.3, every AI message must create an `ActionReceipt` with `expires_at = sent_at + 5min`. Service receives `receipt_repo: ActionReceiptRepository` but never calls it. Returns `action_receipt_expires_at=None` in all paths. Net effect: SC-01 Gherkin "el mensaje incluye chip '↩ Revertir (4:58)' debajo con countdown 5 min" cannot render.

### 2. RetractMessageService missing handler_mode='human' flip
**Location:** `vitalia/backend/src/modules/vitalia/inbox/application/services/retract_message_service.py`

Per spec § 9 + arch § 6.3 + EP-3 tool description verbatim, a successful retract must flip `conversation.handler_mode='human'`. Service does not. Operator left in inconsistent state. Tool description in `extensions.py:680-684` claims this happens, but it doesn't.

### 3. Repository method gaps
**Locations:** `message_repository.py`, `conversation_repository.py`, `action_receipt_repository.py`

Services call methods that do not exist on the concrete repo classes:
- `MessageRepository.create` — not implemented
- `MessageRepository.mark_retracted` — not implemented
- `MessageRepository.find_patient_reply_after` — not implemented
- `ConversationRepository.get_or_create_for_lead` — not implemented (called by `ProactiveOutboundService`)
- `ActionReceiptRepository.create` — not implemented (will be needed when #1 is fixed)

Unit tests pass because they pass `AsyncMock()` which accepts any attribute. Real DI fails at runtime.

### 4. Router service factories return AsyncMock instances in production
**Location:** `vitalia/backend/src/modules/vitalia/inbox/api/router.py:117-204`

Every `_get_*_service()` factory imports `unittest.mock.AsyncMock` and instantiates the service with AsyncMock repos, audit_writer, event_bus, session. This is pre-existing pattern in vitalia (`crm/api/router.py`, `crm/api/consent_endpoints.py`, `copilot/api/routes/wizard_onboarding_routes.py`) — but pre-existence does not excuse 8 more endpoints with the same gap. E2E smoke against live stack will return malformed responses or HTTP 500s once the AsyncMock chain breaks (e.g., MessageResponse validation against `AsyncMock` return).

## Medium findings

### 5. SendMessageService drops `handler_mode_override` from SendMessageRequest
**Location:** `inbox/api/router.py:301-311` + `inbox/application/services/send_message_service.py:159-171`

DTO defines `handler_mode_override: Literal["ai", "human"] | None` (used by FE for "Yo escribo" mode), but neither the router nor the service forwards it. Field is dead at every layer.

### 6. audit_writer interface unbound to real implementation
**Location:** Multiple services + `vitalia/audit/audit_writer.py`

Inbox services expect `audit_writer.write(...)` async with kwarg signature. The `vitalia/audit/audit_writer.py` exposes `write_audit_log_sync(db, *, ...)` sync. No real adapter wires them together. HIPAA-lite mandate (sync write pre-response) cannot be honored in production.

### 7. ActivityEventService sanitize call discards result
**Location:** `inbox/application/services/activity_event_service.py:113`

Code calls `_ = sanitize_payload(...)` and throws result away. The DTO returned does not expose raw payload, so PHI does not leak — but the call is dead code. Either remove or assign + return sanitized payload.

## Non-blocking informational

- Tool description in `extensions.py:680-684` for `retract_last_message` claims behavior (`handler_mode='human'` flip) that service does not implement — coordinated finding with #2.
- ClerkJwtDecoder re-instantiated per request (perf optimization).
- Spec § 4.1 says POST /mode; code uses PATCH /mode (cosmetic).
- Several Gherkin-named tests cited in 06-tickets.yaml::gherkin_coverage do not exist verbatim (`test_ai_message_creates_action_receipt`, `test_audio_fallback_switches_to_human`). Tests with similar coverage exist under different names.
- Integration tests verify model + DB layer (HIPAA-lite dual filter works), but do not exercise SendMessageService / RetractMessageService end-to-end (gap relative to test file names).

## Commit hygiene notes (per orchestrator brief)

| Commit | Note | Status |
|---|---|---|
| 6f72b04 (T-inbox-fe-6) | Absorbed sign-in/sign-up `[[...rest]]` catch-all route renames (Clerk fix mid-session) | Functionally correct fix; commit message would have benefited from a scope note. Non-blocking. |
| 9ce52eb (T-inbox-fe-6) | Absorbed `next.config.ts::allowedDevOrigins` for Cloudflare Tunnel HMR + orphan T-inbox-fe-4-result.md | Functionally correct; pre-flagged in PRE-AUDITOR-VALIDATION.md. Non-blocking. |
| a781ef8 (orchestrator) | Orphan T-inbox-fe-7-result.md (FE scope — out of this audit) | Documented in PRE-AUDITOR-VALIDATION.md. Non-blocking. |

Net: history slightly muddy in some commits; functional content verified. No commit shipped a regression. Note documented in C5 trace.

## Cross-scope items (NOT audited here)

| Surface | Where it goes |
|---|---|
| `T-inbox-agentic-1` (sales_agent/tools/retract_last_message.py) | auditor-agentic |
| FE specs (`inbox.adversarial.spec.ts`, `inbox.a11y.spec.ts`) | auditor-frontend |
| FE scaffolds T-inbox-fe-{1..7} + T-inbox-integ-1 | auditor-frontend |

No engine edits detected. No cross-brand pollution detected. No promotion proposal required.

## Required fixes (priority order)

1. **(HIGH)** Implement missing repo methods in T-inbox-be-2:
   - `MessageRepository.create()`, `mark_retracted()`, `find_patient_reply_after()`
   - `ConversationRepository.get_or_create_for_lead()`
   - `ActionReceiptRepository.create()`
2. **(HIGH)** In `SendMessageService.send()` (T-inbox-be-3): when `conv.handler_mode == "ai"`, call `receipt_repo.create(...)` with `expires_at = sent_at + 5min` and return `action_receipt_expires_at=expires_at` in the result. Add test `test_ai_message_creates_action_receipt`.
3. **(HIGH)** In `RetractMessageService.retract()` (T-inbox-be-3): after successful retract, call `conv_repo.update_handler_mode(..., new_handler_mode='human', ...)` and emit `ModeChanged` event. Add test `test_retract_flips_handler_mode_to_human`.
4. **(HIGH)** In `inbox/api/router.py` (T-inbox-be-5): replace all `AsyncMock()` factory instantiations with real DI via FastAPI `Depends(get_session)` and real repo + audit_writer + event_bus. If wiring deferred, add `logger.warning("inbox.X.using_mock_dependencies")` on every request and document in result MD.
5. **(MEDIUM)** Forward `body.handler_mode_override` through `send_message` route → `SendMessageService.send()`.
6. **(MEDIUM)** Add real `AsyncAuditWriter` adapter in `vitalia/audit/` exposing `async def write(*, tenant_id, clinic_id, user_id, action, resource_type, resource_id, payload)`. Wire into router factories.
7. **(LOW)** In `ActivityEventService` line 113, either remove the dead `sanitize_payload` call or assign + return sanitized payload.
8. **(INFO)** Add at least one true end-to-end integration test exercising real service chain (T-inbox-integ-2).

## Recommended re-spawn

After fixes 1-4 land in a fix commit, re-spawn `auditor-backend` with `mode: AUTO_HANDOFF_FROM_DEV_TEAM` for re-audit. The fixes are scoped (no refactor; targeted method adds + service call additions), so a builder Sonnet auto-fix loop is appropriate per `.claude/rules/auditor-self-fix-policy.md` Caso B (spawn dev-team) given the changes touch branch logic + new repo methods (not whitelist self-fix scope).

AUDIT_BE: CHANGES_REQUESTED -> vitalia/docs/product/stories/vitalia-slice-1-inbox/06-audit/REVIEW-be-summary.md
