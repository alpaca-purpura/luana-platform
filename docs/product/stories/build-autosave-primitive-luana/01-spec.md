---
story_id: build-autosave-primitive-luana
brand: platform
type: ui-story
state: refining
outcome: autosave-primitive-platform
adr: docs/architecture/luana-platform/ADR-012-autosave-primitive-platform.md
po_ux_version: 1
ratified_by_chris: false
---

# 01-spec — build-autosave-primitive-luana (primitiva de autoguardado compartida)

> Story de **plataforma** (cross-brand). Construye la primitiva en `core/@luana`; NO migra brands (eso son
> stories consumer del outcome). Decisión: **ADR-012** (accepted).

## § Context

- Outcome: `autosave-primitive-platform` · ADR-012.
- Qué se construye: `useAutosave` (`@luana/hooks`) + `<AutosaveBadge>` (`@luana/ui-kit`) + tipos `AutosaveContract`
  (`@luana/schemas`) + tests + un **consumer de referencia** (showcase mínimo, no de brand).
- Dónde encaja: es infraestructura del design system compartido — la consumen los forms con autoguardado de
  todas las brands.
- **Out-of-scope (anti-creep):** NO migrar vitalia ni nicolify (stories consumer separadas). NO un framework
  de forms (eso es el `form-runtime` de nicolify, que PODRÁ consumir esta primitiva). NO acoplar a Clerk (el
  token entra inyectado). NO endpoints nuevos.

## § Prior art applied

- **vitalia (per-feature, duplicado):** `vitalia/frontend/src/features/lisa/hooks/use{Identity,Personality,Contact,Visuals}Autosave.ts`
  son **idénticos** salvo tipos + la fn de `save` + la key de invalidación. + el fix de robustez `getTokenReady`
  (espera al token de Clerk) de `arreglar-guardado-voz-y-tono`. + `AutosaveBadge` (2 copias: `components/marca/shared/`
  y `features/lisa/.../identidad/`).
- **nicolify (más centralizado):** `nicolify/frontend/src/components/form-runtime/{FormRuntimeProvider,FormRuntimeContext,AutosaveBanner}.tsx`
  + `nicolify/frontend/src/hooks/use-debounce.ts` + `features/offer-studio/.../OfferAutoSaveIndicator.tsx`. El
  form-runtime es un consumer de alto nivel del mismo concepto → reconciliar: `useAutosave` es el bloque base;
  el form-runtime de nicolify podrá montarse encima.
- **Reconciliación:** la primitiva toma la ergonomía de hook de vitalia + la robustez `getTokenReady` + el concepto
  de estado/banner de nicolify, en un contrato único inyectable.
- **Engine consumed:** `@luana/hooks` (`use-debounce` puede liftarse desde nicolify), `@luana/ui-kit`, `@luana/schemas`.
- **Lift candidates:** este ES el lift (≥2 brands, promotion gate cumplido · ADR-012).
- **Net-new:** el contrato unificado + `getToken` inyectado (desacopla auth provider).

## § Contrato de la primitiva (qué expone)

```ts
// @luana/schemas — AutosaveContract
type AutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface UseAutosaveOptions<TValues> {
  save: (values: TValues, ctx: { token: string }) => Promise<unknown>;  // la mutación real (inyectada)
  getToken: () => Promise<string | null>;        // auth provider inyectado (Clerk u otro)
  onSaved?: () => void;                            // ej. invalidar React Query key (inyectado por el consumer)
  onError?: (err: unknown) => void;
  debounceMs?: number;                             // default 600
  telemetry?: (event: { type: "saved" | "error"; durationMs: number }) => void;  // opt-in
  authReadyAttempts?: number;                      // default 10 (× 200ms ≈ 2s) — robustez getTokenReady
}

interface UseAutosaveReturn<TValues> {
  status: AutosaveStatus;
  savedAt: Date | null;
  scheduleSave: (values: TValues) => void;         // llamar on-change
  cancel: () => void;                              // cancela debounce pendiente (unmount)
  retry: () => void;                               // re-dispara el último intento fallido
}
```
`<AutosaveBadge status savedAt />` (de `@luana/ui-kit`): UI única del estado, tokens del design system, aria-live.

## § Gherkin scenarios

```yaml
scenarios:
  - id: debounce-coalesce
    type: happy
    given: "Un consumer usa useAutosave (debounceMs=600)"
    when: "El usuario dispara 5 cambios en <600ms"
    then: "Se ejecuta UNA sola llamada a save (la última); status idle→dirty→saving→saved"
    playwright_required: false
    graders: [{ type: unit, path: "core/@luana/hooks/src/__tests__/useAutosave.test.ts" }]

  - id: save-success-badge
    type: happy
    given: "useAutosave con un save que resuelve OK + <AutosaveBadge>"
    when: "Se dispara scheduleSave y resuelve"
    then: "status='saved', savedAt set, onSaved llamado (invalidación) · badge muestra estado 'saved' (data-state=saved)"
    playwright_required: false
    graders:
      - { type: unit, path: "core/@luana/hooks/src/__tests__/useAutosave.test.ts" }
      - { type: component, path: "core/@luana/ui-kit/src/__tests__/AutosaveBadge.test.tsx" }

  - id: auth-ready-no-error-permanente
    type: edge
    given: "getToken() devuelve null transitoriamente y luego un token válido (≤2s)"
    when: "Se dispara scheduleSave durante la ventana de token-null"
    then: "useAutosave ESPERA al token (no tira error permanente) y luego guarda · status no queda en 'error' por un null transitorio"
    playwright_required: false
    graders: [{ type: unit, path: "core/@luana/hooks/src/__tests__/useAutosave.test.ts" }]

  - id: error-recovery-retry
    type: negative
    given: "save() rechaza (5xx)"
    when: "Se dispara scheduleSave y falla"
    then: "status='error' · badge 'error' · UI no crashea · el próximo scheduleSave (o retry()) re-dispara · si luego OK → 'saved'"
    playwright_required: false
    graders: [{ type: unit, path: "core/@luana/hooks/src/__tests__/useAutosave.test.ts" }]

  - id: concurrent-edits-last-wins
    type: race_condition
    given: "Dos cambios casi simultáneos"
    when: "scheduleSave A e inmediatamente scheduleSave B antes del debounce"
    then: "Se cancela A, solo B ejecuta save (no doble request)"
    playwright_required: false
    graders: [{ type: unit, path: "core/@luana/hooks/src/__tests__/useAutosave.test.ts" }]

  - id: network-failure
    type: network_failure
    given: "save() lanza timeout/connectivity drop"
    when: "Se dispara scheduleSave"
    then: "status='error' (no excepción no-capturada) · onError llamado · retry posible"
    playwright_required: false
    graders: [{ type: unit, path: "core/@luana/hooks/src/__tests__/useAutosave.test.ts" }]

  - id: unmount-cancels
    type: edge
    given: "Un debounce pendiente"
    when: "El componente se desmonta antes del flush"
    then: "cancel() limpia el timer · no hay save ni setState post-unmount (no warning React)"
    playwright_required: false
    graders: [{ type: unit, path: "core/@luana/hooks/src/__tests__/useAutosave.test.ts" }]

  - id: badge-aria-live
    type: accessibility
    given: "<AutosaveBadge> renderizado"
    when: "status transita dirty→saving→saved→error"
    then: "El estado se anuncia vía aria-live (no solo color) · contraste AA del badge (NO repetir el bug #009966 3.65:1) · roles/labels correctos"
    playwright_required: false
    graders:
      - { type: component, path: "core/@luana/ui-kit/src/__tests__/AutosaveBadge.test.tsx" }
      - { type: axe, ruleset: "wcag2aa" }

  - id: badge-i18n-neutro
    type: i18n
    given: "<AutosaveBadge> con copy"
    when: "Renderiza estados (Guardando… / Guardado / No se pudo guardar. Reintenta.)"
    then: "Spanish neutro (sin voseo) · copy inyectable/i18n-ready (no hardcode que impida traducir)"
    playwright_required: false
    graders: [{ type: component, path: "core/@luana/ui-kit/src/__tests__/AutosaveBadge.test.tsx" }]

  - id: telemetry-opt-in
    type: edge
    given: "useAutosave con telemetry callback provisto"
    when: "save resuelve OK / falla"
    then: "telemetry({type:'saved'|'error', durationMs}) llamado · si NO se provee telemetry, no rompe (opt-in)"
    playwright_required: false
    graders: [{ type: unit, path: "core/@luana/hooks/src/__tests__/useAutosave.test.ts" }]
```

> **Nota sobre Playwright:** esta story construye una **librería** — se verifica con Vitest unit/component
> (determinista, sin backend). El E2E real-backend ocurre en las **stories consumer** (vitalia/nicolify adoptan),
> donde se ejerce contra el backend real (doctrina Verificación REAL). Por eso `playwright_required: false` acá,
> con `not_applicable_reason: "librería primitiva — E2E vive en las stories consumer"`.

## § Estados visuales (AutosaveBadge)

| Estado | data-state | Copy (neutro) | aria-live |
|---|---|---|---|
| idle | idle | (vacío / sutil) | off |
| dirty | dirty | "Sin guardar" | polite |
| saving | saving | "Guardando…" | polite |
| saved | saved | "Guardado" | polite |
| error | error | "No se pudo guardar. Reintenta." | assertive |

## § Componentes (todos NEW en @luana — consolidan duplicación existente)

| Componente | Home | reuse vs new |
|---|---|---|
| `useAutosave<T>` | `core/@luana/hooks` | NEW (consolida 4 hooks vitalia idénticos + base para form-runtime nicolify) |
| `<AutosaveBadge>` | `core/@luana/ui-kit` | NEW (consolida 2 copias vitalia + OfferAutoSaveIndicator nicolify) |
| `AutosaveContract` types | `core/@luana/schemas` | NEW |
| `useDebounce` | `core/@luana/hooks` | reuse/lift desde `nicolify/frontend/src/hooks/use-debounce.ts` si encaja |
| consumer de referencia (showcase) | `core/@luana/ui-kit` (story/example) | NEW (mínimo, prueba el contrato end-to-end sin brand) |

## § Microcopy (Spanish neutro)

Ver tabla de estados. Sin voseo. El copy debe ser **inyectable** (default neutro) para no bloquear i18n futura.

## § Accessibility

`<AutosaveBadge>`: `aria-live` por estado · contraste **AA ≥4.5:1** (corregir el verde si se reusa el de vitalia)
· no depende solo de color (icono + texto) · focusable solo si interactivo (botón retry).

## § Telemetría

`useAutosave` acepta `telemetry` opt-in (evento `saved`/`error` + duración). El consumer decide el sink (cada
brand tiene su tabla). La primitiva NO importa ningún emitter brand-specific.

## § Decisiones para /architect (a refinar en 03-arch)

- Reconciliar `useAutosave` (vitalia) ↔ `form-runtime` (nicolify): ¿el form-runtime se reescribe sobre `useAutosave`?
  (recomendado, pero puede quedar para la story consumer de nicolify).
- ¿`useDebounce` se lifta a `@luana/hooks` o se reimplementa interno?
- Política de `retry`: ¿exponer `retry()` explícito + retry/backoff interno ante transitorios? (ADR-012 dice ambos).
- Versionado: bump minor de `@luana/{hooks,ui-kit,schemas}`.
