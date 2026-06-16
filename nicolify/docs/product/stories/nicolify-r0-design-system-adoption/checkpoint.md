---
story_id: nicolify-r0-design-system-adoption
brand: nicolify
type: ui-story                       # adopción visual cross-cutting — todas las hojas re-expresadas vía primitivas compartidas (esencia homologada · valores de marca propios)
state: refined                       # idea → refining → refined → ready → developing → developed → reviewing → done · refined 2026-06-15 (01-spec.md ratificado · FIRMA 1 + FIRMA 2)
release: R0                          # Fundación — homologar ANTES de crecer (ADR-014 HARD: "empezar homologado")
map_zone: infraestructura            # paradigma 3 zonas — atributo de calidad (consistencia UI cross-hoja) · derivada de SYSTEM-MAP::zones (a confirmar /architect)
map_box: plataforma-tecnica
map_area: design-system
module: design-system                # bucket code:design-system · toca nicolify/frontend/src broad + globals.css
architecture_pattern: ADR-014-design-system-homologation   # doctrina platform que implementa (5 capas + enforcement mecánico) + HARD cumplir SHELL-DESIGN-CONTRACT.md
cap_target: design-system/nicolify-ui-homologation
cap_change_type: new
route: null                          # cross-cutting — no es una hoja con ruta única
demo_required: true                  # visual: las hojas deben render idéntico/mejor, cero regresión
last_modified: 2026-06-15
phase: SPEC_RATIFIED                 # RONDA 1 + RONDA 2 firmadas · 01-spec.md ratificado
input_spec_signed: true             # ✍ FIRMA 1 (RONDA 1 funcional) — Chris 2026-06-15
mockup_final_signed: true           # ✍ FIRMA 2 (mockup ds-base.html) — Chris 2026-06-15 · colores verificados vs nicolify.com live
ratified_by_chris: true
mockup_reratified: true              # iteraciones ribbon-función/thumbnails/gear/luana-bubbles/pill-controls — Chris "todo bien" 2026-06-15
mockup_decisions:
  ribbon_labels: "función + agente: Mi Empresa·Abel · Atraer·Brenda · Vender·Christian · Operar·Sara · Retener·Norvil (Chris confirmó)"
  thumbnails: "avatares SVG placeholder existentes (public/agents/{slug}) — Chris entrega finales; NO regenerar"
  config: "⚙️ gear"
  luana_bar: "indigo de marca + estructura vitalia (header avatar + burbujas opacas bot=blanca/user=indigo-claro + composer adornos)"
  control_radius: "fully-rounded (pill) vía token --radius-control brand-overridable (RN-7) — flag /architect: kit Input/Button/Select debe exponerlo"
mockup_base_set: true               # _shared.css + ADR-nicolify-003 + rule shell-mockup-per-component.md (mirror vitalia)
last_artifact: 01-spec.md
next_action: "/architect nicolify nicolify-r0-design-system-adoption → ready package (refined→ready). Bif-5 (a): Abel-en-reviewing converge en esta historia (1 solo demo gate #37 sobre FE homologado). RN-7: verificar --radius-control en kit. ANTES: commitear lo uncommitted (pathspec)."
## Prior art scan (anti-duplication-refining — corrido 2026-06-15 · /pm-nicolify+/pm-luana)

> Resultado: **ADOPCIÓN PURA, cero creación**. Todo lo que esta story consume YA existe en el engine. No se recrea nada.

| Pieza | Existe en | Decisión |
|---|---|---|
| Átomos shadcn (button/card/dialog/select…) | `@luana/ui-kit` 0.4.1 | consumir (nicolify ya importa, 8 imports) |
| Moléculas (Entity*, AutosaveBadge, detail-panel) | `@luana/ui-kit` 0.4.1 | consumir |
| Layout-primitives (Page/Toolbar/states/pagination/skeletons) | `@luana/ui-kit` src/layout/ | **adoptar** (nicolify hoy: 0 consumidas, arma `<div>` crudos) |
| Page archetypes (List/Detail/Form/DashboardPageScaffold) | `@luana/ui-kit` src/archetypes/ | **adoptar** |
| Escala tokens (spacing/radius/typo/z-index) | `@luana/design-tokens` 0.2.0 | alinear globals.css a la escala |
| Enforcement no-arbitrary | `@luana/eslint-config` src/no-arbitrary-value.js (+test) | **encender** en nicolify/frontend |

- **Doctrina:** ADR-014-design-system-homologation + proposal `2026-06-07-design-system-homologation` (ambos **accepted**, ratif Chris). nicolify = consumer (Fase 3 adoption).
- **Fases 0-2 (escala + primitivas + archetypes + enforcement) = YA BUILT en @luana/ui-kit 0.4.1** → nicolify NO espera story platform; adopta lo shippeado.
- **Estado nicolify hoy:** 27 arbitrary-values, 0 layout-primitives consumidas. Superficie chica (vs vitalia 368) → costo de adopción bajo + momento ideal (status: rebuild, esqueleto).
- **NO abre proposal nueva** — cuelga del `2026-06-07` accepted.

## Nota de continuidad (fusión)

La entrada de backlog `nicolify-r0-design-system-tokens` (tokens base color/fuente/dark) fue **fusionada en `nicolify-r0-shell` (DONE, ratif Chris 2026-05-30)** — los tokens de marca ya shippearon con el shell. Esta story NO la resucita: cubre la pieza net-new que no existía entonces — adopción de los **primitivas/archetypes/enforcement COMPARTIDOS** del design system homologado (ADR-014, accepted 2026-06-07, posterior al shell).
