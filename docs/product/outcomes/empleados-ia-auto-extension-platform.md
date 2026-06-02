# Outcome (platform) — Empleados-IA + auto-extensión

> Owner: `/pm-luana`. Outcome cross-brand que materializa ADR-013. Registra el trabajo derivado: spike de implementación + stories por marca. NO es spec ejecutable.

---
outcome_id: empleados-ia-auto-extension-platform
type: platform
status: accepted
created: 2026-06-01
owner: /pm-luana
adr: ADR-013-empleados-ia-auto-extension
source_story: docs/product/stories/empleados-ia-auto-extension/
consumers: [vitalia, nicolify]   # primeras instancias · resto hereda al bootstrap
---

## Qué cementa

Luana = sistema operativo de **empleados-IA vendidos por puesto** (cadena de valor: Base + Atraer/Vender/Operar/Retener) sobre **un solo motor que se auto-extiende** (12 primitivas × 5 tiers + router 2-niveles + flywheel + flujo durable de 1ª clase), coordinado por **3 modos** (coreografía / supervisora / handoff medido), con disciplina **SOLID** y **techo de auto-extensión** al core. Detalle: ADR-013 + `00-research.md`.

## Trayectoria B → A

- **B (ahora):** consolidar el motor para nosotros — árbol de capacidades runtime-consultable · read-models por dominio · router 2-niveles · **motor de flujos durables como EP T2 (cornerstone)** · protocolo de intenciones. (acción única + event bus ya existen.)
- **A (norte):** exponérselo al usuario vía la supervisora — auto-extensión runtime (T1/T2/T3) · generative UI / WhatsApp Flows · grafos per-tenant · pricing por empleado/outcomes.

## Trabajo derivado (handoffs — NO los escribe /pm-luana)

| # | Trabajo | Owner | Estado |
|---|---|---|---|
| 1 | **Spike: motor de flujos durables** → recomendación LangGraph durable + Temporal escape + Cloudflare descartado | `/architect` (platform) | ✅ **DONE** 2026-06-02 (`spike-durable-flows.md`, ratificado Chris) |
| 1b | **L1 — motor durable real (un-defer):** lift checkpointer provider a `core/luana-core-flows` + instalar `langgraph-checkpoint-postgres` + cablear 5 grafos (vitalia ×3, comunify ×2) + migraciones + downstream regression + live-verify. Proposal `2026-06-02-durable-flows-engine` (accepted). | `/architect` → `/dev-team` → `/auditor` | 🔨 **EN CURSO** (flujo excepcional Chris: cero deuda esta conversación) |
| 1c | **L2 — `FlowCompiler`/`FlowDefinition`/EP-19** (compositor declarativo): diseño ready-package esta conversación, **build siguiente** | `/architect` (diseño) → `/dev-team` (build futuro) | 🎨 diseño en curso |
| 2 | Story derivada vitalia: instanciar el modelo sobre el SYSTEM-MAP existente (roster + primer flujo durable real sobre L1) | `/pm-vitalia` | pendiente (post L1+L2) |
| 3 | Story derivada nicolify: instanciar sobre su roster (Abel/Brenda/Christian/Sara/Norvil + Luana) | `/pm-nicolify` | pendiente |
| 4 | Read-models publicados por dominio (requisito del read/write split, caso borde 1) | `/architect` + builders | pendiente |
| 5 | Entitlement por empleado + medición de outcomes (soporte de packaging — pricing exacto TBD Chris) | `/pm-luana` + `/architect` | pendiente |

## Invariantes que el trabajo derivado debe respetar (de ADR-013)

- Un solo engine (personas/scopes, nunca motor por agente/marca).
- La supervisora reenvía intención, no construye en dominio ajeno (ownership por dueño).
- Coreografía por eventos = default; orquestación para ambiguo/PHI; directo = excepción medida.
- Cross-brand: etapa = interfaz estable (core); roster + procesos = extension (Liskov).
- Techo: core invariante → gate humano `/pm-luana`, nunca auto-construido.
- Separación de poderes: autonomía la concede el humano, no el agente.

## Bitácora

- 2026-06-01 — /pm-luana creó el outcome desde ADR-013 (ratificado Chris). Stories derivadas quedan como handoffs a brand PMs + spike a /architect.
