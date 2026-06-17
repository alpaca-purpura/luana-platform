<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# Frontend Code Review: Comunify Shell-Organism (closure audit · chat T-e2e LIVE + /api rewrite fix)

**Date:** 2026-06-17
**Brand:** comunify
**Story:** comunify-shell-organism (state=developed, reconciled=true, autonomous_mode=true)
**Commit:** 3302621d on wip/comunify
**PR / CONTRACT / UI-SPEC:** 04-validators.yaml § reconciliation · checkpoint.md § dod_evidence · 03-arch.md
**Files Reviewed:** 15 (7 in-scope FE/config + e2e harness + docs)
**Domains touched:** shell-organism (FE chrome consuming @luana/ui-kit) · copilot mount (agentic, consumed not built) · hygiene (next.config/playwright)
**Skills consulted:** frontend-expert (FSD-Lite, runtime quality), copilot-expert (SSE v2 protocol — block_delta shape), anti-duplication (kit consume vs mirror)
**Live-verified:** YES — authed e2e (real backend, real LLM stream) run by auditor; 4 passed (26.6s); DB write effect confirmed (see § Live Verification Audit)
**Verdict:** **PASS → APPROVED**

## /test-frontend Gate Status

| Gate | Step | Result | Detail |
|---|---|---|---|
| QUALITY | tsc --noEmit | PASS | 0 errors strict |
| QUALITY | ESLint (60+ rules) | PASS | 0 errors |
| QUALITY | Arch fitness (FE) | PASS | use-tenant-id (no-clerk-org), no-stock-palette/no-low-contrast (no-hardcoded-hex), ds-dark-wiring, proxy, layout — all green |
| FUNCTIONAL | Vitest | PASS | 129/129 (12 files); chat-store 18 tests |
| FUNCTIONAL | Live-verify (authed e2e) | PASS | 4 passed (26.6s) real backend, real kimi stream, NOT mocked |
| HEALTH | jscpd/knip/madge | N/A | gate-runner not spawned (diff is config + e2e harness + 1-line store change); no new product components, no cycle risk |

Gates run directly by auditor (gate-output.json not present; diff small + Carril-R authority). All blockers GREEN.

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | FSD-Lite | PASS | 0 |
| 2 | Server/Client | PASS | 0 |
| 3 | React Patterns | PASS | 0 |
| 4 | Code Quality | PASS | 0 |
| 5 | Accessibility | PASS | 0 (no new UI surface; avatar.svg placeholder per scope) |
| 6 | Forms (RHF + Zod) | N/A | no forms in diff |
| 7 | Multitenancy | PASS | 0 — X-Tenant-ID + Bearer injected; useTenantId not Clerk org |
| 8 | Master Data / Spanish | PASS | 0 voseo in changed product strings; no hardcoded currency |
| 9 | Security / Deps | PASS | 0 — @clerk/testing + dotenv are devDeps only |
| 10 | Tests / TDD | PASS | 0 — e2e real-backend + 18 unit; deferred SC genuinely unit-covered |
| 11 | Domain Alignment / Agentic UI | PASS | 0 — SSE block_delta.markdown shape matches engine |
| 12 | Architecture Fitness | PASS | 0 — no allowlist growth |
| 13 | Mirror detection | PASS | 0 — kit consumed, ThemeToggle port is docstring-only ref |
| 14 | Decisions honored cite (R6) | N/A | ticket has no `decisions_applicable` field |
| 15 | Connectivity (anti-isla) | PASS | 0 — chat wired BE↔FE, exercised live |
| 16 | Visual fidelity | PASS | 0 — avatar placeholder in-scope; no reinvented primitive |

## Findings

No FAIL or WARN findings. Notes below document why borderline items are PASS.

### NOTE (PASS): next.config rewrites is a PORT, not a forbidden mirror
**Category:** 13
**File:** `comunify/frontend/next.config.ts:6-25`
**Detail:** The new `async rewrites()` (`/api` + `/public` → `${INTERNAL_API_URL ?? NEXT_PUBLIC_API_URL ?? localhost:8003}`) is byte-faithful to the established sibling pattern in `vitalia/frontend/next.config.ts` (same `beUrl` resolution chain, same two rewrites). Per CLAUDE.md anti-duplication, this is brand-local Next config (each brand owns its own `next.config.ts`) — NOT a cross-brand mirror of shared logic. The prompt explicitly framed this as a correct port. It fixed a real marca-wide bug: relative `/api/*` returned Next 404 off-tunnel (chat + every data hook). PASS.

### NOTE (PASS): ShellLayoutWire auth injection now correctly wired
**Category:** 3 / 7 / 15
**File:** `comunify/frontend/src/app/[tenantId]/(shell-organism)/_components/ShellLayoutWire.tsx:164-181`
**Detail:** The previously-broken stub (`// NOTE: Future data-layer ticket will wire auth context`) is gone. `useEffect` injects `getToken()` Clerk Bearer + `useTenantId()` into chat-store via `setAuthContext`, with ~30s refresh interval (token expiry). Deps array `[getToken, tenantId, setAuthContext]` is complete — no stale closure. `sendMessage` reads `_authContext` lazily at call time (correct). This is the fix that converted chat 401→200, confirmed by live-verify. PASS.

### NOTE (PASS): SSE block_delta shape matches engine contract
**Category:** 11
**File:** `comunify/frontend/src/stores/chat-store.ts:269-282`
**Detail:** Store reads `delta.markdown ?? delta.text ?? parsed.text` tolerating both object `{delta:{markdown}}` (engine `core/luana-core-copilot/api/chat.py` emits this) and string deltas. This was the `[object Object]` bug fixed earlier; matches copilot-expert SSE v2 `block_delta`/`block_append` block types. PASS.

## Contract / UI-SPEC Compliance

- [x] Live-verified SC (SC-chat-ok, login-tenant-nav) match 04-validators § reconciliation `live_verified` (must_pass: true)
- [x] Deferred SC (SSE error/network/double-send/delegate + shell polish) declared `must_pass: false` per HB-79 reconciliation — NOT run against non-existent specs (correct: no verde-fantasma)
- [x] Deferred SSE behaviors genuinely unit-covered: `chat-store.test.ts` 18 tests with concrete assertions (SC-chat-error 5xx + stream-error-event, SC-chat-network abort/null-body, SC-chat-double-send no-op while thinking+streaming, SC-chat-delegate endpoint-only) — NOT vacuous fallback guards
- [x] RN-2 (tenant via useTenantId, not Clerk org): grep 0 `useOrganization`/`useAuth().orgId` in product code; arch-test green
- [x] RN-7 (engine único — copilot /chat): exercised live, real kimi stream
- [x] autonomous_mode=true → G demo exempt; auditor live-verify + DB effect substitute the demo gate (Critical Rule #37)

## Allowlist Movement
- [x] No FE arch fitness allowlist grew. No shrink either (no arch test touched).

## Native-First Audit
- [x] No `docker exec ... tsc|eslint|vitest|playwright` in commit
- [x] No `make e2e` / `make e2e-smoke` — e2e run native (`E2E_BASE_URL=... npx playwright test`)
- [x] No `git add .` / `-A` / `-u` (commit is pathspec-scoped)
- [x] e2e specs import `../fixtures/base.ts` (anti-burbuja gate), NOT `@playwright/test` directly — gate present
- [x] e2e does NOT mock the backend of the surface under test (real `/api/v1/comunify/copilot/chat`) — not a false green

## Live Verification Audit
- [x] **User-facing write exercised live by auditor:** `E2E_BASE_URL=http://localhost:3003 npx playwright test --project=shell-organism` → **4 passed (26.6s)** (clerk setup ×2 + login→tenant + SC-chat-ok real LLM stream)
- [x] **Effect confirmed in DB (tenant-scoped):** before run `copilot_trace_event`=20 / `copilot_llm_call`=7 / `copilot_conversations`=7 → after auditor run **29 / 11 / 8** — the write produced NEW persisted rows (real conversation + real LLM call). Stack: BE :8003 health 200, FE :3003, gateway luana_litellm_dev Up.
- [x] **Not 401/404:** chat returned real streamed content (bot bubble >20 chars, ≠ echoed question), anti-burbuja gate (base.ts) green (0 `/api` 4xx-5xx tragados).

## Upstream / engine debt (deferred to /pm-luana — NOT this story's fault, non-fatal)
- Copilot persona voice: engine `_BASE_IDENTITY` hardcoded "Nicolify" (cross-brand) → Nina uses generic identity. Correctly re-diagnosed (prompt_versions is sales_agent-only; a migration would be dead code). Engine work → `/pm-luana`. Learning captured (`comunify/docs/learnings/2026-06-17-engine-deuda-surfaced-by-shell-organism.md`, promotable). Non-fatal — chat works.
- Settings legacy 16 required fields → Optional (follow-up of accepted proposal 2026-06-16-copilot-chat-brand-mountable).

These are NOT auditor findings against the FE diff — they are upstream/engine items already correctly routed. No new `## Upstream deficiency` to raise: the architect's reconciliation + checkpoint already name them and route to /pm-luana.

## Verdict Math
- No FAIL in categories 1/2/3/7/11/12/14/15/16 → not FAIL on category grounds
- No Cat 16 FAIL (no reinvented primitive; avatar placeholder is in-scope per playwright_visual_scope notes)
- No allowlist/warning-baseline growth → not FAIL
- All `/test-frontend` blockers (tsc/eslint/vitest) GREEN → not FAIL
- LIVE_VERIFY satisfied: story is `funcional` + `demo_required: true`; `dod_live_verified: true` + `dod_evidence` present AND auditor independently exercised ≥1 real write live (real backend, not mock, DB effect confirmed) → live-verify gate PASS
- e2e imports `base.ts` (not `@playwright/test` directly) + does not mock surface-under-test → no false-green
- 0 category WARNs → not WARN
- **→ PASS → APPROVED**

Next handoff: `/pm-comunify` merge (07-merge + archive story R2 + capability comunify/shell-organism).
