---
story_id: core-ds-tokens-lock
title: S-CORE-DS-TOKENS-LOCK — escala de tokens compartida + lock mecánico de arbitrary (Fase 0 DS homologation)
brand: platform
type: service-story          # contrato + tooling (token package + regla eslint), sin UI
state: refining
verification_nature: tecnica # sin superficie user-reachable → gates automáticos, sin demo manual
po_version: 1
ratified_by_chris: false
parent_outcome: docs/product/outcomes/luana-core-ui-foundation.md
parent_adr: docs/architecture/luana-platform/ADR-014-design-system-homologation.md
parent_proposal: docs/promotion-protocol/proposals/2026-06-07-design-system-homologation.md
track: A
cap_target: infra/design-system-tokens-lock     # 💡 PROPONE — zona Infraestructura/plataforma-tecnica (user_visible:false)
cap_change_type: new
---

# 01-spec — S-CORE-DS-TOKENS-LOCK (Fase 0 design-system homologation)

> Service/contract story platform. Track A (independiente — no gateada por las 4 stories abiertas).
> Doctrina: ADR-014. Plan: proposal 2026-06-07. Decisiones ratificadas: `checkpoint.md::ratified_decisions`.

## Context

**Origen:** Chris 2026-06-07 — *"el dev-team crea cada interfaz a su forma → se siente otra app"*. ADR-014 fija que **solo el enforcement mecánico** sostiene la consistencia (vitalia tiene tokens+skill+rule D1 y aun así driftea). Fase 0 = el quick-win que **frena el drift NUEVO desde el día 1**, sin tocar código de feature.

**Grounding (medido 2026-06-07, `vitalia/frontend/src`):** 650 arbitrary-values totales. Desglose: font-size `text-[..]` **182** · sizing `w/h/min/max` **189** (mucho legítimo) · color `[#hex]` **64** · radius **32** · spacing `p/m/gap` **~10 (ya casi limpio)**. El drift real (278) vive en font-size+color+radius — los tres ya tienen tokens, falta el **lock**.

**Invariante de arquitectura (descubierto al fundar el scope):** solo **spacing** es cross-brand idéntico (Tailwind 4px-base). **radius/font/color** son **valores per-brand sobre nombres compartidos** (vitalia `--radius:.625rem` vs comunify `.75rem`; agentes distintos por marca). Por eso Fase 0 **NO fusiona paletas**: consolida la **escala spacing** (compartida) + el **contrato de nombres** (radius/typo tiers), y el lock **fuerza clases nombradas** (que resuelven per-brand vía theme). Prohibir hex crudo ⇒ forzar token nombrado, **no** unificar el valor.

## Decisiones ratificadas (Chris 2026-06-07)

| ID | Decisión |
|---|---|
| D1 · escala spacing | Tailwind default 4px-base as-is (4/8/12/16/20/24/32/40/48/64). Migración spacing ~0. |
| D2 · scope del lock | eslint no-arbitrary prohíbe **spacing + radius + font-size + color-hex** (278 drift). **Allowlist** `w/h/min/max` sizing (189). Ratchet **shrink-only**. |
| D3 · piloto | vitalia primero. |

## Scope

**IN (Fase 0):**
1. Exportar la **escala spacing** (Tailwind 4px-base) desde `core/@luana/design-tokens` como SSoT compartida (hoy el paquete solo exporta `z-index`).
2. Exportar el **contrato de nombres/tiers** de radius (`sm/md/lg/bubble/pill`) y tipografía (`display/heading/body`) desde `@luana/design-tokens` (los **valores** quedan en el theme de cada marca).
3. **Regla eslint** que da **error** sobre arbitrary-values Tailwind en los ejes **{spacing, radius, font-size, color}** (incluye hex crudo `bg-[#..]`/`text-[#..]`/`border-[#..]`).
4. **Allowlist ratchet shrink-only**: un baseline tildado con las 278 ocurrencias existentes en ejes lockeados (no rompen el build); el conteo **solo puede bajar**. Toda arbitrary NUEVA en eje lockeado = error.
5. Ejes **`w/h/min-w/max-w/min-h/max-h`** quedan **permitidos** (sizing legítimo: íconos, anchos fijos) — fuera del lock de Fase 0.
6. **Encender el lock en vitalia** (piloto) cableado a su `eslint.config.mjs` + el gate FE existente.

**OUT (otras stories):**
- Layout-primitives capa 3 (`Page/PageHeader/Section/Toolbar/...`) → `S-CORE-DS-LAYOUT-PRIMITIVES` (Track B).
- Migración comprehensiva de las 278 (vaciar el allowlist) → `S-VITALIA-DS-ADOPTION` (Fase 3).
- Encender lock en nicolify/comunify → stories de adopción por marca.
- **Fusionar valores de color/radius cross-brand** → explícitamente NO (rompería identidad de marca).

---

## § Mapa funcional (capa humana — va antes del Gherkin)

### Happy path (narrado)
Un dev (o builder) abre un PR que toca `vitalia/frontend/src`. El gate FE corre eslint. Si el código introduce un arbitrary-value **nuevo** en un eje lockeado (ej. `text-[13px]`, `rounded-[7px]`, `text-[#635BFF]`, `p-[18px]`), **eslint da error** y nombra la alternativa tokenizada (`text-sm`, `rounded-md`, `text-agent-adrian`, `p-4`). El dev usa la clase nombrada → el lint pasa → el drift no entró. Las 278 ocurrencias viejas, ya tildadas en el allowlist baseline, **no rompen** el build; pero el baseline **solo puede bajar** (al migrar, se borran del allowlist; nunca se agregan).

### Bifurcaciones
| ID | Condición | Resultado | Scenario |
|---|---|---|---|
| Bif-1 | arbitrary NUEVO en eje lockeado (spacing/radius/font/color) | eslint **error** + sugerencia token | SC-1 (happy) |
| Bif-2 | arbitrary en eje de **sizing** (`w/h/min/max`) | **permitido** (lint pasa) | SC-2 (negative) |
| Bif-3 | arbitrary viejo ya en allowlist baseline | permitido (no rompe), pero contabilizado | SC-3 (edge) |
| Bif-4 | se intenta **agregar** una entrada nueva al allowlist (crecer) | gate **falla** (ratchet shrink-only) | SC-3 (edge) |
| Bif-5 | escape legítimo puntual (caso raro justificado) | comentario de escape documentado → permitido + auditable | SC-4 (adversarial) |

### Reglas de negocio
- **RN-1** El lock aplica SOLO a los ejes ratificados {spacing, radius, font-size, color}. Sizing (`w/h/min/max`) está fuera.
- **RN-2** El allowlist es **shrink-only**: el conteo baseline nunca aumenta (un PR que sube el conteo = gate falla).
- **RN-3** El lock se **enciende por marca** (Fase 0 = solo vitalia). nicolify/comunify NO se rompen (su config no carga la regla aún) — opt-in.
- **RN-4** La escala spacing en `@luana/design-tokens` = Tailwind 4px-base **as-is** (no se inventa ritmo nuevo).
- **RN-5** Color: prohibir hex crudo ⇒ forzar token **nombrado**; el **valor** del token permanece per-brand (no se consolida cross-brand).
- **RN-6** Escape documentado (`// ds-lock-allow: <razón>`) permite un arbitrary puntual y queda auditable (no es bypass silencioso).

### Criterios de aceptación
- **AC-1** `core/@luana/design-tokens` exporta la escala spacing + el contrato de nombres radius/typo (antes: solo z-index).
- **AC-2** Un arbitrary nuevo en eje lockeado **falla** el lint de vitalia con mensaje accionable.
- **AC-3** Un arbitrary de sizing **pasa** el lint.
- **AC-4** El baseline allowlist arranca con las 278 ocurrencias existentes y el ratchet **bloquea** cualquier incremento.
- **AC-5** El lint de **nicolify y comunify NO cambia** (opt-in; no se rompen).
- **AC-6** Existe arch-test que verifica el ratchet shrink-only (baseline file + conteo).

---

## Scenarios (Gherkin AI-resistant · 4/4)

### SC-1 · happy — arbitrary nuevo en eje lockeado bloqueado
**Covers:** [Bif-1, RN-1, RN-4, AC-2]
```gherkin
Given el lock de design-tokens está encendido en vitalia
  And un fixture/archivo introduce la clase nueva "text-[13px]" (font-size arbitrary)
When corre `npx eslint` sobre vitalia/frontend/src
Then eslint sale con exit code != 0
  And el error nombra la regla del lock (no-arbitrary en eje font-size)
  And el mensaje sugiere la clase tokenizada equivalente (ej. "text-sm")
```
graders:
- { type: contract_test, path: "vitalia/frontend/src/__tests__/architecture/test-ds-tokens-lock.test.ts", note: "fixture string con text-[13px] → la regla reporta error" }
- { type: state_check, target: lint, expect: "eslint exit!=0 sobre fixture locked-axis" }

### SC-2 · negative — sizing arbitrary permitido (no falso-bloqueo)
**Covers:** [Bif-2, RN-1, AC-3]
```gherkin
Given el lock de design-tokens está encendido en vitalia
  And un archivo usa "w-[200px]" y "max-w-[640px]" (sizing arbitrary legítimo)
When corre `npx eslint` sobre vitalia/frontend/src
Then la regla del lock NO reporta error sobre esas clases
  And el lint global pasa si el resto está limpio
```
graders:
- { type: contract_test, path: "vitalia/frontend/src/__tests__/architecture/test-ds-tokens-lock.test.ts", note: "fixture con w-[200px]/max-w-[640px] → 0 errores de la regla" }

### SC-3 · edge — ratchet shrink-only (baseline no crece)
**Covers:** [Bif-3, Bif-4, RN-2, AC-4, AC-6]
```gherkin
Given existe un baseline allowlist tildado con las 278 ocurrencias arbitrary actuales de ejes lockeados
When un PR introduce 1 arbitrary lockeado adicional sin migrar ninguno (conteo 278 → 279)
Then el arch-test del ratchet falla (el conteo subió)
  And el gate FE de vitalia falla
When en cambio un PR migra 5 ocurrencias del baseline a tokens (conteo 278 → 273)
Then el arch-test del ratchet pasa
  And el baseline file refleja 273
```
graders:
- { type: contract_test, path: "vitalia/frontend/src/__tests__/architecture/test-ds-tokens-lock-ratchet.test.ts" }
- { type: state_check, target: file, query: "baseline allowlist count monotónicamente no-creciente" }

### SC-4 · adversarial — escape silencioso vs escape documentado
**Covers:** [Bif-5, RN-6]
```gherkin
Given el lock está encendido en vitalia
  And un dev intenta saltar el lock con un eslint-disable genérico sin razón
Then el escape genérico NO es aceptado como patrón (la disciplina exige el comentario nombrado del lock)
When en cambio usa el escape nombrado "// ds-lock-allow: <razón concreta>"
Then el arbitrary puntual es permitido
  And queda auditable (grep-able) para revisión posterior
  And NO incrementa el baseline ratchet de forma oculta
```
graders:
- { type: contract_test, path: "vitalia/frontend/src/__tests__/architecture/test-ds-tokens-lock.test.ts", note: "escape nombrado permitido + auditable; disable genérico desaconsejado" }
- { type: state_check, target: grep, query: "ocurrencias de ds-lock-allow son finitas + justificadas" }

---

## § Matriz de cobertura

| Bif / RN | Scenario | Verificación REAL (no GET 200) |
|---|---|---|
| Bif-1 / RN-1 / RN-4 | SC-1 | correr eslint sobre fixture locked-axis → exit!=0 + mensaje |
| Bif-2 / RN-1 | SC-2 | correr eslint sobre fixture sizing → 0 errores de la regla |
| Bif-3+4 / RN-2 | SC-3 | arch-test ratchet: +1 falla, −5 pasa; baseline file refleja conteo |
| Bif-5 / RN-6 | SC-4 | escape nombrado permitido + grep-auditable; disable genérico desaconsejado |
| RN-3 / AC-5 | SC-2 + check | correr eslint nicolify/comunify → SIN cambio (regla no cargada) |
| AC-1 | (build) | `@luana/design-tokens` exporta spacing+contrato radius/typo (import resuelve) |

> Verificación = ejercer el lint/arch-test de verdad sobre fixtures reales + leer el exit code, NO asumir. La superficie es tooling (no hay UI ni dev-app); la "acción real" es correr el gate.

## Deliverables (para /architect → /dev-team)
1. `core/@luana/design-tokens/src/spacing.ts` (+ index export) — escala 4px-base.
2. `core/@luana/design-tokens/src/radius.ts` + `typography.ts` (contrato de nombres/tiers; valores per-brand vía theme).
3. Regla eslint del lock (plugin existente o regla custom — lo decide /architect) + baseline allowlist file.
4. `vitalia/frontend/eslint.config.mjs` cableado a la regla (piloto).
5. Arch-tests: `test-ds-tokens-lock.test.ts` + `test-ds-tokens-lock-ratchet.test.ts`.
6. Doc corto del escape `// ds-lock-allow:` + cómo migrar una ocurrencia.

## Open questions (Chris)
- **Q1** — ¿`cap_target: infra/design-system-tokens-lock` (zona Infraestructura/plataforma-tecnica, user_visible:false) te cierra como hogar de cap, o preferís colgarlo sin cap (puro tooling)?
- **Q2** — El **escape** lo propongo como comentario nombrado `// ds-lock-allow: <razón>` (auditable). ¿OK ese mecanismo, o preferís cero-escape (lock duro, solo allowlist baseline)?
- **Q3** — Confirmás que Fase 0 **NO** mueve los valores de color/radius por-marca a un archivo compartido (solo el contrato de nombres + escala spacing) — i.e. cero merge de paletas. (Lo doy por ratificado por la lógica anti-breaking, pero lo marco explícito.)
