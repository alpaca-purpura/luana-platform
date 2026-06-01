# T-2 Implementation Log — TopBarGlobal + LogoMark + TenantSwitcher

**Story:** nicolify-r0-shell  
**Ticket:** T-2  
**Surface:** FE  
**Status:** COMPLETE  
**Commit:** 24d94d05  

---

## Plan

**Design-system-first inventory (D1):**
- Átomos from `@/components/ui/`: Button (T-1 already), Dropdown-menu, Skeleton, Alert, Dialog (all bootstrapped in T-2)
- Moléculas: LogoMark, TenantBadge, TenantOption (new, built from Tailwind + cn())
- Utilities: `lib/utils.ts` (cn), `lib/tenant-palette.ts` (deterministic badge colors)
- NEVER recreated: Button (T-1), ThemeToggle (T-1), _agent-tw-classes (T-1)

**Mockup adherence (D2):** SHELL-DESIGN-CONTRACT.md § 4 TopBarGlobal — `role=banner`, h-12, LogoMark left, [ThemeToggle · TenantSwitcher] right, hamburger on mobile.

**Scope discipline (D3):** T-2 delivers TopBar chrome only. TenantSwitcher is SKELETON (no live hooks). Full tenant data wiring (useTenants + useTenantStore) is T-3.

**Test battery (TDD → RED first):**
- Component: `TopBarGlobal.test.tsx` — 12 tests covering role=banner, aria-labels, Luana/agencia naming, skeleton variant, logo mark, tenant switcher
- No form (no Zod), no new routes (no E2E smoke new), no store hooks (T-3)

**Integration (CONN):**
- TopBarGlobal consumed by ShellOrganismLayout (T-3) and ShellOrganismLayoutSkeleton (T-3)
- LogoMark + TenantSwitcher consumed by TopBarGlobal
- `stores/shell-store.ts` stub provides `useShellStore` for TopBarGlobal interactive variant
- All components are notarized via shell-organism directory (will be wired in T-3 layout)

---

## Files created

| File | Purpose |
|---|---|
| `components/shared/shell-organism/TopBarGlobal.tsx` | Main deliverable — role=banner header with Luana rename |
| `components/shared/shell-organism/LogoMark.tsx` | Brand logo atom — Nicolify SVGs |
| `components/shared/shell-organism/TenantSwitcher.tsx` | Skeleton placeholder "Cambiar de agencia" |
| `components/shared/shell-organism/TenantBadge.tsx` | Initials badge atom |
| `components/shared/shell-organism/TenantOption.tsx` | Agency row molecule |
| `components/shared/shell-organism/AddAgencyPlaceholderModal.tsx` | "Agregar agencia" placeholder dialog |
| `components/shared/shell-organism/types.ts` | Tenant interface + store types |
| `components/shared/shell-organism/__tests__/TopBarGlobal.test.tsx` | 12 tests — B1 coverage |
| `components/ui/dropdown-menu.tsx` | Shadcn primitive (bootstrapped from vitalia) |
| `components/ui/skeleton.tsx` | Shadcn primitive |
| `components/ui/alert.tsx` | Shadcn primitive |
| `components/ui/dialog.tsx` | Shadcn primitive |
| `lib/utils.ts` | cn() utility |
| `lib/tenant-palette.ts` | Deterministic badge colors |
| `stores/shell-store.ts` | Shell store stub (full impl T-3) |

---

## Port discipline

All components ported verbatim from `vitalia/frontend/src/components/shared/shell-organism/` with only the following substitutions:
- `"Valeria"` → `"Luana"` in all aria-labels and copy
- `"clínica"` → `"agencia"` in all user-facing text
- Logo assets: `/brand/vitalia-logo.png` → `/nico-assets/logotipo/logotipo-fondoclaro-nicolify.svg`
- Palette: nicolify indigo-based (not vitalia cyan)

**Cross-brand import check:** ZERO imports from `vitalia/frontend/` — verified by grep.

---

## Quality gates

| Gate | Status | Details |
|---|---|---|
| `tsc --noEmit` | ✅ PASS | 0 errors, strict mode |
| ESLint 0 errors | ✅ PASS | 0 errors, 10 warnings (below baseline) |
| Vitest 73/73 | ✅ PASS | All 73 tests pass including 12 new T-2 tests |
| Coverage ≥20% | ✅ PASS | 71.76% statements, 81.33% branches |
| TDD RED→GREEN | ✅ DONE | Test file written before implementation |
| G3 JIT-safe | ✅ VERIFIED | No template literals in _agent-tw-classes (T-1) |
| G2 SSR-safe | ✅ PARTIAL | Skeleton variant store-free per design; full SSR-safe store in T-3 |
| Spanish neutro | ✅ PASS | "Cambiar de agencia", "Agencia activa", "Abrir panel Luana" — no voseo |

---

## Mockup scope notes

- Mockup shows full TenantSwitcher with live agency list — OUT OF SCOPE for T-2 (is T-3 data layer)
- Mockup shows mobile hamburger opening Luana drawer — T-4 delivers LuanaSidebar, hamburger handler is wired but store is stub until T-3+T-4

---

## Cross-story observed bugs

None observed.

---

## Skills Consulted (must_load enforcement v4.1)

| Skill | Why invoked | Decision taken |
|---|---|---|
| `nicolify-design-system` | Port shell-organism components with correct Nicolify tokens | Used indigo palette, Nicolify agent colors, `nico-assets/` paths |
| `frontend-expert` | FSD-Lite boundaries, Server-First defaults, shell in `components/shared/` | Shell organism in `components/shared/shell-organism/` per FSD boundary matrix |
| `tessl__shadcn-ui` | Shadcn component selection — reuse `components/ui/`, never recreate | Bootstrapped missing Shadcn primitives from vitalia; no recreation |
| `tessl__react-patterns` | Error boundaries, loading/error/empty states, accessible markup, stable keys | role=banner, aria-labels, aria-disabled on skeleton, no dynamic keys |
| `playwright-expert` | Visual golden guidance for `shell-desktop-light` | B1 visual golden target: `header[role=banner]` renders |
| `frontend-visual-fidelity` | Mockup adherence + scope discipline | Implemented only TopBar scope, deferred TenantSwitcher live data to T-3 |
| `spanish-text` | Spanish neutro tuteo, no voseo | "Cambiar de agencia", "Agencia activa", "Abrir/Cerrar panel Luana" — no voseo confirmed |
| `chrome-devtools-verify` | Live verification gate | DEFERRED: environment is offline (expected per ticket G5 note). Escalate to Chris staging gate. Stack not live yet (T-6 is DoD). |
