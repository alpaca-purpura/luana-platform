# ADR-012 — Autoguardado como primitiva compartida de plataforma

**Status:** proposed (pendiente ratificación Chris) · **Date:** 2026-05-31 · **Decider:** Chris · **Scope:** platform-wide (cross-brand · design system) · **Owner:** `/pm-luana`

## Contexto

Chris definió que el **autoguardado (autosave) debe ser universal** en toda la aplicación (no una feature aislada de Brand Studio). Hoy NO es una decisión de arquitectura — es un **patrón emergente duplicado feature por feature**:

- **vitalia: ~23 archivos** con autosave · **nicolify: ~23 archivos** con autosave. Cada brand lo implementa por separado.
- Solo en Lisa (vitalia) hay **4+ hooks casi idénticos** (`useIdentityAutosave`, `usePersonalityAutosave`, `useContactAutosave`, `useVisualsAutosave`) + **2 copias de `AutosaveBadge`**.
- **Cero** en el design system compartido `core/@luana/` (ni `@luana/hooks` ni `@luana/ui-kit`).
- La ADR-vitalia-004 lo menciona como *guía* ("debounce 600ms cuando aplique"), no como **primitiva con contrato**.

**El costo real (evidencia):** la story `arreglar-guardado-voz-y-tono` (2026-05-31) encontró **5 bugs apilados** en `usePersonalityAutosave` (auth-readiness de Clerk, manejo de error, telemetría, contrato FE↔BE). Esos bugs son **per-hook**: los hermanos (`useIdentity/Contact/VisualsAutosave`) arrastran la misma fragilidad, y el fix de robustez (`getTokenReady`) quedó **solo en voz-y-tono**. Cada arreglo del autosave hoy es arreglarlo N veces. Esto viola directamente `anti-duplication.md` + el paradigma "acción única / cero isla".

## Decisión

Elevar el autoguardado a **primitiva de primera clase del design system compartido**, consumida por todas las brands:

| Pieza | Home (cross-brand) | Responsabilidad |
|---|---|---|
| `useAutosave(contract)` | `core/@luana/hooks` | debounce + estados (idle/dirty/saving/saved/error) + auth-ready + retry/backoff + invalidación React Query + emisión de telemetría + manejo de error/reintento — TODO en un solo lugar |
| `<AutosaveBadge>` | `core/@luana/ui-kit` | UI única del estado (tokens del design system · aria-live · WCAG AA) |
| Contrato `AutosaveContract` | `core/@luana/schemas` (o `hooks`) | tipos: `{ load, save, debounceMs?, getToken, onError?, telemetryEvent? }` |

**Contrato propuesto (a refinar en /architect):**
- **Debounce** configurable (default 600ms).
- **Estados** estándar: `idle → dirty → saving → saved | error`.
- **Auth-ready**: espera robusta al token (no `throw` ante null transitorio — el bug que arreglamos).
- **Retry/backoff** ante fallas transitorias.
- **Telemetría** estándar (evento `*_autosaved`) opt-in.
- **Manejo de error** consistente (badge `error` + reintento al próximo cambio, sin crash).
- **Persistencia verificable** (el contrato no asume 200 = guardado — ver `test-design-doctrine.md` § Verificación REAL).

**Migración (opt-in, no big-bang):**
1. Construir la primitiva en `@luana/{hooks,ui-kit,schemas}` + tests + un consumer de referencia.
2. Migrar vitalia (Lisa: 4 hooks → 1) como primer adopter (su autosave ya está caliente post-bugfix).
3. Migrar nicolify.
4. Borrar las implementaciones per-feature + las copias de `AutosaveBadge`.
5. Cada brand opta-in vía consumo del package (semver minor de `@luana/*`).

## Consecuencias

**Positivas:** un solo lugar robusto (un fix arregla todas las pantallas de todas las brands); UX de guardado consistente platform-wide; elimina ~46 archivos de duplicación (23+23) hacia un consumo fino; cierra la clase de bugs que vimos (auth-race, error handling) de raíz; alinea con anti-duplication + "acción única".

**Riesgos / mitigación:** (1) migración tocando muchos consumers → mitigado por opt-in incremental (no big-bang) + el contrato absorbe las variaciones por config. (2) over-abstracción → mitigado arrancando del patrón real ya probado (vitalia + nicolify), no diseñando en el vacío. (3) acoplamiento al auth provider (Clerk) → el contrato recibe `getToken` inyectado (no importa Clerk en el package).

## Plan de ejecución (vía promotion gate / outcome platform)

- **Outcome platform:** `docs/product/outcomes/autosave-primitive-platform.md` (este ADR es su decisión).
- **Stories:** (1) build primitiva `@luana` + tests + consumer ref → `/architect` + `/dev-team`; (2) `vitalia/docs/product/stories/adopt-autosave-primitive` (consumer); (3) `nicolify/.../adopt-autosave-primitive` (consumer). Cada brand vía su `/pm-{brand}`.
- **Prior-art a reconciliar:** vitalia (`features/lisa/hooks/use*Autosave.ts` + `components/marca/shared/AutosaveBadge.tsx`) + nicolify (equivalentes). El `/architect` consolida ambos en el contrato.

## Cementado en

- `docs/architecture/luana-platform/ADR-012-autosave-primitive-platform.md` (este doc · SSoT de la decisión)
- `docs/product/outcomes/autosave-primitive-platform.md` (el outcome/initiative)
- Origen: story `vitalia/docs/archive/2026/stories/arreglar-guardado-voz-y-tono/` + learning `vitalia/docs/learnings/2026-05-31-e2e-mockeado-verde-falso.md`

## Referencias

- `.claude/rules/anti-duplication.md` — la duplicación que esto resuelve
- `docs/architecture/luana-platform/PARADIGM.md` — "acción única / cero isla / un solo engine" (aquí: un solo autosave)
- `core/@luana/{hooks,ui-kit,schemas}` — homes de la primitiva
- `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md` § Forms — donde hoy vive la guía (se actualizará para apuntar a la primitiva)
- `.claude/rules/test-design-doctrine.md` § Verificación REAL — el contrato no confunde 200 con guardado
