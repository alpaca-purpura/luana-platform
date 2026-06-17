---
story_id: vitalia-fase2-lisa-servicios
type: ui-story
agent_owner: lisa
map_zone: agentes
map_box: lisa
module: offer
capability: lisa.servicios
state: developed
phase: AWAIT_CHRIS_VERIFY    # G · funcional (demo_required) — Chris ejerce + firma chris_verify.signoff. Core happy-path live-verified; 3 secondary findings open (ver chris_verify.open_items).
dod_live_verified: true          # DoD#37 core happy-path verified live (create+autosave+activate writes · BE logs · DB · keystone). dod_evidence abajo. NO fake.
dod_env: "make dev-app-vitalia → dev-app.vitalialat.com (Chrome DevTools MCP · LUANA_LANE=A) · tenant Sanaré LATAM e69a691d-… · dr.demo@vitalialat.com (owner)"
dod_evidence:
  - action: "Crear servicio personalizado 'Limpieza dental profunda' ARS 8000 (POST /api/v1/offer/servicios/custom)"
    observed: "redirect a workspace /[offer-id]/resumen · servicio renderiza con nombre/peldaño/modalidad"
    backend_log: "POST /offer/servicios/custom → 201 · products row id=83f6b6db-… status=draft currency=ARS amt=8000 (engine ProductModel · keystone D-1)"
  - action: "Autosave nombre en Resumen (PATCH /api/v1/offer/servicios/{id})"
    observed: "EntityPicker refleja nombre nuevo sin recargar · indicador autosave"
    backend_log: "PATCH /offer/servicios/83f6b6db-… → 200 · DB products.name = 'Limpieza dental profunda (live-verify · autosave)'"
  - action: "Activar servicio desde card del catálogo (POST /api/v1/offer/servicios/{id}/activate)"
    observed: "switch Activo togglea · card pasa a activo"
    backend_log: "POST /offer/servicios/83f6b6db-…/activate → 200 · growth_studio_event_emitted event_type=service_activated · DB products.status = active"
  - action: "KEYSTONE AC-6 — offer activo en la tabla engine 'products' (tenant-scoped) que lee TenantKnowledgeBuilder.build_identity"
    observed: "DB products status=active tenant=e69a691d-… (data shape correcta; path consume-only unit-tested test_keystone_offer_shape.py)"
    backend_log: "n/a (verificado por DB + unit test · build_identity live no ejercido — requiere contexto agente completo)"
  - action: "RECONCILE G round 1 (2026-06-16) — autosave de CAMPO RICO 'Descripción corta' (description_long) en Resumen (PATCH /api/v1/offer/servicios/{id})"
    observed: "workspace ahora = mockup: 6 grupos COLAPSABLES con contador (Identidad abierto, resto cerrado) · StatusBar (Activo + chip) · KnowledgePanel montado · campos hidratados. El campo rico es editable (antes placeholder muerto)."
    backend_log: "PATCH /offer/servicios/83f6b6db-… → 200 OK (NO 422) · request {description_long:...} · response devuelve description_long persistido + los 19 campos ricos (read-path) · sin traceback. Evidencia: .live-verify/live-servicio-workspace-after.png"
verified_at: 2026-06-16
dod_bugs_fixed_during_verify:
  - "POST /custom → 500 'relation products does not exist' → migration 046 (engine offer tables · metadata.create_all checkfirst). commit 9884d313"
  - "Resumen leaf crash (RichSelect/useFormContext null fuera de shadcn Form) → plain Select. commit 9884d313"
dod_open_findings:    # NO bloquean el happy-path; triage Chris/reconcile/auditor
  - "F1 (medium · wiring): ServiceStatusBar huérfano — layout.tsx renderiza ServicioWorkspaceShell directo, NO ServicioWorkspaceView (que monta ServiceStatusBar). El workspace NO tiene toggle Activo/ChipOrigen/FichaCompletenessChip. Activar SÍ funciona vía card del catálogo. RN-10/AC-19 parcial en workspace."
  - "F2 (HIGH · contrato BE / architect-gap): ServicePatchRequest sólo acepta {public_name, price, category, modality}. Los campos ricos de la ficha (descripción corta, qué incluye, procedimiento, resultados, riesgos, cuidados, RN-26 §6 'ficha completa editable') son textareas SIN onChange/persistencia (placeholders) porque el dominio/DTO offer no los modela. No-bug del builder; falta extender el contrato (reconcile)."
  - "F3 (low): tipo de cita inicial (appointment_type RN-32) no persiste (sin campo BE). Select renderiza pero el valor no se guarda."
sub_phase_a_progress:
  done: [T-1, T-2, T-3, T-4, T-5, T-6, "T-7-m0", "T-7-UI", "T-8-tests", "T-8-live-verify (core)"]    # all GREEN + committed + pushed
  remaining: ["chris_verify.signoff (funcional · G) — Chris ejerce el kit + triage F1/F2/F3", "visual goldens 8 (project=visual 0.001) — pendiente (opcional pre-merge · live-verify cubrió el render real)", "post-signoff: /auditor → STOP-2 /pm-luana Sub-phase B (RAG)"]
  last_commit: 9884d313
  resume: "/dev-team vitalia vitalia-fase2-lisa-servicios — happy-path live-verified (create+autosave+activate+keystone, commits →9884d313). Story en developed · AWAIT_CHRIS_VERIFY. Chris: ejercer kit (demo-script.md) + triage 3 findings (F1 ServiceStatusBar wiring · F2 ficha fields no persistibles=architect contract gap · F3 appointment_type). Tras signoff → /auditor. Visual goldens 8 pendientes (project=visual)."
architecture_pattern: ADR-vitalia-004
adr_004_compliance: full
ready_package_closed_at: '2026-06-15T20:00:00.000Z'
developing_started_at: '2026-06-15T20:30:00.000Z'
build_claim: 'released (live-verify done · pid573293)'
last_modified: '2026-06-16T04:15:00.000Z'
chris_verify:
  required: true                   # funcional (verification_nature: ambas · demo_required)
  signoff: null                    # → {by: Chris, date, result: SATISFIED|SATISFIED_WITH_FOLLOWUPS|REJECTED, notes}
  rounds:
    - round: 1
      date: 2026-06-16
      trigger: "Chris ejerció live, vio el workspace 'horrible' (colapsables aplanados, campos muertos) → scope-delta ratificado"
      scope_delta: "extender contrato BE (ficha rica) + fidelidad mockup + molécula reutilizable CollapsibleSection (@luana/ui-kit · promotion accepted)"
      built: "T-R0 CollapsibleSection (ui-kit · 18) · T-R1 BE widen DTO read+write + routing (33 ticket · 154 offer · 342 arch) · T-R2 StatusBar en Shell + borrar View huérfano (11) · T-R3 ResumenView 6 colapsables + hidratar+autosave + KnowledgePanel (668 vitest). commits 286bb833→e1ee335e (pushed)"
      re_live_verified: "PATCH description_long → 200 (NO 422) · workspace = mockup · BE log + response confirman persistencia. .live-verify/live-servicio-workspace-after.png"
      resolved: [F1, F2, F3]
  open_items: []                   # F1/F2/F3 resueltos por T-R2/T-R1/T-R3 (round 1). Pendiente: 8 visual goldens (opcional) + /auditor + tu signoff.
reconciled: false                  # /pm-vitalia R formal pendiente (cap YAML F.3 + spawnear 2 follow-up stories: adrian-ficha-rica-knowledge + accordion-dedup-cleanup)
agentic_reframe: 2026-06-06
input_spec_signed: true            # ✍ FIRMA 1 (intención) Chris 2026-06-06
mockup_final_signed: true          # ✍ FIRMA 2 (visual) Chris 2026-06-15 ("queda" + confirmó pasar a architect)
ratified_by_chris: true            # spec RONDA 2 (Gherkin + Matriz) ratificado Chris 2026-06-15
ratified_visual_by_chris: true     # shell-mockup-per-component (ADR-vitalia-003)
ratified_visual_at: '2026-06-15T18:00:00.000Z'
ratified_visual_iter: final
ratified_visual_mockups:
  - vitalia/docs/product/stories/vitalia-fase2-lisa-servicios/mockups/catalogo.html
  - vitalia/docs/product/stories/vitalia-fase2-lisa-servicios/mockups/escalera.html
  - vitalia/docs/product/stories/vitalia-fase2-lisa-servicios/mockups/servicio-workspace.html
  - vitalia/docs/product/stories/vitalia-fase2-lisa-servicios/mockups/nuevo-servicio.html
autonomous_mode: true              # Chris opt-in 2026-06-15 (architect→done autónomo); /architect ratifica criterios safe en dispatch-plan
parallel_safe: true
priority: high
estimated_dev_days: 5-6
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-lisa-doctores
    - vitalia-fase2-lisa-marca
blocks_hard: []
blocks_soft:
  - vitalia-fase2-adrian-propuestas
  - vitalia-fase2-valeria-agenda
reuse_map_summary: >-
  CONSUME Offer Studio engine (core/luana-core-offer-studio) vía Extension SDK EP-2 preset pack —
  servicios = Offer (NO Treatment/LadderSlot nuevo; el peldaño = OfferValueLevel del engine) ·
  EXTEND lisa-marca (voz para descripciones) + lisa-doctores (roster para link servicio↔doctor) ·
  NEW UI canvas escalera (drag-drop sobre value_level) + N3-dyn detalle servicio + ladder-slot
  workspace + link servicio↔doctor brand-level · CERO edit engine
spawned_at: 2026-05-22T00:00:00.000Z
ready_package:
  produced_by: /architect
  produced_at: '2026-06-15'
  files: [03-arch.md, 03-arch-be.md, 03-arch-fe.md, 03-arch-agentic.md, 04-validators.yaml, 05-guidelines.md, 06-tickets.yaml, dispatch-plan.md]
  phasing:
    sub_phase_A: "NO-RAG · autonomous · T-1..T-8 (8 buildable tickets) · builds to live-verified"
    sub_phase_B: "RAG · engine-lift /pm-luana · GATED (T-B1/B2/B3 blocked · dimension only)"
  hard_stops:
    - "STOP-1: chris_verify.signoff (funcional · merge gate)"
    - "STOP-2: /pm-luana engine-lift OK para Sub-phase B (RAG indexer + sales_agent retrieval tool)"
next_action: >-
  /dev-team vitalia vitalia-fase2-lisa-servicios — Sub-phase A autonomous build T-1
  (BE offer domain + migrations + repos). DAG en 06-tickets.yaml. autonomous_mode:true (sin pausa G).
  PARA antes de Sub-phase B (RAG · /pm-luana engine-lift). Merge gate = chris_verify.signoff (funcional).
release: F2
cap_target: lisa.servicios
cap_change_type: new
parent_story: null
---

# F2-S9 vitalia-fase2-lisa-servicios — checkpoint

## ⚠️ Re-refinamiento agéntico 2026-06-06 — el "Scope verbatim" de abajo está PARCIALMENTE OBSOLETO

La story se escribió 2026-05-22 bajo visión pre-agéntica. Re-refinada por `/pm-vitalia` 2026-06-06.
**SSoT del reframe + recomendación + prior-art completo: `00-research.md`.** El "Scope verbatim",
"Reuse map" y "Deliverables" de abajo se reescriben en `01-spec.md` vía `/po-ux`. Lo que cambia:
servicios = **Offer Studio offers** (no `Treatment`/`LadderSlot` engine nuevo) · el peldaño =
`OfferValueLevel` del engine · CERO edit engine (consume EP-2) · `module: treatments → offer`.

## Prior art scan (anti-duplication-refining · 2026-06-06)

| Fuente | Resultado | Decisión |
|---|---|---|
| `core/luana-core-offer-studio` (engine) | `OfferValueLevel` + `value_level_catalog` + `Offer`/`ServiceDetails` + `OFFER_LADDER_HINTS` (filas `PROFESIONAL_SALUD`) | **CONSUMIR vía EP-2** — catálogo + escalera YA existen como ontología engine. NUNCA recrear. |
| `core/luana-core-sales-agent/knowledge_builder.py` | `TenantKnowledgeBuilder.build_identity()` ya lee `offer_repo` + preset | El agente lee el catálogo **sin plomería nueva** (desbloquea canal-inbound RN-16) |
| `vitalia/treatments/` (propio) | followup de Camila (PHI), NO catálogo | NO reuse como catálogo (premisa original falsa, corregida) |
| `vitalia/` lisa-marca (done) | brand voice slot 5 | CONSUMIR (descripciones en voz de marca) |
| `vitalia/` lisa-doctores (developing) | `vitalia_doctors` + specialty | EXTENDER (link servicio↔doctor) |
| `comunify/` live | offer ladder creator (no clínico) | patrón análogo, confirma ontología transversal |

Detalle: `00-research.md § 2`.

## Decisión Chris 2026-06-06 (ratificada — AskUserQuestion)

1. **Alcance MVP = CANVAS COMPLETO** (drag-drop escalera + ladder-slot workspaces + analítica
   conversión + tabs Reseñas/Stats). Anti-objetivos que siguen fuera: A/B pricing · imports bulk ·
   AI suggested-pricing.
2. **Cableado agéntico:** `lisa-servicios` posee la **DATA** (Offers publicadas + link
   servicio↔doctor); el tool `match_service_and_specialist` vive en **canal-inbound**.
3. **Esta story es la KEYSTONE** del catálogo: desbloquea canal-inbound (refined, hard-dep),
   propuestas (F4) y landing-public (F6). DEBE entregar: (a) Offers publicables con campos
   agente-facing (§ 00-research) + (b) link servicio↔doctor persistido.

## Goal

Sub-tab Servicios de Lisa: **toggle Catálogo | Escalera de valor** (per `offer-expert` ontology). 

- **Catálogo:** vista tradicional CRUD treatments (nombre · descripción · duración · precio · doctores · imagen).
- **Escalera:** canvas visual con slots por rol estratégico (lead-magnet · tripwire · core · profit-maximizer · return-path) que mapean treatments → posiciones en escalera de valor con pricing override + cta_copy.

NEW model `LadderSlot` per `offer-expert` skill (ontology shipped en `core/luana-core-offer-studio`).

## Anti-objetivos

- NO duplicar `Treatment` model shipped
- NO tocar `core/luana-core-offer-studio` engine — usar Extension SDK EP-2 preset packs si LadderSlot domain está en engine
- NO implementar AI suggested-pricing (out-of-scope MVP)
- NO implementar A/B testing pricing (story future)
- NO implementar imports bulk (story future)

## Scope verbatim

### § 1 — Page + toggle view

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/servicios/page.tsx`:

```tsx
import { LisaServiciosView } from '@/features/lisa/components/servicios/LisaServiciosView'

export default async function Page({ params, searchParams }: PageProps) {
  const { view = 'catalogo' } = await searchParams  // 'catalogo' | 'escalera'
  return <LisaServiciosView initialView={view} />
}
```

### § 2 — `LisaServiciosView` toggle

Composición:
1. `<ServiciosHeader>` — Toggle Catálogo|Escalera (Shadcn `Tabs`) + "+ Nuevo servicio" + filter especialidad
2. Variant `<CatalogoView>` o `<EscaleraCanvas>` según view

### § 3 — `CatalogoView` (vista tradicional)

`vitalia/frontend/src/features/lisa/components/servicios/CatalogoView.tsx`:

Grid cards treatments:
- Imagen (S3 upload)
- Nombre + especialidad badge
- Duración + precio
- Doctores asignados (avatars)
- Stats tiny (sessions/mes · revenue/mes)
- Click card → workspace N3-dyn `[treatment-id]`

### § 4 — `EscaleraCanvas` (★ value ladder)

`vitalia/frontend/src/features/lisa/components/servicios/EscaleraCanvas.tsx`:

Canvas visual con 5 columns (slots) per ontology offer-expert:

```
┌─────────────────────────────────────────────────────────────────┐
│ LEAD-MAGNET │ TRIPWIRE  │   CORE     │ PROFIT-MAX │ RETURN-PATH │
│   (gratis)  │  (low $)  │  (anchor)  │  (premium) │  (recurring)│
├─────────────┼───────────┼────────────┼────────────┼─────────────┤
│ Evaluación  │ Limpieza  │  Implante  │  Carillas  │  Mantenim.  │
│  gratuita   │   $25     │   $1500    │   $2500    │   anual     │
└─────────────────────────────────────────────────────────────────┘
```

Cada slot card:
- Drag-drop treatments existentes desde panel lateral derecho ("Treatments sin escalera")
- Slot card muestra: rol + treatment_ref + pricing_override + cta_copy
- Click slot → drawer detalle inline para editar overrides

Sin escalera obligatoria — slots vacíos permitidos. Drop treatment a slot: backend POST `/api/treatments/ladder-slot` con role + treatment_id + tenant_id.

### § 5 — N3-dyn workspace `[treatment-id]`

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/servicios/[treatment-id]/page.tsx`:

Tabs:
- **Detalle** — Nombre · especialidad · descripción (alimentado por voice brand) · duración · precio base · imágenes
- **Doctores** — Multi-select doctors disponibles para este treatment
- **Plan pago default** — Si treatment >$X → default plan installments
- **Reseñas** — Lista público-visible reviews (consume F2-S11 voz signals · read-only)
- **Stats** — Sessions/mes · revenue · LTV per patient

### § 6 — N3-dyn workspace `ladder/[slot-id]`

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/servicios/ladder/[slot-id]/page.tsx`:

Detalle slot escalera:
- Rol estratégico
- Treatment referenciado (link al treatment workspace)
- Pricing override (vs base price)
- CTA copy (texto botón / mensaje promo)
- Performance: conversion rate slot anterior → este slot

### § 7 — Catalog Version + arch fitness

Per `offer-expert` rule:
- Cualquier change LadderSlot domain → bump `_CATALOG_VERSION` en `core/luana-core-offer-studio` (escalate `/pm-luana` si engine touch)
- Arch fitness test corre ambos stacks

Vitalia consume LadderSlotDef via Extension SDK EP-2 preset packs — sin tocar engine.

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Toggle Catálogo|Escalera persiste URL `?view=X` |
| AC-2 | CatalogoView grid cards funciona |
| AC-3 | EscaleraCanvas drag-drop treatment → slot funciona |
| AC-4 | Slot detalle drawer edita override + cta_copy |
| AC-5 | Workspace `[treatment-id]` tabs funcionan |
| AC-6 | Workspace `ladder/[slot-id]` muestra stats slot |
| AC-7 | "+ Nuevo servicio" crea treatment + redirect |
| AC-8 | Multi-select doctors funciona |
| AC-9 | Visual goldens × 10 (catalogo + escalera + 2 workspaces × 2 themes) |
| AC-10 | a11y axe pass · drag-drop keyboard alternative |
| AC-11 | Cross-tenant query bloqueada |
| AC-12 | RBAC: solo admin_clinic edita pricing · staff read-only |
| AC-13 | Catalog version arch fitness pass |
| AC-14 | Vitest + Playwright + a11y pass |

## Gherkin scenarios

### Scenario 1 — happy: drag treatment a slot core

**Given:** Treatment `Implante dental $1500` en panel "Sin escalera". 5 slots vacíos.

**When:**
1. User drag implante card → drop en slot CORE
2. Drawer abre con default pricing_override = base price

**Then:**
- Backend POST `/api/treatments/ladder-slot` { role: 'core', treatment_id: X, override: 1500 }
- Slot CORE muestra implante card
- Treatments sin escalera reduce N-1
- Audit log row

### Scenario 2 — negative: drop fail invalid role

**Given:** User intenta drop treatment con role que no existe

**When:** Custom drag-drop interception attempt

**Then:**
- Backend valida role contra catalog version
- Si role inválido → 422 + UI alerta + rollback drag

### Scenario 3 — edge: treatment ya en otro slot

**Given:** Treatment `Implante` ya en slot CORE

**When:** User drag desde CORE → drop PROFIT-MAX

**Then:**
- Drag intra-canvas — backend mueve slot (delete old + create new)
- Audit log: `ladder_slot_moved`
- Conversion stats recomputed background

### Scenario 4 — adversarial: pricing override negativo

**Given:** User intenta override $-50

**When:** Save submit

**Then:**
- Zod validation + backend validation reject
- UI muestra "Precio debe ser >= 0"

### Scenario 5 — keyboard-a11y drag canvas

**Given:** Foco en treatment card panel

**When:**
1. Space → entra modo select
2. Arrow → cycle slots
3. Space → confirma drop

**Then:**
- Screen reader anuncia transitions · aria-live region · visual focus ring

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/servicios/page.tsx` | MODIFY |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/servicios/[treatment-id]/page.tsx` | NEW (N3-dyn) |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/servicios/ladder/[slot-id]/page.tsx` | NEW (N3-dyn) |
| `vitalia/frontend/src/features/lisa/components/servicios/LisaServiciosView.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/servicios/CatalogoView.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/servicios/EscaleraCanvas.tsx` | NEW (★) |
| `vitalia/frontend/src/features/lisa/components/servicios/LadderSlot.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/servicios/TreatmentCard.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/servicios/NuevoServicioModal.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/servicios/treatment-detail/TreatmentWorkspace.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/servicios/treatment-detail/tabs/{Detalle,Doctores,PlanPago,Resenas,Stats}Tab.tsx` | NEW (5 files) |
| `vitalia/frontend/src/features/lisa/components/servicios/ladder-detail/LadderSlotWorkspace.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/api/servicios.ts` | NEW |
| `vitalia/frontend/src/features/lisa/types/treatment.types.ts` | NEW |
| `vitalia/frontend/src/features/lisa/types/ladder-slot.types.ts` | NEW |
| `vitalia/frontend/src/features/lisa/types/servicios-schema.ts` | NEW (Zod) |
| `vitalia/backend/src/modules/vitalia/treatments/api/treatments_router.py` | MODIFY |
| `vitalia/backend/src/modules/vitalia/treatments/api/ladder_slots_router.py` | NEW |
| `vitalia/backend/src/modules/vitalia/treatments/application/ladder_slot_service.py` | NEW |
| `vitalia/backend/src/modules/vitalia/treatments/extensions.py` | MODIFY (register LadderSlotDef via EP-2) |
| `vitalia/backend/src/modules/vitalia/treatments/persistence/migrations/XXXX_ladder_slots.py` | NEW |
| `vitalia/frontend/e2e/shell-organism/lisa-servicios-toggle.spec.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/lisa-servicios-escalera-drag.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/servicios/{view}-{light\|dark}.png` (×4) | NEW |
| `vitalia/frontend/e2e/__screenshots__/servicios/treatment-detail-{tab}-{light\|dark}.png` (×10) | NEW |
| `vitalia/backend/tests/modules/vitalia/treatments/test_ladder_slot_service.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/treatments/test_ladder_slot_arch_fitness.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/treatments/test_servicios_cross_tenant.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/treatments/` | Treatment model + repository | REUSE + extend |
| `core/luana-core-offer-studio` (engine) | Catalog DAG + LadderSlotDef ontology | CONSUME via Extension SDK EP-2 |
| `offer-expert` skill ontology | Lead-magnet / Tripwire / Core / Profit-max / Return-path roles | APPLY as canvas columns |
| Shadcn primitives | `Tabs` · `Dialog` · `Card` · `Drawer` · `Select` | npx install |
| `@dnd-kit/core` | DnD canvas | REUSE (also F2-S4 embudo) |
| Vitalia archived — brand_studio offer-studio FE | Patterns toggle view | TRANSPONER |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` + `vitalia-fase1-routing-shell`

### Soft
- `vitalia-fase2-lisa-doctores` — doctor-treatment assignment
- `vitalia-fase2-lisa-marca` — voice brand para descripciones default

### Esta historia desbloquea
- `vitalia-fase2-adrian-propuestas` — propuestas consumen catalog + LadderSlot
- `vitalia-fase2-valeria-agenda` — crear cita selecciona treatment
- `vitalia-fase2-camila-reactivar` — return-path slots para cohorte recall

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| LadderSlot ontology cambia frecuente | Media | Medio | Engine versioned + brand override slot copy local |
| Canvas drag UX confuso para clinic owners | Alta | Bajo | Tooltips + tutorial primer-uso · default presets vertical |
| Stats slot performance no real-time | Media | Bajo | Background worker recompute cada 1h |
| Engine catalog version mismatch | Baja | Alto | Arch fitness test estrato ambos stacks |

## Definición de "Done"

1. AC verificados
2. Visual goldens × 14 (catalog + escalera + workspaces tabs × 2 themes)
3. Backend tests ladder + catalog version + cross-tenant pass
4. Story pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `lisa.servicios` registrada

## Próximo paso post-done

- F2-S6 adrian-propuestas consume catalog + LadderSlot para builder
- F2-S1 valeria-agenda form crear-cita selecciona treatment + duración auto-fill

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Navigation tree:** § lisa.servicios
- **offer-expert skill:** value ladder ontology
- **HIPAA-lite:** `vitalia/.claude/rules/hipaa-lite.md`
- **Engine catalog SSoT:** `core/luana-core-offer-studio/src/luana_core_offer_studio/domain/`
