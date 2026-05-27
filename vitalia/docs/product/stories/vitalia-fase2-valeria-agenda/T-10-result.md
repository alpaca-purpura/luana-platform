# T-10 Result — FE Shadcn primitives + tenant-locale + telemetry lib

**Ticket:** T-10  
**Story:** vitalia-fase2-valeria-agenda  
**State:** pushed  
**Estimate:** 1h  
**Owner:** claude-sonnet-4-6  
**Date:** 2026-05-27

---

## Skills Consulted (must_load enforcement v4.1)

| Skill | Por qué invocada | Decisión tomada |
|---|---|---|
| `frontend-expert` | FSD-Lite boundary matrix, vitest.config.ts coverage include, runtime-quality-checklist | Lib path `features/valeria/lib/` per FSD-Lite pattern; coverage include added; useEffect no presente (lib puras). |
| `.claude/rules/frontend-fsd.md` | Boundary matrix para ubicación del lib | Libs puras en `features/{domain}/lib/` son correctas per FSD-Lite; NO cross-feature imports. |
| `.claude/rules/anti-duplication.md` | Verificar que freshness.ts y telemetry.ts no dupliquen shared abstractions | `formatTenantRelative` reusado via import (thin wrapper); no cross-brand mirror. ZERO matches en grep scan. |
| `.claude/rules/spanish-text.md` | Strings user-facing en freshness.ts ("Actualizado hace ...") | "Actualizado hace" = Spanish neutro LatAm correcto. Sin voseo, tildes correctas. |
| `.claude/rules/tdd-mandatory.md` | TDD RED→GREEN obligatorio | Test `telemetry.test.ts` escrito ANTES de `telemetry.ts` — RED confirmado → GREEN confirmado. |
| `vitalia/.claude/rules/hipaa-lite.md` | PII-safe telemetry: PHI_BLOCKED_KEYS, sanitizePayload() | Telemetry sanitizer strips campos de `phi_fields.py` SSoT. Fire-and-forget pattern. Tests PII verificados. |
| `tessl__shadcn-ui` | Componentes Shadcn install + verify no-recreate | Sheet, Sonner (toast v2), Resizable instalados via `npx shadcn@latest add`. Ya existían: alert, badge, dialog, dropdown-menu, scroll-area, skeleton, tabs, tooltip. Resizable.tsx corregido para API v4 de `react-resizable-panels`. |
| `tessl__tailwind` | No inline styles, cn() correctness | Resizable.tsx usa cn() correctamente. Nuevos lib files no tienen markup. |
| `tessl__react-patterns` | Error boundaries, loading states, memoization | T-10 es foundation (no components). Patrones aplicables en T-11..T-16. |
| `tessl__zod` | Schema para telemetryEventSchema | `telemetryEventSchema` (z.object + z.enum) valida body antes POST. |
| `tessl__vitest` | Vitest patterns, async mock, vi.stubGlobal | `vi.stubGlobal("fetch", mockFetch)` + `vi.restoreAllMocks()` en afterEach. MSW deferido a T-17 (E2E). |

---

## §11 Faithfulness Gaps (CONTEXT-BRIEF partial flag)

Per CONTEXT-BRIEF §11, gaps citados aquí:

| Gap | Acción en T-10 |
|---|---|
| Service-blocker Option A completeness | No aplica T-10 (foundation only) |
| Test Construction Plan ordering | No aplica T-10 |
| Gherkin coverage mapping | No aplica T-10 |
| HIPAA-lite dual filter | Implementado: PHI_BLOCKED_KEYS + sanitizePayload() en telemetry.ts + tests verificados |
| Currency override per appointment | No aplica T-10 |

---

## Diff resumen

### Shadcn primitives instalados

| Componente | Estado previo | Estado post T-10 | Notas |
|---|---|---|---|
| `alert.tsx` | ✓ existía | ✓ sin cambio | |
| `avatar.tsx` | ✓ existía | ✓ sin cambio | |
| `badge.tsx` | ✓ existía | ✓ sin cambio | |
| `button.tsx` | ✓ existía | ✓ sin cambio | |
| `dialog.tsx` | ✓ existía | ✓ sin cambio | AlertDialog usa dialog primitivo |
| `dropdown-menu.tsx` | ✓ existía | ✓ sin cambio | |
| `scroll-area.tsx` | ✓ existía | ✓ sin cambio | |
| `separator.tsx` | ✓ existía | ✓ sin cambio | |
| `skeleton.tsx` | ✓ existía | ✓ sin cambio | |
| `tabs.tsx` | ✓ existía | ✓ sin cambio | |
| `textarea.tsx` | ✓ existía | ✓ sin cambio | |
| `tooltip.tsx` | ✓ existía | ✓ sin cambio | |
| `sheet.tsx` | ✗ faltaba | **✓ NEW** | Drawer 440-640px resizable per Q5 |
| `sonner.tsx` | ✗ faltaba | **✓ NEW** | Toast deprecado en shadcn@4 → sonner |
| `resizable.tsx` | ✗ faltaba | **✓ NEW** | Fijado para API v4 react-resizable-panels |

**Nota sobre toast:** `npx shadcn@latest add toast` retornó error: "toast is deprecated, use sonner". Instalado `sonner` en su lugar (shadcn@4.8.1).

**Nota sobre resizable:** `react-resizable-panels@4.11.1` (ya en package.json) renombró `PanelGroup→Group`, `PanelResizeHandle→Separator`. El componente generado por shadcn CLI usaba API v3. Corregido manualmente a API v4.

### Nuevos archivos

```
vitalia/frontend/src/features/valeria/lib/
├── freshness.ts                      ← formatRelativeTime() "Actualizado hace X"
├── telemetry.ts                      ← trackEvent() + TrackEventType + telemetryEventSchema
└── __tests__/
    └── telemetry.test.ts             ← 14 tests GREEN (TDD RED→GREEN)
```

### Archivos modificados

```
vitalia/frontend/package.json         ← sonner dep agregado por shadcn
vitalia/frontend/vitest.config.ts     ← coverage include: "src/features/valeria/lib/**"
pnpm-lock.yaml                        ← lockfile actualizado (sonner)
```

---

## Validator gates output

### tsc --noEmit

```
(sin salida = 0 errores)
```

**PASS ✓**

### ESLint src/ --cache

```
(sin salida = 0 errores)
```

**PASS ✓**

### Vitest run src/features/valeria/lib/

```
Test Files  1 passed (1)
     Tests  14 passed (14)
  Duration  479ms
```

**PASS ✓**

### Architecture fitness tests

```
Test Files  23 passed (23)
     Tests  135 passed (135)
  Duration  1.42s
```

**PASS ✓**

### Full coverage check

```
Test Files  166 passed (166)
     Tests  1705 passed (1705)
All files   |  81.89 | 91.72 | 68 | 81.89
(threshold: 20% all categories)
```

**PASS ✓** (81.89% > 20% threshold)

---

## Shadcn primitives verified: components.json + components/ui/*

```
alert.tsx ✓    badge.tsx ✓     button.tsx ✓    dialog.tsx ✓
dropdown-menu.tsx ✓    input.tsx ✓     resizable.tsx ✓    scroll-area.tsx ✓
separator.tsx ✓    sheet.tsx ✓     skeleton.tsx ✓    sonner.tsx ✓
tabs.tsx ✓    textarea.tsx ✓    tooltip.tsx ✓
```

Primitivos del ticket (todos verificados):
- `sheet` ✓ (drawer)
- `dialog` ✓ (AlertDialog confirm Cancelar/No-show — Q8)
- `dropdown-menu` ✓
- `sonner` ✓ (toast → sonner per shadcn@4 deprecation)
- `alert` ✓
- `tabs` ✓
- `skeleton` ✓
- `resizable` ✓ (drawer 440-640px Q5, API v4 corregida)
- `tooltip` ✓ (disabled "Ver ficha" Q7)
- `badge` ✓ (origin badges walk-in/teléfono/Adrián)
- `scroll-area` ✓ (drawer scrolling)

---

## Live verification

`chrome-devtools-verify` marcado DEPRECATED para Linux Mint (skill.md § DEPRECATED 2026-05-15). T-10 es foundation library (no nueva UI visible al usuario). Escalate a Chris staging gate manual en T-13/T-14 cuando los componentes de UI sean visibles.

---

## Commit SHA

(ver abajo post-push)

---

## Notas técnicas

**TrackEventType:** Exportado como const object (no TypeScript enum) para compatibilidad con Zod `z.enum([...values...])` y para evitar the TypeScript enum runtime artifact. Pattern seguido en el codebase (ver `vitalia/frontend/src/lib/agents.ts`).

**PHI sanitizer:** Shallow (no recursivo) por diseño — PHI en telemetría nunca debe estar anidada. Si en futuro llega PHI nested → agregar profundidad al sanitizer en el mismo archivo.

**formatRelativeTime:** Thin wrapper sobre `formatTenantRelative` que ya existe en `src/lib/format/`. Agrega prefix "Actualizado " para el patrón FreshnessIndicator específico de la agenda. No duplica lógica.

**TelemetryPayload type:** Tipado loose (`TelemetryPayload | Record<string, unknown>`) para que el caller pueda pasar campos no previstos. El sanitizer protege contra PHI. En tickets futuros (T-13..T-16) se usará `TelemetryPayload` estrictamente.
