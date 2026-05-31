# Frontend Visual Fidelity — operational detail (loaded on-demand, moved from .claude/rules/ 2026-05-30)


**Origen:** sesión 2026-05-28 — Chris pidió fijación en el **cumplimiento visual** del frontend: usar los átomos/moléculas ya definidos, FSD muy cuidado, y **pegarse lo más posible al mockup**, verificado por Playwright. Problema observado: hay mockups que luego se implementan y **no se parecen**. Matiz: los mockups a veces tienen MÁS de lo que la historia desarrolla → la regla NO es "construí todo el mockup" sino "cumplí visualmente lo que la historia SÍ scopea, sin exceder".

**Cement-date:** 2026-05-28. **Aplica a:** `/architect` (FE), `builder-frontend`, `auditor-frontend`. **Complementa:** `frontend-fsd.md` (boundaries) + `frontend-quality.md` (gates) + `spanish-text.md` + `anti-orphan-integration.md`.

## Regla cardinal

El FE construido debe **(1) reutilizar el design system existente, (2) parecerse al mockup en lo que la historia scopea, y (3) NO exceder la historia**. Tres disciplinas, una verificación (Playwright + auditor).

### D1 — Design system first (átomos/moléculas, NO reinventar)

Antes de crear cualquier elemento visual, el builder MUST buscar y reutilizar, en orden:
1. **Átomos** — primitivas Shadcn en `{brand}/frontend/src/components/ui/` (Button, Input, Card, Dialog, Select, Badge, …). NUNCA reinventar una primitiva que ya existe.
2. **Tokens** — `@luana/design-tokens` (colores, spacing, radios, tipografía) + Tailwind theme del brand. NUNCA hardcodear hex/px que ya son token.
3. **Moléculas compartidas** — `{brand}/frontend/src/components/shared/` (composiciones cross-feature ya definidas).
4. **Solo si nada sirve** → crear el componente en la feature (`features/{m}/components/`), construido CON átomos (no desde cero con `<div>` crudos).

```bash
# Gate pre-crear componente visual (builder + auditor):
WS=$(git rev-parse --show-toplevel); BRAND={brand}
ls ${WS}/${BRAND}/frontend/src/components/ui/           # átomos disponibles
ls ${WS}/${BRAND}/frontend/src/components/shared/        # moléculas disponibles
grep -rn "<NombrePropuesto" ${WS}/${BRAND}/frontend/src  # ¿ya existe algo parecido?
```

Reinventar un átomo existente → auditor-frontend FAIL (duplicación de design system, también cae bajo `anti-duplication.md`).

### D2 — Mockup adherence (pegarse al diseño)

El builder implementa para **parecerse al mockup** de `02-design-ui.md` (wireframes / `mockups/` / Figma link): jerarquía visual, layout, spacing relativo, estados (default/hover/loading/empty/error/success), y microcopy (Spanish neutro, `spanish-text.md`).

- El architect, en `02-design-ui.md` / `03-arch.md § FE`, declara los **elementos visuales clave** que deben estar presentes (no pixel-perfect: elementos + jerarquía + estados).
- Fidelidad = "un humano comparando mockup vs implementación reconoce que es la misma pantalla", no igualdad de pixeles.

### D3 — Scope discipline (NO exceder la historia)

El mockup puede mostrar MÁS de lo que la historia desarrolla (secciones futuras, features adyacentes, datos de relleno). El builder implementa **solo lo que scopean los scenarios de `01-spec.md` + los `deliverables` del ticket**. Lo demás del mockup: NO se construye en esta story.

- El architect declara en `04-validators.yaml § playwright_visual_scope`: `story_scope_routes` + `story_scope_components` (lo que SÍ es de esta historia) y `out_of_mockup_scope` (lo que el mockup muestra pero NO va ahora).
- Si el builder cree que algo del mockup es necesario pero está fuera de scope → lo documenta en `T-{n}-impl-log.md § Mockup scope notes`, NO lo construye (escalate `/pm-{brand}` para spec extension).
- Anti-exceso: construir secciones del mockup fuera de los scenarios = scope creep → auditor WARN/CHANGES_REQUESTED + posible isla (anti-orphan).

## Verificación Playwright (cumplimiento visual)

`04-validators.yaml § visual` declara assertions Playwright **scoped a los componentes de la historia** (no snapshot global frágil):
- Presencia + jerarquía de los elementos clave del mockup en `story_scope_components`.
- Estados: empty / loading / error / success renderizan como el mockup.
- Responsive: breakpoints declarados en el mockup (si aplica).
- Bounded assertions (rol/testid/texto visible), NUNCA `toHaveScreenshot()` de página completa fuera de scope (drift en zonas no tocadas rompería el test — ver `architect-autonomous-mode.md § playwright_visual_scope`).

```ts
// Patrón: assertion scoped al componente de la historia, no snapshot global
await expect(page.getByTestId('appointment-form')).toBeVisible();
await expect(page.getByRole('button', { name: 'Confirmar reserva' })).toBeEnabled();
// estado empty del mockup:
await expect(page.getByText('Aún no hay reservas')).toBeVisible();
```

`chrome-devtools-verify` (reinstaurado, Chrome DevTools MCP oficial) para verificación conversacional live del cumplimiento visual antes de cerrar.

## Auditor-frontend — categoría Visual fidelity

`auditor-frontend` verifica: (a) átomos/moléculas reutilizados, cero primitiva reinventada · (b) tokens usados, cero hex/px hardcodeado fuera de token · (c) FSD boundaries (`frontend-fsd.md`) · (d) elementos clave del mockup presentes (vía Playwright visual + screenshot) · (e) scope: NO se construyó fuera de la historia · (f) Spanish neutro. Carril A self-fix aplica a fidelidad cubierta por test existente (swap a átomo, token, estado faltante).

## Anti-patterns prohibidos

- ❌ Reinventar un átomo Shadcn que ya existe en `components/ui/`
- ❌ Hardcodear color/spacing/radius que ya es token de `@luana/design-tokens`
- ❌ `<div className="...">` crudos componiendo algo que es un átomo/molécula existente
- ❌ Implementar TODO el mockup cuando la historia scopea solo una parte (scope creep)
- ❌ Ignorar estados del mockup (empty/error/loading) — son parte de la fidelidad
- ❌ `toHaveScreenshot()` de página completa fuera del scope de la historia (frágil)
- ❌ Cerrar ticket FE sin verificación visual (Playwright scoped o `chrome-devtools-verify`)
- ❌ Microcopy con voseo (salvo sales_agent) — ver `spanish-text.md`

## Enforcement layers

| Layer | Mecanismo | Status |
|---|---|---|
| 1 | `/architect` FE: `02-design-ui.md` elementos clave + `04-validators § playwright_visual_scope` (story_scope vs out_of_mockup_scope) | ⏳ architect-fe SKILL update |
| 2 | `builder-frontend` step: design-system-first gate + mockup adherence + scope discipline | ⏳ builder-frontend update |
| 3 | `auditor-frontend` categoría Visual fidelity | ⏳ auditor-frontend update |
| 4 | Playwright visual assertions scoped (`04-validators § visual`) | ✅ schema existe (reforzar scoping) |
| 5 | `chrome-devtools-verify` live visual check pre-cierre FE | ✅ reinstaurado |

## Referencias

- `.claude/rules/frontend-fsd.md` — boundaries FSD-Lite + design system layers
- `.claude/rules/frontend-quality.md` — gates (tsc/eslint/vitest/jscpd)
- `.claude/rules/architect-autonomous-mode.md § playwright_visual_scope` — disciplina de scope visual
- `.claude/rules/spanish-text.md` — microcopy neutro
- `.claude/rules/anti-orphan-integration.md` — el componente debe estar enchufado (nav/route)
- `core/@luana/design-tokens` — tokens cross-brand
