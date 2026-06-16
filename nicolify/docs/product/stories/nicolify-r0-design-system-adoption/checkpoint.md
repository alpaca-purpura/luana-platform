---
story_id: nicolify-r0-design-system-adoption
brand: nicolify
type: ui-story                       # adopción visual cross-cutting — todas las hojas re-expresadas vía primitivas compartidas (esencia homologada · valores de marca propios)
state: ready                         # idea → refining → refined → ready → developing → developed → reviewing → done · ready 2026-06-16 (/architect cerró ready package: 03-arch + 03-arch-fe + 04-validators + 05-guidelines + 06-tickets + dispatch-plan)
release: R0                          # Fundación — homologar ANTES de crecer (ADR-014 HARD: "empezar homologado")
map_zone: infraestructura            # paradigma 3 zonas — atributo de calidad (consistencia UI cross-hoja) · derivada de SYSTEM-MAP::zones (a confirmar /architect)
map_box: plataforma-tecnica
map_area: design-system
module: design-system                # bucket code:design-system · toca nicolify/frontend/src broad + globals.css
architecture_pattern: ADR-014-design-system-homologation   # doctrina platform que implementa (5 capas + enforcement mecánico) + HARD cumplir SHELL-DESIGN-CONTRACT.md
cap_target: design-system/nicolify-ui-homologation
cap_change_type: new                 # NUEVA cap (no existía design-system/nicolify-ui-homologation) — 03-arch crea el YAML schema v2. (revert de un flip erróneo del commit worker 3bbbabea: "adopción cero-creación de COMPONENTES" ≠ "no cap nueva"; el cap protocol mira la cap, no los componentes)
route: null                          # cross-cutting — no es una hoja con ruta única
demo_required: true                  # visual: las hojas deben render idéntico/mejor, cero regresión
last_modified: 2026-06-16
phase: READY_PACKAGE_CLOSED          # /architect cerró ready package FE-only (2026-06-16)
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
last_artifact: 06-tickets.yaml
next_action: "/dev-team nicolify nicolify-r0-design-system-adoption (ready→developing). DAG: T-1‖T-2 → T-3 → T-4 → T-5 · todos builder-frontend (workhorse) + auditor-frontend (flagship) · FE-only. EN PARALELO: /pm-luana arranca el kit-lift RN-7 (kit Button/Input/Select/Textarea consumen --radius-control; opcional accentToken en EntitySubNavBar) — DEPENDENCIA EXTERNA: gatea 1-2 goldens + el demo gate #37 (Abel convergence) que corre cuando AMBOS aterrizan. NUNCA editar core/@luana en esta story de marca."
ready_package:                       # /architect 2026-06-16 — paquete completo FE-only
  - 03-arch.md                       # consolidado FE (= 03-arch-fe; cero BE/agentic)
  - 03-arch-fe.md                    # quick-ref builder-frontend
  - 04-validators.yaml               # 5 categorías · SC-1..6 mapeados · goldens gated kit-lift
  - 05-guidelines.md                 # must_load_skills + patterns required/forbidden + files scope
  - 06-tickets.yaml                  # T-1..T-5 · builder-frontend workhorse · DAG · assignment blocks
  - dispatch-plan.md                 # autonomous_mode false · matrix · RN-7 external dep
arch_decisions:
  - "EXTEND/ADOPT @luana/ui-kit 0.4.1 + @luana/design-tokens 0.2.0 + @luana/eslint-config 0.1.0 (cero NEW layer)"
  - "DELETE 4 mirrors locales (EntityWorkspaceLayout/EntitySubNavBar/EmptyState/AutosaveBadge) + repoint a kit con adaptación de prop-divergence (03-arch §6)"
  - "globals.css = valores de marca + escala compartida (Q1: espejo @theme + arch-test drift); --radius-control/--radius-pill brand-scoped agregados"
  - "RN-7 (kit controls consumen --radius-control) = /pm-luana lift EN PARALELO, NUNCA en esta story; gatea golden pill + demo #37"
  - "anti-default-flip al encender no-arbitrary lock off→on (migrar first, flip second, suite verde ambos lados)"
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
