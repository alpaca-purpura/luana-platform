---
story_id: nicolify-r0-sitemap-completo
kind: 00-research
created_at: 2026-06-02
owner: /pm-nicolify
---

# 00-research — nicolify-r0-sitemap-completo

> Research de refining para la meta-story de planning. NO diseña hojas — inventario + ubicación + roadmap.

## Prior art scan (MANDATORY · `.claude/rules/anti-duplication-refining.md`)

Ejecutado 2026-06-02. Foco: cómo brands maduras resuelven las 3 discrepancias + 3 gaps de esta story (NO duplicar el árbol; reusar el patrón shell-organism agéntico).

### Fuentes consultadas

| Fuente | Path | Hallazgo aplicable |
|---|---|---|
| **vitalia SYSTEM-MAP** (761 líneas, 71 caps migradas) | `vitalia/docs/architecture/SYSTEM-MAP.yaml` | Patrón de referencia maduro del shell agéntico + zonas. |
| **vitalia shell-routes** | `vitalia/frontend/src/lib/shell-routes.ts` | Ribbon + landing + subtabs cableados. |
| nicolify SYSTEM-MAP v1.1 | `nicolify/docs/architecture/SYSTEM-MAP.yaml` | El árbol a completar a v2. |
| nicolify shell-routes | `nicolify/frontend/src/lib/routing/shell-routes.ts` | El nav a reestructurar. |
| paradigma | `docs/architecture/luana-platform/PARADIGM.md` + `ADR-nicolify-002` | 3 planos / 3 zonas (derivación de caja). |

### Hallazgos clave (reuse, NO mirror)

1. **Landing post-login = el agente "Operar/Mi Día"**, no el de ventas. En vitalia **Mateo** (= Sara en nicolify) es el landing operativo con `agenda` + `pacientes-del-día`. → Confirma resolver **D2** hacia `sara/mi-dia`, no `christian/pipeline`.

2. **El inbox de leads inbound vive DENTRO del agente bifronte**, no en un área separada. En vitalia el `inbox` (WhatsApp/IG/email unified, handler-mode agente·humano·pausado, ActionReceipt 5min undo) es subtab de **Adrián** (el bifronte = Christian en nicolify). → Resuelve **G1**: la recepción pasiva de leads es subtab de **Christian** (`recepcion`/`inbox`), consume `core/luana-core-channels` + `sales_agent`. NO crear módulo nuevo.

3. **Acceso + Onboarding = zona Plataforma pero NO ribbon tabs.** En vitalia viven como cajas de la zona Plataforma fuera del grid de agentes (Acceso = pre-login Clerk/RBAC; Onboarding = wizard agentic de alta). → Resuelve **D3**: documentarlas en `zones.plataforma` (ya están) sin meterlas como tab del Ribbon. Onboarding puede conducirlo Luana conversacional.

4. **Agenda/reuniones** en vitalia es de **Mateo** (`agenda semanal`). → Sugiere **G3**: la agenda/reuniones vive en **Sara** (Mi Día), con Christian agendando reuniones de venta hacia esa agenda. (Decisión de Chris.)

5. **Bandeja de aprobaciones del dueño (separación de poderes)** — NO existe equivalente directo en vitalia (vitalia no tiene la doctrina ADR-013 de empleados-IA con tiers de autonomía tan explícita). Es **net-new** para nicolify. Candidato a **lift cross-brand** si se confirma patrón (todas las brands con agentes autónomos lo necesitarán). → **G2** requiere decisión de hogar (Luana-surfaced vs caja dedicada).

### Decisión de duplicación

- **reuse-pattern** (shell-organism agéntico de vitalia, re-temizado): D1, D2, D3, G1, G3 — todos siguen el patrón vitalia, NO se recrea.
- **lift-candidate**: G2 (bandeja de aprobaciones / separación de poderes) — flaggear `promotable: candidate` a `/pm-luana` si se confirma transversal a empleados-IA.
- **net-new (nicolify-specific)**: licitaciones (minería), token economy (ya declarada).

## Estado del árbol HOY (verificado 2026-06-02)

Ver `checkpoint.md § Estado del árbol HOY`. Resumen:
- SYSTEM-MAP v1.1 = 3 zonas · 6 agentes + Config + Infra · 28 áreas · 7 flujos · 12 entidades.
- shell-routes.ts = Ribbon (abel/brenda/christian/sara/norvil + config) + AGENT_SUBTABS + AGENT_SUBSUBTABS={}.

## Discrepancias shell ↔ map (verificadas en código)

| # | Discrepancia | Map v1.1 | shell-routes.ts | Prior-art |
|---|---|---|---|---|
| **D1** | Subtabs de Sara | `mi-dia` + `proyectos` + `entregas` | SOLO `proyectos` | alinear shell → map |
| **D2** | Landing post-login | nota: Sara/"Mi Día" | `DEFAULT_LANDING = christian/pipeline` | → `sara/mi-dia` (vitalia=Mateo) |
| **D3** | Plataforma (Acceso/Onboarding) | zona declarada (3 cajas) | solo `config` ribbon tab | fuera del Ribbon (como vitalia) |

## Gaps de completitud (decisiones de producto)

| # | Gap | Pregunta | Recomendación PM (prior-art) |
|---|---|---|---|
| **G1** | Bandeja leads inbound (recepción pasiva WhatsApp) | ¿dónde vive? | subtab de **Christian** (`recepcion`) — patrón Adrián inbox vitalia |
| **G2** | Bandeja aprobaciones/decisiones del dueño (ADR-013 separación de poderes) | ¿hogar? | **decisión Chris** — Luana-surfaced vs caja dedicada · lift-candidate |
| **G3** | Reuniones/agenda | ¿dónde? | **Sara** (Mi Día) la posee · Christian agenda ventas hacia ella |

## Decisiones de Chris (2026-06-02 · ratificadas vía AskUserQuestion)

| # | Cuestión | Decisión Chris | Efecto en el árbol |
|---|---|---|---|
| **D1** | Subtabs de Sara | `mi-dia` = el HUB del día a día (trae conexiones de todos lados). **Sin gestión de proyectos propia este stage** (futuro cercano). | Sara este stage = `mi-dia` (default). `proyectos`+`entregas` → diferidos a release futuro, NO en el nav skeleton ahora (o empty-state "próximamente"). |
| **D2** | Landing post-login | **Se queda en `christian/pipeline`.** | `DEFAULT_LANDING` no cambia. Se actualiza la NOTA del map (que decía Sara/Mi Día) para reflejar christian/pipeline. |
| **D3** | Acceso/Onboarding | Fuera del Ribbon (zona Plataforma). | Sin cambio: documentadas en `zones.plataforma`, no como tab. |
| **G1** | Bandeja leads inbound | **Inbox de Christian** — "ver todas las conversaciones atendidas por Christian". Replicar el inbox de vitalia (casi idéntico visual). | Christian gana functional_area `inbox` (la recepción pasiva inbound aterriza ahí). Ver § Inbox deep-dive. |
| **G2** | Bandeja de aprobaciones | **Descartado este stage** ("no me compliques"). | NO se crea caja. Las aprobaciones quedan como guardrail por-agente (audit row) + reporte de Luana. Revisitar en futuro. |
| **G3** | Reuniones / agenda | **Christian** es dueño de todo lo comercial; las reuniones comerciales le pertenecen. Sara NO tiene agenda definida aún (su día a día es un hub, no project-mgmt). | La agenda/reuniones comerciales viven en Christian. Sara = hub. |

## Inbox deep-dive — vitalia → nicolify (encargo explícito de Chris · G1)

### Qué ES (vitalia, shipped)

Bandeja unificada **omnicanal** (WhatsApp · IG · Email · Web) con paradigma **3-modos de atención** por conversación:
- 🤖 **Decide solo** (agente autónomo) · 🤝 **Consulta** (HITL: agente propone, humano aprueba/edita) · ✏️ **Yo escribo** (humano toma el control).
- **OCC** (optimistic concurrency, `expected_version` → 409 si dos operadores tocan la misma conv).
- **ActionReceipt 5-min undo** (revertir el último mensaje del agente antes del TTL).
- **Activity Stream** (explicabilidad: qué tools invocó el agente, cronológico).
- Layout **3 paneles**: `[Lista convs 320px] [Thread 1fr] [ContactSidebar 320px]`.

### Estado real (vitalia)

| Capa | Estado | Evidencia |
|---|---|---|
| BE módulo `inbox/` (8 endpoints, 9 services, OCC, ActionReceipt, handler_mode 3-state) | **SHIPPED** | `vitalia-slice-1-inbox` done 2026-05-20 · 927 BE tests |
| FE `features/inbox/` (InboxLayout, SegmentedControl3Modes, ActionReceiptUndoChip, AgentActivityStream, ContactSidebar…) | **SHIPPED** | 237 FE tests + 5/5 e2e |
| Capability `sales_agent/inbox-handler-mode-occ` | `deprecated` (UI superseded) · scenarios `live` | el contrato OCC sigue siendo SSoT |
| Migración al shell-organism (3-modos refinado + activity stream sidebar) | **PLANNED** (`vitalia-fase2-adrian-inbox`, `state: idea`) | aún sin construir |

### ★ Dato histórico clave

El inbox de vitalia **nació forkeado físicamente del `nicolify/closer-studio/components/inbox/`** (dirección original **nicolify → vitalia**, evidencia en comentarios de `InboxLayout.tsx`, `MessageBubble.tsx`). Nicolify se reseteó a esqueleto; replicar = **traer de vuelta a casa la versión mejorada**.

### Compartido visual vs distinto interno (la pregunta de Chris)

- **~85% visual idéntico/genérico** (replicable retematizando tokens): InboxLayout 3-panel · SegmentedControl3Modes · MessageBubble (4 sender types) · ActionReceiptUndoChip · AgentActivityStream · FilterChips · crm-shared hooks (`use-conversations`, `use-conversation-detail`).
- **Distinto interno (vitalia-specific, NO copiar)**: `ContactSidebar` con `PiiMaskedSpan`/`RequireRole`/`AuditedSection` (HIPAA) · dual filter `tenant_id+clinic_id` · `ComplianceService.validate_outbound` (bloquea PHI por canal) · roles médicos · voice patterns clínicos. **Nicolify NO necesita NADA de eso** — solo `tenant_id` + RBAC genérico + (B2B) audit de acciones autónomas + consent outbound.

### Lo que ya vive en engine (consumible por import)

`core/luana-core-sales-agent` (LangGraph + tools + callback) · `luana-core-platform` (`CompoundScopeRepositoryBase`) · `luana-core-events` (outbox) · `luana-core-idempotency` · `luana-core-channels` (`format_for_channel`) · `luana-core-observability` (trace + sanitize). **NO en engine** (brand-local): las entidades `Conversation`/`Message`/`ActionReceipt`/`ActivityEvent` + el módulo `inbox/` (OCC, handler_mode) — `luana-core-crm` tiene Lead/Customer pero NO inbox-conversations.

### ✅ Ruta recomendada (PROPONE — pendiente nod de Chris)

**Copy re-tematizado del FE + patrón DDD sin capa HIPAA. NO lift a engine todavía.**

1. **FE:** copiar `vitalia/frontend/src/features/inbox/` + `crm-shared/` → `nicolify/frontend/src/features/inbox/`, retematizar tokens + labels (terminología nicolify/Christian), reemplazar `ContactSidebar` PHI-gated por uno simple (sin PiiMasked), URL base `/api/v1/nicolify/...`, `useTenantId()` en vez de `useClinicId()`.
2. **BE:** replicar el patrón DDD de `vitalia/backend/.../inbox/` en `nicolify/backend/.../{inbox|sales_agent}/` con solo `tenant_id` (sin `clinic_id`), sin `@require_phi_access`, sin audit HIPAA (usar audit genérico de `luana-core-platform`). **Mantener** OCC + ActionReceipt 5min + handler_mode (patterns valiosos engine-level). Consumir el mismo engine que vitalia.
3. **NO lift ahora:** `Conversation`/OCC/ActionReceipt a `core/` requiere **promotion proposal `/pm-luana`** — vitalia tiene `clinic_id` como 2º scope y nicolify solo `tenant_id`; un lift prematuro rompe el dual-filter de vitalia. Diseñar el contrato cross-brand DESPUÉS de tener 2 consumidores reales.
4. **Lift-candidate flaggeado** (futuro, `promotable: candidate`): `SegmentedControl3Modes` + `ActionReceiptUndoChip` (presentacionales puros) → posible `luana-core-inbox-ui` o `@luana/design-tokens`.

**Esfuerzo estimado del build futuro:** ~5-7 días (BE DDD sin HIPAA + FE retematizado). **Esto NO se construye en esta meta-story** — es una story dedicada de un release futuro (R1/R2).

### Aterrizaje en el árbol (SYSTEM-MAP v2)

- **Christian** gana functional_area **`inbox`** ("Conversaciones / Bandeja") — la recepción pasiva inbound (G1) aterriza ahí. Audiencia: `sales_agent` (front-line externo) + vista interna del dueño.
- `data_ownership.Conversation` se reasigna: owner `christian` / module `sales_agent` (en v1.1 estaba en luana/copilot).
- Nuevas entidades a declarar: `Message`, `ActionReceipt` (owner christian).

## Pendiente del refining (próximos turnos)

1. ✅ Ratificar las 6 decisiones (D1-D3 + G1-G3) — hecho este turno.
2. ✅ Inbox deep-dive (encargo Chris) — hecho · pendiente nod a la ruta recomendada.
3. ⏭ Nombrar a alto nivel las hojas faltantes de cada área (recorrer las 28 áreas v1.1 + las nuevas).
4. ⏭ Secuenciar la ruta de desarrollo (qué hoja en qué release R1..RN).
5. ⏭ Escribir SYSTEM-MAP v2 + actualizar releases.
6. ⏭ Thin build del nav skeleton (`/architect` → `/dev-team`): `shell-routes.ts` (add Christian `inbox` + Sara `mi-dia` default + diferir `proyectos`/`entregas`) + empty-states.
