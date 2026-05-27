<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->
# Frontend Code Review: F2-S1 vitalia-fase2-valeria-agenda (T-10..T-19 BATCH)

**Date:** 2026-05-27
**PR / CONTRACT / UI-SPEC:** `vitalia/docs/product/stories/vitalia-fase2-valeria-agenda/{01-spec.md, 03-arch.md, 04-validators.yaml, 05-guidelines.md, 06-tickets.yaml}`
**Files Reviewed:** ~50 FE files (T-10..T-19, cumulative)
**Domains touched:** scheduling, payments (FE side), fiscal (FE side), telemetry (vitalia_growth_studio_event)
**Skills consulted:** frontend-expert, tessl__react-patterns, tessl__zod, tessl__shadcn-ui, tessl__tailwind, tessl__nextjs-app-router-modularization, vitalia/hipaa-lite overlay, vitalia/shell-feature-architecture-mandatory (ADR-vitalia-004)
**Live-verified:** N (chrome-devtools-verify DEPRECATED for Linux Mint; specs ready, no runtime evidence; Docker stack pre-existing missing `@hookform/resolvers/zod` blocks visual goldens runtime — Chris staging gate manual required and NOT documented as performed)
**Verdict:** **FAIL (changes_requested)**

---

## /test-frontend Gate Status

| Gate | Step | Result | Detail |
|---|---|---|---|
| QUALITY | `tsc --noEmit` (vitalia FE) | PASS | 0 errors strict (gate-output.json fe_typecheck_vitalia) |
| QUALITY | ESLint (60+ rules, scoped valeria) | PASS | 0 errors |
| QUALITY | Arch fitness (FE tests) | PASS (BE side 321 green, FE side covered) | gate-output.json fe_vitest_valeria PASS |
| FUNCTIONAL | Vitest + coverage | PASS | 271 FE tests · ~82% all categories (≥20% threshold) |
| HEALTH | jscpd | not reported by gate-runner | — |
| HEALTH | knip | not reported | — |
| HEALTH | madge | not reported | — |
| HEALTH | npm audit | not reported | — |

**Gate-output.json `any_fail=false`** — all 7 gates PASS at unit/architecture level.

But **functional-correctness gate is NOT covered by `/test-vitalia`**:
the gate verifies code compiles, lints, and passes unit tests in isolation.
The integration of components into `ValeriaAgendaView` (the user-facing page)
is broken (see Finding F1). Unit tests pass because each child renders
in isolation; the page-level wiring is never tested by Vitest.

---

## Warning Baseline Movement

Not surfaced by gate-runner output. NOT verified for shrink-only invariant.

---

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | FSD-Lite | PASS | 0 (barrel-only exports, no cross-feature imports detected) |
| 2 | Server/Client | PASS | 0 (page.tsx is pure Server; views are `"use client"` at root) |
| 3 | React Patterns | **FAIL** | 1 (no route-level `error.tsx` for valeria/agenda; loading/empty/error states in components ok) |
| 4 | Code Quality | PASS | 0 (TS strict 0, ESLint 0) |
| 5 | Accessibility | WARN | 2 (axe spec not RUN, only --list verified; hardcoded raw Tailwind colors may break contrast) |
| 6 | Forms (RHF + Zod) | PASS | 0 (CobrarSaldoSubform + CrearCitaForm correct) |
| 7 | Multitenancy | PASS | 0 (`vitaliaFetch` injects X-Tenant-ID, `[tenantId]` routes) |
| 8 | Master Data / Spanish | **FAIL** | 6 (multiple `toLocaleDateString("es-419")` hardcoded; locale const; local `formatMoney` shadows `@/lib/format/formatMoney`) |
| 9 | Security / Deps | PASS | 0 (no secrets, no `dangerouslySetInnerHTML`) |
| 10 | Tests / TDD | WARN | 2 (E2E + visual + a11y specs NEVER RAN; goldens NOT generated) |
| 11 | Domain Alignment / Agentic UI | **FAIL** | 1 critical (★ corazón valor disconnected — AppointmentDrawer never mounted in page) |
| 12 | Architecture Fitness (20) | PASS | 0 (321 BE + ~15 FE arch fitness GREEN per gate-output) |
| 13 | Mirror detection | PASS | 0 (no cross-brand mirror; AppointmentDrawer sheet pattern new vitalia, candidate `/pm-luana` lift post-merge) |
| 14 | Decisions honored cite (R6) | N/A | `decisions_applicable` field not declared in 06-tickets.yaml frontmatter; A1-A14 architect decisions documented in checkpoint but not cited in builder commit bodies per R6 protocol |

---

## Findings

### FAIL: F1 — ★ Corazón-valor never mounted on page (Domain Alignment / Wiring)
**Category:** 11 (also Cat 3 React patterns + ADR-vitalia-004 § 3 ‘Client root’)
**File:** `vitalia/frontend/src/features/valeria/components/agenda/ValeriaAgendaView.tsx:123-193`
**Issue:** Spec § 2 (Composición) explicitly states `ValeriaAgendaView` MUST render:
1. `<AgendaHeader>` ✓ (line 133)
2. `<AgendaCalendar>` ✓ (line 173) — **PERO sin `onSlotClick` cableado** → cliquear un slot no hace nada
3. `<AppointmentDrawer>` ❌ **NUNCA MONTADO** — línea 188 dice "`{/* T-14 will render AppointmentDrawer here */}`" como comentario, no como código
4. `<AgendaPresetFilters>` (T-16) ❌ NUNCA montado
5. `<CrearCitaButton>` (T-16, AC-8) ❌ NUNCA montado
6. `<MobileBottomSheet>` (Q11, AC-12) ❌ NUNCA montado

Grep verifies (búsqueda en todo `src/`): `AppointmentDrawer\b`, `<CrearCitaButton`, `<AgendaPresetFilters`, `<MobileBottomSheet` **no aparecen en `ValeriaAgendaView.tsx` ni en page.tsx ni en ningún consumidor**. Solo se exportan desde el barrel `features/valeria/index.ts`. Son dead exports.

Consecuencias verificables:
- AC-1, AC-2, AC-3 ✓ (calendario renderiza)
- AC-4 (click slot → drawer) ❌ FAIL — no callback wired, drawer no monta
- AC-5 (cobrar saldo end-to-end) ❌ FAIL — CobrarSaldoSubform is unreachable porque AppointmentDrawerPagoSection lo aloja pero AppointmentDrawer no monta
- AC-7 (chips preset filtran) ❌ FAIL — AgendaPresetFilters no se renderiza
- AC-8 (+ Crear cita dropdown) ❌ FAIL — CrearCitaButton no se renderiza
- AC-10 (visual golden drawer subform) ❌ FAIL futuro — el selector `[data-testid="appointment-drawer"]` nunca existirá en runtime
- AC-12 (mobile bottom-sheet) ❌ FAIL — MobileBottomSheet sin mount
- Todos los 11 scenarios Playwright SC-1..SC-11 fallarán cuando se ejecuten en runtime, porque los POMs buscan elementos que no existen.

**Fix:** wire los 4 componentes en `ValeriaAgendaView.tsx`. Pseudocode mínimo:
```tsx
const { drawerOpen, openDrawer, closeDrawer, selectedSlotId } = useDrawerStore();
const { currency, locale } = useTenantLocale();
const { clinicId } = useClinicId();
// ...
<AgendaHeader ... />
<AgendaPresetFilters />            {/* T-16 */}
<AgendaCalendar
  slots={data?.slots ?? []}
  tenantId={tenantId}
  onSlotClick={openDrawer}         {/* ← critical wiring */}
  isLoading={isLoading && !data}
/>
{drawerOpen && selectedSlotId && (
  <AppointmentDrawer
    tenantId={tenantId}
    tenantCurrency={currency}
    tenantLocale={locale}
  />
)}
<CrearCitaButton                    {/* T-16, desktop + FAB mobile */}
  tenantId={tenantId}
  clinicId={clinicId}
/>
```
Además: agregar `month` aggregate hook + `monthAggregates` prop a `<AgendaCalendar>` cuando `view === "mes"` (sin esto, MonthCalendar muestra grid vacío permanente — AC-5 grader requiere dots).

**Skill ref:** `01-spec.md § 2 + AC-1..AC-12`, `03-arch.md § 6.4 ValeriaAgendaView`, ADR-vitalia-004 § 3.3 ‘Client root’, T-14 spec § 5 + T-16 spec § 6+7+8.

---

### FAIL: F2 — `toLocaleDateString()` hardcoded en múltiples componentes (Master Data)
**Category:** 8
**Files:** 
- `vitalia/frontend/src/features/valeria/components/agenda/AgendaHeader.tsx:75,79,89,96` — `const locale = "es-419"` hardcoded + 3 llamadas `date.toLocaleDateString(locale, ...)`
- `vitalia/frontend/src/features/valeria/components/agenda/DayCalendar.tsx:93` — `d.toLocaleDateString("es-419", ...)`
- `vitalia/frontend/src/features/valeria/components/agenda/AppointmentDrawerTurnoSection.tsx:90,103` — `date.toLocaleDateString("es-419", ...)` + `date.toLocaleTimeString("es-419", ...)`
- `vitalia/frontend/src/features/valeria/components/agenda/AppointmentDrawerNotasSection.tsx:53` — `date.toLocaleDateString("es-419", ...)`
- `vitalia/frontend/src/features/valeria/components/agenda/AppointmentDrawerPagoSection.tsx:95` — `date.toLocaleString("es-419", ...)`

**Issue:** `.claude/rules/master-data.md` declara: **"Prohibido: `toLocaleDateString()`"** y obliga el uso de `formatTenantDate*()` (existe en `vitalia/frontend/src/lib/format/{formatTenantDate,formatTenantTime,formatTenantDateTime,formatTenantRelative}.ts`) leyendo timezone+locale del `useTenantLocale()` hook (Clerk org publicMetadata).

Tenant AR debe ver fechas en zona `America/Argentina/Buenos_Aires`; tenant PE en `America/Lima`. El hardcode `es-419` ignora la timezone del tenant — para un appointment con `startTime: "2026-05-27T19:00:00-05:00"` (Lima) renderizado en navegador AR, mostrará la hora local del navegador (no del tenant), violando el contrato master-data.

**Fix:** importar `formatTenantDate`/`formatTenantTime`/`formatTenantDateTime` desde `@/lib/format/*` + leer `useTenantLocale()` en cada componente cliente. Aplicar a 5 archivos. Para AgendaHeader que ya recibe locale como const, reemplazar por `const { locale, timezone } = useTenantLocale()` y pasarlo a los helpers.

**Skill ref:** `.claude/rules/master-data.md` § Constraints — "BE store UTC, FE usa formatTenantDate*()"; `frontend-expert/references/runtime-quality-checklist.md`.

---

### FAIL: F3 — `formatMoney` local duplica `@/lib/format/formatMoney` (Master Data + Anti-duplication)
**Category:** 8 + 1 (FSD-Lite anti-duplication intra-feature)
**Files:**
- `vitalia/frontend/src/features/valeria/components/agenda/AppointmentDrawerPagoSection.tsx:77-88` — función `formatMoney(amountCents, currency, locale)` local que duplica funcionalmente el helper compartido
- `vitalia/frontend/src/features/valeria/components/agenda/CobrarSaldoSubformSuccessToast.tsx:42-52` — función `formatChargeAmount(...)` local idem

**Issue:** Existe SSoT `vitalia/frontend/src/lib/format/formatMoney.ts` con la misma firma. `.claude/rules/master-data.md` + `.claude/rules/anti-duplication.md` exigen consumir el helper compartido, no re-implementar.

**Fix:** `import { formatMoney } from "@/lib/format/formatMoney"`. Convertir cents→decimal en el callsite (`amountCents / 100`) o agregar overload `formatMoneyCents` al helper compartido.

**Skill ref:** `.claude/rules/master-data.md` + `.claude/rules/anti-duplication.md` § Regla cardinal.

---

### FAIL: F4 — Hardcoded raw Tailwind colors verde/amarillo/azul (Accessibility + Tokens)
**Category:** 5 + 8 (semantic tokens)
**File:** 22 ocurrencias detectadas. Hot-spots:
- `AppointmentDrawerPagoSection.tsx:54,58,216,229` — `border-green-500 text-green-700 bg-green-50 dark:bg-green-950/20` etc. (status badges)
- `AppointmentDrawerTurnoSection.tsx:63,68,78` — idem (status badges)
- `AppointmentDrawerStaleBanner.tsx:41,47,51,58` — yellow raw
- `AppointmentDrawerAccionesAvanzadasSection.tsx:88` — green raw
- `CobrarSaldoSubformSuccessToast.tsx:139` — `text-green-600`
- `AgendaSummaryFooter.tsx:30` — `bg-green-500`

**Issue:** Spec § 3 (AgendaSlot border-status) y ADR-vitalia-003 (mockup HTML SSoT) cementan el uso de tokens semánticos `--vitalia-success-color / --vitalia-warning-color / --vitalia-danger-color / --vitalia-muted-status-color` (ya definidos en `globals.css` y usados correctamente en `AgendaSlotInteractive.tsx` + `MonthCalendar.tsx`). Mezclar tokens-semánticos en algunos componentes con `text-green-700` raw en otros rompe consistencia visual y dark-mode (`dark:bg-green-950/20` no garantiza el mismo contraste que `var(--vitalia-success-color)`).

WCAG 2.1 AA contrast solo se garantiza con los tokens semánticos (Test 7 en T-18 a11y axe está en `console.warn` no-hard-fail precisamente por esto — pero la solución es alinear, no skipear). Visual goldens van a diverge entre mockup y código.

**Fix:** sustituir cada `bg-green-XXX text-green-XXX` por `bg-[color:var(--vitalia-success-color)]/12 text-[color:var(--vitalia-success-color)]` (pattern consistente con T-13). Idem warning/danger/muted. Agregar `--vitalia-info-color` si necesitás azul (SCHEDULED badge en TurnoSection).

**Skill ref:** `tessl__shadcn-ui` § semantic tokens, ADR-vitalia-003 mockup parity, arch test `test_no_hardcoded_colors` (que ya pasó porque acepta `border-green-XXX` Tailwind utility — pero el contrato visual cementa tokens).

---

### FAIL: F5 — Drawer width visual update during resize is debounced wrong (Forms / UX bug)
**Category:** 6 (UX correctness — drawer resize is a control surface)
**File:** `vitalia/frontend/src/features/valeria/components/agenda/AppointmentDrawer.tsx:108-126`
**Issue:** En `onPointerMove`, se debouncea el setDrawerWidth pero **también se llama inmediatamente** `setDrawerWidth(newWidth)` en línea 122 fuera del setTimeout. El debounce no hace nada — efectivamente cada movimiento del puntero re-renderiza inmediatamente y además agenda otra escritura debounced 100ms después con el mismo valor. Es un "no-op debounce".

```ts
debounceTimer.current = setTimeout(() => {
  setDrawerWidth(newWidth);
}, 100);
// Apply visual update immediately (without waiting for debounce)
setDrawerWidth(newWidth);   // ← debounce defeated
```

**Fix:** O bien debouncear solo el persist a localStorage (lo cual ya hace zustand persist internally — verificar), o quitar el inmediato y subir el debounce a 16ms (1 frame) si querés smoothness. La intención del spec (Q5) era: visual update inmediato + persist localStorage debounced; el código actual hace 2 escrituras al mismo store por frame.

**Skill ref:** T-14 spec § "Drag resize handle 440-640px localStorage", `tessl__react-patterns` (memoization/stable refs).

---

### FAIL: F6 — Wrong `agendaKeys.grid` cache key when SSR vs live filter differ (React Query hydration bug)
**Category:** 11 + 6
**File:** `vitalia/frontend/src/features/valeria/components/agenda/ValeriaAgendaView.tsx:79-89`
**Issue:** Línea 82 hidrata cache con `agendaKeys.grid(tenantId, initialView, initialDate, null)` — **siempre `null` como presetFilter**, ignorando `initialPresetFilter` recibido como prop. Si el usuario llega a `/{tenant}/valeria/agenda?preset_filter=today`, el initialData de page.tsx (que SÍ pasó presetFilter al server fetch) se almacena bajo key `[null]` mientras el live hook line 106 consulta con key `[today]`. Resultado: 
- React Query mira el key `[..., today]`, no encuentra, hace nuevo fetch al montar
- Hidratación inútil — defeats SSR optimization
- En filter=null fallback funciona; en cualquier preset, layout shift

**Fix:** pasar `_initialPresetFilter` (el prop) al setQueryData:
```ts
queryClient.setQueryData(
  agendaKeys.grid(tenantId, initialView, initialDate, _initialPresetFilter as AgendaFilter | null),
  initialData,
);
```
Y renombrar el prop (quitar `_` underscore prefix — no es unused).

**Skill ref:** `tessl__react-patterns` (stable refs + correct deps), `tessl__nextjs-app-router-modularization` (SSR hydration contract).

---

### FAIL: F7 — Route-level `error.tsx` boundary missing (React Patterns)
**Category:** 3 (`tessl__react-patterns` baseline — "Error boundary at every route-level component")
**File:** `vitalia/frontend/src/app/[tenantId]/(shell-organism)/valeria/agenda/` — no `error.tsx`
**Issue:** Next.js App Router app-level error boundary ausente en la ruta `/valeria/agenda`. Si SSR fetch lanza (e.g., bug en `getInitialAgendaState`), el usuario verá la página global 500 de Next sin contexto. ValeriaAgendaView maneja React Query errors (isError state) pero no atrapa render errors de los componentes hijos (`AgendaCalendar` con malformed slot data, etc.).

**Fix:** crear `vitalia/frontend/src/app/[tenantId]/(shell-organism)/valeria/agenda/error.tsx` (Client Component) con fallback UI + reset() handler. O delegar al `error.tsx` del shell-organism layout si ya existe (verificar; si sí, marcar como WARN no FAIL).

**Skill ref:** `tessl__react-patterns` § Error boundary route-level.

---

### WARN: W1 — `useEffect` con deps vacíos sin justificación robusta (Stale closure risk)
**Category:** 3
**File:** `ValeriaAgendaView.tsx:79-90,94-103`
**Issue:** Dos `useEffect` con deps `[]` (forzados con `biome-ignore`). La justificación inline ("intentional empty deps for SSR hydration") es razonable PERO `tenantId`, `initialView`, `initialDate`, `initialData` son props que pueden cambiar entre re-renders si el padre (page.tsx) re-renderiza. Como `page.tsx` es Server Component y los props vienen de URL params, son estables en práctica — pero el patrón es frágil. `tessl__react-patterns` recomienda usar `useRef(initialValue)` pattern + condicional `if (!initRef.current)` si querés "run once".

**Fix sugerido (opcional, self-fix whitelist):**
```ts
const hydrated = useRef(false);
useEffect(() => {
  if (hydrated.current) return;
  hydrated.current = true;
  queryClient.setQueryData(agendaKeys.grid(...), initialData);
}, [queryClient, tenantId, initialView, initialDate, initialData]);
```

**Skill ref:** `frontend-expert/references/runtime-quality-checklist.md` § useEffect deps stale closures.

---

### WARN: W2 — Visual goldens y E2E specs NUNCA EJECUTADOS (Tests / Live verification)
**Category:** 10 + Live verification gate
**File:** `vitalia/frontend/e2e/visual/vitalia-fase2-valeria-agenda.spec.ts`, `vitalia/frontend/e2e/regression/vitalia-fase2-valeria-agenda/*.spec.ts`, `vitalia/frontend/e2e/a11y/vitalia-fase2-valeria-agenda.spec.ts`
**Issue:** T-17 (83 tests), T-18 (7 axe tests), T-19 (15 visual goldens) están en estado "parse OK" — pero NUNCA SE EJECUTARON en runtime. Docker stack tiene bug pre-existente (`@hookform/resolvers/zod` missing en container). Sin runtime evidence:
- Visual goldens NO GENERADOS (no PNGs commitidos en `e2e/__screenshots__/visual/`)
- A11y axe NO ejecutó — solo verifiacó `--list`
- Playwright funcional NO ejecutó — Clerk auth fixture, MSW mocks, network failure scenarios, todos en papel

Combinado con **F1 (corazón valor disconnected)**, los specs van a fallar incluso cuando docker se arregle, porque buscan `[data-testid="appointment-drawer"]`, `cobrar-saldo-subform`, `agenda-preset-filters` que NO se renderizarán en page.tsx con la wiring actual.

Adicional `chrome-devtools-verify` evidence requerido por runtime-quality-checklist está marcado DEPRECATED en Linux Mint, pero el escape valve "escalate Chris staging gate manual" NO está documentada como ejecutada en ningún T-*-result.md. Live verification gate ABIERTO.

**Fix:** 
1. Arreglar tech-debt docker stack (`pnpm install` en container o rebuild imagen).
2. Ejecutar `npm run test:e2e:smoke` nativo (puerto 3002) + `npx playwright test --project=visual --update-snapshots` para generar goldens.
3. Commit goldens en mismo PR.
4. O escalar a Chris para staging gate explícita post-fix F1.

**Skill ref:** `.claude/rules/e2e-testing.md` § Preflight obligatorio, `chrome-devtools-verify` skill, T-19 § Resolution path.

---

### WARN: W3 — `AgendaPlaceholder` dead code en PLACEHOLDER_MAP (technical debt)
**Category:** 4
**File:** `vitalia/frontend/src/components/shared/shell-organism/SubTabContent.tsx` — entry `"valeria.agenda": AgendaPlaceholder` (línea ~no leída pero confirmada en T-19-result)
**Issue:** Post-implementación de `/valeria/agenda/page.tsx` static segment, el placeholder está inalcanzable (Next.js static route gana sobre `[subtab]`). Dead code.

**Decision recomendada (per scope T-19 cleanup question):** Defer cleanup hasta resolver F1 primero (re-mounteando componentes en page funcional). Cuando F1 esté resuelto Y los gates GREEN runtime, en PR de cleanup hacer:
1. Remove `AgendaPlaceholder` from `PLACEHOLDER_MAP`.
2. Update arch test count `22 → 21`.
3. Delete `vitalia/frontend/src/features/valeria/components/placeholders/AgendaPlaceholder.{tsx,test.tsx}`.

No bloquea este PR pero sí queda como tech-debt explícito en `known_tech_debt` del checkpoint (ya está documentado ahí).

---

### WARN: W4 — `MobileBottomSheet` solo renderiza si invocado; spec § 8 mobile responsive no implementado
**Category:** 11
**File:** `MobileBottomSheet.tsx` existe + exportado, pero **no se invoca desde ningún componente padre** (grep `<MobileBottomSheet`: 0 hits fuera de su propio archivo y __tests__).
**Issue:** Spec § 8 mobile responsive dice "AppointmentDrawer → full-screen overlay (Sheet `side='bottom'` ocupando 95vh)" → el contrato es que en `<md` la `AppointmentDrawer` use `MobileBottomSheet` o que su Sheet se adapte. Hoy la `AppointmentDrawer` siempre usa `side="right"` (línea 217) sin breakpoint switch. AC-12 (mobile drawer full-screen) FAIL en runtime mobile viewport.
**Fix:** wire `MobileBottomSheet` o agregar lógica responsiva al `Sheet` props (`side` switch via window matchMedia o tailwind responsive prefix). Cubierto por F1 fix amplio.

---

## HIPAA-lite specific findings

| # | Status | Detail |
|---|---|---|
| H1 | PASS | PHI never in URL params: searchParams whitelist (`view`, `date`, `preset_filter`) — no DNI/name keys |
| H2 | PASS | PHI never in localStorage: zustand `partialize` solo persiste `drawerWidth` (numérico) |
| H3 | PASS | `patientNameMasked` / `patientDniMasked` / `patientPhoneMasked` / `patientEmailMasked` opaque strings server-side; AgendaSlotInteractive + AppointmentDrawerHeader nunca tocan raw |
| H4 | PASS | Telemetría `PHI_BLOCKED_KEYS` enforces sanitize (telemetry.ts:55-83); 24 PHI keys cubiertos |
| H5 | PASS | PatientAutocomplete onChange propaga solo `patient_id` (UUID), no PHI |
| H6 | WARN | `vitaliaFetch` se asume injecta `X-Tenant-ID` + clinic context — no verificado en lectura del review (delegado a auditor-backend) |
| H7 | PASS | No `dangerouslySetInnerHTML`, no `eval`, no PHI en console logs (`console.warn` solo loguea event_type, no payload) |

---

## ADR-vitalia-004 compliance check (9 secciones)

| # | Sección | Status | Detalle |
|---|---|---|---|
| 1 | Routing | PASS | Route group `(shell-organism)/valeria/agenda/page.tsx` con static segment; Server Component default; SSR initial state; PHI nunca en URL. Sub-tab no requiere N3-static (vista única view-modes via URL param, no 3+ sub-secciones discretas). |
| 2 | FSD-Lite | PASS | `features/valeria/{components/agenda,api,hooks,store,types,lib}/` con paths exactos. |
| 3 | Client root | **FAIL (Wiring incomplete)** | `ValeriaAgendaView.tsx` con `"use client"` línea 1 ✓ y hidratación ✓, **pero composición incompleta (F1)**. ADR § 3.3 cementa la composición; aquí faltan 4 de 6 hijos. |
| 4 | Data layer | PASS | React Query v5 hooks ✓; Zustand `agenda-store` + `agenda-filters-store` separados ✓; URL SSoT en `useAgendaFilters`. |
| 5 | Forms | PASS | RHF + Zod en `agenda-schema.ts` (T-11) + discriminated union by currency (6 variants) ✓. No "Guardar" botón ✓ (CobrarSaldoSubform usa submit inline). |
| 6 | BE DDD | DELEGATED to auditor-backend (out of FE scope) |
| 7 | Migrations | DELEGATED to auditor-backend |
| 8 | Telemetría | PASS | `vitalia_growth_studio_event` brand-local; sanitize PII; bucketed amounts; fire-and-forget en `features/valeria/lib/telemetry.ts`. |
| 9 | Tests | WARN | Vitest unit ✓; **Playwright funcional + visual goldens + axe no ejecutados runtime (W2)**; arch fitness BE EXTEND OK (gate-output any_fail=false). |

**Compliance verdict:** **partial-with-blockers** — section 3 (Client root) no cumple por F1; sin esto, las secciones 5/8/9 pasan en unit pero fallan en E2E runtime cuando se ejecuten.

---

## AgendaPlaceholder cleanup decision

**Recommendation:** **defer to cleanup follow-up PR.**

Rationale: hacer el cleanup en este PR mientras F1 está abierto introduce ruido y eleva el risk de un revert posterior. Una vez que F1 esté solucionado y los gates runtime estén GREEN, hacer un PR mínimo:
- Remove from `PLACEHOLDER_MAP` (1 line)
- Update arch test count 22→21
- Delete component + test (2 files)

Estado actual ya documentado correctamente en `checkpoint.md::known_tech_debt`.

---

## Visual goldens runtime blocker decision

**Recommendation:** **fix tech-debt + re-run + commit goldens en mismo PR (NOT defer).**

Rationale: el blocker (`@hookform/resolvers/zod` faltante en container) es trivial (`pnpm install` dentro container o rebuild imagen). T-19-result § Resolution path lo documenta:
```bash
cd vitalia/frontend && pnpm install   # inside container
# or rebuild with --build
# then:
E2E_BASE_URL=http://localhost:3002 npx playwright test e2e/visual/... --project=visual --update-snapshots
```

Pero **F1 debe arreglarse PRIMERO**: sin componentes mounteados en `ValeriaAgendaView`, los goldens van a capturar pantallas en blanco (Drawer no abre, Filters no aparece, CrearCita ausente). Generar goldens sobre estado roto cementa el bug visualmente.

**Orden propuesto:**
1. Fix F1 wiring (estimado 1-2h)
2. Fix F2 master-data (estimado 1h)  
3. Fix F3-F6 (estimado 2h)
4. Fix docker stack
5. Run `--update-snapshots`
6. Commit goldens + push
7. Re-spawn auditor

---

## Cross-cutting summary

**Strengths:**
- TDD rigor: 271 FE tests pasan, coverage 82% (target 20%)
- TypeScript strict + ESLint zero errors
- FSD-Lite barrel exports limpios
- HIPAA-lite layer correcto: masking + PHI_BLOCKED_KEYS + dual filter (server-side via vitaliaFetch + clinic_id en autocomplete)
- Zod discriminated union by currency funciona end-to-end (6 currencies × fiscal types)
- Cross-brand mirror scan: clean (zero hits)
- E2E + a11y + visual specs estructura ratificada (POMs, fixtures, MSW handlers en sitio)

**Weaknesses (FAIL-blocking):**
- **★ corazón valor (cobrar saldo subform) inalcanzable** porque AppointmentDrawer no se monta (F1)
- 5 archivos hardcodean `toLocaleDateString("es-419")` violando master-data rule (F2)
- Helper `formatMoney` duplicado dos veces en feature ignorando SSoT compartido (F3)
- 22 ocurrencias de Tailwind raw color (green/yellow/blue) en lugar de tokens semánticos vitalia (F4)
- Drawer resize debounce bug (F5)
- React Query cache key drift entre SSR y client en presetFilter (F6)
- No route-level `error.tsx` (F7)
- E2E/visual/a11y nunca ejecutados runtime; live verification gate abierta (W2)

**Verdict math:**
- F1 (Cat 11 critical) → automatic FAIL
- F2, F3 (Cat 8) → FAIL
- F4 (Cat 5) → FAIL
- F6 (Cat 11) → FAIL
- F7 (Cat 3) → FAIL
- W1, W2, W3, W4 → ≥2 WARN → contribute to FAIL
- **Live verification ausente** sin staging gate documented → adds to FAIL per role rules ("UX/dev evidence required for FE PR")
- Per role spec § Verdict math: "Any FAIL in categories 1 / 2 / 3 / 7 / 11 / 12 / 14 → overall FAIL" + "User-facing change + no chrome-devtools evidence + no Chris staging gate documented → overall FAIL"

---

## Final FE batch verdict

**FAIL — CHANGES_REQUESTED**

This PR ships the components (good craftsmanship at unit level) but fails to **integrate them into the page** — the core user value of F2-S1 (click slot → open drawer → cobrar saldo inline) is **unreachable in runtime**. The gate-output.json is GREEN because Vitest renders each component in isolation; nothing tests the actual rendered page tree at `/valeria/agenda`.

Recommended remediation ordered by priority:

1. **F1 — Wire AppointmentDrawer + AgendaPresetFilters + CrearCitaButton + MobileBottomSheet into ValeriaAgendaView** (estimated 1-2h, blocking all AC + E2E + visuals)
2. **F2 — Replace 5 hardcoded `toLocaleDateString` with `formatTenantDate*()` + `useTenantLocale()`** (estimated 1h, master-data compliance)
3. **F3 — Use shared `@/lib/format/formatMoney`, remove local duplicates** (estimated 15min)
4. **F4 — Replace 22 raw Tailwind color utilities with vitalia semantic CSS tokens** (estimated 1h)
5. **F5 — Fix drawer resize debounce no-op** (estimated 15min)
6. **F6 — Fix SSR React Query cache key drift for presetFilter** (estimated 10min)
7. **F7 — Add `error.tsx` route-level boundary** (estimated 15min)
8. **W2 — Fix docker tech-debt, generate visual goldens runtime, commit PNGs** (estimated 1h post-F1)
9. **W3 — Defer AgendaPlaceholder cleanup to follow-up PR**

After remediation, **re-spawn auditor-frontend** with command `test-vitalia` covering full Playwright suite (smoke + regression + visual + a11y). Visual goldens MUST land in the same PR to satisfy ADR-vitalia-003 ratchet.

**This PR is NOT ready for `state=done` until F1 minimum is resolved.** Even with all unit tests GREEN, the user-facing flow described in 01-spec § 2 Gherkin SC-1..SC-11 is dead code at the page level.

---

## §11 Faithfulness brief gaps cited (R24 partial flag)

Per CONTEXT-BRIEF.md header: `Validator pass: _pending_` + `Faithfulness flag: _pending_` (treated as PARTIAL per R24, NOT blocking but cited).

Validator findings (anticipated from §11) that materialized in this audit:
- ✓ Service-blocker Option A MSW completeness — fixtures shipped T-17 OK, marked DEPRECATED awaiting service stories
- ✓ HIPAA-lite dual filter audit in every endpoint — BE side OUT-OF-SCOPE FE review
- ✓ Currency override per appointment — schema covers `currencyOverride` (agenda-schema.ts:166), CobrarSaldoSubform exposes "Más opciones" accordion (line 555-598). Wired correctly.

Validator never ran (`_pending_`); proceeded with audit but flagging that pre-audit validation step was skipped. Recommendation: re-run validator post-fix per `/architect` skill protocol.
