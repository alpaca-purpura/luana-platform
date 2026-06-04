---
story_id: nicolify-r1-abel-icp-buyer
brand: nicolify
type: ui-story                       # hoja del shell (Abel → ICP & buyer) operable a mano + invocable por Abel (2 modos)
state: reviewing                     # idea → refining → refined → ready → developing → developed → reviewing → done · reviewing 2026-06-03 (/auditor APPROVED code · BE+AG+FE) → GATE #37 demo de Chris antes de done
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
phase: AUDIT_APPROVED_AWAITING_DEMO_GATE_37
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
  autonomous: COMPLETE   # sesión nueva post-HB-31 fix: builders escriben in-place al hub (sin consolidación manual)
  tickets_green: "8/8 — T-BE-1+T-BE-2 (034b67c6) · T-AG-1 Opus R23 (036f9fc6) · T-FE-1 (58952787) · T-FE-2 (3f3c006a) · T-FE-3 (8afb9476) · T-FE-4 (680658c2) · T-E2E-1 static (6f7aee47)"
  be_gate: "ruff clean · pytest abel 70/70 · arch fitness 20/20 (response_model, no-cross-brand, main_app_config, migrations idempotent, growth_studio_event_no_pii)"
  fe_gate: "tsc 0 · vitest 359/361 — 2 reds = bug PRE-EXISTENTE R0 ShellOrganismLayoutClient (AppPanelSlot 2×), fuera de scope, doc en nicolify/docs/observed-bugs/2026-06-03-shell-layout-apppanelslot-duplicated.md (non_egoismo)"
  agentic_gate: "T-AG-1 Opus: 18 tests agentic (EV-1..EV-6 + sanitizer + API), draft-first least-privilege, sanitize_payload, audit RN-10, cost via engine observability"
  e2e_status: "AUTHORED + static GREEN (tsc/eslint/--list). base.ts anti-burbuja, 4 POMs, cold-start variant, visual goldens 4×2. LIVE RUN + baselines + dod_evidence = DEFERIDO al demo gate #37 (stack stale + Chrome MCP down)"
  harness_fix: "HB-31 commiteado (f734a1f1): isolation:worktree removido de los 3 builders → builders in-place. Worktree huérfano agent-a2dcc99f removido (verificado 0 orphan-only)."
dod_status:
  dod_live_verified: partial   # BE writes ejercidos live (2026-06-04) · falta FE-UI live + demo_signoff Chris
  dod_env: "make dev-nicolify refrescado → BE :8001 health 200 (migración 002 aplicada) · FE :3001 compila (307 auth). Stack stale + 2 bugs reparados (ver below). Chrome MCP desconectado → BE-writes vía curl header-auth (W1)."
  bugs_caught_by_37:
    be_dep_gap: "luana-core-extraction/llm no declaradas en nicolify/pyproject.toml → container BE crash-loop (host tests verdes ocultaban). FIX d13ecc14 + uv sync → BE up. (los tests host pasaban porque el venv root tiene los 26 core pkgs)"
    fe_route_conflict: "T-FE-1 agregó [entityId] hermano de [subsubtab] R0 → Next.js 500 'different slug names', app inalcanzable (tsc/vitest no lo cazan). FIX 9b5b1eb0: unificado bajo [subsubtab] con dispatch entity vs nav-leaf · 03-arch-fe §0 corregido · boot-verified FE limpio."
  dod_evidence:
    - { action: "POST /api/v1/abel/icp (X-Tenant-ID A)", observed: "201 status=borrador (draft-first RN-3) · row en abel_icps confirmada", verdict: PASS }
    - { action: "PATCH /icp/{id} vertical+main_pain", observed: "200 · persiste al recargar (GET muestra los valores)", verdict: PASS }
    - { action: "POST /icp/{id}/buyers (name+role) + POST /buyer/{id}/set-primary", observed: "buyer creado (RN-5) · set-primary 200 · primary count=1 (RN-6)", verdict: PASS }
    - { action: "POST /icp/{id}/mark-ready (sin buyer)", observed: "422 {missing:[buyer_with_role]} · ICP sigue borrador (RN-8 sin barra)", verdict: PASS }
    - { action: "POST /icp/{id}/mark-ready (con buyer+vertical+pain+angle)", observed: "200 {status:listo, missing:[]} (RN-8 happy)", verdict: PASS }
    - { action: "GET /icp/{id} con X-Tenant-ID B (cross-tenant)", observed: "404 (RN-1, no revela existencia)", verdict: PASS }
    - { action: "POST /icp/extract (seed text)", observed: "200 job analizando → failed GRACEFUL (sin LLM en dev: 'Connection error' → warning + job failed, 0 traceback = NF-res-extract resiliencia OK). Happy extract→borrador requiere LLM creds.", verdict: "PASS (resiliencia) · happy-path LLM-pendiente" }
    - { action: "BE logs durante toda la secuencia", observed: "0 traceback/500 (sólo redis_unavailable warning benigno)", verdict: PASS }
  caveats:
    - "extract→borrador (happy) requiere LLM provider configurado en dev (hoy 'Connection error' → failed graceful). Demostrable con creds LLM."
    - "growth_studio_event: 0 filas tras mark-ready (telemetría best-effort · Redis down en dev). Verificar emisión con Redis up — follow-up no-bloqueante."
  pending_for_done:
    - "FE-UI live-verify (click real por la app + gate anti-burbuja base.ts + visual baselines) vía Chrome MCP (reconectar) o Playwright autenticado contra :3001."
    - "demo_signoff de Chris (APPROVED) sobre demo-script.md."
  blocking_done: "/pm-nicolify REFUSE merge sin dod_live_verified:true (FE-UI + signoff) + dod_evidence completo."
audit_summary_2026_06_03:
  verdict_code: "APPROVED — BE auditor-backend APPROVED (2 WARN no-bloqueantes) · AG auditor-agentic PASS · FE auditor-frontend APPROVED iter 2"
  audit_iterations: "2/4 — 1 Caso B resuelto: '+ buyer' create flow estaba muerto (navegaba a ruta __add_buyer__ → error, useCreateBuyer no disparaba) → fix d5ee83e0 (callback onAddBuyer threaded + createBuyer + nav al leaf nuevo + test integración nuevo). Cierra SC-add-buyer/RN-5."
  carril_a: "auditor-frontend: 2 test files prettier (a3a7fad0)"
  gherkin_matrix: "06-audit/gherkin-matrix.md — 0 MISSING / 0 FAIL (15/15 SC con test verde a nivel código · 9 con leg e2e/axe/visual LIVE-PENDING #37)"
  warns_carried:
    w1_security: "rutas abel confían en header X-Tenant-ID sin Bearer/auth app-layer (aislamiento query HOLDS, sin leak). Ratificar Chris/pm-nicolify antes de exposición non-localhost. No bloquea dev/demo (Clerk en edge FE)."
    w2_antidup: "GrowthStudioEmitter telemetría brand-local legítima (no mirror) + lift candidate N=2 → /pm-luana post-merge."
  pre_existing_r0: "2 vitest reds ShellOrganismLayoutClient (AppPanelSlot 2×) = bug R0 fuera de scope → observed-bugs/2026-06-03-shell-layout-apppanelslot-duplicated.md (non_egoismo). Abrir bugfix R0."
next_action: >
  ⏸ STOP en GATE DoD #37 (HARD · reviewing→done). Chris + Claude: refrescar stack (make dev-nicolify + migrar 002 + verificar BE :8001/health + FE :3001) + reconectar Chrome MCP →
  live-verify writes reales (extract→borrador · patch→persist · mark-ready→422 sin mínimo · cross-tenant→404) + capturar visual baselines + ejercer demo-script.md → demo_signoff de Chris (APPROVED).
  Recién entonces /pm-nicolify merge (07-merge.md 5 secciones · cap status→live · modules/abel.md · archive R2 · state reviewing→done). /pm-nicolify REFUSE merge sin dod_live_verified:true + dod_evidence.
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
- 2026-06-03: `/dev-team` cierra developing→developed (autónomo, sesión nueva post-HB-31). **8/8 tickets GREEN**: harness HB-31 (f734a1f1) → T-BE-1+T-BE-2 (034b67c6, 70/70 + 20 arch) → T-AG-1 Opus R23 (036f9fc6, 18 agentic) → T-FE-1 (58952787, 27 comp) → T-FE-2 (3f3c006a, 72) → T-FE-3 (8afb9476, dispatcher) → T-FE-4 (680658c2, draft-first e2e) → T-E2E-1 (6f7aee47, suite static-green). BE ruff+pytest+arch GREEN. FE tsc 0 + vitest 359/361 (2 reds = bug PRE-EXISTENTE R0 ShellOrganismLayoutClient, fuera de scope → observed-bugs). Worktree huérfano removido. **E2E live-run + visual baselines + dod_evidence DEFERIDOS al gate #37** (stack stale + Chrome MCP down). → AUTO-HANDOFF `/auditor`.
