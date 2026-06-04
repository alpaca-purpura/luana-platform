---
story_id: nicolify-r1-abel-icp-buyer
brand: nicolify
type: ui-story                       # hoja del shell (Abel → ICP & buyer) operable a mano + invocable por Abel (2 modos)
state: developing                    # idea → refining → refined → ready → developing → developed → reviewing → done · developing 2026-06-03 (/dev-team autónomo · lock code:abel)
release: R1                          # Abel + Brenda · Atracción inbound (1er vendible)
map_zone: agentes                    # paradigma 3 zonas (ADR-nicolify-002) — derivada de SYSTEM-MAP::zones
map_box: abel                        # caja = agente Abel (Estrategia & Oferta)
map_area: icp                        # functional_area abel.icp (= "ICP & buyer", 1 hoja directa N2≡hoja)
module: abel                         # bucket code:abel · FE features/abel/ · BE brand-extension consume core/luana-core-brand-studio
architecture_pattern: ADR-nicolify-001   # HARD — sub-tab del shell (shell-feature-architecture.md). Sin esta cita /architect REFUSE
cap_target: abel/icp-buyer
cap_change_type: new
route: /{tenantId}/abel/icp
last_modified: 2026-06-03
phase: READY_PACKAGE_CLOSED
last_artifact: 06-tickets.yaml
adr_001_compliance: full
ready_package: [03-arch.md, "03-arch-{be,fe,agentic}.md", 04-validators.yaml, 05-guidelines.md, 06-tickets.yaml, dispatch-plan.md]
ticket_count: 8                       # 2 BE + 1 AGENTIC (Opus R23) + 4 FE + 1 E2E · DAG en dispatch-plan.md
autonomous_mode: true                 # ★ RATIFICADO Chris 2026-06-03 — /dev-team encadena T-BE-1→…→T-E2E-1 → /auditor → /pm-nicolify merge (gate demo manual #37 frena en merge)
oq_resolved_2026_06_03:
  oq1_buyer_engine_boundary: "CONFIRMADO — Buyer brand-local async con icp_id, consumiendo engine por esquema/patrón (no montar runtime sync). No editar engine."
  oq2_lift_timing: "Diferido al cierre de la story — ICP + EntitySubNavBar quedan promotable:candidate; /pm-luana evalúa proposal post-merge."
  oq3_intake_conectar: "CONFIRMADO — modo 'Conectar fuente' deshabilitado con CTA 'Configurar → Conexiones' (placeholder navegable). 3 modos activos day-1 (URL/Archivo/Texto)."
ratified_by_chris: true
ratified_visual_by_chris: true        # mockup icp-buyer.html ratificado 2026-06-03 (G1)
nav_pattern: N3-dynamic-EntitySubNavBar
phase_detail: >
  refined cerrado 2026-06-03. 01-spec.md v2 + mockup G1 (mockups/icp-buyer.html) ratificados por Chris.
  Patrón list→detail EntitySubNavBar (leaves=buyers + add) formalizado en SHELL-DESIGN-CONTRACT §5.1.
  1 ICP → N buyers · draft-first · sin barra de completitud. Handoff a /architect (ready package).
decisions_ratified_2026_06_03:
  model: "A — ICP (net-new, nivel cuenta, lift-candidate) + Buyer (engine BuyerPersona), N buyers por ICP, 1 hoja"
  capture_flow: "draft-first invertido (seed→extract→propose→ratify) — patrón fundacional reusable"
  intake: "universal FULL day-1 (URL + archivo + texto + conectar-fuente) · conexión con dep flag a Config→conexiones"
  enrichment: "DIFERIDO (waterfall firmográfico desde dominio = story posterior; esta extrae de lo aportado)"
  field_justification: "cada campo muestra su agente-consumidor (display mode a mockear por /po-ux)"
build_status_2026_06_03:
  autonomous: PAUSED   # blocker estructural: builder agents corren en worktree aislado (contra ADR-009 single-hub)
  t_be_1: "PARTIAL — builder-backend construyó módulo abel completo (domain icp/buyer/exceptions, repos icp/buyer, models icp/buyer/growth_studio_event, api/router, dtos, telemetry emitter, migration 002_abel_icp_buyer, tests, arch test growth_studio_event_no_pii, main.py include_router) PERO en worktree aislado agent-a2dcc99f56154fd50 (luana-platform/.claude/worktrees/), UNCOMMITTED, y se cortó en cleanup ERA001 (9 lint en tests/arch) sin línea done. Trabajo recuperable, NO en el hub wip/nicolify."
  blocker: "builder-* agents se aíslan en worktree propio → trabajo no aterriza en el hub + chain autónomo vararía 8 veces + SendMessage no disponible para continuar agente cortado."
  fix_B_done: "HB-31: removido isolation:worktree de los 3 builders (reconcilia M9 v2 + ADR-009). ⚠️ registry snapshot → efecto en sesión NUEVA."
  fix_A_done: "T-BE-1 consolidado al hub: módulo abel (26 .py) + migration 002 + arch test + tests + main.py copiados del worktree aislado a wip/nicolify (UNCOMMITTED — falta finish ERA001 + gates + commit). Worktree aislado agent-a2dcc99f56154fd50 conservado como red de seguridad (cleanup tras verificar)."
next_action: >
  ⏸ Recomendado: REINICIAR sesión (para que el fix de isolation tome efecto) → reanudar /dev-team:
  un builder-backend fresco FINALIZA T-BE-1 in-place en el hub (lee el partial consolidado: ERA001 + gates + commit)
  y sigue el DAG (T-BE-2→T-AG-1→…) con todos los builders escribiendo al hub (sin consolidación por-ticket).
  Lock code:abel sigue tomado. Alternativa: continuar ESTA sesión consolidando ticket-por-ticket (builders aún aíslan).
parallel_safe: true
---

# Checkpoint · nicolify-r1-abel-icp-buyer

> Hoja **"ICP & buyer"** de Abel — donde el dueño de la agencia define **a quiénes apunta** (perfil de cliente ideal) y **quién decide** (buyer personas). Cada ICP lleva su **dolor** + su **ángulo de venta**. Materia prima que consumen Brenda (contenido/pauta) y Christian (outbound).

## Qué es

Primera hoja real de Abel en el shell. SYSTEM-MAP la registra como `abel.icp` (1 hoja directa, route `/{tenantId}/abel/icp`, R1). Resuelve el pedido de Chris (sitemap 02-agent-intent línea 142): *"No vi nada sobre ICP o buyer pero debería poder definirse aquí — es útil para saber a quiénes apuntamos."*

## Estado

- `idea` — creada 2026-06-03. Research hecho. Falta ratificación de la decisión de modelo (ICP vs Buyer) + refining (/po-ux).

## Prior art scan (resumen — detalle en 00-research.md §3)

- **CONSUMIR engine:** `core/luana-core-brand-studio` ya tiene `BuyerPersona` (entidad rica: demographics, psychographics, pain_points, desires, buyer_journey, purchase_triggers, anti_patterns, scope, is_primary, completeness_score) + repo + API + field-contract + model. `core/luana-core-copilot` tiene `buyer_persona_extraction_template` + `buyer_persona_persister` (el "absorber info" guiado de Abel). **NO recrear** — consumir vía import.
- **NET-NEW + lift-candidate:** `ICP` (nivel cuenta/empresa) NO existe en engine — el legacy era B2C/creator (solo Buyer). El ICP B2B alinea con el modelo `Account` del CRM (`agent-revenue-engine.md §5`). Fuerte candidato a lift `/pm-luana` (sirve a saasora/inmoflow B2B futuras).
- **Referencia FE (re-temizar):** legacy `nicolify/frontend/src/features/brand-studio/{BuyerPersonasLandingPage,PersonaDetailPage,BuyerPersonaInstancePicker,schemas,hooks}` — forma a portar bajo shell ADR-nicolify-001 + nicolify-design-system.

## Decisión abierta (Chris ratifica antes de refined)

**¿ICP == Buyer, o entidades separadas?** Recomendación PM (B2B): **separadas pero en una sola hoja** — ICP = nivel **cuenta** (qué empresas: industria, tamaño, geo, ticket, dolor, ángulo) · Buyer = nivel **persona/stakeholder** (rol, poder de decisión, objeciones). Alinean con Cuenta/Stakeholder del CRM. Detalle + alternativas en 00-research §6.

## Gates aplicables

- **ADR-nicolify-001** (shell-feature-architecture) — HARD. 9 secciones + G1 mockup-per-component + G2 SSR-safe store + G3 Tailwind JIT-safe.
- **DoD live-verify (#37)** — hoja user-reachable → demo manual + gate anti-burbuja al cerrar.
- **agent-revenue-engine.md** — guardrails agénticos (Abel propone, dueño ratifica) + tenant-isolation raíz (sin PHI).

## Bitácora

- 2026-06-03: `/pm-nicolify` crea story (idea). Research legacy + ARQ + storymap → 00-research.md. Decisión ICP-vs-Buyer flagueada para Chris.
- 2026-06-03: `/po-ux` cierra refining→refined. 01-spec.md v2 + mockup G1 ratificados Chris (patrón list→detail EntitySubNavBar · 1 ICP→N buyers · draft-first · sin barra completitud).
- 2026-06-03: `/architect` cierra refined→ready. READY package (6 artifacts): 03-arch consolidado + 3 per-surface (be/fe/agentic) + 04-validators + 05-guidelines + 06-tickets + dispatch-plan. 8 tickets (DAG · T-AG-1 Opus R23). adr_001_compliance: full. **Decisión engine-boundary cementada:** ICP=NET-NEW brand-local (no engine, no cross-brand mirror — grep verificado) · Buyer=replicate brand-local async (engine `buyer_personas` es sync+engine-IAM, sin `icp_id` → boundary mismatch, consume esquema por referencia) · EntitySubNavBar=port vitalia (lift candidate @luana/ui-kit N=2 — flag, no lift). Ningún ticket edita core/. 3 Open Questions informativas para PM (03-arch §16).
