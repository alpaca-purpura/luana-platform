# T-1 Result — nicolify-r0-shell

**Ticket:** T-1 — Tokens nicolify.com + globals.css + ThemeToggle + _agent-tw-classes + dep splitter
**Story:** nicolify-r0-shell
**Brand:** nicolify
**Date:** 2026-05-30
**cap:** shell-organism.shell-nicolify
**Status:** DONE — gates GREEN

---

## Diff summary

### Files created (8 new)

| File | Descripción |
|---|---|
| `nicolify/frontend/src/components/shared/shell-organism/ThemeToggle.tsx` | Toggle claro/oscuro · port vitalia re-tema · useCallback · spanish neutro · data-testid |
| `nicolify/frontend/src/components/shared/shell-organism/_agent-tw-classes.ts` | G3 static lookup · 5 funciones · 7 slugs nicolify · switch/case exclusivamente |
| `nicolify/frontend/src/components/ui/button.tsx` | Shadcn Button standalone (evita barrel transitive dep @luana/hooks) |
| `nicolify/frontend/src/components/shared/shell-organism/__tests__/_agent-tw-classes.test.ts` | 30 unit tests (TDD RED→GREEN) |
| `nicolify/frontend/src/components/shared/shell-organism/__tests__/ThemeToggle.test.tsx` | 7 unit tests (TDD RED→GREEN) |
| `nicolify/frontend/src/__tests__/architecture/test_agent_tw_classes.test.ts` | 5 arch tests G3 gate |
| `nicolify/frontend/src/__tests__/architecture/test_spanish_neutro.test.ts` | 3 arch tests voseo scan |
| `nicolify/docs/product/stories/nicolify-r0-shell/T-1-impl-log.md` | Este log |

### Files modified (4)

| File | Cambio |
|---|---|
| `nicolify/frontend/src/app/globals.css` | Tokens nicolify.com completos (Tailwind v4 @theme/@layer, :root + .dark, agent-colors, League Spartan + Bree Serif) |
| `nicolify/frontend/src/app/layout.tsx` | SSR anti-FOUC script + preconnect fonts + suppressHydrationWarning |
| `nicolify/frontend/src/app/providers.tsx` | ThemeProvider wired (attribute="data-theme", storageKey="nicolify-theme") |
| `nicolify/docs/product/stories/nicolify-r0-shell/chris-input.md` | Append verdicts T-1 |

---

## Gate output (literal)

### tsc --noEmit
```
(no output — 0 errors)
```

### eslint src/
```
✖ 4 problems (0 errors, 4 warnings)

Warnings (test files only, non-blocking):
- test_spanish_neutro.test.ts:52:14  sonarjs/no-collapsible-if
- ThemeToggle.test.tsx:34:39         sonarjs/no-duplicate-string (3 instances)
```

### vitest run --coverage
```
Test Files  5 passed (5)
     Tests  54 passed (54)

Coverage:
Statements   : 88.3% ( 151/171 )
Branches     : 82.45% ( 47/57 )
Functions    : 100% ( 8/8 )
Lines        : 88.3% ( 151/171 )
```

### react-resizable-panels@^4.11.1
```
Already present in package.json (T-0). No change needed.
```

---

## Commit SHA

`958972e8` — pushed to `wip/nicolify`

---

## Skills consulted (must_load enforcement v4.1)

| Skill | Por qué invocada | Decisión |
|---|---|---|
| `nicolify-design-system` | Tokens autoridad + catálogo agentes + G3 gate | Paleta confirmada, Tailwind v4 CSS-based, _agent-tw-classes switch/case |
| `frontend-expert` | FSD-Lite, runtime-quality-checklist, SSR-safe | Button standalone en components/ui/. useCallback onClick. |
| `tessl__tailwind` | @theme/@layer Tailwind v4, no inline style | @theme genera utilidades bg-agent-*, text-agent-*, border-agent-* |
| `tessl__vitest` | Test setup, next-themes async, mocking | act() para async theme resolution, ThemeProvider wrapper |
| `shell-feature-architecture.md` (nicolify) | G3 JIT-safe enforcement | Arch test creado + _agent-tw-classes SOLO switch/case |
| `frontend-fsd.md` | Boundaries shell-organism en components/shared/ | ThemeToggle + _agent-tw-classes en shell-organism/, no en features/ |
| `spanish-text.md` | Spanish neutro tuteo, sin voseo | aria-label tuteo, arch test voseo scan |

---

## Integration (CONN)

- **Consumed:** ThemeToggle → consumido por TopBarGlobal (T-2). _agent-tw-classes → consumido por Ribbon/RibbonTab (T-5).
- **On-the-map:** cap `shell-organism.shell-nicolify` declarado en header de todos los archivos.
- **Navigable:** globals.css importado en layout.tsx (entry point). ThemeProvider wraps toda la app. ThemeToggle accessible via TopBar (T-2 wiring).
- **Notarized:** providers.tsx registra ThemeProvider. button.tsx registrado en components/ui/.

---

## Notas para T-2

T-2 (TopBarGlobal) puede asumir:
- ThemeToggle disponible en `@/components/shared/shell-organism/ThemeToggle`
- button en `@/components/ui/button`
- Tokens agent-* disponibles en globals.css (@theme wired)
- `storageKey="nicolify-theme"` para ThemeProvider ya configurado
