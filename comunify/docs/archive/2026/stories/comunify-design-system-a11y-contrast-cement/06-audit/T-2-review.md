# T-2 Review — Arch fitness test RED baseline

**Brand:** comunify
**Story:** comunify-design-system-a11y-contrast-cement
**Ticket:** T-2
**Auditor:** auditor-frontend (Opus)
**Reviewed at:** 2026-05-20
**Verdict:** **APPROVED**

## Files reviewed

- `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts` (NEW, 4 vitest scenarios)
- `comunify/frontend/src/__tests__/architecture/_low-contrast-allowlist.json` (NEW, content: `[]`)

## Compliance vs spec

| Spec requirement | Status | Evidence |
|---|---|---|
| 6 HARD-blocked regex patterns per 01-spec § Arch fitness híbrido | ✅ | `bg-comunify-warning text-white`, `bg-comunify-stable text-white`, `bg-comunify-accent text-white`, `text-comunify-warning bg-comunify-bg`, `text-comunify-stable bg-comunify-bg`, `text-comunify-accent bg-comunify-bg` — all 6 covered |
| Critical/blue NOT blocked (opción C híbrida) | ✅ | grep verified: no patterns for `bg-comunify-critical text-white` o `bg-comunify-blue text-white` blocked |
| Allowlist baseline `[]` (clean slate ratchet) | ✅ | `_low-contrast-allowlist.json` content verbatim `[]` |
| Magic comment escape mechanism `// a11y-allow:` | ✅ | Mechanism documented in test (allowlist parses `// a11y-allow: <reason>` per file) |
| RED baseline captured (TDD discipline) | ✅ | T-2-result.md cites 13 violations in 7 source files before T-3 sweep — intentional RED |

## Findings

**None.** RED state intencional per TDD discipline (spec § Test Construction Plan v4.1 requires RED first, GREEN post-sweep en T-3).

## Validator evidence (3 from this phase)

- val-arch-1 (arch test RED baseline): CORRECT — 2 tests fail with 13 violations intencional ✅
- val-arch-3 (allowlist = `[]`): EXIT=0 ✅
- val-nf-1/2 (tsc + eslint del test file): EXIT=0 ✅

## Quality notes

- ✅ Regex SSoT consolidado en una declaración (no duplicated regex logic across 4 tests)
- ✅ Error messages cite `file.tsx:N — pattern (use X per design-system.md §6)` — actionable per spec
- ✅ Allowlist mechanism reuse del stock-palette pattern (consistencia cross-arch-test)

## Cross-cutting

- Tenant isolation: N/A (arch test)
- Spanish neutro: N/A
- Cross-brand pollution: 0 (test path scoped to `comunify/frontend/`)
- Engine boundary: PASS

## Verdict

**APPROVED** — RED baseline correctamente establecido. Patterns blocked verbatim per spec. Allowlist clean. Lista para T-3 sweep.
