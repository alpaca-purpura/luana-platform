---
story_id: nicolify-r1-abel-buyer-multi-icp
type: bugfix

# Release entity (contenedor temporal · lifecycle.md § 5)
release: R1

# Capability lineage (v2 cement 2026-05-27)
module: abel                                       # bucket code:abel — mismo módulo que nicolify-r1-abel-icp-buyer (parent, ya done)
cap_target: abel/icp-buyer                        # mismo target que nicolify-r1-abel-icp-buyer (01-spec.md:11)
cap_change_type: extend                            # agrega scenarios nuevos (attach existing buyer + directory) al mismo cap
parent_story: null                                 # NO se pobla: parent (nicolify-r1-abel-icp-buyer) aún no está `done`

state: idea
phase_workflow: PM_DRAFT
phase: null
autonomous_mode: false
last_artifact: checkpoint.md
last_modified: 2026-07-15T17:47:04-05:00
next_action: "DESBLOQUEADA 2026-07-15 — nicolify-r1-abel-icp-buyer llegó a done (chris_verify.signoff SATISFIED, merge completo). Schema abel_icps/abel_buyers estable. Próximo paso: refinar lite vía /po (backend-heavy, sin diseño nuevo mayor — la vista 'Buyers' directory es la única superficie UI nueva)."
ratified_by_chris: false
input_spec_signed: false
mockup_final_signed: false
spawned_at: 2026-07-15T17:47:04-05:00
spawned_by: /pm-nicolify
parallel_safe: true
blocked_reason: null                  # RESUELTO 2026-07-15 — nicolify-r1-abel-icp-buyer en done
audit_iterations: 0
defer_audit: false
defer_audit_reason: null
parked_reason: null
dropped_reason: null

# Bugfix repro-first gate (ADR-011 · hereda hotfix-repro-mandatory.md)
# Gap de diseño confirmado por lectura de schema (no incident/handoff) — repro_verified formal
# (test RED o ejercicio live) es responsabilidad de /po ANTES de developing, no de esta captura.
hotfix_metadata:
  repro_verified: false
  repro_command: "Leer nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/03-arch-be.md:97 → `Buyer.icp_id: UUID` (FK NOT NULL, comentario 'RN-5 → Icp, no huérfanos'). Live (cuando dev-app up): crear buyer 'CTO' en ICP A → intentar reusar el mismo perfil en ICP B → UI fuerza crear-de-nuevo (sin opción 'elegir existente'), confirmando el 1:1 duro."
  diagnosis_validates_handoff: null                # no viene de handoff/incidente — origina de conversación de diseño Chris↔Claude 2026-07-15

dod_live_verified: false
dod_env: null
dod_evidence: []
dod_verified_at: null
dod_live_verified_skip_reason: null

demo_required: true
demo_skip_reason: null

chris_verify:
  required: true
  signoff:
    signed_by: null
    date: null
    result: null
    notes: null
    open_items: []
  rounds: []
reconciled: false
---

# Bugfix — Buyer 1:1 duro con ICP impide reusar perfiles transversales (CTO, PM…) cross-industria

## Síntoma (cómo se ve)

Hoy, si el dueño de una agencia define el mismo perfil de comprador (ej. "CTO" o "Product Manager" — casi idénticos en estilo de decisión independientemente de la industria) en dos ICPs distintos (ej. ICP "SaaS B2B" e ICP "Fintech"), **debe crearlo dos veces**. No existe forma de reusar/reenganchar un buyer ya definido a un segundo ICP. Cada copia vive suelta — editar una no actualiza la otra (drift garantizado).

Origen: detectado en conversación de diseño Chris↔Claude 2026-07-15, al revisar el modelo de `nicolify-r1-abel-icp-buyer` (story en `state: reviewing`, casi cerrada) de cara a la story de outbound (Christian, R2) que consume ICP+buyer como materia prima.

## Root cause (confirmado por lectura de schema — NO incident)

`nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/03-arch-be.md`:

- `Buyer.icp_id: UUID` — **FK NOT NULL, 1:1 duro** hacia `Icp` (línea 97, comentario "RN-5 → Icp, no huérfanos").
- `is_primary: bool` vive **en el `Buyer`**, no en la relación (línea 101) — asume que un buyer solo puede ser primary de UN ICP porque solo pertenece a uno.
- Migración: `abel_buyers (id, tenant_id, icp_id UUID NOT NULL, name, role, decision_power, is_primary, demographics JSONB, ...)`.
- RN-5 del spec: *"Un buyer pertenece a exactamente un ICP (1 ICP → N buyers). No hay buyer huérfano."*

El `Buyer` en este modelo YA es un archetype/persona (campos `role`, `decision_power`, `demographics`/`psychographics` — no un contacto real con datos de identidad; eso vive aparte en `Stakeholder` del CRM, `agent-revenue-engine.md §5`). Por eso "hacer un archetype de un archetype" (capa de plantillas encima) fue descartado como mala idea en la conversación — el fix correcto es dejar que el `Buyer` mismo sea compartible, no envolverlo en una capa nueva.

## Fix propuesto (scope técnico completo — para que /po/architect no rederiven el análisis)

### 1. Schema — pasar de FK dura a join table

```sql
-- abel_buyers PIERDE icp_id + is_primary (pasan a ser propiedad de la RELACIÓN, no del buyer)
CREATE TABLE IF NOT EXISTS abel_icp_buyers (
  icp_id UUID NOT NULL,              -- REFERENCES abel_icps(id)
  buyer_id UUID NOT NULL,            -- REFERENCES abel_buyers(id)
  tenant_id UUID NOT NULL,           -- denormalizado — evita join extra en el filtro tenant (RN-1)
  is_primary BOOLEAN NOT NULL DEFAULT false,
  attached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (icp_id, buyer_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_abel_icp_buyers_primary
  ON abel_icp_buyers (icp_id) WHERE is_primary;   -- RN-6 sigue siendo POR ICP (correcto — vive en la relación ahora)
```

Por qué join table y no array/JSON: `is_primary` es propiedad del **par** (icp, buyer) — el mismo buyer puede ser primary en un ICP y no-primary en otro. Solo una join table modela eso limpio.

**Migración de datos** (delicada — el story origen ya tiene filas reales con `icp_id NOT NULL`): backfill `INSERT INTO abel_icp_buyers (icp_id, buyer_id, tenant_id, is_primary, attached_at) SELECT icp_id, id, tenant_id, is_primary, created_at FROM abel_buyers` ANTES de soltar las columnas viejas. Idempotente (`IF NOT EXISTS` en la tabla, backfill con `ON CONFLICT DO NOTHING`).

### 2. RN rewrite

- RN-5 → "un buyer pertenece a **≥1** ICP" (ya no exactamente 1). Huérfano = 0 attachments, sigue prohibido.
- RN-6 → sin cambio conceptual, pero la unicidad de `is_primary` vive en `abel_icp_buyers`, no en `abel_buyers`.

### 3. API delta

- `POST /icp/{icp_id}/buyers` — se mantiene (crear buyer nuevo + attach en la misma operación).
- `POST /icp/{icp_id}/buyers/{buyer_id}/attach` — **nuevo**: engancha un buyer ya existente del tenant.
- `DELETE /icp/{icp_id}/buyers/{buyer_id}` — cambia de semántica: pasa a ser **detach** (borra la fila join), no soft-delete del buyer. Si el buyer queda en 0 ICPs tras el detach → recién ahí soft-delete real.
- `GET /buyers` — **nuevo**, directory tenant-scoped (todos los buyers del tenant), cada item con `attached_icps: [{icp_id, label}]`.
- `POST /buyer/{buyer_id}/set-primary` — firma pasa a requerir `icp_id` (era implícito por el FK); escribe la fila join, no el buyer.

### 4. FE delta (deliberadamente chico — decisión de Chris en la conversación de diseño)

- Sheet "+ buyer" dentro del detalle de un ICP gana 2 tabs: **Elegir existente** (search sobre `GET /buyers`, oculta los ya attached a ese ICP) / **Crear nuevo** (flujo actual, sin cambios).
- Nueva vista **"Buyers"**, hermana de "ICPs" en el nivel Abel (mismo patrón master-list `EntitySubNavBar`). Cada card muestra badges de los ICPs donde el buyer vive. Entrar a un buyer → edita sus campos (propaga a TODOS los ICPs donde está attached, porque es la misma fila) + botón "+ agregar a otro ICP".
- El detalle de ICP (`EntitySubNavBar` con leaves = buyers) no cambia de forma — solo la fuente de los leaves pasa de `icp_id` directo a la join table.

## Bar de verificación (DONE)

- Un buyer creado en ICP A puede attach-earse a ICP B sin duplicar la fila (mismo `buyer_id` en dos filas de `abel_icp_buyers`).
- Editar el buyer desde cualquiera de los dos ICPs (o desde la vista "Buyers") refleja el cambio en ambos — ejercido LIVE (PATCH real + recargar ambas pantallas), no asumido por 200 (`test-design-doctrine.md § Verificación REAL`).
- `is_primary` sigue siendo único por ICP incluso con buyers compartidos (test: mismo buyer primary en ICP A, no-primary en ICP B, simultáneo).
- Migración corre sin pérdida de datos sobre las filas reales que ya existan en `abel_buyers` al momento del merge de `nicolify-r1-abel-icp-buyer`.
- Vista "Buyers" lista todos los buyers del tenant con sus ICPs attached — tenant isolation verificada (RN-1, un tenant no ve buyers de otro).

## Notas de scope

- **Bloqueada por diseño**, no por prioridad: `nicolify-r1-abel-icp-buyer` (parent conceptual, no declarado como `parent_story` formal porque aún no está `done`) debe mergear primero — esta story reescribe su schema.
- `cap_change_type: extend` porque agrega scenarios nuevos (attach-existing, buyers directory) al cap `abel/icp-buyer`, no es un fix de bug de comportamiento roto — es una completion de un gap de modelo detectado antes de que el consumidor (Christian/R2 outbound) lo necesite. Tipeado `bugfix` (lite, ADR-011) porque el scope es quirúrgico y no requiere diseño nuevo mayor (la única superficie UI net-new es la vista "Buyers", que reusa el patrón master-list ya existente).
- Impacta directamente a R2 (Christian/outbound) — ICP+buyer es su materia prima (`01-spec.md:49`). Vale cerrarla ANTES de decompose R2 para no heredar el modelo 1:1 a los tickets de outbound.
- Sin cambios a `Stakeholder`/CRM (`agent-revenue-engine.md §5`) — esa es la capa de contactos reales, ortogonal a esta.

## Bitácora

- 2026-07-15 — Story creada en state=idea desde conversación de diseño Chris↔Claude (revisando modelo ICP/buyer de cara a R2 outbound). Detalle técnico completo capturado arriba para que /po no rederive el análisis al refinar.
