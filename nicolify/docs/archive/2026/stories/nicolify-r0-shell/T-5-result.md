# T-5 Result — Ribbon + SubTabsBar + shell-routes.ts SSoT

**Ticket:** T-5
**Story:** nicolify-r0-shell
**Brand:** nicolify
**Date:** 2026-05-30
**Status:** tests-passing

---

## Summary

T-5 entrega el Ribbon (5 agentes Revenue/Ops + ConfigTab) + SubTabsBar (URL-derived sub-tabs) + SubSubTabsBar (N3-static vacío R0) + shell-routes.ts (SSoT completo con guards XSS whitelist). AppPanelSlot.tsx actualizado para reemplazar skeletons con los organismos reales.

---

## Deliverables completados

| Deliverable | Status |
|---|---|
| `shell-routes.ts` (NEW SSoT · AGENT_CATALOG + AGENT_RIBBON_ORDER + AGENT_SUBTABS + DEFAULT_LANDING + guards + extractors) | ✓ done |
| `Ribbon.tsx` (port · 5 tabs + Config · agent-color border · roving tabindex · mobile overflow-x-auto) | ✓ done |
| `RibbonTab.tsx` (port · AgentAvatar fallback + tabLabel + name · active state agentBgSoftClass) | ✓ done |
| `ConfigTab.tsx` (port · Settings icon · ml-auto · Tooltip "Configurar") | ✓ done |
| `SubTabsBar.tsx` (port · URL-derived active · roving tabindex) | ✓ done |
| `SubTab.tsx` (port · emoji icon + label · active bg-soft + agentTextClassSubTab) | ✓ done |
| `SubSubTabsBar.tsx` (port · N3-static · retorna null en R0 — AGENT_SUBSUBTABS vacío) | ✓ done |
| `SubSubTab.tsx` (port · molécula para N3 cuando R1+ active N3-static routes) | ✓ done |
| avatares: `public/agents/{abel,brenda,christian,sara,norvil}/avatar.svg` | ✓ already existed from T-4 |
| arch test: `test_shell_routes_ssot.test.ts` (SSoT enforcement + Sara constraint + DEFAULT_LANDING) | ✓ done |
| `AppPanelSlot.tsx` wired: replaced skeleton → real Ribbon/SubTabsBar/SubSubTabsBar | ✓ done |

---

## Tests (native ticket tests)

| Test file | Count | Status |
|---|---|---|
| `shell-routes.test.ts` | 28 | PASS |
| `test_shell_routes_ssot.test.ts` | 13 | PASS |
| All existing tests (14 files) | 221 | PASS |

---

## Gate output

```
TypeScript strict (tsc --noEmit): 0 errors — PASS
ESLint (--cache): 0 errors, 91 warnings — PASS
Vitest (--coverage): 221 passed — PASS
  - Statements: 30.39% (> 20% threshold)
  - Branches: 72.39%
  - Functions: 40.27%
  - Lines: 30.39%
Architecture fitness: 85/85 PASS
  - test_agent_tw_classes.test.ts
  - test_spanish_neutro.test.ts
  - no-store-in-ssr-skeleton.test.tsx
  - test_shell_routes_ssot.test.ts (NEW T-5)
```

---

## Commit SHA

`8b56cb30` — feat(nicolify): T-5 Ribbon+SubTabsBar+shell-routes SSoT (nicolify-r0-shell)

---

## Skills consulted (must_load enforcement v4.1)

| Skill | Invoked | Decision |
|---|---|---|
| nicolify-design-system | YES | Port verbatim re-tematizado vitalia; G3 JIT-safe; AgentAvatar reuse |
| frontend-expert | YES | FSD-Lite boundaries; Server-First; runtime-quality-checklist; useMemo for exhaustive-deps |
| tessl__react-patterns | YES | WAI-ARIA tablist (role/aria-selected/roving tabindex); stable keys; accessibility |
| tessl__vitest | YES | TDD RED→GREEN; 28 tests shell-routes + 13 arch tests |
| playwright-expert | YES | E2E deferred to T-6 (routing + regression specs are T-6 scope) |
| .claude/rules/frontend-fsd.md | YES | shell-routes.ts in lib/routing/; shell-organism components in shared/ |
| .claude/rules/frontend-visual-fidelity.md | YES | design-system-first; mockup adherence to shell.html ratificado |
