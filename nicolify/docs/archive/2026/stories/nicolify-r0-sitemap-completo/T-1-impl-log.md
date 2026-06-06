---
story_id: nicolify-r0-sitemap-completo
ticket: T-1
builder: builder-frontend (Sonnet 4.6)
started: 2026-06-02
cap: shell-organism.shell-nicolify
---

# T-1 Impl-Log — shell-routes v3 tree + N3 route + content-map

## § Skills Consulted (must_load enforcement v4.1)

| Skill / Rule | Status | Decision |
|---|---|---|
| `frontend-expert` | Loaded | Server-First default; FSD-Lite boundaries; Next.js 16 App Router `await params`; `tsc --noEmit` + eslint gate; vitest coverage ≥20% |
| `nicolify-design-system` (alias `brand-expert`) | Loaded | Labels español neutro tuteo; reusa `EmptyState` molécula; N3-static SubSubTabsBar data-driven; JIT-safe Tailwind classes |
| `frontend-fsd.md` | Loaded | Boundary matrix: `app/` → `components/shared/` → `lib/` OK; no cross-feature imports |
| `frontend-quality.md` | Loaded | ESLint 0 errors, tsc strict, vitest ≥20% |
| `frontend-visual-fidelity.md` D3 | Loaded | Scope discipline: ONLY what 06-tickets.yaml deliverables scope — no real leaf content |
| `spanish-text.md` | Loaded | Neutro tuteo; sin voseo; labels in Spanish; "Próximamente" (con tilde) |
| `anti-orphan-integration.md` CONN | Loaded | Every leaf N3 gets a navigable route + registered in SubTabContent — no island |
| `shell-feature-architecture.md` | Loaded | ADR-nicolify-001 `adr_001_compliance: partial-with-rationale` (routing data build, not new feature sub-tab) |

Skills NOT invoked (not applicable): `offer-expert`, `copilot-expert`, `sales-agent-expert`, `metrics-expert` — T-1 is pure routing data + Server Component shell, no agentic/offer/analytics domains.

## § Plan

### Technical design (before coding)

**Design-system-first (D1):**
- Reuse `EmptyState` from `components/shared/shell-organism/EmptyState.tsx` — no new atoms
- `SubTabContent` adds `subsubtab?` prop, extends existing `SUBTAB_CONTENT_MAP` with N3 keys
- No new Tailwind classes — literals only, no template literals (G3)

**Mockup adherence + scope (D2+D3):**
- Story scopes ONLY data rewrites + N3 route shell — NO leaf content
- N3 leaves render same EmptyState pattern as N2
- Sara: single subtab `proximamente` with "Próximamente" copy

**Batería de tests:**
- `coverage_update` on `shell-routes.test.ts` (data changes: v3 arrays + `isValidSubSubTab` guard)
- `coverage_update` on `test_shell_routes_ssot.test.ts` (Sara block: "proyectos" → "proximamente")

**Integration CONN:**
- `[subsubtab]/page.tsx` = the N3 route (Navigable + Notarized via App Router discovery)
- `SubTabContent` = the dispatcher (Consumed by both N2 and N3 pages)
- Every leaf key in `SUBTAB_CONTENT_MAP` (On the map)

**Cap header:** `// cap: shell-organism.shell-nicolify` on line 1 of all new/modified production files.

### Iteration log

**RED tests first:** Updated `shell-routes.test.ts` with v3 arrays → FAILS against old arrays. Updated `test_shell_routes_ssot.test.ts` with "proximamente" → FAILS ("proyectos" still in source).

**GREEN implementation:**
1. Rewrote `shell-routes.ts` AGENT_SUBTABS + AGENT_CATALOG.defaultSubtab + AGENT_SUBSUBTABS + `isValidSubSubTab`
2. Updated `agent-catalog.ts` defaultSubtab + Sara tabLabel
3. Rewrote `SubTabContent.tsx` SUBTAB_CONTENT_MAP (v3 N2 keys + 8 N3 leaf keys) + `subsubtab?` prop
4. Created `[subsubtab]/page.tsx` (clon del patron [subtab]/page.tsx)
5. Created `[subsubtab]/not-found.tsx` (clon de [subtab]/not-found.tsx)
6. Updated tests GREEN

## § Mockup scope notes

Out of scope (mockup shows but NOT built in T-1):
- Real feature content for any leaf (ICP, inbox, cartera, etc.) — those are R1..R5
- e2e fixtures/specs — those are T-2
- Any new `features/{agent}/` directory
