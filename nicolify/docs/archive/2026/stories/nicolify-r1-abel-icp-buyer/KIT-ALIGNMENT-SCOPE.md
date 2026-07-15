# abel-icp-buyer — Kit-alignment pass (pre-merge · Chris-requested 2026-06-24)

> **Por qué.** abel se construyó ANTES del pivot kit-only (2026-06-22). El inventario atomic-design (`@luana/ui-kit`, Storybook) es ahora el SSoT visual. abel es la **1ª hoja real de agente** → patrón que copian Brenda/Christian/Sara/Norvil. Chris ratificó (2026-06-24): **alinear abel al canon ANTES del demo gate #37 + merge**, para que sea la referencia áurea. NO es re-diseño — es adopción mecánica del kit + page-primitives.
>
> **Naturaleza:** FIX-LOOP de adopción DS dentro de `reviewing` (el verdict del auditor + el DoD live-verify SIGUEN válidos — esto solo cambia de qué átomo sale cada control, no el comportamiento). Mantener **vitest GREEN** + **0 regresión funcional**. Re-correr gates al cerrar.

## Doctrina binding

- `docs/architecture/luana-platform/design-system-canon.md` (§0 tokens · §2.5 Select · §2.7 page-primitives · §5 Storybook-first)
- `.claude/rules/frontend-visual-fidelity.md § Storybook` (D1 — partir del kit, no reinventar)
- `nicolify/.claude/rules/shell-mockup-per-component.md` (Storybook-first) + `nicolify-design-system` skill (cargar)
- Regla del kit: consumir de `@luana/ui-kit`; `<select>`/`<textarea>`/`<button>` nativos, arbitrary-values y `<div>` de layout donde hay primitiva = **prohibido** (canon §0/§2.5/§2.7).

## Targets verbatim (7 señales de drift · 4 componentes · 21 layout-divs)

Paths bajo `nicolify/frontend/src/features/abel/components/icp/`. Líneas aproximadas (re-localizar antes de editar).

### 1. BuyerLeafForm.tsx — DRIFT(3) + 8 layout-divs
- `<textarea>` nativo (~L60) → `Textarea` de `@luana/ui-kit`
- `<button>` nativo remove-item (~L165) → `Button` (variant ghost/icon) del kit
- `<button>` nativo "+ Agregar" (~L176) → `Button` del kit
- **`<select>` nativo** decision-power (~L420) → `Select` canónico del kit (controlado: `value` + `onValueChange`; preservar el set de opciones + el RHF wiring)
- 8 `<div>` de layout (`flex-col gap-…` / `grid-cols-…`) → page-primitives (`Section`/`PageContentStack`/`Group`/grid del kit)

### 2. IcpDatosForm.tsx — DRIFT(3) + 9 layout-divs
- `<textarea>` nativo (~L79) → `Textarea` del kit
- `<button>` nativo remove-signal (~L522) → `Button` del kit
- arbitrary-value `min-h-[28px]` (~L514) → token de spacing/altura (canon §0; nada de bracket-values)
- 9 `<div>` de layout → page-primitives

### 3. IcpCard.tsx — DRIFT(1) + 1 layout-div
- `Badge` importado de `@/components/ui` → `Badge` de `@luana/ui-kit`
- 1 `<div>` de layout → primitiva

### 4. IcpIntakeOverlay.tsx — DRIFT(1) + 3 layout-divs
- arbitrary-value `sm:max-w-[560px]` (~L163) → token de sizing (o prop del `Dialog` del kit)
- Dialog/Button hoy de `@/components/ui` → rutear al `Dialog`/`Button` de `@luana/ui-kit` (el kit los exporta) — **salvo** que `components/ui/*` sea la capa-átomo sancionada que re-exporta el kit; verificar contra el contrato (`SHELL-DESIGN-CONTRACT.md § balde-2`) + las ratchets antes de tocar a ciegas
- 3 `<div>` de layout → primitivas

## Nota sobre `@/components/ui/*`

Las ratchets HB-106/107 pasan GREEN porque su **baseline se sembró HOY (39 divs/11 files)** y grandfathea este drift — GREEN ≠ alineado. Decidir explícito si `components/ui/*` es la capa-átomo brand sancionada (re-export del kit, OK) o drift que debe rutear a `@luana/ui-kit`. Seguir el `SHELL-DESIGN-CONTRACT.md` (clasificación balde-1/2/3) + el canon. **No** swappear `@/components/ui` → kit a ciegas si el contrato lo declara sancionado.

## Cierre del pass (gates)

1. Re-correr: `npx tsc --noEmit` · `npx eslint src/ --cache` (incl. no-arbitrary) · `npx vitest run` (abel suite GREEN, sin regresión) · las 4 ratchets DS.
2. **Bajar el baseline** de las ratchets por la cuota de abel migrada:
   - `test-no-div-layout.test.ts` `BASELINE_TOTAL` 39 → (39 − divs-abel-migrados) y `BASELINE_FILES` 11 → (11 − files-abel-vaciados). Bajar SOLO lo que realmente migraste (shrink-only honesto).
   - idem `test-no-native-select.test.ts` si el `<select>` de BuyerLeafForm estaba contado.
3. Verificación visual: composición contra las stories del kit (canon §5) — no contra mockup HTML.
4. **Scope discipline:** SOLO los 4 componentes de arriba (+ sus tests). NO tocar `components/shared/intake/UniversalIntake.tsx` ni `DraftFirstStarter.tsx` (drift compartido = adoption story, fuera de este scope) salvo que el fix de IcpIntakeOverlay lo arrastre mínimamente.

## Después

GREEN → `/auditor` re-pass acotado a los archivos cambiados → demo gate #37 (Chris ejerce live) → `/pm-nicolify` merge (07-merge · cap status→live · archive R2 · reviewing→done).
