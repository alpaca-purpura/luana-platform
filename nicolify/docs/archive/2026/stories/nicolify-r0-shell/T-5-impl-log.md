# T-5 Implementation Log — nicolify-r0-shell

**Ticket:** T-5 — Ribbon 5 agentes + Config + SubTabsBar + shell-routes.ts (SSoT)
**Story:** nicolify-r0-shell
**Brand:** nicolify
**Date:** 2026-05-30
**Agent:** builder-frontend (Sonnet)

---

## Plan

### Design-system-first (D1)

Reutilizado:
- `_agent-tw-classes.ts` (T-1, G3 JIT-safe) — `agentBgSoftClass`, `agentBorderClass`, `agentTextClassSubTab`
- `AgentAvatar.tsx` (T-4) — fallback de initial en avatar 404 (E4)
- `Tooltip`, `TooltipTrigger`, `TooltipContent` from `@/components/ui/tooltip` (Shadcn)
- `cn()` from `@/lib/utils`
- `Settings` (lucide-react) para ConfigTab

Componentes nuevos creados CON átomos/moléculas existentes (no desde cero).

### Mockup adherence (D2 + D3)

Implementado (scope story E1-E5 + A4):
- Ribbon con 5 tabs agentes + ConfigTab ml-auto (mockup shell.html ratificado)
- agent-color active border via `agentBorderClass` (G3 gate)
- SubTabsBar URL-derived, roving tabindex (WAI-ARIA E1, F1)
- SubSubTabsBar placeholder N3-static (vacío R0 — retorna null)
- shell-routes.ts SSoT con guards XSS whitelist (A4)
- Sara solo [proyectos] en R0 (navigation-tree.md constraint)

NO excedido scope — no se construyeron subtabs N3 (out of mockup scope for R0).

### Batería de tests

- `shell-routes.test.ts` (28 tests): TDD RED→GREEN — cubre A4 XSS guards + E1-E5 subtabs + DEFAULT_LANDING + AGENT_CATALOG
- `test_shell_routes_ssot.test.ts` (13 tests): arch fitness — SSoT enforcement + Sara constraint + DEFAULT_LANDING christian/pipeline
- `test_spanish_neutro.test.ts` (ya existía): verifica voseo ausente en nuevos archivos

### Integración CONN (anti-orphan)

- AppPanelSlot.tsx actualizado para importar y renderizar Ribbon/SubTabsBar/SubSubTabsBar (wiring)
- Ribbon → consumed by AppPanelSlot (dentro de ShellOrganismLayoutClient via ShellOrganismLayout)
- SubTabsBar → consumed by AppPanelSlot
- SubSubTabsBar → consumed by AppPanelSlot
- shell-routes.ts → consumed by Ribbon, SubTabsBar, SubSubTabsBar (SSoT único)

---

## Skills Consulted

| Skill | Por qué invocada | Decisión tomada |
|---|---|---|
| `nicolify-design-system` | Componentes Ribbon/SubTabsBar + tokens agentes | Port verbatim re-tematizado de vitalia; agentBgSoftClass + agentBorderClass para active state; G3 JIT-safe (_agent-tw-classes.ts) |
| `frontend-expert` | FSD-Lite boundary, Server-First, SSR-safe, runtime checklist | AppPanelSlot como Server Component, Ribbon/SubTabsBar/SubSubTabsBar como Client Components ("use client"); useMemo para subtabs en SubTabsBar (exhaustive-deps) |
| `tessl__react-patterns` | error boundaries, loading/error/empty, accessible markup, stable keys, memoization | role="tablist" + role="tab" + aria-selected + tabIndex roving (WAI-ARIA tablist pattern); stable keys = subtab.id; useMemo para subtabs |
| `tessl__vitest` | TDD RED→GREEN test setup | shell-routes.test.ts 28 tests RED antes de impl; test_shell_routes_ssot.test.ts arch fitness |
| `playwright-expert` | E2E smoke — no smoke tests new routes en T-5 (T-6 lo cubre) | E2E deferred a T-6 (routing routes + e2e regression son T-6 scope) |
| `.claude/rules/frontend-fsd.md` | FSD-Lite boundaries, no cross-feature imports | shell-routes.ts en lib/routing/ (no en features); componentes en shared/shell-organism/ |
| `.claude/rules/frontend-visual-fidelity.md` | design-system-first, mockup adherence | Ribbon implementa mockup shell.html visualmente (5 tabs + config ml-auto + active state + roving tabindex) |

---

## Mockup scope notes

- Shell.html ratificado muestra 5 tabs Ribbon + ConfigTab. Implementado.
- SubSubTabsBar aparece en mockup como placeholder line 3. En R0 retorna null para todas las rutas (AGENT_SUBSUBTABS vacío). Correcto.
- Navigation-tree.md define subtabs candidatos N3 (`christian.pipeline`, `christian.propuestas`, `brenda.campanas`). Declarados como "candidatos probables" pero NO implementados en R0. Out of scope per navigation-tree.md § N3.

---

## TDD Red-Green log

| Test file | Status inicial | Status final | Tests |
|---|---|---|---|
| `shell-routes.test.ts` | RED (file didn't exist) | GREEN | 28/28 |
| `test_shell_routes_ssot.test.ts` | RED (file didn't exist) | GREEN | 13/13 |

Primera entrada del bitácora: `shell-routes.test.ts` tests RED (import error — file didn't exist).

---

## Files created/modified

**NEW:**
- `nicolify/frontend/src/lib/routing/shell-routes.ts` — SSoT principal
- `nicolify/frontend/src/lib/routing/__tests__/shell-routes.test.ts` — 28 tests
- `nicolify/frontend/src/__tests__/architecture/test_shell_routes_ssot.test.ts` — 13 arch tests
- `nicolify/frontend/src/components/shared/shell-organism/Ribbon.tsx`
- `nicolify/frontend/src/components/shared/shell-organism/RibbonTab.tsx`
- `nicolify/frontend/src/components/shared/shell-organism/ConfigTab.tsx`
- `nicolify/frontend/src/components/shared/shell-organism/SubTab.tsx`
- `nicolify/frontend/src/components/shared/shell-organism/SubTabsBar.tsx`
- `nicolify/frontend/src/components/shared/shell-organism/SubSubTab.tsx`
- `nicolify/frontend/src/components/shared/shell-organism/SubSubTabsBar.tsx`

**MODIFIED:**
- `nicolify/frontend/src/components/shared/shell-organism/AppPanelSlot.tsx` — wired real Ribbon/SubTabsBar/SubSubTabsBar (replaced skeleton placeholders)

---

## Gate outputs

- TypeScript strict: 0 errors
- ESLint: 0 errors (91 warnings — all pre-existing or justified)
- Vitest: 221 passed (14 test files) — coverage 30.39% statements > 20% threshold
- Architecture fitness: 85/85 passed

---

## Cross-story observed bugs

None detected.
