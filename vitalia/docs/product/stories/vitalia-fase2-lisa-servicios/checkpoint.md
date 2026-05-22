---
story_id: vitalia-fase2-lisa-servicios
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: lisa
module: treatments
capability: lisa.servicios
state: idea
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 5-6
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-lisa-doctores             # doctor-treatment matrix
    - vitalia-fase2-lisa-marca                # voice brand para descripciones
blocks_hard: []
blocks_soft:
  - vitalia-fase2-adrian-propuestas           # propuestas consumen catalog
  - vitalia-fase2-valeria-agenda              # crear cita selecciona servicio
reuse_map_summary: "REUSE treatments shipped (vitalia/backend/src/modules/vitalia/treatments/) · NEW canvas escalera de valor (LadderSlot per offer-expert) · NEW toggle Catálogo|Escalera · NEW N3-dyn detalle tratamiento + ladder slot"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md con wireframes canvas escalera + detalle tratamiento · /architect evaluar LadderSlot domain model"
---

# F2-S9 vitalia-fase2-lisa-servicios — checkpoint

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
