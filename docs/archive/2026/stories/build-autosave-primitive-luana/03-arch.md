---
story_id: build-autosave-primitive-luana
brand: platform
arch_version: 1
schema_version: v4.1
type: ui-story
adr: docs/architecture/luana-platform/ADR-012-autosave-primitive-platform.md
autonomous_mode: true
---

# 03-arch.md — build-autosave-primitive-luana (primitiva de autoguardado compartida)

## Surfaces involved
- **FE shared lib (@luana):** `core/@luana/schemas` (tipos) + `core/@luana/hooks` (`useAutosave`, `useDebounce`) + `core/@luana/ui-kit` (`<AutosaveBadge>`) + consumer de referencia.
- **FE brand (nicolify):** `nicolify/frontend/src/components/form-runtime/` reescrito sobre `useAutosave` + `<AutosaveBadge>`.
- **BE:** no · **AGENTIC:** no.
- Autorización: platform story / engine @luana via **ADR-012 accepted** (/pm-luana). NO toca `core/luana-core-*` (Python).

## Prior art audit
- **Consumed (@luana):** `@luana/hooks` (ya tiene consumers en vitalia → NO romper exports existentes; sólo AGREGAR), `@luana/ui-kit` (compone el `badge.tsx` existente), `@luana/schemas` (index.ts existente → agregar AutosaveContract).
- **Reused/reconciled:** vitalia `features/lisa/hooks/use{Identity,Personality,Contact,Visuals}Autosave.ts` (idénticos → patrón base del hook) + `getTokenReady` (robustez auth) + `AutosaveBadge` (2 copias) · nicolify `components/form-runtime/*` + `hooks/use-debounce.ts` + `OfferAutoSaveIndicator.tsx`.
- **Net-new:** el contrato unificado inyectable (`getToken` param) + el lift a @luana.
- **Lift:** este ES el lift (ADR-012). No hay proposal aparte — el ADR lo cubre.

## FE arch — diseño de la primitiva

### `@luana/schemas` — AutosaveContract
```ts
export type AutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";
export interface UseAutosaveOptions<TValues> {
  save: (values: TValues, ctx: { token: string }) => Promise<unknown>;
  getToken: () => Promise<string | null>;
  onSaved?: () => void;
  onError?: (err: unknown) => void;
  debounceMs?: number;                  // default 2000
  telemetry?: (e: { type: "saved" | "error"; durationMs: number }) => void;
  authReadyAttempts?: number;           // default 10 (×200ms ≈ 2s)
}
export interface UseAutosaveReturn<TValues> {
  status: AutosaveStatus; savedAt: Date | null;
  scheduleSave: (v: TValues) => void; cancel: () => void; retry: () => void;
}
```

### `@luana/hooks` — `useAutosave<T>` + `useDebounce`
- `useDebounce`: liftar `nicolify/frontend/src/hooks/use-debounce.ts` a `@luana/hooks` si su API es genérica; si no, helper interno.
- `useAutosave<T>`: generaliza el patrón vitalia. Internals:
  - `getTokenReady()`: loop `authReadyAttempts` × 200ms esperando token no-null antes de fallar (robustez = fix de arreglar-guardado-voz-y-tono).
  - debounce default **2000ms** (Chris); `scheduleSave` cancela el timer previo (last-wins).
  - estados `idle→dirty→saving→saved|error`; `savedAt` en success; `onSaved`/`onError` callbacks; `telemetry` opt-in con duración.
  - `retry()` re-dispara el último `values` fallido; retry/backoff interno ante transitorios (config simple).
  - cleanup en unmount (cancel timer, guard setState post-unmount).
  - **NO importa Clerk** — `getToken` entra por opción.

### `@luana/ui-kit` — `<AutosaveBadge>`
- Props: `{ status: AutosaveStatus; savedAt?: Date | null; labels?: Partial<Record<AutosaveStatus,string>> }`.
- Compone el `badge.tsx` existente del ui-kit; tokens del design system; **aria-live** (polite/assertive según estado); contraste **AA ≥4.5:1** (NO reusar verde #009966 a 12px — usar token con contraste suficiente); icono+texto (no solo color); `data-state={status}` para tests.
- Copy default neutro inyectable (Guardando…/Guardado/No se pudo guardar. Reintenta.).

### nicolify form-runtime (rewrite)
- `FormRuntimeProvider`/`Context`/`AutosaveBanner` pasan a usar `useAutosave` (pasándole su `save` + `getToken` de Clerk) + render `<AutosaveBadge>` en vez de `AutosaveBanner` propio (o `AutosaveBanner` se vuelve un thin wrapper de `<AutosaveBadge>`).
- **Invariante:** API pública del form-runtime que consumen offer-studio etc. NO cambia (o cambia compatible). Sus tests existentes pasan antes/después (scenario `nicolify-form-runtime-sin-regresion`).

## Cross-cutting decisions
- Auth: `getToken` inyectado (desacopla provider). No PII en la primitiva (pasa values opacos al `save` del consumer).
- i18n: labels inyectables, default neutro.
- Versionado: bump **minor** `@luana/{schemas,hooks,ui-kit}` (feature nueva opcional, no rompe consumers existentes).

## Integration design (CONN)
- **Reachability/Consumers:** `useAutosave` + `<AutosaveBadge>` se exportan desde sus packages (barrel `src/index.ts`) → consumidos YA en esta story por (a) el consumer de referencia (showcase) y (b) el form-runtime de nicolify reescrito. Cero isla: ambos exports tienen consumer real en el mismo PR.
- **Registration points:** export en `@luana/schemas/src/index.ts`, `@luana/hooks/src/index.ts`, `@luana/ui-kit/src/index.ts` (barrels) — deliverable verificable de cada ticket.
- **Home:** no es cap de brand (es primitiva de plataforma). Outcome `autosave-primitive-platform`. Las caps de brand se actualizan en las stories de adopción.
- Adopción de vitalia = story consumer separada (NO en este PR).

## Guidelines (inline)
**Required:** TS strict (no `any`, `unknown`+guards) · sin default exports salvo donde el package lo use · tokens del design system (no hex) · Spanish neutro en labels default · Vitest para todo · barrels actualizados · semver minor bump + CHANGELOG por package.
**Forbidden:** importar Clerk/`@clerk/*` dentro de `@luana/*` (auth inyectada) · romper exports existentes de @luana/hooks · cambiar API pública del form-runtime de nicolify de forma incompatible · hex hardcoded en AutosaveBadge · reusar el verde con contraste <4.5:1.
**Files in scope:** `core/@luana/{schemas,hooks,ui-kit}/src/**` + sus `tests/**` + `package.json`/`CHANGELOG.md` (version bump) · `nicolify/frontend/src/components/form-runtime/**` + sus tests · NUNCA `core/luana-core-*` · NUNCA vitalia/frontend (adopción aparte).
**must_load_skills:** `frontend-expert`, `tessl__react-patterns`, `tessl__vitest`, `tessl__tailwind`, `.claude/rules/tdd-mandatory.md`, `.claude/rules/anti-duplication.md`, `.claude/rules/spanish-text.md`, `.claude/rules/frontend-fsd.md`.

## Test Construction Plan (lite)
- **Vitest** para todo (es librería — sin backend/Playwright en esta story; el E2E real vive en adopción).
- `@luana/hooks/tests/useAutosave.test.ts`: debounce-coalesce, save-success, auth-ready (token null transitorio → espera, no error), error+retry, concurrencia (last-wins), network-failure, unmount-cancel, telemetry opt-in. Usar fake timers + mocks de `save`/`getToken`.
- `@luana/ui-kit/tests/AutosaveBadge.test.tsx`: estados render + `data-state` + aria-live + axe (contraste AA) + i18n labels.
- nicolify: `npx tsc --noEmit` + `npx vitest run src/components/form-runtime/` verde antes/después (regresión).
- Cobertura: ver `04-validators.yaml § scenario_coverage` (10 scenarios → validators).
