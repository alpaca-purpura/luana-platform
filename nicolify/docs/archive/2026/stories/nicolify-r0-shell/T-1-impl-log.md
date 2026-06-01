# T-1 Implementation Log — nicolify-r0-shell

**Ticket:** T-1 — Tokens nicolify.com + globals.css + ThemeToggle + _agent-tw-classes + dep splitter
**Story:** nicolify-r0-shell
**Brand:** nicolify
**Date:** 2026-05-30
**cap:** shell-organism.shell-nicolify

---

## § Plan

### Design-system-first (D1)

Átomos reutilizados:
- `@/components/ui/button` — standalone Shadcn Button pattern (port from `@luana/ui-kit/button.tsx`, avoids barrel transitive dep `@luana/hooks → @/features/copilot/*` not yet in nicolify R0)
- `lucide-react` Moon + Sun icons (ya en deps)
- `next-themes` ThemeProvider/useTheme (ya en deps)

Tokens: todos en `globals.css` vía CSS vars + `@theme` Tailwind v4. NUNCA hardcoded hex/px fuera del archivo. Z_INDEX consumido de `@luana/design-tokens` (motor, no duplicado).

### Mockup adherence + scope (D2+D3)

Scope T-1: globals.css tokens + ThemeToggle + _agent-tw-classes + arch tests. No UI visual al usuario en este ticket. El mockup `shell.html` se usa para derivar los colores de agentes, confirmados contra SHELL-DESIGN-CONTRACT.md § 6.

### Batería de tests (TDD RED→GREEN)

Tests escritos ANTES del código (TDD obligatorio):
1. `_agent-tw-classes.test.ts` — 30 tests, todas las funciones helper, G3 JIT-safe enforcement
2. `ThemeToggle.test.tsx` — 7 tests, toggle light/dark, aria-label español neutro
3. `test_agent_tw_classes.test.ts` — 5 arch tests, G3 gate (no template literals)
4. `test_spanish_neutro.test.ts` — 3 arch tests, voseo scan en shell-organism

Primera entrada del bitácora = tests RED (módulo no encontrado).

### Integración (CONN)

- `globals.css` — consumido por `layout.tsx` (ya importado), referenced en `@theme`
- `ThemeToggle` — exportado desde `shell-organism/`, consumido por `TopBarGlobal` (T-2)
- `_agent-tw-classes.ts` — exportado desde `shell-organism/`, consumido por `Ribbon`, `RibbonTab`, `SubTabsBar`, `AgentAvatar` (T-5)
- `providers.tsx` — ThemeProvider wired, consumed by layout
- NO huérfanos — todo referenciado o en camino de referencia (DAG T-1→T-2→T-5)

### Header cap

Todos los archivos `.ts`/`.tsx` nuevos tienen `// cap: shell-organism.shell-nicolify` en línea 1-2.

---

## § Mockup scope notes

El mockup `shell.html` muestra el shell completo (5 tabs, splitter, chat). T-1 scope = SOLO tokens/tema — NO se construyó el Ribbon ni el Layout (esos son T-2..T-5). Se implementó exactamente lo que los deliverables de T-1 especifican.

---

## § Decisiones técnicas

**D1 — Button standalone en components/ui/** (no barrel @luana/ui-kit)
- `@luana/ui-kit` barrel importa `dialog.tsx`, `sheet.tsx`, etc., que tienen `useCopilotOffset` from `@luana/hooks`
- `@luana/hooks/use-copilot-offset.ts` usa `@/features/copilot/lib/copilot-shell-widths` (brand-specific, no disponible en nicolify R0)
- Solución: `components/ui/button.tsx` standalone (copia de `@luana/ui-kit/button.tsx`) — elimina transitive dep
- Nota: NO es recrear el átomo desde cero, es aislar la importación para evitar la dep transitiva del barrel

**D2 — Fonts via CSS @import (no link tags en layout)**
- `globals.css @import url(Google Fonts)` + preconnect hints en `<head>` evitan warnings `@next/next/no-page-custom-font`
- La advertencia del linter es para App Router (se esperan fonts vía `next/font`), pero para Tailwind v4 CSS-based sin `tailwind.config.ts` el @import en globals.css es el SSoT correcto

**D3 — SSR anti-FOUC script**
- `themeScriptInnerHtml` extraída como constante (evita `react-perf/jsx-no-new-object-as-prop`)
- `suppressHydrationWarning` en `<html>` cubre mismatch server/client del `data-theme` attribute

**D4 — @theme declaración en Tailwind v4**
- Tailwind v4 CSS-based: `@theme` genera las utilidades `bg-agent-*`, `text-agent-*`, `border-agent-*`
- CSS vars en `:root` → `@theme` mapea `--color-agent-*: hsl(var(--agent-*))` → Tailwind genera las clases
- Sin `tailwind.config.ts` (Tailwind v4 CSS-first)

**D5 — Dark mode token overrides fuera de @layer base**
- `--agent-sara` dark override vive fuera de `@layer base` para cascade correcta (mismo patrón que vitalia camila)

---

## § Cross-story observed bugs

Ninguno detectado en este ticket. T-0 stack healthy.

---

## § Skills consulted (must_load enforcement v4.1)

| Skill | Por qué invocada | Decisión tomada |
|---|---|---|
| `nicolify-design-system` | Autoridad de tokens nicolify.com + catálogo agentes + G3 gate | Paleta confirmada: primary #635BFF, 5 agentes + luana + config. Tailwind v4 CSS-based (@theme/@layer, NO config.ts). `_agent-tw-classes.ts` static switch/case. |
| `frontend-expert` | FSD-Lite boundaries, Server-First, SSR-safe store, runtime-quality-checklist | Button standalone en `components/ui/` (no barrel). ThemeToggle `"use client"` justificado (useTheme hook). `useCallback` para evitar re-render. |
| `tessl__tailwind` | Tailwind v4 utility-first, `@theme/@layer`, `cn()` | `@theme` mapea CSS vars a utilidades. No `style={{}}`. No template literals en clases. |
| `tessl__vitest` | Test setup, async patterns (next-themes), mocking | `act()` para async theme resolution. `ThemeProvider` wrapper en tests. |
| `shell-feature-architecture.md` (nicolify) | G3 JIT-safe gate enforcement | Arch test `test_agent_tw_classes.test.ts` valida G3. `_agent-tw-classes.ts` switch/case exclusivamente. |
| `frontend-fsd.md` | FSD-Lite boundaries (components/shared/ vs features/) | ThemeToggle en `components/shared/shell-organism/` (organismo shell). `_agent-tw-classes.ts` módulo-privado (prefix `_`). |
| `spanish-text.md` | Spanish neutro LatAm (tuteo, sin voseo) | aria-label: "Cambiar tema (actual: claro/oscuro)" — tuteo. Arch test voseo scan creado. |

---

## § Live verification gate

No verification live (chrome-devtools-verify) en T-1 — este ticket NO introduce UI visible al usuario (solo tokens CSS + componente ThemeToggle sin uso en ruta aún). T-2 conectará ThemeToggle en TopBarGlobal y ahí aplica el gate visual.

Verificación manual posible: `make dev-nicolify` + abrir :3001 + ver que el body tiene `bg-background` aplicado.

---

## § Gate runner results

- `npx tsc --noEmit` — 0 errors ✅
- `npx eslint src/ --cache` — 0 errors, 4 warnings (todos en test files, no-blocking) ✅
- `npx vitest run --coverage` — 54 tests passed, 88% coverage (> 20% threshold) ✅
- Arch fitness tests (test_agent_tw_classes, test_spanish_neutro) — 8 tests passed ✅
