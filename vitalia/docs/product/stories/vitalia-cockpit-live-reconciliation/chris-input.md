---
story_id: vitalia-cockpit-live-reconciliation
created_at: 2026-05-29T15:50:23-05:00
last_modified: 2026-05-29T15:50:23-05:00
notes_count: 1
refs_count: 2
conversation_count: 1
---

# chris-input.md · vitalia-cockpit-live-reconciliation

<!-- voseo-allowed: buzón de conversación interna Chris↔Claude (no es string user-facing de UI) -->

> Buzón Chris ↔ Claude. Notas + referencias + conversación con verdicts.

## 💭 Notas

### 2026-05-29 15:50
(Chris) Quiero que lo que veo como `live` en el cockpit realmente esté live. Cuando entro a la solución me salen errores. Recorrer funcionalidad por funcionalidad con Playwright, capturar lo que aparece como funcionando pero no funciona, revisar técnicamente cada una contra estándares (visual, técnico FE, BE, arquitectura, reglas de negocio, flujo, accesos). Reparar lo fácil, mapear lo difícil. Al término: solución funcionando con lo que supuestamente ya está live.

## 📎 Referencias

- **📚 learning-ref** · `vitalia/docs/learnings/2026-05-27-live-audit.md`
  > Audit previo: mapa 71 caps live vs realidad UI (24 accesibles / 47 slice-1 superseded / 10 infra). Base de esta story.
- **📚 learning-ref** · `vitalia/docs/learnings/2026-05-25-mockup-playwright-audit-cycle.md`
  > Técnica Playwright real-browser inspect (DOM/a11y/visual).

## 💬 Conversación

> Append-only · turn-by-turn. Verdicts: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-05-29 15:50 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Story creada en `state=idea`. Corrí Step 0 (closure gate GREEN) + prior-art scan obligatorio + diagnóstico de raíz del 500.

Hallazgos clave cementados en `checkpoint.md`:
- **El 500 está diagnosticado:** `@luana/hooks/use-store-hydration` no resuelve en el container — drift de infra del dev-stack (no bug de código), porque el container no montea `core/@luana/*`. Fase 0 = reparar boot.
- **Prior-art directo:** el live-audit del 2026-05-27 ya mapeó el problema. Esta story lo OPERACIONALIZA (no re-descubre).
- **Decomposición honesta:** "todo lo live realmente live" = 3 problemas distintos: (A) drift runtime/infra [reparable, esta story], (B) ledger sobre-declarado [reconciliar status, esta story], (C) features faltantes = los ~47 slice-1 que querés ver en shell-organism = las 20 stories Fase 2 pendientes [NO cabe en una story, ES el roadmap].

### 2026-05-29 15:50 · 🤖 claude · `/pm-vitalia` · ⚠️ DUDA
Antes de refinar necesito que ratifiques 2 cosas (ver preguntas en sesión). El nudo: "que lo live esté live" en sentido literal = construir Fase 2 entera (semanas). Lo que esta story SÍ entrega en una corrida = app booteando + 24 caps live-reales verdes + cockpit honesto (status corregido) + mapa priorizado de lo que falta. Necesito tu OK sobre dónde poner el límite.

### 2026-05-29 15:52 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Scope ratificado por Chris: (1) entregable = **honesto + verdes lo real** (app bootea + 24 caps live-reales verdes + ledger corregido a la verdad + matriz/backlog priorizado; NO reconstruye los 47 slice-1 = eso es Fase 2). (2) límite fácil = **agresivo inline** (multi-archivo acotado + lógica simple OK mientras gates verdes; solo lo grande se mapea). Story movida `idea → refining`, cap_target=`ops.live-reconciliation-sweep` (new). Encadeno a `/po` para el spec (Fase 0 boot + Fase 1 metodología sweep concretos; Fase 2/3 framework de criterios).

### 2026-05-29T15:58 · 🤖 claude · `/po` · ✓ APLICADO
`01-spec.md` v1 escrito. 7 scenarios Gherkin AI-resistant: boot-restored (happy), surface-broken-flagged (negative), superseded-cap-detected (edge), false-green-resisted (adversarial) + network-failure + accessibility + ledger-honest-after. Graders ejecutables (curl, compute_capability_status, validate_code_cap_bidirectional, reconcile --validate-ledger, playwright). Foto cruda incluida: 67 caps → solo **1 verified-live**, 55 stub. Two-stage tickets (boot+sweep concretos; reparación generada post-sweep). Disciplina de scope HARD (cero reconstrucción slice-1) + gates verdes para todo fix inline.

### 2026-05-29T15:58 · 🤖 claude · `/po` · ⚠️ DUDA
3 preguntas antes de `/architect` (ver sesión): Q1 fix Fase 0 (remount core/ vs rebuild imagen), Q2 alcance sweep (solo shell-organism vs +admin/landing/onboarding), Q3 destino de la matriz (efímero story vs artefacto vivo recurrente → afecta cap_target).

### 2026-05-29T16:05 · 🤖 claude · `/po` · ✓ APLICADO
Q1-Q3 ratificadas e integradas al `01-spec.md` v2. Q1=remount core/ en compose (causa raíz), Q2=shell-organism profundo + anotar admin/landing/onboarding, Q3=matriz vive en `vitalia/docs/domains/ops/live-reconciliation.md` (cap `ops.live-reconciliation-sweep`, promotable cross-brand). Story `refining → refined` (ratified_by_chris: true). Encadeno a `/architect` para el ready package con tickets two-stage (Fase 0 boot + Fase 1 sweep concretos; reparación Fase 3 generada post-sweep).

### 2026-05-29T16:15 · 🤖 claude · `/architect` · ✓ APLICADO
Ready package cerrado (5 artefactos). `03-arch.md` (Fase 0 remount core/ + Fase 1 sweep + Fase 2/3 findings-driven + Integration design CONN + Prior art audit), `04-validators.yaml` (7 scenarios cubiertos + architectural_validation incl. arch_no_engine_edit + no_slice1_rebuild + playwright_visual_scope que prohíbe tocar el shell compartido), `05-guidelines.md` (must_load_skills incl. vitalia-design-system), `06-tickets.yaml` (T-1 boot → T-2 sweep → T-3 review+reparar+reconcile, two-stage; mapeo → backlog F2 no es ticket), `dispatch-plan.md` (autonomous_mode=false recomendado — T-3 conviene supervisión humana).
Decisión arquitectónica clave: adr_004_compliance=n/a (no es story feature). Disciplina de scope HARD codificada en validators (arch_no_engine_edit + no_slice1_rebuild). Story `refined → ready`.

### 2026-05-29T16:15 · 🤖 claude · `/architect` · 💡 PROPONE
Recomiendo arrancar **manual** (`/dev-team` toma T-1, revisás entre T-2 y T-3) en vez de autonomous full: T-3 es findings-driven y toma decisiones mapear-vs-reparar que conviene que veas. Si preferís autonomous, agregás `autonomous_mode: true` al checkpoint y encadena T-1→T-2→T-3→/auditor→merge.

### 2026-05-29T16:18 · 🤖 claude · `/architect` · ✓ APLICADO
Chris ratificó autonomous_mode=true (override de mi recomendación manual). Checkpoint actualizado con caps (10 iter/ticket, 4 audit iter, $6.00, 150min, on_cap_exceeded=blocked+escalate). Encadeno a `/dev-team` para chain autónomo T-1→T-2→T-3 → /auditor → /pm-vitalia merge.

### 2026-05-29T16:25 · 🤖 claude · `/dev-team` · ✓ APLICADO
**T-1 (boot fix) DONE + pushed (8e3015dd).** El 500 que veías está resuelto: monté `core/` en el compose del frontend (`./core:/app/core`), `pnpm install` en container, restart. Verificado: `:3002/sign-in` 200, `/` → 307 (redirect Clerk correcto, antes 500), 0 "Module not found", `valeria-chat-happy` 9/9 PASS (shell-organism renderiza). Causa raíz cerrada: futuros bumps de `@luana/*` ya no rompen el boot. Sigo el chain → spawneo builder-frontend para T-2 (sweep harness + matriz viva).

### 2026-05-29T21:35 · 🤖 claude · `/dev-team` · ✓ APLICADO
**T-2 (sweep harness + matriz v1) DONE.** Paths creados:
- `vitalia/frontend/e2e/regression/live-reconciliation/surface-catalog.ts` — catalogo SSoT derivado de RIBBON_SUBTABS + AGENT_SUBSUBTABS + rutas app/ (27 shell surfaces + 3 external-annotated)
- `vitalia/frontend/e2e/regression/live-reconciliation/sweep.spec.ts` — harness Playwright que recorre todas las superficies, clasifica verdicts, emite .sweep-findings.json
- `scripts/build_live_reconciliation_matrix.py` — cruza findings con _status-computed.json y genera la matriz markdown
- `vitalia/docs/domains/ops/live-reconciliation.md` — matriz v1 AUTO-GENERATED (88 filas)
- `vitalia/frontend/playwright.config.ts` — project `live-recon` registrado (anti-isla CONN)
- `.gitignore` — evidencia screenshots (.evidence/) + findings JSON gitignoreados (HIPAA-lite)

Conteos de la matriz v1: **OK=21 · ROTO=0 · INACCESIBLE=0 · SIN-UI=67** (las 67 caps sin ruta navegable directa reflejan la realidad: caps slice-1 superseded + infra-only). El sweep detectó que las 27 superficies shell-organism cargan con 200 y sin console errors graves. Gates verdes: eslint ✅ · tsc ✅ · arch_fe_fsd (148 tests) ✅ · sweep 5/5 PASS ✅ · compute_capability_status ✅ · matrix_artifact_exists ✅.
