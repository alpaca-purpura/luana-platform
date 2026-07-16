# 01-spec.md — nicolify-r1-abel-buyer-multi-icp

> Owner: `/po`. Bugfix lite (ADR-011) — sin `02-design-agentic.md`, sin RONDA1/RONDA2 de `/po-ux` (PM ya routeó a `/po`: reuse-only de componentes existentes, cero mockup nuevo).

---
story_id: nicolify-r1-abel-buyer-multi-icp
type: bugfix
module: abel
capability: abel/icp-buyer
architecture_pattern: ADR-nicolify-001    # nueva sub-tab "Buyers" en el shell Abel — G0 aplica
po_version: 2
last_modified: 2026-07-15T21:30:00-05:00
ratified_by_chris: true
links:
  checkpoint: "checkpoint.md"
  chris_input: "chris-input.md"
  parent_story: "../../../archive/2026/stories/nicolify-r1-abel-icp-buyer/"
---

## Prior art applied

> Corrido por `/pm-nicolify` en la transición `idea→refining` (2026-07-15). Detalle completo del grep en `checkpoint.md § Prior art scan`.

- **Engine consumido:** `core/luana-core-brand-studio::BuyerPersona` — el parent (`nicolify-r1-abel-icp-buyer`) YA lo consume correctamente (field-contract compatible, `abel_buyers.demographics/psychographics/...` mismos slugs). Esta story **no toca el engine**, extiende solo el brand-extension.
- **Patrón reusado:** composite-PK join table — precedente `user_tenants` (IAM, las 3 marcas activas) confirma que es el patrón de la casa para relaciones N:M, no una abstracción a inventar.
- **Cross-brand:** sin hits `buyer`/`icp_` en vitalia/comunify (concepto exclusivo nicolify/abel B2B — esperado).
- **Decisión:** `net-new` dentro de `nicolify/backend/src/modules/nicolify/abel/` (join table `abel_icp_buyers`). Cero engine change, cero mirror cross-brand, cero lift candidate.

## Resumen ejecutivo

Hoy `Buyer.icp_id` es una FK `NOT NULL` 1:1 hacia `Icp` (confirmado en el código mergeado — ver `repro_evidence` en checkpoint.md). Un buyer transversal (ej. "CTO", casi idéntico cross-industria) no puede reusarse entre ICPs — hay que duplicarlo, y las copias divergen. Esta story reescribe la relación a many-to-many (`abel_icp_buyers`, join table), agrega "elegir existente" al flujo de alta, y suma una vista "Buyers" (directorio tenant-wide) como nueva sub-tab de Abel. Sin cambios al engine `BuyerPersona` — el fix vive 100% en el brand-extension `nicolify/backend/src/modules/nicolify/abel/`.

**v2 (2026-07-15, review funcional Chris↔Claude):** el pase de escenarios adversos detectó 4 huecos que esta versión cierra: (1) `DELETE /icp/{id}` ("Descartar borrador", existe y es user-reachable) dejaba attachments fantasma → **cascade detach + RN-11**; (2) attach-existing a ICP vacío no seteaba primary (asimetría con create) → **RN-12 auto-primary del primer buyer, unificado create+attach**; (3) detach del último ICP destruía el perfil sin aviso → **confirm destructivo en UI (SC-14)** + detach necesita affordance (hoy NO existe botón de borrar/quitar buyer — `useDeleteBuyer` sin consumidor UI, verificado); (4) create-blank (`name: "Nuevo buyer"`) contaminaría el directory tenant-wide → **tab "Crear nuevo" pide nombre primero** (mata el blank en el origen). Además: backfill filtra ICPs vivos + limpia buyers zombie (data legacy con ICP borrado), señal de entidad compartida en contexto ICP (RN-9 awareness), empty states del picker, manejo 409 en el sheet.

## § Mapa funcional

### 1. Happy path

1. El dueño abre el ICP "SaaS B2B" (Abel → **ICP & buyer**) y entra al detalle.
2. Toca "+ buyer" → sheet con 2 tabs: **Elegir existente** / **Crear nuevo** (default: Crear nuevo — v2: pide **nombre required** antes de crear, ya no crea blank).
3. Cambia a **Elegir existente** → busca "CTO" (ya creado en el ICP "Fintech") → lo selecciona.
4. El sistema crea la fila de attach (`abel_icp_buyers`: icp_id=SaaS B2B, buyer_id=CTO) sin duplicar el buyer — el sheet cierra, "CTO" aparece como leaf del ICP.
5. El dueño abre la nueva sub-tab **Buyers** (hermana de "ICP & buyer" en el Ribbon de Abel) → ve "CTO" con 2 badges: "SaaS B2B" y "Fintech".
6. Edita el rol de "CTO" desde la vista Buyers (autosave) → vuelve a cualquiera de los 2 ICPs → el cambio ya está reflejado (misma fila `abel_buyers`).

### 2. Bifurcaciones

```
Happy path
├─ Bif-1 · ¿el buyer elegido en "Elegir existente" ya está attached a este ICP?
│   ├─ no → attach crea la fila, leaf aparece                              → SC-1
│   └─ sí → bloqueado, "ya está en este ICP"                               → SC-2
├─ Bif-2 · al "quitar" un buyer de un ICP (detach), ¿queda en 0 ICPs?
│   ├─ no (sigue en ≥1) → borra solo la fila join, buyer sigue vivo        → SC-3
│   └─ sí (0 ICPs) → soft-delete real del buyer (huérfano prohibido, RN-5) → SC-3b
├─ Bif-3 · 2 requests attach concurrentes mismo (icp_id, buyer_id)
│   └─ composite PK rechaza el 2º → 409, 1 sola fila                       → SC-6 (race-condition)
├─ Bif-4 · set-primary concurrente, 2 buyers distintos, mismo icp_id
│   └─ unique partial index garantiza 1 solo primary final                 → SC-7 (race-condition)
├─ Bif-5 · attach/set-primary/detach con buyer_id de OTRO tenant
│   └─ 404 (tenant isolation, sin leak de existencia)                      → SC-5 (adversarial)
├─ Bif-6 · migración corre sobre filas reales (abel_buyers.icp_id ya poblado)
│   ├─ ICP del buyer vivo → backfill preserva 1:1 como primer attach, 0 pérdida → SC-8 (edge · data migration)
│   └─ ICP del buyer ya soft-deleted (legacy) → NO se crea join fantasma;
│       buyer queda en 0 attachments → soft-delete en la misma migración (RN-5/RN-11) → SC-8
├─ Bif-7 · DELETE /icp/{icp_id} ("Descartar borrador") con buyers attached
│   ├─ buyer también vive en otros ICPs → detach solo de este, sigue vivo   → SC-12
│   └─ buyer SOLO en este ICP → cascade: detach + soft-delete (RN-11)       → SC-12
└─ Bif-8 · attach/create sobre ICP sin buyers (primer buyer)
    ├─ queda is_primary=true automático (RN-12)                             → SC-13
    └─ 2 attaches "first" concurrentes (buyers distintos) → ambos attached,
        exactamente 1 primary (retry is_primary=false en el perdedor)       → SC-13 (race-condition)
```

### 3. Reglas de negocio

- **RN-5** (rewrite — reemplaza "exactamente 1 ICP") — un buyer pertenece a **≥1** ICP. 0 attachments = huérfano, sigue prohibido → dispara soft-delete real del buyer. **La UI advierte ANTES de la acción que deja al buyer en 0** (confirm destructivo — SC-14).
- **RN-6** (sin cambio conceptual, cambia de dueño) — `is_primary` único por ICP (≤1); vive en `abel_icp_buyers`, no en `abel_buyers`. **Nota declarada (v2):** el detach del buyer primary NO re-promociona a otro — el ICP puede quedar sin primary (estado válido; la UI simplemente no muestra ★). Test lo fija como contrato.
- **RN-1** (heredada raíz) — toda query de `abel_icp_buyers` filtra `tenant_id` (denormalizado en la fila — evita join extra).
- **RN-9** (nueva) — editar campos del buyer (nombre, demographics, psychographics, etc.) desde cualquier ICP o desde "Buyers" escribe la MISMA fila `abel_buyers` — visible en todos los ICPs donde está attached, sin propagación manual. **Awareness UI (v2):** si el buyer vive en >1 ICP, el form en contexto ICP muestra "También en: {otros ICPs}" para que el edit compartido no sea sorpresa.
- **RN-10** (nueva, migración) — el backfill de `abel_buyers.icp_id` (NOT NULL, pre-existente) a `abel_icp_buyers` no pierde ninguna fila **cuyo ICP esté vivo**: 1 fila vieja con ICP vivo → exactamente 1 fila join nueva. Filas cuyo ICP ya está soft-deleted (legacy) NO generan join fantasma → el buyer resultante en 0 attachments se soft-deletea en la misma migración (coherente con RN-5/RN-11).
- **RN-11** (nueva, v2 — cascade) — `DELETE /icp/{icp_id}` (soft-delete del ICP) **detachea todos sus buyers en la misma transacción**; cada buyer que quede en 0 attachments → soft-delete real (RN-5). Nunca quedan filas join apuntando a un ICP muerto.
- **RN-12** (nueva, v2 — primer buyer) — el **primer** buyer de un ICP (llegue por create o por attach) queda `is_primary=true` automático. Carrera de 2 "primeros" concurrentes: el índice `ux_abel_icp_buyers_primary` la resuelve — el perdedor reintenta con `is_primary=false` (ambos quedan attached, exactamente 1 primary).

### 4. Criterios de aceptación

- [ ] **AC-1** — un buyer creado en ICP A puede attach-earse a ICP B sin duplicar la fila (mismo `buyer_id`, 2 filas join).
- [ ] **AC-2** — editar el buyer desde cualquier ICP (o desde "Buyers") refleja el cambio en ambos — verificado LIVE (PATCH real + recarga de ambas pantallas, `test-design-doctrine.md § Verificación REAL`).
- [ ] **AC-3** — `is_primary` sigue único por ICP incluso con buyers compartidos (mismo buyer primary en ICP A, no-primary en ICP B, simultáneo).
- [ ] **AC-4** — la migración corre sin pérdida de datos sobre las filas reales que existan en `abel_buyers` al momento del deploy.
- [ ] **AC-5** — la vista "Buyers" lista todos los buyers del tenant con sus ICPs attached — tenant isolation verificada (RN-1).
- [ ] **AC-6** — la sub-tab "Buyers" está registrada y es navegable (Ribbon → Abel → sibling de "ICP & buyer") — ADR-nicolify-001 G0 (reachability, `anti-orphan-integration.md`).
- [ ] **AC-7** (v2) — borrar un ICP ("Descartar borrador") no deja attachments fantasma: sus buyers se detachean; los que quedan en 0 ICPs se soft-deletean (RN-11). Verificado con buyer compartido (sobrevive) + buyer exclusivo (se elimina).
- [ ] **AC-8** (v2) — el primer buyer de un ICP (por create o attach) queda primary automático (RN-12); el detach de un primary NO re-promociona (RN-6 nota) — ambos fijados por test.
- [ ] **AC-9** (v2) — quitar un buyer de su último ICP exige confirm destructivo explícito en UI ("se eliminará el perfil") — no hay destrucción silenciosa (SC-14).
- [ ] **AC-10** (v2) — crear buyer desde el sheet exige nombre (input required) — cero filas "Nuevo buyer" blank nuevas en el directory.

## § Pantallas (reuse-only — sin mockup nuevo)

> Toda pieza de esta tabla ya existe en `@luana/ui-kit` o en `features/abel/`. Cero átomo/mockup nuevo — por eso `/po` (no `/po-ux`) refina esta story, per `shell-mockup-per-component.md § Aplica a reusables`.

| Vista | Campo/pieza | Nuevo o existente | Origen (código real) | Validación |
|---|---|---|---|---|
| Sheet "+ buyer" (detalle ICP) | Tab **Elegir existente** | NUEVO (tab) | `GET /buyers` (tenant-wide, nuevo endpoint) | oculta buyers ya attached a este ICP · **empty states propios (SC-15):** sin buyers en el tenant → "Aún no tienes buyers creados" + CTA que cambia al tab Crear nuevo · todos ya attached → "Todos tus buyers ya están en este ICP" · **409 stale (SC-2):** toast "«{name}» ya está en este ICP" + refresh de la lista |
| Sheet "+ buyer" | Tab **Crear nuevo** | **CAMBIA (v2)** — input **nombre required** (autofocus) + botón "Crear buyer" → crea con nombre real + navega al leaf | `POST /icp/{icp_id}/buyers` | mata el create-blank `name: "Nuevo buyer"` (AC-10); botón disabled con nombre vacío |
| Sub-tab **Buyers** (nueva, N2 sibling de "ICP & buyer") | Card por buyer + badges de ICPs | NUEVO (composición) | `GET /buyers`, reusa patrón `IcpMasterListView.tsx` | tenant isolation (RN-1) |
| Buyers → detalle de un buyer | `BuyerLeafForm.tsx` (modo directory) | EXISTENTE (reused, +modo) | `abel_buyers` row | + botón "Agregar a otro ICP" (NUEVO, abre `AttachToIcpSheet`) |
| Detalle ICP (leaves = buyers) | leaf buyer | EXISTENTE — fuente pasa de `icp_id` directo a join, forma sin cambio | `abel_icp_buyers` | `IcpEntityLayoutClient.tsx` sin cambio de forma |
| Detalle buyer en contexto ICP | Botón **"Quitar de este ICP"** (detach) | **NUEVO (v2)** — hoy NO existe affordance de borrar/quitar buyer (`useDeleteBuyer` sin consumidor UI, verificado) | `DELETE /icp/{icp_id}/buyers/{buyer_id}` | attachado a >1 ICP → confirm simple ("Seguirá disponible en tus otros ICPs y en Buyers") · último ICP → **confirm destructivo** "Es el último ICP de este buyer — al quitarlo, el perfil se eliminará" (SC-14) · tras detach → navega al detalle del ICP |
| Detalle buyer en contexto ICP | Fila **"También en: {ICPs}"** (badges) | **NUEVO (v2)** — visible solo si `attachedIcps.length > 1` | `BuyerResponse.attached_icps` | RN-9 awareness: el usuario sabe que edita una entidad compartida |
| Detalle ICP → "Descartar borrador" | Copy del confirm existente | **CAMBIA (v2)** — agrega advertencia | `DELETE /icp/{icp_id}` (cascade RN-11) | "Los buyers que solo existen en este ICP se eliminarán también" |

**Registro de la sub-tab (reachability concreta — anti-orphan-integration):** `nicolify/frontend/src/lib/routing/shell-routes.ts::AGENT_SUBTABS.abel` gana un 4º entry `{ id: "buyers", label: "Buyers", icon: "👥" }` (hoy tiene `icp`, `oferta`, `marca`). `nicolify/frontend/src/components/shared/shell-organism/SubTabContent.tsx` gana el mapping `"abel.buyers"` → nueva vista `BuyersMasterListView` (composición, no átomo nuevo).

## § API delta (contra el router real — `nicolify/backend/src/modules/nicolify/abel/api/router.py`)

| Endpoint actual | Cambio |
|---|---|
| `GET /icp/{icp_id}/buyers` | sin cambio de firma — la query pasa de `WHERE icp_id=X` directo a join sobre `abel_icp_buyers` |
| `POST /icp/{icp_id}/buyers` | sin cambio — crea buyer nuevo + attach en la misma operación (comportamiento actual preservado) |
| `POST /icp/{icp_id}/buyers/{buyer_id}/attach` | **NUEVO** — engancha un buyer YA existente del tenant a este ICP (Bif-1) |
| `GET /buyer/{buyer_id}` | sin cambio |
| `PATCH /buyer/{buyer_id}` | sin cambio de firma — el efecto de propagación (RN-9) es automático (misma fila) |
| `POST /buyer/{buyer_id}/set-primary` | **cambia firma** — ahora requiere `icp_id` en el body (antes implícito por el FK único) |
| `DELETE /buyer/{buyer_id}` | **retirado**, reemplazado por `DELETE /icp/{icp_id}/buyers/{buyer_id}` (detach — Bif-2; soft-delete real solo si queda en 0 ICPs) |
| `GET /buyers` | **NUEVO** — directory tenant-scoped, cada item con `attached_icps: [{icp_id, label}]` |
| `DELETE /icp/{icp_id}` | sin cambio de firma — **cambia semántica (v2, RN-11):** ahora cascadea — detachea todos los buyers del ICP; los que quedan en 0 attachments → soft-delete, misma transacción (Bif-7) |
| `POST /icp/{icp_id}/buyers` (create) | **precisión (v2, RN-12):** el server decide `is_primary` (primer buyer del ICP → true). `BuyerCreate` NO acepta `is_primary` del cliente — el payload `is_primary` que hoy manda el FE en create es muerto (verificado: DTO sin campo) y se elimina del body |

## Acceptance Criteria (Gherkin AI-resistant)

### Scenario 1 — `attach-existing-buyer` (`type: happy`)

**Covers:** [Bif-1, AC-1, AC-2]

**Given:**
- Tenant con buyer "CTO" ya creado y attached solo al ICP "Fintech" (`abel_icp_buyers` tiene 1 fila para ese buyer_id).
- ICP "SaaS B2B" del mismo tenant, sin "CTO" attached.

**When:**
- `POST /icp/{icp_saas_b2b_id}/buyers/{buyer_cto_id}/attach`

**Then:**
- 201/200 con la nueva fila de attach.
- `abel_icp_buyers` tiene 2 filas para `buyer_id=CTO` (una por ICP), `abel_buyers` sigue teniendo **1 sola fila** (no duplicó el buyer).
- `GET /icp/{icp_saas_b2b_id}/buyers` incluye "CTO".
- `GET /buyers` muestra "CTO" con `attached_icps` de longitud 2.

**playwright_required:** true
**Graders:**
- { type: contract_test, path: "nicolify/backend/tests/modules/nicolify/abel/test_buyer_icp_attach.py", function: "test_attach_existing_buyer_creates_join_row_not_duplicate" }
- { type: state_check, target: db, query: "SELECT count(*) FROM abel_buyers WHERE id = :buyer_id", expect: 1 }
- { type: state_check, target: db, query: "SELECT count(*) FROM abel_icp_buyers WHERE buyer_id = :buyer_id", expect: 2 }
- { type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r1-abel-buyer-multi-icp/attach-existing.spec.ts" }

---

### Scenario 2 — `attach-already-attached-rejected` (`type: negative`)

**Covers:** [Bif-1]

**Given:** buyer "CTO" ya attached al ICP "SaaS B2B".
**When:** `POST /icp/{icp_saas_b2b_id}/buyers/{buyer_cto_id}/attach` (repetido)
**Then:**
- 409 con mensaje claro "ya está en este ICP".
- `abel_icp_buyers` sigue con exactamente 1 fila para ese par (icp_id, buyer_id) — sin duplicado.
- **(v2, UI)** si el 409 llega desde el sheet "Elegir existente" (lista stale — otra sesión attacheó primero): toast "«CTO» ya está en este ICP" + invalidación de queries → la lista se refresca y el buyer desaparece del picker. Sin white-screen, sin sheet colgado.

**playwright_required:** false
**Graders:**
- { type: contract_test, path: "nicolify/backend/tests/modules/nicolify/abel/test_buyer_icp_attach.py", function: "test_attach_duplicate_rejected" }
- { type: component_test, path: "nicolify/frontend/src/features/abel/components/icp/AddBuyerSheet.test.tsx", function: "muestra toast 409 y refresca lista en attach duplicado (stale)" }

---

### Scenario 3 — `detach-keeps-buyer-alive` (`type: edge`)

**Covers:** [Bif-2, RN-5, AC-2]

**Given:** buyer "CTO" attached a 2 ICPs (SaaS B2B, Fintech).
**When:** `DELETE /icp/{icp_saas_b2b_id}/buyers/{buyer_cto_id}`
**Then:**
- fila join (SaaS B2B, CTO) borrada.
- `abel_buyers.deleted_at` sigue NULL (buyer vivo — todavía attached a Fintech).
- `GET /icp/{icp_fintech_id}/buyers` sigue incluyendo "CTO" sin cambios.

**playwright_required:** true
**Graders:**
- { type: contract_test, function: "test_detach_with_remaining_attachment_keeps_buyer_alive" }
- { type: state_check, target: db, query: "SELECT deleted_at FROM abel_buyers WHERE id = :buyer_id", expect: null }

---

### Scenario 3b — `detach-to-zero-soft-deletes` (`type: edge`)

**Covers:** [Bif-2, RN-5]

**Given:** buyer "PM Junior" attached a UN solo ICP.
**When:** `DELETE /icp/{icp_id}/buyers/{buyer_pm_id}` (detach del único ICP)
**Then:**
- fila join borrada Y `abel_buyers.deleted_at` se setea (soft-delete real — RN-5, huérfano prohibido).
- `GET /buyers` (directory) ya NO lo muestra.

**playwright_required:** false
**Graders:**
- { type: contract_test, function: "test_detach_last_icp_soft_deletes_buyer" }

---

### Scenario 4 — `edit-propagates-cross-icp` (`type: happy`, formaliza el paso 6 del happy path)

**Covers:** [RN-9, AC-2]

**Given:** buyer "CTO" attached a 2 ICPs.
**When:** `PATCH /buyer/{buyer_cto_id}` cambia `role` desde la pantalla del ICP "SaaS B2B".
**Then:**
- `GET /buyer/{buyer_cto_id}` desde el contexto del ICP "Fintech" refleja el nuevo `role` — **ejercido LIVE** (2 recargas de pantalla reales, no asumido por 200).

**playwright_required:** true
**Graders:**
- { type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r1-abel-buyer-multi-icp/edit-propagates.spec.ts", function: "test_edit_from_one_icp_visible_in_other" }

---

### Scenario 5 — `cross-tenant-attach-blocked` (`type: adversarial`)

**Covers:** [Bif-5, RN-1]

**Given:** buyer "CTO" pertenece al tenant A. Tenant B autenticado.
**When:** tenant B intenta `POST /icp/{icp_de_B}/buyers/{buyer_cto_de_A}/attach`
**Then:**
- 404 (no 403 — no revela existencia del buyer de otro tenant).
- `abel_icp_buyers` sin fila nueva.
- Ningún leak del nombre/datos de "CTO" en la respuesta.

**playwright_required:** false
**Graders:**
- { type: contract_test, function: "test_attach_cross_tenant_buyer_returns_404_no_leak" }

---

### Scenario 6 — `race-condition` (`type: edge`, sub: race_condition)

**Covers:** [Bif-3]

**Given:** buyer "CTO" no attached aún al ICP "SaaS B2B".
**When:** 2 requests `POST .../attach` simultáneas (`Promise.all`, window <100ms).
**Then:**
- solo 1 gana (201); el otro recibe 409 (composite PK `(icp_id, buyer_id)` rechaza el duplicado).
- `abel_icp_buyers` termina con exactamente 1 fila para ese par.

**playwright_required:** true (2 requests vía `Promise.all` contra el backend real)
**Graders:**
- { type: contract_test, function: "test_concurrent_attach_only_one_wins" }
- { type: state_check, target: db, query: "SELECT count(*) FROM abel_icp_buyers WHERE icp_id=:icp AND buyer_id=:buyer", expect: 1 }

---

### Scenario 7 — `race-condition-set-primary` (`type: edge`, sub: race_condition)

**Covers:** [Bif-4, RN-6]

**Given:** 2 buyers distintos attached al mismo ICP, ninguno `is_primary`.
**When:** 2 requests `POST /buyer/{id}/set-primary` (uno por cada buyer, mismo `icp_id`) simultáneas.
**Then:**
- el unique partial index `ux_abel_icp_buyers_primary` garantiza que solo 1 termina `is_primary=true` para ese `icp_id` (el segundo o gana limpio o recibe 409 — nunca 2 primary simultáneos).

**playwright_required:** false
**Graders:**
- { type: contract_test, function: "test_concurrent_set_primary_only_one_wins" }
- { type: state_check, target: db, query: "SELECT count(*) FROM abel_icp_buyers WHERE icp_id=:icp AND is_primary=true", expect: 1 }

---

### Scenario 8 — `migration-backfill-no-data-loss` (`type: edge`, sub: data_migration)

**Covers:** [Bif-6, RN-10, AC-4]

**Given:** DB pre-migración con filas reales en `abel_buyers` (`icp_id NOT NULL` poblado, algunas `is_primary=true`): **N** filas vivas cuyo ICP está **vivo** + **(v2)** **M** filas vivas cuyo ICP ya está **soft-deleted** (legacy — el delete de ICP pre-v2 no cascadeaba).
**When:** corre la migración (backfill `abel_icp_buyers` desde `abel_buyers` ANTES de soltar `icp_id`/`is_primary` de la tabla vieja).
**Then:**
- `abel_icp_buyers` tiene exactamente **N** filas post-backfill (solo pares con ICP vivo — 1:1 con el estado pre-migración sano).
- cada `is_primary=true` original (de ICP vivo) se preserva en su fila join correspondiente.
- **(v2)** cero fila join hacia ICPs soft-deleted; los M buyers cuyo único ICP estaba muerto quedan `deleted_at` seteado en la misma migración (zombies cerrados — RN-5/RN-11).
- migración idempotente (`IF NOT EXISTS` + backfill con `ON CONFLICT DO NOTHING` + guard por column-existence) — correr 2 veces no duplica ni re-borra.

**playwright_required:** false
**Graders:**
- { type: integration, path: "nicolify/backend/tests/integration/test_abel_icp_buyer_migration_backfill.py" }
- { type: state_check, target: db, query: "SELECT count(*) FROM abel_icp_buyers", expect: "N (= count pre-migración de abel_buyers vivos con ICP vivo)" }
- { type: state_check, target: db, query: "SELECT count(*) FROM abel_icp_buyers j JOIN abel_icps i ON i.id = j.icp_id WHERE i.deleted_at IS NOT NULL", expect: 0 }

---

### Scenario 9 — `network-failure` (`type: edge`, sub: network_failure)

> Aplica: sub-tab "Buyers" + sheet "Elegir existente" hacen fetch API nuevo.

**Given:** usuario en la sub-tab "Buyers" o en el sheet "Elegir existente".
**When:** `GET /buyers` o `POST .../attach` falla (500/503/timeout).
**Then:**
- error UI visible, Spanish neutro ("No pudimos cargar los buyers…" / "No pudimos agregar el buyer…"), retry disponible, sin white-screen.

**playwright_required:** true (mock `page.route` 500)
**Graders:**
- { type: e2e, function: "test_buyers_directory_network_failure_retry" }

---

### Scenario 10 — `empty-state` (`type: edge`, sub: empty_state)

> Aplica: sub-tab "Buyers" nueva puede estar vacía (tenant sin buyers creados aún).

**Given:** tenant sin ningún buyer creado.
**When:** abre la sub-tab "Buyers".
**Then:** empty state con CTA hacia "crear el primer ICP + buyer" (reusa el patrón empty-state existente de "ICP & buyer").

**playwright_required:** true
**Graders:** { type: e2e, function: "test_buyers_directory_empty_state" }

---

### Scenario 11 — `accessibility` (`type: edge`, sub: accessibility)

**Given:** sub-tab "Buyers" en cualquier estado (lista poblada / vacía).
**When:** scan a11y automatizado + keyboard nav.
**Then:** 0 violaciones critical/serious WCAG AA, tab order lógico, focus visible (misma barra ya auditada en `IcpMasterListView` — composición nueva reusa átomos ya accesibles).

**playwright_required:** true
**Graders:** { type: axe, ruleset: "wcag2aa", paths: ["abel/buyers"] }

---

### Scenario 12 — `icp-delete-cascade` (`type: edge`, v2)

**Covers:** [Bif-7, RN-11, AC-7]

**Given:**
- ICP "SaaS B2B" con 2 buyers attached: "CTO" (también attached a "Fintech") y "PM Junior" (SOLO en "SaaS B2B").
**When:** `DELETE /icp/{icp_saas_b2b_id}` ("Descartar borrador").
**Then:**
- Las 2 filas join de "SaaS B2B" borradas — cero fila apuntando al ICP muerto.
- "CTO" sigue vivo (`deleted_at` NULL), attached solo a "Fintech"; su badge de "SaaS B2B" desaparece del directory.
- "PM Junior" soft-deleted (`deleted_at` seteado — quedó en 0 attachments, RN-5).
- Todo en la MISMA transacción (falla a mitad → rollback completo, cero estado parcial).
- El confirm de "Descartar borrador" advierte: "Los buyers que solo existen en este ICP se eliminarán también."

**playwright_required:** false (BE contract + component test del copy)
**Graders:**
- { type: contract_test, path: "nicolify/backend/tests/modules/nicolify/abel/application/test_icp_service.py", function: "test_delete_icp_cascades_detach_and_soft_deletes_orphans" }
- { type: state_check, target: db, query: "SELECT count(*) FROM abel_icp_buyers WHERE icp_id = :icp_deleted", expect: 0 }
- { type: state_check, target: db, query: "SELECT deleted_at FROM abel_buyers WHERE id = :buyer_cto", expect: null }
- { type: component_test, path: "nicolify/frontend/src/features/abel/components/icp/IcpWorkspaceView.test.tsx", function: "confirm de descartar advierte eliminación de buyers exclusivos" }

---

### Scenario 13 — `attach-first-auto-primary` (`type: edge`, sub: race_condition, v2)

**Covers:** [Bif-8, RN-12, AC-8]

**Given:** ICP "Fintech" recién creado, sin buyers. Buyers existentes "CTO" y "CFO" en el tenant.
**When:**
- (a) attach de "CTO" (primer buyer del ICP).
- (b) luego attach de "CFO" (segundo).
- (c) variante race: sobre OTRO ICP vacío, 2 attaches concurrentes ("CTO" y "CFO" via `asyncio.gather`).
**Then:**
- (a) fila join de "CTO" con `is_primary=true` (automático — RN-12). ★ visible en el leaf.
- (b) fila join de "CFO" con `is_primary=false`.
- (c) ambos quedan attached y **exactamente 1** termina primary (`ux_abel_icp_buyers_primary` rechaza al perdedor → el service reintenta ese attach con `is_primary=false`, no falla el request).
- Simetría con create: `POST /icp/{id}/buyers` (crear nuevo) sobre ICP vacío también produce primary automático — misma helper, mismo test pattern.
- Contrato RN-6 nota: detach del primary → el ICP queda sin primary, NADIE se auto-promociona (test explícito).

**playwright_required:** false
**Graders:**
- { type: contract_test, path: "nicolify/backend/tests/modules/nicolify/abel/application/test_buyer_service.py", function: "test_attach_first_buyer_becomes_primary" }
- { type: contract_test, function: "test_attach_second_buyer_not_primary" }
- { type: contract_test, function: "test_create_first_buyer_becomes_primary" }
- { type: contract_test, path: "nicolify/backend/tests/modules/nicolify/abel/infrastructure/test_icp_buyer_repository.py", function: "test_concurrent_first_attach_two_buyers_exactly_one_primary" }
- { type: contract_test, path: "nicolify/backend/tests/modules/nicolify/abel/application/test_buyer_service.py", function: "test_detach_primary_does_not_repromote" }
- { type: state_check, target: db, query: "SELECT count(*) FROM abel_icp_buyers WHERE icp_id=:icp AND is_primary=true", expect: 1 }

---

### Scenario 14 — `last-detach-confirm` (`type: edge`, v2 — destructive UX)

**Covers:** [Bif-2, RN-5, AC-9]

**Given:** usuario en el detalle de "PM Junior" dentro del ICP "SaaS B2B" (único ICP del buyer — `attachedIcps.length === 1`).
**When:** click en "Quitar de este ICP".
**Then:**
- Dialog destructivo: "Es el último ICP de este buyer — al quitarlo, el perfil se eliminará." Confirmar/Cancelar.
- **Cancelar** → cero cambios (sin request).
- **Confirmar** → detach + soft-delete (SC-3b) + navegación al detalle del ICP + el buyer desaparece de leaves y del directory.
- Contraste: mismo flujo con buyer en 2 ICPs → confirm simple no-destructivo ("Seguirá disponible en tus otros ICPs y en Buyers") → detach borra solo la fila join.

**playwright_required:** true
**Graders:**
- { type: component_test, path: "nicolify/frontend/src/features/abel/components/icp/BuyerLeafForm.test.tsx", function: "detach último ICP muestra confirm destructivo; cancelar no llama detach" }
- { type: e2e, path: "nicolify/frontend/e2e/regression/nicolify-r1-abel-buyer-multi-icp/detach-last-confirm.spec.ts" }

---

### Scenario 15 — `picker-empty-states` (`type: edge`, sub: empty_state, v2)

**Covers:** [AC-1 (flujo attach), SC-15]

**Given/When/Then (2 sub-casos del tab "Elegir existente"):**
- (a) tenant sin ningún buyer → "Aún no tienes buyers creados." + CTA que cambia al tab "Crear nuevo".
- (b) todos los buyers del tenant ya attached a este ICP → "Todos tus buyers ya están en este ICP." (sin CTA de attach).
- En ambos: sin lista vacía muda, sin spinner infinito, Spanish neutro.

**playwright_required:** false (component-level)
**Graders:**
- { type: component_test, path: "nicolify/frontend/src/features/abel/components/icp/AddBuyerSheet.test.tsx", function: "empty state sin buyers → CTA a Crear nuevo" }
- { type: component_test, function: "empty state todos attached → mensaje sin CTA" }

---

**Sub-categorías `not_applicable`:**
- `concurrent-users` (tenant isolation multi-user) → cubierta transitivamente por Scenario 5 (RN-1) + suite existente de `abel_icps`/`abel_buyers`; sin comportamiento nuevo de aislamiento a testear más allá del adversarial.
- `large-dataset` → `not_applicable_reason: "volumen esperado <50 buyers/tenant en R1; GET /buyers sin pagination en este scope — si escala, ticket aparte."`
- `i18n` → `not_applicable_reason: "sin campos nuevos de moneda/fecha; copy reusa Spanish-neutro ya cubierto por la story parent (nicolify-r1-abel-icp-buyer)."`

## § Matriz de cobertura

| Ítem (Mapa funcional) | Tipo | estado | Cubierto por | Verificación REAL |
|---|---|---|---|---|
| Bif-1 · attach nuevo / duplicado | branch | ⬜ pendiente | SC-1, SC-2 | POST real → fila DB + 409 en duplicado |
| Bif-2 · detach mantiene vivo / soft-delete a 0 | branch | ⬜ pendiente | SC-3, SC-3b | DELETE real → `deleted_at` NULL vs seteado |
| Bif-3 · attach concurrente | branch | ⬜ pendiente | SC-6 | `Promise.all` real → composite PK gana 1 |
| Bif-4 · set-primary concurrente | branch | ⬜ pendiente | SC-7 | 2 requests reales → unique index 1 primary |
| Bif-5 · cross-tenant | branch | ⬜ pendiente | SC-5 | request cross-tenant → 404 + DB intacta |
| Bif-6 · migración backfill (ICP vivo / ICP muerto legacy) | branch | ⬜ pendiente | SC-8 | migración real sobre DB con filas → count preservado + 0 joins fantasma + zombies cerrados |
| Bif-7 · ICP delete cascade (compartido vs exclusivo) | branch | ⬜ pendiente | SC-12 | DELETE real del ICP → joins borradas, compartido vivo, exclusivo soft-deleted |
| Bif-8 · primer buyer auto-primary (+ race 2 firsts) | branch | ⬜ pendiente | SC-13 | attach/create reales → 1 primary exacto; gather concurrente → 1 primary |
| RN-5 · buyer ≥1 ICP, huérfano prohibido + warning UI | rule | ⬜ pendiente | SC-3b, SC-14 | detach a 0 → soft-delete real, `GET /buyers` no lo lista; UI confirmó destructivo antes |
| RN-6 · is_primary único por ICP + no re-promoción | rule | ⬜ pendiente | SC-7, SC-13 | 2 set-primary concurrentes → 1 solo true; detach primary → 0 primary (fijado) |
| RN-9 · edit propaga cross-ICP + awareness UI | rule | ⬜ pendiente | SC-4 | PATCH real desde un ICP → GET real desde el otro refleja; "También en:" visible |
| RN-10 · migración sin pérdida (ICPs vivos) | rule | ⬜ pendiente | SC-8 | count pre/post-migración igual sobre pares sanos |
| RN-11 · cascade en ICP delete | rule | ⬜ pendiente | SC-12 | cero fila join hacia ICP muerto post-delete |
| RN-12 · primer buyer primary (create+attach simétricos) | rule | ⬜ pendiente | SC-13 | ambos flujos producen primary automático |
| AC-6 · sub-tab "Buyers" navegable | accept | ⬜ pendiente | SC-10, SC-11 | click real Ribbon → sub-tab renderiza (no huérfana) |
| AC-9 · confirm destructivo último detach | accept | ⬜ pendiente | SC-14 | e2e real: dialog → cancelar no destruye, confirmar sí |
| AC-10 · create con nombre required | accept | ⬜ pendiente | SC-15 (sheet) | botón disabled sin nombre; cero "Nuevo buyer" blank |

**Huecos detectados:** ninguno (v2 cierra los 4 detectados en el review funcional 2026-07-15: cascade ICP-delete, primary en attach, confirm último detach, blanks en directory).
**SC huérfanos:** ninguno.
**Diferido:** ninguno — scope quirúrgico, sin defer conocido a esta fecha.

## Non-functional requirements

| Categoría | Requisito | Verificador |
|---|---|---|
| Tenant isolation | cross-tenant attach/detach/set-primary → 404 sin leak | SC-5 |
| PII | `BuyerResponse` sin cambio de shape — sin PII nueva expuesta | `response_model=` existente |
| Accesibilidad | WCAG AA sub-tab nueva | SC-11 |
| Migración | idempotente, 0 pérdida | SC-8 |

## Constraints técnicos heredados

- `.claude/rules/backend-ddd.md` — tenant_id en TODA query de `abel_icp_buyers`.
- `.claude/rules/backend-migrations.md` — migración `IF NOT EXISTS` + backfill `ON CONFLICT DO NOTHING`, NUNCA DDL no-idempotente.
- `nicolify/.claude/rules/shell-feature-architecture.md` — sub-tab nueva cita `ADR-nicolify-001` (ya en frontmatter).
- `nicolify/.claude/rules/shell-mockup-per-component.md § Aplica a reusables` — composición 100% reuse, sin story nueva de Storybook.
- `.claude/rules/anti-orphan-integration.md` — reachability concreta de la sub-tab documentada arriba (`shell-routes.ts` + `SubTabContent.tsx`).

## Cross-module impact

- **Lee de:** `abel_icps` (sin cambio), engine `BuyerPersona` field-contract (solo referencia de shape, sin FK real — sin cambio).
- **Es leído por:** futura R2 (Christian/outbound) — consumirá `abel_icp_buyers`/`GET /buyers` como materia prima; este fix cierra ANTES de decompose R2 para no heredar el modelo 1:1.
- **Eventos:** sin eventos nuevos (fuera de scope — `nicolify_growth_studio_event` existente sin cambio).

## Open questions

- [x] ¿Botón "Agregar a otro ICP" abre el mismo sheet en modo attach, o flujo separado? → **Ratificado por default** (Chris aprobó sin objeción, 2026-07-15): mismo sheet, tab "Elegir existente". `/architect` construye sobre este default; si Chris lo quiere distinto en G (Chris-verify), es un round documentado ahí, no un revert de scope.
- [x] Nombre sub-tab "Buyers" vs "Compradores" → **Ratificado: "Buyers"** (nombre que Chris ya usó en `chris-input.md` — consistente con "ICP & buyer" que ya mezcla inglés/español).
- [x] (v2) ¿RN-5 debería sobrevivir al modelo M:N (permitir buyers "en banca" con 0 ICPs)? → **Ratificado: RN-5 se mantiene** (huérfano → soft-delete) + confirm destructivo en UI (SC-14). Si el uso real pide "banco de buyers", es story futura (relajar RN-5 = borrar el soft-delete del detach-a-0, migración trivial) — decisión consciente, no gap.
- [x] (v2) ¿ICP delete cascade o filtrar ICPs vivos en toda query join? → **Ratificado: cascade** (RN-11). Filtrar dejaría filas fantasma acumulándose + `count_attachments` mentiría; cascade mantiene el invariante "cero join hacia ICP muerto" verificable con 1 query.
- [ ] (declarado, no bloquea) ICP en status `LISTO` puede quedar sin buyers-con-role tras detach/cascade (readiness stale — `mark_ready` no se recomputa). Pre-existente del parent (el soft-delete viejo ya lo permitía). Si molesta en G → story lite aparte (recompute status on detach).

## Próximo paso

- `type: bugfix` (service-heavy, sin agentic) → skip UX → `/architect nicolify nicolify-r1-abel-buyer-multi-icp` directo al ratificar.

## Changelog

- v1 2026-07-15 — `/po` draft inicial. Formaliza el diseño técnico ya escrito por Chris+`/pm-nicolify` en `checkpoint.md` (schema/migración/API/FE delta) en Gherkin + Mapa funcional + Matriz de cobertura. Repro confirmado contra el CÓDIGO MERGEADO real (no el texto del checkpoint) — ver `checkpoint.md § repro_evidence`.
- v2 2026-07-15 — Review funcional adversarial Chris↔Claude (post-ready, pre-build). Agrega: **RN-11** (ICP delete cascade — Bif-7/SC-12/AC-7), **RN-12** (primer buyer auto-primary create+attach + race resolution — Bif-8/SC-13/AC-8), confirm destructivo último detach (SC-14/AC-9), tab "Crear nuevo" con nombre required (AC-10 — mata blanks "Nuevo buyer"), backfill filtra ICPs vivos + cierra zombies legacy (SC-8 ampliado), RN-9 awareness ("También en:"), empty states del picker (SC-15), 409-stale en sheet (SC-2 ampliado), RN-6 nota no-re-promoción. Todos verificados contra código mergeado (DELETE /icp existe en `router.py:185` sin cascade; `useDeleteBuyer` sin consumidor UI; `BuyerCreate` sin campo `is_primary` — payload FE muerto; `IcpWorkspaceView:87` "Descartar borrador"). Ratificado por Chris en conversación 2026-07-15.
