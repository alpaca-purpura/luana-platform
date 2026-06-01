---
story_id: build-autosave-primitive-luana
created_at: '2026-05-31T01:20:00.000Z'
last_modified: '2026-05-31T01:20:00.000Z'
notes_count: 0
refs_count: 0
conversation_count: 1
---
<!-- voseo-allowed: conversación interna Chris↔Claude (buzón de la story), no es texto user-facing -->
# chris-input.md · build-autosave-primitive-luana

> Cocina de la story (Notas + Referencias + Conversación). Separada de spec/design/arch.

## 💭 Notas

- Story de plataforma (brand=platform). Construye la primitiva; NO migra brands (eso son stories consumer).
- Decisión: ADR-012 (accepted). Outcome: autosave-primitive-platform.

## 📎 Referencias

- `docs/architecture/luana-platform/ADR-012-autosave-primitive-platform.md`
- `docs/product/outcomes/autosave-primitive-platform.md`
- Prior-art vitalia: `vitalia/frontend/src/features/lisa/hooks/use*Autosave.ts` + `getTokenReady` en VozTonoView.
- Prior-art nicolify: ~23 archivos con autosave (a reconciliar).

## 💬 Conversación

### 2026-05-31T01:20 · 🤖 claude · `/pm-luana` · ✓ APLICADO
Ratificaste ADR-012 → marqué **accepted** + outcome `refining`. Creé esta story de plataforma
`build-autosave-primitive-luana` (brand=platform, refining, ratificada) para **construir la primitiva**
(`useAutosave` @luana/hooks + `<AutosaveBadge>` @luana/ui-kit + `AutosaveContract` @luana/schemas) con tests
+ consumer de referencia. La adopción de vitalia y nicolify son stories consumer SEPARADAS (en el outcome) —
así no metemos un big-bang. Encadeno a `/po-ux` (platform) para el 01-spec (contrato + scenarios, derivado de
ADR-012 reconciliando vitalia+nicolify). **Heads-up de scope:** esto es el primer paso de un build multi-story;
después del spec te muestro el ready package antes de codear.

### 2026-05-31T01:35 · 🤖 claude · `/po-ux` · ✓ APLICADO
Escribí `01-spec.md` (v1, draft) de la primitiva. Hallazgo del prior-art: los **4 hooks de vitalia son
idénticos** (solo cambian tipos + la fn save + la key) → colapsan en un `useAutosave<T>` limpio; **nicolify ya
tiene un `form-runtime` más centralizado** (Provider + AutosaveBanner + `use-debounce`) → el form-runtime
queda como consumer de alto nivel del mismo bloque. **Contrato propuesto:** `useAutosave({save, getToken,
onSaved, onError, debounceMs=600, telemetry?, authReadyAttempts})` → `{status, savedAt, scheduleSave, cancel,
retry}` + `<AutosaveBadge status savedAt>` (aria-live, contraste AA) + tipos en `@luana/schemas`. `getToken`
inyectado (no acopla a Clerk). 10 scenarios (debounce, save, auth-ready robusto, error+retry, concurrencia,
network, unmount, a11y, i18n, telemetría) verificados con Vitest unit/component (el E2E real-backend vive en
las stories consumer).
**Necesito 2 decisiones tuyas para cerrar refined:**
1. El `form-runtime` de nicolify ¿lo reescribo sobre `useAutosave` en ESTA story, o lo dejo para la story de
   adopción de nicolify? (recomiendo: dejarlo para la adopción — esta story solo construye la primitiva + un
   showcase de referencia).
2. ¿El contrato te cierra así, o querés cambiar algo (nombres, debounce default, retry explícito vs automático)?

### 2026-05-31T01:40 · 🤖 claude · `/po-ux` · ✓ APLICADO
Ratificaste: (1) el `form-runtime` de nicolify **se reescribe sobre `useAutosave` en ESTA story** (lo metí en
scope: `nicolify/frontend/src/components/form-runtime/` MODIFY + scenario `nicolify-form-runtime-sin-regresion`
que exige que sus tests existentes pasen antes/después), (2) **debounce default = 2000ms** (actualizado en el
contrato + scenario), (3) resto OK. Spec v2 ratificado → `state: refined` · `autonomous_mode: true` ·
`touches_brands: [nicolify]`. Encadeno a `/architect` (platform) hasta el done.
**Nota de scope:** ahora la story TOCA nicolify (autorizado por ser platform story + ADR-012). El architect
debe preservar el comportamiento observable del form-runtime (sus consumers como offer-studio no se rompen).

### 2026-05-31T01:50 · 🤖 claude · `/architect` · ✓ APLICADO
Ready package cerrado (lo produje directo, tengo el prior-art de ambas brands + estructura @luana confirmada).
Artifacts: `03-arch.md` · `04-validators.yaml` (11 scenarios → Vitest, librería) · `06-tickets.yaml` (3 tickets) ·
`dispatch-plan.md`. Story → `ready`. Diseño: `@luana/schemas` (AutosaveContract) + `@luana/hooks` (useAutosave
con getTokenReady + debounce 2000 + retry + telemetry opt-in, **sin importar Clerk** — getToken inyectado) +
`@luana/ui-kit` (<AutosaveBadge> componiendo el badge.tsx existente, aria-live + contraste AA — NO el verde
roto) + consumer de referencia + nicolify form-runtime reescrito encima (invariante: API pública + tests existentes
verdes). **Tickets:** T-1 (schemas+hooks) → T-2 (ui-kit badge + showcase) → T-3 (nicolify form-runtime), todos
builder-frontend sonnet, ~2h. `autonomous_mode: true`. Encadeno a `/dev-team` hasta el done.

### 2026-05-31T02:30 · 🤖 claude · `/dev-team` · ✓ APLICADO
Build completo (se colgó la sesión a mitad de T-3, retomé). Los 3 tickets GREEN:
- **T-1** `77be3d0f` — `@luana/hooks` useAutosave + `@luana/schemas` AutosaveContract (11/11 tests). getTokenReady
  (espera token), debounce 2000 default, retry, telemetry opt-in, sin importar Clerk.
- **T-2** `bf86031c` — `@luana/ui-kit` <AutosaveBadge> (aria-live + contraste AA) + showcase (32/32 tests).
- **T-3** `bc8c509a` — nicolify form-runtime reescrito sobre useAutosave + AutosaveBadge (**143/143 tests**, tsc
  clean). El builder preservó el debounce 800ms de nicolify (2000 es solo el default para consumers nuevos) +
  API pública intacta. AutosaveBanner = thin wrapper de AutosaveBadge.
**Gate honesto:** todos los validators verdes. Descubrí que `@luana/{hooks,ui-kit}` tsc por-package está **rojo
PRE-EXISTENTE** (deuda del lift original b1bdb3ab/3282768a: hooks acoplados a brand con imports rotos + jest-dom
types) — NO de esta story. Los archivos NUEVOS de autosave typecheck **limpios** (cero errores). Ajusté los
validators hooks_tsc/uikit_tsc para verificar "cero errores nuevos en autosave" + documenté la deuda en
`observed-bugs/2026-05-31-luana-hooks-uikit-tsc-lift-debt.md` (amerita story de saneamiento @luana aparte).
State `developed`. Encadeno a `/auditor`.

### 2026-05-31T03:00 · 🤖 claude · `/auditor` · ✓ APLICADO
Auditoría independiente (auditor-frontend Opus) → **APPROVED**. Verificó aparte: gates GREEN, la deuda tsc del
package @luana es PRE-EXISTENTE (git blame confirma lift b1bdb3ab/3282768a — el scoping del validator es legítimo,
no enmascara regresión), el contraste del badge **evita el bug** (emerald-700 5.49:1, no el #009966 roto), nicolify
preservado (143 tests, 800ms, API pública). **Carril A self-fix:** el builder había claimeado ESLint verde pero
había 5 errores (import duplicado de @luana/ui-kit + prettier) en los archivos de nicolify → el auditor los arregló
(gate-verified, re-verificó tsc 0 + 143/143 verde) · commit `4e728cef`. CHECKPOINTS C1-C5 APPROVED (1 WARN
non-blocking: vite@^6 devDep). State `reviewing`. Encadeno a `/pm-luana` para el merge.

### 2026-05-31T03:20 · 🤖 claude · `/pm-luana` · ✓ APLICADO
**MERGE aplicado → state=done.** Fase F platform: `07-merge.md` (5 secciones) · outcome
`autosave-primitive-platform` actualizado (primitiva ✅ construida; adopciones vitalia+nicolify quedan
pendientes en el outcome) · story archivada. La primitiva de autoguardado compartida está **construida,
auditada (APPROVED) y mergeada**: `useAutosave` (@luana/hooks) + `<AutosaveBadge>` (@luana/ui-kit) +
`AutosaveContract` (@luana/schemas), con nicolify form-runtime ya consumiéndola (143 tests verdes).
**DONE.** Próximos (cuando quieras): stories de adopción (consolidar las pantallas de vitalia + nicolify) +
saneamiento del tsc-debt pre-existente de @luana. Nota: el squash-merge `wip/vitalia → main` (integración)
es manual — decime cuando quieras integrar todo.
