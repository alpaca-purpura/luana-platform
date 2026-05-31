---
ticket: T-3
story_id: build-autosave-primitive-luana
surface: FE
module: nicolify-form-runtime
brand: nicolify
state: done
completed_at: 2026-05-30
---

# T-3 Result — nicolify form-runtime reescrito sobre @luana useAutosave + AutosaveBadge

## Skills Consulted

| Skill | Por qué invocada | Decisión tomada |
|---|---|---|
| `frontend-expert` | SIEMPRE — FSD-Lite boundaries, runtime quality checklist, component patterns | Refactor in-place preservando API pública del form-runtime; no se crearon archivos nuevos; solo se modificaron los existentes. `useAutoSave` (bespoke) → `useAutosave` (`@luana/hooks`). |
| `tessl__react-patterns` | Hook con state + effects + callbacks — stale closures, unmount guard, stable refs | `useAutosave` ya implementa estos patrones (stable refs, isMountedRef). `onError` captura el Error y lo expone en ctx para backward-compat con `autosaveError`. |
| `tessl__vitest` | TDD + regression guard — todos los tests existentes deben pasar antes y después | Pre-existing env issue: vitest@4.1.7 requería vite@6+ pero el workspace solo tenía vite@5.4.21. Se agregó `"vite": "^6.0.0"` como devDep en nicolify/frontend para resolver la incompatibilidad. 143/143 tests GREEN. |
| `frontend-fsd.md` | FSD-Lite boundary matrix — cross-feature imports, barrel exports | No se tocaron barrels ni cross-feature. Cambios scoped a `form-runtime/` internals. |
| `anti-duplication.md` | Consumir @luana primitive — NO reimplementar debounce/estado propio | El objetivo de T-3 ES la adopción del primitivo. La lógica bespoke `useAutoSave` es reemplazada por `useAutosave` de `@luana/hooks`. |

---

## Cambios implementados

### 1. `FormRuntimeProvider.tsx` — rewrite autosave internals

**Qué cambió (internals):**
- `import { useAutoSave } from "@/lib/form-runtime/hooks"` → `import { useAutosave } from "@luana/hooks"`
- `autosave.trigger(updated)` → `autosave.scheduleSave(updated)`
- `autosave.state` → `autosave.status` con mapeo `"dirty" → "idle"` (el estado de debounce no se surfacea en el banner)
- `autosave.error` (no existía en `useAutosave`) → `useState<Error | null>` capturado vía `onError` callback
- `saveFn: onSave` → `save: async (vals, _ctx) => onSave(vals)` + `getToken: async () => "form-runtime-no-auth"` (stub no-auth — la auth real la maneja el caller de `onSave`)
- `debounceMs: 800` — preserva el timing original de 800ms (NO el default de 2000ms de @luana)

**Qué NO cambió (API pública — invariante hard):**
- Props de `FormRuntimeProvider`: `schema`, `initialValues`, `onSave`, `saveMode`, `children` — sin cambios
- `FormRuntimeContextValue`: todos los campos idénticos (`autosaveStatus`, `autosaveError`, `setFieldValue`, `undoSession`, `isDirty`, `bridge`, etc.)
- Comportamiento observable: debounce 800ms, estados `idle|saving|saved|error` en contexto, `isDirty`, `undoSession`

### 2. `AutosaveBanner.tsx` — thin wrapper sobre `<AutosaveBadge>`

**Qué cambió (internals):**
- Las renderizaciones de estado (`saving`, `saved`, `error`) ahora internamente montan `<AutosaveBadge>` de `@luana/ui-kit`
- `SavedBanner` usa `<AutosaveBadge status="saved" />` con el mismo fade-out de 2s
- Estado `error` pasa `labels={{ error: error?.message ?? "Error al guardar" }}` al badge

**Qué NO cambió (API pública — invariante hard):**
- `AutosaveStatus` type exportado: `"idle" | "saving" | "saved" | "error"` — sin cambios
- `AutosaveBannerProps`: `status`, `error`, `onRetry`, `className` — sin cambios
- Comportamiento observable: idle→null, saving→"Guardando…", saved→"Guardado" (fade 2s), error→mensaje+botón
- Todos los tests pasan sin modificar una sola línea de test

### 3. `nicolify/frontend/package.json` — fix de entorno de tests (pre-existing issue)

- Agregado `"vite": "^6.0.0"` a devDependencies
- **Razón:** vitest@4.1.7 (ya instalado en nicolify) requiere vite@^6, pero el workspace workspace resolvía vite@5.4.21 → `ERR_PACKAGE_PATH_NOT_EXPORTED: './module-runner'`. La incompatibilidad era pre-existente desde el bootstrap d31c3f6a (la suite de tests no podía ejecutarse). El fix habilita los validators del ticket.

---

## Behavior Preserved — mapeo técnico

| Comportamiento | Bespoke (antes) | @luana/hooks (después) | Preservado? |
|---|---|---|---|
| Debounce | 800ms | `debounceMs: 800` | ✅ |
| Estados banner | idle/saving/saved/error | Mismo (mapeo dirty→idle) | ✅ |
| Fade "Guardado" | SavedBanner 2s | SavedBanner con AutosaveBadge 2s | ✅ |
| onSave invocación | `saveFn(payload)` | `save(vals, _ctx) => onSave(vals)` | ✅ |
| Error tracking | `autosave.error` (state en hook) | `onError` → `useState` local | ✅ |
| isDirty | `values !== snapshotRef.current` | Idem — sin cambio | ✅ |
| undoSession | trigger(snapshot) | scheduleSave(snapshot) | ✅ |
| saveMode explicit | no-trigger | no-scheduleSave | ✅ |
| API pública contexto | FormRuntimeContextValue | Mismo tipo, mismos fields | ✅ |

---

## Validators — output literal

### `nicolify_tsc`
```
$ cd nicolify/frontend && npx tsc --noEmit
(sin salida — 0 errores — PASS)
```

### `nicolify_form_runtime_regression`
```
$ cd nicolify/frontend && ./node_modules/.bin/vitest run src/components/form-runtime/ --reporter=verbose

 RUN  v4.1.7 /home/chalreme/Proyectos/luana-vitalia/nicolify/frontend

 Test Files  19 passed (19)
      Tests  143 passed (143)
   Start at  22:55:31
   Duration  4.39s (transform 5.43s, setup 2.83s, import 37.57s, tests 2.10s, environment 11.01s)

PASS
```

Todos los tests existentes pasaron sin modificar una sola línea de test.

---

## Integration (CONN check)

- **Consumed**: `useAutosave` importado desde `@luana/hooks`; `AutosaveBadge` importado desde `@luana/ui-kit`. Ambas primitivas tienen consumer real en esta story.
- **On-the-map**: cap `platform.autosave-primitive-platform` (ADR-012). Header `// cap: platform.autosave-primitive-platform` en archivos modificados.
- **Navigable**: form-runtime ya estaba referenciado en rutas de brand-studio + offer-studio — no se cambia la navegación.
- **Notarized**: `FormRuntimeProvider`, `AutosaveBanner`, `AutosaveStatus` siguen exportados desde `form-runtime/index.ts` sin cambios.

---

## Scope notes (mockup)

Esta story no tiene UI-SPEC.md/mockups — es un refactor de adopción de primitiva. El scope es estrictamente `nicolify/frontend/src/components/form-runtime/**` + el fix de entorno `package.json`/`pnpm-lock.yaml`.

No se tocó:
- `core/luana-core-*/src/` ❌
- `vitalia/frontend/` ❌
- `core/@luana/*/src/` ❌ (solo se consumen como importaciones)
- Tests existentes — sin modificar una línea

---

## Live verification

Esta story es un refactor de comportamiento (no UI nueva). Chrome DevTools verify no aplica para cambios internos de hook sin cambio visual observable. Los tests de regresión (143/143 PASS) + TypeScript (0 errores) son los verificadores apropiados para un refactor sin cambio de comportamiento.

---

<!-- @pm: build phase done (state: tests-passing). Commit: pending. Files: 4 (0 new, 4 modified). Native ticket tests: 143/143 PASS. Awaiting orchestrator → gate-runner → auditor-frontend (independent verdict). -->
