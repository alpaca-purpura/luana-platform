<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# Frontend Code Review: vitalia-slice-1-inbox — FE summary

**Date:** 2026-05-20
**Brand:** vitalia
**Story:** vitalia-slice-1-inbox
**Branch:** wip/vitalia HEAD 5aa590c
**Files Reviewed:** 88 (62 TSX + 4 hooks + 9 api + types + tests + e2e)
**Domains touched:** inbox (NEW), crm-shared (NEW producer), lib/zod-schemas
**Skills consulted:** frontend-expert · brand-expert (voice style chip read) · offer-expert (tools sheet contract) · copilot-expert (activity stream / trace events) · sales-agent-expert (Adrián tools surface) · metrics-expert (n/a) · tessl__react-patterns (baseline) · tessl__shadcn-ui · tessl__tailwind · tessl__zod · tessl__nextjs-app-router-modularization · tessl__vitest
**Live-verified:** NO (chrome-devtools-verify DEPRECATED Linux Mint; Chris staging gate deferred per result docs) — flagged
**Verdict:** **CHANGES_REQUESTED**

## /test-frontend Gate Status (re-run by auditor 2026-05-20 09:53 UTC)

| Gate | Step | Result | Detail |
|---|---|---|---|
| QUALITY | tsc --noEmit | PASS | EXIT 0 |
| QUALITY | ESLint (60+ rules) inbox + crm-shared | PASS | 0 errors |
| QUALITY | Arch fitness (10 test files) | PASS | 42/42 tests GREEN |
| FUNCTIONAL | Vitest inbox + arch | PASS | 35 files / 257 tests GREEN |
| HEALTH | (jscpd / knip / madge / npm audit) | NOT RUN — no gate-output.json; falls outside FE per-ticket scope. PRE-AUDITOR-VALIDATION § 41-55 attests baseline GREEN |

A FAIL on steps 2/3/4 or any of the 20 arch fitness tests = automatic verdict FAIL. None failed.

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | FSD-Lite | PASS | 0 |
| 2 | Server/Client | WARN | 1 (page.tsx has metadata + dynamic — OK; InboxPageClient renders only placeholders) |
| 3 | React Patterns | FAIL | 1 (no route-level Error Boundary; no error.tsx / loading.tsx) |
| 4 | Code Quality | PASS | 0 (TSC + ESLint + arch fitness GREEN; baselines respected — no new ratchet growth except justified MessageInput.tsx + VoiceMessagePlayer.tsx documented in commit) |
| 5 | Accessibility | WARN | 1 (a11y axe scan never executed live; tests scaffold-only — see § Live verification audit) |
| 6 | Forms (RHF + Zod) | PASS | 0 (Zod schemas leadSchema + conversationSchema cementados; no RHF needed Slice 1 — composer is plain input/MediaRecorder) |
| 7 | Multitenancy | PASS | 0 (fetchClient auto-injects X-Tenant-ID + X-Clinic-ID; no hardcoded tenantId — use-transcribe-audio uses bare fetch but injects X-Tenant-ID + X-Clinic-ID headers correctly) |
| 8 | Master Data / Spanish | **FAIL** | 4 (toLocaleDateString / toLocaleTimeString / Intl.DateTimeFormat usage in 4 files violating master-data.md `formatTenantDate*()` mandate) |
| 9 | Security / Deps | PASS | 0 (no dangerouslySetInnerHTML, no eval, React JSX escapes XSS — SC-04 covered in spec + test_xss_escaped_as_literal) |
| 10 | Tests / TDD | WARN | 2 (use-transcribe-audio + use-attach-media hook tests missing per T-inbox-fe-2 § files_in_scope; smoke + a11y + adversarial NOT executed live — scaffold branch only) |
| 11 | Domain Alignment / Agentic UI | PASS | 0 (Activity Stream consumes activity-stream endpoint reading copilot_trace_event indirectly via BE service per anti-duplication.md; AdrianToolsSheet read-only consume tools-state; ProactiveOutboundModal 5 HSM templates hardcoded per Slice 1 explicit guideline) |
| 12 | Architecture Fitness (10 tests) | PASS | 0 (42/42 GREEN — new arch test test_no_hardcoded_strings_inbox shipped + KNOWN_INLINE_COPY_VIOLATIONS baseline empty, but coverage WARN advisory for 5 components without INBOX_COPY import) |
| 13 | Mirror detection | PASS | 0 (no cross-brand runtime imports; fork pattern ratified ADR-vitalia-001 documented in headers only) |
| 14 | Decisions honored cite (R6) | N/A | ticket frontmatter not using `decisions_applicable` field (legacy ticket schema) |

## Findings

### FAIL #1 — Master-data violations (Category 8) — 4 files

Spec rule `.claude/rules/master-data.md` forbids `toLocaleDateString()`, `toLocaleTimeString()`, raw `Intl.DateTimeFormat`, and hardcoded locale strings. Vitalia ships `formatTenantDate*()` helpers in `vitalia/frontend/src/lib/format/` — confirmed via `grep formatTenantDate`. None used in inbox feature.

**File:** `vitalia/frontend/src/features/inbox/components/ContactSidebar.tsx:235`
```ts
{new Date(entry.recorded_at).toLocaleDateString("es-419", { day: "numeric", month: "short", year: "numeric" })}
```
**Fix:** import `formatTenantDate` from `@/lib/format/formatTenantDate`; use `formatTenantDate(entry.recorded_at, locale)` with locale from `useTenantLocale()`.

**File:** `vitalia/frontend/src/features/inbox/components/AgentActivityStream.tsx:82`
```ts
{new Date(event.occurred_at).toLocaleTimeString("es-419", { hour: "2-digit", ... })}
```
**Fix:** import + use `formatTenantTime()` or `formatTenantDateTime()` from `@/lib/format/`.

**File:** `vitalia/frontend/src/features/inbox/components/AdrianToolsSheet.tsx:86`
```ts
INBOX_COPY.toolsSheet.lastUsed.replace("{date}", new Date(invocation.invoked_at).toLocaleDateString("es-419", {...}))
```
**Fix:** use `formatTenantDateTime()` + interpolate via `formatCopy()` helper (already exists in `lib/copy.ts`).

**File:** `vitalia/frontend/src/features/inbox/components/ConversationItem.tsx:60`
```ts
return new Intl.DateTimeFormat("es-419", { day: "numeric", month: "short" }).format(date);
```
**Fix:** `Intl.DateTimeFormat` raw is the same violation as `toLocaleDateString`. Migrate `formatRelativeTime()` helper to consume `useTenantLocale().locale` and `formatTenantDate*()`.

**Why this is FAIL (not WARN):** master-data.md is a HARD rule (Cat 8 ratchet — `master-data.md` explicit "Prohibido: `toLocaleDateString()`"). 4 violations in user-facing components. Locale "es-419" hardcoded — tenant may be MX/AR/CL/PE/CO. Inbox is a daily-operation surface; format inconsistency between this and rest of vitalia (FidelizacionKPIs, DepositBadge) will be visible to users.

**Skill ref:** `.claude/rules/master-data.md` + `backend-expert` references/master-data.md.

---

### FAIL #2 — No route-level Error Boundary, no error.tsx, no loading.tsx (Category 3)

**File:** `vitalia/frontend/src/app/(app)/inbox/page.tsx` directory contains ONLY `page.tsx`. Per `tessl__react-patterns` baseline:
- Every route MUST have an Error Boundary at route-level (Next.js App Router idiom = `error.tsx` co-located).
- Every async UI SHOULD have a loading state (Next.js App Router idiom = `loading.tsx` co-located).

The `/inbox` route fetches conversations via React Query inside InboxPageClient. If `useConversations` throws, the user sees a blank screen or React's default error overlay. Cf. fidelizacion + brand-studio + offer-studio in vitalia (verify all add `error.tsx`).

**Fix:**
1. Create `vitalia/frontend/src/app/(app)/inbox/error.tsx` (`"use client"` + `reset()` retry + UI feedback in INBOX_COPY).
2. Create `vitalia/frontend/src/app/(app)/inbox/loading.tsx` (skeleton shell).
3. Optional: wrap InboxPageClient in ErrorBoundary from a shared `@/components/shared/error-boundary` if exists.

**Skill ref:** `tessl__react-patterns` § "Error boundary at every route-level component (page or layout) — absence = FAIL".

---

### FAIL #3 — Hardcoded Tailwind named color classes bypass design tokens (Category 4 + design-system drift)

Component files use raw Tailwind named colors `text-green-*`, `bg-amber-*`, `border-red-*`, `bg-black/N` — bypassing the brand design tokens (`vt-*` utilities + `--vitalia-*` CSS vars). The arch test `test_no_hardcoded_colors.test.ts` currently scans only `#RRGGBB / rgb() / hsl()` literals, NOT Tailwind named colors, so this slipped through.

**Files affected (verbatim grep):**
- `ContactSidebar.tsx:72-74` (NpsScoreBadge — 3 color tier classes `text-green-700 bg-green-50 border-green-200` + amber + red triplets)
- `AdrianToolsSheet.tsx:40-41,173` (status pills + hipaa-guard-note `border-amber-200 bg-amber-50 text-amber-700`)
- `ProactiveOutboundModal.tsx:106-107,228` (preview bubble `bg-green-100 text-gray-800 border-green-200` + success banner `bg-green-50 border-green-200 text-green-700`)
- All modals: `bg-black/40` backdrops (5 files) — minor (overlay convention, accept with explicit token suggestion)

**Fix:**
1. Use existing `vt-text-success`, `vt-bg-success-soft`, `vt-text-warning`, `vt-bg-warning-soft`, `vt-text-danger`, `vt-bg-danger-soft` utilities (per `globals.css`).
2. For NPS tiers (green/amber/red gradient): consider adding `vt-bg-nps-{promoter,passive,detractor}` semantic tokens to `globals.css`.
3. Extend `test_no_hardcoded_colors.test.ts` to also catch `\b(text|bg|border)-(green|amber|red|blue|yellow|purple|pink|indigo|cyan|orange|emerald|gray|slate)-\d{2,3}\b` pattern (separate follow-up ratchet — not required this PR).

**Skill ref:** `tessl__tailwind` § "semantic tokens (no hex colors hardcoded)" + vitalia globals.css design-system contract.

---

### FAIL #4 — InboxPageClient renders ONLY placeholders despite 22+ built components (Category 2 + Spec compliance)

**File:** `vitalia/frontend/src/features/inbox/components/InboxPageClient.tsx` lines 33-52.

InboxPageClient still renders `ConversationListPlaceholder`, `ThreadPlaceholder`, `ContactSidebarPlaceholder` (lines 54-100). All comments still say `"replaced by ConversationListPanel in T-inbox-fe-3"`, `"replaced by ConversationThread in T-inbox-fe-4"`, `"replaced by ContactSidebar in T-inbox-fe-5"` — but those tickets are marked DONE in PRE-AUDITOR-VALIDATION.

**Consequence:**
- The `/inbox` route in production shows ONLY placeholder boxes. No real conversation list, no real thread, no segmented control, no composer, no Adrián tools sheet, no PHI contact sidebar.
- E2E smoke tests pass because both `test_segmented_control_toggles` and `test_audio_low_confidence_fallback` fall through to the "scaffold branch" detector (`isVisible({timeout: 3_000}).catch(() => false)`). Per `T-inbox-integ-1-result.md § Scaffold-aware note`, full assertions only activate "automatically when InboxPageClient.tsx is updated to wire real components".
- Per Gherkin SC-01: "operador María abre /inbox → ve 12-30 convs WhatsApp+IG+Email unificadas, segmented a Adrián decide, envía + receipt undo chip aparece 5min". This scenario is NOT exercisable through the real UI today.

**Fix:** Wire InboxPageClient to consume real components:
```tsx
"use client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useInboxStore } from "../store/inbox-store";
import { useInboxUrlState } from "../url-state";
import { useConversationDetail } from "@/features/crm-shared";
import { useToolsState } from "../api/use-tools-state";
import { InboxLayout } from "./InboxLayout";
import { ConversationListPanel } from "./ConversationListPanel";
import { ConversationThread } from "./ConversationThread";
import { ContactSidebar } from "./ContactSidebar";
import { AgentActivityStream } from "./AgentActivityStream";
import { AdrianToolsSheet } from "./AdrianToolsSheet";

export function InboxPageClient() {
  const contactSidebarOpen = useInboxStore((s) => s.contactSidebarOpen);
  const toolsSheetOpen = useInboxStore((s) => s.toolsSheetOpen);
  const closeToolsSheet = useInboxStore((s) => s.closeToolsSheet);
  const [{ lead: conversationId }] = useInboxUrlState();
  const { data: convDetail } = useConversationDetail(conversationId);

  return (
    <NuqsAdapter>
      <InboxLayout
        contactSidebarOpen={contactSidebarOpen}
        conversationListSlot={<ConversationListPanel />}
        threadSlot={
          <>
            <ConversationThread conversationId={conversationId} detail={convDetail} />
            <AgentActivityStream conversationId={conversationId} />
          </>
        }
        contactSidebarSlot={
          convDetail && (
            <ContactSidebar
              conversationId={convDetail.conversation.id}
              leadId={convDetail.lead.id}
              contact={{
                patientId: convDetail.lead.id, // hash
                name: convDetail.lead.name,
                phone: convDetail.lead.phone,
                email: convDetail.lead.email,
                statusTag: convDetail.conversation.stage_decision,
                npsHistory: convDetail.nps_history ?? [],
              }}
            />
          )
        }
      />
      <AdrianToolsSheet open={toolsSheetOpen} onClose={closeToolsSheet} conversationId={conversationId} />
    </NuqsAdapter>
  );
}
```

Re-run E2E smoke after wiring — the "Phase 2 full assertions" branch will activate naturally per `T-inbox-integ-1-result.md`.

**Skill ref:** Story Gherkin SC-01 / SC-02 / SC-03 + UI-SPEC § 3 component tree.

---

### WARN #1 — 5 inbox components missing INBOX_COPY import (Category 12 advisory)

`test_no_hardcoded_strings_inbox.test.ts` arch test logs advisory (line 248 `console.warn` — does NOT fail):
```
[WARN] Inbox UI components sin import INBOX_COPY:
  - ComposerArea.tsx · ConversationItem.tsx · ConversationList.tsx
  - ConversationListPanel.tsx · ThreadHeader.tsx
```

ConversationListPanel.tsx line 138 has hardcoded `"No se pudieron cargar las conversaciones. Intenta de nuevo."` — should live in `INBOX_COPY.errors.conversationsLoadFailed`.

Additionally 13+ aria-labels with hardcoded Spanish strings detected via grep (`InboxLayout.tsx:57,66`, `ConversationList.tsx:85,115`, `MessageBubble.tsx:56,72,209,235`, `ConversationItem.tsx:137,157`, `ProactiveOutboundModal.tsx:109,208`, `AdrianToolsSheet.tsx:146`, etc.). These slip past `test_no_hardcoded_strings_inbox` because that test only catches JSX text nodes, not aria-* attributes.

**Fix:** move all user-facing aria-labels + the load-fail error string to `INBOX_COPY` namespace. Consider extending arch test to also scan `aria-label`/`aria-labelledby`/`aria-describedby` attribute literal strings.

---

### WARN #2 — 2 hook tests missing per ticket T-inbox-fe-2 scope (Category 10)

Ticket T-inbox-fe-2 § `files_in_scope` listed test files for all 11 hooks; only 6 hook tests exist:
- ✅ use-send-message · use-retract-message · use-set-mode · use-activity-stream · use-pause-adrian · use-proactive-outbound
- ❌ `use-transcribe-audio.test.ts` MISSING
- ❌ `use-attach-media.test.ts` MISSING

Both hooks are production code (transcribe-audio is SC-02 critical path; attach-media handles composer file uploads). Tests should cover: success path, abort/timeout (60s in transcribe), 401, multipart Content-Type correctness, response shape validation.

**Fix:** add 2 test files following pattern of `use-send-message.test.ts`. SC-02 Gherkin coverage cited in ticket gherkin_coverage assumes transcribe test exists — it doesn't.

---

### WARN #3 — Live verification + a11y axe + adversarial NEVER executed (Category 5 + Category 10)

Per `PRE-AUDITOR-VALIDATION.md § Deferred to auditor`:
- `inbox.adversarial.spec.ts` — "scaffold compiles; runtime deferred to auditor Phase D"
- `inbox.a11y.spec.ts` — "scaffold compiles; runtime deferred to auditor Phase D"
- smoke 5/5 LIVE PASS — but per `T-inbox-integ-1-result.md`, those are "scaffold-aware" tests that fall through when real components aren't wired (which they aren't, per FAIL #4).

**chrome-devtools-verify**: DEPRECATED for Linux Mint per skill header. Chris staging gate (manual) not yet performed for inbox per checkpoint.md § `preflight_gates_deferred_followup.playwright_smoke_suite_green_live: DEFERRED`.

**Fix:**
1. Wire InboxPageClient (FAIL #4) first.
2. Run `cd vitalia/frontend && E2E_BASE_URL=http://localhost:3002 npx playwright test e2e/specs/regression/inbox.adversarial.spec.ts e2e/specs/a11y/inbox.a11y.spec.ts` against live `make dev-vitalia`.
3. Document results in `06-audit/playwright-followup.md`.
4. Chris staging gate manual verify per checkpoint.md follow-up.

If FAIL #4 is fixed by builder + adversarial + a11y pass post-wire, this WARN clears.

---

### WARN #4 — Missing useTenantLocale consumption in inbox (Category 8 sub-violation)

InboxLayout, ConversationItem, AgentActivityStream, ContactSidebar, AdrianToolsSheet all need locale for date/time formatting (FAIL #1 fix), but `useTenantLocale()` is not imported anywhere in `features/inbox/`. The tenant locale source-of-truth has been ignored entirely.

**Fix:** part of FAIL #1 fix. Single hook call per Client Component that renders dates: `const { locale, timezone } = useTenantLocale()`.

---

## Contract / UI-SPEC Compliance

- [x] All TypeScript types from 03-arch-fe.md § 4 implemented (camelCase mirror via Pydantic v2 server-side; FE types in `types/message.ts`, `crm-shared/types.ts`).
- [x] All components from 03-arch-fe.md § 1 implemented (verify: 33 NEW vitalia components present + 7 REUSE adapter forks present).
- [x] React Query keys + invalidation per 03-arch-fe.md § 5 (`_keys.ts` has `conversationsListKey`, `conversationDetailKey`, `activityStreamKey`, `toolsStateKey`).
- [x] Optimistic + OCC SC-03 pattern from § 6 (verified in `use-set-mode.ts` + `use-retract-message.ts`).
- [x] PHI components Story 11 shared consumed (PiiMaskedSpan + RequireRole + AuditedSection in ContactSidebar — verified).
- [x] INBOX_COPY single-locale tree-shakable (`copy.ts` exists + namespace structure correct per arch test).
- [x] Reuse adapter pattern (fork físico) with retoken — verified in headers + grep (no cross-brand imports).
- [x] FSD-Lite boundaries respected (no deep cross-feature imports — `crm-shared` consumed via Public API only).
- [ ] **Component tree wired** — InboxPageClient still renders placeholders despite 22+ built components (FAIL #4).
- [x] Test surfaces from § 14 exist in code (35 vitest files + 4 Playwright specs).
- [ ] Test surfaces actually executed live for adversarial + a11y (WARN #3).
- [x] capability YAML + modules/{m}.md (post-merge action — N/A for this audit phase).

## Allowlist Movement

- `test_no_hardcoded_colors.test.ts::KNOWN_COLOR_VIOLATIONS` GREW by 2 entries (`MessageInput.tsx` + `VoiceMessagePlayer.tsx`) — JUSTIFIED in `T-inbox-fe-6-result.md` § "Architecture test ratchet" + commit 6f72b04 body. Not a FAIL.
- `test_no_hardcoded_strings_inbox.test.ts::KNOWN_INLINE_COPY_VIOLATIONS` remains empty (baseline frozen at T-inbox-fe-7).
- `test_fsd_boundaries.test.ts` — 1 allowlist exception for crm-shared producer pattern (justified in T-inbox-fe-1-result.md).

## Native-First Audit

- [x] No `docker exec ... tsc|eslint|vitest|playwright` in commits inspected.
- [x] No `make e2e` / `make e2e-smoke` — Playwright run native via `npx playwright test`.
- [x] No `git add .` / `git add -A` / `git add -u` in commits inspected (per PRE-AUDITOR-VALIDATION § Commit hygiene exceptions — some broad-add commits but file lists documented + justified).

## Live Verification Audit

- ❌ **chrome-devtools-verify NOT invoked** (DEPRECATED Linux Mint). No screenshots, no DOM diffs, no network logs, no console captures attached to any T-inbox-fe-*-result.md.
- ❌ **Chris staging gate manual NOT performed** for inbox per checkpoint.md `preflight_gates_deferred_followup.playwright_smoke_suite_green_live: DEFERRED`.
- ⚠️ Without live verification gate AND with FAIL #4 (placeholders only), the assertion "build phase done · tests-passing" understates risk. SC-01..SC-04 scenarios cannot be confirmed visually until InboxPageClient is wired AND staging walk-through performed.

## Verdict Math

- 4 FAILs (Cat 2/3 + Cat 8 + Cat 8 spec-compliance via FAIL #4 wiring gap): **overall FAIL** → translates to **CHANGES_REQUESTED** (auditor-self-fix-policy → spawn dev-team to fix FAIL #4 wiring + FAIL #1 master-data + FAIL #2 error boundary + FAIL #3 named-color refactor).
- All FAILs are in NEVER-self-fix categories (branch logic / refactor 2+ files / contract wiring) — auditor cannot self-fix.
- No category 1/7/11/12/14 FAIL.
- All `/test-frontend` blockers GREEN.
- No baseline GREW without justification.

## Spawn dev-team scope recommendation (auditor → builder-frontend)

```
Agent({
  description: "Auto-fix vitalia-slice-1-inbox FE findings",
  subagent_type: "builder-frontend",
  model: "sonnet",  // production_code: false (component wiring + utility refactor, no LLM)
  prompt: "<brand>: vitalia
           <pr_folder>: vitalia/docs/product/stories/vitalia-slice-1-inbox/
           ticket: T-inbox-fe-6-fix (consolidates audit findings)
           mode: AUDITOR_AUTO_FIX_LOOP
           findings_source: vitalia/docs/product/stories/vitalia-slice-1-inbox/06-audit/REVIEW-fe-summary.md § Findings

           Fix targets (in order):
           1. FAIL #4 — Wire InboxPageClient with real ConversationListPanel + ConversationThread + ContactSidebar + AgentActivityStream + AdrianToolsSheet (suggested wire snippet in REVIEW.md).
           2. FAIL #1 — Replace 4 toLocaleDateString/toLocaleTimeString/Intl.DateTimeFormat usages with formatTenantDate*() from @/lib/format/ + consume useTenantLocale() (4 files: ContactSidebar.tsx, AgentActivityStream.tsx, AdrianToolsSheet.tsx, ConversationItem.tsx).
           3. FAIL #2 — Create error.tsx + loading.tsx in app/(app)/inbox/.
           4. FAIL #3 — Replace text-green-*/bg-amber-*/border-red-* etc Tailwind named colors with vt-* semantic utilities in ContactSidebar.tsx, AdrianToolsSheet.tsx, ProactiveOutboundModal.tsx. If semantic token missing, add to globals.css.
           5. WARN #1 — Move 13+ hardcoded aria-label strings + ConversationListPanel.tsx:138 error string to INBOX_COPY.
           6. WARN #2 — Add use-transcribe-audio.test.ts + use-attach-media.test.ts.

           After fixes:
           - Re-run npx tsc --noEmit + eslint inbox/ + vitest src/features/inbox/ src/__tests__/architecture/ — all GREEN.
           - With dev stack running (make dev-vitalia), execute live E2E:
             E2E_BASE_URL=http://localhost:3002 npx playwright test e2e/specs/smoke/inbox.smoke.spec.ts e2e/specs/regression/inbox.adversarial.spec.ts e2e/specs/a11y/inbox.a11y.spec.ts
           - Phase 2 'full assertions' branch of inbox.smoke.spec.ts should now activate (real ConversationList/Thread visible).

           Last line: done -> T-inbox-fe-6-fix-result.md (or blocked -> with reason)"
})
```

## Note for /pm-vitalia (Phase F merge — DO NOT proceed yet)

Story state must remain `reviewing` until:
1. CHANGES_REQUESTED findings resolved (dev-team builder fix loop).
2. Re-audit GREEN.
3. Live verification: Chris staging gate manual walk-through OR Playwright full live (smoke + adversarial + a11y).
4. 07-merge.md authored with 5 cementadas sections per `.claude/rules/story-closure-gate.md`.

After APPROVED + merge, `git mv vitalia/docs/product/stories/vitalia-slice-1-inbox/ vitalia/docs/archive/2026/stories/vitalia-slice-1-inbox/` per `.claude/rules/brand-docs-schema.md § R2` in same commit.

---

AUDIT_FE: CHANGES_REQUESTED -> vitalia/docs/product/stories/vitalia-slice-1-inbox/06-audit/REVIEW-fe-summary.md
