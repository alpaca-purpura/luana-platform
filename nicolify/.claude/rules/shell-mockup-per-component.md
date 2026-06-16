# Nicolify — Mockup-Base Protocol (cero alucinación UI)

**Overlay:** extiende `.claude/rules/` raíz (refuerza `frontend-visual-fidelity.md` + `frontend-fsd.md`).
**Brand:** nicolify · **Cement-date:** 2026-06-15 · **SSoT:** `nicolify/docs/architecture/ADR-nicolify-003-mockup-base-protocol.md`.
**Mirror de:** `vitalia/.claude/rules/shell-mockup-per-component.md` (adaptado: sin PHI · guardrails agénticos).

## Regla cardinal

Todo mockup HTML de nicolify se **compone de la base canónica reusable**, obligatoriamente:

1. **`<link rel="stylesheet" href="_shared.css">`** — la base (tokens espejo de `globals.css` + átomos + moléculas + layout-primitives + shell wrapper). SSoT: `nicolify/docs/product/stories/nicolify-r0-design-system-adoption/mockups/_shared.css`. El mockup SOLO escribe su `.panel-content`. **Cero estilo inline de layout, cero arbitrary-value.**
2. **Shell wrapper VERBATIM** — Luana sidebar + Ribbon N1 + SubTabs N2 + EntitySubNavBar N3 viven en `_shared.css`, portados verbatim de `nicolify-r0-shell-organism/mockups/shell.html`. **Prohibido reinventarlos.** Solo cambia `.panel-content`.
3. **Visual golden** — `01-spec.md § Visual Goldens` mapea `mockup HTML → golden → componente React (@luana/ui-kit/feature) → canon ref`. `/dev-team` genera Playwright side-by-side (`maxDiffPixelRatio: 0.001`). Ratchet shrink-only.

Sin (1)+(2)+ratificación (`mockup_final_signed: true`) → `/architect` REFUSE arrancar.

## Scope

**Aplica** (gate bloqueante): toda story con UI nueva (sub-tab `abel-*`/`brenda-*`/`christian-*`/`sara-*`/`norvil-*`/`config-*`, componente del shell).
**NO aplica:** service-only · agentic-conversacional pura (`/ux-agentico`) · componentes atómicos aislados sin shell · las stories origen (`nicolify-r0-shell-organism`, `nicolify-r0-design-system-adoption`).

## Constraints

- Tokens del `_shared.css` = espejo HSL de `nicolify/frontend/src/app/globals.css` (NUNCA inventar). Identidad de marca (#635BFF + agent colors + League Spartan/Bree Serif) verificada vs nicolify.com.
- Datos LatAm B2B realistas (no Lorem ipsum). Spanish neutro (tuteo, sin voseo).
- Átomos/moléculas/primitivas = clases que reflejan `@luana/ui-kit` + `design-system-canon.md §6`. NO inventar primitivas (`frontend-visual-fidelity.md` D1).
- Superficie que un agente opera → mostrar audit/consentimiento en la hoja (guardrails agénticos `agent-revenue-engine.md`). Sin PHI.

## Servidor local

```bash
WS=$(git rev-parse --show-toplevel)
cd ${WS}/nicolify/docs/product/stories/{story-id}/mockups && python3 -m http.server 8888
# Chris abre http://localhost:8888/{mockup}.html · itera con /po-ux hasta ratificar
```

## Ratificación (checkpoint.md)

```yaml
ratified_visual_by_chris: true
mockup_final_signed: true
ratified_visual_mockups: [nicolify/docs/product/stories/{id}/mockups/{mockup}.html]
```

## Anti-patterns

- ❌ Mockup con `<style>` de layout inline en vez de `<link _shared.css>` (caso origen: `ds-base.html` v1)
- ❌ Reinventar el shell wrapper simplificado en vez de portarlo verbatim de `shell.html`
- ❌ Tokens HSL inventados/divergentes de `globals.css`
- ❌ `/architect` arranca sin `mockup_final_signed: true` + `_shared.css` linkeado
- ❌ `/po-ux` transition refining→refined sin mockup compuesto de la base
- ❌ Arbitrary-value o `<div>` de layout a mano en el mockup (rompe "lo que veo = lo que programo")

## Enforcement layers

| Layer | Mecanismo |
|---|---|
| `/po-ux` Step 5 | verifica `<link _shared.css>` + wrapper verbatim + `mockup_final_signed` |
| `/architect` REFUSE | gate pre-arch: sin base+ratificación no arranca |
| `/dev-team` | genera visual golden mockup↔React (`maxDiffPixelRatio: 0.001`) |
| `/auditor` | score fidelidad (D1 mecánico: lint no-arbitrary + arch-test no-div-layout) |

## Referencias

- `nicolify/docs/architecture/ADR-nicolify-003-mockup-base-protocol.md` — SSoT (el por qué)
- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` — átomos/moléculas/shell + props
- `nicolify/docs/product/stories/nicolify-r0-design-system-adoption/mockups/_shared.css` — la base
- `nicolify/docs/product/stories/nicolify-r0-shell-organism/mockups/shell.html` — wrapper SSoT
- `docs/architecture/luana-platform/design-system-canon.md` — contratos cross-brand
- `vitalia/.claude/rules/shell-mockup-per-component.md` — el mirror origen
- `nicolify/.claude/rules/shell-feature-architecture.md` — ADR-nicolify-001 (build pattern, complementario)
