---
outcome_id: vitalia-mvp-ui-foundation
brand: vitalia
status: active
priority: high
spawned_at: 2026-05-17
last_updated: 2026-05-18
ssot_owner: /pm-vitalia
parent_outcome: null
related_outcomes:
  - dev-environment-multibrand   # bloqueante operativo (dev stack debe funcionar para iterar UI)
stories:
  - vitalia-ux-discovery                   # state: ready (READY_PACKAGE_CLOSED_AND_SPLIT) — /architect produjo package 2026-05-17, split en 7 sub-stories
  - vitalia-slice-1-infra-cross-cutting    # state: done — 2026-05-18 merged (squashes 50143d57 + cc4fcd68), 8 capabilities live
  - vitalia-slice-1-onboarding-wizard      # state: refined (UNBLOCKED post infra merge)
  - vitalia-slice-1-inbox                  # state: refined (UNBLOCKED post infra merge)
  - vitalia-slice-1-pipeline               # state: refined (UNBLOCKED post infra merge, sub-blocker payment-adapter-mvp + copilot-tools-impl)
  - vitalia-slice-1-agenda                 # state: refined (UNBLOCKED post infra merge, sub-blocker payment-adapter-mvp + fiscal-emission-pe)
  - vitalia-slice-1-fidelizacion           # state: refined (UNBLOCKED post infra merge)
  - vitalia-slice-1-marketing              # state: done — 2026-05-21 merged (audit cycle 3 iter APPROVED), 5 capabilities live (4 marketing + 1 connections)
  - vitalia-copilot-tools-impl             # state: developing/defer_audit (4/10 tickets pushed BE; 6 remaining agentic Opus R23 — retoma sesión fresca)
slice_strategy:
  slice_1:
    scope: "5 rutas operativas P1 (Inbox + Pipeline + Agenda + Fidelización + Marketing)"
    target: "Operador puede trabajar un día completo en Vitalia FE"
    status: active
    infra_done: true   # vitalia-slice-1-infra-cross-cutting → done 2026-05-18
  slice_2:
    scope: "5 rutas dirección P2 (Dashboard ejecutivo + Inversión publicitaria + Brand Studio + Tratamientos + Configuración)"
    target: "Owner puede operar + dirigir"
    status: planned
  slice_3:
    scope: "Mobile native polish + multi-clinic switcher + audit log viewer + advanced analytics"
    target: "Production-grade UX"
    status: planned
---

# vitalia-mvp-ui-foundation — outcome

> Outcome maestro del FE Vitalia MVP. Agrupa la discovery (vitalia-ux-discovery) + stories de implementación Slice 1, 2, 3.

## Goal

Construir el **frontend Vitalia funcional** que opera sobre el backend Story 11 ya shipped (24 endpoints, 17 EPs scaffold). Slice 1 entrega operador diario (Recepción+Marketing); Slice 2 agrega capacidades dirección (Owner). Slice 3 polish + advanced.

**Producto re-framed esta sesión**: Vitalia NO es ERP clínico — es **sistema de atracción + cierre + fidelización**. Las clínicas tienen su gestión médica en sus sistemas existentes (Rendu/Dentalink/Doctocliq/propio). Vitalia opera sobre marketing + ventas + retención. Doctor view defer.

## Why now

- Backend Story 11 shipped 2026-05-15 (16 capabilities en 13 módulos) — base operativa lista
- Dev stack multibrand operativo (story `vitalia-dev-stack-functional` en refining cierra bugs bootstrap)
- Design system base cementado en `vitalia/docs/architecture/design-system.md`
- Sesión UX exploration 2026-05-17 cementó: empezar por personas+JTBD+nav flow, NO layout
- Discovery v0 ratificada 2026-05-17: 2 personas (P1+P2 Owner=Superset), 10 JTBD, sidebar progresiva, copilot rail Nicolify reuso directo, cross-flows simplificados, 4 diferenciadores MUST visible MVP

## Scope

### In-scope (este outcome)
- 5 rutas operativas P1 (Slice 1) — primera entrega
- 5 rutas dirección P2 (Slice 2) — segunda entrega
- Reuso directo Copilot Nicolify (65+ componentes) + Brand Studio (4 secciones)
- 4 diferenciadores MUST visible: agentes identidad + booking prepaid 30% + Brand Studio voz + fidelización workflow
- Spanish neutro LATAM + HIPAA-lite framework defensivo
- Responsive web (desktop + tablet + mobile via responsive)

### Out-of-scope (este outcome)
- Doctor view dedicada (defer hasta detectar demanda explícita producción)
- ERP clínico features (ficha médica detallada, odontograma, historia clínica, prescripciones) → cliente usa su sistema
- Mobile native iOS/Android apps → solo responsive web MVP
- Patient portal → Slice 3+
- Multi-sucursal complejo → Slice 3+
- Marketing Manager dedicado / agencia externa flow → Slice 2+
- Idiomas distintos a español neutro
- Dark mode
- Voice cloning premium → defer per `vitalia/config/brand.yaml::voice_cloning: false`

### Defer explícito (Stories futuras separadas)
- **vitalia-pricing-decision** (idea pendiente abrir cuando Chris esté listo) — tier model + precios concretos Vitalia plan. Bloquea pantallas que muestren costo (probable Slice 2 `/configuracion` o `/plan-billing`). Slice 1 NO toca pricing.
- **vitalia-payment-adapter-mvp** — wire al menos 1 de los 3 payment gateways scaffold backend para que el booking prepaid 30% funcione end-to-end.
- **vitalia-copilot-tools-impl** — implementar T-tools-1..4 Valeria que están scaffold (per 00-research.md backend audit). Bloquea features avanzadas Valeria; onboarding wizard puede usar tools mínimos.

## Stories (current + planned)

| Story | Estado | Slice | Owner | Notas |
|---|---|---|---|---|
| `vitalia-ux-discovery` | `refining/SPEC_V0_RATIFIED` | discovery (todos) | `/po-ux` | v0 ratificada 2026-05-17. Falta v1 wireframes+Gherkin+microcopy+Slice 1 cut |
| `vitalia-slice-1-fe` (planned) | `idea` | 1 | TBD `/po-ux` | Implementación 5 rutas P1. Spawn cuando v1 spec discovery ratificada |
| `vitalia-slice-2-fe` (planned) | `idea` | 2 | TBD `/po-ux` | Implementación 5 rutas P2 dirección |
| `vitalia-pricing-decision` (planned) | — | side | Chris + `/pm-vitalia` | Definir tier model + precios. NO bloquea Slice 1 |

## Slice strategy

### Slice 1 — Operativo básico (target: ~5-6 semanas dev)

5 rutas P1 funcionales end-to-end:

1. **`/inbox`** — conversaciones unificadas WhatsApp+IG+web+email con Adrián backgrond + atribución agente
2. **`/pipeline`** — funnel lead→reserva con depósito 30% nativo
3. **`/agenda`** — calendar con color-coded slots + cobranza activa
4. **`/fidelizacion`** — workflows post-tratamiento (NPS + Google reviews + re-engagement)
5. **`/marketing`** — performance Meta+Google+IG con Lucas recomendaciones

**Componentes core requeridos:**
- App shell (sidebar izq + main + copilot rail derecho)
- Copilot rail Nicolify forkeado (60px collapsed + 460px expanded + 680px full + Shell Mutex + mobile FAB) con tokens Vitalia
- AppSidebar config-driven (5 entries P1)
- 4 diferenciadores MUST visible

**Validators críticos Slice 1:**
- E2E smoke: login → /inbox → responder paciente → cerrar turno con depósito 30% confirmed
- Tests unit: 4 componentes diferenciadores (agent avatar / deposit badge / brand voice render / fidelización card)
- A11y: contrast ratio ≥ 4.5:1, keyboard nav, ARIA labels

### Slice 2 — Owner/Director (target: ~4-5 semanas dev)

5 rutas P2 (extras dirección):
6. `/dashboard` — KPIs ejecutivos agéntic
7. `/inversion-publicitaria` — gasto + bandeja pendientes aprobación
8. `/brand-studio` — identidad + voz + equipo + testimonios
9. `/tratamientos` — catálogo + variants + precios (precio TBD si pricing decision aún no resuelta)
10. `/configuracion` — plan + billing + audit log + equipo

### Slice 3 — Polish + advanced

- Mobile native polish (PWA quizá)
- Multi-clinic switcher
- Audit log viewer detallado
- Analytics avanzados
- Voice cloning premium (cuando ratificado)
- Patient portal opcional

## Success metrics

### Slice 1 (post-merge)
- ≥ 1 clínica beta operando 1 día completo en Vitalia FE sin fallback a Excel/WhatsApp Web
- ≥ 80% turnos creados con depósito 30% pagado en 48h
- ≥ 1 workflow fidelización completado end-to-end con reseña Google capturada
- Adrián responde ≥ 60% conversaciones sin intervención humana
- 0 PHI leaks en traces (verificado via `audit_log` + sanitize_payload)

### Slice 2 (post-merge)
- Owner accede a Vitalia ≥ 2 veces/semana sin pedir asistencia
- ROI publicidad visible en dashboard
- Onboarding inicial (Valeria wizard) completado por Owner en < 10 min
- Cero bypass de bandeja "Pendientes aprobación" (todos los items requieren autorización explícita)

## Dependencies + Risks

### Dependencies
- **`vitalia-dev-stack-functional`** debe cerrar issues 7+8 (FE volume + alembic auto-upgrade) antes de arrancar dev iterativo Slice 1
- **Backend payment_adapter MVP** scaffold debe wirearse al menos 1 gateway para depósito 30% funcione (spawn story `vitalia-payment-adapter-mvp` cuando Slice 1 entre a `developing`)
- **Copilot tools T-tools-1..4** scaffold — onboarding Valeria wizard depende de tools mínimos. Si bloquea, fallback a wizard form-based no-conversational

### Risks
- **Reuso Nicolify**: 65+ componentes copilot deben portarse limpio sin contaminar tokens nicolify→vitalia. Mitigación: arch fitness test prohibe hex literales + import nicolify desde vitalia.
- **Pricing TBD**: si Chris demora decisión pricing, Slice 2 `/configuracion`+`/plan-billing` quedan bloqueadas. Mitigación: Slice 1 no toca pricing, Slice 2 puede arrancar con `(precio TBD)` placeholder y ajustar al final.
- **Doctor demand surprise**: si beta clínica pide doctor view, scope creep. Mitigación: documentado defer en spec v0, cualquier demanda producción genera idea separada (no se mete a este outcome).

## Bitácora

- **2026-05-17 outcome creado** (post v0 spec ratificada): paradigm v4 outcome maestro agrupador. Slice 1 cut a 5 rutas P1 (decisión Chris). Slice 2 = 5 rutas P2 (planned). Pricing decision separada (postponed). Next: `/po-ux` produce v1 spec con wireframes + Gherkin + microcopy + componentes mapping acotado a Slice 1.

## Referencias

- `vitalia/docs/product/stories/vitalia-ux-discovery/` — story discovery (spec v0 ratificada)
- `vitalia/docs/product/stories/vitalia-ux-discovery/01-spec.md` — modelo personas+JTBD+sidebar+copilot ratificado
- `vitalia/docs/architecture/design-system.md` — tokens base cementados
- `vitalia/.claude/rules/hipaa-lite.md` — PHI surface rules + RBAC
- `vitalia/config/brand.yaml` — feature flags + plan tiers + compliance_level
- `vitalia/docs/product/capabilities/` — 16 caps shipped Story 11 (base backend)
- `nicolify/frontend/src/features/copilot/` — fork target copilot
- `nicolify/frontend/src/features/brand-studio/` — fork target brand studio
- `docs/process/pm-redesign-2026-05.md` — paradigm v4 (10 estados macro)
