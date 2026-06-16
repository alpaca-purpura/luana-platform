---
story_id: nicolify-r0-design-system-adoption
brand: nicolify
type: ui-story                       # adopción visual cross-cutting — todas las hojas re-expresadas vía primitivas compartidas (esencia homologada · valores de marca propios)
state: developed                     # idea → refining → refined → ready → developing → developed → reviewing → done · developed 2026-06-15 (/dev-team: 5/5 tickets + live-verify estructural OK)
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
phase: AWAIT_CHRIS_VERIFY             # G · /dev-team cerró developed; live-verify estructural OK. Pausa-y-ofrece: Chris ejerce + firma chris_verify.signoff (pill demo #37 completa post kit-lift)
dod_live_verified: true              # estructural — ejercido live en dev-app nicolify (Chrome DevTools MCP) 2026-06-15
dod_env: "docker dev stack (BE :8001 + FE :3001) · Chrome DevTools MCP · tenant alpaca-purpura (7f464ab7) · owner.demo@nicolify.com"
dod_evidence:
  - action: "Login Clerk (owner.demo@nicolify.com) → /alpaca-purpura/abel/icp → master render"
    observed: "shell homologado: Ribbon 5 agentes (Abel/Brenda/Christian/Sara·Próximamente/Norvil/Configurar) + Luana sidebar orquestador + kit EmptyState ('Define tu cliente ideal' + CTAs) + kit ListPageSkeleton de carga"
    backend_log: "GET /api/v1/abel/icp 200 OK ×2 · sin traceback"
  - action: "Click 'Empezar en blanco' (CREATE write)"
    observed: "navegó a /abel/icp/82aa34d1-.../datos = EntityWorkspaceLayout + EntitySubNavBar N3 (ICPs ‹ · Nuevo ICP · Datos del ICP · + buyer) + Group sections (Identidad/Firmográficos/Dolor/Señales/Anti-patrón) con tooltips + autosave indicator — todo compuesto de @luana/ui-kit"
    backend_log: "icp_created icp_id=82aa34d1 tenant_id=7f464ab7 · POST /api/v1/abel/icp 201 Created"
  - action: "Editar 'Nombre del ICP' → 'ICP Live-Verify DS-Adoption 2026-06-15' (AUTOSAVE write)"
    observed: "autosave disparó; refetch del detalle tras guardar"
    backend_log: "PATCH /api/v1/abel/icp/82aa34d1 200 OK · GET .../82aa34d1 200 (persistencia confirmada)"
  - console: "1 error pre-existente (GET /agents/config/avatar.svg 500 = avatar placeholder de config, NO regresión de adopción — shell cap E4 'avatar fallback'); 0 errores de adopción, sin burbuja de hidratación, /abel/icp todo 200/201"
verified_at: 2026-06-15
dod_caveats:
  - "PILL controls (RN-7) NO verificado — kit hardcodea rounded-md hasta el kit-lift /pm-luana (gated). Controles renderizan rounded-md (esperado). Golden atoms.png + demo #37 full-fidelity completan post kit-lift."
  - "Visual goldens NO capturados live (FE dev-server memory-restart loop inestable + requiere run Playwright estable). Fidelidad estructural confirmada por snapshot a11y + screenshot empty-state. Captura de baselines = follow-up con stack estable."
  - "FE dev-server (webpack, memory threshold) reinicia en loop → drops de socket transitorios (ERR_SOCKET_NOT_CONNECTED) durante compiles. Dev-infra footgun, NO bug de adopción (BE 200/201/PATCH-200 confirman). Candidato harness-issue (dev-stack memory)."
chris_verify:
  required: true
  signoff: null                      # Chris ejerce el kit live (demo-script.md) + firma SATISFIED|SATISFIED_WITH_FOLLOWUPS|REJECTED
  rounds: []
reconciled: false                    # /pm-nicolify pone true en R (tras signoff) antes del /auditor
build_status:                        # /dev-team 2026-06-15 — 5/5 tickets pushed, green native
  T-1: { commit: cb8de344, status: tests-passing, note: "globals↔design-tokens + --radius-control + arch-test (39/39)" }
  T-2: { commit: facdd25b, status: tests-passing, note: "4 mirrors killed → @luana/ui-kit (518/518 + arch 160/160)" }
  T-3: { commit: 4baa816e, status: tests-passing, note: "abel/icp + shell re-expresado vía primitivas/archetypes (241/241)" }
  T-4: { commit: 45052deb, status: tests-passing, note: "no-arbitrary lock ON @ zero baseline; 2 text-[10px] vía ds-lock-allow (Bif-2) + FLAG /pm-luana 10px tier (16/16)" }
  T-5: { commit: 52dd47d3, status: tests-passing, note: "goldens (pill/accent gated kit-lift) + a11y-subnav + demo-script + SHELL-DESIGN-CONTRACT §7 (arch 176/176); live-verify PENDING G" }
blocked_on:
  - kit-radius-control-lift          # /pm-luana (proposal accepted 2026-06-15) — pill controls + golden atoms.png + demo #37 full fidelity
next_step_at_G:                      # boundary G (Chris-verify) — converge 3 cosas:
  - "Live-verify dod_evidence (ejercer abel/icp + autosave write en dev-app + logs)"
  - "Kit-lift RN-7 aterriza (/pm-luana core worktree) → controls pill → golden atoms.png + accent"
  - "Chris ejerce demo #37 (Abel convergence) sobre el FE homologado + firma chris_verify.signoff"
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
next_action: "EN G (AWAIT_CHRIS_VERIFY). Build code-complete + live-verify estructural OK (dod_evidence: POST 201 + PATCH 200 + logs + render homologado). Falta: (1) Chris ejerce demo-script.md live + firma chris_verify.signoff · (2) kit-lift RN-7 aterriza (/pm-luana worktree core) → controles pill → golden atoms.png + demo #37 full-fidelity. Tras signoff → R (reconcile /pm-nicolify, reconciled: true) → /auditor → merge. El demo #37 (Abel convergence) completa cuando el kit-lift aterrice."
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
