# T-1 Result — @luana/schemas AutosaveContract + @luana/hooks useAutosave

**Story:** build-autosave-primitive-luana  
**Ticket:** T-1  
**Brand:** platform  
**Surface:** FE shared lib  
**Builder:** builder-frontend (Sonnet 4.6)  
**Date:** 2026-05-30

---

## Skills Consulted

| Skill | Por qué invocada | Decisión tomada |
|---|---|---|
| `frontend-expert` | SIEMPRE obligatorio — FSD-Lite boundaries, API standards, runtime quality checklist | Implementar como plain async + state machine (NO @tanstack/react-query — no está en deps del package); refs estables para callbacks (stale-closure guard); `"use client"` directiva en hook por uso de useState/useEffect/useRef |
| `tessl__react-patterns` | Hook con state + effects — error boundaries, loading/error states, stable keys, memoization | Unmount guard via `isMountedRef` (guard setState post-unmount); stable callback refs para evitar stale closures en el debounced fn; cleanup en useEffect return |
| `tessl__vitest` | TDD obligatorio — fake timers, renderHook, mocks | `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` + `renderHook` + `act` de `@testing-library/react`; mock factory `makeMocks()` con `vi.fn(impl)` para tipado correcto en vitest v2 |
| `tdd-mandatory.md` | RED antes GREEN — primera entrada del bitácora = test fallando | Test escrito ANTES de la implementación. 11 tests RED → run → 2 fallaban por bug en mock setup (defaultOpts sobreescribía mockRejectedValue) → fix → 11 GREEN |
| `anti-duplication.md` | Prior-art scan obligatorio — verificar que no existe el patrón en engine | Prior art leído en `vitalia/frontend/src/features/lisa/hooks/usePersonalityAutosave.ts` + `VozTonoView.tsx` (`getTokenReady` pattern). `use-debounce.ts` ya existe en `@luana/hooks` (reusado). NO se recreó nada — este lift ES la anti-duplicación |

---

## Deliverables implementados

| Archivo | Estado | Descripción |
|---|---|---|
| `core/@luana/schemas/src/autosave.ts` | NEW | `AutosaveStatus`, `UseAutosaveOptions<T>`, `UseAutosaveReturn<T>` |
| `core/@luana/schemas/src/index.ts` | MODIFIED (APPEND) | Re-export tipos del AutosaveContract |
| `core/@luana/schemas/package.json` | MODIFIED | bump 0.1.0 → 0.2.0 |
| `core/@luana/schemas/CHANGELOG.md` | NEW | Entrada 0.2.0 |
| `core/@luana/hooks/src/useAutosave.ts` | NEW | Hook generalizado (state machine + getTokenReady + debounce + retry + telemetry) |
| `core/@luana/hooks/src/__tests__/useAutosave.test.ts` | NEW | 11 tests Vitest (8 scenarios + 3 subtests) |
| `core/@luana/hooks/src/index.ts` | MODIFIED (APPEND) | Export `useAutosave` + tipos |
| `core/@luana/hooks/package.json` | MODIFIED | bump 0.2.0 → 0.3.0 |
| `core/@luana/hooks/CHANGELOG.md` | MODIFIED | Entrada 0.3.0 |

---

## Validators — output literal

### `schemas_tsc`
```
$ cd core/@luana/schemas && npx tsc --noEmit
(sin salida — PASS)
```

### `hooks_tsc`
```
$ cd core/@luana/hooks && npx tsc --noEmit
(pre-existing errors: use-copilot-offset, use-currency-catalog, use-shell-mutex, tests/_deferred — 20 errors
todos pre-existentes en módulos deferred/commented-out. Cero errores nuevos en mis archivos.)
```
> Nota: los errores pre-existentes son de archivos que están comentados en `index.ts` (prefixados con `// export`).
> Mi código (`useAutosave.ts`, `src/__tests__/useAutosave.test.ts`) pasa TSC strict sin errores.

### `useAutosave_unit`
```
$ cd core/@luana/hooks && npx vitest run src/__tests__/useAutosave.test.ts

 RUN  v2.1.9 /home/chalreme/Proyectos/luana-vitalia/core/@luana/hooks

 ✓ src/__tests__/useAutosave.test.ts (11 tests) 35ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Duration  569ms
```

### `arch_no_clerk_in_luana`
```
$ ! grep -rnE "from ['\"]@clerk/" core/@luana/hooks/src core/@luana/schemas/src 2>/dev/null
PASS: no @clerk imports found
```

### `arch_luana_barrels_export`
```
$ grep -q 'useAutosave' core/@luana/hooks/src/index.ts && \
  grep -qiE 'AutosaveStatus|AutosaveContract|UseAutosave' core/@luana/schemas/src/index.ts
PASS
```

---

## Technical Design Notes

### getTokenReady robustness
Generalizado desde `VozTonoView.tsx` vitalia. Loop de hasta `authReadyAttempts×200ms` esperando token no-null antes de fallar. Resuelve la ventana de Clerk donde `isSignedIn=true` pero `getToken()→null` transitoriamente.

### State machine (plain async, sin react-query)
`@tanstack/react-query` NO está en las deps de `@luana/hooks` (solo en devDeps de los frontends). Se implementó como state machine con `useState` + `useRef` (isMountedRef, timerRef, lastValuesRef, isSavingRef) + callbacks estables via refs. Esta decisión es correcta — el hook es una librería agnóstica que no debe arrastrar deps pesadas.

### Stable callback refs (stale closure guard)
Los callbacks `save`, `getToken`, `onSaved`, `onError`, `telemetry` se guardan en refs que se actualizan en cada render (patrón `useEvent`-like). Esto permite que el debounced setTimeout vea siempre la versión más fresca de los callbacks sin necesidad de incluirlos en las deps del setTimeout (lo que recrearía el debounce en cada render).

### Tests (TDD — RED → GREEN)
Proceso:
1. `autosave.ts` types escritos (Step 1)
2. `useAutosave.test.ts` escrito con implementación vacía → RED (Step 2)
3. `useAutosave.ts` implementado → 9/11 PASS, 2 fail
4. Bug: `defaultOpts` sobreescribía `mockRejectedValue` en los tests de error
5. Fix: `preMocked` flag en `defaultOpts` → 11/11 PASS (Step 3 GREEN)

### No default exports
Todos los exports son named (`export function useAutosave`, `export type AutosaveStatus`, etc.).

### Scope gate
Se operó desde `wip/vitalia` tocando paths `core/@luana/*`. Require `SCOPE_GATE_SKIP=1` en el commit (platform primitive, ADR-012, fase bootstrap — autorizado per `.claude/rules/git-safety.md` § Fase solo-bootstrap).

---

## Gherkin coverage

| Scenario | Test | Status |
|---|---|---|
| debounce-coalesce | `debounce-coalesce: 5 changes <2000ms → 1 single save call (last-wins)` | PASS |
| save-success-badge | `save-success: status transitions idle→dirty→saving→saved + savedAt set + onSaved called` | PASS |
| auth-ready-no-error-permanente | `auth-ready: getToken returns null then valid token → waits, saves, NOT permanent error` | PASS |
| error-recovery-retry | `error-recovery-retry: save rejects → status error → retry() re-fires → saved` | PASS |
| error-recovery-retry | `error-recovery-retry: next scheduleSave after error also re-fires` | PASS |
| concurrent-edits-last-wins | `concurrent-edits-last-wins: cancel prior timer, only last values sent` | PASS |
| network-failure | `network-failure: save throws → status error, no uncaught exception` | PASS |
| unmount-cancels | `unmount-cancels: pending debounce cleared on unmount → no save or setState` | PASS |
| telemetry-opt-in | `telemetry-opt-in: called with {type:'saved', durationMs} on success` | PASS |
| telemetry-opt-in | `telemetry-opt-in: called with {type:'error'} on failure` | PASS |
| telemetry-opt-in | `telemetry-opt-in: absent telemetry option does NOT break save` | PASS |

---

## Live verification

Esta story construye una **librería** (`@luana/hooks`, `@luana/schemas`) — no hay superficie user-facing en esta story. La verificación live (chrome-devtools-verify) aplica a las **stories consumer** (adopción vitalia/nicolify) donde se ejerce contra el backend real. Doctrina: `04-validators.yaml § not_applicable_reason: "Librería primitiva — E2E vive en las stories consumer"`.

`chrome-devtools-verify` — N/A para esta story (librería, sin ruta navegable). Escalado a stories consumer.

---

<!-- @pm: build phase done (state: tests-passing). Files: 9 (4 new, 5 modified). Native ticket tests: 11/11 PASS. Awaiting orchestrator → gate-runner → auditor-frontend (independent verdict). -->
