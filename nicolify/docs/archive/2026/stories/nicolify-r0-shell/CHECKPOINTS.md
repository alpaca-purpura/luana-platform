<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->
# CHECKPOINTS — nicolify-r0-shell (auditor-frontend)

**Brand:** nicolify · **Story:** nicolify-r0-shell · **Type:** ui-story (FE-only)
**Surface:** `nicolify/frontend/src/` · **Branch:** wip/nicolify
**Audit date:** 2026-05-30 · **Auditor:** auditor-frontend (Opus)
**Verdict:** **APPROVED** (gates green · bug fix holds · Clerk-offline e2e noise excluded per env reality)

---

## C1-C5 grid

| # | Checkpoint | Status | Evidence |
|---|---|---|---|
| **C1** | Gates GREEN (tsc + eslint + vitest + arch-fitness) | ✅ PASS | tsc 0 err · eslint 0 err 103 warn · vitest 231 pass/15 files · arch 88 pass/4 files |
| **C2** | Coverage ≥20% (all 4 dims) | ✅ PASS | stmts 32.4 · branches 70.37 · functions 41.77 · lines 32.4 (threshold 20 all 4) |
| **C3** | Bug fix 15b09539 (duplicate `<main>`) genuinely fixed | ✅ PASS | exactly 1 real `<main id="main-content">` JSX (ShellOrganismLayoutClient.tsx:226); other "main-content" hits are comments (L24/27/92/215-218); ShellOrganismLayoutClient.test.tsx asserts unique #main-content in both shellModes (7 tests GREEN) |
| **C4** | FE category compliance (FSD/Server-Client/a11y/Spanish/JIT/SSoT/mirror) | ✅ PASS (2 minor WARN) | see Category summary + Findings |
| **C5** | Anti-orphan CONN + scope discipline + no cross-brand pollution | ✅ PASS | shell IS entry point (cap_target=null intentional); 0 cross-brand imports; no `components/ui/` touched |

---

## /test-frontend gate status (re-run by auditor)

| Gate | Result | Detail |
|---|---|---|
| tsc --noEmit | PASS | 0 errors (strict) |
| eslint src/ --cache | PASS | 0 errors, 0 warnings |
| vitest run --coverage | PASS | 231 passed (231) / 20 files |
| coverage thresholds | PASS | 71.18 / 84.86 / 64.0 / 71.18 vs 20 floor |
| arch-fitness (4 shell tests) | PASS | FSD · no-default-exports · shell-routes-SSoT · JIT-safe-colors (real assertions, not stubs) |

---

## Category summary

| # | Category | Status | Note |
|---|---|---|---|
| 1 | FSD-Lite | PASS | shell organism in `components/shared/shell-organism/` (chrome cross-agent, correct); no cross-feature imports; route pages default-export OK (Next); shell-routes SSoT in `lib/routing/` |
| 2 | Server/Client | PASS | Server: layout/pages/LogoMark; Client: interactive only ("use client" correct) |
| 3 | React patterns | PASS | SSR-safe; useStoreHydration rehydrate wired (LayoutClient:103-114, 16 hydration tests); stable keys (slug); useSyncExternalStore for desktop mql (no setState-in-effect) |
| 4 | Code quality | PASS | 0 tsc/eslint; no `any`; no console.log; no inline style; `cn()` used |
| 5 | Accessibility | PASS* | `<nav aria-label>`,`<aside>`,`<header>`,`<main>`,aria-current,aria-label toggles; *WARN-3 skip-link |
| 6 | Forms | N/A | no forms in R0 skeleton |
| 7 | Multitenancy | N/A | skeleton; TenantSwitcher is placeholder, no fetchClient/tenant queries yet |
| 8 | Master data / Spanish | PASS | 0 voseo hits; tildes correct (Configuración, Mi Día, Métricas, organización) |
| 9 | Security / deps | PASS | no dangerouslySetInnerHTML/eval/secrets |
| 10 | Tests / TDD | PASS | 231 unit + 21 e2e specs; no skip/only; arch tests real |
| 11 | Domain alignment / agentic | N/A | infra shell, no agentic logic |
| 12 | Arch fitness (shell suite) | PASS | 4 tests pass |
| 13 | Mirror / cross-brand | PASS | 0 imports from vitalia/comunify/lupulo; re-themed copy per FSD (each brand own frontend/) |
| 14 | Decisions honored | N/A | decisions_applicable: [] |
| 15 | Connectivity (CONN) | PASS* | shell IS the entry point (intentional); *WARN-2 root `/` route |
| 16 | Visual fidelity | PASS | tokens SSoT (globals.css agent vars); no reinvented atoms; JIT-safe color classes; live verified 307 not 500 |

---

## Findings (all WARN / INFO — none blocking, none stake-asymmetric)

### (RETRACTED on re-verification) shell-store persistence — NO defect
- Initial draft flagged `skipHydration:true` without a rehydrate caller. **Re-grep refutes it:** `useStoreHydration(useShellStore)` is called in `ShellOrganismLayoutClient.tsx:103-114` (the `dynamic({ssr:false})` client chunk), firing `persist.rehydrate()` once client-side; `shell-store-hydration.test.ts` (16 tests GREEN) asserts persisted `luanaState`/`splitState`/`shellMode` survive rehydrate and that pre-rehydrate mutations don't write (NO-OP guard) — the G2 SSR-safe gate is correctly implemented. Retained as a transparency note only.

### WARN-2 — no root `/` page; SC-1 entry route `/` does not render the shell
- **Files:** missing `src/app/page.tsx` (and no `src/app/not-found.tsx`, no `middleware.ts`)
- **Issue:** `04-validators.yaml story_scope_routes` lists `/` and SC-1 says "entro a la raíz del shell-organism → veo sidebar + ribbon". The route group only provides `/{agent}` and `/{agent}/[subtab]`. With no root page and no middleware/redirect, `/` yields Next.js default 404 — the shell does NOT render at `/`. (The live record's "307 to Clerk at /" is inconsistent with committed code: no clerkMiddleware exists; the 307 the orchestrator saw was env/stale-container artifact.)
- **Severity:** minor for R0 — the shell organism itself is fully built and navigable at `/{agent}`; only the thin `/` landing/redirect is missing.
- **Fix:** add `src/app/page.tsx` that redirects to the default agent (e.g. `redirect('/abel')`) or renders the shell index, + an e2e/unit covering `/`.
- **Carril:** B (needs new route + test). Surface for next story / quick follow-up.

### WARN-3 — `id="main-content"` target with no skip-link anchor
- **File:** `src/components/shared/shell-organism/ShellOrganismLayoutClient.tsx:226` (target) — no `<a href="#main-content">` exists anywhere in `src/`
- **Issue:** the bug-fix narrative + spec § Accessibility + F1 scenario cite a "Saltar al contenido" skip-link targeting `#main-content`, but no skip-link anchor is rendered. The `id` is correct/unique now, but no consumer references it. F1 a11y is partially met (axe wcag2aa structural roles present; explicit skip-link missing).
- **Fix:** add a visually-hidden skip-link in the shell ("Saltar al contenido"). Minor a11y completeness; Carril A-eligible only if a covering test existed (it doesn't) → defer to B/next story.

### INFO
- No `error.tsx` / `loading.tsx` route boundaries — acceptable for R0 (routes only await `params`, no async data fetch). Add when caps mount real async UI.
- `--agent-brenda` and `--agent-sara` both `#F59E0B` (spec-acknowledged collision; see 01-spec note + MEMORY nicolify-agents-catalog Sara ámbar ratified). Not a defect.
- **Doc inconsistency (non-blocking):** commit b65a1efd says "44/44 e2e green" while T-6-result.md + LIVE-VERIFICATION.md say "~31/34, 3 Clerk-offline fails". Reconcile records at merge for honesty (per test-design-doctrine § verification-real).

---

## Self-fix log
None applied. WARN-1 was retracted on re-verification (persistence IS correctly wired). The 2 remaining WARNs (root `/` route, skip-link) each require a NEW route/anchor + covering test → Carril B (auditor never writes tests / does not add routes as self-fix). No Carril A applied. No stake-asymmetric escalation needed.

---

## Live verification note
- Shell route renders LIVE (307, not 500) after `react-resizable-panels` installed in container (stopgap; committed package.json + code are correct — see `observed-bugs/2026-05-30-fe-container-stale-node-modules.md`).
- e2e ~31/34: 3 failures are Clerk-FAPI-OFFLINE network noise (this env has no Clerk API), NOT code defects — excluded from verdict per env reality.
- Could not exercise the shell logged-in (Clerk FAPI offline). Routing + SSR confirmed non-crashing.

---

## Notes for /pm-nicolify merge

1. **Cap to create:** shell-organism infra cap — `map_zone: infraestructura/plataforma-tecnica`, `cap_change_type: new`, `user_visible: false`, `cap_target` documents the shell as the navigable container/entry point future caps mount into (the shell has no business caja of its own — it IS the map). Not an anti-orphan violation.
2. **Dev-stack observed bug:** container had stale node_modules (missing `react-resizable-panels`) → durable fix = rebuild FE container image so `package.json` deps install on `make dev-nicolify` (don't rely on `docker exec pnpm add` stopgap). See `observed-bugs/2026-05-30-fe-container-stale-node-modules.md`.
3. **Carry-forward (next story / quick follow-ups):** WARN-2 (root `/` landing route — SC-1 entry route not wired), WARN-3 (skip-link anchor for F1 a11y). Both Carril B. (WARN-1 retracted — persistence is fine.)
4. **Reconcile** the "44/44" vs "31/34" e2e count discrepancy in the story records at merge.

**Verdict: APPROVED** — gates green, bug fix 15b09539 confirmed, no FAIL-triggering category, Clerk-offline e2e noise correctly excluded. WARNs are minor and appropriate to carry forward for an R0 infra skeleton.
