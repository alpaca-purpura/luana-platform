---
outcome: vitalia-mvp-ui-foundation
type: cross-story-handoff
last_modified: 2026-05-20
last_modified_by: /pm-vitalia
purpose: |
  Archivo de comunicación intermedio para coordinación de 5 sub-stories Slice 1 que corren en olas paralelas
  (Chris ratificó plan 2026-05-20). Cementa contratos compartidos cross-story para evitar refactor downstream:
  - Tipos TypeScript compartidos cross-feature
  - Schemas Zod compartidos
  - Endpoints API consumidos por >1 ruta
  - Eventos de dominio cross-módulo
  - Side effects esperados de stories en paralelo
---

# HANDOFF — Cross-story coordination Slice 1 (5 rutas paralelas)

> SSoT comunicación entre Olas 1 + 2 + 3 ratified Chris 2026-05-20.
> Update obligatorio cuando una story produce/consume un contrato listado abajo.

## § 1 — Plan de olas (ratified Chris 2026-05-20)

| Ola | Stories paralelas | Side stories dep | Estimated wall clock |
|---|---|---|---|
| 1 | `/inbox` + `/fidelización` | ninguna (auto-contenidas) | 2-3 sem |
| 2 | `/pipeline` + `/marketing` | `vitalia-payment-adapter-mvp` (pipeline) | 3-4 sem |
| 3 | `/agenda` (sola) | `vitalia-payment-adapter-mvp` + `vitalia-fiscal-emission-pe` | 2-3 sem |

**Auto-handoff** entre fases: `/dev-team` cierra `developed` → `/auditor` → `/pm-vitalia` merge → state=done + archive + capability inventory. Sin pedir confirmación Chris intermedia (ratified 2026-05-20).

## § 2 — Pre-flight gates (hard gate antes Ola 1)

Bloqueo ABSOLUTO Ola 1 hasta cumplir todos:

- [ ] Clerk testing token fresco (`CLERK_TESTING_TOKEN_VITALIA` en `vitalia/.env.dev`) + `VITALIA_CLERK_WEBHOOK_SECRET` configurado
- [ ] 3 test users creados via Clerk API (sin Organizations — Luana usa tenants+users propios engine `luana-core-iam`):
  - `dr.demo@vitalia.test` — publicMetadata `{"vitalia_role":"doctor"}`
  - `recepcion@vitalia.test` — publicMetadata `{"vitalia_role":"recepcion"}`
  - `admin@vitalia.test` — publicMetadata `{"vitalia_role":"super_admin"}`
- [ ] 3 tenants fixture seedeados via `scripts/seed_fixture_clinics.py --apply` (Aurora AR / Mindful CL / Sanaré MX)
- [ ] Asociación user↔tenant: vía webhook auto-sync (Clerk user.created → engine `_handle_user_sync` → vitalia `OnboardingService.create_clinic_profile`) o fallback script `seed_test_users_link.py`
- [ ] Playwright storage state generado: `vitalia/frontend/playwright/.clerk/user.json` (vía auth.fixture, sin org_switch)
- [ ] Suite smoke 23 specs GREEN local (`E2E_BASE_URL=http://localhost:3002`)
- [ ] Suite smoke 23 specs GREEN live (`E2E_BASE_URL=https://dev-app.vitalialat.com`)
- [ ] Promotion proposal `2026-05-20-core-platform-extensions-slice-1` (cron_envelope + CompoundScopeRepositoryBase) state=migrated en main:
  - `core/luana-core-platform` 0.2.0 → 0.3.0
  - `vitalia/_shared/workers/base.py::idempotent_cron` → import desde `luana_core_platform.workers.cron_envelope`
  - `vitalia/_shared/repositories/phi_repository.py::PhiRepositoryBase` → import desde `luana_core_platform.repositories.compound_scope_repository.CompoundScopeRepositoryBase`

## § 3 — Contratos TypeScript compartidos (FE)

### CRM-shared (consumido por inbox + pipeline + agenda)

Ola 1 (`/inbox`) **produce**, Olas 2 (`/pipeline`) + 3 (`/agenda`) **consumen**:

```typescript
// vitalia/frontend/src/features/crm-shared/types.ts (NEW Ola 1)

export interface Lead {
  id: string;
  tenant_id: string;
  clinic_id: string;        // dual-scope per HIPAA-lite
  name: string;
  phone: string | null;
  email: string | null;
  stage: LeadStage;         // enum: interesado | calificando | considerando | listo | reservado_deposito | decidio_no
  attribution: {
    origin: 'sales_agent' | 'walk_in' | 'phone_manual' | 'proactive_outbound';
    channel: string | null; // facebook | google | whatsapp | meta | ...
    attributed_at: string;  // ISO date
  };
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  tenant_id: string;
  clinic_id: string;
  channel: 'whatsapp' | 'instagram' | 'facebook_messenger' | 'web' | 'walk_in' | 'phone';
  status: 'active' | 'paused' | 'closed' | 'archived';
  last_message_at: string;
  messages_count: number;
}

export type LeadStage =
  | 'interesado'
  | 'calificando'
  | 'considerando'
  | 'listo'
  | 'reservado_deposito'
  | 'decidio_no';
```

### Marketing-shared (consumido por marketing + pipeline)

Ola 2 (`/marketing`) **produce**:

```typescript
// vitalia/frontend/src/features/marketing-shared/types.ts (NEW Ola 2)

export interface LucasRecommendation {
  id: string;
  tenant_id: string;
  clinic_id: string;
  stage: LeadStage | 'attribution' | 'expansion' | 'cross_stage';
  recommendation_type: 'stage_optimization' | 'attribution_insight' | 'referral_opportunity' | 'channel_alert';
  payload: {
    title: string;
    body_markdown: string;
    severity: 'info' | 'warning' | 'critical';
    suggested_actions: { label: string; href: string }[];
  };
  computed_at: string;
  expires_at: string | null;
}

export interface AttributionEntry {
  stage: 'reserva';
  origin: 'sales_agent' | 'walk_in' | 'phone_manual' | 'proactive_outbound';
  count_30d: number;
  conversion_rate: number;
  delta_vs_prev_period: number;
}
```

## § 4 — Schemas Zod compartidos (validation)

| Schema | Path | Producer | Consumers |
|---|---|---|---|
| `leadSchema` | `vitalia/frontend/src/lib/zod-schemas/lead.ts` | Ola 1 inbox | pipeline, agenda |
| `conversationSchema` | `vitalia/frontend/src/lib/zod-schemas/conversation.ts` | Ola 1 inbox | pipeline (channel filter) |
| `appointmentSchema` | `vitalia/frontend/src/lib/zod-schemas/appointment.ts` | Ola 3 agenda | inbox (link to current booking), pipeline (badge depósito) |
| `paymentEventSchema` | `vitalia/frontend/src/lib/zod-schemas/payment-event.ts` | Side payment-adapter-mvp | pipeline (badge depósito 30%) + agenda (cobranza) |
| `npsSchema` | `vitalia/frontend/src/lib/zod-schemas/nps.ts` | Ola 1 fidelización | inbox (tag detractor) |
| `lucasRecommendationSchema` | `vitalia/frontend/src/lib/zod-schemas/lucas-recommendation.ts` | Ola 2 marketing | pipeline (stage_optimization cards), fidelización |

## § 5 — Endpoints API compartidos

### Producidos por Ola 1 — `/inbox`

| Method | Path | Consumers |
|---|---|---|
| GET | `/api/v1/vitalia/crm/leads` (paginated + filters) | pipeline (kanban), agenda (link a paciente) |
| GET | `/api/v1/vitalia/crm/leads/{lead_id}` | pipeline (drawer), agenda (booking detail) |
| GET | `/api/v1/vitalia/crm/conversations` (filter by status + channel) | pipeline (signal flag) |
| GET | `/api/v1/vitalia/crm/conversations/{id}` | pipeline (drawer historial) |
| POST | `/api/v1/vitalia/crm/leads/{id}/stage` (advance) | pipeline (DnD action) |

### Producidos por Ola 1 — `/fidelización`

| Method | Path | Consumers |
|---|---|---|
| GET | `/api/v1/vitalia/fidelization/nps/summary` | inbox (tag detractor) |
| POST | `/api/v1/vitalia/fidelization/nps/submit` | (paciente external) |
| GET | `/api/v1/vitalia/fidelization/re-engagement/patterns` | marketing (lucas card source) |

### Producidos por Ola 2 — `/pipeline`

| Method | Path | Consumers |
|---|---|---|
| GET | `/api/v1/vitalia/pipeline/board` (6 stages) | (UI only — propio) |
| POST | `/api/v1/vitalia/pipeline/leads/{id}/move-stage` | inbox (kanban view inline) |

### Producidos por Ola 2 — `/marketing`

| Method | Path | Consumers |
|---|---|---|
| GET | `/api/v1/vitalia/marketing/bowtie` | (UI only — propio) |
| GET | `/api/v1/vitalia/marketing/attribution/reserva-stage` | pipeline (badge attribution insight) |
| GET | `/api/v1/vitalia/marketing/referrals/leaderboard` | fidelización (referral cards) |
| GET | `/api/v1/vitalia/marketing/recommendations/lucas` | pipeline, fidelización |

### Producidos por Ola 3 — `/agenda`

| Method | Path | Consumers |
|---|---|---|
| GET | `/api/v1/vitalia/agenda/appointments` (week+day views) | inbox (link a próximo turno), pipeline (badge depósito reserved) |
| POST | `/api/v1/vitalia/agenda/walk-in` | (UI only) |
| POST | `/api/v1/vitalia/agenda/phone-manual` | (UI only) |
| POST | `/api/v1/vitalia/agenda/cobranza` | (UI only) |
| POST | `/api/v1/vitalia/agenda/appointments/{id}/reschedule` | inbox (action receipt) |

## § 6 — Domain events compartidos (engine outbox bus)

| Event | Producer | Consumers |
|---|---|---|
| `LeadCreated` | inbox + marketing (Meta/Google sync) | pipeline (auto-add to "Interesado" stage), marketing (UTM tracking) |
| `LeadStageAdvanced` | pipeline | inbox (sticky activity stream), marketing (attribution update) |
| `ConversationStarted` | inbox | pipeline (signal flag), marketing (channel attribution) |
| `AppointmentBooked` | agenda | pipeline (auto move to "Reservado depósito"), inbox (action receipt + tool call response) |
| `PaymentDepositReceived` | side payment-adapter-mvp | pipeline (badge 30%), agenda (cobranza UI update) |
| `PaymentSaldoReceived` | side payment-adapter-mvp | agenda (cobranza UI update), fidelización (trigger follow-up) |
| `NpsScoreCollected` | fidelización | inbox (tag detractor), marketing (NPS distribution analytics) |
| `ReEngagementTriggered` | fidelización | inbox (proactive outbound) |
| `LucasRecommendationGenerated` | marketing (Lucas tools cron) | pipeline (cards top per stage), fidelización (re-engagement cards) |

Todos los eventos consumidos via `luana_core_events.outbox.adapter_bus` (post anti-default-flip-audit, `USE_OUTBOX_PATTERN_*=True` default since 2026-04-29).

## § 7 — BE modules compartidos (post lift core 2026-05-20)

| Module | Path | Producer | Consumers |
|---|---|---|---|
| `vitalia/backend/src/modules/vitalia/crm/` (extended) | crm engine + brand ext | Ola 1 inbox extends | pipeline + agenda |
| `vitalia/backend/src/modules/vitalia/payment/` | brand-local | side payment-adapter-mvp | pipeline + agenda + fidelización |
| `vitalia/backend/src/modules/vitalia/fiscal/` | brand-local NEW | side fiscal-emission-pe | agenda |
| `vitalia/backend/src/modules/vitalia/scheduling/` | engine + brand ext | Ola 3 agenda | inbox (booking link), pipeline (stage transition) |
| `vitalia/backend/src/modules/vitalia/marketing/` | brand-local NEW | Ola 2 marketing | pipeline (Lucas cards), fidelización (referral cards) |
| `vitalia/backend/src/modules/vitalia/fidelization/` | brand-local NEW | Ola 1 fidelización | inbox (NPS tag) |

Todos consumen post lift core:
- `from luana_core_platform.repositories.compound_scope_repository import CompoundScopeRepositoryBase` (reemplaza `vitalia._shared.repositories.phi_repository.PhiRepositoryBase`)
- `from luana_core_platform.workers.cron_envelope import cron_envelope` (reemplaza `vitalia._shared.workers.base.idempotent_cron`)

## § 8 — Reglas conflicto handler

Cuando 2 stories paralelas (misma ola) necesitan modificar el mismo file:

1. **First story to claim it** documenta su edit en su own checkpoint § Cross-story claims
2. **Second story** queda en hold para ese file hasta primera story merge done
3. **HANDOFF-cross-story.md update** (este archivo) cementa el claim history

Excepción: contratos en § 3-6 (tipos TS + schemas Zod + endpoints + events) — esos son aditivos, cada story añade su sección sin tocar las otras.

## § 9 — Verificación cross-story al merge

Cada story al cerrar `state: done` ejecuta:

```bash
# 1. Smoke E2E ruta propia
cd vitalia/frontend && E2E_BASE_URL=https://dev-app.vitalialat.com npx playwright test --grep "{story-id}"

# 2. Smoke E2E rutas dependientes (regression check)
# Si cerraste inbox → correr pipeline + agenda smoke también
cd vitalia/frontend && E2E_BASE_URL=https://dev-app.vitalialat.com npx playwright test --grep "vitalia-slice-1"

# 3. Cross-story contract tests
.venv/bin/pytest vitalia/backend/tests/integration/test_cross_story_contracts.py -v

# 4. Update HANDOFF-cross-story.md: marcar contratos producidos como "shipped"
```

## § 10 — Bitácora cross-story

- 2026-05-20: HANDOFF creado por /pm-vitalia post replan ratified Chris. 5 sub-stories Slice 1 + 2 side stories cadena de contratos cementados.
