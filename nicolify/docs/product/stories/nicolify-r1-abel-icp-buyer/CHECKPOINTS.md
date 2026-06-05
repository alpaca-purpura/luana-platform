# Story DoD CHECKPOINTS — nicolify/nicolify-r1-abel-icp-buyer

> Brand: nicolify
> Auditor: /auditor (orchestrator) · auditor-backend (APPROVED) · auditor-agentic (PASS) · auditor-frontend (APPROVED iter 2)
> Date: 2026-06-03
> Verdict: **APPROVED (code) — pendiente DoD #37 live-verify + demo de Chris antes de `done`**
> audit_iterations: 2/4 (1 Caso B fix · "+ buyer" create flow)

## C1 — Code
- [x] Tests RED → GREEN (TDD) — fix iter 1 escribió `IcpEntityLayoutClient.test.tsx` RED→GREEN; builders TDD por capa
- [x] Coverage no regression — BE 70/70 abel · FE 359/361 (2 = pre-existente R0, fuera de scope)
- [x] Lint + format clean — ruff clean (BE) · eslint 0 errores (FE, tras Carril A)
- [x] Type-check clean — mypy (BE) · tsc 0 (FE)

## C2 — Spec compliance
- [x] Cada Gherkin SC con test GREEN — gherkin-matrix.md: **0 MISSING / 0 FAIL** (15/15 SC con ≥1 test verde)
- [~] Playwright E2E — suite AUTORADA + static-green (tsc/eslint/--list); **live-run DIFERIDO al demo gate #37** (stack stale + Chrome MCP down)
- [x] Agentic eval — T-AG-1: 18 tests (EV-1..EV-6 + sanitizer + API) GREEN, assertions sustantivas (no mock-on-mock)
- [~] Screenshots / visual goldens — specs scoped a /abel/icp** autorados; **baselines a capturar en #37**
- [x] Voice fidelity — N/A (extractor one-shot, no sales_agent voice scope)

## C3 — Architecture
- [x] Arch fitness 0 violations — 20/20 BE + 90/90 FE (ratchet shrink-only intacto)
- [x] DDD boundaries — Inside-Out respetado; sin cross-module imports prohibidos
- [x] Tenant isolation — toda query filtra tenant_id (incl get_by_id); extract escribe solo en tenant del request; FE X-Tenant-ID de useTenantId (NUNCA orgId)
- [x] Anti-duplication — `sanitize_payload`/`calculate_cost`/`BaseExtractionOrchestrator` consumidos por import; **W2: GrowthStudioEmitter = telemetría brand-local legítima (no mirror) pero lift candidate N=2 → /pm-luana** (informativo, post-merge)
- [x] Engine boundary — **0 ediciones a core/luana-core-\*/src/** (verificado por los 3 sub-auditores). ICP net-new brand-local · Buyer replica brand-local async con icp_id
- [x] Cross-module / 05-guidelines scope — sin escape; cada ticket en su surface

## C4 — Cross-cutting
- [x] Spanish neutro LatAm — tuteo en user-facing (arch test_spanish_neutro GREEN)
- [x] PII sanitization — response_model= en toda ruta; growth_studio_event sin PII (account_id + montos bucketeados + ids hasheados); trazas via sanitize_payload
- [x] Currency / master-data — sin hardcode 'USD'; fallback data.currency ?? locale (RN-11)
- [x] Migrations idempotentes — 002_abel_icp_buyer raw SQL IF NOT EXISTS, sin sa.Enum() en create_table
- [x] Default flag flips — N/A (no flips en esta story)
- [~] Security — **W1 (WARN, escalado): rutas abel confían en header X-Tenant-ID sin dependencia Bearer/auth app-layer.** Aislamiento por tenant HOLDS a nivel query (sin leak). Es deferral DECLARADO acorde al rebuild de nicolify (sin `_shared/auth` aún). **Ratificación de Chris/pm-nicolify requerida ANTES de exposición non-localhost.** No bloquea merge dev/demo (Clerk auth está en el edge FE)
- [x] Brand docs schema R1 — sin `.md` sueltos en `nicolify/docs/` raíz
- [x] Brand docs schema R3 — sin edición manual de auto-gen; cap YAML `abel.icp-buyer` creada con schema (status wip, /pm-nicolify finaliza Fase F.3)

## C5 — Trace
- [~] checkpoint.md → state=done — lo setea /pm-nicolify al merge (post DoD #37). Ahora: `reviewing`
- [ ] BACKLOG regen post-merge — auto (R33) al cerrar
- [x] Capability migration ready — `nicolify/docs/product/capabilities/abel/icp-buyer.yaml` creada (15 SC + dev_preview a código real) · /pm-nicolify reconcilia status→live en Fase F.3
- [x] modules/abel.md auto-list refresh ready — /pm-nicolify lo genera al merge (módulo abel nuevo)
- [x] learnings — candidatos: (a) HB-31 isolation:worktree fix (ya en harness-backlog) · (b) draft-first invertido como patrón fundacional reusable (Oferta/Marca) · (c) la trampa "affordance renderiza pero no ejecuta" (dead-route)
- [x] Story folder ready for archive — al cerrar reviewing→done, /pm-nicolify `git mv` a nicolify/docs/archive/2026/stories/ en el commit del 07-merge (R2)

## Findings summary
- C1: 4/4 ✅
- C2: 3/5 ✅ + 2 ~ (e2e/visual live-deferred al #37 · NO MISSING)
- C3: 6/6 ✅ (W2 informativo)
- C4: 6/7 ✅ + 1 ~ (W1 security WARN escalado)
- C5: 4/6 ✅ + 2 ~ (state=done + BACKLOG = trabajo de /pm-nicolify al merge)

## Verdict
**APPROVED a nivel código** — story técnicamente lista. NO pasa a `done` aún: gate DoD #37 (live-verify dev-app + `demo_signoff` de Chris) es HARD y PENDIENTE. Story permanece en `reviewing`.

Veredictos sub-auditores: BE **APPROVED** · AGENTIC **PASS** · FE **APPROVED** (iter 2, tras fix Caso B). 1 Caso B resuelto. audit_iterations 2/4.

## Notes for /pm-nicolify merge
- **GATE #37 HARD (antes de merge):** refrescar stack (`make dev-nicolify` + migrar 002) + reconectar Chrome MCP + live-verify writes (extract→borrador · patch→persist · mark-ready→422 · cross-tenant→404) + capturar visual baselines + `demo_signoff` de Chris APPROVED. REFUSE merge sin `dod_live_verified: true` + `dod_evidence`.
- Capabilities a finalizar: `abel/icp-buyer.yaml` (status wip→live + reconciled).
- modules/abel.md: crear (módulo abel nuevo).
- **W1 (security):** ratificar/trackear el deferral de auth app-layer en rutas abel antes de exposición non-localhost (no bloquea dev/demo).
- **W2 (anti-dup):** flag GrowthStudioEmitter N=2 lift candidate a /pm-luana (post-merge).
- **Pre-existente R0 (no de R1):** bug ShellOrganismLayoutClient AppPanelSlot 2× (2 vitest reds) → `nicolify/docs/observed-bugs/2026-06-03-shell-layout-apppanelslot-duplicated.md`. Abrir bugfix R0 (non_egoismo).
- Promotion candidates (cross-brand): EntitySubNavBar @luana/ui-kit (N=2) + ICP entity (cuando N=2 B2B) — flags informativos, NO en esta story.
